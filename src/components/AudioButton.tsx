import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Loader2, Turtle } from 'lucide-react';
import { playPhraseAudio, stopAllAudio, getCurrentPlayingText } from '../utils/audioPlayer';
import { useAuth } from '../context/AuthContext';

export interface AudioButtonProps {
  text: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'pill' | 'button' | 'daily';
  label?: string;
  showSlowToggle?: boolean;
  className?: string;
  ariaLabel?: string;
  onPlayStart?: () => void;
  onPlayingChange?: (isPlaying: boolean) => void;
}

export const AudioButton: React.FC<AudioButtonProps> = ({
  text,
  size = 'md',
  variant = 'button',
  label,
  showSlowToggle = false,
  className = '',
  ariaLabel,
  onPlayStart,
  onPlayingChange,
}) => {
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSlow, setIsSlow] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Sync state if another audio starts playing
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isMountedRef.current) return;
      const activeText = getCurrentPlayingText();
      if (isPlaying && activeText !== text) {
        setIsPlaying(false);
        onPlayingChange?.(false);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [isPlaying, text, onPlayingChange]);

  const handlePlay = async (slowMode = isSlow) => {
    if (isPlaying) {
      stopAllAudio();
      setIsPlaying(false);
      setIsLoading(false);
      onPlayingChange?.(false);
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    let idToken = '';
    try {
      if (user && typeof user.getIdToken === 'function') {
        idToken = await user.getIdToken();
      }
    } catch {
      // Continue even if token retrieval fails; server will handle or fallback to Web Speech
    }

    if (!isMountedRef.current) return;

    await playPhraseAudio({
      text,
      slow: slowMode,
      idToken,
      onStart: () => {
        if (!isMountedRef.current) return;
        setIsLoading(false);
        setIsPlaying(true);
        onPlayStart?.();
        onPlayingChange?.(true);
      },
      onEnd: () => {
        if (!isMountedRef.current) return;
        setIsLoading(false);
        setIsPlaying(false);
        onPlayingChange?.(false);
      },
      onError: (msg) => {
        if (!isMountedRef.current) return;
        setIsLoading(false);
        setIsPlaying(false);
        onPlayingChange?.(false);
        setErrorMessage(msg || 'Audio not available right now');
        setTimeout(() => {
          if (isMountedRef.current) setErrorMessage(null);
        }, 3000);
      },
    });
  };

  // Base icon size
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;

  // Determine appearance by variant
  let buttonClasses = '';
  if (variant === 'icon') {
    buttonClasses = `p-2 rounded-xl text-[#2B2B2B] hover:text-[#B71C1C] hover:bg-black/5 active:scale-95 transition-all flex items-center justify-center ${
      isPlaying ? 'bg-[#FFE082] text-[#B71C1C] ring-2 ring-[#B71C1C]' : ''
    }`;
  } else if (variant === 'pill') {
    buttonClasses = `text-xs font-semibold px-2.5 py-1 rounded-full transition-all flex items-center gap-1.5 ${
      isPlaying
        ? 'bg-[#B71C1C] text-white shadow-xs'
        : 'text-[#B71C1C] bg-[#FFF0B3] hover:bg-[#FFE082]'
    }`;
  } else if (variant === 'daily') {
    buttonClasses = `min-h-[44px] px-5 py-2.5 rounded-[10px] font-semibold text-sm bg-[#FFC107] text-[#2B2B2B] hover:bg-[#FFE082] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm ${
      isPlaying ? 'ring-2 ring-white animate-pulse' : ''
    }`;
  } else {
    // Standard 'button' variant
    buttonClasses = `min-h-[38px] px-3 py-1.5 rounded-[10px] text-xs font-bold bg-[#FFC107] text-[#2B2B2B] hover:bg-[#FFE082] active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-2xs ${
      isPlaying ? 'ring-2 ring-[#B71C1C] bg-[#FFE082]' : ''
    }`;
  }

  const effectiveAriaLabel = ariaLabel || `Listen to Kannada pronunciation for: ${text}`;

  return (
    <div className={`inline-flex items-center gap-1 relative ${className}`}>
      {/* Main Pronounce Button */}
      <button
        type="button"
        onClick={() => handlePlay(isSlow)}
        disabled={isLoading}
        className={`${buttonClasses} focus-visible:outline-2 focus-visible:outline-[#B71C1C] disabled:opacity-75`}
        aria-label={effectiveAriaLabel}
        title={isPlaying ? 'Click to stop pronunciation' : 'Listen to pronunciation'}
      >
        {isLoading ? (
          <Loader2 size={iconSize} className="animate-spin text-[#B71C1C]" />
        ) : isPlaying ? (
          <VolumeX size={iconSize} className="text-[#B71C1C]" />
        ) : (
          <Volume2 size={iconSize} />
        )}

        {label !== undefined ? (
          <span>{isLoading ? 'Loading...' : isPlaying ? 'Playing' : label}</span>
        ) : variant !== 'icon' ? (
          <span>{isLoading ? 'Loading...' : isPlaying ? 'Playing' : '🔊 Listen'}</span>
        ) : null}
      </button>

      {/* Optional Slow 🐢 Mode Toggle for Lesson cards */}
      {showSlowToggle && (
        <button
          type="button"
          onClick={() => {
            const nextSlow = !isSlow;
            setIsSlow(nextSlow);
            if (isPlaying) {
              handlePlay(nextSlow);
            }
          }}
          className={`min-h-[38px] px-2 py-1.5 rounded-[10px] text-xs font-bold border transition-all flex items-center gap-1 shadow-2xs active:scale-95 ${
            isSlow
              ? 'bg-[#B71C1C] text-white border-[#B71C1C]'
              : 'bg-white text-[#6B5B4B] border-[#FFE082] hover:bg-[#FFF8E1]'
          }`}
          title={isSlow ? 'Slow speed active (0.75x). Click for normal' : 'Click for slow pronunciation (0.75x)'}
          aria-label={isSlow ? 'Slow speed enabled' : 'Enable slow speed'}
        >
          <Turtle size={14} />
          <span className="hidden sm:inline">{isSlow ? 'Slow 0.75x' : 'Slow'}</span>
        </button>
      )}

      {/* Friendly Error Notice Bubble */}
      {errorMessage && (
        <div
          role="status"
          className="absolute left-0 bottom-full mb-1 z-30 whitespace-nowrap bg-[#2B2B2B] text-white text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-md animate-in fade-in duration-150"
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
};
