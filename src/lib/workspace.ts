import { create } from 'zustand';
import { Preferences } from '@capacitor/preferences';

// The campaign workspace the operator last selected. Sales mode is pinned to the
// Inbound workspace, so this only applies to campaign mode (mirrors the desktop
// workspace switcher). Persisted so the choice survives relaunches.
const WS_KEY = 'uniesales:m-campaign-wid';

interface WorkspaceState {
  campaignWid: string | null;
  setCampaignWid: (id: string) => void;
  hydrate: () => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  campaignWid: null,
  setCampaignWid: (id) => {
    set({ campaignWid: id });
    void Preferences.set({ key: WS_KEY, value: id });
  },
  hydrate: async () => {
    try {
      const { value } = await Preferences.get({ key: WS_KEY });
      if (value) set({ campaignWid: value });
    } catch {
      /* none stored yet */
    }
  },
}));
