import React from 'react';

export const ScenarioCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-5 kannada-card-shadow border border-[#FFF0B3]/80 animate-pulse flex flex-col justify-between h-[280px]">
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="w-10 h-10 bg-[#FFF0B3] rounded-xl" />
          <div className="w-16 h-5 bg-[#FFF0B3] rounded-full" />
        </div>
        <div className="w-28 h-5 bg-stone-200 rounded mb-2" />
        <div className="w-20 h-4 bg-[#FFE082] rounded mb-3" />
        <div className="w-full h-3 bg-stone-100 rounded mb-1" />
        <div className="w-3/4 h-3 bg-stone-100 rounded" />
      </div>

      <div>
        <div className="w-full h-1.5 bg-[#FFF0B3] rounded-full mb-3" />
        <div className="w-full h-10 bg-[#FFF0B3] rounded-[10px]" />
      </div>
    </div>
  );
};

export const PhraseCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-5 kannada-card-shadow border border-[#FFF0B3] animate-pulse flex flex-col justify-between min-h-[200px]">
      <div>
        <div className="flex justify-between items-center mb-3">
          <div className="w-20 h-5 bg-[#FFF8E1] rounded-full" />
          <div className="flex gap-2">
            <div className="w-20 h-9 bg-[#FFF0B3] rounded-[10px]" />
            <div className="w-16 h-9 bg-stone-200 rounded-[10px]" />
          </div>
        </div>

        <div className="w-40 h-8 bg-stone-200 rounded mb-2" />
        <div className="w-32 h-5 bg-[#FFE082] rounded mb-1" />
        <div className="w-48 h-4 bg-stone-100 rounded mb-1" />
        <div className="w-36 h-4 bg-stone-100 rounded" />
      </div>

      <div className="w-full h-8 bg-[#FFF8E1] rounded mt-4" />
    </div>
  );
};

export const ErrorStateView: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
}> = ({
  title = 'Could not load lesson data',
  message,
  onRetry
}) => {
  return (
    <div className="bg-white rounded-2xl p-8 border border-rose-200 shadow-sm text-center max-w-md mx-auto my-8">
      <div className="text-4xl mb-3">⚠️</div>
      <h3 className="font-bold text-lg text-[#2B2B2B] mb-1">{title}</h3>
      <p className="text-xs text-[#6B5B4B] mb-5 leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="min-h-[44px] px-6 rounded-[10px] bg-[#B71C1C] text-white hover:bg-[#8F1414] font-bold text-xs shadow-xs active:scale-95 transition-all"
        >
          Try Again
        </button>
      )}
    </div>
  );
};
