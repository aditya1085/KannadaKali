import React, { useState } from 'react';
import { Home, BookOpen, MessageSquare, Award, User, LogOut, Info } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  userName?: string;
  photoURL?: string;
  avatarInitial?: string;
  isGuest?: boolean;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onNavigate,
  userName = 'Learner',
  photoURL,
  avatarInitial = 'K',
  isGuest = false,
  onLogout
}) => {
  const [imgError, setImgError] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'lessons', label: 'Lessons', icon: BookOpen },
    { id: 'practice', label: 'Practice', icon: MessageSquare },
    { id: 'quiz', label: 'Quiz', icon: Award },
    { id: 'about', label: 'About', icon: Info },
  ];

  const mobileNavItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'lessons', label: 'Lessons', icon: BookOpen },
    { id: 'practice', label: 'Chat', icon: MessageSquare },
    { id: 'quiz', label: 'Quiz', icon: Award },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <>
      {/* Full-width yellow bar */}
      <header className="sticky top-0 z-40 w-full bg-[#FFC107] border-b border-[#FFE082] shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Left: Brand */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 group text-left transition-transform active:scale-95 focus:outline-none"
          >
            <span className="text-2xl">🪔</span>
            <div>
              <span className="font-extrabold text-xl md:text-2xl text-[#B71C1C] tracking-tight">
                KannadaKali
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium text-[#6B5B4B] bg-[#FFF0B3] px-2 py-0.5 rounded-full">
                ಕನ್ನಡ ಕಲಿ
              </span>
            </div>
          </button>

          {/* Center: Desktop links (Home, Lessons, Practice, Quiz) */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#B71C1C] text-white shadow-sm'
                      : 'text-[#2B2B2B] hover:bg-[#FFE082] hover:text-[#B71C1C]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right: Round avatar / Google Photo + User name + Logout button */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mobile About button */}
            <button
              onClick={() => onNavigate('about')}
              className={`md:hidden p-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'about'
                  ? 'bg-[#B71C1C] text-white shadow-xs'
                  : 'text-[#B71C1C] hover:bg-[#FFE082]'
              }`}
              title="About KannadaKali"
              aria-label="About KannadaKali"
            >
              <Info size={18} />
            </button>

            <button
              onClick={() => onNavigate('profile')}
              className={`flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full transition-all duration-150 ${
                activeTab === 'profile'
                  ? 'bg-[#B71C1C]/15 ring-2 ring-[#B71C1C]'
                  : 'hover:bg-[#FFE082]'
              }`}
              title="View Profile"
              aria-label="View Profile"
            >
              {photoURL && !imgError ? (
                <img
                  src={photoURL}
                  alt={userName}
                  onError={() => setImgError(true)}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-white/60 shadow-xs"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#B71C1C] text-white font-bold flex items-center justify-center text-sm shadow-sm ring-2 ring-white/50">
                  {avatarInitial}
                </div>
              )}
              <span className="text-sm font-semibold text-[#2B2B2B] hidden sm:inline max-w-[120px] truncate">
                {userName}
              </span>
              {isGuest && (
                <span className="hidden md:inline-block text-[10px] font-bold bg-[#B71C1C] text-white px-2 py-0.5 rounded-full">
                  Guest
                </span>
              )}
            </button>

            {/* Logout button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-[#B71C1C] hover:bg-[#FFE082] active:scale-95 transition-all flex items-center gap-1 text-xs font-semibold"
                title="Log out of KannadaKali"
              >
                <LogOut size={16} />
                <span className="hidden lg:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFF8E1] border-t border-[#FFE082] px-2 py-1.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                  isActive
                    ? 'text-[#B71C1C] font-bold'
                    : 'text-[#6B5B4B] hover:text-[#2B2B2B]'
                }`}
              >
                <div
                  className={`p-1 rounded-lg ${
                    isActive ? 'bg-[#FFC107] text-[#B71C1C]' : ''
                  }`}
                >
                  <Icon size={20} />
                </div>
                <span className="text-[11px] mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
