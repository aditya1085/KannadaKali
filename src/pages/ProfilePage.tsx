import React, { useState } from 'react';
import { Flame, BookOpen, Star, Trophy, Volume2, LogOut, Trash2, Award, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { UserProfile, UserStats, SavedWord } from '../types';
import { QuizRecord } from '../services/firestoreService';
import { speakKannada } from '../utils/speech';

interface ProfilePageProps {
  user: UserProfile;
  stats: UserStats;
  photoURL?: string;
  savedWords?: SavedWord[];
  quizHistory?: QuizRecord[];
  onDeleteSavedWord?: (wordId: string) => void;
  onLogout?: () => void;
  onVoiceMissing?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  stats,
  photoURL,
  savedWords = [],
  quizHistory = [],
  onDeleteSavedWord,
  onLogout,
  onVoiceMissing,
}) => {
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [playingWordId, setPlayingWordId] = useState<string | null>(null);

  const handleTestAudio = () => {
    setIsTestingAudio(true);
    speakKannada(
      'ನಮಸ್ಕಾರ, ಕನ್ನಡ ಕಲಿ ಆಪ್‌ಗೆ ಸುಸ್ವಾಗತ!',
      () => setIsTestingAudio(true),
      () => setIsTestingAudio(false),
      () => {
        if (onVoiceMissing) onVoiceMissing();
      }
    );
  };

  const handleListenWord = (word: SavedWord) => {
    setPlayingWordId(word.id);
    speakKannada(
      word.kannada,
      () => setPlayingWordId(word.id),
      () => setPlayingWordId(null),
      () => {
        if (onVoiceMissing) onVoiceMissing();
      }
    );
  };

  const lessonEmojiMap: Record<string, string> = {
    market: '🛒',
    'bus-auto': '🚌',
    bus: '🚌',
    restaurant: '🍛',
    hospital: '🏥',
    office: '💼',
  };

  const lessonTitleMap: Record<string, string> = {
    market: 'Market',
    'bus-auto': 'Bus / Auto',
    bus: 'Bus / Auto',
    restaurant: 'Restaurant',
    hospital: 'Hospital',
    office: 'Office',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* 1. Profile Header Card */}
      <div className="bg-white rounded-2xl p-6 md:p-8 kannada-card-shadow border border-[#FFF0B3] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {photoURL && !imgError ? (
            <img
              src={photoURL}
              alt={user.name}
              onError={() => setImgError(true)}
              className="w-20 h-20 rounded-full object-cover shadow-md ring-4 ring-[#FFF0B3]"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#B71C1C] text-white text-3xl font-bold flex items-center justify-center shadow-md ring-4 ring-[#FFF0B3]">
              {user.avatarInitials}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#2B2B2B]">
                {user.name}
              </h1>
              <span className="text-[11px] font-bold text-[#B71C1C] bg-[#FFF0B3] px-2 py-0.5 rounded-full border border-[#FFE082]">
                Verified Learner
              </span>
            </div>
            <p className="text-xs text-[#6B5B4B] mt-0.5">{user.email}</p>
            <p className="text-xs text-[#6B5B4B] mt-1">
              Member since: <span className="font-semibold text-[#2B2B2B]">{user.joinedDate}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 self-start sm:self-center">
          <button
            onClick={handleTestAudio}
            disabled={isTestingAudio}
            className="min-h-[44px] px-4 py-2 rounded-[10px] bg-[#FFC107] text-[#2B2B2B] hover:bg-[#FFE082] text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <Volume2 size={16} />
            <span>{isTestingAudio ? 'Testing Speech...' : 'Test Kannada Voice'}</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="min-h-[44px] px-4 py-2 rounded-[10px] bg-white border border-[#FFE082] text-[#B71C1C] hover:bg-[#FFF8E1] text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Real Stats Summary */}
      <div className="bg-white rounded-2xl p-6 kannada-card-shadow border border-[#FFF0B3] space-y-4">
        <h2 className="text-lg font-bold text-[#2B2B2B] flex items-center gap-2">
          <span>📊</span> Real Learning Statistics
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
          <div className="bg-[#FFF8E1] p-4 rounded-xl border border-[#FFE082] text-center">
            <Flame size={22} className="mx-auto text-amber-600 mb-1" />
            <div className="text-2xl font-bold text-[#B71C1C]">{stats.streakDays}</div>
            <div className="text-xs text-[#6B5B4B] font-medium">
              {stats.streakDays === 1 ? 'Day Streak' : 'Days Streak'}
            </div>
          </div>

          <div className="bg-[#FFF8E1] p-4 rounded-xl border border-[#FFE082] text-center">
            <BookOpen size={22} className="mx-auto text-blue-600 mb-1" />
            <div className="text-2xl font-bold text-[#B71C1C]">
              {stats.completedLessons}/{stats.totalLessons}
            </div>
            <div className="text-xs text-[#6B5B4B] font-medium">Scenarios Done</div>
          </div>

          <div className="bg-[#FFF8E1] p-4 rounded-xl border border-[#FFE082] text-center">
            <Star size={22} className="mx-auto text-amber-500 mb-1" />
            <div className="text-2xl font-bold text-[#B71C1C]">{stats.savedWordsCount}</div>
            <div className="text-xs text-[#6B5B4B] font-medium">Words Saved</div>
          </div>

          <div className="bg-[#FFF8E1] p-4 rounded-xl border border-[#FFE082] text-center">
            <Trophy size={22} className="mx-auto text-purple-600 mb-1" />
            <div className="text-2xl font-bold text-[#B71C1C]">
              {stats.avgQuizScore !== null && stats.avgQuizScore !== undefined ? `${stats.avgQuizScore}%` : '-'}
            </div>
            <div className="text-xs text-[#6B5B4B] font-medium">Avg Quiz Score</div>
          </div>
        </div>
      </div>

      {/* 3. Saved Words List with Listen and Delete Buttons */}
      <div className="bg-white rounded-2xl p-6 kannada-card-shadow border border-[#FFF0B3] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#2B2B2B] flex items-center gap-2">
            <span>⭐</span> Saved Words ({savedWords.length})
          </h2>
          <span className="text-xs text-[#6B5B4B]">
            Bookmarks for daily vocabulary revision
          </span>
        </div>

        {savedWords.length === 0 ? (
          <div className="text-center py-10 px-4 bg-[#FFF8E1]/60 rounded-xl border border-[#FFE082]/60">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#FFF0B3] flex items-center justify-center text-xl mb-2">
              ⭐
            </div>
            <p className="text-sm font-semibold text-[#2B2B2B]">No saved words yet</p>
            <p className="text-xs text-[#6B5B4B] mt-1 max-w-sm mx-auto">
              Tap the heart icon on any phrase in scenario lessons to bookmark words here for quick listening and practice.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {savedWords.map((word) => {
              const isPlaying = playingWordId === word.id;
              return (
                <div
                  key={word.id}
                  className="p-4 rounded-xl border border-[#FFE082] bg-[#FFF8E1]/40 flex items-start justify-between gap-3 hover:bg-[#FFF8E1] transition-all"
                >
                  <div className="space-y-0.5">
                    <div className="font-kannada font-bold text-lg text-[#2B2B2B]">
                      {word.kannada}
                    </div>
                    <div className="text-xs font-semibold text-[#B71C1C]">
                      {word.roman}
                    </div>
                    <div className="text-xs text-[#2B2B2B]">
                      {word.english}
                    </div>
                    {word.hindi && (
                      <div className="text-[11px] text-[#6B5B4B]">
                        Hindi: {word.hindi}
                      </div>
                    )}
                  </div>

                  {/* Actions: Listen & Delete */}
                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    <button
                      onClick={() => handleListenWord(word)}
                      disabled={isPlaying}
                      className={`p-2 rounded-lg text-[#2B2B2B] bg-[#FFC107] hover:bg-[#FFE082] transition-all ${
                        isPlaying ? 'ring-2 ring-[#B71C1C] animate-pulse' : ''
                      }`}
                      title="Listen to pronunciation"
                    >
                      <Volume2 size={15} />
                    </button>

                    {onDeleteSavedWord && (
                      <button
                        onClick={() => onDeleteSavedWord(word.id)}
                        className="p-2 rounded-lg text-[#6B5B4B] hover:text-[#B71C1C] hover:bg-white transition-all"
                        title="Delete from saved words"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Quiz History with Lesson, Score, and Date */}
      <div className="bg-white rounded-2xl p-6 kannada-card-shadow border border-[#FFF0B3] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#2B2B2B] flex items-center gap-2">
            <Award size={20} className="text-[#FFC107]" />
            <span>Quiz History ({quizHistory.length})</span>
          </h2>
          <span className="text-xs text-[#6B5B4B]">
            Passing grade: 60% or higher
          </span>
        </div>

        {quizHistory.length === 0 ? (
          <div className="text-center py-10 px-4 bg-[#FFF8E1]/60 rounded-xl border border-[#FFE082]/60">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#FFF0B3] flex items-center justify-center text-xl mb-2">
              🏆
            </div>
            <p className="text-sm font-semibold text-[#2B2B2B]">No quizzes completed yet</p>
            <p className="text-xs text-[#6B5B4B] mt-1 max-w-sm mx-auto">
              Test your recall by taking a scenario quiz! Score 60% or higher to unlock the next level and advance your streak.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 pt-1">
            {quizHistory.map((q, idx) => {
              const norm = q.lessonId.toLowerCase();
              const emoji = lessonEmojiMap[norm] || '🏆';
              const title = lessonTitleMap[norm] || q.lessonId;
              const pct = q.percentage ?? Math.round((q.score / q.total) * 100);
              const passed = pct >= 60;
              const formattedDate = q.date
                ? new Date(q.date).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Recent';

              return (
                <div
                  key={q.id || `${q.lessonId}-${idx}`}
                  className="p-3.5 rounded-xl border border-[#FFF0B3] bg-[#FFF8E1]/30 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" role="img" aria-label={title}>
                      {emoji}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-[#2B2B2B]">
                        {title} Quiz
                      </div>
                      <div className="text-xs text-[#6B5B4B]">{formattedDate}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-bold text-[#2B2B2B]">
                        {q.score} / {q.total}
                      </div>
                      <div className={`text-xs font-extrabold ${passed ? 'text-emerald-700' : 'text-[#B71C1C]'}`}>
                        {pct}%
                      </div>
                    </div>

                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                        passed
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {passed ? (
                        <>
                          <CheckCircle2 size={13} />
                          <span>Passed</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={13} />
                          <span>Try Again</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Voice & Audio Guide */}
      <div className="bg-[#FFF8E1] rounded-2xl p-5 border border-[#FFE082] space-y-2 text-xs text-[#6B5B4B]">
        <div className="flex items-center gap-2 font-bold text-[#B71C1C] text-sm">
          <HelpCircle size={16} />
          <span>About Kannada Speech Synthesis (kn-IN)</span>
        </div>
        <p className="leading-relaxed">
          KannadaKali uses your browser's built-in Web Speech API (<code className="bg-[#FFF0B3] px-1 rounded text-[#2B2B2B]">lang: "kn-IN"</code>).
          For natural pronunciation, install the Kannada speech pack in your device settings:
        </p>
        <ul className="list-disc list-inside space-y-1 text-[#2B2B2B] pl-1 pt-1">
          <li><strong>Windows:</strong> Settings &gt; Time &amp; Language &gt; Speech &gt; Add voices &gt; Kannada.</li>
          <li><strong>Mac / iOS:</strong> Settings &gt; Accessibility &gt; Spoken Content &gt; Voices &gt; Kannada.</li>
          <li><strong>Android:</strong> Settings &gt; Accessibility &gt; Text-to-speech output &gt; Google Speech Engine &gt; Install Kannada.</li>
        </ul>
      </div>
    </div>
  );
};
