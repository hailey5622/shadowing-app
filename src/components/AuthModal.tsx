import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { X, Sparkles, LogOut, Info } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
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

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, user }) => {
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setNoticeMsg(null);
    onClose();
  };

  const handleGoogleLoginClick = () => {
    setNoticeMsg('Google 로그인 화면 디자인이 준비되었습니다. 다음 단계에서 실제 Google OAuth를 연결할 수 있습니다.');
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      handleClose();
    } catch {
      setNoticeMsg('로그아웃 처리 중 문제가 발생했습니다.');
    } finally {
      setIsLoading(false);
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

        {/* Brand & Editorial Title (matches main page concept) */}
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

        {user ? (
          <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-2xs space-y-4">
            <div className="space-y-1 text-center">
              <span className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider">
                Signed in with Google
              </span>
              <p className="text-sm font-semibold text-slate-900 break-all">{user.email}</p>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={isLoading}
              className="w-full min-h-[48px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              <LogOut className="w-4 h-4" />
              <span>{isLoading ? 'Signing out...' : 'Sign Out / 로그아웃'}</span>
            </button>
          </div>
        ) : (
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

            {/* Google Only Login Button */}
            <button
              type="button"
              onClick={handleGoogleLoginClick}
              className="w-full min-h-[52px] px-4 py-3 rounded-2xl bg-white hover:bg-pink-50/40 text-slate-800 border border-pink-200/90 hover:border-pink-300 shadow-sm hover:shadow-md flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
            >
              <GoogleLogo />
              <div className="text-left">
                <div className="text-sm font-bold text-slate-900 leading-tight">
                  Continue with Google
                </div>
                <div className="text-[11px] text-slate-500 font-medium leading-tight">
                  Google 계정으로 로그인
                </div>
              </div>
            </button>

            {noticeMsg && (
              <div className="p-3 rounded-xl bg-purple-50/80 border border-purple-100 text-xs text-purple-800 flex items-start gap-2">
                <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{noticeMsg}</span>
              </div>
            )}

            <p className="text-[11px] text-center text-slate-400 leading-relaxed pt-1">
              Educational use only · ENG3088 English Shadowing
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
