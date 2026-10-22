import React, { useState } from 'react';
import { Heart, Check, Lightbulb } from 'lucide-react';
import { AudioButton } from './AudioButton';

interface DailyPhraseCardProps {
  phrase?: {
    kannada: string;
    roman: string;
    meaning?: string;
    english?: string;
    hindi?: string;
    tip?: string;
    scenarioTitle?: string;
    scenarioEmoji?: string;
  };
  onSave?: (phrase: { kannada: string; roman: string; english: string }) => void;
  onVoiceMissing?: () => void;
}

export const DailyPhraseCard: React.FC<DailyPhraseCardProps> = ({
  phrase = {
    kannada: 'ನಮಸ್ಕಾರ',
    roman: 'Namaskara',
    meaning: 'Hello / Greetings',
    hindi: 'Namaste',
    tip: 'Everyday polite greeting to start any interaction warmly.'
  },
  onSave,
}) => {
  const [isSaved, setIsSaved] = useState(false);

  const displayMeaning = phrase.meaning || phrase.english || 'Hello / Greetings';

  const handleSave = () => {
    setIsSaved(!isSaved);
    if (!isSaved && onSave) {
      onSave({
        kannada: phrase.kannada,
        roman: phrase.roman,
        english: displayMeaning
      });
    }
  };

  return (
    <div className="bg-[#B71C1C] text-white rounded-2xl p-6 md:p-7 shadow-[0_12px_28px_-6px_rgba(183,28,28,0.35)] relative overflow-hidden">
      {/* Subtle traditional rangoli/kolam background watermark design */}
      <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none select-none text-[150px] leading-none font-kannada">
        ಕ
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        {/* Left: Phrase Details */}
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wider uppercase bg-white/15 px-2.5 py-0.5 rounded-full backdrop-blur-xs text-[#FFE082]">
              📅 DAILY PHRASE
            </span>
            {phrase.scenarioTitle && (
              <span className="text-xs text-white/80 bg-black/15 px-2 py-0.5 rounded-full">
                {phrase.scenarioEmoji} {phrase.scenarioTitle}
              </span>
            )}
            <span className="text-xs text-white/70 hidden sm:inline">
              Today's bite-sized Kannada
            </span>
          </div>

          <h2 className="text-[36px] font-bold font-kannada text-white tracking-wide leading-tight pt-1">
            {phrase.kannada}
          </h2>

          <p className="text-base md:text-lg text-white/95 font-medium">
            {phrase.roman} <span className="text-[#FFE082] mx-1.5">·</span> {displayMeaning}
          </p>

          {phrase.hindi && (
            <p className="text-xs text-white/80 font-normal">
              Hindi: <span className="font-semibold text-white/95">{phrase.hindi}</span>
            </p>
          )}

          {phrase.tip && (
            <div className="flex items-center gap-1.5 text-xs text-[#FFE082] pt-1">
              <Lightbulb size={13} className="shrink-0" />
              <span>{phrase.tip}</span>
            </div>
          )}
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Yellow Listen button */}
          <AudioButton
            text={phrase.kannada}
            variant="daily"
            label="🔊 Listen"
            ariaLabel={`Listen to daily phrase ${phrase.roman}`}
          />

          {/* White Save button */}
          <button
            onClick={handleSave}
            className={`min-h-[44px] px-5 py-2.5 rounded-[10px] font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 ${
              isSaved
                ? 'bg-white text-[#B71C1C] ring-2 ring-[#FFC107]'
                : 'bg-white text-[#2B2B2B] hover:bg-[#FFF8E1]'
            }`}
          >
            {isSaved ? (
              <>
                <Check size={18} className="text-[#B71C1C]" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Heart size={18} className="text-[#B71C1C] fill-[#B71C1C]" />
                <span>❤️ Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
