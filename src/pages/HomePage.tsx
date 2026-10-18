import React from 'react';
import { StatCards } from '../components/StatCards';
import { DailyPhraseCard } from '../components/DailyPhraseCard';
import { ScenarioCard } from '../components/ScenarioCard';
import { PracticeChatPromoCard } from '../components/PracticeChatPromoCard';
import { WeeklyProgressChart } from '../components/WeeklyProgressChart';
import { SavedWordsCard } from '../components/SavedWordsCard';
import { ScenarioCardSkeleton, ErrorStateView } from '../components/LoadingSkeleton';
import { Lesson, SavedWord, UserStats, WeeklyDayActivity, DailyPhrase } from '../types';

interface HomePageProps {
  userName?: string;
  stats: UserStats;
  lessons: Lesson[];
  loadingLessons?: boolean;
  lessonsError?: string | null;
  onRetryLessons?: () => void;
  savedWords: SavedWord[];
  weeklyActivity: WeeklyDayActivity[];
  dailyPhrase?: DailyPhrase;
  onSelectLesson: (lessonId: string) => void;
  onStartChat: () => void;
  onSaveWord: (word: { kannada: string; roman: string; english: string }) => void;
  onRemoveWord: (id: string) => void;
  onVoiceMissing: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  userName = 'Aditya',
  stats,
  lessons,
  loadingLessons = false,
  lessonsError = null,
  onRetryLessons,
  savedWords,
  weeklyActivity,
  dailyPhrase,
  onSelectLesson,
  onStartChat,
  onSaveWord,
  onRemoveWord,
  onVoiceMissing
}) => {
  return (
    <div className="space-y-7 pb-10">
      {/* 1. Greeting */}
      <div>
        <h1 className="text-[30px] font-bold text-[#2B2B2B] tracking-tight leading-tight">
          🙏 Namaskara, {userName}!
        </h1>
        <div className="flex flex-wrap items-baseline gap-2 mt-1">
          <p className="text-base md:text-lg font-bold font-kannada text-[#B71C1C]">
            ಇಂದು ಒಂದು ಹೊಸ ಪದ ಕಲಿಯೋಣ
          </p>
          <span className="text-xs text-[#6B5B4B] font-medium">
            (Aaj ek naya shabd seekhein)
          </span>
        </div>
      </div>

      {/* 2. Row of 4 Stat Cards */}
      <StatCards stats={stats} />

      {/* 3. Daily Phrase Card (Changes based on today's date) */}
      <DailyPhraseCard
        phrase={dailyPhrase}
        onSave={onSaveWord}
        onVoiceMissing={onVoiceMissing}
      />

      {/* 4. Section: Scenario Lessons */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#2B2B2B] flex items-center gap-2">
            <span>🎯</span> Scenario lessons
          </h2>
          <span className="text-xs font-semibold text-[#6B5B4B]">
            {stats.completedLessons} of {stats.totalLessons} completed
          </span>
        </div>

        {lessonsError ? (
          <ErrorStateView
            title="Failed to load scenarios from server"
            message={lessonsError}
            onRetry={onRetryLessons}
          />
        ) : loadingLessons ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <ScenarioCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {lessons.map((lesson) => (
              <ScenarioCard
                key={lesson.id}
                lesson={lesson}
                onSelect={onSelectLesson}
              />
            ))}
          </div>
        )}
      </section>

      {/* 5. Two cards side by side (stack on mobile): AI practice chat + Weekly progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
        <PracticeChatPromoCard onStartChat={onStartChat} />
        <WeeklyProgressChart activity={weeklyActivity} streakDays={stats.streakDays} />
      </div>

      {/* 6. Saved words card */}
      <SavedWordsCard
        words={savedWords}
        onRemoveWord={onRemoveWord}
        onVoiceMissing={onVoiceMissing}
      />
    </div>
  );
};
