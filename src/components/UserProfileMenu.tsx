import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User as UserIcon, BarChart3 } from 'lucide-react';

interface UserProfileMenuProps {
  onOpenSummary?: () => void;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({ onOpenSummary }) => {
  const { user, profile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!user) return null;

  const avatarUrl =
    profile?.avatar_url ||
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    null;

  const displayName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'User';

  const displayEmail = profile?.email || user.email || '';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Profile Avatar Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-9 h-9 rounded-full p-0.5 bg-gradient-to-tr from-pink-400 to-purple-500 shadow-xs hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
        aria-label="User profile menu"
        aria-expanded={isOpen}
      >
        <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
          {avatarUrl && !imgError ? (
            <img
              src={avatarUrl}
              alt={displayName}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs font-bold text-pink-700 flex items-center justify-center w-full h-full bg-pink-50">
              {initial || <UserIcon className="w-4 h-4" />}
            </span>
          )}
        </div>
      </button>

      {/* Hover / Tap Popover directly below profile picture */}
      <div
        className={`absolute right-0 top-full pt-2 z-50 transition-all duration-150 ${
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto'
        }`}
      >
        <div className="w-52 bg-white rounded-2xl shadow-xl border border-pink-100 p-2.5 space-y-2">
          {/* User Identity */}
          <div className="px-2 py-1.5 border-b border-pink-50">
            <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
            {displayEmail && (
              <p className="text-[11px] text-slate-500 truncate mt-0.5">{displayEmail}</p>
            )}
          </div>

          {/* Activity Summary Shortcut */}
          {onOpenSummary && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenSummary();
              }}
              className="w-full min-h-[40px] px-2.5 py-2 rounded-xl text-xs font-semibold text-purple-700 hover:text-purple-800 hover:bg-purple-50/80 flex items-center gap-2 transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5 shrink-0" />
              <span>활동 기록 요약</span>
            </button>
          )}

          {/* Sign out action */}
          <button
            type="button"
            onClick={async () => {
              setIsOpen(false);
              await signOut();
            }}
            className="w-full min-h-[40px] px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50/80 flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
