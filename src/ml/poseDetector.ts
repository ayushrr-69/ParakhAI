/**
 * MoveNet Pose Detection for on-device inference
 * Uses TensorFlow.js with the MoveNet Lightning model
 */
import * as tf from '@tensorflow/tfjs';
import { initializeTensorFlow } from './tfInit';

// MoveNet keypoint indices
export const KEYPOINTS = {
  NOSE: 0,
  LEFT_EYE: 1,
  RIGHT_EYE: 2,
  LEFT_EAR: 3,
  RIGHT_EAR: 4,
  LEFT_SHOULDER: 5,
  RIGHT_SHOULDER: 6,
  LEFT_ELBOW: 7,
  RIGHT_ELBOW: 8,
  LEFT_WRIST: 9,
  RIGHT_WRIST: 10,
  LEFT_HIP: 11,
  RIGHT_HIP: 12,
  LEFT_KNEE: 13,
  RIGHT_KNEE: 14,
  LEFT_ANKLE: 15,
  RIGHT_ANKLE: 16,
} as const;

export interface Keypoint {
  x: number;
  y: number;
  score: number;
}

export interface PoseResult {
  keypoints: Keypoint[];
  score: number;
}

// Model URL for MoveNet Lightning (fastest, good accuracy)
const MOVENET_MODEL_URL = 'https://tfhub.dev/google/tfjs-model/movenet/singlepose/lightning/4';

let model: tf.GraphModel | null = null;
let isLoading = false;

/**
 * Load the MoveNet model
 */
export async function loadPoseModel(): Promise<void> {
  if (model) return;
  if (isLoading) {
    // Wait for existing load
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return;
  }
  
  isLoading = true;
  
  try {
    await initializeTensorFlow();
    
    console.log('[PoseDetector] Loading MoveNet model...');
    model = await tf.loadGraphModel(MOVENET_MODEL_URL, { fromTFHub: true });
    console.log('[PoseDetector] Model loaded successfully');
  } catch (error) {
    console.error('[PoseDetector] Failed to load model:', error);
    throw error;
  } finally {
    isLoading = false;
  }
}

/**
 * Detect pose from image data
 * @param imageData - Image data as Uint8Array (RGB format)
 * @param width - Image width
 * @param height - Image height
 * @returns Pose detection result
 */
export async function detectPose(
  imageData: Uint8Array,
  width: number,
  height: number
): Promise<PoseResult | null> {
  if (!model) {
    await loadPoseModel();
  }
  
  if (!model) {
    console.error('[PoseDetector] Model not loaded');
    return null;
  }
  
  try {
    // Create tensor from image data
    const imageTensor = tf.tensor3d(imageData, [height, width, 3], 'int32');
    
    // Resize to 192x192 (MoveNet input size)
    const resized = tf.image.resizeBilinear(imageTensor, [192, 192]);
    
    // Add batch dimension and cast to int32
    const batched = resized.expandDims(0).toInt();
    
    // Run inference
    const result = await model.predict(batched) as tf.Tensor;
    
    // Get keypoints [1, 1, 17, 3] -> [17, 3]
    const keypointsData = await result.data();
    
    // Clean up tensors
    imageTensor.dispose();
    resized.dispose();
    batched.dispose();
    result.dispose();
    
    // Parse keypoints (y, x, confidence format)
    const keypoints: Keypoint[] = [];
    let totalScore = 0;
    
    for (let i = 0; i < 17; i++) {
      const y = keypointsData[i * 3];
      const x = keypointsData[i * 3 + 1];
      const score = keypointsData[i * 3 + 2];
      
      keypoints.push({ x, y, score });
      totalScore += score;
    }
    
    return {
      keypoints,
      score: totalScore / 17,
    };
  } catch (error) {
    console.error('[PoseDetector] Detection error:', error);
    return null;
  }
}

/**
 * Calculate angle between three keypoints
 */
export function calculateAngle(
  keypoints: Keypoint[],
  p1Index: number,
  p2Index: number,
  p3Index: number,
  minConfidence: number = 0.3
): number | null {
  const p1 = keypoints[p1Index];
  const p2 = keypoints[p2Index];
  const p3 = keypoints[p3Index];
  
  // Check confidence
  if (p1.score < minConfidence || p2.score < minConfidence || p3.score < minConfidence) {
    return null;
  }
  
  // Calculate angle using atan2
  const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - 
                  Math.atan2(p1.y - p2.y, p1.x - p2.x);
  
  let angle = Math.abs(radians * 180 / Math.PI);
  
  if (angle > 180) {
    angle = 360 - angle;
  }
  
  return angle;
}

/**
 * Check if pose detector is ready
 */
export function isPoseModelLoaded(): boolean {
  return model !== null;
}
