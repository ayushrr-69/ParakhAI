/**
 * ML Module Index
 * Exports all ML-related functions for on-device processing
 */

export { initializeTensorFlow, isTensorFlowReady } from './tfInit';
export { 
  loadPoseModel, 
  detectPose, 
  calculateAngle,
  isPoseModelLoaded,
  KEYPOINTS,
  type Keypoint,
  type PoseResult,
} from './poseDetector';
export {
  extractAngle,
  countReps,
  generateAnalysisResult,
  type ExerciseType,
  type RepResult,
  type AnalysisResult,
} from './exerciseAnalyzer';
export {
  analyzeVideoOnDevice,
  analyzeFrames,
  isOnDeviceAvailable,
  type ProcessingProgress,
  type ProgressCallback,
} from './videoProcessor';
