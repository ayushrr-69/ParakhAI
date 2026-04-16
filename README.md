# ParakhAI: Multi-Tier Athlete Performance and Biomechanical Analytics

ParakhAI is a high-performance mobile ecosystem designed to bridge the gap between automated computer vision analysis and human coaching. The platform provides a dual-interface solution for athletes and coaches, enabling real-time exercise validation, longitudinal progress tracking, and professional technical feedback.

## Core Value Proposition

ParakhAI transforms raw movement into actionable data. By utilizing on-device machine learning for immediate feedback and cloud-synchronized technical reviews for long-term development, the platform ensures that every repetition is executed with precision and every session is accounted for.

## Functional Modules

### Athlete Module
The Athlete Module is engineered for high-intensity training environments where immediate feedback is critical.

*   **Real-Time Biomechanical Analysis**: Utilizes computer vision to track skeletal keypoints, providing instantaneous repetition counting and form quality assessment.
*   **Performance Synchronization**: Automated cloud-backup of every session, maintaining a high-fidelity record of lifetime benchmarks and intensity metrics.
*   **Coach Collaboration**: Direct submission pipeline allowing athletes to share recorded sessions with assigned coaches for technical oversight.
*   **Interactive Leaderboards**: Team-wide competition based on movement quality and volume, fostering a competitive development environment.

### Coach Module
The Coach Module (Coach HQ) provides administrative and technical oversight capabilities for managing a roster of athletes.

*   **Centralized Inbox**: A unified hub for reviewing athlete submissions, prioritized by review status and submission recency.
*   **Technical Feedback Engine**: Specialized review interface for providing granular ratings and technical corrections on athlete videos.
*   **Team Performance Analytics**: High-level visualization of team-wide quality trends and individual athlete trajectories.
*   **Enrollment Management**: Full oversight of athlete enrollment requests and roster composition.

## System Architecture

### Frontend Layer
*   **Framework**: React Native (Expo Managed Workflow)
*   **Language**: TypeScript
*   **Navigation**: Structured Stack and Tab-based routing for role-specific workflows.
*   **UI System**: High-fidelity dark-mode interface utilizing custom design tokens and consistent visual hierarchies.

### Analytical Machine Learning Pipeline
*   **On-Device Processing**: React Native Vision Camera integrated with a native Kotlin implementation of MediaPipe Pose.
*   **Asynchronous Processing**: Python-based analytical engine utilizing FastAPI and advanced biomechanical models for complex pose validation.
*   **Performance Optimization**: Diagnostic hardware discovery logic ensures camera stability and optimal frame-rates across varied Android hardware.

### Data Infrastructure
*   **Cloud Platform**: Supabase (PostgreSQL)
*   **State Management**: Multi-tier architecture utilizing React Context for global state and localized caching for offline resilience.
*   **Storage**: Secure object storage for athlete video recordings and analytical exports.

## Operational Logic and Reliability

### Offline Resilience
The platform implements a local-first data strategy. During network interruptions, session data is cached locally in structured JSON format. A background synchronization layer verifies connectivity and performs a multi-phase reconciliation process to ensure cloud data integrity once service is restored.

### Real-Time Synchronization
Utilizing PostgreSQL Change Data Capture (CDC), the platform ensures that both coaches and athletes have immediate visibility into new submissions and feedback. This eliminates the need for manual refreshing and maintains a synchronized state across the ecosystem.

### Security and Privacy
*   **Local Inference**: Primary ML processing occurs on-device, ensuring that biometric pose data remains private to the user's hardware.
*   **Role-Based Access Control (RBAC)**: Strict separation of athlete and coach data layers enforced at the database level.
*   **Encrypted Transport**: All communication with the analytical backend and cloud infrastructure is secured via standard encryption protocols.

## Repository Structure

```text
├── android/            # Native Android project and ML configuration
├── backend/            # Python-based analytical engine and ML models
├── docs/               # Technical documentation and project specifications
├── src/
│   ├── components/     # Reusable UI elements (Common, Athlete, Coach)
│   ├── constants/      # Global route schemas and configuration tokens
│   ├── contexts/       # Auth, Toast, Network, and Data state providers
│   ├── navigation/     # System-wide routing logic and navigators
│   ├── screens/        # Domain-specific functional screens
│   ├── services/       # External API bridges and cloud logic
│   ├── theme/          # Design system and visual identity tokens
│   └── utils/          # Validation and helper logic
└── App.tsx             # Application entry point
```

## System Deployment

### Environment Setup
*   Ensure Node.js (18.x+) is installed.
*   Configure the Android SDK for native module support.
*   Install project dependencies: `npm install`

### Local Execution
*   To launch the development environment: `npm run android`
*   To generate a standalone APK: `cd android && ./gradlew assembleRelease`

## Technical Frequently Asked Questions

**How does the system handle varied camera hardware on Android?**
The application implements a diagnostic hardware discovery loop during camera initialization. This process polls for available devices and includes a "settling delay" to allow Android drivers to stabilize, ensuring reliable camera activation across different device manufacturers.

**What are the requirements for real-time analysis?**
Real-time analysis requires an Android device supporting GLES 3.0 or higher. Performance is optimized for devices with dedicated NPU/GPU capabilities, though fallback CPU processing is supported.

**Can athletes review their own data without a coach?**
Yes. Athletes have full access to their session history and AI-generated insights regardless of their enrollment status with a coach.

**How is the "Quality Score" calculated?**
The score is a derived metric based on biomechanical consistency, movement range, and temporal form stability as analyzed by the ML pipeline.
