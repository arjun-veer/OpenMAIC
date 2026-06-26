export type QuizBloomLevel = 'remember' | 'understand' | 'apply' | 'analyze';

export interface GeneratedQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  difficulty: number;
  discrimination: number;
  conceptWeight: number;
  skillTag: string;
  bloomLevel: QuizBloomLevel;
}

export interface QuizAttemptQuestion extends GeneratedQuizQuestion {
  selectedAnswerIndex: number | null;
}

export interface QuizAttempt {
  id: string;
  topic: string;
  createdAt: number;
  submittedAt: number;
  score: number;
  total: number;
  questions: QuizAttemptQuestion[];
  model?: string;
}

export interface GeneratedQuiz {
  topic: string;
  questions: GeneratedQuizQuestion[];
}
