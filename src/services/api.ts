import { Lesson, SavedWord, UserStats, UserProfile, WeeklyDayActivity, QuizQuestion, ChatScenario, DailyPhrase } from '../types';
import chatScenariosJson from '../../data/chatScenarios.json';

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export interface AiChatReply {
  replyKannada: string;
  replyRoman: string;
  replyEnglish: string;
  correction: string | null;
  tip: string | null;
  timestamp: string;
}

export interface ChatHint {
  kannada: string;
  roman: string;
  english: string;
}

export const api = {
  // GET /api/lessons - Summary list
  async getLessons(): Promise<Lesson[]> {
    const res = await fetch('/api/lessons');
    if (!res.ok) {
      throw new ApiError(`Failed to fetch lessons (${res.status} ${res.statusText})`, res.status);
    }
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data)) {
      throw new ApiError(json.message || 'Invalid response from server');
    }
    return json.data;
  },

  // GET /api/lessons/:id - Full details with 8 phrases
  async getLessonById(id: string): Promise<Lesson> {
    const res = await fetch(`/api/lessons/${encodeURIComponent(id)}`);
    if (!res.ok) {
      throw new ApiError(
        res.status === 404
          ? `Scenario "${id}" could not be found.`
          : `Failed to load lesson (${res.status} ${res.statusText})`,
        res.status
      );
    }
    const json = await res.json();
    if (!json.success || !json.data) {
      throw new ApiError(json.message || 'Failed to retrieve lesson details');
    }
    return json.data;
  },

  // GET /api/daily-phrase - Deterministic date-based daily phrase
  async getDailyPhrase(): Promise<DailyPhrase> {
    const res = await fetch('/api/daily-phrase');
    if (!res.ok) {
      throw new ApiError('Failed to fetch daily phrase', res.status);
    }
    const json = await res.json();
    return json.data;
  },

  // GET /api/progress - Progress, daily phrase, and stats
  async getProgress(): Promise<{
    user: UserProfile;
    stats: UserStats;
    weeklyActivity: WeeklyDayActivity[];
    dailyPhrase: DailyPhrase;
    savedWords: SavedWord[];
  }> {
    const res = await fetch('/api/progress');
    if (!res.ok) {
      throw new ApiError('Failed to load user progress', res.status);
    }
    const json = await res.json();
    return json.data;
  },

  // POST /api/progress - Bookmark a word
  async saveWord(word: Omit<SavedWord, 'id'>): Promise<SavedWord[]> {
    const res = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_word', word })
    });
    if (!res.ok) {
      throw new ApiError('Failed to save word on server', res.status);
    }
    const json = await res.json();
    return json.savedWords;
  },

  // POST /api/progress - Delete a saved word
  async removeWord(id: string): Promise<SavedWord[]> {
    const res = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove_word', word: { id } })
    });
    if (!res.ok) {
      throw new ApiError('Failed to remove word on server', res.status);
    }
    const json = await res.json();
    return json.savedWords;
  },

  // GET /api/chat/scenarios
  async getChatScenarios(): Promise<ChatScenario[]> {
    try {
      const res = await fetch('/api/chat/scenarios');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) return json.data;
      }
    } catch (e) {
      console.warn('Chat scenarios fallback:', e);
    }
    return chatScenariosJson as unknown as ChatScenario[];
  },

  // POST /api/chat - Call Gemini on server with Firebase user authentication
  async sendAiChat(params: {
    scenario: string;
    level: string;
    history: Array<{ sender: 'user' | 'bot'; text?: string; kannada?: string }>;
    userMessage: string;
    idToken: string;
  }): Promise<AiChatReply> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (params.idToken) {
      headers['Authorization'] = `Bearer ${params.idToken}`;
    }

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        scenario: params.scenario,
        level: params.level,
        history: params.history,
        userMessage: params.userMessage,
      }),
    });

    if (!res.ok) {
      let errMessage = 'Failed to generate response.';
      try {
        const errorJson = await res.json();
        errMessage = errorJson.message || errMessage;
      } catch {}
      throw new ApiError(errMessage, res.status);
    }

    const json = await res.json();
    if (!json.success || !json.reply) {
      throw new ApiError(json.message || 'Invalid reply from AI');
    }
    return json.reply;
  },

  // POST /api/chat/hint - Ask Gemini for what to say next
  async getChatHint(params: {
    scenario: string;
    level: string;
    history: Array<{ sender: 'user' | 'bot'; text?: string; kannada?: string }>;
    idToken: string;
  }): Promise<ChatHint> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (params.idToken) {
      headers['Authorization'] = `Bearer ${params.idToken}`;
    }

    const res = await fetch('/api/chat/hint', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        scenario: params.scenario,
        level: params.level,
        history: params.history,
      }),
    });

    if (!res.ok) {
      throw new ApiError('Failed to fetch conversation hint', res.status);
    }

    const json = await res.json();
    return json.hint || {
      kannada: 'ಎಷ್ಟು ರೂಪಾಯಿ ಆಗುತ್ತೆ?',
      roman: 'Eshtu roopayi aagutte?',
      english: 'How many rupees will it be?',
    };
  },

  // GET /api/quiz
  async getQuizzes(): Promise<{ quizzes: QuizQuestion[] }> {
    const res = await fetch('/api/quiz');
    if (!res.ok) {
      throw new ApiError('Failed to fetch quiz', res.status);
    }
    const json = await res.json();
    return json.data;
  },

  // POST /api/quiz/submit - Full quiz submission with idToken verification
  async submitQuizResult(params: {
    lessonId: string;
    score: number;
    total: number;
    idToken: string;
    userLocalDate?: string;
  }): Promise<{
    passed: boolean;
    percentage: number;
    unlockedLessonId: string | null;
    result: {
      lessonId: string;
      score: number;
      total: number;
      percentage: number;
      passed: boolean;
      date: string;
    };
  }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (params.idToken) {
      headers['Authorization'] = `Bearer ${params.idToken}`;
    }

    const res = await fetch('/api/quiz/submit', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        lessonId: params.lessonId,
        score: params.score,
        total: params.total,
        userLocalDate: params.userLocalDate || new Date().toLocaleDateString('en-CA'),
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new ApiError(errJson.message || 'Failed to submit quiz score to server', res.status);
    }

    const json = await res.json();
    return {
      passed: json.result?.passed ?? (json.result?.percentage >= 60),
      percentage: json.result?.percentage ?? Math.round((params.score / params.total) * 100),
      unlockedLessonId: json.unlockedLessonId || null,
      result: json.result,
    };
  },

  // POST /api/progress - Update lesson progress
  async updateProgress(params: {
    lessonId: string;
    status: string;
    completedPhrases?: string[];
    idToken: string;
  }): Promise<{ success: boolean; lessonId: string; status: string; completedPhrases: string[] }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (params.idToken) {
      headers['Authorization'] = `Bearer ${params.idToken}`;
    }

    const res = await fetch('/api/progress', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'update_progress',
        lessonId: params.lessonId,
        status: params.status,
        completedPhrases: params.completedPhrases,
      }),
    });

    if (!res.ok) {
      throw new ApiError('Failed to update progress on server', res.status);
    }

    return await res.json();
  },

  // POST /api/quiz/submit (single question check compatibility)
  async submitQuizAnswer(quizId: string, selectedOptionId: string): Promise<{
    isCorrect: boolean;
    correctOptionId: string;
    explanation: string;
    score: number;
  }> {
    const res = await fetch('/api/quiz/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId, selectedOptionId })
    });
    if (!res.ok) {
      throw new ApiError('Failed to submit quiz answer', res.status);
    }
    const json = await res.json();
    return json.result;
  }
};
