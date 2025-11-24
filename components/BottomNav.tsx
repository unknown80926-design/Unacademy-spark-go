import React from 'react';
import { AppState } from '../types';
import { CreateIcon, BrowseIcon, ProfileIcon } from './Icons';

interface BottomNavProps {
  activePage: AppState;
  onNavigate: (page: AppState) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activePage, onNavigate }) => {
  const navItems = [
    { id: 'setup', label: 'Create', icon: CreateIcon },
    { id: 'browse', label: 'Browse', icon: BrowseIcon },
    { id: 'profile', label: 'Profile', icon: ProfileIcon },
  ];
  
  const isActive = (id: string) => {
    if (id === 'setup') {
        return ['setup', 'loading', 'quiz', 'results'].includes(activePage);
    }
    return activePage === id;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 shadow-lg z-10">
      <div className="flex justify-around max-w-2xl mx-auto">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as AppState)}
            className={`flex flex-col items-center justify-center w-full py-2 px-1 text-sm transition-colors duration-200 ${
              isActive(item.id)
                ? 'text-purple-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <item.icon className="w-6 h-6 mb-1" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;