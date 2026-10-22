/**
 * Centralized Audio Player with Server-side TTS first,
 * Web Speech API fallback, and rapid-tap management.
 */

import { api } from '../services/api';

interface PlayAudioOptions {
  text: string;
  slow?: boolean;
  idToken?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (msg: string) => void;
}

let activeAudioElement: HTMLAudioElement | null = null;
let currentPlayId = 0;
let currentActiveText: string | null = null;

export function stopAllAudio() {
  currentPlayId++;
  currentActiveText = null;

  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
      activeAudioElement.src = '';
    } catch {}
    activeAudioElement = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

export function getCurrentPlayingText(): string | null {
  return currentActiveText;
}

/**
 * Fallback to browser Web Speech API (kn-IN first, then hi-IN)
 */
function playWebSpeechFallback(
  text: string,
  slow: boolean,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (msg: string) => void
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onError?.('Audio not available right now');
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'kn-IN';
    utterance.rate = slow ? 0.65 : 0.85;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices() || [];
    const knVoice = voices.find(
      (v) =>
        v.lang.toLowerCase() === 'kn-in' ||
        v.lang.toLowerCase().startsWith('kn') ||
        v.name.toLowerCase().includes('kannada')
    );

    if (knVoice) {
      utterance.voice = knVoice;
    } else {
      const hiVoice = voices.find(
        (v) =>
          v.lang.toLowerCase() === 'hi-in' ||
          v.lang.toLowerCase().startsWith('hi') ||
          v.name.toLowerCase().includes('hindi') ||
          v.lang.toLowerCase().includes('in')
      );
      if (hiVoice) {
        utterance.voice = hiVoice;
      }
    }

    utterance.onstart = () => {
      onStart?.();
    };

    utterance.onend = () => {
      currentActiveText = null;
      onEnd?.();
    };

    utterance.onerror = () => {
      currentActiveText = null;
      onEnd?.();
      onError?.('Audio not available right now');
    };

    window.speechSynthesis.speak(utterance);
  } catch {
    currentActiveText = null;
    onEnd?.();
    onError?.('Audio not available right now');
  }
}

/**
 * Main play entrypoint: Server-side TTS -> Web Speech Fallback -> Friendly Error
 */
export async function playPhraseAudio(options: PlayAudioOptions) {
  const { text, slow = false, idToken, onStart, onEnd, onError } = options;

  if (!text || !text.trim()) {
    onError?.('No text provided for audio.');
    return;
  }

  // 1. Stop any currently playing audio immediately
  stopAllAudio();

  const thisPlayId = currentPlayId;
  currentActiveText = text;

  // 2. Attempt Server-side TTS (Gemini 3.8 TTS / Google Cloud TTS)
  try {
    const ttsResult = await api.getTtsAudio({
      text: text.trim(),
      slow,
      idToken,
    });

    // If another play request started while fetching, cancel this one
    if (thisPlayId !== currentPlayId) {
      return;
    }

    if (ttsResult && ttsResult.audio) {
      const audio = new Audio(ttsResult.audio);
      audio.playbackRate = slow ? 0.8 : 1.0;
      activeAudioElement = audio;

      audio.onplay = () => {
        if (thisPlayId === currentPlayId) {
          onStart?.();
        }
      };

      audio.onended = () => {
        if (thisPlayId === currentPlayId) {
          currentActiveText = null;
          activeAudioElement = null;
          onEnd?.();
        }
      };

      audio.onerror = () => {
        if (thisPlayId === currentPlayId) {
          activeAudioElement = null;
          // Fallback to Web Speech if audio playback fails
          playWebSpeechFallback(text, slow, onStart, onEnd, onError);
        }
      };

      try {
        await audio.play();
        return;
      } catch (playErr) {
        // Autoplay policy or format error -> fallback
        if (thisPlayId === currentPlayId) {
          playWebSpeechFallback(text, slow, onStart, onEnd, onError);
        }
        return;
      }
    }
  } catch (serverErr) {
    // If request cancelled by newer tap, ignore
    if (thisPlayId !== currentPlayId) {
      return;
    }
    // Server TTS failed -> fallback to browser Web Speech
    playWebSpeechFallback(text, slow, onStart, onEnd, onError);
  }
}
