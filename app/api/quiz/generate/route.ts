import { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { callLLM } from '@/lib/ai/llm';
import { apiError, apiSuccess } from '@/lib/server/api-response';
import { resolveModel } from '@/lib/server/resolve-model';
import { parseJsonResponse } from '@/lib/generation/json-repair';
import type { GeneratedQuiz, GeneratedQuizQuestion, QuizBloomLevel } from '@/lib/types/quiz';
import { createLogger } from '@/lib/logger';

const log = createLogger('Quiz Generate API');

export const maxDuration = 60;

interface GenerateQuizRequest {
  topic?: string;
  questionCount?: number;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  providerType?: string;
}

const BLOOM_LEVELS: QuizBloomLevel[] = ['remember', 'understand', 'apply', 'analyze'];

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function normalizeBloomLevel(value: unknown): QuizBloomLevel {
  return BLOOM_LEVELS.includes(value as QuizBloomLevel) ? (value as QuizBloomLevel) : 'understand';
}

function normalizeQuiz(raw: unknown, fallbackTopic: string, requestedCount: number): GeneratedQuiz {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const rawQuestions = Array.isArray(record.questions) ? record.questions : [];

  const questions: GeneratedQuizQuestion[] = rawQuestions
    .slice(0, requestedCount)
    .map((item) => {
      const q = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
      const options = Array.isArray(q.options) ? q.options.map(String).slice(0, 4) : [];
      while (options.length < 4) options.push(`Option ${options.length + 1}`);

      const correctAnswerIndex = Math.round(
        clampNumber(q.correctAnswerIndex, 0, options.length - 1, 0),
      );

      return {
        id: typeof q.id === 'string' && q.id.trim() ? q.id : nanoid(),
        question: String(q.question || 'Untitled question'),
        options,
        correctAnswerIndex,
        explanation: String(q.explanation || 'No explanation provided.'),
        difficulty: clampNumber(q.difficulty, 1, 5, 3),
        discrimination: clampNumber(q.discrimination, 1, 5, 3),
        conceptWeight: clampNumber(q.conceptWeight, 0, 1, 0.5),
        skillTag: String(q.skillTag || fallbackTopic),
        bloomLevel: normalizeBloomLevel(q.bloomLevel),
      };
    });

  if (questions.length === 0) {
    throw new Error('The model did not return any valid questions.');
  }

  return {
    topic: String(record.topic || fallbackTopic),
    questions,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateQuizRequest = await req.json();
    const topic = body.topic?.trim();
    const questionCount = Math.round(clampNumber(body.questionCount, 3, 10, 5));

    if (!topic) {
      return apiError('MISSING_REQUIRED_FIELD', 400, 'Topic is required');
    }

    const { model: languageModel, thinkingConfig } = await resolveModel({
      modelString: body.model,
      apiKey: body.apiKey,
      baseUrl: body.baseUrl,
      providerType: body.providerType,
    });

    const system = `You generate simple English-only multiple-choice quizzes for students.
Return ONLY valid JSON. Do not use markdown or code fences.
Every question must have exactly 4 options and one correctAnswerIndex from 0 to 3.
Also include numeric metadata for a future weighted-sum ranker:
- difficulty: integer 1-5
- discrimination: integer 1-5
- conceptWeight: number 0-1
- skillTag: short English subtopic label
- bloomLevel: one of remember, understand, apply, analyze`;

    const prompt = `Create a ${questionCount}-question MCQ quiz about: ${topic}

Return exactly this JSON shape:
{
  "topic": "${topic.replace(/"/g, '\\"')}",
  "questions": [
    {
      "question": "English question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswerIndex": 0,
      "explanation": "Brief English explanation",
      "difficulty": 3,
      "discrimination": 3,
      "conceptWeight": 0.5,
      "skillTag": "subtopic",
      "bloomLevel": "understand"
    }
  ]
}`;

    const result = await callLLM(
      {
        model: languageModel,
        system,
        prompt,
        temperature: 0.4,
      },
      'quiz-generate',
      undefined,
      thinkingConfig,
    );

    const parsed = parseJsonResponse<unknown>(result.text);
    const quiz = normalizeQuiz(parsed, topic, questionCount);

    return apiSuccess(quiz);
  } catch (error) {
    log.error('Quiz generation failed:', error);
    return apiError(
      'INTERNAL_ERROR',
      500,
      error instanceof Error ? error.message : 'Failed to generate quiz',
    );
  }
}
