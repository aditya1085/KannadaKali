import { Lesson, Phrase, QuizQuestion, QuizOption } from '../types';

// Helper to shuffle an array immutably
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generates 5 multiple-choice questions from a lesson's own 8 phrases.
 * Mixes three question types:
 * 1. Kannada to English
 * 2. English to Kannada
 * 3. Roman to meaning
 *
 * Wrong options strictly come from other phrases of the same lesson,
 * shuffled, with no duplicates and exactly one correct answer.
 */
export function generateLessonQuiz(lesson: Lesson): QuizQuestion[] {
  const phrases = lesson.phrases || [];
  if (phrases.length === 0) {
    return [];
  }

  // Shuffle available phrases and select 5 unique phrases for the 5 questions
  const shuffledPhrases = shuffleArray(phrases);
  const selectedPhrases = shuffledPhrases.slice(0, Math.min(5, shuffledPhrases.length));

  // Pattern of question types for variety
  const questionTypes: Array<'kannada_to_english' | 'english_to_kannada' | 'roman_to_meaning'> = [
    'kannada_to_english',
    'english_to_kannada',
    'roman_to_meaning',
    'kannada_to_english',
    'english_to_kannada',
  ];

  const questions: QuizQuestion[] = selectedPhrases.map((targetPhrase, index) => {
    const qType = questionTypes[index % questionTypes.length];
    const otherPhrases = shuffleArray(phrases.filter((p) => p.id !== targetPhrase.id)).slice(0, 3);

    let promptText = '';
    let promptSubtext = '';
    let questionTitle = '';
    let audioKannada = targetPhrase.kannada;

    const correctOptionId = `opt-${targetPhrase.id}-correct`;
    let rawOptions: Array<{ id: string; displayText: string; subText?: string; kannada?: string; roman?: string; english?: string }> = [];

    if (qType === 'kannada_to_english') {
      questionTitle = 'Choose the correct English meaning';
      promptText = targetPhrase.kannada;
      promptSubtext = targetPhrase.roman;

      rawOptions = [
        {
          id: correctOptionId,
          displayText: targetPhrase.english,
          subText: targetPhrase.hindi ? `Hindi: ${targetPhrase.hindi}` : undefined,
          english: targetPhrase.english,
        },
        ...otherPhrases.map((op, i) => ({
          id: `opt-${op.id}-wrong-${i}`,
          displayText: op.english,
          subText: op.hindi ? `Hindi: ${op.hindi}` : undefined,
          english: op.english,
        })),
      ];
    } else if (qType === 'english_to_kannada') {
      questionTitle = 'How do you say this in Kannada?';
      promptText = targetPhrase.english;
      promptSubtext = targetPhrase.hindi ? `Hindi: ${targetPhrase.hindi}` : '';

      rawOptions = [
        {
          id: correctOptionId,
          displayText: targetPhrase.kannada,
          subText: `${targetPhrase.roman} · ${targetPhrase.english}`,
          kannada: targetPhrase.kannada,
          roman: targetPhrase.roman,
          english: targetPhrase.english,
        },
        ...otherPhrases.map((op, i) => ({
          id: `opt-${op.id}-wrong-${i}`,
          displayText: op.kannada,
          subText: `${op.roman} · ${op.english}`,
          kannada: op.kannada,
          roman: op.roman,
          english: op.english,
        })),
      ];
    } else {
      // roman_to_meaning
      questionTitle = 'What does this spoken phrase mean?';
      promptText = targetPhrase.roman;
      promptSubtext = targetPhrase.kannada;

      rawOptions = [
        {
          id: correctOptionId,
          displayText: targetPhrase.english,
          subText: `"${targetPhrase.kannada}"`,
          english: targetPhrase.english,
        },
        ...otherPhrases.map((op, i) => ({
          id: `opt-${op.id}-wrong-${i}`,
          displayText: op.english,
          subText: `"${op.kannada}"`,
          english: op.english,
        })),
      ];
    }

    // Shuffle the 4 options so the correct answer is not always in the same slot
    const shuffledOptions: QuizOption[] = shuffleArray(rawOptions).map((opt) => ({
      id: opt.id,
      displayText: opt.displayText,
      subText: opt.subText,
      kannada: opt.kannada,
      roman: opt.roman,
      english: opt.english,
    }));

    const tipNote = targetPhrase.tip || targetPhrase.usageTip || '';
    const explanation = `"${targetPhrase.kannada}" (${targetPhrase.roman}) means "${targetPhrase.english}".${
      tipNote ? ` Tip: ${tipNote}` : ''
    }`;

    return {
      id: `q-${lesson.id}-${targetPhrase.id}-${index}`,
      type: qType,
      scenario: lesson.title,
      scenarioKannada: lesson.kannadaTitle,
      question: questionTitle,
      audioKannada,
      promptText,
      promptSubtext,
      options: shuffledOptions,
      correctOptionId,
      explanation,
    };
  });

  return questions;
}
