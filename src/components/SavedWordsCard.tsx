import React, { useState } from 'react';
import { Trash2, BookmarkCheck, Search } from 'lucide-react';
import { SavedWord } from '../types';
import { AudioButton } from './AudioButton';

interface SavedWordsCardProps {
  words: SavedWord[];
  onRemoveWord: (id: string) => void;
  onVoiceMissing?: () => void;
}

export const SavedWordsCard: React.FC<SavedWordsCardProps> = ({
  words,
  onRemoveWord,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredWords = words.filter(
    (w) =>
      w.kannada.includes(searchQuery) ||
      w.roman.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.english.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl p-5 md:p-6 kannada-card-shadow border border-[#FFF0B3]/80">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⭐</span>
          <div>
            <h3 className="font-bold text-lg md:text-xl text-[#2B2B2B]">
              Saved words
            </h3>
            <p className="text-xs text-[#6B5B4B]">
              Quick revision of key words you've bookmarked
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B5B4B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search words..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#FFE082] bg-[#FFF8E1] focus:outline-none focus:ring-1 focus:ring-[#B71C1C] text-[#2B2B2B] w-36 sm:w-44"
            />
          </div>
          <span className="text-xs font-bold text-[#B71C1C] bg-[#FFF0B3] px-2.5 py-1.5 rounded-lg border border-[#FFE082]">
            {words.length} saved
          </span>
        </div>
      </div>

      {/* 3-column Grid */}
      {filteredWords.length === 0 ? (
        <div className="text-center py-8 bg-[#FFF8E1] rounded-xl border border-dashed border-[#FFE082]">
          <BookmarkCheck size={32} className="mx-auto text-[#6B5B4B] mb-2" />
          <p className="text-sm font-semibold text-[#2B2B2B]">No saved words yet</p>
          <p className="text-xs text-[#6B5B4B] mt-1">
            Tap the ❤️ Save button on any phrase card in lessons to build your personal vocabulary bank.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {filteredWords.map((word) => {
            return (
              <div
                key={word.id}
                className="bg-[#FFF8E1]/80 hover:bg-[#FFF0B3]/50 border border-[#FFE082] rounded-xl p-4 flex items-center justify-between transition-all group"
              >
                {/* Word info */}
                <div className="pr-2 min-w-0">
                  {/* Large Kannada word */}
                  <div className="font-kannada font-bold text-2xl text-[#2B2B2B] group-hover:text-[#B71C1C] transition-colors truncate">
                    {word.kannada}
                  </div>
                  {/* Roman + meaning small */}
                  <div className="text-xs text-[#6B5B4B] mt-0.5 truncate font-medium">
                    <span className="font-semibold text-[#2B2B2B]">{word.roman}</span> · {word.english}
                  </div>
                </div>

                {/* Actions: Listen & Delete */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Listen icon button */}
                  <AudioButton
                    text={word.kannada}
                    variant="icon"
                    size="sm"
                    ariaLabel={`Pronounce ${word.roman}`}
                  />

                  {/* Delete icon button */}
                  <button
                    onClick={() => onRemoveWord(word.id)}
                    title="Remove from saved words"
                    className="p-2 rounded-lg text-[#6B5B4B] hover:text-[#B71C1C] hover:bg-white active:scale-95 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
