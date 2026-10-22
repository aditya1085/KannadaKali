export interface SpeechResult {
  hasKannadaVoice: boolean;
  voiceName?: string;
}

let cachedKannadaVoice: SpeechSynthesisVoice | null = null;
let voiceCheckDone = false;

export function checkKannadaVoiceSupport(): Promise<SpeechResult> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve({ hasKannadaVoice: false });
      return;
    }

    const check = () => {
      const voices = window.speechSynthesis.getVoices();
      const knVoice = voices.find(
        (v) =>
          v.lang.toLowerCase() === 'kn-in' ||
          v.lang.toLowerCase().startsWith('kn') ||
          v.name.toLowerCase().includes('kannada')
      );

      cachedKannadaVoice = knVoice || null;
      voiceCheckDone = true;
      resolve({
        hasKannadaVoice: !!knVoice,
        voiceName: knVoice?.name
      });
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      check();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        check();
      };
      // Timeout fallback
      setTimeout(check, 500);
    }
  });
}

export function speakKannada(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onVoiceMissing?: () => void
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis is not supported on this browser.');
    if (onVoiceMissing) onVoiceMissing();
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'kn-IN';
  utterance.rate = 0.85; // slightly slower for language learners
  utterance.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const knVoice = voices.find(
    (v) =>
      v.lang.toLowerCase() === 'kn-in' ||
      v.lang.toLowerCase().startsWith('kn') ||
      v.name.toLowerCase().includes('kannada')
  );

  if (knVoice) {
    utterance.voice = knVoice;
  } else {
    // If no dedicated kn-IN voice is installed, check for Indian English or Hindi as fallback accent
    const indianVoice = voices.find((v) => v.lang.toLowerCase().includes('in'));
    if (indianVoice) {
      utterance.voice = indianVoice;
    }
    if (onVoiceMissing) {
      onVoiceMissing();
    }
  }

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    console.warn('Speech synthesis event error:', e);
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}
