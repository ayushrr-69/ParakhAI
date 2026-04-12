# ParakhAI: Enterprise-Grade Athlete Performance Analytics

ParakhAI is a sophisticated, mobile-first performance monitoring ecosystem engineered for elite athletes and coaching staff. The platform integrates high-precision, on-device machine learning with cloud-synchronized architectures to deliver real-time biomechanical analysis and longitudinal performance tracking.

## 🚀 Core Component Overview

### Athlete Analytics Suite
* **Real-Time Biomechanical Estimation**: Native Kotlin implementation utilizing CameraX and MediaPipe Pose for high-fidelity repetition counting and form validation.
* **Aggregated Performance Metrics**: Longitudinal tracking of lifetime physical benchmarks and peak intensity scoring.
* **Unified Identity Management**: Secure authentication via Google Sign-In with automated cross-platform state synchronization.
- **Visual Feedback Loop**: Real-time overlay of skeletal tracking to provide immediate movement correction.

### Coaching Oversight Dashboard
* **Roster Progress Monitoring**: Comprehensive visualization of individual and collective performance data across the entire athlete cohort.
* **Technical Quality Scoring**: Granular analysis of movement precision, consistency, and biomechanical efficiency.
* **In-App Messaging & Review**: Integrated communication layer (Services/Messaging) for direct coach-to-athlete feedback cycles.

## 🏗️ System Architecture

### Frontend Layer
* **Framework**: React Native with Expo (Dev Client Workflow)
* **State Orchestration**: React Context API with persistent local storage.
* **UI/UX Philosophy**: High-fidelity dark-mode interface utilizing a custom atomic design system for a premium aesthetic.

### Infrastructure & ML Pipeline
* **Backend Platform**: Supabase (PostgreSQL relational database for mission-critical data persistence).
* **Native Processing**: VisionCamera integration with a native Kotlin-based MediaPipe Pose pipeline for sub-10ms inference latency.
* **Data Sovereignty**: Encrypted synchronization ensures all sensitive performance data is handled securely via PostgreSQL RLS policies.

## 📁 Repository Structure

```text
├── android/            # Native Android project (Custom bridges & ML modules)
├── scripts/            # Environment stabilization and build automation
├── src/
│   ├── components/     # Atomic (common), Home, and Coach-specific UI modules
│   ├── constants/      # Global configuration and route schemas
│   ├── contexts/       # Auth and Data providers for global state
│   ├── screens/        # Domain-driven interfaces (Analysis, CoachHQ, Profile)
│   ├── services/       # Native bridges, cloud-sync, and messaging logic
│   └── theme/          # Centralized Design System implementation
└── App.tsx             # Application initialization
```

## 🛠️ Deployment & Execution

### Prerequisites
* **Node.js**: Version 18.x (LTS) or greater.
* **Android SDK**: Build Tools 34+ and NDK configuration.
* **ADB**: Standardized on Port 5037 for multi-tool compatibility.

### Installation Procedure
```bash
# Clone and install dependencies
git clone https://github.com/ayushrr-69/ParakhAI.git
npm install
```

### Execution Strategy
```bash
# Standard Build & Deploy
npm run android

# Self-Healing Environment Reset (Clean Boot)
# Use this if you encounter ADB or Gradle port conflicts
npm run clean-android
```

## 🛡️ Reliability & Performance
* **Build Pipeline Stabilization**: The project includes automated PowerShell scripts to resolve Windows Registry port conflicts and Gradle lock contention.
* **On-Device Inference**: To ensure maximum user privacy and eliminate network latency, all core kinematic processing is executed locally on the mobile hardware.
