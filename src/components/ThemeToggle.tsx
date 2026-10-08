'use client';

import React from 'react';
import { useTheme } from './ThemeProvider';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 text-xs font-medium ${className}`}
      title={`Tema: ${theme === 'system' ? 'Sistem' : theme === 'dark' ? 'Gelap' : 'Terang'}`}
      aria-label="Toggle theme"
    >
      {theme === 'system' && <Monitor className="w-4 h-4 text-brand-navy-600 dark:text-brand-amber-400" />}
      {theme === 'light' && <Sun className="w-4 h-4 text-brand-amber-500" />}
      {theme === 'dark' && <Moon className="w-4 h-4 text-indigo-400" />}
      <span className="capitalize hidden sm:inline">
        {theme === 'system' ? 'Auto' : theme === 'dark' ? 'Gelap' : 'Terang'}
      </span>
    </button>
  );
}
