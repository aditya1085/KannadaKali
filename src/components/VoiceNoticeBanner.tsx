import React from 'react';
import { Info, X, Volume2 } from 'lucide-react';

interface VoiceNoticeBannerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceNoticeBanner: React.FC<VoiceNoticeBannerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:max-w-md z-50 animate-in fade-in slide-in-from-bottom duration-300">
      <div className="bg-[#FFF8E1] border-2 border-[#FFC107] rounded-2xl p-4 shadow-xl flex items-start gap-3">
        <div className="p-2 rounded-xl bg-[#FFC107] text-[#B71C1C] shrink-0 mt-0.5">
          <Volume2 size={20} />
        </div>
        <div className="flex-1 text-xs text-[#2B2B2B]">
          <h4 className="font-bold text-[#B71C1C] text-sm mb-1 flex items-center gap-1.5">
            <Info size={14} /> Kannada Voice Notice
          </h4>
          <p className="leading-relaxed text-[#6B5B4B]">
            Your browser or device currently does not have an offline Kannada (kn-IN) speech pack installed.
            Audio playback will use the best available phonetic Indian synthesizer.
          </p>
          <p className="mt-1.5 text-[11px] text-[#2B2B2B] font-medium">
            💡 Tip: To get a natural human voice, you can download the Kannada voice pack in your device's System Speech/Language settings.
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-[#6B5B4B] hover:text-[#B71C1C] hover:bg-[#FFE082]"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
