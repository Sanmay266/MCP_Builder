"use client";

import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
                onClick={() => setTheme('light')}
                className={`p-2 rounded-md transition-colors ${
                    theme === 'light' 
                        ? 'bg-white dark:bg-gray-700 shadow-sm' 
                        : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                title="Light mode"
            >
                <Sun className="w-4 h-4" />
            </button>
            <button
                onClick={() => setTheme('dark')}
                className={`p-2 rounded-md transition-colors ${
                    theme === 'dark' 
                        ? 'bg-white dark:bg-gray-700 shadow-sm' 
                        : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                title="Dark mode"
            >
                <Moon className="w-4 h-4" />
            </button>
            <button
                onClick={() => setTheme('system')}
                className={`p-2 rounded-md transition-colors ${
                    theme === 'system' 
                        ? 'bg-white dark:bg-gray-700 shadow-sm' 
                        : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                title="System preference"
            >
                <Monitor className="w-4 h-4" />
            </button>
        </div>
    );
}
