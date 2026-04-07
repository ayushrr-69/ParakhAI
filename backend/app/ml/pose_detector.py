"""
Pose detection using TensorFlow MoveNet.
"""
import os
import math
from typing import Optional, List, Tuple, Dict, Any

# Suppress TensorFlow logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

import numpy as np


class PoseDetector:
    """
    Pose detection using Google's MoveNet model via TensorFlow Hub.
    
    MoveNet Keypoint Indices:
        0: nose
        1: left_eye
        2: right_eye
        3: left_ear
        4: right_ear
        5: left_shoulder
        6: right_shoulder
        7: left_elbow
        8: right_elbow
        9: left_wrist
        10: right_wrist
        11: left_hip
        12: right_hip
        13: left_knee
        14: right_knee
        15: left_ankle
        16: right_ankle
    """
    
    # Keypoint indices for reference
    NOSE = 0
    LEFT_EYE, RIGHT_EYE = 1, 2
    LEFT_EAR, RIGHT_EAR = 3, 4
    LEFT_SHOULDER, RIGHT_SHOULDER = 5, 6
    LEFT_ELBOW, RIGHT_ELBOW = 7, 8
    LEFT_WRIST, RIGHT_WRIST = 9, 10
    LEFT_HIP, RIGHT_HIP = 11, 12
    LEFT_KNEE, RIGHT_KNEE = 13, 14
    LEFT_ANKLE, RIGHT_ANKLE = 15, 16
    
    def __init__(self, model_url: str = None, min_confidence: float = 0.3):
        """
        Initialize the pose detector.
        
        Args:
            model_url: TensorFlow Hub URL for MoveNet model
            min_confidence: Minimum keypoint confidence threshold
        """
        self.model_url = model_url or "https://tfhub.dev/google/movenet/singlepose/lightning/4"
        self.min_confidence = min_confidence
        self._model = None
        self._tf = None
    
    def _load_model(self):
        """Lazy load the TensorFlow model."""
        if self._model is None:
            import tensorflow as tf
            import tensorflow_hub as hub
            
            self._tf = tf
            print(f"[PoseDetector] Loading MoveNet from TensorFlow Hub...")
            model = hub.load(self.model_url)
            self._model = model.signatures['serving_default']
            print(f"[PoseDetector] Model loaded successfully!")
    
    def detect(self, frame: np.ndarray) -> Optional[np.ndarray]:
        """
        Detect pose in a single frame.
        
        Args:
            frame: BGR image as numpy array
            
        Returns:
            Keypoints array of shape [17, 3] where each row is [y, x, confidence]
            Returns None if pose detection fails or confidence is too low.
        """
        import cv2
        
        self._load_model()
        
        # Convert BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Resize to 192x192 (MoveNet input size)
        resized = cv2.resize(rgb_frame, (192, 192))
        
        # Prepare input tensor
        input_tensor = self._tf.cast(resized, dtype=self._tf.int32)
        input_tensor = self._tf.expand_dims(input_tensor, axis=0)
        
        # Run inference
        outputs = self._model(input_tensor)
        keypoints = outputs['output_0'].numpy()[0][0]  # Shape: [17, 3]
        
        # Check if enough keypoints are confident
        confident_count = sum(1 for kp in keypoints if kp[2] > self.min_confidence)
        
        if confident_count < 5:
            return None
        
        return keypoints
    
    @staticmethod
    def calculate_angle(keypoints: np.ndarray, p1: int, p2: int, p3: int, 
                       min_confidence: float = 0.3) -> Optional[float]:
        """
        Calculate the angle at point p2, formed by points p1-p2-p3.
        
        Args:
            keypoints: Array of shape [17, 3] with [y, x, confidence]
            p1, p2, p3: Keypoint indices
            min_confidence: Minimum confidence for all three points
            
        Returns:
            Angle in degrees, or None if confidence is too low.
        """
        a = keypoints[p1]
        b = keypoints[p2]
        c = keypoints[p3]
        
        # Check confidence
        if min(a[2], b[2], c[2]) < min_confidence:
            return None
        
        # Calculate angle using atan2
        # Note: MoveNet outputs [y, x, conf], so index 0 is y, index 1 is x
        radians = math.atan2(c[0] - b[0], c[1] - b[1]) - \
                  math.atan2(a[0] - b[0], a[1] - b[1])
        
        angle = abs(math.degrees(radians))
        
        if angle > 180:
            angle = 360 - angle
        
        return angle


# Singleton instance
_detector: Optional[PoseDetector] = None


def get_pose_detector() -> PoseDetector:
    """Get the global pose detector instance."""
    global _detector
    if _detector is None:
        _detector = PoseDetector()
    return _detector
