import type { QuizAttempt } from '@/lib/types/quiz';
import { db } from './database';

export async function saveQuizAttempt(attempt: QuizAttempt): Promise<void> {
  await db.quizAttempts.put(attempt);
}

export async function loadQuizAttempts(): Promise<QuizAttempt[]> {
  const attempts = await db.quizAttempts.orderBy('submittedAt').reverse().toArray();
  return attempts;
}

export async function getQuizAttempt(id: string): Promise<QuizAttempt | undefined> {
  return db.quizAttempts.get(id);
}

export async function deleteQuizAttempt(id: string): Promise<void> {
  await db.quizAttempts.delete(id);
}
