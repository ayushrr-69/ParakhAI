# ParakhAI: Enterprise-Grade Athlete Performance Analytics

ParakhAI is a sophisticated, mobile-first performance monitoring ecosystem engineered for elite athletes and coaching staff. The platform integrates high-precision on-device machine learning with cloud-synchronized data architectures to deliver real-time biomechanical analysis and longitudinal performance tracking.

## Core Component Overview

### Athlete Analytics Suite
* **Real-Time Biomechanical Estimation**: Native Kotlin implementation utilizing CameraX and MediaPipe Pose for high-fidelity repetition counting and form validation.
* **Aggregated Performance Metrics**: Longitudinal tracking of lifetime physical benchmarks and peak intensity scoring.
* **Unified Identity Management**: Secure authentication via Google Sign-In with automated cross-platform state synchronization.
* **Dynamic Analysis Profiles**: Customizable detection logic for various kinematic movements, including push-ups, squats, and secondary exercise types.

### Coaching Oversight Dashboard
* **Roster Progress Monitoring**: Comprehensive visualization of individual and collective performance data.
* **Technical Quality Scoring**: Granular scoring of movement precision, consistency, and biomechanical efficiency over time.

## System Architecture

### Frontend Layer
* **Framework**: React Native with Expo (Managed Workflow)
* **State Orchestration**: React Context API
* **UI/UX Philosophy**: High-fidelity dark-mode interface with custom design tokens.

### Infrastructure & ML Pipeline
* **Backend Platform**: Supabase (PostgreSQL relational database for data persistence).
* **Identity Provider**: Supabase Auth (Integrated with Google identity providers).
* **Native Processing**: VisionCamera integration with a native Kotlin-based MediaPipe Pose pipeline for zero-latency inference.
* **Secondary Analysis**: Python-based biomechanical suite for complex asynchronous pose validation.

## Repository Configuration

```text
├── android/            # Native Android project with high-performance ML modules
├── src/
│   ├── components/     # Atomic and molecular UI components
│   ├── constants/      # Global configuration, route schemas, and content trees
│   ├── contexts/       # Authentication, session management, and state providers
│   ├── navigation/     # Navigational routing (Stack and Material Top Tab architectures)
│   ├── screens/        # Domain-driven user interfaces (Home, Profile, Analytics)
│   ├── services/       # Cloud synchronization, API bridges, and local storage logic
│   ├── theme/          # Design system implementation and visual tokens
│   └── types/          # Centralized TypeScript declarations and interfaces
└── App.tsx             # System entry point
```

## System Deployment

### Prerequisites
* Node.js (Version 18.x or greater)
* Android SDK / Android Studio (Required for native module compilation)
* Expo CLI

### Installation Procedure
```bash
npm install
```

### Execution Strategy
```bash
npm run android
```

## Security and Operational Performance
* **On-Device Inference**: To ensure maximum user privacy and eliminate network latency, all core exercise processing is executed directly on the mobile hardware.
* **Data Sovereignty**: Encrypted synchronization with Supabase infrastructure ensures secure data persistence and high-availability across multiple device sessions.
