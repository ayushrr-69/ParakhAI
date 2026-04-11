# ParakhAI Implementation Plan

## Current State

ParakhAI is currently a React Native + Expo mobile app with a FastAPI backend and two analysis paths:

- Upload-based analysis through the backend API
- On-device analysis through the `VisualVideoAnalyzer` + `localAnalyzer` pipeline

The UI already has a defined theme and a full navigation shell, but the product still has some mixed branding, placeholder areas, and partially aligned data contracts.

### What Already Works

- Splash, onboarding, role selection, login, signup, and home screens
- Upload flow for exercise videos
- Results screen for completed analysis
- Real-time camera analysis screen
- Backend video-analysis API
- Shared theme system with `Space Grotesk`, dark surfaces, orange/green/lavender accents, and rounded cards

### Main Gaps

- Branding still mixes `NutriAI` and `ParakhAI`
- Some screens and docs are placeholder-heavy
- Frontend and backend response shapes are not fully aligned
- The analysis stack has multiple prototype layers that need a clearer “source of truth”
- The repository contains build artifacts and experiment assets that should not be treated as product code

## Target State

The goal of the next overhaul is to make ParakhAI feel like one coherent product:

- A clean athlete-first mobile experience
- A stable and predictable analysis pipeline
- A backend API that matches the frontend result contract
- A repository that is easier to navigate, maintain, and extend

## Roadmap

### Phase 1: Product Identity And UI Consistency

- Standardize all user-facing branding to `ParakhAI`
- Keep the current dark sporty visual language consistent across screens
- Review copy on onboarding, home, upload, and results screens so it matches the actual app behavior
- Remove or replace placeholder content where it no longer matches the product direction

### Phase 2: Analysis Flow Hardening

- Normalize the frontend analysis result model so upload analysis and live analysis return compatible shapes
- Confirm exercise types are consistently handled across upload, local, and real-time paths
- Improve progress and error handling for failed analysis jobs
- Make sure the results screen can safely render partial or fallback analysis payloads

### Phase 3: Backend Alignment

- Keep the FastAPI response schema stable and explicit
- Align backend exercise naming and summary fields with the React Native app
- Clarify which backend endpoint is the default source of truth for upload analysis
- Improve API-level validation for file type, exercise type, and failure responses

### Phase 4: Cleanup And Maintainability

- Keep only actively used source, assets, and models in the working tree
- Separate prototype notebooks and demos from production-facing assets
- Reduce confusion by removing dead docs and throwaway logs
- Add or improve verification steps for major feature flows

## Priorities

### High Priority

- Branding consistency
- Analysis result schema consistency
- Reliable upload flow
- Reliable live analysis flow

### Medium Priority

- Placeholder screen cleanup
- Better copy and UX polish
- Better organization of analysis artifacts

### Lower Priority

- Historical experiment cleanup
- Optional admin/coach expansion
- Future scope items from the PDF such as wearables and 3D reconstruction

## Dependencies

- Frontend navigation and screen contracts depend on `src/types/navigation.ts`
- Upload analysis depends on `src/services/api/analysisService.ts`
- Fallback local analysis depends on `src/services/analysis/localAnalyzer.ts` and `src/components/analysis/VisualVideoAnalyzer.tsx`
- Backend analysis depends on `backend/app/ml/analyzer.py` and `backend/app/api/routes/analyze.py`

## Migration Notes

- Prefer `ParakhAI` in all user-facing text
- Preserve the current theme system instead of introducing a new one unless the overhaul explicitly requires it
- Treat the current FastAPI backend and the on-device analyzer as complementary paths, not competing prototypes
- Do not delete active model assets such as `src/assets/models/movenet_lightning.tflite` or the backend pose model unless the implementation is intentionally replacing them

## Acceptance Criteria

- The repo reads as one coherent ParakhAI product
- The main user journey is understandable from the docs alone
- Upload analysis and live analysis have clear, documented ownership
- Future feature work can be organized around this plan without re-discovering the architecture each time
