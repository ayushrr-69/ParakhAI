# ParakhAI Feature Walkthrough

## Product Overview

ParakhAI is a mobile sports-performance app focused on video-based exercise analysis. The current implementation supports:

- A branded splash and onboarding flow
- Athlete-oriented home navigation
- Video upload analysis
- On-device fallback analysis
- Real-time camera-based rep counting
- A results screen that summarizes the session

## User Journey

### 1. Splash Screen

The app opens on a branded splash screen that introduces ParakhAI and then automatically routes to onboarding.

File: `src/screens/SplashScreen.tsx`

### 2. Onboarding

The onboarding flow explains the product in three slides:

- Testing skills and performance
- Competing against benchmarks
- Recording training progress

The design uses large illustration blocks, bold section headers, and a pager-like dot indicator.

File: `src/screens/OnboardingScreen.tsx`

### 3. Sign In As

The app shows a role selection screen with athlete and official options. In the current flow, both routes continue into the login screen.

File: `src/screens/SignInAsScreen.tsx`

### 4. Login And Sign Up

Login and sign-up screens use the same shared form primitives and the same dark visual language. They currently act as navigation gates into the home experience rather than wired authentication flows.

Files:

- `src/screens/LoginScreen.tsx`
- `src/screens/SignUpScreen.tsx`

### 5. Home Screen

The home screen is the main dashboard. It includes:

- A welcome header
- A calendar strip
- Exercise upload cards
- Live testing cards
- Bottom navigation

The page is structured as a mobile-first card dashboard with strong color blocks and rounded containers.

File: `src/screens/HomeScreen.tsx`

### 6. Upload Analysis

From home, the user chooses an exercise type and enters the upload flow. The screen:

- Lets the user pick a video from the device gallery
- Shows basic video metadata
- Sends the file into the analysis pipeline
- Displays analysis progress

If the backend path fails, the app falls back to the local visual analysis bridge.

Files:

- `src/screens/VideoUploadScreen.tsx`
- `src/hooks/useAnalysis.ts`
- `src/services/api/analysisService.ts`
- `src/services/analysis/visualAnalysisBridge.ts`
- `src/components/analysis/VisualVideoAnalyzer.tsx`

### 7. Local Visual Analysis

The fallback local analyzer slices the video into frames, runs them through the model pipeline, and produces summary metrics. This is the “on-device” story from the PDF, implemented in the React Native stack.

Files:

- `src/services/analysis/localAnalyzer.ts`
- `src/components/analysis/VisualVideoAnalyzer.tsx`
- `src/assets/models/movenet_lightning.tflite`

### 8. Real-Time Analysis

Real-time analysis uses the device camera and a TFLite model to count reps live. The screen shows:

- Live exercise title
- Total reps
- Good reps
- Bad reps
- Finish action to produce a results payload

File: `src/screens/RealTimeAnalysisScreen.tsx`

### 9. Results

The results screen summarizes the session with:

- Total reps
- Good reps
- Bad reps
- Consistency score
- A form insight message

It is the end-of-session view for both upload analysis and live analysis.

File: `src/screens/AnalysisResultsScreen.tsx`

## How Data Moves Through The System

### Upload Flow

1. User picks an exercise on the home screen.
2. The app opens the upload screen with the chosen exercise type.
3. `useAnalysis` tries the FastAPI upload endpoint first.
4. If the backend request fails, the app falls back to `VisualVideoAnalyzer`.
5. The analyzer returns summary metrics.
6. The results screen renders the returned payload.

### Live Flow

1. User selects the live exercise path.
2. The camera opens in `RealTimeAnalysisScreen`.
3. The TFLite model detects pose landmarks on-device.
4. Rep counters update in the UI.
5. The session is finalized into a results payload.
6. The results screen displays the final metrics.

## Visual Theme

The current UI theme is intentionally consistent:

- Dark base background
- White and charcoal surfaces
- Orange primary action color
- Mint green success accent
- Lavender and yellow supporting accents
- Rounded cards and pill buttons
- `Space Grotesk` typography

This gives the app a sporty, premium, mobile-first look instead of a generic dashboard style.

## What To Watch During Overhauls

- Keep navigation transitions and screen spacing consistent
- Keep copy aligned with the actual implementation
- Keep exercise naming consistent across upload and live flows
- Avoid introducing a second visual theme unless the whole app is being redesigned
