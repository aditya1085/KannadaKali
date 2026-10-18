import React, { useState, useEffect } from 'react';
import { ArrowLeft, Volume2, Heart, Check, Sparkles, Lightbulb, CheckCircle2, Award } from 'lucide-react';
import { Lesson, Phrase } from '../types';
import { api } from '../services/api';
import { speakKannada } from '../utils/speech';
import { PhraseCardSkeleton, ErrorStateView } from '../components/LoadingSkeleton';

interface LessonDetailPageProps {
  lessonId: string;
  initialLesson?: Lesson;
  savedWordIds?: Set<string>;
  completedPhraseIds?: string[];
  onBack: () => void;
  onSaveWord: (phrase: Phrase) => void;
  onUnsaveWord: (phraseId: string) => void;
  onToggleCompletePhrase?: (phraseId: string) => void;
  onTakeQuiz?: (lessonId: string) => void;
  onVoiceMissing: () => void;
  onStartChatWithScenario?: (scenarioId: string) => void;
}

export const LessonDetailPage: React.FC<LessonDetailPageProps> = ({
  lessonId,
  initialLesson,
  savedWordIds = new Set(),
  completedPhraseIds = [],
  onBack,
  onSaveWord,
  onUnsaveWord,
  onToggleCompletePhrase,
  onTakeQuiz,
  onVoiceMissing,
  onStartChatWithScenario
}) => {
  const [lesson, setLesson] = useState<Lesson | null>(initialLesson || null);
  const [loading, setLoading] = useState<boolean>(!initialLesson || !initialLesson.phrases?.length);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const fetchLesson = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getLessonById(lessonId);
      setLesson(data);
    } catch (err: any) {
      console.error('Error fetching lesson:', err);
      setError(err?.message || 'Failed to load lesson from server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLesson();
  }, [lessonId]);

  const handleListen = (phrase: Phrase) => {
    setPlayingId(phrase.id);
    // Growing progress as user views or listens to phrases
    if (onToggleCompletePhrase && !completedPhraseIds.includes(phrase.id)) {
      onToggleCompletePhrase(phrase.id);
    }
    speakKannada(
      phrase.kannada,
      () => setPlayingId(phrase.id),
      () => setPlayingId(null),
      () => {
        if (onVoiceMissing) onVoiceMissing();
      }
    );
  };

  const handleToggleSave = (phrase: Phrase) => {
    const isSaved = savedWordIds.has(phrase.id);
    if (isSaved) {
      onUnsaveWord(phrase.id);
    } else {
      onSaveWord(phrase);
    }
  };

  if (error) {
    return (
      <div className="space-y-6 pb-12">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#B71C1C] hover:bg-[#FFF0B3] px-3 py-1.5 rounded-xl transition-all"
        >
          <ArrowLeft size={16} /> Back to Lessons
        </button>
        <ErrorStateView
          title="Could not load lesson details"
          message={error}
          onRetry={fetchLesson}
        />
      </div>
    );
  }

  const phraseList = lesson?.phrases || [];
  const totalCount = lesson?.totalPhrases || phraseList.length || 8;
  const completedCount = completedPhraseIds.length;
  const progressPercent = Math.min(100, Math.round((completedCount / totalCount) * 100));
  const isDone = progressPercent >= 100;

  return (
    <div className="space-y-6 pb-12">
      {/* Navigation / Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#B71C1C] hover:bg-[#FFF0B3] px-3 py-1.5 rounded-xl transition-all"
        >
          <ArrowLeft size={16} /> Back to Lessons
        </button>

        <span className="text-xs font-bold text-[#6B5B4B] bg-[#FFF0B3] px-3 py-1 rounded-full border border-[#FFE082]">
          {completedCount} / {totalCount} mastered
        </span>
      </div>

      {/* Lesson Banner */}
      {loading && !lesson ? (
        <div className="bg-white rounded-2xl p-6 kannada-card-shadow border border-[#FFF0B3] animate-pulse h-40" />
      ) : lesson ? (
        <div className="bg-white rounded-2xl p-6 kannada-card-shadow border border-[#FFF0B3] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="text-5xl p-3 bg-[#FFF8E1] rounded-2xl border border-[#FFE082]/70 shrink-0">
              {lesson.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#B71C1C] bg-[#FFF0B3] px-2 py-0.5 rounded-full">
                  Scenario Lesson
                </span>
                <span className="text-xs text-[#6B5B4B] font-semibold">
                  {isDone ? '✅ Done' : progressPercent > 0 ? '▶ In Progress' : 'Start'}
                </span>
                <span className="text-xs font-bold text-[#B71C1C] bg-[#FFF8E1] border border-[#FFE082] px-2 py-0.5 rounded-full">
                  {totalCount} practical phrases
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#2B2B2B]">
                {lesson.title}
              </h1>
              <p className="text-sm font-kannada font-bold text-[#B71C1C] mt-0.5">
                {lesson.kannadaTitle} ({lesson.romanTitle})
              </p>
              <p className="text-xs md:text-sm text-[#6B5B4B] mt-2 max-w-2xl leading-relaxed">
                {lesson.description}
              </p>
            </div>
          </div>

          {/* Progress gauge & Chat button */}
          <div className="shrink-0 flex flex-col gap-2 min-w-[180px]">
            <div className="bg-[#FFF8E1] p-3 rounded-xl border border-[#FFE082]">
              <div className="flex justify-between text-xs font-bold text-[#2B2B2B] mb-1">
                <span>Real Mastery</span>
                <span className="text-[#B71C1C]">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-[#FFF0B3] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#B71C1C] rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {onTakeQuiz && (
              <button
                onClick={() => onTakeQuiz(lesson.id)}
                className="w-full min-h-[44px] px-4 py-2 bg-[#B71C1C] text-white hover:bg-[#8F1414] rounded-[10px] text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
              >
                <Award size={14} />
                <span>Take Quiz</span>
              </button>
            )}

            <button
              onClick={() => onStartChatWithScenario && onStartChatWithScenario(lesson.id === 'market' ? 'market-chat' : 'auto-chat')}
              className="w-full min-h-[44px] px-4 py-2 bg-[#FFC107] text-[#2B2B2B] hover:bg-[#FFE082] rounded-[10px] text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Sparkles size={14} className="text-[#B71C1C]" />
              <span>Practice in Chat</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* Phrase Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-bold text-[#2B2B2B] flex items-center gap-2">
            <span>🗣️</span> Essential Scenario Phrases ({phraseList.length || 8})
          </h2>
          <span className="text-xs text-[#6B5B4B]">
            Tap 🔊 to hear native Kannada pronunciation
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <PhraseCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {phraseList.map((phrase, idx) => {
              const isPlaying = playingId === phrase.id;
              const isSaved = savedWordIds.has(phrase.id);
              const isLearned = completedPhraseIds.includes(phrase.id);
              const phraseTip = phrase.tip || phrase.usageTip;

              return (
                <div
                  key={phrase.id}
                  className={`bg-white rounded-2xl p-5 kannada-card-shadow kannada-card-shadow-hover border flex flex-col justify-between transition-all ${
                    isLearned ? 'border-emerald-300 bg-emerald-50/15' : 'border-[#FFF0B3]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#6B5B4B] bg-[#FFF8E1] px-2 py-0.5 rounded-full border border-[#FFE082]/60">
                          Phrase #{idx + 1}
                        </span>
                        {isLearned && (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check size={12} /> Learned
                          </span>
                        )}
                      </div>

                      {/* Action buttons: Listen, Complete & Save */}
                      <div className="flex items-center gap-1.5">
                        {/* Listen button */}
                        <button
                          onClick={() => handleListen(phrase)}
                          disabled={isPlaying}
                          className={`min-h-[38px] px-2.5 py-1.5 rounded-[10px] text-xs font-bold bg-[#FFC107] text-[#2B2B2B] hover:bg-[#FFE082] active:scale-95 transition-all flex items-center gap-1 shadow-2xs ${
                            isPlaying ? 'ring-2 ring-[#B71C1C] animate-pulse' : ''
                          }`}
                          title="Listen to pronunciation"
                        >
                          <Volume2 size={14} />
                          <span className="hidden sm:inline">{isPlaying ? 'Playing...' : '🔊 Listen'}</span>
                        </button>

                        {/* Toggle Learned button */}
                        {onToggleCompletePhrase && (
                          <button
                            onClick={() => onToggleCompletePhrase(phrase.id)}
                            className={`min-h-[38px] px-2.5 py-1.5 rounded-[10px] text-xs font-bold border transition-all flex items-center gap-1 shadow-2xs active:scale-95 ${
                              isLearned
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-white text-[#6B5B4B] border-[#FFE082] hover:bg-[#FFF8E1]'
                            }`}
                            title={isLearned ? 'Mark as unlearned' : 'Mark phrase as learned'}
                          >
                            <CheckCircle2 size={14} />
                            <span className="hidden sm:inline">{isLearned ? 'Done' : 'Learn'}</span>
                          </button>
                        )}

                        {/* Save / Unsave button */}
                        <button
                          onClick={() => handleToggleSave(phrase)}
                          className={`min-h-[38px] px-2.5 py-1.5 rounded-[10px] text-xs font-bold border transition-all flex items-center gap-1 shadow-2xs active:scale-95 ${
                            isSaved
                              ? 'bg-[#B71C1C] text-white border-[#B71C1C]'
                              : 'bg-white text-[#2B2B2B] border-[#FFE082] hover:bg-[#FFF8E1]'
                          }`}
                          title={isSaved ? 'Remove from saved words' : 'Save to vocabulary'}
                        >
                          <Heart size={14} className={isSaved ? 'fill-white' : 'text-[#B71C1C] fill-[#B71C1C]'} />
                          <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Large Kannada Script */}
                    <div className="font-kannada font-bold text-2xl md:text-3xl text-[#2B2B2B] tracking-wide my-2">
                      {phrase.kannada}
                    </div>

                    {/* Roman transliteration + English meaning */}
                    <div className="text-sm md:text-base font-semibold text-[#B71C1C] mb-1">
                      {phrase.roman}
                    </div>
                    <div className="text-xs md:text-sm text-[#2B2B2B] font-medium">
                      English: <span className="font-semibold">{phrase.english}</span>
                    </div>

                    {/* Hindi in Roman Hinglish */}
                    {phrase.hindi && (
                      <div className="text-xs text-[#6B5B4B] mt-1 font-medium">
                        Hindi (Hinglish): <span className="text-[#2B2B2B] font-semibold">{phrase.hindi}</span>
                      </div>
                    )}
                  </div>

                  {/* Practical Usage Tip */}
                  {phraseTip && (
                    <div className="mt-4 pt-3 border-t border-[#FFF0B3] flex items-start gap-1.5 text-xs text-[#6B5B4B] bg-[#FFF8E1]/60 -mx-5 -mb-5 p-3 rounded-b-2xl">
                      <Lightbulb size={14} className="text-[#FFC107] shrink-0 mt-0.5 fill-[#FFC107]" />
                      <span className="leading-relaxed">
                        <span className="font-semibold text-[#2B2B2B]">Everyday tip:</span> {phraseTip}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
