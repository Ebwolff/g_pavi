import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            theme: 'dark', // Default to dark as per current design
            setTheme: (theme) => set({ theme }),
        }),
        {
            name: 'visao360-theme-storage',
        }
    )
);
