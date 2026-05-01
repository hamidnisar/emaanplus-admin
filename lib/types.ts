export interface Quiz {
  id: string;
  title: string;
  category: string;
  timeLimitMinutes: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
  totalPlayers: number;
}

export interface Question {
  id: string;
  quizId: string;
  text: string;
  options: string[];       // always 4 options
  correctIndex: number;    // 0-3
  timeLimitSeconds: number;
  order: number;
}

export interface Player {
  uid: string;
  displayName: string;
  email: string;
  totalScore: number;
  quizzesPlayed: number;
  status: 'active' | 'inactive' | 'banned';
  createdAt: Date;
}

export interface Score {
  uid: string;
  quizId: string;
  score: number;
  completedAt: Date;
  answers: number[];       // chosen option index per question
}

export interface BlogPost {
  id: string;
  userName: string;
  caption: string;
  mediaType: 'image' | 'video' | 'youtube';
  mediaUrl: string;
  thumbnailUrl: string | null;
  status: 'published' | 'draft';
  createdAt: string;
}