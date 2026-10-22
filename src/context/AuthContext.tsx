import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, signInWithPopup, signOut, handleFirestoreError, OperationType, validateFirestoreConnection } from '../lib/firebase';

export interface UserDocData {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  createdAt: string;
  streak: number;
  lastActiveDate: string;
}

export interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  getIdToken: () => Promise<string>;
}

interface AuthContextType {
  user: (FirebaseUser | AppUser) | null;
  userData: UserDocData | null;
  loading: boolean;
  isGuest: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => void;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LESSON_IDS = ['market', 'bus-auto', 'restaurant', 'hospital', 'office'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<(FirebaseUser | AppUser) | null>(null);
  const [userData, setUserData] = useState<UserDocData | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Helper to get local date key YYYY-MM-DD
  const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getYesterdayDateStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const syncUserDoc = async (fbUser: FirebaseUser) => {
    const userDocRef = doc(db, 'users', fbUser.uid);
    const today = getTodayDateStr();
    const yesterday = getYesterdayDateStr();

    try {
      const snap = await getDoc(userDocRef);

      if (!snap.exists()) {
        // First login: create user doc and initialize scenario progress
        const initialUser: UserDocData = {
          uid: fbUser.uid,
          name: fbUser.displayName || 'Kannada Learner',
          email: fbUser.email || '',
          photoURL: fbUser.photoURL || '',
          createdAt: new Date().toISOString(),
          streak: 1,
          lastActiveDate: today,
        };

        await setDoc(userDocRef, initialUser);

        // Initialize progress for each lesson: Market unlocked, others locked
        for (const lessonId of LESSON_IDS) {
          const isMarket = lessonId === 'market';
          const progressDocRef = doc(db, 'users', fbUser.uid, 'progress', lessonId);
          await setDoc(progressDocRef, {
            completedPhrases: [],
            status: isMarket ? 'in_progress' : 'locked',
            updatedAt: new Date().toISOString(),
          });
        }

        setUserData(initialUser);
      } else {
        const existingData = snap.data() as UserDocData;
        const updated: Partial<UserDocData> = {
          name: fbUser.displayName || existingData.name,
          email: fbUser.email || existingData.email,
          photoURL: fbUser.photoURL || existingData.photoURL,
        };

        await updateDoc(userDocRef, updated);

        setUserData({
          ...existingData,
          ...updated,
          uid: fbUser.uid,
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${fbUser.uid}`);
    }
  };

  const refreshUserData = async () => {
    if (!user) return;
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        setUserData({ ...(snap.data() as UserDocData), uid: user.uid });
      }
    } catch (err) {
      console.warn('Failed to refresh user data:', err);
    }
  };

  const signInAsGuest = () => {
    try {
      localStorage.setItem('kannadakali_is_guest', 'true');
    } catch {}
    const guestUser: AppUser = {
      uid: 'guest-learner',
      displayName: 'Kannada Learner',
      email: 'guest@kannadakali.local',
      photoURL: '',
      getIdToken: async () => 'guest-token-session',
    };
    const guestUserData: UserDocData = {
      uid: 'guest-learner',
      name: 'Kannada Learner',
      email: 'guest@kannadakali.local',
      photoURL: '',
      createdAt: new Date().toISOString(),
      streak: 1,
      lastActiveDate: getTodayDateStr(),
    };
    setIsGuest(true);
    setUser(guestUser);
    setUserData(guestUserData);
    setLoading(false);
  };

  useEffect(() => {
    validateFirestoreConnection();

    // Check if user was previously in guest mode
    const isGuestSaved = typeof window !== 'undefined' && localStorage.getItem('kannadakali_is_guest') === 'true';

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          try {
            localStorage.removeItem('kannadakali_is_guest');
          } catch {}
          setIsGuest(false);
          setUser(fbUser);
          await syncUserDoc(fbUser);
        } else if (isGuestSaved) {
          signInAsGuest();
        } else {
          setUser(null);
          setUserData(null);
          setIsGuest(false);
        }
      } catch (err) {
        console.warn('Notice during user session init:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.warn('Google Sign-In notice:', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      try {
        localStorage.removeItem('kannadakali_is_guest');
      } catch {}
      setIsGuest(false);
      if (auth.currentUser) {
        await signOut(auth);
      }
      setUser(null);
      setUserData(null);
    } catch (error) {
      console.error('Sign-Out Error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        isGuest,
        signInWithGoogle,
        signInAsGuest,
        logout,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
