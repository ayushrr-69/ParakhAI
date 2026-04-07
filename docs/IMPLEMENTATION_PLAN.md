# ParakhAI - Implementation Plan
## Sports Performance Tracking with AI-Powered Form Analysis

---

## 📋 Project Overview

**ParakhAI** is a mobile application for athletes and coaches to track sports performance using AI-powered exercise form analysis. The app uses OpenCV and MediaPipe to analyze exercise videos, provide real-time feedback, count repetitions, and score form quality.

### Key Features
- 🎥 Video-based exercise analysis (pushups, squats, jumping jacks)
- 📊 Form scoring (0-100) with specific corrections
- 🔢 Automatic rep counting with failure detection
- 👤 Face verification for anti-cheat
- 👨‍🏫 Coach-athlete sharing and feedback system
- 📈 Progress tracking and historical analysis

### Technology Stack
| Layer | Technology |
|-------|------------|
| **Frontend** | React Native + Expo + TypeScript |
| **Backend** | Python FastAPI |
| **ML/AI** | OpenCV + MediaPipe |
| **Database** | PostgreSQL |
| **Auth** | Firebase Authentication + JWT |
| **Storage** | Local + Cloud (AWS S3) |
| **Notifications** | Firebase Cloud Messaging (FCM) |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    MOBILE APPLICATION                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ UI Layer │  │ ViewModel│  │API Client│  │Repository│        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTPS REST API
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FASTAPI BACKEND                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Auth Service │  │ ML Service   │  │ Storage Svc  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└──────┬──────────────────┬──────────────────┬────────────────────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │ ML Models    │  │  AWS S3      │
│  Database    │  │ OpenCV/MP    │  │  Storage     │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## 🎯 User Roles & Flows

### Athlete Flow
1. **Register/Login** → Firebase Auth
2. **Record Video** → Camera or gallery upload
3. **Face Verification** → Anti-cheat check
4. **Local Analysis** → ML model processes video
5. **View Results** → Form score, rep count, corrections
6. **Share with Coach** → Optional submission
7. **Track Progress** → Historical data & trends

### Coach Flow
1. **Register/Login** → Firebase Auth (coach role)
2. **View Dashboard** → List of athletes
3. **Review Submissions** → Videos shared by athletes
4. **Provide Feedback** → Comments and recommendations
5. **Track Athletes** → Performance trends over time
6. **AI Recommendations** → System-generated insights

---

## 📅 3-4 Day Sprint Schedule

### Day 1: Backend Foundation (4-5 hours)
**Goal**: FastAPI server with ML model integration

| Task | Duration | Priority |
|------|----------|----------|
| Create FastAPI project structure | 30 min | P0 |
| Setup CORS and health endpoint | 30 min | P0 |
| Wrap OpenCV/MediaPipe ML model | 2 hrs | P0 |
| Create `/analyze/video` endpoint | 1 hr | P0 |
| Test with sample video | 30 min | P0 |

**Deliverable**: Working API that accepts video and returns analysis JSON

### Day 2: Frontend Video Capture (4-5 hours)
**Goal**: React Native video upload screen

| Task | Duration | Priority |
|------|----------|----------|
| Create VideoUploadScreen.tsx | 1 hr | P0 |
| Add expo-camera integration | 1 hr | P0 |
| Add expo-image-picker for gallery | 30 min | P0 |
| Upload progress UI | 30 min | P0 |
| Connect to backend API | 1 hr | P0 |
| Error handling & validation | 30 min | P0 |

**Deliverable**: App screen to record/select and upload videos

### Day 3: Results Display & Integration (4-5 hours)
**Goal**: Display ML analysis results

| Task | Duration | Priority |
|------|----------|----------|
| Create AnalysisResultsScreen.tsx | 1.5 hrs | P0 |
| Form score visualization | 1 hr | P0 |
| Corrections cards UI | 1 hr | P0 |
| Navigation flow (Home→Upload→Results) | 30 min | P0 |
| AsyncStorage for offline results | 30 min | P0 |

**Deliverable**: Complete user flow from upload to results

### Day 4: Polish & Testing (2-3 hours)
**Goal**: Production-ready integration

| Task | Duration | Priority |
|------|----------|----------|
| Add loading animations | 30 min | P1 |
| Improve error messages | 30 min | P1 |
| Video compression before upload | 30 min | P1 |
| End-to-end testing | 1 hr | P0 |
| Bug fixes and refinements | 30 min | P0 |

**Deliverable**: Polished, working MVP

---

## 🔌 API Endpoints

### Core Endpoints

#### `POST /api/v1/analyze/video`
Upload and analyze exercise video
```json
// Request: multipart/form-data
{
  "video": "<file>",
  "exercise_type": "pushup" | "squat" | "jumping_jack",
  "user_id": "string"
}

// Response
{
  "status": "success",
  "analysis_id": "uuid",
  "exercise_type": "pushup",
  "metrics": {
    "form_score": 85,
    "rep_count": 15,
    "failed_reps": 2,
    "depth_consistency": 92,
    "joint_angles": {
      "elbow_avg": 90,
      "shoulder_avg": 45
    }
  },
  "corrections": [
    "Keep your back straighter during descent",
    "Lower your chest closer to the ground"
  ],
  "timestamp": "2026-04-05T12:00:00Z"
}
```

#### `GET /api/v1/health`
Health check endpoint
```json
{
  "status": "healthy",
  "ml_model_loaded": true,
  "version": "1.0.0"
}
```

#### `GET /api/v1/results/{analysis_id}`
Retrieve stored analysis result

#### `GET /api/v1/user/{user_id}/history`
Get user's analysis history

#### `POST /api/v1/share`
Share analysis with coach

---

## 📁 Project Structure

### Backend (Python FastAPI)
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry
│   ├── config.py            # Environment config
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes/
│   │   │   ├── analyze.py   # /analyze endpoints
│   │   │   ├── auth.py      # Auth endpoints
│   │   │   └── results.py   # Results endpoints
│   │   └── deps.py          # Dependencies
│   ├── ml/
│   │   ├── __init__.py
│   │   ├── model.py         # ML model wrapper
│   │   ├── pose_detector.py # MediaPipe pose
│   │   └── analyzers/
│   │       ├── pushup.py
│   │       ├── squat.py
│   │       └── jumping_jack.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── analysis.py
│   ├── db/
│   │   ├── __init__.py
│   │   ├── database.py
│   │   └── schemas.py
│   └── services/
│       ├── storage.py
│       └── notifications.py
├── tests/
├── requirements.txt
├── .env.example
└── Dockerfile
```

### Frontend (React Native)
```
src/
├── screens/
│   ├── VideoUploadScreen.tsx    # NEW
│   ├── AnalysisResultsScreen.tsx # NEW (enhanced)
│   └── ... (existing screens)
├── components/
│   ├── VideoRecorder.tsx        # NEW
│   ├── UploadProgress.tsx       # NEW
│   ├── FormScoreCard.tsx        # NEW
│   ├── CorrectionsList.tsx      # NEW
│   └── ... (existing)
├── services/
│   └── api/
│       ├── client.ts            # UPDATE
│       ├── analyze.ts           # NEW
│       └── types.ts             # NEW
└── hooks/
    ├── useVideoUpload.ts        # NEW
    └── useAnalysis.ts           # NEW
```

---

## 🔐 Authentication Flow

```
┌─────────┐     ┌─────────────┐     ┌──────────────┐
│  User   │────▶│ Firebase    │────▶│ JWT Token    │
│ (Login) │     │ Auth        │     │ (Backend)    │
└─────────┘     └─────────────┘     └──────────────┘
                      │
                      ▼
               ┌─────────────┐
               │ Authenticated│
               │   Session   │
               └─────────────┘
```

**States**:
1. Initial State → Logged Out
2. Enter Credentials → Login Attempt
3. Valid Credentials → Authenticated → Dashboard
4. Invalid Credentials → Error → Retry
5. Logout → Return to Logged Out

---

## 🛡️ Anti-Cheat System

### Face Verification
- Capture face at start of exercise
- Continuous verification during recording
- Prevents athlete substitution

### Body Scan
- Continuous body presence detection
- Ensures full body is in frame
- Validates exercise is being performed

---

## 📊 Data Models

### User
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: 'athlete' | 'coach';
  profile_image?: string;
  coach_id?: string; // For athletes linked to coach
  created_at: Date;
}
```

### AnalysisResult
```typescript
interface AnalysisResult {
  id: string;
  user_id: string;
  exercise_type: 'pushup' | 'squat' | 'jumping_jack';
  video_url?: string;
  form_score: number;
  rep_count: number;
  failed_reps: number;
  corrections: string[];
  joint_angles: Record<string, number>;
  shared_with?: string[]; // Coach IDs
  feedback?: CoachFeedback[];
  created_at: Date;
}
```

---

## ✅ Success Criteria

### MVP (3-4 days)
- [ ] Video upload working from app
- [ ] ML model analyzes video and returns results
- [ ] Results displayed with form score and corrections
- [ ] Basic error handling

### Post-MVP (Future)
- [ ] Firebase authentication
- [ ] Coach dashboard and sharing
- [ ] Progress tracking and history
- [ ] Push notifications
- [ ] Video storage (AWS S3)
- [ ] Anti-cheat face verification

---

## 🚨 Risk Mitigation

| Risk | Mitigation |
|------|------------|
| ML model not working | Test model separately first |
| Video upload too slow | Add compression before upload |
| API timeout | Implement async processing |
| CORS issues | Configure properly from day 1 |
| Large video files | Limit duration, compress |

---

## 📝 Notes

- Frontend uses **React Native** (not Flutter as in PPT)
- ML processing happens **locally** first, then syncs to server
- Follow existing design system (dark theme, Space Grotesk font)
- Keep screens consistent with existing UI patterns

---

*Last Updated: Sprint Start*
*Next Update: After each feature completion*
