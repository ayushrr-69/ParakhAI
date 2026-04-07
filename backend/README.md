# ParakhAI Backend

Exercise form analysis API using TensorFlow MoveNet pose detection.

## Features

- **Real-time pose detection** using Google's MoveNet model
- **Rep counting** with peak detection algorithm
- **Form scoring** based on range of motion
- **Support for 3 exercises**: Push-ups, Squats, Bicep Curls

## Quick Start

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server
python main.py
```

Server starts at `http://0.0.0.0:9000`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Server status |
| GET | `/health` | Health check |
| GET | `/docs` | Swagger UI docs |
| POST | `/api/v1/analyze/video` | Analyze exercise video |
| GET | `/api/v1/exercises` | List exercises |

## Analyze Video

```bash
curl -X POST "http://localhost:9000/api/v1/analyze/video" \
  -F "video=@exercise.mp4" \
  -F "exercise_type=pushup"
```

**Response:**
```json
{
  "status": "success",
  "metrics": {
    "rep_count": 10,
    "form_score": 85,
    "good_rep_count": 8,
    "bad_rep_count": 2,
    "bad_rep_numbers": [3, 7]
  },
  "corrections": ["Reps [3, 7] need more range of motion."]
}
```

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── routes.py      # API endpoints
│   ├── core/
│   │   └── config.py      # Configuration
│   └── ml/
│       ├── analyzer.py       # Exercise analyzers
│       ├── pose_detector.py  # MoveNet pose detection
│       └── video_processor.py  # Video utilities
├── main.py                # Entry point
└── requirements.txt
```

## Exercise Types

- `pushup` - Tracks elbow angle (shoulder-elbow-wrist)
- `bicep_curl` - Tracks elbow angle (shoulder-elbow-wrist)
- `squat` - Tracks knee angle (hip-knee-ankle)

## Configuration

Edit `app/core/config.py` to adjust:

- `PORT` - Server port (default: 9000)
- `FRAME_SKIP` - Process every Nth frame (default: 2)
- `MIN_CONFIDENCE` - Keypoint confidence threshold (default: 0.3)
- `GOOD_REP_THRESHOLD` - Score for "good" rep (default: 50)
