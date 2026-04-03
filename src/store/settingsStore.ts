import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  language: 'es';
  scanPolicy: 'manual' | 'startup';
  cacheSizeMb: number;
  dataDirMode: 'data';
  mapMode: 'offline-first' | 'online-when-needed';
  readonlyMode: boolean;
  
  setLanguage: (value: 'es') => void;
  setScanPolicy: (value: 'manual' | 'startup') => void;
  setCacheSizeMb: (value: number) => void;
  setMapMode: (value: 'offline-first' | 'online-when-needed') => void;
  setReadonlyMode: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'es',
      scanPolicy: 'manual',
      cacheSizeMb: 1024, // 1GB default
      dataDirMode: 'data',
      mapMode: 'offline-first',
      readonlyMode: false,

      setLanguage: (value) => set({ language: value }),
      setScanPolicy: (value) => set({ scanPolicy: value }),
      setCacheSizeMb: (value) => set({ cacheSizeMb: value }),
      setMapMode: (value) => set({ mapMode: value }),
      setReadonlyMode: (value) => set({ readonlyMode: value }),
    }),
    {
      name: 'curator-settings-storage',
    }
  )
);
