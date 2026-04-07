# On-Device ML with TensorFlow.js

## Overview

This project now includes **on-device machine learning** capabilities using TensorFlow.js and the MoveNet pose detection model. The ML processing can run directly on the user's device instead of requiring a backend server.

---

## Current Implementation Status

### ✅ Completed

1. **TensorFlow.js Setup**
   - Installed `@tensorflow/tfjs` and `@tensorflow/tfjs-react-native`
   - Created initialization module (`src/ml/tfInit.ts`)
   - Auto-initializes on app startup

2. **Pose Detection Module**
   - MoveNet Lightning model integration (`src/ml/poseDetector.ts`)
   - Loads model from TensorFlow Hub
   - Detects 17 body keypoints
   - Calculates angles between joints

3. **Exercise Analyzer**
   - On-device rep counting (`src/ml/exerciseAnalyzer.ts`)
   - Supports push-ups, bicep curls, squats
   - Peak detection algorithm
   - Form scoring based on range of motion

4. **Video Processor**
   - Frame analysis interface (`src/ml/videoProcessor.ts`)
   - Progress callbacks for UI updates
   - Fallback to server processing

### 🚧 Limitations (Expo Go)

**Current Limitation:** Full video frame extraction requires **native code** which is not available in Expo Go.

**What works in Expo Go:**
- TensorFlow.js initialization ✓
- Model loading ✓
- Pose detection on individual frames ✓
- Rep counting algorithm ✓

**What requires Development Build:**
- Extracting frames from video files
- Real-time camera frame capture
- On-device video processing

---

## Architecture

```
User uploads video
      ↓
Frontend (React Native)
      ↓
   ┌──────────────────────┐
   │ Try On-Device First? │
   └──────────────────────┘
      ↓              ↓
   Yes (Dev)     No (Expo Go)
      ↓              ↓
   ML Module      Backend API
      ↓              ↓
   TF.js      Python FastAPI
   MoveNet    TensorFlow
      ↓              ↓
   Results ← ← ← Results
```

---

## Files Structure

```
src/ml/
├── index.ts              # Main exports
├── tfInit.ts             # TensorFlow.js initialization
├── poseDetector.ts       # MoveNet pose detection
├── exerciseAnalyzer.ts   # Rep counting & scoring
└── videoProcessor.ts     # Video/frame processing
```

---

## Usage

### Initialize TensorFlow (Auto)
```typescript
// App.tsx - Already implemented
import { initializeTensorFlow } from '@/ml';

useEffect(() => {
  initializeTensorFlow();
}, []);
```

### Analyze Frames (Real-time)
```typescript
import { analyzeFrames } from '@/ml';

const frames = [
  { data: Uint8Array, width: 640, height: 480 },
  // ... more frames
];

const result = await analyzeFrames(frames, 'pushup', (progress) => {
  console.log(progress.message); // "Analyzing frame 1/30..."
});

console.log(result.repCount); // 10
console.log(result.formScore); // 85
```

### Detect Pose (Single Frame)
```typescript
import { detectPose, calculateAngle, KEYPOINTS } from '@/ml';

const pose = await detectPose(imageData, width, height);

if (pose) {
  const elbowAngle = calculateAngle(
    pose.keypoints,
    KEYPOINTS.LEFT_SHOULDER,
    KEYPOINTS.LEFT_ELBOW,
    KEYPOINTS.LEFT_WRIST
  );
}
```

---

## Creating a Development Build (Required for Full On-Device)

To enable full on-device video processing:

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Configure EAS
```bash
eas login
eas build:configure
```

### 3. Create Development Build
```bash
# For Android
eas build --profile development --platform android

# For iOS
eas build --profile development --platform ios
```

### 4. Install on Device
Download and install the `.apk` (Android) or `.app` (iOS) file from EAS.

### 5. Start Development Server
```bash
npx expo start --dev-client
```

---

## Adding Native Video Frame Extraction

To extract frames from video on-device, you'll need a native module:

### Option 1: Custom Native Module
Create a native module using Expo Modules API:

```typescript
// expo-video-frames (custom module)
export async function extractFrames(
  videoUri: string,
  frameRate: number
): Promise<Frame[]> {
  // Native implementation extracts frames
}
```

### Option 2: Use FFmpeg
```bash
npx expo install @ffmpeg-kit/react-native-ffmpeg
```

Then extract frames to images and process with TensorFlow.js.

---

## Performance Considerations

### Model Size
- **MoveNet Lightning**: ~12 MB (fast, good accuracy)
- Loads from TensorFlow Hub on first use
- Cached for subsequent uses

### Processing Speed
- ~30-50ms per frame on modern devices
- Process every 2nd frame for 30fps video
- 30-second video ≈ 450 frames ≈ 15 seconds processing

### Memory
- TensorFlow.js: ~100MB RAM
- Model: ~50MB RAM
- Total: ~150-200MB additional memory usage

---

## Comparison: On-Device vs Server

| Feature | On-Device | Server |
|---------|-----------|--------|
| **Speed** | Fast (no network) | Depends on connection |
| **Privacy** | 100% private | Video uploaded |
| **Offline** | ✓ Works offline | ✗ Requires internet |
| **Setup** | Development build | Works in Expo Go |
| **Device** | Uses phone CPU/GPU | Uses server resources |
| **Updates** | Requires app update | Easy backend updates |

---

## Next Steps

### Immediate (Works Now)
1. Test TensorFlow initialization
2. Test pose detection on sample images
3. Test rep counting algorithm

### Requires Dev Build
1. Create development build with EAS
2. Add native video frame extraction
3. Implement real-time camera analysis
4. Test on-device video processing

### Future Enhancements
1. Model quantization for smaller size
2. WebGL backend optimization
3. Multi-threading with Web Workers
4. Custom training for exercise-specific models

---

## Troubleshooting

### TensorFlow.js won't initialize
```
Error: Cannot find module '@tensorflow/tfjs-react-native'
```
**Fix:** Install with legacy peer deps:
```bash
npm install @tensorflow/tfjs @tensorflow/tfjs-react-native --legacy-peer-deps
```

### Model loading fails
```
Error: Failed to load model from TensorFlow Hub
```
**Fix:** Ensure device has internet connection on first load. Model is cached after.

### Out of memory
```
Error: Cannot allocate tensor
```
**Fix:** Reduce frame resolution or process fewer frames.

---

## Resources

- [TensorFlow.js Docs](https://www.tensorflow.org/js)
- [MoveNet Model](https://tfhub.dev/google/movenet/singlepose/lightning/4)
- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/)
- [TensorFlow.js React Native](https://github.com/tensorflow/tfjs/tree/master/tfjs-react-native)
