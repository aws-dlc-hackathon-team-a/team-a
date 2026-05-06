export interface User {
  id: string;
  email: string;
  nickname: string;
}

export interface Profile {
  userId: string;
  nickname: string;
  age: number;
  occupation: string;
  interests: string[];
  lifeRhythm: 'morning' | 'night';
  concerns: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  isPrimary: boolean;
  priority: number;
}

export interface ActionTicket {
  id: string;
  userId: string;
  action: string;
  goalType: 'primary' | 'pivot';
  actionLevel: 'normal' | 'minimal';
  status: 'open' | 'done';
  createdAt: string;
}

export interface EffortPointRecord {
  date: string;
  points: number;
}

// モックデータストア
export const mockUsers: User[] = [
  { id: '1', email: 'test@example.com', nickname: 'テストユーザー' },
];

export const mockProfiles: Profile[] = [
  {
    userId: '1',
    nickname: 'テストユーザー',
    age: 28,
    occupation: 'エンジニア',
    interests: ['読書', 'プログラミング', '散歩'],
    lifeRhythm: 'morning',
    concerns: '運動不足と生活リズムの乱れ',
  },
];

export const mockGoals: Goal[] = [
  {
    id: 'goal-1',
    userId: '1',
    title: '毎日30分運動する',
    description: '健康維持のため、毎日30分の運動を習慣化したい',
    isPrimary: true,
    priority: 1,
  },
  {
    id: 'goal-2',
    userId: '1',
    title: '読書習慣をつける',
    description: '月に2冊以上の本を読む',
    isPrimary: false,
    priority: 2,
  },
];

export const mockActionTickets: ActionTicket[] = [
  {
    id: 'ticket-1',
    userId: '1',
    action: '10分間のストレッチをする',
    goalType: 'primary',
    actionLevel: 'minimal',
    status: 'open',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ticket-2',
    userId: '1',
    action: '30分のウォーキングをする',
    goalType: 'primary',
    actionLevel: 'normal',
    status: 'open',
    createdAt: new Date().toISOString(),
  },
];

export const mockEffortPoints: EffortPointRecord[] = [
  { date: '2026-05-01', points: 15 },
  { date: '2026-05-02', points: 10 },
  { date: '2026-05-03', points: 20 },
  { date: '2026-05-04', points: 5 },
  { date: '2026-05-05', points: 25 },
  { date: '2026-05-06', points: 18 },
];
