"""
Video processing utilities.
"""
import os
import tempfile
from typing import Generator, Tuple, Optional
import cv2
import numpy as np


class VideoProcessor:
    """
    Handles video file operations and frame extraction.
    Includes built-in frame resizing for efficient processing.
    """
    
    def __init__(self, video_path: str, frame_skip: int = 2, max_dimension: int = 480):
        """
        Initialize video processor.
        
        Args:
            video_path: Path to video file
            frame_skip: Process every Nth frame (default: 2)
            max_dimension: Maximum width/height for frame resizing (default: 480p)
        """
        self.video_path = video_path
        self.frame_skip = frame_skip
        self.max_dimension = max_dimension
        self._cap: Optional[cv2.VideoCapture] = None
        self._info: Optional[dict] = None
    
    @property
    def info(self) -> dict:
        """Get video information."""
        if self._info is None:
            cap = cv2.VideoCapture(self.video_path)
            self._info = {
                "fps": cap.get(cv2.CAP_PROP_FPS) or 30,
                "frame_count": int(cap.get(cv2.CAP_PROP_FRAME_COUNT)),
                "width": int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
                "height": int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
            }
            cap.release()
        return self._info
    
    def is_valid(self) -> Tuple[bool, str]:
        """
        Check if video is valid for processing.
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not os.path.exists(self.video_path):
            return False, "Video file not found"
        
        cap = cv2.VideoCapture(self.video_path)
        if not cap.isOpened():
            return False, "Could not open video file"
        
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        cap.release()
        
        if frame_count < 10:
            return False, "Video is too short (less than 10 frames)"
        
        return True, ""
    
    def _resize_frame(self, frame: np.ndarray) -> np.ndarray:
        """
        Resize frame while maintaining aspect ratio.
        
        Args:
            frame: Original frame
            
        Returns:
            Resized frame with max dimension = self.max_dimension
        """
        h, w = frame.shape[:2]
        
        # Don't upscale small frames
        if max(h, w) <= self.max_dimension:
            return frame
        
        # Calculate new dimensions maintaining aspect ratio
        if w > h:
            new_w = self.max_dimension
            new_h = int(h * (self.max_dimension / w))
        else:
            new_h = self.max_dimension
            new_w = int(w * (self.max_dimension / h))
        
        # Resize using INTER_AREA for downscaling (best quality)
        return cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_AREA)
    
    def frames(self, resize: bool = True) -> Generator[Tuple[int, np.ndarray], None, None]:
        """
        Yield frames from the video.
        
        Args:
            resize: Whether to resize frames (default: True)
        
        Yields:
            Tuple of (frame_number, frame_array)
        """
        cap = cv2.VideoCapture(self.video_path)
        
        if not cap.isOpened():
            return
        
        frame_num = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_num += 1
            
            # Skip frames according to frame_skip setting
            if frame_num % self.frame_skip != 0:
                continue
            
            # Resize frame for faster processing
            if resize:
                frame = self._resize_frame(frame)
            
            yield frame_num, frame
        
        cap.release()


def save_uploaded_video(content: bytes, filename: str = None) -> str:
    """
    Save uploaded video content to a temporary file.
    
    Args:
        content: Video file content as bytes
        filename: Original filename (for extension detection)
        
    Returns:
        Path to saved temporary file
    """
    # Determine file extension
    suffix = ".mp4"
    if filename:
        for ext in [".mov", ".avi", ".webm"]:
            if filename.lower().endswith(ext):
                suffix = ext
                break
    
    # Create temp file
    fd, temp_path = tempfile.mkstemp(suffix=suffix)
    
    # Write content
    os.write(fd, content)
    os.close(fd)
    
    return temp_path


def cleanup_temp_file(path: str):
    """Safely delete a temporary file."""
    try:
        if path and os.path.exists(path):
            os.unlink(path)
    except Exception:
        pass
