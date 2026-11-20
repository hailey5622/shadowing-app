import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, Sparkles, AlertCircle, ExternalLink } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GoogleLogo: React.FC = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
    />
  </svg>
);

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { isAuthenticated, signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [iframeOAuthUrl, setIframeOAuthUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && isOpen) {
      setErrorMsg(null);
      setIframeOAuthUrl(null);
      onClose();
    }
  }, [isAuthenticated, isOpen, onClose]);

  if (!isOpen) return null;

  const handleClose = () => {
    setErrorMsg(null);
    setIframeOAuthUrl(null);
    onClose();
  };

  const handleGoogleLoginClick = async () => {
    setErrorMsg(null);
    setIframeOAuthUrl(null);
    setIsLoading(true);

    const result = await signInWithGoogle();
    setIsLoading(false);

    if (result.error) {
      setErrorMsg(result.error);
      return;
    }

    // In embedded iframes, Google blocks OAuth inside the frame; provide direct new-tab link
    if (result.url) {
      setIframeOAuthUrl(result.url);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className="w-full max-w-[400px] bg-[#FAF5F7] rounded-3xl p-6 shadow-2xl border border-pink-100 relative overflow-hidden space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white/90 hover:bg-pink-50 text-slate-500 hover:text-pink-600 border border-pink-100/80 flex items-center justify-center transition-colors"
          aria-label="Close login popup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand & Editorial Title */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-[11px] font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-pink-600" />
            <span>Movie-Clip Shadowing</span>
          </div>

          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 text-white flex items-center justify-center font-editorial font-bold text-2xl shadow-md shadow-pink-500/20">
            F
          </div>

          <h2 id="auth-modal-title" className="font-editorial text-2xl font-bold text-slate-900 tracking-tight">
            Fluent Shadowing
          </h2>
          <p className="text-sm font-medium text-pink-600 font-serif italic -mt-1">
            The Devil Wears Prada
          </p>
        </div>

        <div className="bg-white/95 rounded-2xl p-5 border border-purple-100 shadow-sm space-y-4">
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-slate-800">
              Google 계정으로 간편하게 시작하세요
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              별도의 회원가입 없이 클릭 한 번으로 로그인하고<br />
              쉐도잉 학습 기록을 이어갈 수 있습니다.
            </p>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLoginClick}
            disabled={isLoading}
            className="w-full min-h-[52px] px-4 py-3 rounded-2xl bg-white hover:bg-pink-50/40 text-slate-800 border border-pink-200/90 hover:border-pink-300 shadow-sm hover:shadow-md flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            <GoogleLogo />
            <div className="text-left">
              <div className="text-sm font-bold text-slate-900 leading-tight">
                {isLoading ? 'Connecting to Google...' : 'Continue with Google'}
              </div>
              <div className="text-[11px] text-slate-500 font-medium leading-tight">
                Google 계정으로 로그인
              </div>
            </div>
          </button>

          {iframeOAuthUrl && (
            <div className="p-3 rounded-xl bg-purple-50/90 border border-purple-200 space-y-2 text-center">
              <p className="text-[11px] text-purple-900 leading-relaxed">
                미리보기 창에서는 보안 정책상 Google 로그인 화면이 새 창에서 열려야 합니다.
              </p>
              <a
                href={iframeOAuthUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 w-full min-h-[40px] px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors"
              >
                <span>새 탭에서 Google 로그인 계속하기</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <p className="text-[11px] text-center text-slate-400 leading-relaxed pt-1">
            Educational use only · ENG3088 English Shadowing
          </p>
        </div>
      </div>
    </div>
  );
};
