import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Login error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. Please try again.');
      } else if (err?.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(err?.message || 'Failed to sign in with Google. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8E1] flex flex-col items-center justify-center p-4">
      {/* Background traditional motifs / watermark */}
      <div className="fixed -top-16 -left-16 text-[180px] font-kannada text-[#FFC107]/20 select-none pointer-events-none">
        ಕ
      </div>
      <div className="fixed -bottom-16 -right-16 text-[180px] font-kannada text-[#B71C1C]/10 select-none pointer-events-none">
        ಲಿ
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#FFC107] text-3xl shadow-sm border border-[#FFE082] mb-1">
            🪔
          </div>
          <h1 className="text-3xl font-extrabold text-[#B71C1C] tracking-tight">
            KannadaKali
          </h1>
          <p className="text-lg font-bold font-kannada text-[#2B2B2B]">
            ಕನ್ನಡ ಕಲಿಯಿರಿ · Practical Spoken Kannada
          </p>
          <p className="text-xs text-[#6B5B4B] max-w-xs mx-auto">
            Master Bangalore market, travel, auto, and workplace conversations with authentic everyday Kannada.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl p-7 md:p-8 kannada-card-shadow border border-[#FFF0B3] space-y-6">
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-[#2B2B2B] text-center">
              Welcome to Your Learning Journey
            </h2>

            {/* Value props */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2.5 text-xs text-[#6B5B4B]">
                <CheckCircle2 size={16} className="text-[#FFC107] shrink-0" />
                <span>5 Real-world Bengaluru scenarios &amp; 40 practical phrases</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#6B5B4B]">
                <CheckCircle2 size={16} className="text-[#FFC107] shrink-0" />
                <span>Audio pronunciation with Web Speech API</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#6B5B4B]">
                <CheckCircle2 size={16} className="text-[#FFC107] shrink-0" />
                <span>Track daily streaks &amp; personalize saved vocabulary</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {error}
            </div>
          )}

          {/* Google Sign-in Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full min-h-[48px] px-5 py-3 rounded-[10px] bg-white border-2 border-[#FFE082] hover:border-[#FFC107] hover:bg-[#FFF8E1] text-[#2B2B2B] font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-xs active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed group"
          >
            {/* Google Logo SVG */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? 'Signing in...' : 'Sign in with Google'}</span>
          </button>

          {/* Privacy Note */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#6B5B4B]">
            <ShieldCheck size={14} className="text-[#B71C1C]" />
            <span>Secure authentication via Firebase</span>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-[#6B5B4B]">
          ಕನ್ನಡ ಕಲಿಯಿರಿ, ಸುಲಭವಾಗಿ ಮಾತನಾಡಿ · Learn Kannada, speak effortlessly
        </p>
      </div>
    </div>
  );
};
