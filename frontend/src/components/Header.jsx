import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const currentUser = user || { full_name: 'Elena Vance', email: 'elena@recruit.ai', role: 'recruiter' };
  const displayName = currentUser.full_name || currentUser.name || 'User';

  return (
    <>
      <header className="fixed top-0 right-0 w-[calc(100%-220px)] h-topbar-height bg-surface border-b border-border-subtle flex justify-between items-center px-container-padding z-40">
        <div className="flex items-center gap-md w-1/2">
        </div>
        <div className="flex items-center gap-md">
          <div
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-3 pl-2 cursor-pointer group hover:opacity-85 select-none"
          >
            <div className="text-right hidden sm:block">
              <p className="font-body-bold text-[13px] leading-tight group-hover:text-primary transition-colors">{displayName}</p>
              <p className="text-text-muted text-[11px] leading-tight">{currentUser.role || 'HR Manager'}</p>
            </div>
            <div className="w-8 h-8 rounded-full border border-border-subtle bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm overflow-hidden transition-all group-hover:border-primary">
              {displayName.charAt(0)}
            </div>
          </div>
        </div>
      </header>

      {/* User Settings Dropdown Modal */}
      {isUserMenuOpen && (
        <>
          <div
            onClick={() => setIsUserMenuOpen(false)}
            className="fixed inset-0 bg-black/10 backdrop-blur-[1px] z-50"
          ></div>
          <div
            className="fixed top-16 right-6 w-[320px] bg-surface rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-border-subtle z-[60] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Profile Header */}
            <div className="p-5 border-b border-border-subtle flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border border-border-subtle bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-lg overflow-hidden flex-shrink-0">
                {displayName.charAt(0)}
              </div>
              <div className="flex flex-col">
                <p className="font-body-bold text-[15px] text-text-primary leading-tight">{displayName}</p>
                <p className="text-text-muted text-[12px] mt-0.5">{currentUser.email || 'user@recruit.ai'}</p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="py-2">
              <Link
                to="/settings"
                onClick={() => setIsUserMenuOpen(false)}
                className="flex items-center gap-3 px-5 py-2.5 hover:bg-surface-container-low transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[20px] text-text-secondary">manage_accounts</span>
                <span className="text-body-standard text-text-primary">Account Settings</span>
              </Link>
              <Link
                to="/settings"
                onClick={() => setIsUserMenuOpen(false)}
                className="flex items-center gap-3 px-5 py-2.5 hover:bg-surface-container-low transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[20px] text-text-secondary">psychology</span>
                <span className="text-body-standard text-text-primary">AI Configuration</span>
              </Link>
            </div>

            <div className="h-px bg-border-subtle mx-5"></div>

            {/* Theme Toggle */}
            <div className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px] text-text-secondary">dark_mode</span>
                <span className="text-body-standard text-text-primary">Dark Mode</span>
              </div>
              <button
                onClick={() => toast.success('Dark mode coming soon!', { icon: '🌓' })}
                className="w-10 h-5 bg-surface-container rounded-full relative p-0.5 flex items-center transition-colors"
              >
                <div className="w-4 h-4 bg-primary rounded-full translate-x-0 transition-transform"></div>
              </button>
            </div>

            {/* Sign Out */}
            <div className="mt-auto p-4 bg-surface-container-low border-t border-border-subtle">
              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  logout();
                  navigate('/');
                }}
                className="w-full flex items-center justify-center gap-2 py-2 text-danger hover:bg-danger-soft hover:text-danger-soft transition-colors rounded-lg font-body-bold text-body-standard border border-transparent hover:border-danger/10"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Header;
