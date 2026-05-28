import { create } from 'zustand';
import { Preferences } from '@capacitor/preferences';

export type AppMode = 'sales' | 'campaign';
const MODE_KEY = 'uniesales:m-mode';

interface ModeState {
  mode: AppMode;
  setMode: (m: AppMode) => void;
  hydrate: () => Promise<void>;
}

export const useMode = create<ModeState>((set) => ({
  mode: 'sales',
  setMode: (mode) => {
    set({ mode });
    void Preferences.set({ key: MODE_KEY, value: mode });
  },
  hydrate: async () => {
    try {
      const { value } = await Preferences.get({ key: MODE_KEY });
      if (value === 'sales' || value === 'campaign') set({ mode: value });
    } catch {
      /* default 'sales' */
    }
  },
}));
