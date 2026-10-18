import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, XCircle, Volume2, ArrowRight } from 'lucide-react';
import { QuizQuestion } from '../types';
import { api } from '../services/api';
import { speakKannada } from '../utils/speech';

interface QuizPageProps {
  onVoiceMissing?: () => void;
  onQuizComplete?: (result: { lessonId: string; score: number; total: number }) => void;
}

export const QuizPage: React.FC<QuizPageProps> = ({ onVoiceMissing, onQuizComplete }) => {
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<{
    isCorrect: boolean;
    correctOptionId: string;
    explanation: string;
  } | null>(null);
  const [sessionScore, setSessionScore] = useState(0);

  useEffect(() => {
    async function load() {
      const data = await api.getQuizzes();
      if (data?.quizzes) {
        setQuizzes(data.quizzes);
      }
    }
    load();
  }, []);

  const currentQuiz = quizzes[currentIndex];

  const handleOptionSelect = (optionId: string) => {
    if (isSubmitted) return;
    setSelectedOptionId(optionId);
  };

  const handleSubmit = async () => {
    if (!selectedOptionId || !currentQuiz) return;

    const res = await api.submitQuizAnswer(currentQuiz.id, selectedOptionId);
    setResult(res);
    setIsSubmitted(true);

    const scoreValue = res.isCorrect ? 100 : 0;
    if (res.isCorrect) {
      setSessionScore((prev) => prev + 10);
    }

    if (onQuizComplete) {
      onQuizComplete({
        lessonId: currentQuiz.id,
        score: scoreValue,
        total: 100,
      });
    }
  };

  const handleNext = () => {
    if (currentIndex < quizzes.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setIsSubmitted(false);
      setResult(null);
    } else {
      // Loop or restart
      setCurrentIndex(0);
      setSelectedOptionId(null);
      setIsSubmitted(false);
      setResult(null);
    }
  };

  const handleListen = (kannadaText: string, e: React.MouseEvent) => {
    e.stopPropagation();
    speakKannada(
      kannadaText,
      undefined,
      undefined,
      () => {
        if (onVoiceMissing) onVoiceMissing();
      }
    );
  };

  if (!currentQuiz) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-[#6B5B4B]">Loading quiz questions...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#2B2B2B] flex items-center gap-2">
            <span>🏆</span> Daily Kannada Quiz
          </h1>
          <p className="text-xs md:text-sm text-[#6B5B4B] mt-1">
            Test your conversational Kannada recall with practical scenarios.
          </p>
        </div>

        <div className="bg-white px-4 py-2 rounded-xl border border-[#FFE082] shadow-xs flex items-center gap-2">
          <Award size={18} className="text-[#FFC107]" />
          <span className="text-xs font-semibold text-[#6B5B4B]">Session:</span>
          <span className="text-base font-bold text-[#B71C1C]">{sessionScore} pts</span>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl p-6 md:p-8 kannada-card-shadow border border-[#FFF0B3] space-y-6">
        {/* Scenario Badge */}
        <div className="flex items-center justify-between border-b border-[#FFF0B3] pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B71C1C] bg-[#FFF0B3] px-3 py-1 rounded-full border border-[#FFE082]">
              {currentQuiz.scenario}
            </span>
            <span className="text-xs font-kannada font-semibold text-[#6B5B4B]">
              {currentQuiz.scenarioKannada}
            </span>
          </div>

          <span className="text-xs font-semibold text-[#6B5B4B]">
            Question {currentIndex + 1} of {quizzes.length}
          </span>
        </div>

        {/* Question Text */}
        <div className="space-y-2">
          <h2 className="text-lg md:text-xl font-bold text-[#2B2B2B] leading-snug">
            {currentQuiz.question}
          </h2>
          <p className="font-kannada text-sm text-[#B71C1C] font-semibold">
            {currentQuiz.questionKannada}
          </p>
        </div>

        {/* Options List */}
        <div className="space-y-3">
          {currentQuiz.options.map((option) => {
            const isSelected = selectedOptionId === option.id;
            const isCorrect = isSubmitted && result?.correctOptionId === option.id;
            const isWrongSelected = isSubmitted && isSelected && !result?.isCorrect;

            let borderStyle = 'border-[#FFE082] hover:bg-[#FFF8E1]';
            if (isSelected && !isSubmitted) {
              borderStyle = 'border-[#B71C1C] bg-[#FFF8E1] ring-2 ring-[#B71C1C]/20';
            } else if (isCorrect) {
              borderStyle = 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20';
            } else if (isWrongSelected) {
              borderStyle = 'border-rose-500 bg-rose-50 ring-2 ring-rose-500/20';
            }

            return (
              <div
                key={option.id}
                onClick={() => handleOptionSelect(option.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${borderStyle}`}
              >
                <div className="flex items-center gap-3">
                  {/* Radio / Status indicator */}
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isCorrect
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : isWrongSelected
                        ? 'border-rose-600 bg-rose-600 text-white'
                        : isSelected
                        ? 'border-[#B71C1C] bg-[#B71C1C] text-white'
                        : 'border-[#FFE082] bg-white'
                    }`}
                  >
                    {isCorrect ? (
                      <CheckCircle2 size={16} />
                    ) : isWrongSelected ? (
                      <XCircle size={16} />
                    ) : isSelected ? (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    ) : null}
                  </div>

                  <div>
                    {/* Kannada text */}
                    <div className="font-kannada font-bold text-lg text-[#2B2B2B]">
                      {option.kannada}
                    </div>
                    {/* Roman & English */}
                    <div className="text-xs text-[#6B5B4B] font-medium">
                      <span className="font-semibold text-[#2B2B2B]">{option.roman}</span> · {option.english}
                    </div>
                  </div>
                </div>

                {/* Listen button for this option */}
                <button
                  onClick={(e) => handleListen(option.kannada, e)}
                  className="p-2 rounded-lg text-[#6B5B4B] hover:text-[#B71C1C] hover:bg-white active:scale-95 transition-all shrink-0"
                  title="Listen to option"
                >
                  <Volume2 size={16} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Feedback Section after submission */}
        {isSubmitted && result && (
          <div
            className={`p-4 rounded-xl border ${
              result.isCorrect
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm mb-1">
              {result.isCorrect ? (
                <>
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span>ಸರಿ! (Correct answer! +10 pts)</span>
                </>
              ) : (
                <>
                  <XCircle size={18} className="text-rose-600" />
                  <span>ತಪ್ಪು (Incorrect)</span>
                </>
              )}
            </div>
            <p className="text-xs leading-relaxed mt-1">{result.explanation}</p>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {!isSubmitted ? (
            <button
              onClick={handleSubmit}
              disabled={!selectedOptionId}
              className="min-h-[44px] px-6 rounded-[10px] font-bold text-sm bg-[#B71C1C] text-white hover:bg-[#8F1414] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all shadow-xs"
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="min-h-[44px] px-6 rounded-[10px] font-bold text-sm bg-[#FFC107] text-[#2B2B2B] hover:bg-[#FFE082] active:scale-95 transition-all flex items-center gap-2 shadow-xs"
            >
              <span>{currentIndex < quizzes.length - 1 ? 'Next Question' : 'Restart Quiz'}</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
