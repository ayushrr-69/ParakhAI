# ParakhAI Task Templates

This file is the repeatable checklist for any feature overhaul. Copy the template that matches the work, fill in the details, and use it as the working contract for the feature.

## Standard Feature Checklist

### 1. Define The Feature

- What user problem does this solve?
- Which screen(s), service(s), or backend route(s) are affected?
- What is in scope and what is out of scope?
- What is the expected success state?

### 2. UI And UX

- Confirm the screen matches the current theme system
- Check spacing, typography, and color usage
- Verify loading, empty, and error states
- Confirm responsive behavior on smaller and larger devices

### 3. State And Data Flow

- Identify where state lives
- Confirm the data contract between screen, hook, service, and backend
- Verify navigation params are typed correctly
- Check fallback behavior if the primary path fails

### 4. API And ML Integration

- Confirm the request payload matches the service contract
- Confirm the response shape is stable
- Verify exercise type handling
- Verify local analysis and backend analysis return compatible data where needed

### 5. Error Handling

- Check missing input cases
- Check backend failure cases
- Check device permission and model loading failures
- Check invalid or partial payload rendering

### 6. Verification

- Walk through the feature manually end to end
- Confirm related screens still work after the change
- Verify no active flow depends on deleted prototype code
- Capture follow-up cleanup if the feature exposed new dead code

## Overhaul Worksheet

Use this block for any feature being rewritten:

```md
# Feature Name

## Goal

## Current Behavior

## Target Behavior

## Files To Review

## Implementation Tasks
- [ ] UI update
- [ ] State and navigation update
- [ ] API or ML update
- [ ] Error handling update
- [ ] Verification pass

## Acceptance Criteria

## Risks

## Follow-Up Cleanup
```

## Feature-Specific Checklists

### Auth And Onboarding

- [ ] Splash still routes correctly
- [ ] Onboarding copy matches the product direction
- [ ] Role selection reflects the actual account model
- [ ] Login and sign-up actions land in the correct next state

### Home And Navigation

- [ ] Home dashboard sections are still readable and aligned
- [ ] Bottom navigation routes are correct
- [ ] Placeholder screens are clearly labeled or replaced
- [ ] Shared layout shell behaves properly with and without scroll

### Video Upload Analysis

- [ ] Video picker works
- [ ] Selected video state is visible
- [ ] Progress feedback is shown
- [ ] API response and fallback response both map to the results screen

### Live Analysis

- [ ] Camera permission flow is correct
- [ ] Model loading state is visible
- [ ] Reps update live and consistently
- [ ] Finish action produces a valid results payload

### Results And Insights

- [ ] Totals render correctly
- [ ] Consistency score is safe for missing metadata
- [ ] Insight copy matches the metric conditions
- [ ] Back navigation returns to the intended screen

### Backend Alignment

- [ ] Endpoint accepts the expected file and exercise type
- [ ] Validation errors are readable
- [ ] Response schema is stable
- [ ] Temporary file cleanup still happens

## Definition Of Done

A feature overhaul is done when:

- The flow works from entry to exit
- The UI matches the existing design language
- The data contract is documented and stable
- The feature has been verified manually
- Any new cleanup work has been recorded
