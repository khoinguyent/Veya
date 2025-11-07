import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  language: string;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  setLanguage: (language: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  language: 'en',
  notificationsEnabled: true,
  soundEnabled: true,
  setLanguage: (language: string) => set({ language }),
  setNotificationsEnabled: (notificationsEnabled: boolean) =>
    set({ notificationsEnabled }),
  setSoundEnabled: (soundEnabled: boolean) => set({ soundEnabled }),
  loadSettings: async () => {
    try {
      const settings = await AsyncStorage.getItem('settings');
      if (settings) {
        set(JSON.parse(settings));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  },
  saveSettings: async () => {
    try {
      const { language, notificationsEnabled, soundEnabled } = get();
      await AsyncStorage.setItem(
        'settings',
        JSON.stringify({ language, notificationsEnabled, soundEnabled })
      );
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  },
}));

