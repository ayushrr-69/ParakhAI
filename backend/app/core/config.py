"""
Application configuration settings.
"""
import os
from dataclasses import dataclass


@dataclass
class Settings:
    """Application settings."""
    
    # Server - use environment variables for deployment
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "9000"))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # Video processing
    MAX_VIDEO_SIZE_MB: int = 100
    SUPPORTED_FORMATS: tuple = (".mp4", ".mov", ".avi", ".webm")
    FRAME_SKIP: int = 2  # Process every Nth frame
    MAX_FRAME_DIMENSION: int = 480  # Resize frames to max 480p for faster processing
    
    # Pose detection
    MODEL_URL: str = "https://tfhub.dev/google/movenet/singlepose/lightning/4"
    MIN_CONFIDENCE: float = 0.3
    MIN_KEYPOINTS: int = 5
    
    # Rep counting thresholds
    REP_START_THRESHOLD: float = 20.0  # % movement to start counting rep
    REP_END_THRESHOLD: float = 15.0    # % movement to end rep
    MIN_ANGLE_RANGE: float = 20.0      # Minimum angle change to count as movement
    
    # Scoring
    GOOD_REP_THRESHOLD: int = 50       # Score >= this is a "good" rep
    
    @property
    def max_video_size_bytes(self) -> int:
        return self.MAX_VIDEO_SIZE_MB * 1024 * 1024


# Global settings instance
settings = Settings()
