import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const Sidebar = () => {
  const { logout } = useAuth();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { name: 'Job Descriptions', path: '/jobs', icon: 'description' },
    { name: 'Screen Resumes', path: '/screen', icon: 'analytics' },
    { name: 'Candidates', path: '/candidates', icon: 'groups' },
    { name: 'Analytics', path: '/results', icon: 'monitoring' },
    { name: 'Settings', path: '/settings', icon: 'settings' },
  ];

  return (
    <aside className="fixed h-screen w-sidebar-width left-0 top-0 bg-surface border-r border-border-subtle flex flex-col py-6 z-50">
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span className="material-symbols-outlined text-on-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            auto_awesome
          </span>
        </div>
        <div className="flex flex-col">
          <span className="font-title-page text-title-page text-primary leading-none font-bold">RecruitAI</span>
          <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold">Intelligence</span>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-xs px-4 py-3 hover:bg-surface-container transition-colors ${
                isActive
                  ? 'bg-surface-container-low text-primary border-l-[2.5px] border-primary font-body-bold'
                  : 'text-text-secondary border-l-[2.5px] border-transparent'
              }`}
            >
              <span 
                className="material-symbols-outlined text-[18px]" 
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span className="font-nav-item text-nav-item">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-4 flex flex-col gap-2">
        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="flex items-center gap-xs text-text-secondary px-4 py-3 hover:bg-surface-container hover:text-danger transition-colors rounded-lg w-full text-left"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span className="font-nav-item text-nav-item">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
