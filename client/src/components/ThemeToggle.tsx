import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`group relative flex items-center justify-center gap-2 p-2 rounded-xl transition-all duration-300 cursor-pointer select-none border ${
        isDark
          ? 'bg-slate-900/80 hover:bg-slate-800 text-amber-400 border-slate-800 hover:border-amber-500/40 shadow-sm shadow-black/20'
          : 'bg-white hover:bg-slate-100 text-indigo-600 border-slate-200 hover:border-indigo-400/50 shadow-sm shadow-slate-200/50'
      } ${className}`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {/* Sun Icon */}
        <Sun
          className={`w-5 h-5 transition-all duration-300 ${
            isDark
              ? 'rotate-0 scale-100 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
              : '-rotate-90 scale-0 opacity-0 absolute'
          }`}
        />

        {/* Moon Icon */}
        <Moon
          className={`w-5 h-5 transition-all duration-300 ${
            !isDark
              ? 'rotate-0 scale-100 text-indigo-600 drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]'
              : 'rotate-90 scale-0 opacity-0 absolute'
          }`}
        />
      </div>

      {showLabel && (
        <span className="text-xs font-semibold tracking-wide">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
};
