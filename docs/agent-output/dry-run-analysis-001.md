1. MVP Scope Summary
Kontrol MVP is a local-first iOS habit tracker built with React Native + Expo. It must work without backend, cloud sync, external devices, social features, widgets, Apple Watch, predictive analytics, or remote push notifications.
In scope:

- Local account registration.
- Login, logout, and protected session flow.
- Habit CRUD: create, edit, delete.
- Daily habit completion.
- Duplicate daily completion prevention.
- Streak calculation.
- Basic habit detail, history, and progress visualization.
- Local reminders.
- Settings and privacy notice access.
- Local persistence for account, session, habits, completions, reminders, and settings.

1. Main Modules
The artifacts consistently define these modules:

- Gestión de cuenta local: HU-01, RF-01, CP-01.
- Inicio y cierre de sesión: HU-02, HU-03, RF-02, RF-03, CP-02, CP-03.
- Gestión de hábitos: HU-04, HU-05, HU-06, RF-04, RF-05, RF-06, CP-04, CP-05, CP-06.
- Registro de cumplimiento diario: HU-07, RF-07, CP-07.
- Visualización de rachas, detalle y progreso: HU-08, HU-09, RF-08, RF-09, CP-08, CP-09.
- Recordatorios locales: HU-10, RF-10, CP-10.
- Configuración y aviso de privacidad: HU-11, RF-11, CP-11.
- Local persistence layer: required across all modules, especially account/session/habits/completions/reminders.

1. Suggested Implementation Order
1. Clean setup and foundation: Expo compatibility, navigation shell, module folders, local persistence abstraction, test setup, traceability convention.
1. HU-01: local account registration.
1. HU-02: login and session persistence.
1. HU-03: logout and protected private screens.
1. HU-11: privacy notice access, because HU-01 depends on privacy acceptance.
1. HU-04: create habit and empty state.
1. HU-05: edit habit while preserving ID/history.
1. HU-06: delete habit and remove it from related views/reminders.
1. HU-07: mark daily completion, prevent duplicate completion, recalculate streak.
1. HU-08: habit detail, current streak, basic history.
1. HU-09: basic progress visualization.
1. HU-10: local reminders, permissions, create/edit/delete reminder.
1. Traceability Pattern
Use one implementation record per story/change:
HU RF RNF CP Scope Files changed Validation
HU-04 RF-04, RF-04.1, RF-04.2, RF-04.3, RF-04.4 RNF-04, RNF-04.1, RNF-04.2 CP-04 Create habit screen, business logic, persistence, tests npm test, Expo checks if applicable
Recommended rule:

- Every feature PR/change should cite HU + RF/RNF + CP.
- Business logic tests should map to RF/RNF behavior.
- UI/integration tests or manual checks should map to CP happy, alternate, and failure paths.
- Final validation should report files changed, commands run, result, and remaining risks.

1. Recommended Next User Story After Clean Setup
HU-01: Registrar una cuenta local.
Reason: it is the first functional dependency for the app. Login, protected sessions, habit ownership, privacy acceptance, and local persistence all build naturally from it.
Recommended first traceability target:

- HU-01
- RF-01, RF-01.1, RF-01.2, RF-01.3, RF-01.4
- RNF-01, RNF-01.1, RNF-01.2
- CP-01

1. Inconsistencies Or Risks

- Persistence conflict: user stories mention local Postgres as the main local persistence mechanism, while the lifecycle document treats Postgres mainly as future/evolution architecture. For an Expo local-first iOS MVP, embedded Postgres is a technical risk and should be clarified before implementation.
- Traceability gap: the test plan matrix maps CP to RF, but not to HU or RNF; AGENTS requires full HU/RF/RNF/CP traceability.
- Template leftovers: some artifact text references “Endure” and “BienaTech”, which appears inconsistent with Kontrol/Chiapanecos.
- Role wording issues: HU-02 and HU-06 describe the actor as “usuario nuevo” where “usuario registrado” or “usuario del sistema” would be more accurate.
- Test statuses are all pending, so there is no current validation evidence.
- Local reminders depend on notification permissions and Expo-compatible APIs; implementation should avoid native dependencies or ejecting.
- Privacy notice is both required during registration and accessed from settings, so HU-01 has a dependency on at least minimal HU-11 content/availability.
