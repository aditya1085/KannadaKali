import React from 'react';
import { WeeklyDayActivity } from '../types';

interface WeeklyProgressChartProps {
  activity: WeeklyDayActivity[];
  streakDays?: number;
}

export const WeeklyProgressChart: React.FC<WeeklyProgressChartProps> = ({
  activity,
  streakDays = 1
}) => {
  const maxMinutes = Math.max(...activity.map((d) => d.minutes), 20);

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
            Target: 15 min/day
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
            'Practice scenario phrases today to start your learning streak!'
          )}
        </p>
      </div>

      {/* Bar Chart: Mon - Sun */}
      <div className="pt-2">
        <div className="h-36 flex items-end justify-between gap-2 px-2 pb-2 border-b border-[#FFF0B3]">
          {activity.map((dayItem, index) => {
            const heightPercent =
              dayItem.minutes > 0
                ? Math.min(100, Math.round((dayItem.minutes / maxMinutes) * 100))
                : 8;
            const isEmpty = dayItem.minutes === 0;

            return (
              <div
                key={`${dayItem.day}-${index}`}
                className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
              >
                {/* Tooltip on hover */}
                <div className="text-[10px] font-bold text-[#6B5B4B] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-[#FFF8E1] px-1 rounded shadow-xs">
                  {dayItem.minutes}m
                </div>

                {/* The Bar */}
                <div className="w-full max-w-[28px] flex items-end justify-center h-full">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      dayItem.isToday
                        ? 'bg-[#B71C1C] ring-2 ring-[#B71C1C]/20 shadow-xs'
                        : isEmpty
                        ? 'bg-[#FFF0B3]/60'
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
            <span className="w-2.5 h-2.5 rounded-xs bg-[#FFC107]" />
            <span>Practice</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#B71C1C]" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#FFF0B3]" />
            <span>No activity</span>
          </div>
        </div>
      </div>
    </div>
  );
};
