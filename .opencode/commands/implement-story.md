---
description: Implement one Kontrol user story using project artifacts, traceability, tests, and Expo-compatible local-first architecture.
---

Use the `kontrol-project-workflow` skill.

Implement this Kontrol user story or requirement:

$ARGUMENTS

Follow this workflow exactly:

## 1. Artifact analysis before editing

Before editing any file, inspect the relevant sections of:

- `docs/user-stories/ios-historias-usuario-requerimientos-kontrol.md`
- `docs/test-plans/ios-plan-pruebas-kontrol.md`
- `docs/project/aps-ciclo-de-vida-del-desarrollo-ios.md`

Identify and report:

- Relevant HU ID
- Relevant RF IDs
- Relevant RNF IDs
- Relevant CP test case ID
- Happy path behavior
- Alternate path behavior
- Failure path behavior
- MVP scope confirmation
- Files likely to change
- Validation commands expected to run

Do not edit files until this plan is produced.

## 2. Implementation rules

After the plan is clear:

- Make the smallest correct change.
- Avoid unrelated refactors.
- Do not invent undocumented behavior.
- Preserve Expo compatibility.
- Preserve local-first architecture.
- Keep business logic testable outside UI.
- Keep UI minimal and iOS-aligned.
- Do not add native dependencies unless explicitly approved.
- Do not add backend/cloud behavior unless explicitly approved.

## 3. Validation

After implementation, run available validation commands.

Prefer:

```bash
npm test
npx expo-doctor
npx expo install --check

If npm run lint exists, run it.

If npm run lint does not exist, report:

Lint not executed: package.json does not define a lint script.

Do not claim a command passed unless it was actually executed.