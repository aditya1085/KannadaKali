import React from 'react';
import { Lock, BookOpen } from 'lucide-react';
import { Lesson } from '../types';

interface ScenarioCardProps {
  lesson: Lesson;
  onSelect: (lessonId: string) => void;
  onLockedClick?: () => void;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({ lesson, onSelect, onLockedClick }) => {
  const isLocked = lesson.status === 'locked';
  const isResume = lesson.status === 'in_progress';
  const isCompleted = lesson.status === 'completed';
  const phraseCount = lesson.phraseCount ?? lesson.totalPhrases ?? 8;

  const handleClick = () => {
    if (isLocked) {
      if (onLockedClick) onLockedClick();
    } else {
      onSelect(lesson.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`bg-white rounded-2xl p-5 kannada-card-shadow kannada-card-shadow-hover flex flex-col justify-between transition-all relative ${
        isLocked ? 'opacity-65 cursor-pointer bg-stone-50' : 'cursor-pointer'
      } ${
        isResume
          ? 'ring-2 ring-[#FFC107] border-2 border-[#FFC107] shadow-[0_8px_20px_-4px_rgba(255,193,7,0.3)]'
          : 'border border-[#FFF0B3]/80'
      }`}
    >
      <div>
        {/* Top bar: Big emoji & Status badge */}
        <div className="flex items-start justify-between mb-3">
          <span className="text-4xl" role="img" aria-label={lesson.title}>
            {lesson.emoji}
          </span>

          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
              isCompleted
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : isResume
                ? 'bg-[#FFF0B3] text-[#B71C1C] font-semibold border border-[#FFE082]'
                : isLocked
                ? 'bg-stone-200 text-stone-600'
                : 'bg-[#FFF8E1] text-[#6B5B4B] border border-[#FFE082]/60'
            }`}
          >
            {isLocked && <Lock size={12} />}
            {lesson.badge}
          </span>
        </div>

        {/* Name, Kannada Subtitle, and Phrase Count */}
        <div className="flex items-baseline justify-between gap-1">
          <h3 className="font-bold text-lg text-[#2B2B2B] leading-snug">
            {lesson.title}
          </h3>
          <span className="text-[11px] font-semibold text-[#B71C1C] bg-[#FFF0B3] px-2 py-0.5 rounded-md whitespace-nowrap">
            {phraseCount} phrases
          </span>
        </div>

        <p className="text-xs font-kannada font-semibold text-[#B71C1C] mt-0.5 mb-2">
          {lesson.kannadaTitle}
        </p>

        <p className="text-xs text-[#6B5B4B] line-clamp-2 mb-4 leading-relaxed">
          {lesson.description}
        </p>
      </div>

      <div>
        {/* Thin progress bar: light yellow track, maroon fill */}
        <div className="mb-3">
          <div className="flex justify-between text-[11px] font-semibold text-[#6B5B4B] mb-1">
            <span>Progress</span>
            <span className="text-[#B71C1C]">{lesson.progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#FFF0B3] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#B71C1C] transition-all duration-300 rounded-full"
              style={{ width: `${lesson.progress}%` }}
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          className={`w-full min-h-[44px] rounded-[10px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            isLocked
              ? 'bg-stone-200 text-stone-500 hover:bg-stone-300'
              : isResume
              ? 'bg-[#FFC107] text-[#2B2B2B] hover:bg-[#FFE082] shadow-xs active:scale-95'
              : isCompleted
              ? 'bg-[#B71C1C]/10 text-[#B71C1C] hover:bg-[#B71C1C] hover:text-white'
              : 'bg-[#B71C1C] text-white hover:bg-[#8F1414] shadow-xs active:scale-95'
          }`}
        >
          {isCompleted ? 'Review Lesson' : isResume ? 'Resume Learning' : isLocked ? '🔒 Complete Previous' : 'Start Scenario'}
        </button>
      </div>
    </div>
  );
};
