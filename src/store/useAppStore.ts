import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  nickname?: string;
}

interface Profile {
  nickname: string;
  age: number;
  occupation: string;
  interests: string[];
  lifeRhythm: 'morning' | 'night';
  concerns: string;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  isPrimary: boolean;
  priority: number;
}

interface ActionTicket {
  id: string;
  action: string;
  goalType: 'primary' | 'pivot';
  actionLevel: 'normal' | 'minimal';
  status: 'open' | 'done';
  createdAt: string;
}

interface EffortPointRecord {
  date: string;
  points: number;
}

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  profile: Profile | null;
  goals: Goal[];
  actionTickets: ActionTicket[];
  effortPoints: EffortPointRecord[];
  totalEffortPoints: number;
  
  // Auth Actions
  login: (email: string, password: string) => void;
  logout: () => void;
  
  // Profile Actions
  setProfile: (profile: Profile) => void;
  updateProfile: (updates: Partial<Profile>) => void;
  
  // Goal Actions
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (goalId: string, updates: Partial<Goal>) => void;
  deleteGoal: (goalId: string) => void;
  setPrimaryGoal: (goalId: string) => void;
  
  // Ticket Actions
  addActionTicket: (ticket: Omit<ActionTicket, 'id' | 'createdAt'>) => void;
  markTicketDone: (ticketId: string) => void;
  
  // Effort Point Actions
  addEffortPoints: (points: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  isAuthenticated: false,
  profile: null,
  goals: [],
  actionTickets: [],
  effortPoints: [],
  totalEffortPoints: 0,
  
  login: (email: string, password: string) => {
    set({
      user: { id: '1', email, nickname: 'テストユーザー' },
      isAuthenticated: true,
    });
  },
  
  logout: () => {
    set({
      user: null,
      isAuthenticated: false,
      profile: null,
      goals: [],
      actionTickets: [],
      effortPoints: [],
      totalEffortPoints: 0,
    });
  },
  
  setProfile: (profile) => {
    set({ profile });
  },
  
  updateProfile: (updates) => {
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...updates } : null,
    }));
  },
  
  addGoal: (goal) => {
    const newGoal: Goal = {
      ...goal,
      id: Date.now().toString(),
    };
    set((state) => ({
      goals: [...state.goals, newGoal],
    }));
  },
  
  updateGoal: (goalId, updates) => {
    set((state) => ({
      goals: state.goals.map((goal) =>
        goal.id === goalId ? { ...goal, ...updates } : goal
      ),
    }));
  },
  
  deleteGoal: (goalId) => {
    set((state) => ({
      goals: state.goals.filter((goal) => goal.id !== goalId),
    }));
  },
  
  setPrimaryGoal: (goalId) => {
    set((state) => ({
      goals: state.goals.map((goal) => ({
        ...goal,
        isPrimary: goal.id === goalId,
        priority: goal.id === goalId ? 1 : goal.priority,
      })),
    }));
  },
  
  addActionTicket: (ticket) => {
    const newTicket: ActionTicket = {
      ...ticket,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: 'open',
    };
    set((state) => ({
      actionTickets: [...state.actionTickets, newTicket],
    }));
  },
  
  markTicketDone: (ticketId: string) => {
    set((state) => {
      const ticket = state.actionTickets.find((t) => t.id === ticketId);
      if (!ticket) return state;
      
      // Effort Point計算
      const pointMap = {
        'primary-normal': 10,
        'primary-minimal': 5,
        'pivot-normal': 7,
        'pivot-minimal': 3,
      };
      const key = `${ticket.goalType}-${ticket.actionLevel}` as keyof typeof pointMap;
      const points = pointMap[key] || 0;
      
      const today = new Date().toISOString().split('T')[0];
      const existingRecord = state.effortPoints.find((r) => r.date === today);
      
      return {
        actionTickets: state.actionTickets.map((t) =>
          t.id === ticketId ? { ...t, status: 'done' as const } : t
        ),
        effortPoints: existingRecord
          ? state.effortPoints.map((r) =>
              r.date === today ? { ...r, points: r.points + points } : r
            )
          : [...state.effortPoints, { date: today, points }],
        totalEffortPoints: state.totalEffortPoints + points,
      };
    });
  },
  
  addEffortPoints: (points) => {
    set((state) => ({
      totalEffortPoints: state.totalEffortPoints + points,
    }));
  },
}));
