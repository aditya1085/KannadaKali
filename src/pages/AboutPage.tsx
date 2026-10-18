import React from 'react';
import { ArrowLeft, Sparkles, BookOpen, MessageSquare, Award, Flame, Heart, Volume2, ShieldCheck, Cpu, Database, Server, Smartphone, ExternalLink } from 'lucide-react';

interface AboutPageProps {
  onBackToHome: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onBackToHome, onNavigateToTab }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-in fade-in duration-300">
      {/* Top navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-1.5 text-xs font-bold text-[#B71C1C] hover:bg-[#FFF0B3] px-3 py-1.5 rounded-xl transition-all border border-[#FFE082]"
          aria-label="Back to home page"
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </button>

        <span className="text-xs font-bold text-[#6B5B4B] bg-[#FFF0B3] px-3 py-1 rounded-full border border-[#FFE082]">
          Kannada Digital Innovation Hackathon 2026
        </span>
      </div>

      {/* Hero Banner */}
      <div className="bg-white rounded-3xl p-6 md:p-10 kannada-card-shadow border-2 border-[#FFF0B3] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#FFE082]/30 rounded-bl-full pointer-events-none" />
        
        <div className="flex items-start gap-4">
          <div className="text-5xl md:text-6xl p-3 bg-[#FFF8E1] rounded-2xl border border-[#FFE082] shadow-xs shrink-0">
            🪔
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-[#FFF0B3] text-[#B71C1C] px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border border-[#FFE082]">
              <Sparkles size={14} />
              <span>Hackathon Project Showcase</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-[#2B2B2B] tracking-tight">
              KannadaKali <span className="font-kannada text-[#B71C1C] font-bold">ಕನ್ನಡ ಕಲಿ</span>
            </h1>

            <p className="text-base md:text-lg font-bold text-[#B71C1C]">
              &ldquo;Code. Create. Celebrate Kannada.&rdquo;
            </p>
          </div>
        </div>

        {/* 2-3 line summary */}
        <div className="mt-6 pt-5 border-t border-[#FFF0B3] space-y-3">
          <p className="text-sm md:text-base text-[#2B2B2B] leading-relaxed">
            <strong>KannadaKali</strong> is an interactive practical language learning platform designed specifically for non-Kannada speakers living, working, and studying in Karnataka. Rather than abstract grammar drills, it focuses on real everyday street, workplace, and market conversations that enable learners to start speaking with confidence from day one.
          </p>
          <p className="text-xs md:text-sm text-[#6B5B4B] leading-relaxed">
            By blending native Kannada Web Speech audio, progressive scenario mastery quizzes, deterministic streak tracking, and server-side Gemini AI practice simulations with real-time feedback, KannadaKali makes learning Kannada welcoming, respectful, and joyful.
          </p>
        </div>
      </div>

      {/* Who is it for? */}
      <div className="bg-white rounded-2xl p-6 md:p-8 kannada-card-shadow border border-[#FFF0B3] space-y-4">
        <h2 className="text-xl font-bold text-[#2B2B2B] flex items-center gap-2">
          <span>👥</span> Who is KannadaKali For?
        </h2>
        <p className="text-xs md:text-sm text-[#6B5B4B]">
          Tailored for anyone building their life in Karnataka who wants to connect warmly with the local culture and community:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-[#FFF8E1] border border-[#FFE082] space-y-1.5">
            <span className="text-2xl" role="img" aria-label="city">🏙️</span>
            <h3 className="font-bold text-sm text-[#2B2B2B]">Bengaluru Newcomers</h3>
            <p className="text-xs text-[#6B5B4B] leading-relaxed">
              Tech professionals and migrants settling into Bengaluru looking to navigate daily life with ease.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#FFF8E1] border border-[#FFE082] space-y-1.5">
            <span className="text-2xl" role="img" aria-label="student">🎓</span>
            <h3 className="font-bold text-sm text-[#2B2B2B]">Students & Scholars</h3>
            <p className="text-xs text-[#6B5B4B] leading-relaxed">
              University students from other states making friends on campus and exploring the state.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#FFF8E1] border border-[#FFE082] space-y-1.5">
            <span className="text-2xl" role="img" aria-label="traveller">🧳</span>
            <h3 className="font-bold text-sm text-[#2B2B2B]">Travellers & Visitors</h3>
            <p className="text-xs text-[#6B5B4B] leading-relaxed">
              Tourists exploring Karnataka&apos;s UNESCO heritage, coffee estates, and coastal districts.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#FFF8E1] border border-[#FFE082] space-y-1.5">
            <span className="text-2xl" role="img" aria-label="market">🛍️</span>
            <h3 className="font-bold text-sm text-[#2B2B2B]">Everyday Shoppers</h3>
            <p className="text-xs text-[#6B5B4B] leading-relaxed">
              Anyone wanting to converse politely with auto drivers, local shopkeepers, and apartment staff.
            </p>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="bg-white rounded-2xl p-6 md:p-8 kannada-card-shadow border border-[#FFF0B3] space-y-4">
        <h2 className="text-xl font-bold text-[#2B2B2B] flex items-center gap-2">
          <span>⚡</span> Key Platform Features
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="flex items-start gap-3 p-4 rounded-xl border border-[#FFE082] bg-[#FFF8E1]/40">
            <div className="p-2.5 rounded-lg bg-[#FFC107] text-[#2B2B2B] shrink-0">
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#2B2B2B]">5 Practical Scenario Lessons</h3>
              <p className="text-xs text-[#6B5B4B] mt-1 leading-relaxed">
                Market, Bus / Auto, Darshini Restaurant, Hospital, and Office. Each scenario features 8 real spoken Kannada phrases with English, Hinglish, and cultural usage tips.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl border border-[#FFE082] bg-[#FFF8E1]/40">
            <div className="p-2.5 rounded-lg bg-[#B71C1C] text-white shrink-0">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#2B2B2B]">AI Practice Chat (Gemini 3.8 Flash)</h3>
              <p className="text-xs text-[#6B5B4B] mt-1 leading-relaxed">
                Simulated roleplays with a friendly vegetable vendor, auto driver, or colleague. Provides instant Kannada corrections, Roman transliteration, and helpful hints.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl border border-[#FFE082] bg-[#FFF8E1]/40">
            <div className="p-2.5 rounded-lg bg-[#FFC107] text-[#2B2B2B] shrink-0">
              <Award size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#2B2B2B]">Quizzes & Progressive Unlocking</h3>
              <p className="text-xs text-[#6B5B4B] mt-1 leading-relaxed">
                5 locally generated multiple-choice questions mixing Kannada-to-English, English-to-Kannada, and Roman-to-meaning. Scoring 60% or more marks a lesson done and unlocks the next level.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl border border-[#FFE082] bg-[#FFF8E1]/40">
            <div className="p-2.5 rounded-lg bg-[#B71C1C] text-white shrink-0">
              <Flame size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#2B2B2B]">Real Streaks & Weekly Progress</h3>
              <p className="text-xs text-[#6B5B4B] mt-1 leading-relaxed">
                100% real user metrics calculated from Firestore activity. Daily streak increments on consecutive days and resets on missed days. Interactive Mon-to-Sun bar chart with count tooltips.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl border border-[#FFE082] bg-[#FFF8E1]/40">
            <div className="p-2.5 rounded-lg bg-[#FFC107] text-[#2B2B2B] shrink-0">
              <Heart size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#2B2B2B]">Vocabulary Bookmarks</h3>
              <p className="text-xs text-[#6B5B4B] mt-1 leading-relaxed">
                Save useful words with a single tap to your personal revision list on the Profile page, complete with listen and delete buttons.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl border border-[#FFE082] bg-[#FFF8E1]/40">
            <div className="p-2.5 rounded-lg bg-[#B71C1C] text-white shrink-0">
              <Volume2 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#2B2B2B]">Native Audio Pronunciation</h3>
              <p className="text-xs text-[#6B5B4B] mt-1 leading-relaxed">
                Built-in Web Speech API integration (<code className="bg-[#FFF0B3] px-1 rounded text-[#2B2B2B]">kn-IN</code>) across all phrases and quiz options for accurate spoken Kannada ear-training.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Architecture Diagram: How it works */}
      <div className="bg-white rounded-2xl p-6 md:p-8 kannada-card-shadow border border-[#FFF0B3] space-y-6">
        <div>
          <h2 className="text-xl font-bold text-[#2B2B2B] flex items-center gap-2">
            <span>🏗️</span> System Architecture: How It Works
          </h2>
          <p className="text-xs md:text-sm text-[#6B5B4B] mt-1">
            Production fullstack design strictly decoupling frontend client interactions, server-side AI authentication, and real-time database persistence:
          </p>
        </div>

        {/* Visual Architecture Flow */}
        <div className="p-5 rounded-2xl bg-[#FFF8E1] border-2 border-[#FFE082] space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
            {/* Step 1: React Client */}
            <div className="bg-white p-4 rounded-xl border border-[#FFE082] shadow-xs flex flex-col items-center justify-between">
              <div className="p-2.5 rounded-full bg-[#FFC107]/20 text-[#B71C1C] mb-2">
                <Smartphone size={24} />
              </div>
              <h3 className="font-bold text-sm text-[#2B2B2B]">React SPA Frontend</h3>
              <p className="text-[11px] text-[#6B5B4B] mt-1 leading-snug">
                Vite + TypeScript, Tailwind CSS, Responsive 390px-1280px, Web Speech API (kn-IN)
              </p>
              <span className="mt-2 text-[10px] font-bold text-[#B71C1C] bg-[#FFF0B3] px-2 py-0.5 rounded-full">
                UI &amp; Local State
              </span>
            </div>

            {/* Arrow & Step 2: Express Server */}
            <div className="bg-white p-4 rounded-xl border border-[#FFE082] shadow-xs flex flex-col items-center justify-between">
              <div className="p-2.5 rounded-full bg-[#B71C1C]/15 text-[#B71C1C] mb-2">
                <Server size={24} />
              </div>
              <h3 className="font-bold text-sm text-[#2B2B2B]">Node.js + Express</h3>
              <p className="text-[11px] text-[#6B5B4B] mt-1 leading-snug">
                REST APIs: <code>/api/lessons</code>, <code>/api/chat</code>, <code>/api/quiz/submit</code>, <code>/api/progress</code>
              </p>
              <span className="mt-2 text-[10px] font-bold text-[#B71C1C] bg-[#FFF0B3] px-2 py-0.5 rounded-full">
                Auth &amp; Rate Limiting
              </span>
            </div>

            {/* Step 3: Firebase Auth & Firestore */}
            <div className="bg-white p-4 rounded-xl border border-[#FFE082] shadow-xs flex flex-col items-center justify-between">
              <div className="p-2.5 rounded-full bg-[#FFC107]/20 text-amber-700 mb-2">
                <Database size={24} />
              </div>
              <h3 className="font-bold text-sm text-[#2B2B2B]">Firebase Firestore</h3>
              <p className="text-[11px] text-[#6B5B4B] mt-1 leading-snug">
                User profiles, lesson unlocks, saved vocabulary, quiz history, and ABAC security rules
              </p>
              <span className="mt-2 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                Realtime Data Sync
              </span>
            </div>

            {/* Step 4: Gemini AI */}
            <div className="bg-white p-4 rounded-xl border border-[#FFE082] shadow-xs flex flex-col items-center justify-between">
              <div className="p-2.5 rounded-full bg-purple-100 text-purple-700 mb-2">
                <Cpu size={24} />
              </div>
              <h3 className="font-bold text-sm text-[#2B2B2B]">Gemini 3.8 Flash</h3>
              <p className="text-[11px] text-[#6B5B4B] mt-1 leading-snug">
                @google/genai SDK server-side calls with zero client key exposure; conversational corrections
              </p>
              <span className="mt-2 text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full">
                Secure AI Core
              </span>
            </div>
          </div>

          {/* Flow Pipeline Summary */}
          <div className="text-xs text-[#2B2B2B] bg-white p-3 rounded-xl border border-[#FFE082] font-mono text-center flex flex-wrap items-center justify-center gap-2">
            <span>React Client</span>
            <span className="text-[#B71C1C] font-bold">&rarr;</span>
            <span>Express API (Bearer Token)</span>
            <span className="text-[#B71C1C] font-bold">&rarr;</span>
            <span>Firestore DB (ABAC Rules)</span>
            <span className="text-[#B71C1C] font-bold">&amp;</span>
            <span>Gemini API (Server Secret)</span>
            <span className="text-[#B71C1C] font-bold">&rarr;</span>
            <span>Structured Response</span>
          </div>
        </div>
      </div>

      {/* Hackathon Submission Footer */}
      <div className="bg-gradient-to-r from-[#FFF0B3] via-[#FFE082] to-[#FFF0B3] rounded-2xl p-6 border-2 border-[#FFC107] text-center space-y-2">
        <div className="text-2xl">🏆</div>
        <h3 className="text-lg font-bold text-[#2B2B2B]">
          Kannada Digital Innovation Hackathon 2026
        </h3>
        <p className="text-xs md:text-sm text-[#2B2B2B] max-w-lg mx-auto">
          Built with passion by <strong>Aditya Tripathi</strong> (<a href="mailto:adityatripathi102930@gmail.com" className="text-[#B71C1C] font-bold underline">adityatripathi102930@gmail.com</a>) to advance regional language accessibility, foster warm community integration, and celebrate Karnataka&apos;s linguistic heritage.
        </p>
      </div>
    </div>
  );
};
