import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, CheckCircle2, Copy, Check, ExternalLink, AlertTriangle, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { signInWithGoogle, signInAsGuest } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'unauthorized-domain' | 'popup-blocked' | 'other' | null>(null);
  const [copied, setCopied] = useState(false);

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';
  const firebaseConsoleUrl = 'https://console.firebase.google.com/project/wired-space-nmn89/authentication/settings';

  const handleCopyDomain = async () => {
    if (!currentDomain) return;
    try {
      await navigator.clipboard.writeText(currentDomain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      setErrorType(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.warn('Login notice:', err);
      const code = err?.code || '';
      const message = err?.message || '';

      if (code === 'auth/unauthorized-domain' || message.includes('unauthorized-domain')) {
        setErrorType('unauthorized-domain');
        setError('This preview domain is not yet added in Firebase Authorized Domains.');
      } else if (code === 'auth/popup-blocked' || message.includes('popup')) {
        setErrorType('popup-blocked');
        setError('Browser popup was blocked by your browser settings or iframe.');
      } else if (code === 'auth/popup-closed-by-user') {
        setErrorType('other');
        setError('Sign-in window was closed before finishing. You can retry or explore as Guest.');
      } else {
        setErrorType('other');
        setError(message || 'Failed to sign in with Google. You can explore as Guest below.');
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
        <div className="bg-white rounded-2xl p-6 md:p-8 kannada-card-shadow border border-[#FFF0B3] space-y-5">
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
                <span>AI Chat tutor &amp; interactive scenario quizzes</span>
              </div>
            </div>
          </div>

          {/* Diagnostic Error Box with Actionable Steps */}
          {error && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-[#2B2B2B] text-xs space-y-2.5">
              <div className="flex items-start gap-2 text-amber-900 font-semibold">
                <AlertTriangle size={16} className="shrink-0 text-amber-600 mt-0.5" />
                <span>{error}</span>
              </div>

              {errorType === 'unauthorized-domain' && (
                <div className="space-y-2 pt-1 border-t border-amber-200/60 text-[11px] text-[#554]">
                  <p>
                    Google OAuth domain authorization required. To enable Google Sign-In:
                  </p>
                  
                  {/* Copy Domain box */}
                  <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-amber-200">
                    <code className="text-xs font-mono text-[#B71C1C] flex-1 truncate select-all">
                      {currentDomain}
                    </code>
                    <button
                      onClick={handleCopyDomain}
                      className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-medium rounded flex items-center gap-1 transition-colors text-[10px]"
                      title="Copy domain to clipboard"
                    >
                      {copied ? <Check size={12} className="text-emerald-700" /> : <Copy size={12} />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>

                  <ol className="list-decimal list-inside space-y-1 text-[#665] text-[11px] pl-0.5">
                    <li>Open <strong>Firebase Console &gt; Authentication &gt; Settings</strong></li>
                    <li>Click <strong>Authorized domains &gt; Add domain</strong></li>
                    <li>Paste <code className="text-[10px] bg-amber-100 px-1 py-0.5 rounded">{currentDomain}</code> and save.</li>
                  </ol>

                  <a
                    href={firebaseConsoleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#B71C1C] font-bold hover:underline pt-0.5"
                  >
                    <span>Open Firebase Auth Settings</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}

              {errorType === 'popup-blocked' && (
                <p className="text-[11px] text-[#665] border-t border-amber-200/60 pt-1.5">
                  Check your browser URL address bar to allow popups from this domain, or click <strong>Explore as Guest</strong> below to continue right now.
                </p>
              )}
            </div>
          )}

          {/* Primary Action: Google Sign-In */}
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
            <span>{loading ? 'Connecting to Google...' : 'Sign in with Google'}</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-[#FFE082] w-full"></div>
            <span className="bg-white px-3 text-[11px] font-semibold text-[#8C7A6B] uppercase tracking-wider relative shrink-0">
              or explore now
            </span>
            <div className="border-t border-[#FFE082] w-full"></div>
          </div>

          {/* Instant Guest Mode Button */}
          <button
            onClick={() => signInAsGuest()}
            className="w-full min-h-[46px] px-5 py-2.5 rounded-[10px] bg-[#B71C1C] hover:bg-[#8f1616] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
          >
            <UserCheck size={18} />
            <span>Continue as Guest (No Login Required)</span>
          </button>

          <p className="text-center text-[11px] text-[#8C7A6B]">
            Instant access to all 5 scenarios, pronunciation audio, AI chat, &amp; quizzes.
          </p>

          {/* Privacy Note */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#6B5B4B] pt-1 border-t border-slate-100">
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
