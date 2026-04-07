# ParakhAI - Feature Walkthrough
## Step-by-Step Guide for Each Feature

---

## Table of Contents
1. [Video Upload & Recording](#1-video-upload--recording)
2. [ML Analysis Integration](#2-ml-analysis-integration)
3. [Results Display](#3-results-display)
4. [Authentication System](#4-authentication-system)
5. [Coach-Athlete Sharing](#5-coach-athlete-sharing)
6. [Progress Tracking](#6-progress-tracking)

---

## 1. Video Upload & Recording

### Overview
Allow users to record exercise videos using their camera or select from gallery for analysis.

### User Flow
```
Home Screen → "Start Test" → Select Exercise → Record/Upload → Processing → Results
```

### Implementation Steps

#### Step 1.1: Install Dependencies
```bash
npx expo install expo-camera expo-image-picker expo-file-system expo-av
```

#### Step 1.2: Create VideoUploadScreen
```typescript
// src/screens/VideoUploadScreen.tsx

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '@/theme';

export const VideoUploadScreen = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const navigation = useNavigation();
  
  // ... implementation
};
```

#### Step 1.3: Add Camera Recording
- Request camera permissions
- Show camera preview
- Record button with visual feedback
- Stop recording after max duration (30-60 seconds)

#### Step 1.4: Add Gallery Picker
- Request media library permissions
- Open picker with video filter
- Validate video duration/size

#### Step 1.5: Upload Progress UI
- Show upload progress bar
- Display "Processing..." state
- Handle upload errors

### Files to Create/Modify
| File | Action | Description |
|------|--------|-------------|
| `src/screens/VideoUploadScreen.tsx` | CREATE | Main video capture screen |
| `src/components/VideoRecorder.tsx` | CREATE | Camera recording component |
| `src/components/UploadProgress.tsx` | CREATE | Progress indicator |
| `src/navigation/AppNavigator.tsx` | MODIFY | Add VideoUpload route |
| `src/hooks/useVideoUpload.ts` | CREATE | Upload logic hook |

### Testing Checklist
- [ ] Camera permission request works
- [ ] Can record video up to 60 seconds
- [ ] Can select video from gallery
- [ ] Upload progress shows correctly
- [ ] Handles permission denied gracefully
- [ ] Handles network errors

---

## 2. ML Analysis Integration

### Overview
Connect React Native app to FastAPI backend for video analysis using OpenCV/MediaPipe.

### Backend API Flow
```
Video Upload → Save Temp File → Extract Frames → 
Pose Detection → Exercise Analysis → Return Results
```

### Implementation Steps

#### Step 2.1: Create FastAPI Server
```python
# backend/app/main.py

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="ParakhAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "ml_model_loaded": True}

@app.post("/api/v1/analyze/video")
async def analyze_video(
    video: UploadFile = File(...),
    exercise_type: str = "pushup"
):
    # Implementation
    pass
```

#### Step 2.2: Wrap ML Model
```python
# backend/app/ml/model.py

import cv2
import mediapipe as mp
import numpy as np

class ExerciseAnalyzer:
    def __init__(self):
        self.pose = mp.solutions.pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            min_detection_confidence=0.5
        )
    
    def analyze_video(self, video_path: str, exercise_type: str):
        # Process video frames
        # Detect poses
        # Count reps
        # Calculate form score
        # Return results
        pass
```

#### Step 2.3: Create Exercise Analyzers
- `PushupAnalyzer`: Elbow angle, back alignment, depth
- `SquatAnalyzer`: Knee angle, hip alignment, depth
- `JumpingJackAnalyzer`: Arm extension, timing, symmetry

#### Step 2.4: Frontend API Client
```typescript
// src/services/api/analyze.ts

import { apiClient } from './client';

export interface AnalysisResult {
  status: string;
  analysis_id: string;
  exercise_type: string;
  metrics: {
    form_score: number;
    rep_count: number;
    failed_reps: number;
    corrections: string[];
  };
}

export const analyzeVideo = async (
  videoUri: string,
  exerciseType: string
): Promise<AnalysisResult> => {
  const formData = new FormData();
  formData.append('video', {
    uri: videoUri,
    type: 'video/mp4',
    name: 'exercise.mp4',
  } as any);
  formData.append('exercise_type', exerciseType);
  
  const response = await fetch(`${API_URL}/api/v1/analyze/video`, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.json();
};
```

### Files to Create/Modify
| File | Action | Description |
|------|--------|-------------|
| `backend/app/main.py` | CREATE | FastAPI entry point |
| `backend/app/ml/model.py` | CREATE | ML model wrapper |
| `backend/app/ml/analyzers/pushup.py` | CREATE | Pushup analysis |
| `backend/app/ml/analyzers/squat.py` | CREATE | Squat analysis |
| `src/services/api/analyze.ts` | CREATE | API client for analysis |
| `src/services/api/client.ts` | MODIFY | Update base URL |

### Testing Checklist
- [ ] Backend starts without errors
- [ ] Health endpoint returns 200
- [ ] Can upload video via Postman/curl
- [ ] ML model processes video correctly
- [ ] Returns proper JSON response
- [ ] Frontend receives results

---

## 3. Results Display

### Overview
Show analysis results with form score, rep count, and corrections in a visually appealing UI.

### UI Components
```
┌─────────────────────────────────────┐
│         Form Score: 85/100          │
│    ████████████████░░░░  (progress) │
├─────────────────────────────────────┤
│  Reps: 15    │  Failed: 2           │
├─────────────────────────────────────┤
│  📝 Corrections                     │
│  • Keep your back straighter        │
│  • Lower chest closer to ground     │
│  • Maintain consistent tempo        │
├─────────────────────────────────────┤
│       [Save] [Share with Coach]     │
└─────────────────────────────────────┘
```

### Implementation Steps

#### Step 3.1: Create AnalysisResultsScreen
```typescript
// src/screens/AnalysisResultsScreen.tsx

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { FormScoreCard } from '@/components/FormScoreCard';
import { MetricsGrid } from '@/components/MetricsGrid';
import { CorrectionsList } from '@/components/CorrectionsList';

export const AnalysisResultsScreen = ({ route }) => {
  const { results } = route.params;
  
  return (
    <ScrollView style={styles.container}>
      <FormScoreCard score={results.metrics.form_score} />
      <MetricsGrid 
        repCount={results.metrics.rep_count}
        failedReps={results.metrics.failed_reps}
      />
      <CorrectionsList corrections={results.metrics.corrections} />
    </ScrollView>
  );
};
```

#### Step 3.2: Form Score Visualization
- Circular progress indicator
- Color coded (green/yellow/red)
- Score out of 100

#### Step 3.3: Metrics Display
- Rep count with icon
- Failed reps with warning color
- Joint angles (collapsible details)

#### Step 3.4: Corrections Cards
- List of improvement suggestions
- Severity indicators
- Expandable for details

### Files to Create/Modify
| File | Action | Description |
|------|--------|-------------|
| `src/screens/AnalysisResultsScreen.tsx` | CREATE/MODIFY | Results screen |
| `src/components/FormScoreCard.tsx` | CREATE | Score display |
| `src/components/MetricsGrid.tsx` | CREATE | Stats grid |
| `src/components/CorrectionsList.tsx` | CREATE | Improvements list |

### Testing Checklist
- [ ] Results screen renders correctly
- [ ] Form score animates on load
- [ ] Corrections display properly
- [ ] Can navigate back to home
- [ ] Handles missing data gracefully

---

## 4. Authentication System

### Overview
Firebase Authentication with JWT tokens for secure API access.

### Auth Flow
```
App Start → Check Token → Valid? → Dashboard
                      └→ Invalid → Login Screen → Firebase Auth → Get Token → Dashboard
```

### Implementation Steps

#### Step 4.1: Setup Firebase
```bash
npx expo install @react-native-firebase/app @react-native-firebase/auth
```

#### Step 4.2: Create Auth Context
```typescript
// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: 'athlete' | 'coach') => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthProvider: React.FC = ({ children }) => {
  // Implementation
};
```

#### Step 4.3: Backend JWT Verification
```python
# backend/app/api/deps.py

from fastapi import Depends, HTTPException
from firebase_admin import auth

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except:
        raise HTTPException(status_code=401, detail="Invalid token")
```

### Files to Create/Modify
| File | Action | Description |
|------|--------|-------------|
| `src/contexts/AuthContext.tsx` | CREATE | Auth state management |
| `src/screens/LoginScreen.tsx` | MODIFY | Add Firebase auth |
| `src/screens/SignUpScreen.tsx` | MODIFY | Add Firebase auth |
| `backend/app/api/deps.py` | CREATE | Token verification |

---

## 5. Coach-Athlete Sharing

### Overview
Athletes can share analysis results with their coaches for feedback.

### Sharing Flow
```
Athlete Results → "Share with Coach" → Select Coach → 
Coach Receives Notification → Coach Reviews → Provides Feedback → 
Athlete Sees Feedback
```

### Implementation Steps

#### Step 5.1: Share API Endpoint
```python
# backend/app/api/routes/share.py

@router.post("/share")
async def share_with_coach(
    analysis_id: str,
    coach_id: str,
    current_user = Depends(get_current_user)
):
    # Add coach to shared_with list
    # Send notification to coach
    pass
```

#### Step 5.2: Coach Dashboard
- List of shared submissions
- Filter by athlete
- Review interface

#### Step 5.3: Feedback System
- Text comments
- Rating (optional)
- Recommendations

### Files to Create/Modify
| File | Action | Description |
|------|--------|-------------|
| `src/screens/ShareScreen.tsx` | CREATE | Share interface |
| `src/screens/CoachDashboardScreen.tsx` | CREATE | Coach view |
| `backend/app/api/routes/share.py` | CREATE | Share endpoints |

---

## 6. Progress Tracking

### Overview
Track user's improvement over time with charts and historical data.

### Features
- Historical analysis results
- Progress charts (form score over time)
- Rep count trends
- Exercise breakdown

### Implementation Steps

#### Step 6.1: History API
```python
@router.get("/user/{user_id}/history")
async def get_user_history(
    user_id: str,
    limit: int = 20,
    exercise_type: Optional[str] = None
):
    # Query database for user's results
    pass
```

#### Step 6.2: Progress Charts
- Line chart for form score trend
- Bar chart for reps per session
- Calendar heatmap for activity

### Files to Create/Modify
| File | Action | Description |
|------|--------|-------------|
| `src/screens/ProgressScreen.tsx` | CREATE | Progress view |
| `src/components/ProgressChart.tsx` | CREATE | Chart component |
| `backend/app/api/routes/history.py` | CREATE | History endpoints |

---

## Integration Checklist

### End-to-End Flow Test
1. [ ] User can login/signup
2. [ ] User can navigate to video upload
3. [ ] User can record or select video
4. [ ] Video uploads successfully
5. [ ] Backend processes video
6. [ ] Results return to app
7. [ ] Results display correctly
8. [ ] User can save results
9. [ ] Results appear in history
10. [ ] User can share with coach (if applicable)

---

*Document maintained throughout development*
*Update after each feature implementation*
