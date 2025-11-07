import { create } from 'zustand';

export type MoodValue = 'great' | 'good' | 'neutral' | 'bad' | 'terrible';

interface MoodEntry {
  id: string;
  mood: MoodValue;
  timestamp: Date;
  note?: string;
}

interface MoodState {
  moods: MoodEntry[];
  addMood: (mood: MoodValue, note?: string) => void;
  getMoodHistory: (days?: number) => MoodEntry[];
  clearMoods: () => void;
}

export const useMoodStore = create<MoodState>((set, get) => ({
  moods: [],
  addMood: (mood, note) =>
    set((state) => ({
      moods: [
        ...state.moods,
        {
          id: Date.now().toString(),
          mood,
          timestamp: new Date(),
          note,
        },
      ],
    })),
  getMoodHistory: (days = 7) => {
    const { moods } = get();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return moods.filter((mood) => mood.timestamp >= cutoffDate);
  },
  clearMoods: () => set({ moods: [] }),
}));

