import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Award, CheckCircle2, XCircle, ArrowRight, ArrowLeft, RotateCcw, Lock, Sparkles, Check } from 'lucide-react';
import { Lesson, QuizQuestion } from '../types';
import { api } from '../services/api';
import { generateLessonQuiz } from '../utils/quizGenerator';
import { useAuth } from '../context/AuthContext';
import { firestoreService, QuizRecord, normalizeLessonId } from '../services/firestoreService';
import { AudioButton } from '../components/AudioButton';

interface QuizPageProps {
  initialLessonId?: string | null;
  lessons: Lesson[];
  quizHistory?: QuizRecord[];
  onVoiceMissing?: () => void;
  onBackToLessons?: () => void;
  onQuizFinished?: (result: { lessonId: string; score: number; total: number; percentage: number }) => void;
  onShowToast?: (msg: string) => void;
}

export const QuizPage: React.FC<QuizPageProps> = ({
  initialLessonId,
  lessons,
  quizHistory = [],
  onVoiceMissing,
  onBackToLessons,
  onQuizFinished,
  onShowToast,
}) => {
  const { user } = useAuth();

  const [activeLessonId, setActiveLessonId] = useState<string | null>(initialLessonId || null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [loadingLesson, setLoadingLesson] = useState<boolean>(false);

  // Quiz state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    passed: boolean;
    percentage: number;
    unlockedLessonId: string | null;
  } | null>(null);

  // Confetti particles for final passed screen
  const [showConfetti, setShowConfetti] = useState(false);

  // Sync initialLessonId prop if changed
  useEffect(() => {
    if (initialLessonId) {
      setActiveLessonId(initialLessonId);
    }
  }, [initialLessonId]);

  // Load lesson phrases if missing, and initialize quiz
  const startQuizForLesson = useCallback(async (lessonId: string) => {
    try {
      setLoadingLesson(true);
      const normId = normalizeLessonId(lessonId);

      // Check if we already have the lesson with 8 phrases
      let fullLesson = lessons.find((l) => normalizeLessonId(l.id) === normId);
      if (!fullLesson || !fullLesson.phrases || fullLesson.phrases.length < 5) {
        fullLesson = await api.getLessonById(normId);
      }

      if (fullLesson && fullLesson.phrases && fullLesson.phrases.length > 0) {
        setActiveLesson(fullLesson);
        setActiveLessonId(normId);

        // Generate 5 questions mixing three types from that lesson's 8 phrases
        const generated = generateLessonQuiz(fullLesson);
        setQuestions(generated);
        setCurrentIndex(0);
        setSelectedOptionId(null);
        setScore(0);
        setIsFinished(false);
        setSubmissionResult(null);
        setShowConfetti(false);
      } else {
        if (onShowToast) onShowToast('Could not load scenario phrases for quiz.');
      }
    } catch (err) {
      console.error('Error starting quiz:', err);
      if (onShowToast) onShowToast('Failed to start quiz. Please try again.');
    } finally {
      setLoadingLesson(false);
    }
  }, [lessons, onShowToast]);

  useEffect(() => {
    if (activeLessonId && (!activeLesson || normalizeLessonId(activeLesson.id) !== normalizeLessonId(activeLessonId))) {
      startQuizForLesson(activeLessonId);
    }
  }, [activeLessonId, activeLesson, startQuizForLesson]);

  const currentQuestion = questions[currentIndex];

  // Option selection with instant feedback
  const handleOptionSelect = (optionId: string) => {
    if (selectedOptionId !== null) return; // Already answered

    setSelectedOptionId(optionId);
    const isCorrect = optionId === currentQuestion.correctOptionId;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
  };

  // Next question or finish
  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionId(null);
    } else {
      // Completed all 5 questions
      await finishQuiz();
    }
  };

  // Final quiz submission to server & Firestore
  const finishQuiz = async () => {
    if (!activeLesson) return;
    setIsFinished(true);
    setIsSubmitting(true);

    const total = questions.length || 5;
    const finalScore = score;
    const percentage = Math.round((finalScore / total) * 100);
    const passed = percentage >= 60;

    if (passed) {
      setShowConfetti(true);
    }

    try {
      let idToken = '';
      if (user) {
        idToken = await user.getIdToken();
      }

      const todayStr = new Date().toLocaleDateString('en-CA');

      // 1. Submit to server API (verifies token, validates, saves to Firestore)
      const res = await api.submitQuizResult({
        lessonId: activeLesson.id,
        score: finalScore,
        total,
        idToken,
        userLocalDate: todayStr,
      });

      // 2. Client-side Firestore sync fallback & instant state notification
      if (user) {
        await firestoreService.recordQuizResult(user.uid, {
          lessonId: activeLesson.id,
          score: finalScore,
          total,
          percentage,
          userLocalDate: todayStr,
        });
      }

      setSubmissionResult({
        passed: res.passed,
        percentage: res.percentage,
        unlockedLessonId: res.unlockedLessonId,
      });

      if (onQuizFinished) {
        onQuizFinished({
          lessonId: activeLesson.id,
          score: finalScore,
          total,
          percentage,
        });
      }
    } catch (err: any) {
      console.warn('Server quiz submit notification:', err);
      // Even if server call encountered network notice, ensure local progress & state record
      if (user && activeLesson) {
        try {
          await firestoreService.recordQuizResult(user.uid, {
            lessonId: activeLesson.id,
            score: finalScore,
            total,
            percentage,
          });
        } catch {}
      }
      setSubmissionResult({
        passed,
        percentage,
        unlockedLessonId: passed ? 'unlocked' : null,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    if (activeLesson) {
      startQuizForLesson(activeLesson.id);
    }
  };

  const handleBackToCardList = () => {
    setActiveLessonId(null);
    setActiveLesson(null);
    setIsFinished(false);
    setSubmissionResult(null);
    setQuestions([]);
  };

  // Best score per lesson map
  const bestScoresMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const q of quizHistory) {
      const norm = normalizeLessonId(q.lessonId);
      const pct = q.percentage ?? Math.round((q.score / q.total) * 100);
      if (map[norm] === undefined || pct > map[norm]) {
        map[norm] = pct;
      }
    }
    return map;
  }, [quizHistory]);

  // VIEW 1: Quiz Scenario Cards List (when no quiz is actively running)
  if (!activeLessonId || (!activeLesson && !loadingLesson)) {
    return (
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#2B2B2B] flex items-center gap-2">
              <span>🏆</span> Scenario Quizzes
            </h1>
            <p className="text-xs md:text-sm text-[#6B5B4B] mt-1 font-kannada">
              ಪರೀಕ್ಷೆ · Test your recall with 5 multiple-choice questions per scenario. Score 60% or higher to unlock the next level!
            </p>
          </div>

          {onBackToLessons && (
            <button
              onClick={onBackToLessons}
              className="self-start sm:self-auto flex items-center gap-1.5 text-xs font-bold text-[#B71C1C] hover:bg-[#FFF0B3] px-3.5 py-2 rounded-xl transition-all border border-[#FFE082]"
            >
              <ArrowLeft size={16} />
              <span>Back to Lessons</span>
            </button>
          )}
        </div>

        {/* 5 Lesson Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {lessons.map((lesson) => {
            const isLocked = lesson.status === 'locked';
            const isCompleted = lesson.status === 'completed';
            const isResume = lesson.status === 'in_progress';
            const norm = normalizeLessonId(lesson.id);
            const bestScore = bestScoresMap[norm];

            return (
              <div
                key={lesson.id}
                onClick={() => {
                  if (isLocked) {
                    if (onShowToast) onShowToast('Finish the previous lesson to unlock');
                  } else {
                    startQuizForLesson(lesson.id);
                  }
                }}
                className={`bg-white rounded-2xl p-5 kannada-card-shadow kannada-card-shadow-hover flex flex-col justify-between transition-all relative ${
                  isLocked ? 'opacity-65 cursor-not-allowed bg-stone-50 border border-stone-200' : 'cursor-pointer border border-[#FFF0B3]'
                }`}
              >
                <div>
                  {/* Top Bar: Emoji & Status */}
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-4xl" role="img" aria-label={lesson.title}>
                      {lesson.emoji}
                    </span>

                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : isResume
                          ? 'bg-[#FFF0B3] text-[#B71C1C] border border-[#FFE082]'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {isLocked ? <Lock size={12} /> : isCompleted ? <Check size={12} /> : null}
                      <span>{isLocked ? 'Locked' : isCompleted ? 'Done' : 'Active'}</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-[#2B2B2B] leading-snug">
                    {lesson.title}
                  </h3>
                  <p className="text-xs font-kannada font-bold text-[#B71C1C] mt-0.5 mb-2">
                    {lesson.kannadaTitle}
                  </p>

                  <p className="text-xs text-[#6B5B4B] line-clamp-2 mb-3 leading-relaxed">
                    {lesson.description}
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t border-[#FFF0B3]">
                  {/* Best quiz score badge if taken */}
                  {bestScore !== undefined ? (
                    <div className="flex items-center justify-between text-xs font-bold bg-[#FFF8E1] px-2.5 py-1 rounded-lg border border-[#FFE082]">
                      <span className="text-[#6B5B4B]">Best Score:</span>
                      <span className={bestScore >= 60 ? 'text-emerald-700' : 'text-[#B71C1C]'}>
                        {bestScore}%
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] font-medium text-[#6B5B4B] text-center">
                      5 multiple choice questions
                    </div>
                  )}

                  {/* Start / Locked Button */}
                  <button
                    disabled={isLocked}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isLocked) {
                        if (onShowToast) onShowToast('Finish the previous lesson to unlock');
                      } else {
                        startQuizForLesson(lesson.id);
                      }
                    }}
                    className={`w-full min-h-[44px] rounded-[10px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isLocked
                        ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                        : isCompleted
                        ? 'bg-[#FFC107] text-[#2B2B2B] hover:bg-[#FFE082] shadow-xs active:scale-95'
                        : 'bg-[#B71C1C] text-white hover:bg-[#8F1414] shadow-xs active:scale-95'
                    }`}
                  >
                    {isLocked ? (
                      <>
                        <Lock size={14} />
                        <span>Locked</span>
                      </>
                    ) : isCompleted ? (
                      <>
                        <RotateCcw size={14} />
                        <span>Retake Quiz</span>
                      </>
                    ) : (
                      <>
                        <Award size={14} />
                        <span>Take Quiz</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Loading state when preparing questions
  if (loadingLesson || !currentQuestion) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FFC107] text-2xl flex items-center justify-center shadow-md animate-bounce border border-[#FFE082]">
          🏆
        </div>
        <h2 className="text-xl font-bold text-[#2B2B2B]">Generating Scenario Quiz...</h2>
        <p className="text-xs text-[#6B5B4B]">Preparing 5 practical questions from {activeLesson?.title || 'scenario'}.</p>
      </div>
    );
  }

  // VIEW 2: Final Score Screen
  if (isFinished) {
    const total = questions.length || 5;
    const finalScore = score;
    const percentage = Math.round((finalScore / total) * 100);
    const passed = percentage >= 60;

    return (
      <div className="max-w-xl mx-auto space-y-6 pb-12 pt-4 relative">
        {/* Simple Confetti CSS Animation when passed */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
            {Array.from({ length: 24 }).map((_, i) => (
              <span
                key={i}
                className="absolute inline-block w-2.5 h-2.5 rounded-full animate-bounce"
                style={{
                  top: `${Math.random() * 80}%`,
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ['#B71C1C', '#FFC107', '#10B981', '#3B82F6', '#EC4899'][i % 5],
                  animationDuration: `${1 + (i % 5) * 0.4}s`,
                  animationDelay: `${(i % 4) * 0.2}s`,
                }}
              />
            ))}
          </div>
        )}

        <div className="bg-white rounded-3xl p-6 md:p-8 kannada-card-shadow border-2 border-[#FFF0B3] text-center space-y-5 relative">
          {/* Trophy & Badge */}
          <div className="relative inline-block">
            <div
              className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center shadow-md border-4 ${
                passed
                  ? 'bg-amber-50 border-[#FFC107] text-amber-500'
                  : 'bg-stone-50 border-stone-300 text-stone-500'
              }`}
            >
              {passed ? <Sparkles size={46} className="text-[#FFC107]" /> : <Award size={46} />}
            </div>
            {passed && (
              <span className="absolute -bottom-1 -right-1 text-2xl" role="img" aria-label="celebrate">
                🎉
              </span>
            )}
          </div>

          <div>
            <span
              className={`inline-block text-xs uppercase tracking-wider font-bold px-3 py-1 rounded-full mb-2 ${
                passed
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              {passed ? '✅ Passed (≥ 60%)' : 'Needs Practice (< 60%)'}
            </span>

            <h2 className="text-2xl md:text-3xl font-extrabold text-[#2B2B2B]">
              {passed ? 'ತುಂಬಾ ಒಳ್ಳೆಯದು! (Excellent!)' : 'ಮುಂದೆ ಪ್ರಯತ್ನಿಸಿ (Try Again!)'}
            </h2>

            <p className="text-xs md:text-sm text-[#6B5B4B] mt-1 max-w-md mx-auto">
              {passed
                ? `You mastered the ${activeLesson?.title} scenario with a passing score! The next lesson in your learning journey has been unlocked.`
                : `You scored ${percentage}%. You need at least 60% (3 out of 5) to mark this lesson done and unlock the next scenario.`}
            </p>
          </div>

          {/* Big Score Card */}
          <div className="bg-[#FFF8E1] p-5 rounded-2xl border border-[#FFE082] max-w-xs mx-auto space-y-1">
            <div className="text-xs font-semibold text-[#6B5B4B]">Your Quiz Score</div>
            <div className="text-4xl font-extrabold text-[#B71C1C]">
              {finalScore} <span className="text-xl text-[#6B5B4B]">/ {total}</span>
            </div>
            <div className="text-base font-bold text-[#2B2B2B]">{percentage}% Accuracy</div>
          </div>

          {/* Action Buttons: Retry and Back to Lessons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <button
              onClick={handleRetry}
              className="w-full sm:w-auto min-h-[44px] px-6 rounded-[10px] font-bold text-xs bg-[#FFC107] text-[#2B2B2B] hover:bg-[#FFE082] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <RotateCcw size={16} />
              <span>Retry Quiz</span>
            </button>

            <button
              onClick={() => {
                if (onBackToLessons) {
                  onBackToLessons();
                } else {
                  handleBackToCardList();
                }
              }}
              className="w-full sm:w-auto min-h-[44px] px-6 rounded-[10px] font-bold text-xs bg-[#B71C1C] text-white hover:bg-[#8F1414] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Back to Lessons</span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={handleBackToCardList}
              className="w-full sm:w-auto min-h-[44px] px-4 rounded-[10px] font-semibold text-xs text-[#6B5B4B] hover:bg-[#FFF0B3] transition-all"
            >
              <span>Quiz Menu</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // VIEW 3: Active Question Screen
  const isAnswered = selectedOptionId !== null;

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-12">
      {/* Top Header & Scenario info */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBackToCardList}
          className="flex items-center gap-1 text-xs font-bold text-[#6B5B4B] hover:text-[#B71C1C] hover:bg-[#FFF0B3] px-2.5 py-1.5 rounded-xl transition-all"
        >
          <ArrowLeft size={16} />
          <span>Exit Quiz</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xl">{activeLesson?.emoji}</span>
          <span className="text-xs font-bold text-[#2B2B2B]">{activeLesson?.title} Quiz</span>
        </div>

        <div className="bg-white px-3 py-1 rounded-xl border border-[#FFE082] text-xs font-bold text-[#B71C1C] shadow-2xs">
          Score: {score} / {currentIndex + (isAnswered ? 1 : 0)}
        </div>
      </div>

      {/* Progress Bar (Question X of 5) */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-[#6B5B4B]">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span className="text-[#B71C1C] font-bold">
            {Math.round(((currentIndex + 1) / questions.length) * 100)}%
          </span>
        </div>
        <div className="w-full h-2 bg-[#FFF0B3] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#B71C1C] rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl p-6 md:p-8 kannada-card-shadow border border-[#FFF0B3] space-y-6">
        {/* Question Title & Prompt */}
        <div className="space-y-3 pb-2 border-b border-[#FFF0B3]">
          <span className="text-xs uppercase tracking-wider font-bold text-[#B71C1C] bg-[#FFF0B3] px-2.5 py-1 rounded-full border border-[#FFE082]">
            {currentQuestion.question}
          </span>

          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="space-y-1">
              {/* Main Prompt */}
              <div className="text-2xl md:text-3xl font-extrabold text-[#2B2B2B] font-kannada">
                {currentQuestion.promptText}
              </div>

              {/* Subtext (Roman transliteration or Hint) */}
              {currentQuestion.promptSubtext && (
                <div className="text-sm md:text-base font-semibold text-[#B71C1C]">
                  {currentQuestion.promptSubtext}
                </div>
              )}
            </div>

            {/* 🔊 Pronunciation Button for Kannada text */}
            {currentQuestion.audioKannada && (
              <AudioButton
                text={currentQuestion.audioKannada}
                variant="button"
                size="md"
                label="Listen"
                ariaLabel={`Listen to ${currentQuestion.promptSubtext || 'native Kannada audio'}`}
              />
            )}
          </div>
        </div>

        {/* Options List */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedOptionId === option.id;
            const isCorrect = option.id === currentQuestion.correctOptionId;

            let borderStyle = 'border-[#FFE082] hover:bg-[#FFF8E1] hover:border-[#FFC107]';
            let indicatorBg = 'border-[#FFE082] bg-white text-[#6B5B4B]';

            if (isAnswered) {
              if (isCorrect) {
                borderStyle = 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20 shadow-xs';
                indicatorBg = 'border-emerald-600 bg-emerald-600 text-white';
              } else if (isSelected && !isCorrect) {
                borderStyle = 'border-rose-500 bg-rose-50 ring-2 ring-rose-500/20 shadow-xs';
                indicatorBg = 'border-rose-600 bg-rose-600 text-white';
              } else {
                borderStyle = 'border-stone-200 opacity-60';
              }
            }

            return (
              <div
                key={option.id}
                onClick={() => handleOptionSelect(option.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${borderStyle} ${
                  isAnswered ? 'cursor-default' : 'active:scale-[0.99]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  {/* Indicator circle */}
                  <div
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 font-bold text-xs transition-colors ${indicatorBg}`}
                  >
                    {isAnswered && isCorrect ? (
                      <CheckCircle2 size={16} />
                    ) : isAnswered && isSelected && !isCorrect ? (
                      <XCircle size={16} />
                    ) : (
                      String.fromCharCode(65 + idx)
                    )}
                  </div>

                  <div>
                    {/* Primary Text */}
                    <div className="text-base md:text-lg font-bold text-[#2B2B2B] font-kannada">
                      {option.displayText}
                    </div>

                    {/* Secondary Subtext */}
                    {option.subText && (
                      <div className="text-xs text-[#6B5B4B] font-medium mt-0.5">
                        {option.subText}
                      </div>
                    )}
                  </div>
                </div>

                {/* Option Listen Button if it contains Kannada */}
                {option.kannada && (
                  <AudioButton
                    text={option.kannada}
                    variant="icon"
                    size="sm"
                    ariaLabel={`Pronounce option ${option.displayText}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Immediate Feedback Card after selection */}
        {isAnswered && (
          <div
            className={`p-4 rounded-xl border transition-all animate-in fade-in duration-200 ${
              selectedOptionId === currentQuestion.correctOptionId
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm mb-1">
              {selectedOptionId === currentQuestion.correctOptionId ? (
                <>
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <span>ಸರಿ! Correct answer (+1 point)</span>
                </>
              ) : (
                <>
                  <XCircle size={18} className="text-rose-600 shrink-0" />
                  <span>ತಪ್ಪು (Incorrect)</span>
                </>
              )}
            </div>

            <p className="text-xs leading-relaxed mt-1">{currentQuestion.explanation}</p>
          </div>
        )}

        {/* Next Question / Finish Action */}
        <div className="flex items-center justify-end pt-2">
          {isAnswered ? (
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="min-h-[44px] px-6 rounded-[10px] font-bold text-sm bg-[#B71C1C] text-white hover:bg-[#8F1414] active:scale-95 transition-all flex items-center gap-2 shadow-xs"
            >
              <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'View Results'}</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <div className="text-xs text-[#6B5B4B] italic">Select an option above to check your answer</div>
          )}
        </div>
      </div>
    </div>
  );
};
