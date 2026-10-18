import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export const apiRouter = Router();

// Helper to load JSON files safely
function loadJson(fileName: string) {
  try {
    const filePath = path.resolve(process.cwd(), 'data', fileName);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (err) {
    console.error(`Error reading ${fileName}:`, err);
  }
  return null;
}

// In-memory working copies for step 2
let lessonsData = loadJson('lessons.json') || [];
let progressData = loadJson('userProgress.json') || {};
let savedWordsData = loadJson('savedWords.json') || [];
let quizData = loadJson('quizData.json') || { quizzes: [] };
let chatScenariosData = loadJson('chatScenarios.json') || [];

// Helper to calculate daily phrase based on today's date (changes every day at midnight)
function getDailyPhraseFromLessons() {
  const allPhrases: Array<{
    id: string;
    kannada: string;
    roman: string;
    english: string;
    hindi: string;
    tip?: string;
    scenarioTitle: string;
    scenarioEmoji: string;
  }> = [];

  for (const lesson of lessonsData) {
    if (Array.isArray(lesson.phrases)) {
      for (const phrase of lesson.phrases) {
        allPhrases.push({
          ...phrase,
          scenarioTitle: lesson.title,
          scenarioEmoji: lesson.emoji
        });
      }
    }
  }

  if (allPhrases.length === 0) {
    return {
      kannada: 'ನಮಸ್ಕಾರ',
      roman: 'Namaskara',
      meaning: 'Hello / Greetings',
      hindi: 'Namaste',
      tip: 'Everyday polite greeting to start any interaction warmly.',
      scenarioTitle: 'Market',
      scenarioEmoji: '🛒'
    };
  }

  const now = new Date();
  // Format: YYYY-MM-DD
  const dateKey = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;

  // Deterministic DJB2-like string hash
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash << 5) - hash + dateKey.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % allPhrases.length;
  const chosen = allPhrases[index];

  return {
    date: dateKey,
    id: chosen.id,
    kannada: chosen.kannada,
    roman: chosen.roman,
    meaning: chosen.english,
    english: chosen.english,
    hindi: chosen.hindi,
    tip: chosen.tip,
    scenarioTitle: chosen.scenarioTitle,
    scenarioEmoji: chosen.scenarioEmoji
  };
}

// GET /api/lessons - list with title, emoji, phrase count, progress and status
apiRouter.get('/lessons', (req: Request, res: Response) => {
  try {
    const list = lessonsData.map((lesson: any) => ({
      id: lesson.id,
      title: lesson.title,
      emoji: lesson.emoji,
      kannadaTitle: lesson.kannadaTitle,
      romanTitle: lesson.romanTitle,
      description: lesson.description,
      phraseCount: lesson.phrases ? lesson.phrases.length : 0,
      totalPhrases: lesson.phrases ? lesson.phrases.length : 0,
      completedPhrases: lesson.completedPhrases || (lesson.status === 'completed' ? (lesson.phrases?.length || 8) : lesson.status === 'in_progress' ? 3 : 0),
      status: lesson.status,
      progress: lesson.progress,
      badge: lesson.badge
    }));

    res.json({
      success: true,
      data: list
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve lessons'
    });
  }
});

// GET /api/lessons/:id - full phrases with Kannada script, Roman, English, Hinglish, tip
apiRouter.get('/lessons/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const lesson = lessonsData.find((l: any) => l.id.toLowerCase() === id.toLowerCase());

  if (!lesson) {
    return res.status(404).json({
      success: false,
      message: `Scenario lesson with id "${id}" not found.`
    });
  }

  res.json({
    success: true,
    data: {
      ...lesson,
      phraseCount: lesson.phrases ? lesson.phrases.length : 0,
      totalPhrases: lesson.phrases ? lesson.phrases.length : 0,
      completedPhrases: lesson.completedPhrases || (lesson.status === 'completed' ? (lesson.phrases?.length || 8) : lesson.status === 'in_progress' ? 3 : 0)
    }
  });
});

// GET /api/daily-phrase - date-based daily phrase
apiRouter.get('/daily-phrase', (req: Request, res: Response) => {
  const daily = getDailyPhraseFromLessons();
  res.json({
    success: true,
    data: daily
  });
});

// POST /api/chat
apiRouter.post('/chat', (req: Request, res: Response) => {
  const { message, scenarioId } = req.body;
  const trimmed = (message || '').trim();

  const scenario = chatScenariosData.find((s: any) => s.id === scenarioId) || chatScenariosData[0];
  let matchedReply = scenario?.dummyResponses?.[trimmed];

  if (!matchedReply) {
    matchedReply = scenario?.dummyResponses?.default || {
      kannada: "ಧನ್ಯವಾದಗಳು! ನಾನು ಅರ್ಥ ಮಾಡಿಕೊಂಡೆ.",
      roman: "Dhanyavadagalu! Naanu artha maadkonde.",
      english: "Thank you! I understood. Keep practicing!"
    };
  }

  res.json({
    success: true,
    reply: {
      sender: 'bot',
      ...matchedReply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  });
});

// POST /api/quiz/submit
apiRouter.post('/quiz/submit', (req: Request, res: Response) => {
  const { quizId, selectedOptionId } = req.body;
  const quiz = quizData.quizzes?.find((q: any) => q.id === quizId);

  if (!quiz) {
    return res.status(404).json({ success: false, message: 'Quiz question not found' });
  }

  const isCorrect = quiz.correctOptionId === selectedOptionId;
  res.json({
    success: true,
    result: {
      isCorrect,
      correctOptionId: quiz.correctOptionId,
      explanation: quiz.explanation,
      score: isCorrect ? 100 : 0
    }
  });
});

// GET /api/progress
apiRouter.get('/progress', (req: Request, res: Response) => {
  const dailyPhrase = getDailyPhraseFromLessons();

  res.json({
    success: true,
    data: {
      ...progressData,
      dailyPhrase,
      savedWords: savedWordsData
    }
  });
});

// POST /api/progress
apiRouter.post('/progress', (req: Request, res: Response) => {
  const { action, word, lessonId } = req.body;

  if (action === 'save_word' && word) {
    const exists = savedWordsData.some((w: any) => w.kannada === word.kannada);
    if (!exists) {
      savedWordsData.unshift({
        id: `sw-${Date.now()}`,
        ...word
      });
      if (progressData.stats) {
        progressData.stats.savedWordsCount = savedWordsData.length;
      }
    }
    return res.json({ success: true, savedWords: savedWordsData });
  }

  if (action === 'remove_word' && word?.id) {
    savedWordsData = savedWordsData.filter((w: any) => w.id !== word.id);
    if (progressData.stats) {
      progressData.stats.savedWordsCount = savedWordsData.length;
    }
    return res.json({ success: true, savedWords: savedWordsData });
  }

  if (action === 'update_lesson_progress' && lessonId) {
    const lesson = lessonsData.find((l: any) => l.id === lessonId);
    if (lesson) {
      const total = lesson.phrases ? lesson.phrases.length : 8;
      lesson.completedPhrases = Math.min(total, (lesson.completedPhrases || 0) + 1);
      lesson.progress = Math.round((lesson.completedPhrases / total) * 100);
      if (lesson.progress >= 100) {
        lesson.status = 'completed';
        lesson.badge = '✅ Done';
      }
    }
    return res.json({ success: true, lesson });
  }

  res.json({
    success: true,
    message: 'Progress recorded',
    data: progressData
  });
});

// GET /api/chat/scenarios
apiRouter.get('/chat/scenarios', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: chatScenariosData
  });
});

// GET /api/quiz
apiRouter.get('/quiz', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: quizData
  });
});
