import { create } from 'zustand';

interface SettingsState {
  language: string;
  theme: 'light' | 'dark';
  portableDataPath: string | null;
  scanningPolicy: 'automatic' | 'manual';
  cacheSizeLimit: number; // in MB
  setLanguage: (lang: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setPortableDataPath: (path: string | null) => void;
}

/**
 * Store para la configuración global de Curator.
 * Base estructural para futuras expansiones según el Planner 01.
 */
export const useSettingsStore = create<SettingsState>((set) => ({
  language: 'es',
  theme: 'dark',
  portableDataPath: null,
  scanningPolicy: 'automatic',
  cacheSizeLimit: 1024,
  setLanguage: (language) => set({ language }),
  setTheme: (theme) => set({ theme }),
  setPortableDataPath: (portableDataPath) => set({ portableDataPath }),
}));
