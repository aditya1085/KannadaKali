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

  // POST /api/chat
  async sendChatMessage(message: string, scenarioId: string): Promise<{
    sender: 'bot';
    kannada: string;
    roman: string;
    english: string;
    timestamp: string;
  }> {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, scenarioId })
    });
    if (!res.ok) {
      throw new ApiError('Failed to connect to chat API', res.status);
    }
    const json = await res.json();
    return json.reply;
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

  // POST /api/quiz/submit
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
