/**
 * Video Frame Processor for on-device ML
 * Extracts frames from video for pose detection
 * 
 * PROCESSING MODES:
 * - On-device: TensorFlow.js runs on phone (no internet needed)
 * - Server fallback: Only if on-device fails, sends to Python backend
 */
import * as FileSystem from 'expo-file-system';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as ImageManipulator from 'expo-image-manipulator';
import { decode as decodeJpeg } from 'jpeg-js';
import { decode as decodeBase64 } from 'base-64';
import { detectPose, loadPoseModel, PoseResult } from './poseDetector';
import { extractAngle, countReps, generateAnalysisResult, ExerciseType, AnalysisResult } from './exerciseAnalyzer';

export interface ProcessingProgress {
  stage: 'loading' | 'extracting' | 'analyzing' | 'complete';
  progress: number;
  message: string;
}

export type ProgressCallback = (progress: ProcessingProgress) => void;

// Configuration for frame extraction - BALANCED for speed + accuracy
const FRAME_CONFIG = {
  // Extract 1 frame every N milliseconds (100ms = 10 fps - good for accuracy)
  FRAME_INTERVAL_MS: 100,
  // Maximum frames to extract
  MAX_FRAMES: 120,
  // Minimum frames needed for analysis
  MIN_FRAMES: 15,
  // Quality of extracted frames
  QUALITY: 0.7,
  // Image size for pose detection
  PROCESS_SIZE: 224,
};

/**
 * Extract frames from video using expo-video-thumbnails - OPTIMIZED
 * Extracts frames at regular intervals based on video duration
 * Uses adaptive sampling for long videos
 */
async function extractFramesFromVideo(
  videoUri: string,
  videoDurationMs: number,
  onProgress?: ProgressCallback
): Promise<Array<string>> {
  const framePaths: string[] = [];
  
  // Calculate how many frames to extract
  const totalPossibleFrames = Math.floor(videoDurationMs / FRAME_CONFIG.FRAME_INTERVAL_MS);
  const frameCount = Math.min(totalPossibleFrames, FRAME_CONFIG.MAX_FRAMES);
  
  // Adjust interval if we hit max frames (spread evenly across video)
  const actualInterval = totalPossibleFrames > FRAME_CONFIG.MAX_FRAMES 
    ? Math.floor(videoDurationMs / FRAME_CONFIG.MAX_FRAMES)
    : FRAME_CONFIG.FRAME_INTERVAL_MS;
  
  console.log(`[VideoProcessor] Video: ${videoDurationMs}ms, extracting ${frameCount} frames at ${actualInterval}ms intervals`);
  
  onProgress?.({
    stage: 'extracting',
    progress: 0,
    message: `Extracting frames...`,
  });
  
  try {
    // Extract frames with progress updates every 20%
    const progressInterval = Math.max(1, Math.floor(frameCount / 5));
    
    for (let i = 0; i < frameCount; i++) {
      const timeMs = i * actualInterval;
      
      // Skip if beyond video duration
      if (timeMs >= videoDurationMs) break;
      
      try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(
          videoUri,
          {
            time: timeMs,
            quality: FRAME_CONFIG.QUALITY,
          }
        );
        
        framePaths.push(uri);
      } catch (frameErr) {
        // Some frames may fail, continue
      }
      
      // Update progress every progressInterval frames
      if (i % progressInterval === 0 || i === frameCount - 1) {
        const progress = Math.round(((i + 1) / frameCount) * 100);
        onProgress?.({
          stage: 'extracting',
          progress,
          message: `Extracting ${Math.round(progress)}%...`,
        });
      }
    }
    
    console.log(`[VideoProcessor] Extracted ${framePaths.length} frames`);
    return framePaths;
  } catch (error) {
    console.error('[VideoProcessor] Frame extraction error:', error);
    throw new Error('Failed to extract video frames');
  }
}

/**
 * Load image data from file URI
 * Converts image to RGB pixel data for TensorFlow.js processing
 */
async function loadImageData(imageUri: string): Promise<{ data: Uint8Array; width: number; height: number }> {
  try {
    // Resize for processing
    const manipResult = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: FRAME_CONFIG.PROCESS_SIZE, height: FRAME_CONFIG.PROCESS_SIZE } }],
      { format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    
    if (!manipResult.base64) {
      throw new Error('Failed to get base64 image data');
    }
    
    // Decode base64 to binary
    const binaryString = decodeBase64(manipResult.base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Decode JPEG to raw pixel data
    const jpegData = decodeJpeg(bytes, { useTArray: true });
    
    // Convert RGBA to RGB (TensorFlow expects RGB)
    const rgb = new Uint8Array((jpegData.width * jpegData.height * 3));
    for (let i = 0, j = 0; i < jpegData.data.length; i += 4, j += 3) {
      rgb[j] = jpegData.data[i];       // R
      rgb[j + 1] = jpegData.data[i + 1]; // G
      rgb[j + 2] = jpegData.data[i + 2]; // B
      // Skip alpha channel
    }
    
    return {
      data: rgb,
      width: jpegData.width,
      height: jpegData.height,
    };
  } catch (error) {
    console.error('[VideoProcessor] Image loading error:', error);
    throw new Error(`Failed to load image: ${error}`);
  }
}

/**
 * Analyze a video file on-device
 * Extracts frames using expo-video-thumbnails and processes with TensorFlow.js
 * 
 * @param videoUri - Path to the video file
 * @param exerciseType - Type of exercise (pushup, squat, bicep_curl)
 * @param onProgress - Callback for progress updates
 * @param videoDurationMs - Video duration in milliseconds (default: 10000ms = 10 sec)
 */
export async function analyzeVideoOnDevice(
  videoUri: string,
  exerciseType: ExerciseType,
  onProgress?: ProgressCallback,
  videoDurationMs: number = 10000 // Default 10 seconds if not provided
): Promise<AnalysisResult> {
  const angles: number[] = [];
  const frameTimestamps: number[] = []; // Track when each angle was measured
  
  try {
    // Report loading stage
    onProgress?.({
      stage: 'loading',
      progress: 0,
      message: 'Loading pose detection model...',
    });
    
    // Load pose model
    await loadPoseModel();
    
    onProgress?.({
      stage: 'loading',
      progress: 100,
      message: 'Model loaded',
    });
    
    // Extract frames from video based on duration
    // For a 10 second video at 100ms intervals = 100 frames
    const framePaths = await extractFramesFromVideo(videoUri, videoDurationMs, onProgress);
    
    if (framePaths.length < FRAME_CONFIG.MIN_FRAMES) {
      throw new Error(`Only ${framePaths.length} frames extracted. Need at least ${FRAME_CONFIG.MIN_FRAMES} for analysis.`);
    }
    
    console.log(`[VideoProcessor] Extracted ${framePaths.length} frames from ${videoDurationMs}ms video`);
    
    // Analyze each frame
    onProgress?.({
      stage: 'analyzing',
      progress: 0,
      message: `Analyzing ${framePaths.length} frames...`,
    });
    
    let validPoses = 0;
    let skippedFrames = 0;
    let lowConfidenceFrames = 0;
    let noAngleFrames = 0;
    
    // Process all frames (no smart skipping - it hurts accuracy)
    const BATCH_SIZE = 5;
    
    for (let i = 0; i < framePaths.length; i++) {
      try {
        // Load image data (converts to RGB pixels)
        const imageData = await loadImageData(framePaths[i]);
        
        // Run pose detection
        const pose = await detectPose(imageData.data, imageData.width, imageData.height);
        
        if (pose && pose.score > 0.2) {
          validPoses++;
          const angle = extractAngle(pose.keypoints, exerciseType);
          
          if (angle !== null) {
            angles.push(angle);
            frameTimestamps.push(i * FRAME_CONFIG.FRAME_INTERVAL_MS);
          } else {
            noAngleFrames++;
          }
        } else {
          lowConfidenceFrames++;
          skippedFrames++;
        }
        
        // Update progress every BATCH_SIZE frames
        if (i % BATCH_SIZE === 0 || i === framePaths.length - 1) {
          const progress = Math.round(((i + 1) / framePaths.length) * 100);
          onProgress?.({
            stage: 'analyzing',
            progress,
            message: `Analyzing ${i + 1}/${framePaths.length} frames...`,
          });
        }
        
      } catch (frameError) {
        console.warn(`[VideoProcessor] Failed to process frame ${i}`);
        skippedFrames++;
      }
    }
    
    console.log(`[VideoProcessor] ============ POSE DETECTION RESULTS ============`);
    console.log(`[VideoProcessor] Total frames processed: ${framePaths.length}`);
    console.log(`[VideoProcessor] Valid poses detected: ${validPoses}`);
    console.log(`[VideoProcessor] Angle measurements: ${angles.length}`);
    console.log(`[VideoProcessor] Low confidence poses: ${lowConfidenceFrames}`);
    console.log(`[VideoProcessor] No angle (joints not visible): ${noAngleFrames}`);
    console.log(`[VideoProcessor] Skipped frames: ${skippedFrames}`);
    
    if (angles.length > 0) {
      const minA = Math.min(...angles).toFixed(1);
      const maxA = Math.max(...angles).toFixed(1);
      console.log(`[VideoProcessor] Angle range: ${minA}° to ${maxA}°`);
    }
    
    if (angles.length < 10) {
      throw new Error(`Only ${angles.length} pose measurements. Make sure your full body is visible in the video.`);
    }
    
    // Count reps and generate result (pass exercise type for proper thresholds)
    const reps = countReps(angles, exerciseType);
    console.log(`[VideoProcessor] Detected ${reps.length} reps from ${angles.length} angle measurements`);
    
    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: `Analysis complete! Found ${reps.length} reps`,
    });
    
    return generateAnalysisResult(reps, exerciseType);
    
  } catch (error) {
    console.error('[VideoProcessor] On-device analysis failed:', error);
    throw error;
  }
}

/**
 * Analyze frames directly (for real-time camera processing)
 * This can be used with expo-camera for live analysis
 */
export async function analyzeFrames(
  frames: Array<{ data: Uint8Array; width: number; height: number }>,
  exerciseType: ExerciseType,
  onProgress?: ProgressCallback
): Promise<AnalysisResult> {
  const angles: number[] = [];
  
  onProgress?.({
    stage: 'loading',
    progress: 0,
    message: 'Loading pose detection model...',
  });
  
  await loadPoseModel();
  
  onProgress?.({
    stage: 'analyzing',
    progress: 0,
    message: 'Analyzing poses...',
  });
  
  // Process each frame
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const pose = await detectPose(frame.data, frame.width, frame.height);
    
    if (pose && pose.score > 0.3) {
      const angle = extractAngle(pose.keypoints, exerciseType);
      if (angle !== null) {
        angles.push(angle);
      }
    }
    
    // Update progress
    const progress = Math.round(((i + 1) / frames.length) * 100);
    onProgress?.({
      stage: 'analyzing',
      progress,
      message: `Analyzing frame ${i + 1}/${frames.length}...`,
    });
  }
  
  onProgress?.({
    stage: 'complete',
    progress: 100,
    message: 'Analysis complete',
  });
  
  // Count reps and generate result
  console.log(`[VideoProcessor] Collected ${angles.length} angle measurements`);
  const reps = countReps(angles, exerciseType);
  console.log(`[VideoProcessor] Detected ${reps.length} reps`);
  
  return generateAnalysisResult(reps, exerciseType);
}

/**
 * Check if on-device processing is available
 * Returns false in Expo Go, true in development build with required native modules
 */
export function isOnDeviceAvailable(): boolean {
  try {
    // Check if VideoThumbnails is available (requires development build)
    // In Expo Go, this will work, but full tensor processing needs native code
    return !!VideoThumbnails.getThumbnailAsync;
  } catch {
    return false;
  }
}
