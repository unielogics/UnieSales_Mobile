import { create } from 'zustand';
import { Preferences } from '@capacitor/preferences';
import type { AuthedUser } from '../types';

// Token + user are persisted via Capacitor Preferences (secure on-device store;
// falls back to localStorage in the web Preferences shim during `npm run dev`).
// The store holds them in memory so the API client can read the token
// synchronously on every request.

const TOKEN_KEY = 'uniesales:token';
const USER_KEY = 'uniesales:user';

interface AuthState {
  token: string | null;
  user: AuthedUser | null;
  hydrated: boolean;
  setSession: (token: string, user: AuthedUser) => Promise<void>;
  setUser: (user: AuthedUser) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  hydrated: false,

  setSession: async (token, user) => {
    set({ token, user });
    await Preferences.set({ key: TOKEN_KEY, value: token });
    await Preferences.set({ key: USER_KEY, value: JSON.stringify(user) });
  },

  setUser: async (user) => {
    set({ user });
    await Preferences.set({ key: USER_KEY, value: JSON.stringify(user) });
  },

  logout: async () => {
    set({ token: null, user: null });
    await Preferences.remove({ key: TOKEN_KEY });
    await Preferences.remove({ key: USER_KEY });
  },

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const [{ value: token }, { value: userRaw }] = await Promise.all([
        Preferences.get({ key: TOKEN_KEY }),
        Preferences.get({ key: USER_KEY }),
      ]);
      set({
        token: token || null,
        user: userRaw ? (JSON.parse(userRaw) as AuthedUser) : null,
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },
}));

/** Read the current token without subscribing (used by the API client). */
export function getToken(): string | null {
  return useAuth.getState().token;
}
