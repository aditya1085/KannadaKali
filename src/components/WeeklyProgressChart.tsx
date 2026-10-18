import React from 'react';
import { WeeklyDayActivity } from '../types';

interface WeeklyProgressChartProps {
  activity: WeeklyDayActivity[];
  streakDays?: number;
}

export const WeeklyProgressChart: React.FC<WeeklyProgressChartProps> = ({
  activity,
  streakDays = 1,
}) => {
  const maxCount = Math.max(...activity.map((d) => d.count || 0), 4);
  const totalActivitiesThisWeek = activity.reduce((sum, d) => sum + (d.count || 0), 0);

  return (
    <div className="bg-white rounded-2xl p-5 kannada-card-shadow border border-[#FFF0B3]/80 flex flex-col justify-between h-full">
      <div>
        {/* Title */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📈</span>
            <h3 className="font-bold text-lg text-[#2B2B2B]">
              Weekly progress
            </h3>
          </div>
          <span className="text-xs bg-[#FFF8E1] text-[#6B5B4B] font-semibold px-2.5 py-0.5 rounded-full border border-[#FFE082]">
            {totalActivitiesThisWeek} {totalActivitiesThisWeek === 1 ? 'activity' : 'activities'} this week
          </span>
        </div>

        <p className="text-xs text-[#6B5B4B] mb-5">
          {streakDays > 0 ? (
            <>
              Consistent practice keeps your{' '}
              <span className="font-bold text-[#B71C1C]">
                {streakDays}-day streak
              </span>{' '}
              active!
            </>
          ) : (
            'Complete lessons, quizzes, or AI practice today to build your streak!'
          )}
        </p>
      </div>

      {/* Bar Chart: Mon - Sun */}
      <div className="pt-2">
        <div className="h-36 flex items-end justify-between gap-2 px-2 pb-2 border-b border-[#FFF0B3]">
          {activity.map((dayItem, index) => {
            const count = dayItem.count || 0;
            const isEmpty = count === 0;
            const heightPercent = isEmpty
              ? 6
              : Math.max(18, Math.min(100, Math.round((count / maxCount) * 100)));

            return (
              <div
                key={`${dayItem.day}-${index}`}
                className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative"
              >
                {/* Tooltip with count on hover */}
                <div className="text-[10px] font-bold text-[#2B2B2B] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-[#FFF8E1] border border-[#FFE082] px-2 py-0.5 rounded-md shadow-xs pointer-events-none z-10 absolute -top-7">
                  {count} {count === 1 ? 'activity' : 'activities'}
                </div>

                {/* The Bar */}
                <div className="w-full max-w-[28px] flex items-end justify-center h-full">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      dayItem.isToday
                        ? 'bg-[#B71C1C] ring-2 ring-[#B71C1C]/20 shadow-xs'
                        : isEmpty
                        ? 'bg-[#FFF0B3]/50'
                        : 'bg-[#FFC107] hover:bg-[#FFE082]'
                    }`}
                  />
                </div>

                {/* Day label */}
                <span
                  className={`text-xs font-semibold ${
                    dayItem.isToday
                      ? 'text-[#B71C1C] font-bold underline decoration-[#FFC107] decoration-2'
                      : 'text-[#6B5B4B]'
                  }`}
                >
                  {dayItem.day}
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[11px] text-[#6B5B4B] pt-3 px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#B71C1C]" />
            <span className="font-semibold text-[#2B2B2B]">Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#FFC107]" />
            <span>Active days</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#FFF0B3]/60" />
            <span>No activity</span>
          </div>
        </div>
      </div>
    </div>
  );
};
