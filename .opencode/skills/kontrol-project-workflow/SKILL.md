---
name: kontrol-project-workflow
description: Use the Kontrol project artifacts to plan, implement, test, and review Expo React Native features with full HU/RF/RNF/CP traceability.
license: MIT
compatibility: opencode
metadata:
  project: Kontrol
  category: project-workflow
---

# Kontrol Project Workflow Skill

## Purpose

Use this skill whenever planning, implementing, testing, reviewing, or documenting work for the Kontrol project.

Kontrol is an iOS-focused habit-tracking app built with React Native and Expo. The MVP is local-first, minimalist, and based on documented project artifacts.

This skill exists to make sure every coding task follows the project documentation instead of guessing behavior from the code alone.

## Source-of-truth documents

Before implementing any feature, inspect the relevant sections of:

- `docs/user-stories/ios-historias-usuario-requerimientos-kontrol.md`
- `docs/test-plans/ios-plan-pruebas-kontrol.md`
- `docs/project/aps-ciclo-de-vida-del-desarrollo-ios.md`

The user stories document defines:

- HU: User stories
- RF: Functional requirements
- RNF: Non-functional requirements
- Acceptance criteria

The test plan defines:

- CP: Test cases
- Inputs
- Preconditions
- Expected results
- Happy path
- Alternate path
- Failure path

The project lifecycle document defines:

- MVP scope
- Architecture
- Tools
- Testing strategy
- Prioritization

## Mandatory traceability

Every implementation task must identify:

- HU ID
- RF ID or RF IDs
- RNF ID or RNF IDs
- CP test case ID
- Files changed
- Validation result

Do not implement a feature if the relevant HU, RF/RNF, and CP cannot be identified.

## MVP scope

Inside MVP scope:

- Local account registration
- Login and logout
- Session protection
- Habit creation
- Habit editing
- Habit deletion
- Daily habit completion
- Duplicate completion prevention
- Streak calculation
- Basic progress visualization
- Local reminders
- Settings and privacy notice access
- Local persistence

Outside MVP scope:

- Cloud synchronization
- Social features
- Apple Watch integration
- iOS widgets
- Predictive analytics
- Advanced statistics
- Remote push notifications
- Multi-device sync
- Backend-dependent behavior

## Local-first architecture rules

Kontrol's MVP should work without a backend.

Preserve three logical layers:

1. Presentation layer
   - Screens
   - Components
   - Navigation
   - User feedback

2. Business logic layer
   - Validation
   - Account/session rules
   - Habit rules
   - Completion rules
   - Streak calculation
   - Reminder validation

3. Local persistence layer
   - Local account data
   - Local session data
   - Local habit data
   - Local completion history
   - Local settings/privacy data

Business logic should be testable without rendering UI.

UI components should not directly own complex persistence logic.

## Expo and React Native rules

When modifying the app:

1. Keep the project compatible with Expo.
2. Prefer Expo-compatible packages.
3. Do not add native dependencies unless explicitly approved.
4. Do not eject from Expo.
5. Avoid unnecessary dependencies.
6. Keep components simple and reusable.
7. Preserve the minimalist iOS-style experience.
8. Avoid backend assumptions unless explicitly requested.

## Required workflow before editing

Before editing files, provide:

1. Requested feature or user story.
2. Relevant HU ID.
3. Relevant RF/RNF IDs.
4. Relevant CP test case ID.
5. Happy path, alternate path, and failure path.
6. Short implementation plan.
7. Files likely to change.
8. Validation commands expected to run.

## Required workflow during implementation

During implementation:

1. Make the smallest correct change.
2. Avoid unrelated refactors.
3. Avoid undocumented scope expansion.
4. Preserve Expo compatibility.
5. Keep business logic testable.
6. Keep UI minimal and clear.
7. Avoid modifying unrelated modules.

## Required workflow after implementation

After implementation, report:

1. Files changed.
2. HU/RF/RNF references implemented.
3. CP test cases covered.
4. Automated validation commands executed.
5. Manual validation steps, if UI behavior is involved.
6. Validation result.
7. Remaining risks or pending work.

## Validation commands

Run available validation commands from `package.json`.

Common commands:

```bash
npm test
npx expo-doctor
npx expo install --check

if dependency mismatches appear, prefer:

npx expo install --fix

Then rerun:

npm test
npx expo-doctor

Do not claim lint passed unless a lint command exists and was executed.

If npm run lint fails because the script does not exist, report:

Lint not executed: package.json does not define a lint script.