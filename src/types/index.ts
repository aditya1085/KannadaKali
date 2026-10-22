export interface Phrase {
  id: string;
  kannada: string;
  roman: string;
  english: string;
  hindi: string; // Roman Hinglish
  tip?: string;
  usageTip?: string;
}

export interface Lesson {
  id: string;
  title: string;
  emoji: string;
  kannadaTitle: string;
  romanTitle: string;
  description: string;
  phraseCount?: number;
  totalPhrases: number;
  completedPhrases: number;
  status: 'completed' | 'in_progress' | 'not_started' | 'locked';
  progress: number;
  badge: string;
  phrases?: Phrase[];
}

export interface DailyPhrase {
  date?: string;
  id?: string;
  kannada: string;
  roman: string;
  meaning: string;
  english?: string;
  hindi: string;
  tip?: string;
  scenarioTitle?: string;
  scenarioEmoji?: string;
}

export interface SavedWord {
  id: string;
  kannada: string;
  roman: string;
  english: string;
  hindi?: string;
  category?: string;
  tip?: string;
  savedAt?: string;
}

export interface WeeklyDayActivity {
  day: string;
  short: string;
  minutes: number;
  count: number;
  target: number;
  isToday: boolean;
}

export interface UserStats {
  streakDays: number;
  completedLessons: number;
  totalLessons: number;
  savedWordsCount: number;
  avgQuizScore: number | null;
}

export interface UserProfile {
  name: string;
  email: string;
  avatarInitials: string;
  joinedDate: string;
  dailyGoalMinutes: number;
}

export interface QuizOption {
  id: string;
  kannada?: string;
  roman?: string;
  english?: string;
  displayText: string;
  subText?: string;
}

export interface QuizQuestion {
  id: string;
  type: 'kannada_to_english' | 'english_to_kannada' | 'roman_to_meaning';
  scenario: string;
  scenarioKannada?: string;
  question: string;
  questionKannada?: string;
  audioKannada?: string;
  promptText: string;
  promptSubtext?: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  kannada: string;
  roman?: string;
  english?: string;
  correction?: string | null;
  tip?: string | null;
  timestamp: string;
}

export interface ChatScenario {
  id: string;
  title: string;
  emoji?: string;
  kannadaTitle: string;
  category: string;
  vendorName: string;
  vendorRole: string;
  description: string;
  initialMessage: {
    sender: 'bot';
    kannada: string;
    roman: string;
    english: string;
    timestamp: string;
  };
  starterSuggestions?: Array<{
    label: string;
    kannada: string;
    roman: string;
    english: string;
  }>;
  quickReplies?: Array<{
    kannada: string;
    roman: string;
    english: string;
  }>;
  dummyResponses?: Record<string, {
    kannada: string;
    roman: string;
    english: string;
  }>;
}
