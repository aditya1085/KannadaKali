# KannadaKali (ಕನ್ನಡ ಕಲಿ) 🪔

A modern, practical Kannada learning platform designed specifically for non-Kannada speakers to master everyday conversational Kannada through real-world scenarios.

## Features Implemented

### Step 3: Real Authentication & Firestore Database
- **Firebase Authentication (Google Sign-In)**:
  - Clean branded `LoginPage` styled in the KannadaKali theme with 🪔 logo and "Sign in with Google" button.
  - Protected routes: Unauthenticated visitors are automatically directed to Login.
  - Real user Google profile photo and first name displayed in the Navbar and greeting (`🙏 Namaskara, <Name>!`).
  - One-click Logout action in Navbar and Profile page.
- **Firestore Collections & Real Data**:
  - `users/{uid}`: Profile details, real daily streak, and last active timestamp.
  - `users/{uid}/progress/{lessonId}`: Real completion array and scenario status (`in_progress`, `done`, `locked`).
  - `users/{uid}/savedWords/{phraseId}`: Real personal saved vocabulary bank with instant bookmark/remove.
  - `users/{uid}/quizResults/{autoId}`: Real quiz attempts, calculating genuine average accuracy.
- **Zero Dummy Numbers & Real-Time Sync**:
  - On first sign-in, the user document and Market scenario are unlocked; all other scenarios start locked.
  - Completing all 8 phrases in a scenario automatically marks it `done` and unlocks the next scenario.
  - Real dashboard stats (0 values and friendly empty states like *"No saved words yet"* for new learners).
  - Dynamic weekly activity bar chart reflecting real practice.
- **Hardened Security Rules (`firestore.rules`)**:
  - Users can read and write exclusively their own documents and subcollections (`request.auth.uid == userId`). Default-deny for all other access.

### Manual Setup Steps (if needed)

If Google Sign-In gives a configuration popup error on first click:
1. Open the [Firebase Console](https://console.firebase.google.com/project/wired-space-nmn89/authentication/providers).
2. Go to **Authentication > Sign-in method**:
   - Ensure **Google** is enabled.
   - Verify a project support email is selected.
3. In **Authentication > Settings > Authorized domains**:
   - Verify that your applet domain (`*.run.app`) is listed in the authorized domains list.

## Running the App

```bash
# Development (Express + Vite on port 3000)
npm run dev

# Build
npm run build
```
