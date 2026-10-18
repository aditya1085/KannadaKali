import React from 'react';
import { Heart, Sparkles, HelpCircle } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string) => void;
  activeTab: string;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-[#FFF0B3]/50 border-t border-[#FFE082] mt-12 pb-20 md:pb-8 pt-8">
      <div className="max-w-[1200px] mx-auto px-4 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand & Tagline */}
          <div className="flex items-center gap-2 text-center md:text-left">
            <span className="text-2xl" role="img" aria-label="lamp">🪔</span>
            <div>
              <span className="font-extrabold text-lg text-[#B71C1C]">
                KannadaKali <span className="font-kannada font-bold text-sm">ಕನ್ನಡ ಕಲಿ</span>
              </span>
              <p className="text-xs text-[#6B5B4B]">
                Code. Create. Celebrate Kannada.
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 text-xs font-bold text-[#6B5B4B]">
            <button
              onClick={() => onNavigate('home')}
              className="px-3 py-1.5 rounded-lg hover:text-[#B71C1C] hover:bg-[#FFE082] transition-colors"
            >
              Home
            </button>
            <span>&middot;</span>
            <button
              onClick={() => onNavigate('lessons')}
              className="px-3 py-1.5 rounded-lg hover:text-[#B71C1C] hover:bg-[#FFE082] transition-colors"
            >
              Lessons
            </button>
            <span>&middot;</span>
            <button
              onClick={() => onNavigate('practice')}
              className="px-3 py-1.5 rounded-lg hover:text-[#B71C1C] hover:bg-[#FFE082] transition-colors"
            >
              Practice Chat
            </button>
            <span>&middot;</span>
            <button
              onClick={() => onNavigate('quiz')}
              className="px-3 py-1.5 rounded-lg hover:text-[#B71C1C] hover:bg-[#FFE082] transition-colors"
            >
              Quizzes
            </button>
            <span>&middot;</span>
            <button
              onClick={() => onNavigate('profile')}
              className="px-3 py-1.5 rounded-lg hover:text-[#B71C1C] hover:bg-[#FFE082] transition-colors"
            >
              Profile
            </button>
            <span>&middot;</span>
            <button
              onClick={() => onNavigate('about')}
              className="px-3 py-1.5 rounded-lg text-[#B71C1C] bg-[#FFE082]/70 hover:bg-[#FFE082] transition-colors font-extrabold flex items-center gap-1"
            >
              <Sparkles size={12} />
              <span>About &amp; Architecture</span>
            </button>
          </nav>
        </div>

        {/* Hackathon attribution */}
        <div className="pt-4 border-t border-[#FFE082]/60 flex flex-col sm:flex-row items-center justify-between text-xs text-[#6B5B4B] gap-2 text-center sm:text-left">
          <p>
            Built by <strong>Aditya Tripathi</strong> for the <strong>Kannada Digital Innovation Hackathon 2026</strong>.
          </p>
          <p className="font-kannada font-semibold text-[#B71C1C]">
            ಕನ್ನಡ ಕಲಿಯಿರಿ, ಪ್ರೀತಿಯಿಂದ ಮಾತನಾಡಿ 🙏
          </p>
        </div>
      </div>
    </footer>
  );
};
