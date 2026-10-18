/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { LessonsPage } from './pages/LessonsPage';
import { LessonDetailPage } from './pages/LessonDetailPage';
import { PracticeChatPage } from './pages/PracticeChatPage';
import { QuizPage } from './pages/QuizPage';
import { ProfilePage } from './pages/ProfilePage';
import { AboutPage } from './pages/AboutPage';
import { LoginPage } from './pages/LoginPage';
import { Footer } from './components/Footer';
import { VoiceNoticeBanner } from './components/VoiceNoticeBanner';
import { Lesson, SavedWord, UserProfile, UserStats, WeeklyDayActivity, DailyPhrase, Phrase } from './types';
import { api } from './services/api';
import { useAuth } from './context/AuthContext';
import { firestoreService, UserLessonProgress, QuizRecord, PracticeSessionRecord, normalizeLessonId } from './services/firestoreService';

export default function App() {
  const { user, userData, loading: authLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('market');
  const [selectedQuizLessonId, setSelectedQuizLessonId] = useState<string | null>(null);
  const [chatScenarioId, setChatScenarioId] = useState<string>('market-chat');

  // Loading and error states for lesson definitions from API
  const [rawLessons, setRawLessons] = useState<Lesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState<boolean>(true);
  const [lessonsError, setLessonsError] = useState<string | null>(null);

  // Firestore real-time state
  const [progressMap, setProgressMap] = useState<Record<string, UserLessonProgress>>({});
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [quizResults, setQuizResults] = useState<QuizRecord[]>([]);
  const [practiceSessions, setPracticeSessions] = useState<PracticeSessionRecord[]>([]);

  // Daily phrase state
  const [dailyPhrase, setDailyPhrase] = useState<DailyPhrase>({
    kannada: 'ನಮಸ್ಕಾರ',
    roman: 'Namaskara',
    meaning: 'Hello / Greetings',
    hindi: 'Namaste',
    tip: 'Everyday polite greeting to start any interaction warmly.',
    scenarioTitle: 'Market',
    scenarioEmoji: '🛒'
  });

  // Voice notice banner state
  const [showVoiceNotice, setShowVoiceNotice] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch raw lessons summary list and daily phrase from Express backend
  const loadLessonsFromApi = useCallback(async () => {
    try {
      setLoadingLessons(true);
      setLessonsError(null);
      const [fetchedLessons, fetchedDaily] = await Promise.all([
        api.getLessons(),
        api.getDailyPhrase().catch(() => null)
      ]);

      if (fetchedLessons?.length) {
        setRawLessons(fetchedLessons);
      }
      if (fetchedDaily) {
        setDailyPhrase(fetchedDaily);
      }
    } catch (err: any) {
      console.error('Failed to load lessons from server:', err);
      setLessonsError(err?.message || 'Could not connect to the backend server.');
    } finally {
      setLoadingLessons(false);
    }
  }, []);

  useEffect(() => {
    loadLessonsFromApi();
  }, [loadLessonsFromApi]);

  // 2. Real-time Firestore subscriptions for authenticated user
  useEffect(() => {
    if (!user) {
      setProgressMap({});
      setSavedWords([]);
      setQuizResults([]);
      setPracticeSessions([]);
      return;
    }

    const unsubProgress = firestoreService.subscribeUserProgress(
      user.uid,
      (map) => setProgressMap(map),
      (err) => console.warn('Progress listener notice:', err)
    );

    const unsubSaved = firestoreService.subscribeSavedWords(
      user.uid,
      (words) => setSavedWords(words),
      (err) => console.warn('Saved words listener notice:', err)
    );

    const unsubQuiz = firestoreService.subscribeQuizResults(
      user.uid,
      (results) => setQuizResults(results),
      (err) => console.warn('Quiz listener notice:', err)
    );

    const unsubPractice = firestoreService.subscribePracticeSessions(
      user.uid,
      (sessions) => setPracticeSessions(sessions),
      (err) => console.warn('Practice sessions listener notice:', err)
    );

    return () => {
      unsubProgress();
      unsubSaved();
      unsubQuiz();
      unsubPractice();
    };
  }, [user]);

  // 3. Merge API lesson structure with real user Firestore progress
  const lessons: Lesson[] = useMemo(() => {
    return rawLessons.map((lesson) => {
      const normId = normalizeLessonId(lesson.id);
      const userProg = progressMap[normId] || progressMap[lesson.id];
      const completedPhrases = userProg?.completedPhrases || [];
      const totalPhrases = lesson.phraseCount || lesson.totalPhrases || 8;
      const progressPercent = Math.min(100, Math.round((completedPhrases.length / totalPhrases) * 100));

      // Calculate status and badge from Firestore
      let status: 'completed' | 'in_progress' | 'not_started' | 'locked' = 'locked';
      let badge = '🔒 Locked';

      if (userProg) {
        if (userProg.status === 'done' || progressPercent >= 100) {
          status = 'completed';
          badge = '✅ Done';
        } else if (userProg.status === 'in_progress') {
          status = 'in_progress';
          badge = progressPercent > 0 ? '▶ Resume' : 'Start';
        } else {
          status = 'locked';
          badge = '🔒 Locked';
        }
      } else if (normId === 'market') {
        // Market defaults to unlocked for new users
        status = 'in_progress';
        badge = 'Start';
      }

      return {
        ...lesson,
        status,
        progress: progressPercent,
        completedPhrases: completedPhrases.length,
        totalPhrases,
        badge,
      };
    });
  }, [rawLessons, progressMap]);

  // 4. Calculate real user stats from Firestore (with null if no quiz yet)
  const stats: UserStats = useMemo(() => {
    const completedLessonsCount = lessons.filter((l) => l.status === 'completed').length;
    const streak = userData?.streak ?? (user ? 1 : 0);
    const savedCount = savedWords.length;

    let avgQuiz: number | null = null;
    if (quizResults.length > 0) {
      const totalScore = quizResults.reduce((acc, curr) => {
        const pct = curr.percentage ?? Math.round((curr.score / curr.total) * 100);
        return acc + pct;
      }, 0);
      avgQuiz = Math.round(totalScore / quizResults.length);
    }

    return {
      streakDays: streak,
      completedLessons: completedLessonsCount,
      totalLessons: lessons.length || 5,
      savedWordsCount: savedCount,
      avgQuizScore: avgQuiz,
    };
  }, [lessons, userData, user, savedWords, quizResults]);

  // 5. Calculate real weekly activity for Mon - Sun with real counts
  const weeklyActivity: WeeklyDayActivity[] = useMemo(() => {
    const now = new Date();
    // In JS: getDay() 0 is Sunday, 1 is Monday ... 6 is Saturday
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;

    const mondayDate = new Date(now);
    mondayDate.setDate(now.getDate() - distanceToMonday);

    const dayNames = [
      { name: 'Mon', short: 'M' },
      { name: 'Tue', short: 'T' },
      { name: 'Wed', short: 'W' },
      { name: 'Thu', short: 'T' },
      { name: 'Fri', short: 'F' },
      { name: 'Sat', short: 'S' },
      { name: 'Sun', short: 'S' },
    ];

    const todayStr = now.toLocaleDateString('en-CA');

    return dayNames.map((d, index) => {
      const dayDate = new Date(mondayDate);
      dayDate.setDate(mondayDate.getDate() + index);
      const dateKey = dayDate.toLocaleDateString('en-CA');
      const isToday = dateKey === todayStr;

      // Count quizzes on this calendar date
      const quizzesOnDay = quizResults.filter((q) => {
        return q.date && q.date.startsWith(dateKey);
      }).length;

      // Count AI practice sessions on this calendar date
      const sessionsOnDay = practiceSessions.filter((s) => {
        return s.date && s.date.startsWith(dateKey);
      }).length;

      // Count lesson updates / completions on this calendar date
      const lessonsOnDay = Object.values(progressMap).filter((p) => {
        return p.updatedAt && p.updatedAt.startsWith(dateKey);
      }).length;

      const totalDayCount = quizzesOnDay + sessionsOnDay + lessonsOnDay;

      return {
        day: d.name,
        short: d.short,
        minutes: totalDayCount * 10,
        count: totalDayCount,
        target: 3,
        isToday,
      };
    });
  }, [quizResults, practiceSessions, progressMap]);

  // Set of saved word IDs for fast lookup in phrase cards
  const savedWordIds = useMemo(() => {
    return new Set(savedWords.map((w) => w.id));
  }, [savedWords]);

  // User Profile details
  const userProfile: UserProfile = useMemo(() => {
    const name = userData?.name || user?.displayName || 'Learner';
    return {
      name,
      email: userData?.email || user?.email || '',
      avatarInitials: name.charAt(0).toUpperCase() || 'K',
      joinedDate: userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' }) : 'October 2026',
      dailyGoalMinutes: 15,
    };
  }, [user, userData]);

  // Handlers for Firestore data mutations
  const handleSaveWord = async (phrase: Phrase) => {
    if (!user) return;
    try {
      await firestoreService.saveWord(user.uid, phrase);
      showToast(`Saved "${phrase.kannada}" (${phrase.roman}) to vocabulary!`);
    } catch (err) {
      console.error('Error saving word to Firestore:', err);
      showToast('Could not save word. Please try again.');
    }
  };

  const handleUnsaveWord = async (phraseId: string) => {
    if (!user) return;
    try {
      await firestoreService.removeWord(user.uid, phraseId);
      showToast('Word removed from saved list');
    } catch (err) {
      console.error('Error removing word from Firestore:', err);
    }
  };

  const handleTogglePhraseComplete = async (phraseId: string) => {
    if (!user) return;
    try {
      await firestoreService.togglePhraseCompletion(user.uid, selectedLessonId, phraseId, 8);
      // Update streak for active learning
      await firestoreService.updateStreakOnActivity(user.uid);
    } catch (err) {
      console.error('Error toggling phrase completion in Firestore:', err);
    }
  };

  const handleSelectLesson = (lessonId: string) => {
    setSelectedLessonId(normalizeLessonId(lessonId));
    setActiveTab('lesson-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartChat = (scenarioId?: string) => {
    if (scenarioId) {
      setChatScenarioId(scenarioId);
    }
    setActiveTab('practice');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTakeQuiz = (lessonId: string) => {
    setSelectedQuizLessonId(normalizeLessonId(lessonId));
    setActiveTab('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If Auth state is resolving, show friendly loading splash
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FFF8E1] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-[#FFC107] text-3xl flex items-center justify-center shadow-md animate-bounce mb-4 border border-[#FFE082]">
          🪔
        </div>
        <h2 className="text-xl font-bold text-[#B71C1C]">KannadaKali</h2>
        <p className="text-xs text-[#6B5B4B] mt-1 font-kannada">ಕನ್ನಡ ಕಲಿ · Loading your session...</p>
      </div>
    );
  }

  // PROTECTED ROUTE: If not authenticated, redirect to Login
  if (!user) {
    return <LoginPage />;
  }

  const normSelectedId = normalizeLessonId(selectedLessonId);
  const selectedLesson = lessons.find((l) => normalizeLessonId(l.id) === normSelectedId);
  const currentLessonProgress = progressMap[normSelectedId] || progressMap[selectedLessonId];
  const completedPhraseIdsForSelected = currentLessonProgress?.completedPhrases || [];
  const firstName = userProfile.name.split(' ')[0] || 'Friend';

  return (
    <div className="min-h-screen bg-[#FFF8E1] text-[#2B2B2B] flex flex-col font-sans selection:bg-[#FFC107] selection:text-[#B71C1C]">
      {/* Navbar: Yellow Bar, Real User Google Photo/Name, Logout Button */}
      <Navbar
        activeTab={activeTab === 'lesson-detail' ? 'lessons' : activeTab}
        onNavigate={(tab) => {
          if (tab === 'quiz') {
            setSelectedQuizLessonId(null);
          }
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        userName={firstName}
        photoURL={userData?.photoURL || user.photoURL || undefined}
        avatarInitial={userProfile.avatarInitials}
        onLogout={logout}
      />

      {/* Main Content Area - max 1200px centered */}
      <main key={activeTab} className="flex-1 max-w-[1200px] w-full mx-auto px-4 pt-6 pb-20 md:pb-12 page-transition">
        {activeTab === 'home' && (
          <HomePage
            userName={firstName}
            stats={stats}
            lessons={lessons}
            loadingLessons={loadingLessons}
            lessonsError={lessonsError}
            onRetryLessons={loadLessonsFromApi}
            savedWords={savedWords}
            weeklyActivity={weeklyActivity}
            dailyPhrase={dailyPhrase}
            onSelectLesson={handleSelectLesson}
            onStartChat={() => handleStartChat('market-chat')}
            onSaveWord={(p) => handleSaveWord({ ...p, id: `sw-daily-${Date.now()}` } as Phrase)}
            onRemoveWord={handleUnsaveWord}
            onVoiceMissing={() => setShowVoiceNotice(true)}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'lessons' && (
          <LessonsPage
            lessons={lessons}
            loading={loadingLessons}
            error={lessonsError}
            onRetry={loadLessonsFromApi}
            onSelectLesson={handleSelectLesson}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'lesson-detail' && (
          <LessonDetailPage
            lessonId={selectedLessonId}
            initialLesson={selectedLesson}
            savedWordIds={savedWordIds}
            completedPhraseIds={completedPhraseIdsForSelected}
            onBack={() => setActiveTab('lessons')}
            onSaveWord={handleSaveWord}
            onUnsaveWord={handleUnsaveWord}
            onToggleCompletePhrase={handleTogglePhraseComplete}
            onTakeQuiz={handleTakeQuiz}
            onVoiceMissing={() => setShowVoiceNotice(true)}
            onStartChatWithScenario={(scId) => handleStartChat(scId)}
          />
        )}

        {activeTab === 'practice' && (
          <PracticeChatPage
            initialScenarioId={chatScenarioId}
            onBackToHome={() => setActiveTab('home')}
            onVoiceMissing={() => setShowVoiceNotice(true)}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizPage
            initialLessonId={selectedQuizLessonId}
            lessons={lessons}
            quizHistory={quizResults}
            onVoiceMissing={() => setShowVoiceNotice(true)}
            onBackToLessons={() => setActiveTab('lessons')}
            onShowToast={showToast}
            onQuizFinished={({ percentage }) => {
              if (percentage >= 60) {
                showToast('🎉 Lesson Mastered! Next scenario unlocked.');
              } else {
                showToast('Quiz recorded. Keep practicing to score 60% or higher!');
              }
            }}
          />
        )}

        {activeTab === 'profile' && (
          <ProfilePage
            user={userProfile}
            stats={stats}
            photoURL={userData?.photoURL || user.photoURL || undefined}
            savedWords={savedWords}
            quizHistory={quizResults}
            onDeleteSavedWord={handleUnsaveWord}
            onLogout={logout}
            onVoiceMissing={() => setShowVoiceNotice(true)}
          />
        )}

        {activeTab === 'about' && (
          <AboutPage
            onBackToHome={() => {
              setActiveTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToTab={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>

      {/* Global Footer */}
      <Footer
        onNavigate={(tab) => {
          if (tab === 'quiz') setSelectedQuizLessonId(null);
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        activeTab={activeTab}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#2B2B2B] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg border border-[#FFE082] flex items-center gap-2 animate-in fade-in slide-in-from-top duration-200">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Voice Missing Notice Banner */}
      <VoiceNoticeBanner
        isOpen={showVoiceNotice}
        onClose={() => setShowVoiceNotice(false)}
      />
    </div>
  );
}
