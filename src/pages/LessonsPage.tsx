import React, { useState } from 'react';
import { ScenarioCard } from '../components/ScenarioCard';
import { Lesson } from '../types';
import { Search } from 'lucide-react';
import { ScenarioCardSkeleton, ErrorStateView } from '../components/LoadingSkeleton';

interface LessonsPageProps {
  lessons: Lesson[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSelectLesson: (id: string) => void;
  onShowToast?: (msg: string) => void;
}

export const LessonsPage: React.FC<LessonsPageProps> = ({
  lessons,
  loading = false,
  error = null,
  onRetry,
  onSelectLesson,
  onShowToast,
}) => {
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [search, setSearch] = useState('');

  const filteredLessons = lessons.filter((l) => {
    const matchesFilter =
      filter === 'all'
        ? true
        : filter === 'in_progress'
        ? l.status === 'in_progress'
        : l.status === 'completed';
    const matchesSearch =
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.kannadaTitle.includes(search) ||
      l.description.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#2B2B2B] flex items-center gap-2">
            <span>📚</span> Practical Scenario Lessons
          </h1>
          <p className="text-xs md:text-sm text-[#6B5B4B] mt-1 font-kannada">
            ದೈನಂದಿನ ಜೀವನದ ಕನ್ನಡ ಪಾಠಗಳು · Learn 8 essential spoken phrases per scenario
          </p>
        </div>

        {/* Search & Filter pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B5B4B]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scenarios..."
              className="pl-9 pr-3 py-2 text-xs rounded-xl border border-[#FFE082] bg-white focus:outline-none focus:ring-2 focus:ring-[#B71C1C] text-[#2B2B2B] w-48 sm:w-56 shadow-xs"
            />
          </div>

          <div className="flex items-center bg-white p-1 rounded-xl border border-[#FFE082] shadow-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filter === 'all' ? 'bg-[#B71C1C] text-white' : 'text-[#6B5B4B] hover:text-[#2B2B2B]'
              }`}
            >
              All ({lessons.length || 5})
            </button>
            <button
              onClick={() => setFilter('in_progress')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filter === 'in_progress' ? 'bg-[#B71C1C] text-white' : 'text-[#6B5B4B] hover:text-[#2B2B2B]'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filter === 'completed' ? 'bg-[#B71C1C] text-white' : 'text-[#6B5B4B] hover:text-[#2B2B2B]'
              }`}
            >
              Completed
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <ErrorStateView
          title="Unable to load scenario lessons"
          message={error}
          onRetry={onRetry}
        />
      )}

      {/* Loading Skeletons */}
      {loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <ScenarioCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Grid of Scenario Cards */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {filteredLessons.map((lesson) => (
            <ScenarioCard
              key={lesson.id}
              lesson={lesson}
              onSelect={onSelectLesson}
              onLockedClick={() => onShowToast && onShowToast('Finish the previous lesson to unlock')}
            />
          ))}
        </div>
      )}
    </div>
  );
};
