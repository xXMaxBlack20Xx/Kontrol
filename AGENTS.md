# Kontrol Agent Instructions

## Project identity

Kontrol is an iOS-focused habit-tracking mobile application built with React Native and Expo.

The goal of Kontrol is to help users track personal habits through a simple, fast, minimalist, and visually clear mobile experience.

The MVP is local-first. The app should work without cloud sync, backend services, or external devices.

## Source-of-truth documents

Before planning or implementing any feature, agents must inspect the relevant project artifacts:

- `docs/user-stories/ios-historias-usuario-requerimientos-kontrol.md`
- `docs/test-plans/ios-plan-pruebas-kontrol.md`
- `docs/project/aps-ciclo-de-vida-del-desarrollo-ios.md`

The user stories document defines the HU, RF, RNF, and acceptance criteria.

The test plan defines the CP test cases, inputs, preconditions, expected results, and validation behavior.

The project lifecycle document defines MVP scope, architecture, tools, testing strategy, and prioritization.

## Mandatory traceability

Every implementation must preserve traceability between:

- HU: User Story ID
- RF: Functional Requirement ID
- RNF: Non-functional Requirement ID
- CP: Test Case ID
- Files changed
- Validation result

No feature should be implemented unless the agent can identify the relevant HU, RF/RNF, and CP references.

## MVP scope

Inside MVP scope:

- Local account registration
- Login and logout
- Local session protection
- Habit creation
- Habit editing
- Habit deletion
- Daily habit completion
- Duplicate daily completion prevention
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
- Backend-dependent features

## Architecture rules

The MVP should follow a local-first architecture with three logical layers:

1. Presentation layer
   - Screens
   - Components
   - Navigation
   - User feedback

2. Business logic layer
   - Input validation
   - Account/session rules
   - Habit creation/edit/delete rules
   - Daily completion rules
   - Streak calculation
   - Reminder validation

3. Local persistence layer
   - Local account data
   - Local session data
   - Local habit data
   - Local completion history
   - Local settings/privacy data

Business logic should be testable without rendering UI screens.

UI components should not directly own complex persistence logic.

## Expo and React Native rules

Agents must:

1. Keep the project compatible with Expo.
2. Prefer Expo-compatible packages.
3. Avoid native dependencies unless explicitly approved.
4. Avoid ejecting from Expo.
5. Avoid unnecessary dependencies.
6. Keep UI simple and reusable.
7. Preserve the minimalist iOS-style user experience.
8. Avoid backend assumptions unless explicitly requested.

## Implementation workflow

Before editing files, agents must provide:

1. The relevant HU ID.
2. The relevant RF/RNF IDs.
3. The relevant CP test case IDs.
4. A short implementation plan.
5. The files likely to change.
6. The validation commands expected to run.

During implementation, agents must:

1. Make the smallest correct change.
2. Avoid unrelated refactors.
3. Avoid undocumented scope expansion.
4. Keep changes aligned with the artifacts.

After implementation, agents must report:

1. Files changed.
2. HU/RF/RNF references implemented.
3. CP/test cases covered.
4. Validation commands executed.
5. Validation result.
6. Remaining risks or incomplete work.

## Validation commands

Use available commands from `package.json`.

Common validation commands:

```bash
npm test
npx expo-doctor
npx expo install --check
