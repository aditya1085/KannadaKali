import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { SavedWord, Phrase } from '../types';

export interface UserLessonProgress {
  lessonId: string;
  completedPhrases: string[];
  status: 'locked' | 'in_progress' | 'done';
  updatedAt?: string;
}

export interface QuizRecord {
  id?: string;
  lessonId: string;
  score: number;
  total: number;
  percentage?: number;
  date: string;
}

export interface PracticeSessionRecord {
  id?: string;
  scenario: string;
  level: 'Beginner' | 'Intermediate';
  messageCount: number;
  date: string;
}

export const LESSON_ORDER = ['market', 'bus-auto', 'restaurant', 'hospital', 'office'];

export function normalizeLessonId(id: string): string {
  if (!id) return 'market';
  const lower = id.toLowerCase();
  if (lower === 'bus' || lower === 'auto' || lower === 'bus_auto') return 'bus-auto';
  return lower;
}

export function getNextLessonId(id: string): string | null {
  const norm = normalizeLessonId(id);
  const idx = LESSON_ORDER.indexOf(norm);
  if (idx !== -1 && idx < LESSON_ORDER.length - 1) {
    return LESSON_ORDER[idx + 1];
  }
  return null;
}

// Guest Mode localStorage Helpers
function getGuestProgress(): Record<string, UserLessonProgress> {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('kannadakali_guest_progress') : null;
    if (raw) return JSON.parse(raw);
  } catch {}
  const initial: Record<string, UserLessonProgress> = {
    market: { lessonId: 'market', completedPhrases: [], status: 'in_progress', updatedAt: new Date().toISOString() },
    'bus-auto': { lessonId: 'bus-auto', completedPhrases: [], status: 'locked' },
    restaurant: { lessonId: 'restaurant', completedPhrases: [], status: 'locked' },
    hospital: { lessonId: 'hospital', completedPhrases: [], status: 'locked' },
    office: { lessonId: 'office', completedPhrases: [], status: 'locked' },
  };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('kannadakali_guest_progress', JSON.stringify(initial));
    } catch {}
  }
  return initial;
}

function saveGuestProgress(map: Record<string, UserLessonProgress>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('kannadakali_guest_progress', JSON.stringify(map));
    window.dispatchEvent(new CustomEvent('kannadakali_guest_update'));
  } catch {}
}

function getGuestSavedWords(): SavedWord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('kannadakali_guest_saved_words');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveGuestSavedWords(words: SavedWord[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('kannadakali_guest_saved_words', JSON.stringify(words));
    window.dispatchEvent(new CustomEvent('kannadakali_guest_update'));
  } catch {}
}

function getGuestQuizzes(): QuizRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('kannadakali_guest_quizzes');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveGuestQuizzes(quizzes: QuizRecord[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('kannadakali_guest_quizzes', JSON.stringify(quizzes));
    window.dispatchEvent(new CustomEvent('kannadakali_guest_update'));
  } catch {}
}

function getGuestSessions(): PracticeSessionRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('kannadakali_guest_sessions');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveGuestSessions(sessions: PracticeSessionRecord[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('kannadakali_guest_sessions', JSON.stringify(sessions));
    window.dispatchEvent(new CustomEvent('kannadakali_guest_update'));
  } catch {}
}

export const firestoreService = {
  // Subscribe to all lesson progress documents for a user
  subscribeUserProgress(
    uid: string,
    onUpdate: (progressMap: Record<string, UserLessonProgress>) => void,
    onError?: (err: any) => void
  ) {
    if (uid.startsWith('guest')) {
      onUpdate(getGuestProgress());
      const handler = () => onUpdate(getGuestProgress());
      window.addEventListener('kannadakali_guest_update', handler);
      return () => window.removeEventListener('kannadakali_guest_update', handler);
    }

    const colPath = `users/${uid}/progress`;
    const colRef = collection(db, 'users', uid, 'progress');

    return onSnapshot(
      colRef,
      (snapshot) => {
        const progressMap: Record<string, UserLessonProgress> = {};
        snapshot.forEach((d) => {
          progressMap[d.id] = {
            lessonId: d.id,
            completedPhrases: d.data().completedPhrases || [],
            status: d.data().status || (d.id === 'market' ? 'in_progress' : 'locked'),
            updatedAt: d.data().updatedAt,
          };
        });
        onUpdate(progressMap);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, colPath);
      }
    );
  },

  // Mark a phrase as learned / toggle phrase completion
  async togglePhraseCompletion(
    uid: string,
    lessonId: string,
    phraseId: string,
    totalPhrasesCount: number = 8
  ): Promise<UserLessonProgress> {
    const normLessonId = normalizeLessonId(lessonId);

    if (uid.startsWith('guest')) {
      const progMap = getGuestProgress();
      const current = progMap[normLessonId] || { lessonId: normLessonId, completedPhrases: [], status: 'in_progress' };
      const currentCompleted = current.completedPhrases || [];
      const isAlready = currentCompleted.includes(phraseId);
      const updatedCompleted = isAlready ? currentCompleted.filter((id) => id !== phraseId) : [...currentCompleted, phraseId];
      let updatedStatus = current.status;
      if (updatedCompleted.length >= totalPhrasesCount) {
        updatedStatus = 'done';
      } else if (updatedStatus === 'done' && updatedCompleted.length < totalPhrasesCount) {
        updatedStatus = 'in_progress';
      } else if (updatedStatus === 'locked') {
        updatedStatus = 'in_progress';
      }

      const updated: UserLessonProgress = {
        lessonId: normLessonId,
        completedPhrases: updatedCompleted,
        status: updatedStatus,
        updatedAt: new Date().toISOString(),
      };
      progMap[normLessonId] = updated;

      if (updatedStatus === 'done') {
        const nextId = getNextLessonId(normLessonId);
        if (nextId && (!progMap[nextId] || progMap[nextId].status === 'locked')) {
          progMap[nextId] = {
            lessonId: nextId,
            completedPhrases: progMap[nextId]?.completedPhrases || [],
            status: 'in_progress',
            updatedAt: new Date().toISOString(),
          };
        }
      }

      saveGuestProgress(progMap);
      return updated;
    }

    const docPath = `users/${uid}/progress/${lessonId}`;
    const progressRef = doc(db, 'users', uid, 'progress', lessonId);

    try {
      const snap = await getDoc(progressRef);
      let currentCompleted: string[] = [];
      let currentStatus: 'locked' | 'in_progress' | 'done' = lessonId === 'market' ? 'in_progress' : 'locked';

      if (snap.exists()) {
        const data = snap.data();
        currentCompleted = data.completedPhrases || [];
        currentStatus = data.status || 'in_progress';
      }

      // Toggle phrase ID
      const isAlreadyCompleted = currentCompleted.includes(phraseId);
      let updatedCompleted: string[];

      if (isAlreadyCompleted) {
        updatedCompleted = currentCompleted.filter((id) => id !== phraseId);
      } else {
        updatedCompleted = [...currentCompleted, phraseId];
      }

      // Check if done
      let updatedStatus = currentStatus;
      if (updatedCompleted.length >= totalPhrasesCount) {
        updatedStatus = 'done';
      } else if (updatedStatus === 'done' && updatedCompleted.length < totalPhrasesCount) {
        updatedStatus = 'in_progress';
      } else if (updatedStatus === 'locked') {
        updatedStatus = 'in_progress';
      }

      const updatePayload = {
        completedPhrases: updatedCompleted,
        status: updatedStatus,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(progressRef, updatePayload, { merge: true });

      // If this lesson is now 'done', unlock the next lesson in sequence!
      if (updatedStatus === 'done') {
        const currentIndex = LESSON_ORDER.indexOf(lessonId);
        if (currentIndex !== -1 && currentIndex < LESSON_ORDER.length - 1) {
          const nextLessonId = LESSON_ORDER[currentIndex + 1];
          const nextRef = doc(db, 'users', uid, 'progress', nextLessonId);
          const nextSnap = await getDoc(nextRef);
          if (!nextSnap.exists() || nextSnap.data()?.status === 'locked') {
            await setDoc(
              nextRef,
              {
                completedPhrases: nextSnap.exists() ? nextSnap.data()?.completedPhrases || [] : [],
                status: 'in_progress',
                updatedAt: new Date().toISOString(),
              },
              { merge: true }
            );
          }
        }
      }

      return {
        lessonId,
        completedPhrases: updatedCompleted,
        status: updatedStatus,
        updatedAt: updatePayload.updatedAt,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
    }
  },

  // Subscribe to user saved words
  subscribeSavedWords(
    uid: string,
    onUpdate: (words: SavedWord[]) => void,
    onError?: (err: any) => void
  ) {
    if (uid.startsWith('guest')) {
      onUpdate(getGuestSavedWords());
      const handler = () => onUpdate(getGuestSavedWords());
      window.addEventListener('kannadakali_guest_update', handler);
      return () => window.removeEventListener('kannadakali_guest_update', handler);
    }

    const colPath = `users/${uid}/savedWords`;
    const colRef = collection(db, 'users', uid, 'savedWords');

    return onSnapshot(
      colRef,
      (snapshot) => {
        const words: SavedWord[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          words.push({
            id: d.id,
            kannada: data.kannada,
            roman: data.roman,
            english: data.english,
            hindi: data.hindi,
            category: data.category || 'General',
          });
        });
        onUpdate(words);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, colPath);
      }
    );
  },

  // Save a word
  async saveWord(uid: string, phrase: Phrase | { id: string; kannada: string; roman: string; english: string; hindi?: string; tip?: string }) {
    if (uid.startsWith('guest')) {
      const words = getGuestSavedWords();
      const existingIdx = words.findIndex((w) => w.id === phrase.id);
      const newWord: SavedWord = {
        id: phrase.id,
        kannada: phrase.kannada,
        roman: phrase.roman,
        english: phrase.english,
        hindi: phrase.hindi || '',
        tip: phrase.tip || '',
        savedAt: new Date().toISOString(),
      };
      if (existingIdx >= 0) {
        words[existingIdx] = newWord;
      } else {
        words.unshift(newWord);
      }
      saveGuestSavedWords(words);
      return;
    }

    const docPath = `users/${uid}/savedWords/${phrase.id}`;
    const wordRef = doc(db, 'users', uid, 'savedWords', phrase.id);

    try {
      await setDoc(wordRef, {
        id: phrase.id,
        kannada: phrase.kannada,
        roman: phrase.roman,
        english: phrase.english,
        hindi: phrase.hindi || '',
        tip: phrase.tip || '',
        savedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
    }
  },

  // Remove a word
  async removeWord(uid: string, phraseId: string) {
    if (uid.startsWith('guest')) {
      const words = getGuestSavedWords().filter((w) => w.id !== phraseId);
      saveGuestSavedWords(words);
      return;
    }

    const docPath = `users/${uid}/savedWords/${phraseId}`;
    const wordRef = doc(db, 'users', uid, 'savedWords', phraseId);

    try {
      await deleteDoc(wordRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, docPath);
    }
  },

  // Check if phrase is saved
  async isWordSaved(uid: string, phraseId: string): Promise<boolean> {
    if (uid.startsWith('guest')) {
      return getGuestSavedWords().some((w) => w.id === phraseId);
    }

    const docPath = `users/${uid}/savedWords/${phraseId}`;
    try {
      const snap = await getDoc(doc(db, 'users', uid, 'savedWords', phraseId));
      return snap.exists();
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, docPath);
    }
  },

  // Update streak on completing an activity (lesson, quiz, or AI chat) on a new day
  async updateStreakOnActivity(uid: string, localDateStr?: string): Promise<{ streak: number; lastActiveDate: string }> {
    const today = localDateStr || new Date().toLocaleDateString('en-CA');

    if (uid.startsWith('guest')) {
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('kannadakali_guest_streak') : null;
        let currentStreak = 1;
        let lastActive = '';
        if (raw) {
          const parsed = JSON.parse(raw);
          currentStreak = parsed.streak || 1;
          lastActive = parsed.lastActiveDate || '';
        }
        const d = new Date(`${today}T12:00:00Z`);
        d.setDate(d.getDate() - 1);
        const yesterday = d.toISOString().split('T')[0];

        let newStreak = currentStreak;
        if (lastActive === today) {
          newStreak = currentStreak > 0 ? currentStreak : 1;
        } else if (lastActive === yesterday) {
          newStreak = currentStreak + 1;
        } else if (lastActive) {
          newStreak = 1;
        }
        const updated = { streak: newStreak, lastActiveDate: today };
        if (typeof window !== 'undefined') {
          localStorage.setItem('kannadakali_guest_streak', JSON.stringify(updated));
          window.dispatchEvent(new CustomEvent('kannadakali_guest_update'));
        }
        return updated;
      } catch {
        return { streak: 1, lastActiveDate: today };
      }
    }

    const userRef = doc(db, 'users', uid);

    try {
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        const initData = {
          streak: 1,
          lastActiveDate: today,
        };
        await setDoc(userRef, initData, { merge: true });
        return initData;
      }

      const userData = snap.data();
      const lastActive = userData.lastActiveDate || '';
      const currentStreak = typeof userData.streak === 'number' ? userData.streak : 0;

      // Calculate yesterday based on local calendar date
      const d = new Date(`${today}T12:00:00Z`);
      d.setDate(d.getDate() - 1);
      const yesterday = d.toISOString().split('T')[0];

      let newStreak = currentStreak;
      if (lastActive === today) {
        // Multiple activities on the same day: do NOT increase streak twice
        newStreak = currentStreak > 0 ? currentStreak : 1;
      } else if (lastActive === yesterday) {
        // Activity completed on consecutive day: increment streak by 1
        newStreak = currentStreak + 1;
      } else {
        // Missed a day or first activity: reset streak to 1
        newStreak = 1;
      }

      await updateDoc(userRef, {
        streak: newStreak,
        lastActiveDate: today,
      });

      return { streak: newStreak, lastActiveDate: today };
    } catch (err) {
      console.warn('Error updating streak on activity:', err);
      return { streak: 1, lastActiveDate: today };
    }
  },

  // Save Quiz Result, enforce unlock rule (>=60% marks done & unlocks next), and update streak
  async recordQuizResult(
    uid: string,
    result: { lessonId: string; score: number; total: number; percentage?: number; userLocalDate?: string }
  ): Promise<{ passed: boolean; percentage: number; unlockedLessonId: string | null }> {
    const normLessonId = normalizeLessonId(result.lessonId);
    const total = result.total > 0 ? result.total : 5;
    const score = Math.max(0, Math.min(result.score, total));
    const percentage = result.percentage ?? Math.round((score / total) * 100);
    const passed = percentage >= 60;
    const nowIso = new Date().toISOString();

    if (uid.startsWith('guest')) {
      const quizzes = getGuestQuizzes();
      quizzes.unshift({
        id: `guest-q-${Date.now()}`,
        lessonId: normLessonId,
        score,
        total,
        percentage,
        date: nowIso,
      });
      saveGuestQuizzes(quizzes);
      await this.updateStreakOnActivity(uid, result.userLocalDate);

      let unlockedLessonId: string | null = null;
      const progMap = getGuestProgress();
      const current = progMap[normLessonId] || { lessonId: normLessonId, completedPhrases: [], status: 'in_progress' };

      if (passed) {
        progMap[normLessonId] = {
          ...current,
          status: 'done',
          updatedAt: nowIso,
        };
        const nextId = getNextLessonId(normLessonId);
        if (nextId) {
          const nextProg = progMap[nextId];
          if (!nextProg || nextProg.status === 'locked') {
            progMap[nextId] = {
              lessonId: nextId,
              completedPhrases: nextProg?.completedPhrases || [],
              status: 'in_progress',
              updatedAt: nowIso,
            };
            unlockedLessonId = nextId;
          }
        }
      } else if (current.status !== 'done') {
        progMap[normLessonId] = {
          ...current,
          status: 'in_progress',
          updatedAt: nowIso,
        };
      }
      saveGuestProgress(progMap);
      return { passed, percentage, unlockedLessonId };
    }

    const colPath = `users/${uid}/quizResults`;
    const newDocRef = doc(collection(db, 'users', uid, 'quizResults'));

    try {
      // 1. Record quiz result document
      await setDoc(newDocRef, {
        lessonId: normLessonId,
        score,
        total,
        percentage,
        date: nowIso,
      });

      // 2. Update streak for completing quiz activity
      await this.updateStreakOnActivity(uid, result.userLocalDate);

      let unlockedLessonId: string | null = null;

      // 3. Apply Unlock Rule:
      // Score >= 60% marks that lesson "done" and unlocks next lesson
      // Below 60%: keep status as in_progress
      const progressRef = doc(db, 'users', uid, 'progress', normLessonId);
      const progSnap = await getDoc(progressRef);
      const existingCompleted = progSnap.exists() ? progSnap.data()?.completedPhrases || [] : [];
      const currentStatus = progSnap.exists() ? progSnap.data()?.status : 'in_progress';

      if (passed) {
        await setDoc(
          progressRef,
          {
            completedPhrases: existingCompleted,
            status: 'done',
            updatedAt: nowIso,
          },
          { merge: true }
        );

        // Unlock next lesson in sequence
        const nextId = getNextLessonId(normLessonId);
        if (nextId) {
          const nextRef = doc(db, 'users', uid, 'progress', nextId);
          const nextSnap = await getDoc(nextRef);
          if (!nextSnap.exists() || nextSnap.data()?.status === 'locked') {
            await setDoc(
              nextRef,
              {
                completedPhrases: nextSnap.exists() ? nextSnap.data()?.completedPhrases || [] : [],
                status: 'in_progress',
                updatedAt: nowIso,
              },
              { merge: true }
            );
            unlockedLessonId = nextId;
          }
        }
      } else {
        // Below 60%: ensure not locked, keep in_progress
        if (currentStatus !== 'done') {
          await setDoc(
            progressRef,
            {
              completedPhrases: existingCompleted,
              status: 'in_progress',
              updatedAt: nowIso,
            },
            { merge: true }
          );
        }
      }

      return { passed, percentage, unlockedLessonId };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, colPath);
    }
  },

  // Subscribe to quiz results and get real average
  subscribeQuizResults(
    uid: string,
    onUpdate: (results: QuizRecord[]) => void,
    onError?: (err: any) => void
  ) {
    if (uid.startsWith('guest')) {
      onUpdate(getGuestQuizzes());
      const handler = () => onUpdate(getGuestQuizzes());
      window.addEventListener('kannadakali_guest_update', handler);
      return () => window.removeEventListener('kannadakali_guest_update', handler);
    }

    const colPath = `users/${uid}/quizResults`;
    const colRef = collection(db, 'users', uid, 'quizResults');

    return onSnapshot(
      colRef,
      (snapshot) => {
        const records: QuizRecord[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          const total = data.total || 5;
          const score = typeof data.score === 'number' ? data.score : 0;
          records.push({
            id: d.id,
            lessonId: normalizeLessonId(data.lessonId || 'market'),
            score,
            total,
            percentage: typeof data.percentage === 'number' ? data.percentage : Math.round((score / total) * 100),
            date: data.date || new Date().toISOString(),
          });
        });
        // Sort newest first
        records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        onUpdate(records);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, colPath);
      }
    );
  },

  // Record a practice session (>= 3 messages) and update streak
  async recordPracticeSession(
    uid: string,
    session: { scenario: string; level: 'Beginner' | 'Intermediate'; messageCount: number; userLocalDate?: string }
  ) {
    if (uid.startsWith('guest')) {
      const sessions = getGuestSessions();
      sessions.unshift({
        id: `guest-ps-${Date.now()}`,
        scenario: session.scenario,
        level: session.level,
        messageCount: session.messageCount,
        date: new Date().toISOString(),
      });
      saveGuestSessions(sessions);
      await this.updateStreakOnActivity(uid, session.userLocalDate);
      return;
    }

    const colPath = `users/${uid}/practiceSessions`;
    const newDocRef = doc(collection(db, 'users', uid, 'practiceSessions'));

    try {
      await setDoc(newDocRef, {
        scenario: session.scenario,
        level: session.level,
        messageCount: session.messageCount,
        date: new Date().toISOString(),
      });

      // Update streak for completing AI practice session on a new day
      await this.updateStreakOnActivity(uid, session.userLocalDate);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, colPath);
    }
  },

  // Subscribe to practice sessions
  subscribePracticeSessions(
    uid: string,
    onUpdate: (sessions: PracticeSessionRecord[]) => void,
    onError?: (err: any) => void
  ) {
    if (uid.startsWith('guest')) {
      onUpdate(getGuestSessions());
      const handler = () => onUpdate(getGuestSessions());
      window.addEventListener('kannadakali_guest_update', handler);
      return () => window.removeEventListener('kannadakali_guest_update', handler);
    }

    const colPath = `users/${uid}/practiceSessions`;
    const colRef = collection(db, 'users', uid, 'practiceSessions');

    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: PracticeSessionRecord[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          list.push({
            id: d.id,
            scenario: data.scenario,
            level: data.level,
            messageCount: data.messageCount,
            date: data.date,
          });
        });
        // Sort descending by date
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        onUpdate(list);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, colPath);
      }
    );
  },
};
