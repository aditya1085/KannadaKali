# 🪔 KannadaKali (ಕನ್ನಡ ಕಲಿ)
> **Code. Create. Celebrate Kannada.**
> Built for the **Kannada Digital Innovation Hackathon 2026** by **Aditya Tripathi** ([adityatripathi102930@gmail.com](mailto:adityatripathi102930@gmail.com)).

KannadaKali is an interactive, practical language learning web platform designed specifically for non-Kannada speakers living, working, and studying in Karnataka. Rather than focusing on abstract grammar drills, KannadaKali empowers newcomers, students, tech professionals, and travellers to navigate daily street, workplace, and market interactions with confidence, warmth, and cultural respect.

---

## 🌟 Key Features

1. **5 Real-World Scenario Lessons**
   - **Market (ತರಕಾರಿ ಮಾರುಕಟ್ಟೆ)**: Bargaining, buying vegetables, asking prices, UPI payment.
   - **Bus & Auto (ಬಸ್ ಮತ್ತು ಆಟೋ)**: Meter fares, destination confirmation, stopping politely.
   - **Darshini Restaurant (ಉಪಾಹಾರ ಗೃಹ)**: Ordering filter coffee, masala dose, requesting the bill.
   - **Hospital & Clinic (ಆಸ್ಪತ್ರೆ)**: Explaining common symptoms, locating pharmacies.
   - **Office & Workplace (ಕಚೇರಿ)**: Professional greetings, water cooler chats, polite requests.
   - Each lesson features 8 practical spoken phrases with Kannada script, Roman phonetic transliteration, English translation, Hinglish meaning, and everyday usage tips.

2. **High-Fidelity Kannada Audio Pronunciation (Server-side TTS + Fallbacks)**
   - Powered by `POST /api/tts` on Express using Gemini Text-to-Speech (`gemini-3.8-flash-lite-tts`) with Google Cloud Text-to-Speech (`kn-IN` voice) fallback.
   - SHA-256 hashed disk + in-memory audio caching for instantaneous re-plays and zero quota waste.
   - Fallback hierarchy: Server-side Kannada audio -> Web Speech API (`kn-IN`, then `hi-IN`) -> Graceful non-blocking feedback.
   - Unified `AudioButton` component used everywhere 🔊 appears, complete with loading spinners, active playing states, quick-tap cancellation, and a 🐢 slow (0.75x) mode for learners.

3. **AI Practice Chat (Gemini 3.8 Flash)**
   - Simulated roleplays with a friendly vegetable vendor, auto driver, or colleague.
   - Provides real-time Kannada conversational replies, Roman transliteration, constructive grammar/vocabulary corrections, and a *"What should I say?"* AI hint generator.
   - Calls `@google/genai` exclusively from the Node.js Express server with zero client-side API key exposure.

4. **Scenario Quizzes & Progressive Unlocking System**
   - 5 multiple-choice questions per scenario generated deterministically from lesson phrases (Kannada to English, English to Kannada, Roman to meaning).
   - Instant visual feedback, correct answer reveals, and native audio playback on questions.
   - Scoring **60% or higher** marks the lesson complete, triggers celebratory confetti, records the score to Firestore, and unlocks the next scenario in sequence (`Market` ➔ `Bus/Auto` ➔ `Restaurant` ➔ `Hospital` ➔ `Office`).

5. **Real Streak & Weekly Progress Tracking**
   - Deterministic streak calculation based on user's local date. Increases on consecutive active days and resets to 1 if a full day is missed.
   - Interactive Monday-to-Sunday weekly activity bar chart reflecting actual completed quizzes, lessons, and AI conversations with count tooltips.

6. **Vocabulary Bookmarks**
   - One-tap bookmarking to save useful words into a personal vocabulary bank on the Profile page, complete with listen and delete actions.

7. **Firebase Authentication & Secure Firestore Storage**
   - Google Sign-In with protected routes and guest fallback mode.
   - Attribute-Based Access Control (ABAC) in `firestore.rules` ensuring users can only read and write their own records.

8. **Hackathon About Page & Responsive Design**
   - Full responsive layout across 390px mobile screens and 1280px desktops.
   - Mobile bottom navigation bar (Home, Lessons, Chat, Quiz, Profile) and desktop header bar.
   - Hackathon project showcase page detailing project motivation, target audience, and architecture.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, AudioButton
- **Backend**: Node.js 22, Express REST API, Gemini TTS, Google Cloud TTS
- **Database & Auth**: Firebase Authentication (Google Sign-In), Cloud Firestore
- **AI Engine**: Google Gemini 3.8 Flash via `@google/genai` (Server-side proxy routes)
- **Tooling**: Vite 8, tsx, ESLint / TypeScript compiler

---

## 🏛️ System Architecture

```text
┌────────────────────────────────────────────────────────┐
│             React 19 SPA (Client-side)                 │
│  - Responsive UI (390px phone to 1280px desktop)       │
│  - Firebase Auth (Google Sign-In + Guest Mode)         │
│  - Unified AudioButton with Slow (0.75x) Mode          │
└───────────────────────────┬────────────────────────────┘
                            │ REST calls with Bearer Token
                            ▼
┌────────────────────────────────────────────────────────┐
│             Node.js / Express Server                   │
│  - GET /api/lessons, GET /api/lessons/:id              │
│  - POST /api/chat (Server-side Gemini AI roleplay)     │
│  - POST /api/tts (Gemini & Cloud TTS + Disk Cache)     │
│  - POST /api/quiz/submit (Token validation + metrics)  │
│  - GET / POST /api/progress (Sync & streak management) │
└─────────────┬────────────────────────────┬─────────────┘
              │                            │
              ▼                            ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│    Firebase Firestore    │  │     Google Gemini API    │
│  - users/{uid}           │  │  - gemini-3.8-flash      │
│  - progress/{lessonId}   │  │  - gemini-3.8-flash-lite │
│  - savedWords/{phraseId} │  │  - Contextual roleplay   │
│  - quizResults/{autoId}  │  │  - Natural Kannada speech│
└──────────────────────────┘  └──────────────────────────┘
```

---

## 📁 Folder Structure

```
├── .env.example              # Template for environment variables
├── data/
│   ├── chatScenarios.json    # Persona and system prompts for roleplay
│   ├── lessons.json          # 5 scenarios with 8 practical phrases each
│   └── savedWords.json       # Initial seed vocabulary
├── firebase-applet-config.json # Firebase project identifiers
├── firebase-blueprint.json   # Schema definitions for collections
├── firestore.rules           # Security rules for user isolation
├── index.html                # HTML entry point with meta tags & favicon
├── metadata.json             # Applet capabilities and metadata
├── package.json              # Project dependencies and build scripts
├── server.ts                 # Express fullstack server entry point
├── server/
│   └── routes.ts             # REST API routes (/api/lessons, /api/chat, etc.)
└── src/
    ├── App.tsx               # Root component with state & tab routing
    ├── components/
    │   ├── DailyPhraseCard.tsx
    │   ├── Footer.tsx        # Global footer with hackathon credits
    │   ├── LoadingSkeleton.tsx # Skeletons and friendly error states
    │   ├── Navbar.tsx        # Responsive top navbar & mobile bottom bar
    │   ├── PracticeChatPromoCard.tsx
    │   ├── SavedWordsCard.tsx
    │   ├── ScenarioCard.tsx
    │   ├── StatCards.tsx     # 4 metrics: Streak, Lessons, Saved, Quiz Avg
    │   ├── VoiceNoticeBanner.tsx # Speech pack installation guide
    │   └── WeeklyProgressChart.tsx # Mon-Sun interactive activity chart
    ├── context/
    │   └── AuthContext.tsx   # Firebase Google auth provider
    ├── lib/
    │   └── firebase.ts       # Client Firebase SDK initialization
    ├── pages/
    │   ├── AboutPage.tsx     # Hackathon submission showcase & architecture
    │   ├── HomePage.tsx      # Dashboard with greeting & scenario cards
    │   ├── LessonDetailPage.tsx # Scenario phrases, listen & complete
    │   ├── LessonsPage.tsx   # Scenario grid with unlock status
    │   ├── LoginPage.tsx     # Branded Google sign-in page
    │   ├── PracticeChatPage.tsx # AI scenario conversation simulator
    │   ├── ProfilePage.tsx   # User profile, saved words & quiz history
    │   └── QuizPage.tsx      # 5-question multiple choice scenario quiz
    ├── services/
    │   ├── api.ts            # Client API client for Express endpoints
    │   └── firestoreService.ts # Realtime Firestore listeners & mutations
    ├── types/
    │   └── index.ts          # Shared TypeScript interfaces
    └── utils/
        └── speech.ts         # Web Speech API wrapper for kn-IN
```

---

## ⚙️ Environment Variables

Create a `.env` file in the project root based on `.env.example`:

```env
# Client Firebase Configuration (Required for Auth & Firestore)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_APP_ID=1:555472133860:web:...
VITE_FIREBASE_AUTH_DOMAIN=wired-space-nmn89.firebaseapp.com
VITE_FIREBASE_DATABASE_ID=ai-studio-kannadakalilearn-76bb563e-f69a-4cf3-815f-6d0ef4648280
VITE_FIREBASE_PROJECT_ID=wired-space-nmn89
VITE_FIREBASE_STORAGE_BUCKET=wired-space-nmn89.firebasestorage.app

# Server-Side Gemini API Key (Required for AI Practice Chat)
GEMINI_API_KEY=AIzaSy...

# Optional Server Port (Defaults to 3000)
PORT=3000
```

---

## 🚀 Running the App

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode
Starts the Express server with Vite middleware on `http://localhost:3000`:
```bash
npm run dev
```

### 3. Build for Production
Compiles frontend assets to `/dist`:
```bash
npm run build
```

### 4. Run Production Server
Serves static assets from `/dist` and mounts Express REST API endpoints:
```bash
npm start
```

---

## 🚢 Deployment Guide & Post-Deploy Checklist

### Step 1: Deploy to Google Cloud Run / AI Studio
1. Click the **Deploy** button in the AI Studio Build interface.
2. Ensure the environment variables from `.env.example` are configured in your Cloud Run service secrets:
   - `GEMINI_API_KEY` (Secret environment variable)
   - `NODE_ENV=production`

### Step 2: Configure Firebase Authorized Domains
Google Sign-In will only function on authorized domains:
1. Open the [Firebase Console](https://console.firebase.google.com/project/wired-space-nmn89/authentication/settings).
2. Navigate to **Authentication ➔ Settings ➔ Authorized Domains**.
3. Click **Add Domain** and add:
   - Your production domain (e.g., `your-app-xxxx.run.app` or custom domain).
   - The AI Studio preview domain (`ais-pre-*.run.app` and `ais-dev-*.run.app`).

### Step 3: Deploy Firestore Security Rules
Ensure `firestore.rules` is active:
```bash
firebase deploy --only firestore:rules
```

### Step 4: Post-Deploy Verification Checklist
- [ ] Open the live application URL in both mobile (e.g., iPhone/Android) and desktop browsers.
- [ ] Sign in with Google: Confirm user profile picture, name, and initial streak appear.
- [ ] Explore the **Market** scenario: Tap 🔊 on phrases to verify Kannada speech output.
- [ ] Mark phrases as learned and verify real progress bar updates.
- [ ] Take the **Market Quiz**: Complete all 5 questions, confirm score calculation, and verify the **Bus / Auto** scenario unlocks upon scoring ≥ 60%.
- [ ] Open **Practice Chat**: Test an AI conversation scenario and verify Gemini replies with corrections.
- [ ] Visit the **About** page: Confirm hackathon project details, architecture diagram, and author attribution are visible.
