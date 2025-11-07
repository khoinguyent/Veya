import { create } from 'zustand';

interface Session {
  id: string;
  type: 'breathing' | 'meditation' | 'sleep';
  duration: number;
  completedAt: Date;
}

interface SessionState {
  sessions: Session[];
  currentSession: Session | null;
  addSession: (session: Omit<Session, 'id' | 'completedAt'>) => void;
  setCurrentSession: (session: Session | null) => void;
  clearSessions: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: [],
  currentSession: null,
  addSession: (session) =>
    set((state) => ({
      sessions: [
        ...state.sessions,
        {
          ...session,
          id: Date.now().toString(),
          completedAt: new Date(),
        },
      ],
    })),
  setCurrentSession: (session) => set({ currentSession: session }),
  clearSessions: () => set({ sessions: [] }),
}));

