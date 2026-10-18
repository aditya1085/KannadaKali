import React from 'react';
import { UserStats } from '../types';

interface StatCardsProps {
  stats: UserStats;
}

export const StatCards: React.FC<StatCardsProps> = ({ stats }) => {
  const statItems = [
    {
      id: 'streak',
      emoji: '🔥',
      value: `${stats.streakDays} ${stats.streakDays === 1 ? 'day' : 'days'}`,
      label: 'Streak',
      subtext: stats.streakDays > 0 ? 'Active learning streak' : 'Start your streak today'
    },
    {
      id: 'lessons',
      emoji: '📚',
      value: `${stats.completedLessons} / ${stats.totalLessons}`,
      label: 'Lessons',
      subtext: stats.completedLessons > 0 ? 'Scenarios completed' : 'Market unlocked'
    },
    {
      id: 'savedWords',
      emoji: '⭐',
      value: `${stats.savedWordsCount}`,
      label: 'Saved words',
      subtext: stats.savedWordsCount > 0 ? 'Vocabulary saved' : '0 words saved yet'
    },
    {
      id: 'quizScore',
      emoji: '🏆',
      value: `${stats.avgQuizScore}%`,
      label: 'Avg quiz score',
      subtext: stats.avgQuizScore > 0 ? 'Mastery accuracy' : 'Take a quiz to score'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-2xl p-5 kannada-card-shadow kannada-card-shadow-hover border border-[#FFF0B3]/70 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl" role="img" aria-label={item.label}>
              {item.emoji}
            </span>
            <span className="text-xs uppercase tracking-wider font-semibold text-[#6B5B4B] bg-[#FFF8E1] px-2 py-0.5 rounded-full border border-[#FFE082]/60">
              {item.label}
            </span>
          </div>

          <div>
            <div className="text-[30px] font-bold text-[#B71C1C] leading-none mb-1 tracking-tight">
              {item.value}
            </div>
            <div className="text-xs text-[#6B5B4B] font-medium">
              {item.subtext}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
