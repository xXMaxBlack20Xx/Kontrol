# Kontrol

Kontrol is an Expo app for tracking daily habits, local progress, and optional reminders.

## Development

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

3. Run tests

   ```bash
   npm test
   ```

## Current App

The active app is organized around:

- `app/(auth)/` for login, registration, and the privacy notice.
- `app/(app)/_layout.tsx` for the protected private app area.
- `app/(app)/(tabs)/habits/`, `progress.tsx`, `reminders.tsx`, and `settings.tsx` for private tabs.
- `app/(app)/habits/` for private habit creation, detail, and editing routes.
- `features/` for account, habit, completion, and reminder logic.

Authentication remains local-only. Password hashing uses `expo-crypto`, and the active session uses
`expo-secure-store` when the device supports it.

Android Expo Go does not support `expo-notifications` remote notification functionality in SDK 53+.
Reminder scheduling is guarded in Expo Go and should be tested with a development build.
