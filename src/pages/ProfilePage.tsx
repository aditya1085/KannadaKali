import React, { useState } from 'react';
import { Flame, BookOpen, Star, Trophy, Volume2, Check, Settings, HelpCircle, LogOut } from 'lucide-react';
import { UserProfile, UserStats } from '../types';
import { speakKannada } from '../utils/speech';

interface ProfilePageProps {
  user: UserProfile;
  stats: UserStats;
  photoURL?: string;
  onLogout?: () => void;
  onVoiceMissing?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  stats,
  photoURL,
  onLogout,
  onVoiceMissing
}) => {
  const [dailyGoal, setDailyGoal] = useState(user.dailyGoalMinutes || 15);
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const [imgError, setImgError] = useState(false);

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

  const handleSaveGoal = () => {
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Profile Header Card */}
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

      {/* Real Stats Summary */}
      <div className="bg-white rounded-2xl p-6 kannada-card-shadow border border-[#FFF0B3] space-y-4">
        <h2 className="text-lg font-bold text-[#2B2B2B] flex items-center gap-2">
          <span>📊</span> Real Learning Statistics
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
          <div className="bg-[#FFF8E1] p-4 rounded-xl border border-[#FFE082] text-center">
            <Flame size={22} className="mx-auto text-amber-600 mb-1" />
            <div className="text-2xl font-bold text-[#B71C1C]">{stats.streakDays}</div>
            <div className="text-xs text-[#6B5B4B] font-medium">Days Streak</div>
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
            <div className="text-2xl font-bold text-[#B71C1C]">{stats.avgQuizScore}%</div>
            <div className="text-xs text-[#6B5B4B] font-medium">Avg Quiz Score</div>
          </div>
        </div>
      </div>

      {/* Preferences & Daily Goal */}
      <div className="bg-white rounded-2xl p-6 kannada-card-shadow border border-[#FFF0B3] space-y-4">
        <h2 className="text-lg font-bold text-[#2B2B2B] flex items-center gap-2">
          <Settings size={18} className="text-[#B71C1C]" />
          <span>Daily Learning Goal</span>
        </h2>

        <p className="text-xs text-[#6B5B4B]">
          Choose how much time you want to dedicate each day to practical Kannada conversations.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          {[10, 15, 20, 30].map((mins) => (
            <button
              key={mins}
              onClick={() => setDailyGoal(mins)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                dailyGoal === mins
                  ? 'bg-[#B71C1C] text-white shadow-xs'
                  : 'bg-[#FFF8E1] text-[#2B2B2B] border border-[#FFE082] hover:bg-[#FFE082]'
              }`}
            >
              {mins} minutes / day
            </button>
          ))}
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button
            onClick={handleSaveGoal}
            className="min-h-[44px] px-6 rounded-[10px] font-bold text-xs bg-[#B71C1C] text-white hover:bg-[#8F1414] active:scale-95 transition-all shadow-xs flex items-center gap-2"
          >
            {showSavedFeedback ? (
              <>
                <Check size={16} />
                <span>Goal Updated!</span>
              </>
            ) : (
              <span>Save Preference</span>
            )}
          </button>
        </div>
      </div>

      {/* Voice & Audio Guide */}
      <div className="bg-[#FFF8E1] rounded-2xl p-5 border border-[#FFE082] space-y-2 text-xs text-[#6B5B4B]">
        <div className="flex items-center gap-2 font-bold text-[#B71C1C] text-sm">
          <HelpCircle size={16} />
          <span>About Kannada Speech Synthesis (kn-IN)</span>
        </div>
        <p className="leading-relaxed">
          KannadaKali uses your browser's built-in Web Speech API (<code className="bg-[#FFF0B3] px-1 rounded text-[#2B2B2B]">lang: "kn-IN"</code>).
          For the most natural, human-sounding Kannada pronunciation, you can add Kannada voice support in your operating system:
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
