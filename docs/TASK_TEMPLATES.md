# ParakhAI - Task Templates
## Reusable Templates for Each Development Phase

---

## How to Use This Document

1. Copy the relevant template for your current task
2. Fill in the specifics for your implementation
3. Check off items as you complete them
4. Update the status when done

---

## 📋 Template: Backend Endpoint

### Endpoint: `[METHOD] /api/v1/[path]`

**Purpose**: [Brief description]

**Status**: ⬜ Not Started | 🔄 In Progress | ✅ Complete

#### Request
```json
{
  "field1": "type",
  "field2": "type"
}
```

#### Response
```json
{
  "status": "success",
  "data": {}
}
```

#### Implementation Checklist
- [ ] Create route file
- [ ] Define request/response models
- [ ] Implement endpoint logic
- [ ] Add input validation
- [ ] Add error handling
- [ ] Write unit tests
- [ ] Test with Postman/curl
- [ ] Document in API docs

#### Code Location
- Route: `backend/app/api/routes/[file].py`
- Models: `backend/app/models/[file].py`
- Tests: `backend/tests/test_[file].py`

---

## 📋 Template: React Native Screen

### Screen: `[ScreenName]Screen`

**Purpose**: [Brief description]

**Status**: ⬜ Not Started | 🔄 In Progress | ✅ Complete

#### User Story
> As a [user type], I want to [action] so that [benefit].

#### UI Wireframe
```
┌─────────────────────────┐
│      Header             │
├─────────────────────────┤
│                         │
│      Main Content       │
│                         │
├─────────────────────────┤
│      Actions            │
└─────────────────────────┘
```

#### Implementation Checklist
- [ ] Create screen component file
- [ ] Implement UI layout
- [ ] Add state management
- [ ] Connect to API (if needed)
- [ ] Add loading states
- [ ] Add error states
- [ ] Add navigation
- [ ] Style according to theme
- [ ] Test on iOS
- [ ] Test on Android

#### Code Location
- Screen: `src/screens/[ScreenName]Screen.tsx`
- Styles: Inline or `src/screens/[ScreenName]Screen.styles.ts`

#### Navigation
- Route name: `[ScreenName]`
- Params: `{ param1: Type, param2: Type }`
- Navigate from: `[PreviousScreen]`
- Navigate to: `[NextScreen]`

---

## 📋 Template: React Native Component

### Component: `[ComponentName]`

**Purpose**: [Brief description]

**Status**: ⬜ Not Started | 🔄 In Progress | ✅ Complete

#### Props
```typescript
interface [ComponentName]Props {
  prop1: Type;
  prop2?: Type;
  onAction?: () => void;
}
```

#### Implementation Checklist
- [ ] Create component file
- [ ] Define TypeScript props interface
- [ ] Implement component logic
- [ ] Add styling
- [ ] Handle edge cases (empty, loading, error)
- [ ] Make responsive
- [ ] Add accessibility labels
- [ ] Export from index

#### Code Location
- Component: `src/components/[ComponentName].tsx`

---

## 📋 Template: API Service Function

### Function: `[functionName]`

**Purpose**: [Brief description]

**Status**: ⬜ Not Started | 🔄 In Progress | ✅ Complete

#### Signature
```typescript
async function [functionName](
  param1: Type,
  param2?: Type
): Promise<ReturnType> {
  // Implementation
}
```

#### Implementation Checklist
- [ ] Create function in service file
- [ ] Define TypeScript types
- [ ] Implement API call
- [ ] Add error handling
- [ ] Add request timeout
- [ ] Export function
- [ ] Test with mock data
- [ ] Test with real API

#### Code Location
- Service: `src/services/api/[service].ts`
- Types: `src/services/api/types.ts`

---

## 📋 Template: Custom Hook

### Hook: `use[HookName]`

**Purpose**: [Brief description]

**Status**: ⬜ Not Started | 🔄 In Progress | ✅ Complete

#### Return Value
```typescript
interface Use[HookName]Return {
  data: Type | null;
  loading: boolean;
  error: Error | null;
  action: () => void;
}
```

#### Implementation Checklist
- [ ] Create hook file
- [ ] Define return interface
- [ ] Implement state logic
- [ ] Add cleanup in useEffect
- [ ] Handle loading states
- [ ] Handle errors
- [ ] Export hook

#### Code Location
- Hook: `src/hooks/use[HookName].ts`

---

## 📋 Template: ML Model Integration

### Model: `[ModelName]Analyzer`

**Purpose**: [Brief description]

**Status**: ⬜ Not Started | 🔄 In Progress | ✅ Complete

#### Input/Output
```python
Input: video_path (str), options (dict)
Output: {
    "score": float,
    "count": int,
    "details": dict
}
```

#### Implementation Checklist
- [ ] Create analyzer class
- [ ] Load model in __init__
- [ ] Implement analyze method
- [ ] Process video frames
- [ ] Extract pose landmarks
- [ ] Calculate metrics
- [ ] Format output
- [ ] Add unit tests
- [ ] Benchmark performance

#### Code Location
- Analyzer: `backend/app/ml/analyzers/[model].py`
- Tests: `backend/tests/ml/test_[model].py`

---

## 📋 Template: Database Model

### Model: `[ModelName]`

**Purpose**: [Brief description]

**Status**: ⬜ Not Started | 🔄 In Progress | ✅ Complete

#### Schema
```python
class [ModelName](Base):
    __tablename__ = "[table_name]"
    
    id = Column(UUID, primary_key=True)
    field1 = Column(String, nullable=False)
    field2 = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
```

#### Implementation Checklist
- [ ] Create model file
- [ ] Define SQLAlchemy model
- [ ] Add relationships
- [ ] Create migration
- [ ] Run migration
- [ ] Add CRUD functions
- [ ] Add indexes (if needed)

#### Code Location
- Model: `backend/app/models/[model].py`
- Migration: `backend/alembic/versions/[timestamp]_[description].py`

---

## 🎯 Sprint Task Instances

Below are the actual tasks for the current sprint, using the templates above.

---

### Day 1 Tasks

#### Task D1-1: FastAPI Project Setup
**Template**: Backend Endpoint  
**Status**: ⬜ Not Started

**Checklist**:
- [ ] Create `backend/` folder structure
- [ ] Create `requirements.txt`
- [ ] Setup virtual environment
- [ ] Create `main.py` with FastAPI app
- [ ] Add CORS middleware
- [ ] Create `/health` endpoint
- [ ] Test server starts correctly

---

#### Task D1-2: ML Model Wrapper
**Template**: ML Model Integration  
**Status**: ⬜ Not Started

**Checklist**:
- [ ] Create `backend/app/ml/model.py`
- [ ] Import existing OpenCV model
- [ ] Create `ExerciseAnalyzer` class
- [ ] Implement `analyze_video()` method
- [ ] Test with sample video

---

#### Task D1-3: Video Analysis Endpoint
**Template**: Backend Endpoint  
**Status**: ⬜ Not Started

**Endpoint**: `POST /api/v1/analyze/video`

**Checklist**:
- [ ] Create route in `analyze.py`
- [ ] Handle multipart file upload
- [ ] Save video to temp file
- [ ] Call ML model
- [ ] Return JSON response
- [ ] Cleanup temp file
- [ ] Test with curl

---

### Day 2 Tasks

#### Task D2-1: VideoUploadScreen
**Template**: React Native Screen  
**Status**: ⬜ Not Started

**Checklist**:
- [ ] Install expo-camera, expo-image-picker
- [ ] Create `VideoUploadScreen.tsx`
- [ ] Add camera preview
- [ ] Add record button
- [ ] Add gallery picker
- [ ] Add upload progress
- [ ] Connect to API

---

#### Task D2-2: VideoRecorder Component
**Template**: React Native Component  
**Status**: ⬜ Not Started

**Props**:
```typescript
interface VideoRecorderProps {
  onVideoRecorded: (uri: string) => void;
  maxDuration?: number;
}
```

**Checklist**:
- [ ] Create component file
- [ ] Request camera permissions
- [ ] Implement recording logic
- [ ] Add visual recording indicator
- [ ] Stop after max duration

---

#### Task D2-3: useVideoUpload Hook
**Template**: Custom Hook  
**Status**: ⬜ Not Started

**Returns**:
```typescript
{
  uploadVideo: (uri: string, exerciseType: string) => Promise<AnalysisResult>;
  uploading: boolean;
  progress: number;
  error: Error | null;
}
```

**Checklist**:
- [ ] Create hook file
- [ ] Implement upload logic
- [ ] Track progress
- [ ] Handle errors

---

### Day 3 Tasks

#### Task D3-1: AnalysisResultsScreen
**Template**: React Native Screen  
**Status**: ⬜ Not Started

**Checklist**:
- [ ] Create/update screen file
- [ ] Display form score
- [ ] Display rep count
- [ ] Display corrections
- [ ] Add save button
- [ ] Add share button (stub)

---

#### Task D3-2: FormScoreCard Component
**Template**: React Native Component  
**Status**: ⬜ Not Started

**Props**:
```typescript
interface FormScoreCardProps {
  score: number; // 0-100
  exerciseType: string;
}
```

**Checklist**:
- [ ] Create component
- [ ] Circular progress UI
- [ ] Color coding
- [ ] Animation on load

---

#### Task D3-3: Navigation Integration
**Template**: React Native Screen  
**Status**: ⬜ Not Started

**Checklist**:
- [ ] Add VideoUpload route
- [ ] Add AnalysisResults route
- [ ] Update Home screen "Start Test" button
- [ ] Pass params between screens

---

### Day 4 Tasks

#### Task D4-1: Error Handling Polish
**Status**: ⬜ Not Started

**Checklist**:
- [ ] Add network error messages
- [ ] Add retry buttons
- [ ] Add offline detection
- [ ] Improve validation messages

---

#### Task D4-2: Loading Animations
**Status**: ⬜ Not Started

**Checklist**:
- [ ] Add skeleton loaders
- [ ] Add processing animation
- [ ] Add success animation

---

#### Task D4-3: End-to-End Testing
**Status**: ⬜ Not Started

**Checklist**:
- [ ] Test complete flow 3+ times
- [ ] Test error scenarios
- [ ] Test on different video sizes
- [ ] Document any issues

---

## 📊 Progress Tracker

| Day | Task | Status | Notes |
|-----|------|--------|-------|
| 1 | FastAPI Setup | ⬜ | |
| 1 | ML Model Wrapper | ⬜ | |
| 1 | Video Analysis API | ⬜ | |
| 2 | VideoUploadScreen | ⬜ | |
| 2 | VideoRecorder | ⬜ | |
| 2 | useVideoUpload Hook | ⬜ | |
| 3 | AnalysisResultsScreen | ⬜ | |
| 3 | FormScoreCard | ⬜ | |
| 3 | Navigation | ⬜ | |
| 4 | Error Handling | ⬜ | |
| 4 | Animations | ⬜ | |
| 4 | E2E Testing | ⬜ | |

---

*Update this document as tasks are completed*
*Use ⬜ Not Started | 🔄 In Progress | ✅ Complete | ❌ Blocked*
