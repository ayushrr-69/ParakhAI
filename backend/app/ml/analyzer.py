"""
Exercise analyzers for different exercise types.
"""
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
import numpy as np

from .pose_detector import PoseDetector, get_pose_detector


@dataclass
class RepResult:
    """Result of a single rep."""
    rep_number: int
    max_percentage: float
    range_of_motion: float
    score: int
    is_good: bool


@dataclass
class AnalysisResult:
    """Complete analysis result for a video."""
    rep_count: int = 0
    form_score: int = 0
    good_rep_count: int = 0
    bad_rep_count: int = 0
    bad_rep_numbers: List[int] = field(default_factory=list)
    rep_scores: List[int] = field(default_factory=list)
    corrections: List[str] = field(default_factory=list)
    debug_steps: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON response."""
        return {
            "metrics": {
                "rep_count": self.rep_count,
                "form_score": self.form_score,
                "good_rep_count": self.good_rep_count,
                "bad_rep_count": self.bad_rep_count,
                "bad_rep_numbers": self.bad_rep_numbers,
                "rep_scores": self.rep_scores,
            },
            "corrections": self.corrections,
            "debug_steps": self.debug_steps,
        }


class ExerciseAnalyzer:
    """
    Base class for exercise analysis.
    
    Subclasses define which joints to track for each exercise type.
    """
    
    # Joint triplets for angle calculation: (point1, center, point2)
    # Override in subclasses
    JOINT_TRIPLETS: List[tuple] = []
    ANGLE_NAME: str = "angle"
    
    # Thresholds
    REP_START_THRESHOLD = 20.0  # % movement to start counting rep
    REP_END_THRESHOLD = 15.0    # % movement to end rep
    MIN_ANGLE_RANGE = 20.0      # Minimum angle change for valid movement
    GOOD_REP_THRESHOLD = 50     # Score threshold for "good" rep
    
    def __init__(self):
        self.detector = get_pose_detector()
        self.angles: List[float] = []
        self.debug_log: List[str] = []
    
    def log(self, message: str):
        """Add debug log message."""
        print(f"[Analyzer] {message}")
        self.debug_log.append(message)
    
    def process_frame(self, frame: np.ndarray) -> Optional[float]:
        """
        Process a single frame and extract the relevant angle.
        
        Args:
            frame: BGR image array
            
        Returns:
            Angle in degrees, or None if pose not detected
        """
        keypoints = self.detector.detect(frame)
        
        if keypoints is None:
            return None
        
        # Try each joint triplet until we get a valid angle
        for p1, p2, p3 in self.JOINT_TRIPLETS:
            angle = PoseDetector.calculate_angle(keypoints, p1, p2, p3)
            if angle is not None:
                return angle
        
        return None
    
    def count_reps(self) -> List[RepResult]:
        """
        Count reps from collected angle data using peak detection.
        
        Returns:
            List of RepResult objects
        """
        if len(self.angles) < 5:
            return []
        
        # Smooth angles with moving average
        window = 3
        smoothed = []
        for i in range(len(self.angles)):
            start = max(0, i - window)
            end = min(len(self.angles), i + window + 1)
            smoothed.append(np.mean(self.angles[start:end]))
        
        # Find angle range
        min_angle = min(smoothed)
        max_angle = max(smoothed)
        angle_range = max_angle - min_angle
        
        self.log(f"Angle range: {min_angle:.1f}° - {max_angle:.1f}° (range: {angle_range:.1f}°)")
        
        if angle_range < self.MIN_ANGLE_RANGE:
            return []
        
        # Convert to percentages (0% = extended, 100% = contracted)
        percentages = []
        for angle in smoothed:
            pct = (max_angle - angle) / angle_range * 100
            percentages.append(max(0, min(100, pct)))
        
        # Count reps using peak detection
        reps = []
        in_rep = False
        rep_start_pct = 0
        rep_max_pct = 0
        
        for pct in percentages:
            if not in_rep and pct > self.REP_START_THRESHOLD:
                in_rep = True
                rep_start_pct = pct
                rep_max_pct = pct
            elif in_rep:
                rep_max_pct = max(rep_max_pct, pct)
                if pct < self.REP_END_THRESHOLD:
                    # Rep completed
                    rom = rep_max_pct - rep_start_pct
                    reps.append((rep_max_pct, rom))
                    in_rep = False
        
        # Handle incomplete rep at end
        if in_rep and rep_max_pct > 30:
            reps.append((rep_max_pct, rep_max_pct - rep_start_pct))
        
        # Score each rep
        results = []
        for i, (max_pct, rom) in enumerate(reps):
            rom_score = min(50, rom * 0.7)
            peak_score = min(50, max_pct * 0.6)
            score = int(max(10, min(100, rom_score + peak_score)))
            
            is_good = score >= self.GOOD_REP_THRESHOLD
            
            results.append(RepResult(
                rep_number=i + 1,
                max_percentage=max_pct,
                range_of_motion=rom,
                score=score,
                is_good=is_good
            ))
            
            self.log(f"Rep {i+1}: max={max_pct:.0f}%, ROM={rom:.0f}%, score={score}, good={is_good}")
        
        return results
    
    def generate_corrections(self, reps: List[RepResult], form_score: int) -> List[str]:
        """Generate feedback corrections based on analysis."""
        corrections = []
        
        bad_reps = [r.rep_number for r in reps if not r.is_good]
        if bad_reps:
            corrections.append(f"Reps {bad_reps} need more range of motion.")
        
        if form_score < 50:
            corrections.append("Focus on full range of motion for better form.")
        elif form_score < 70:
            corrections.append("Good effort! Try to go deeper for better results.")
        
        if not corrections:
            corrections.append("Great form! Keep up the good work.")
        
        return corrections
    
    def analyze(self) -> AnalysisResult:
        """
        Analyze collected angles and generate final result.
        
        Call this after processing all frames.
        """
        result = AnalysisResult(debug_steps=self.debug_log.copy())
        
        self.log(f"Collected {len(self.angles)} angle measurements")
        
        if len(self.angles) < 5:
            result.corrections.append(
                f"Not enough {self.ANGLE_NAME} angles detected. "
                "Ensure your body is clearly visible."
            )
            return result
        
        # Count reps
        reps = self.count_reps()
        self.log(f"Detected {len(reps)} reps")
        
        if not reps:
            result.corrections.append(
                f"Movement range too small. Make bigger movements."
            )
            return result
        
        # Calculate metrics
        result.rep_count = len(reps)
        result.rep_scores = [r.score for r in reps]
        result.form_score = int(np.mean(result.rep_scores))
        result.good_rep_count = sum(1 for r in reps if r.is_good)
        result.bad_rep_count = sum(1 for r in reps if not r.is_good)
        result.bad_rep_numbers = [r.rep_number for r in reps if not r.is_good]
        
        # Generate corrections
        result.corrections = self.generate_corrections(reps, result.form_score)
        result.debug_steps = self.debug_log
        
        self.log(f"Analysis complete: {result.rep_count} reps, avg score {result.form_score}")
        
        return result
    
    def reset(self):
        """Reset analyzer for new video."""
        self.angles = []
        self.debug_log = []


class PushupAnalyzer(ExerciseAnalyzer):
    """Analyzer for push-up exercises."""
    
    # Track elbow angle: shoulder -> elbow -> wrist
    JOINT_TRIPLETS = [
        (PoseDetector.LEFT_SHOULDER, PoseDetector.LEFT_ELBOW, PoseDetector.LEFT_WRIST),
        (PoseDetector.RIGHT_SHOULDER, PoseDetector.RIGHT_ELBOW, PoseDetector.RIGHT_WRIST),
    ]
    ANGLE_NAME = "elbow"


class BicepCurlAnalyzer(ExerciseAnalyzer):
    """Analyzer for bicep curl exercises."""
    
    # Track elbow angle: shoulder -> elbow -> wrist
    JOINT_TRIPLETS = [
        (PoseDetector.LEFT_SHOULDER, PoseDetector.LEFT_ELBOW, PoseDetector.LEFT_WRIST),
        (PoseDetector.RIGHT_SHOULDER, PoseDetector.RIGHT_ELBOW, PoseDetector.RIGHT_WRIST),
    ]
    ANGLE_NAME = "elbow"


class SquatAnalyzer(ExerciseAnalyzer):
    """Analyzer for squat exercises."""
    
    # Track knee angle: hip -> knee -> ankle
    JOINT_TRIPLETS = [
        (PoseDetector.LEFT_HIP, PoseDetector.LEFT_KNEE, PoseDetector.LEFT_ANKLE),
        (PoseDetector.RIGHT_HIP, PoseDetector.RIGHT_KNEE, PoseDetector.RIGHT_ANKLE),
    ]
    ANGLE_NAME = "knee"


def get_analyzer(exercise_type: str) -> ExerciseAnalyzer:
    """
    Get the appropriate analyzer for an exercise type.
    
    Args:
        exercise_type: One of 'pushup', 'bicep_curl', 'squat'
        
    Returns:
        ExerciseAnalyzer instance
    """
    analyzers = {
        "pushup": PushupAnalyzer,
        "bicep_curl": BicepCurlAnalyzer,
        "squat": SquatAnalyzer,
    }
    
    analyzer_class = analyzers.get(exercise_type, PushupAnalyzer)
    return analyzer_class()
