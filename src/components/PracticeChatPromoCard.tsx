import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface PracticeChatPromoCardProps {
  onStartChat: () => void;
}

export const PracticeChatPromoCard: React.FC<PracticeChatPromoCardProps> = ({ onStartChat }) => {
  return (
    <div className="bg-white rounded-2xl p-5 kannada-card-shadow border border-[#FFF0B3]/80 flex flex-col justify-between h-full">
      <div>
        {/* Title */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💬</span>
            <h3 className="font-bold text-lg text-[#2B2B2B]">
              AI practice chat
            </h3>
          </div>
          <span className="text-xs bg-[#FFF0B3] text-[#B71C1C] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles size={12} /> Interactive
          </span>
        </div>

        <p className="text-xs text-[#6B5B4B] mb-4">
          Practice realistic dialogues with simulated vendors, auto drivers, and servers.
        </p>

        {/* Cream box showing scenario and sample line */}
        <div className="bg-[#FFF8E1] rounded-xl p-4 border border-[#FFE082]/70 mb-5 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#6B5B4B]">
            Scenario: Sabzi wale se baat karo
          </div>

          <div className="font-kannada text-xl font-bold text-[#B71C1C]">
            ಟೊಮೆಟೊ ಎಷ್ಟು ರೂಪಾಯಿ?
          </div>

          <div className="text-xs text-[#6B5B4B]">
            Tomato eshtu roopayi? · <span className="italic">How much are the tomatoes?</span>
          </div>
        </div>
      </div>

      {/* Maroon button */}
      <button
        onClick={onStartChat}
        className="w-full min-h-[44px] px-5 py-2.5 rounded-[10px] font-bold text-sm bg-[#B71C1C] text-white hover:bg-[#8F1414] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
      >
        <span>Start chat →</span>
      </button>
    </div>
  );
};
