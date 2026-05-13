# Kontrol

**Kontrol** is a minimalist habit-tracking mobile application built with **Expo** and **React Native**. The app is designed for users who want to track daily habits quickly, clearly, and without unnecessary complexity.

Kontrol focuses on a clean iOS-inspired experience where users can register locally, create habits, mark daily completion, view streaks, check progress, configure reminders, and keep their data stored on the device.

---

## Overview

Many habit-tracking apps become difficult to maintain because they include too many features, crowded screens, or long interaction flows. Kontrol takes a different approach: it prioritizes simplicity, speed, and visual clarity.

The goal of the app is to help users answer three questions quickly:

- What habits do I need to complete today?
- Which habits have I already completed?
- How consistent have I been over time?

Kontrol is currently focused on a local-first MVP. This means the app does not depend on a backend, cloud synchronization, social features, widgets, or external device integrations.

---

## Main Features

### Local Account Management

Users can create a local account using an email and password. The app validates the registration form, requires acceptance of the privacy notice, and stores the account locally.

### Login and Session Flow

Users must log in before accessing private app screens. If an active session exists, the app redirects the user directly to the main habits screen.

### Protected App Screens

The following screens are protected and require an active session:

- Habits home
- Create habit
- Edit habit
- Habit detail
- Progress
- Reminders
- Settings

Unauthenticated users are redirected to the login screen.

### Habit Management

Users can create, edit, delete, and view habits. Each habit can include information such as name, frequency, category, goal, and reminder configuration depending on the current implementation scope.

### Daily Completion Tracking

Users can mark a habit as completed for the current day. The app prevents duplicate completion records for the same habit on the same date.

### Streaks and Progress

Kontrol calculates and displays basic progress indicators based on locally stored completion records. The app is designed to present progress in a simple, legible, and minimal way.

### Local Reminders

Users can configure local reminders to support habit consistency. Reminder behavior depends on the device notification permissions.

### Privacy Notice

The privacy notice is available from the app and must be accepted during registration.

---

## Tech Stack

- **Expo**
- **React Native**
- **TypeScript**
- **Expo Router**
- **Local persistence**
- **Local notifications**
- **React Context for session/auth state**

---

## Project Scope

### Included in the MVP

- Local account registration
- Login and logout
- Session persistence
- Protected navigation
- Habit creation
- Habit editing
- Habit deletion
- Daily habit completion
- Habit detail view
- Basic streak tracking
- Basic progress view
- Local reminders
- Settings screen
- Privacy notice screen
- Minimal iOS-inspired UI

### Out of Scope

The current MVP does not include:

- Cloud synchronization
- Backend API
- Social features
- Habit sharing
- iOS widgets
- Apple Watch integration
- Advanced predictive analytics
- External device integrations

---
