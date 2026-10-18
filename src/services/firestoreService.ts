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
  date: string;
}

export interface PracticeSessionRecord {
  id?: string;
  scenario: string;
  level: 'Beginner' | 'Intermediate';
  messageCount: number;
  date: string;
}

const LESSON_ORDER = ['market', 'bus-auto', 'restaurant', 'hospital', 'office'];

export const firestoreService = {
  // Subscribe to all lesson progress documents for a user
  subscribeUserProgress(
    uid: string,
    onUpdate: (progressMap: Record<string, UserLessonProgress>) => void,
    onError?: (err: any) => void
  ) {
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
    const docPath = `users/${uid}/savedWords/${phraseId}`;
    try {
      const snap = await getDoc(doc(db, 'users', uid, 'savedWords', phraseId));
      return snap.exists();
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, docPath);
    }
  },

  // Save Quiz Result
  async recordQuizResult(uid: string, result: { lessonId: string; score: number; total: number }) {
    const colPath = `users/${uid}/quizResults`;
    const newDocRef = doc(collection(db, 'users', uid, 'quizResults'));

    try {
      await setDoc(newDocRef, {
        lessonId: result.lessonId,
        score: result.score,
        total: result.total,
        date: new Date().toISOString(),
      });
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
    const colPath = `users/${uid}/quizResults`;
    const colRef = collection(db, 'users', uid, 'quizResults');

    return onSnapshot(
      colRef,
      (snapshot) => {
        const records: QuizRecord[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          records.push({
            id: d.id,
            lessonId: data.lessonId,
            score: data.score,
            total: data.total,
            date: data.date,
          });
        });
        onUpdate(records);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, colPath);
      }
    );
  },

  // Record a practice session (>= 3 messages)
  async recordPracticeSession(
    uid: string,
    session: { scenario: string; level: 'Beginner' | 'Intermediate'; messageCount: number }
  ) {
    const colPath = `users/${uid}/practiceSessions`;
    const newDocRef = doc(collection(db, 'users', uid, 'practiceSessions'));

    const todayDateStr = new Date().toISOString().split('T')[0];

    try {
      await setDoc(newDocRef, {
        scenario: session.scenario,
        level: session.level,
        messageCount: session.messageCount,
        date: new Date().toISOString(),
      });

      // Update user lastActiveDate
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        lastActiveDate: todayDateStr,
      });
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
