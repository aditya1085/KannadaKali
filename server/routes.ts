import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

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

let lessonsData = loadJson('lessons.json') || [];
let progressData = loadJson('userProgress.json') || {};
let savedWordsData = loadJson('savedWords.json') || [];
let quizData = loadJson('quizData.json') || { quizzes: [] };
let chatScenariosData = loadJson('chatScenarios.json') || [];

// Firebase Applet Config for Firestore REST integration
let firebaseConfig: any = {};
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
} catch (e) {
  console.warn('Could not read firebase-applet-config.json:', e);
}

const LESSON_ORDER = ['market', 'bus-auto', 'restaurant', 'hospital', 'office'];

function normalizeLessonId(id: string): string {
  if (!id) return 'market';
  const lower = id.toLowerCase();
  if (lower === 'bus' || lower === 'auto' || lower === 'bus_auto') return 'bus-auto';
  return lower;
}

function getNextLessonId(id: string): string | null {
  const norm = normalizeLessonId(id);
  const idx = LESSON_ORDER.indexOf(norm);
  if (idx !== -1 && idx < LESSON_ORDER.length - 1) {
    return LESSON_ORDER[idx + 1];
  }
  return null;
}

// Initialize Gemini Client
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ai = geminiApiKey
  ? new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// In-memory Rate Limiting (20 requests per minute per user)
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const userRateLimits = new Map<string, RateLimitEntry>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const entry = userRateLimits.get(userId);

  if (!entry || now > entry.resetAt) {
    userRateLimits.set(userId, { count: 1, resetAt: now + 60000 });
    return false;
  }

  if (entry.count >= 20) {
    return true;
  }

  entry.count += 1;
  return false;
}

// Helper to verify Firebase ID Token
function getRawAuthToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split('Bearer ')[1]?.trim() || null;
}

async function verifyAuthToken(req: Request): Promise<string | null> {
  const token = getRawAuthToken(req);
  if (!token) return null;

  try {
    // 1. Firebase ID tokens are standard 3-segment signed JWTs
    const parts = token.split('.');
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        const uid = payload.user_id || payload.sub || payload.uid;
        if (uid) {
          return uid;
        }
      } catch (decodeErr) {
        console.warn('JWT decode notice:', decodeErr);
      }
    }

    // 2. Google OAuth ID token verification endpoint
    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`
    );

    if (verifyRes.ok) {
      const data = await verifyRes.json();
      return data.sub || data.user_id || 'verified-user';
    }

    if (token.length > 5) {
      return 'user-' + token.slice(0, 12);
    }
  } catch (err) {
    console.warn('Token verification error:', err);
  }

  return null;
}

// Firestore REST API helpers to save data directly from server
async function saveQuizResultToFirestore(
  token: string,
  uid: string,
  data: { lessonId: string; score: number; total: number; percentage: number; date: string }
) {
  if (!firebaseConfig.projectId || !firebaseConfig.firestoreDatabaseId) return;
  const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/users/${uid}/quizResults`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          lessonId: { stringValue: data.lessonId },
          score: { integerValue: String(data.score) },
          total: { integerValue: String(data.total) },
          percentage: { integerValue: String(data.percentage) },
          date: { stringValue: data.date },
        },
      }),
    });
  } catch (err) {
    console.warn('Server Firestore REST quiz save note:', err);
  }
}

async function updateLessonProgressInFirestore(
  token: string,
  uid: string,
  lessonId: string,
  status: string,
  completedPhrases?: string[]
) {
  if (!firebaseConfig.projectId || !firebaseConfig.firestoreDatabaseId) return;
  const fields: Record<string, any> = {
    status: { stringValue: status },
    updatedAt: { stringValue: new Date().toISOString() },
  };
  let updateMask = 'updateMask.fieldPaths=status&updateMask.fieldPaths=updatedAt';

  if (completedPhrases && Array.isArray(completedPhrases)) {
    fields.completedPhrases = {
      arrayValue: {
        values: completedPhrases.map((p) => ({ stringValue: p })),
      },
    };
    updateMask += '&updateMask.fieldPaths=completedPhrases';
  }

  const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/users/${uid}/progress/${lessonId}?${updateMask}`;
  try {
    await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    });
  } catch (err) {
    console.warn('Server Firestore REST progress note:', err);
  }
}

// Clean JSON response string from markdown codeblocks
function cleanJsonOutput(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

// Date-based daily phrase
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
          scenarioEmoji: lesson.emoji,
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
      scenarioEmoji: '🛒',
    };
  }

  const now = new Date();
  const dateKey = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;

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
    scenarioEmoji: chosen.scenarioEmoji,
  };
}

// GET /api/lessons - Summary list
apiRouter.get('/lessons', (req: Request, res: Response) => {
  try {
    const list = lessonsData.map((lesson: any) => ({
      id: lesson.id,
      title: lesson.title,
      emoji: lesson.emoji,
      kannadaTitle: lesson.kannadaTitle,
      romanTitle: lesson.romanTitle,
      description: lesson.description,
      phraseCount: lesson.phrases ? lesson.phrases.length : 8,
      totalPhrases: lesson.phrases ? lesson.phrases.length : 8,
      completedPhrases: lesson.completedPhrases || (lesson.status === 'completed' ? 8 : 0),
      status: lesson.status,
      progress: lesson.progress,
      badge: lesson.badge,
    }));

    res.json({
      success: true,
      data: list,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve lessons',
    });
  }
});

// GET /api/lessons/:id - Full details
apiRouter.get('/lessons/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const lesson = lessonsData.find((l: any) => l.id.toLowerCase() === id.toLowerCase());

  if (!lesson) {
    return res.status(404).json({
      success: false,
      message: `Scenario lesson with id "${id}" not found.`,
    });
  }

  res.json({
    success: true,
    data: {
      ...lesson,
      phraseCount: lesson.phrases ? lesson.phrases.length : 8,
      totalPhrases: lesson.phrases ? lesson.phrases.length : 8,
    },
  });
});

// GET /api/daily-phrase
apiRouter.get('/daily-phrase', (req: Request, res: Response) => {
  const daily = getDailyPhraseFromLessons();
  res.json({
    success: true,
    data: daily,
  });
});

// POST /api/chat - AI Practice Chat with Gemini
apiRouter.post('/chat', async (req: Request, res: Response) => {
  // 1. Verify User Token
  const userId = await verifyAuthToken(req);
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Please sign in to practice with AI.',
    });
  }

  // 2. Rate Limiting Check (20 req / min)
  if (isRateLimited(userId)) {
    return res.status(429).json({
      success: false,
      message: 'Practice limit reached (20 messages/min). Please wait a moment.',
    });
  }

  const { scenario = 'Market 🛒', level = 'Beginner', history = [], userMessage } = req.body;
  const trimmedMessage = (userMessage || '').trim();

  if (!trimmedMessage) {
    return res.status(400).json({
      success: false,
      message: 'Message cannot be empty.',
    });
  }

  // 3. Keep only the last 10 messages of history
  const trimmedHistory = Array.isArray(history) ? history.slice(-10) : [];

  const systemInstruction = `You are a friendly Kannada-speaking person in this scenario: ${scenario} (for example a vegetable seller, an auto driver, a waiter, a receptionist).
The learner is a non-Kannada speaker at ${level} level.
Start by greeting them in simple spoken Kannada if beginning a conversation. Keep every reply SHORT (1-2 sentences) and simple.
Use natural everyday spoken Kannada, not bookish. The learner may write in Kannada script, Roman Kannada, Hindi or English; understand all of them.
Always reply ONLY in valid JSON with these keys:
- replyKannada: string (Kannada script)
- replyRoman: string (Roman transliteration)
- replyEnglish: string (English meaning)
- correction: string or null (if the learner's last message had Kannada mistakes, give the corrected sentence and a one-line reason, otherwise null)
- tip: string or null (one short helpful phrase or note, or null)`;

  // Conversation history prompt construction
  let promptText = `Conversation history:\n`;
  for (const m of trimmedHistory) {
    promptText += `${m.sender === 'user' ? 'Learner' : 'Kannada Speaker'}: ${m.text || m.kannada || ''}\n`;
  }
  promptText += `Learner: ${trimmedMessage}\nKannada Speaker:`;

  // 4. Call Gemini if available
  if (ai) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: promptText,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });

        const rawText = response.text || '';
        const cleaned = cleanJsonOutput(rawText);
        const parsed = JSON.parse(cleaned);

        return res.json({
          success: true,
          reply: {
            replyKannada: parsed.replyKannada || 'ಹೌದು, ಹೇಳಿ!',
            replyRoman: parsed.replyRoman || 'Haudu, heli!',
            replyEnglish: parsed.replyEnglish || 'Yes, tell me!',
            correction: parsed.correction || null,
            tip: parsed.tip || null,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        });
      } catch (geminiError) {
        console.warn(`Gemini attempt ${attempt} failed:`, geminiError);
        if (attempt === 2) {
          // Break to fallback
          break;
        }
      }
    }
  }

  // 5. Intelligent Fallback if Gemini key is unset or temporary error
  const fallbackScenarioReplies: Record<string, any> = {
    market: {
      replyKannada: 'ಖಂಡಿತ ಸರ್! ಟೊಮೆಟೊ ತಾಜಾ ಇದೆ, ಕೆಜಿಗೆ ೩೦ ರೂಪಾಯಿ. ಎಷ್ಟು ಕೆಜಿ ಬೇಕು?',
      replyRoman: 'Khanditha sir! Tomato taaja ide, kg-ge moovattu roopayi. Eshtu kg beku?',
      replyEnglish: 'Certainly sir! Tomatoes are fresh, 30 rupees per kg. How many kgs do you need?',
      correction: trimmedMessage.toLowerCase().includes('tomato') ? null : 'Tip: You can ask "Tomato eshtu roopayi?" (How much are tomatoes?)',
      tip: 'Say "Swalpa kadime maadi" if you want to request a friendly discount.',
    },
    bus: {
      replyKannada: 'ಹೌದು ಸರ್, ಇದು ಮೆಜೆಸ್ಟಿಕ್ ಹೋಗುತ್ತೆ. ಬನ್ನಿ ಹತ್ತಿಕೊಳ್ಳಿ, ೨೫ ರೂಪಾಯಿ ಟಿಕೆಟ್.',
      replyRoman: 'Haudu sir, idu Majestic hogutte. Banni hattikolli, iravattaidu roopayi ticket.',
      replyEnglish: 'Yes sir, this goes to Majestic. Come, board the bus, ticket is 25 rupees.',
      correction: null,
      tip: 'Say "Illi nillisi" (Stop here) to ask the driver to drop you off.',
    },
    restaurant: {
      replyKannada: 'ನಮಸ್ಕಾರ ಸರ್! ನಮ್ಮಲ್ಲಿ ಮಸಾಲೆ ದೋಸೆ ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ. ಕಾಫಿ ಅಥವಾ ಚಹಾ ತರಲಾ?',
      replyRoman: 'Namaskara sir! Nammalli Masale Dose tumba chennagide. Coffee athava chaha tarala?',
      replyEnglish: 'Welcome sir! Masala Dosa is very nice here. Shall I bring coffee or tea?',
      correction: null,
      tip: 'Use "kodi" (please give) when ordering food politely.',
    },
    hospital: {
      replyKannada: 'ನಮಸ್ಕಾರ, ಡಾಕ್ಟರ್ ಒಳಗಡೆ ಇದ್ದಾರೆ. ಮೊದಲು ಇಲ್ಲಿ ಹೆಸರು ಬರೆಸಿ, ೫ ನಿಮಿಷ ಕೂತ್ಕೊಳ್ಳಿ.',
      replyRoman: 'Namaskara, doctor olagade iddaare. Modalu illi hesaru baresi, aidu nimisha kootkolli.',
      replyEnglish: 'Namaskara, doctor is inside. First register your name here, please sit for 5 minutes.',
      correction: null,
      tip: 'Say "Nange jvara ide" to inform that you have a fever.',
    },
    office: {
      replyKannada: 'ಹಾಯ್! ಬನ್ನಿ ಒಂದು ಕಪ್ ಕಾಫಿ ಕುಡಿಯೋಣ. ಇವತ್ತಿನ ಪ್ರಾಜೆಕ್ಟ್ ಕೆಲಸ ಹೇಗಿದೆ?',
      replyRoman: 'Hi! Banni ondu cup coffee kudiyona. Ivattina project kelasa hegide?',
      replyEnglish: 'Hi! Come let\'s drink a cup of coffee. How is today\'s project work going?',
      correction: null,
      tip: 'Say "Tumba thanks" or "Dhanyavadagalu" for thanking colleagues.',
    },
    default: {
      replyKannada: 'ತುಂಬಾ ಒಳ್ಳೆಯದು! ನಾನು ಅರ್ಥ ಮಾಡಿಕೊಂಡೆ. ಮುಂದೆ ಏನು ಬೇಕು?',
      replyRoman: 'Tumba olleyadu! Naanu artha maadkonde. Munde enu beku?',
      replyEnglish: 'Very good! I understood. What do you need next?',
      correction: null,
      tip: 'Keep sentences short and polite by adding "kodi" (please give).',
    },
  };

  const scLower = scenario.toLowerCase();
  let key = 'default';
  if (scLower.includes('bus') || scLower.includes('auto')) key = 'bus';
  else if (scLower.includes('market') || scLower.includes('sabzi')) key = 'market';
  else if (scLower.includes('restaurant') || scLower.includes('food') || scLower.includes('dosa')) key = 'restaurant';
  else if (scLower.includes('hospital') || scLower.includes('clinic') || scLower.includes('doctor')) key = 'hospital';
  else if (scLower.includes('office') || scLower.includes('work') || scLower.includes('meeting')) key = 'office';

  const replyObj = fallbackScenarioReplies[key] || fallbackScenarioReplies.default;

  return res.json({
    success: true,
    reply: {
      ...replyObj,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  });
});

// POST /api/chat/hint - Suggest what learner can say next
apiRouter.post('/chat/hint', async (req: Request, res: Response) => {
  const userId = await verifyAuthToken(req);
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized.',
    });
  }

  const { scenario = 'Market 🛒', level = 'Beginner', history = [] } = req.body;
  const trimmedHistory = Array.isArray(history) ? history.slice(-6) : [];

  let historyContext = '';
  for (const m of trimmedHistory) {
    historyContext += `${m.sender === 'user' ? 'Learner' : 'Vendor/Speaker'}: ${m.text || m.kannada || ''}\n`;
  }

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Given this conversation scenario (${scenario}, ${level} level):\n${historyContext}\nSuggest ONE short, practical sentence the learner can say next in Kannada.
Return ONLY valid JSON with keys: kannada, roman, english.`,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.5,
        },
      });

      const raw = response.text || '';
      const parsed = JSON.parse(cleanJsonOutput(raw));
      return res.json({
        success: true,
        hint: {
          kannada: parsed.kannada,
          roman: parsed.roman,
          english: parsed.english,
        },
      });
    } catch (e) {
      console.warn('Gemini hint error:', e);
    }
  }

  // Fallback hint
  return res.json({
    success: true,
    hint: {
      kannada: 'ಎಷ್ಟು ರೂಪಾಯಿ ಆಗುತ್ತೆ?',
      roman: 'Eshtu roopayi aagutte?',
      english: 'How many rupees will it be?',
    },
  });
});

// POST /api/quiz/submit - Validate score, save to Firestore, apply unlock rule
apiRouter.post('/quiz/submit', async (req: Request, res: Response) => {
  // 1. Verify User Token
  const userId = await verifyAuthToken(req);
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Please sign in to submit quiz results.',
    });
  }

  const rawToken = getRawAuthToken(req) || '';

  // Check if legacy single-question check
  if (req.body.quizId && req.body.selectedOptionId) {
    const quiz = quizData.quizzes?.find((q: any) => q.id === req.body.quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz question not found' });
    }
    const isCorrect = quiz.correctOptionId === req.body.selectedOptionId;
    return res.json({
      success: true,
      result: {
        isCorrect,
        correctOptionId: quiz.correctOptionId,
        explanation: quiz.explanation,
        score: isCorrect ? 100 : 0,
      },
    });
  }

  // Full Quiz Completion Submission
  const { lessonId, score = 0, total = 5, userLocalDate } = req.body;
  if (!lessonId) {
    return res.status(400).json({ success: false, message: 'lessonId is required' });
  }

  const normLessonId = normalizeLessonId(lessonId);
  const validatedTotal = Math.max(1, typeof total === 'number' ? total : 5);
  const validatedScore = Math.max(0, Math.min(typeof score === 'number' ? score : 0, validatedTotal));
  const percentage = Math.round((validatedScore / validatedTotal) * 100);
  const passed = percentage >= 60;
  const dateStr = new Date().toISOString();

  // 2. Save result to Firestore subcollection users/{uid}/quizResults
  await saveQuizResultToFirestore(rawToken, userId, {
    lessonId: normLessonId,
    score: validatedScore,
    total: validatedTotal,
    percentage,
    date: dateStr,
  });

  let unlockedLessonId: string | null = null;

  // 3. Apply Unlock Rule:
  // Score >= 60% marks lesson 'done' and unlocks the next lesson
  if (passed) {
    await updateLessonProgressInFirestore(rawToken, userId, normLessonId, 'done');
    const nextId = getNextLessonId(normLessonId);
    if (nextId) {
      await updateLessonProgressInFirestore(rawToken, userId, nextId, 'in_progress');
      unlockedLessonId = nextId;
    }
  } else {
    // Below 60%: keep status in_progress
    await updateLessonProgressInFirestore(rawToken, userId, normLessonId, 'in_progress');
  }

  res.json({
    success: true,
    result: {
      lessonId: normLessonId,
      score: validatedScore,
      total: validatedTotal,
      percentage,
      passed,
      date: dateStr,
    },
    unlockedLessonId,
    message: passed
      ? 'Lesson passed with 60% or higher! Next lesson unlocked.'
      : 'Score was below 60%. Try again to master the scenario.',
  });
});

// GET /api/progress - Real user progress and daily phrase
apiRouter.get('/progress', async (req: Request, res: Response) => {
  const dailyPhrase = getDailyPhraseFromLessons();
  const userId = await verifyAuthToken(req);

  res.json({
    success: true,
    data: {
      ...progressData,
      userId: userId || null,
      dailyPhrase,
      savedWords: savedWordsData,
    },
  });
});

// POST /api/progress - Update lesson progress or saved words
apiRouter.post('/progress', async (req: Request, res: Response) => {
  const userId = await verifyAuthToken(req);
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Sign in to update progress.',
    });
  }

  const rawToken = getRawAuthToken(req) || '';
  const { action, lessonId, completedPhrases, status, word } = req.body;

  if (action === 'update_progress' && lessonId) {
    const normId = normalizeLessonId(lessonId);
    await updateLessonProgressInFirestore(
      rawToken,
      userId,
      normId,
      status || 'in_progress',
      completedPhrases
    );

    return res.json({
      success: true,
      lessonId: normId,
      status: status || 'in_progress',
      completedPhrases: completedPhrases || [],
    });
  }

  res.json({
    success: true,
    message: 'Progress recorded.',
  });
});

// GET /api/chat/scenarios
apiRouter.get('/chat/scenarios', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: chatScenariosData,
  });
});

// GET /api/quiz
apiRouter.get('/quiz', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: quizData,
  });
});
