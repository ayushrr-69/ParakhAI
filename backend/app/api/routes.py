"""
API route handlers.
"""
import uuid
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from ..core.config import settings
from ..ml.analyzer import get_analyzer, AnalysisResult
from ..ml.video_processor import VideoProcessor, save_uploaded_video, cleanup_temp_file


router = APIRouter(prefix="/api/v1", tags=["analysis"])


@router.post("/analyze/video")
async def analyze_video(
    video: UploadFile = File(...),
    exercise_type: str = Form("pushup"),
    user_id: Optional[str] = Form(None)
):
    """
    Analyze an exercise video for form and rep counting.
    
    Args:
        video: Uploaded video file
        exercise_type: Type of exercise ('pushup', 'bicep_curl', 'squat')
        user_id: Optional user identifier
        
    Returns:
        Analysis results including rep count, form score, and corrections
    """
    analysis_id = str(uuid.uuid4())
    temp_path = None
    
    print(f"\n{'='*60}")
    print(f"[Upload] New request - ID: {analysis_id}")
    print(f"[Upload] Exercise type: {exercise_type}")
    print(f"[Upload] Filename: {video.filename}")
    print(f"{'='*60}")
    
    try:
        # Read video content
        print("[Upload] Reading video content...")
        content = await video.read()
        content_size = len(content)
        print(f"[Upload] Received {content_size:,} bytes ({content_size / 1024 / 1024:.1f} MB)")
        
        if content_size < 1000:
            raise HTTPException(
                status_code=400,
                detail=f"Video file too small ({content_size} bytes). Upload may have failed."
            )
        
        # Save to temp file
        temp_path = save_uploaded_video(content, video.filename)
        print(f"[Upload] Saved to: {temp_path}")
        
        # Initialize video processor with frame resizing for performance
        processor = VideoProcessor(
            temp_path, 
            frame_skip=settings.FRAME_SKIP,
            max_dimension=settings.MAX_FRAME_DIMENSION
        )
        
        # Validate video
        is_valid, error_msg = processor.is_valid()
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)
        
        video_info = processor.info
        print(f"[Video] {video_info['frame_count']} frames, {video_info['fps']:.1f} fps, {video_info['width']}x{video_info['height']}")
        print(f"[Video] Processing at {settings.MAX_FRAME_DIMENSION}p, every {settings.FRAME_SKIP} frames")
        
        # Initialize analyzer
        analyzer = get_analyzer(exercise_type)
        analyzer.log(f"Processing video: {video_info['frame_count']} frames")
        
        # Process frames (with auto-resize)
        poses_detected = 0
        for frame_num, frame in processor.frames(resize=True):
            angle = analyzer.process_frame(frame)
            
            if angle is not None:
                analyzer.angles.append(angle)
                poses_detected += 1
                
                if frame_num <= 20 or frame_num % 30 == 0:
                    analyzer.log(f"Frame {frame_num}: angle={angle:.1f}°")
        
        analyzer.log(f"Processed frames, detected {poses_detected} poses")
        
        # Analyze and get results
        result = analyzer.analyze()
        
        print(f"[Result] Reps: {result.rep_count}, Score: {result.form_score}")
        
        return {
            "status": "success",
            "analysis_id": analysis_id,
            "exercise_type": exercise_type,
            "user_id": user_id,
            **result.to_dict(),
            "video_info": video_info,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    finally:
        cleanup_temp_file(temp_path)


@router.get("/exercises")
async def list_exercises():
    """List available exercises."""
    return {
        "exercises": [
            {"id": "pushup", "name": "Push-ups"},
            {"id": "squat", "name": "Squats"},
            {"id": "bicep_curl", "name": "Bicep Curls"},
        ]
    }
