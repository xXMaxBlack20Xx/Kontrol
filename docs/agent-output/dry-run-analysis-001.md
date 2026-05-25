1. MVP Scope Summary
Kontrol is an iOS-focused habit tracker built with React Native + Expo. The updated plan keeps the app local-first while adding a secure Azure backend for authentication, synchronization, photos, remote notifications, and monitoring.

In scope:

- Local-first habit tracking that continues working without internet.
- Custom authentication built into Azure Functions (JWT + argon2) for registration, login, account recovery, and JWT issuance.
- Azure Functions as the only secure backend entry point for cloud services.
- Azure Cosmos DB for NoSQL for cloud data: users, habits, completions, reminders, devices, and photo metadata.
- Azure Blob Storage for private profile or habit photos.
- Azure Notification Hubs for native APNs/FCM v1 push notifications.
- Application Insights for backend logs and diagnostics.
- No Cosmos DB, Storage, or Notification Hubs secrets inside Expo.

Out of scope:

- Social features.
- iOS widgets.
- Apple Watch integration.
- Predictive analytics.
- Real-time multi-device synchronization.
- Direct mobile access to Cosmos DB, Blob Storage, or Notification Hubs using private keys.

1. Main Modules
The artifacts now define these modules:

- Gestión de cuenta y autenticación cloud: HU-01, HU-02, HU-03, HU-12, RF-01, RF-02, RF-03, RF-12, CP-01, CP-02, CP-03, CP-12.
- Gestión de hábitos local-first y sincronización: HU-04, HU-05, HU-06, HU-13, RF-04, RF-05, RF-06, RF-13, CP-04, CP-05, CP-06, CP-13.
- Registro de cumplimiento diario y progreso: HU-07, HU-08, HU-09, RF-07, RF-08, RF-09, RF-13, CP-07, CP-08, CP-09, CP-13.
- Recordatorios locales y push remotas: HU-10, HU-15, RF-10, RF-15, CP-10, CP-15.
- Fotos privadas: HU-14, RF-14, CP-14.
- Configuración y aviso de privacidad: HU-11, RF-11, CP-11.
- Observabilidad: HU-16, RF-16, CP-16.

1. Suggested Implementation Order
1. Azure foundation: Resource Group, Azure Functions, Cosmos DB, Storage Account, Notification Hubs, Application Insights.
1. Backend foundation: Azure Functions Runtime 4.x with Node.js 22, `GET /api/health`, Application Settings, and Application Insights.
1. Custom auth implementation: argon2 password hashing, JWT access + refresh tokens, `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`.
1. Cosmos DB integration: database `kontrol-db`, containers `authUsers`, `users`, `refreshTokens`, then `habits`, `habitCompletions`, etc.
1. App Expo auth: API client with JWT storage in SecureStore, protected routes, auth context.
1. Local-first sync: pending operation queue and retry when connectivity returns.
1. Photos: private `user-photos` container, `POST /api/photos/upload-url`, metadata in Cosmos DB.
1. Devices and notifications: native token with `getDevicePushTokenAsync`, `POST /api/devices/register`, `POST /api/notifications/send-test`.
1. Privacy and testing: update privacy notice and execute CP-12 through CP-16.

1. Traceability Pattern
Use one implementation record per story/change:
HU RF RNF CP Scope Files changed Validation
HU-13 RF-13, RF-13.1, RF-13.2, RF-13.3 RNF-13 CP-13 Local-first sync, Azure Functions endpoints, Cosmos DB containers npm test, API validation, Expo checks if applicable

Recommended rule:

- Every feature PR/change should cite HU + RF/RNF + CP.
- Business logic tests should map to RF/RNF behavior.
- API/integration checks should map to CP happy, alternate, and failure paths.
- Final validation should report files changed, commands run, result, and remaining risks.

1. Recommended Next Step
Step 2: Backend authentication API (custom JWT + argon2 inside Azure Functions).

Expected backend environment variables after this step:

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `AZURE_COSMOS_ENDPOINT`
- `AZURE_COSMOS_KEY`
- `AZURE_COSMOS_DATABASE_ID`

Expo only needs:

- `EXPO_PUBLIC_API_BASE_URL`

Do not add backend secrets to Expo:

- `AZURE_COSMOS_KEY`
- `AZURE_STORAGE_CONNECTION_STRING`
- `AZURE_NOTIFICATION_HUB_CONNECTION_STRING`

1. Inconsistencies Or Risks

- Expo Go cannot validate native push tokens for Notification Hubs; use development builds or native builds.
- The backend must reject requests without valid JWT before querying Cosmos DB, Blob Storage, or Notification Hubs.
- Cosmos DB, Blob Storage, and Notification Hubs credentials must stay in Azure Functions Application Settings, with Managed Identity and Key Vault as future hardening.
- The app must remain usable without internet, so cloud failures should not block local habit operations.
- The privacy notice must disclose Azure storage of app data and custom authentication.
- The current documentation defines custom JWT + argon2 authentication in Azure Functions, without Microsoft Entra External ID, Azure AD B2C, external tenants, or mobile App Registration. See `docs/architecture/fase-2-backend-autenticacion.md`.
