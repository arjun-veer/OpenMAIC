'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bot,
  Check,
  CheckCircle2,
  History,
  Loader2,
  RefreshCcw,
  Search,
  Sparkles,
  Wand2,
} from 'lucide-react';
import Link from 'next/link';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { getCurrentModelConfig } from '@/lib/utils/model-config';
import { loadQuizAttempts, saveQuizAttempt } from '@/lib/utils/quiz-storage';
import type { GeneratedQuiz, QuizAttempt, QuizAttemptQuestion } from '@/lib/types/quiz';
import { useSettingsStore } from '@/lib/store/settings';
import { MONO_LOGO_PROVIDERS } from '@/lib/ai/providers';
import type { ProviderId } from '@/lib/ai/providers';
import type { ModelInfo } from '@/lib/types/provider';

function toAttemptQuestions(quiz: GeneratedQuiz): QuizAttemptQuestion[] {
  return quiz.questions.map((question) => ({
    ...question,
    selectedAnswerIndex: null,
  }));
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function QuizModelPicker({
  configuredProviders,
  currentProviderId,
  currentModelId,
  onModelChange,
}: {
  configuredProviders: Array<{
    id: ProviderId;
    name: string;
    icon?: string;
    models: ModelInfo[];
  }>;
  currentProviderId: ProviderId;
  currentModelId: string;
  onModelChange: (providerId: ProviderId, modelId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeProviderId, setActiveProviderId] = useState<ProviderId>(currentProviderId);
  const [searchQuery, setSearchQuery] = useState('');

  const searchTerm = searchQuery.trim().toLowerCase();
  const providerEntries = useMemo(() => {
    return configuredProviders
      .map((provider) => ({
        provider,
        matchingModels: provider.models.filter(
          (model) =>
            !searchTerm ||
            model.name.toLowerCase().includes(searchTerm) ||
            model.id.toLowerCase().includes(searchTerm),
        ),
      }))
      .filter((entry) => !searchTerm || entry.matchingModels.length > 0);
  }, [configuredProviders, searchTerm]);

  const activeProviderVisible = providerEntries.some(
    (entry) => entry.provider.id === activeProviderId,
  );
  const resolvedProviderId = activeProviderVisible
    ? activeProviderId
    : providerEntries[0]?.provider.id;
  const activeEntry =
    providerEntries.find((entry) => entry.provider.id === resolvedProviderId) ?? providerEntries[0];

  const currentProvider = configuredProviders.find((provider) => provider.id === currentProviderId);
  const currentModel = currentProvider?.models.find((model) => model.id === currentModelId);
  const currentLabel = currentProvider
    ? `${currentProvider.name} / ${currentModel?.name || currentModelId}`
    : 'Select model';

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setActiveProviderId(currentProviderId);
          setSearchQuery('');
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-9 w-full min-w-0 items-center gap-2 rounded-md border bg-background px-3 text-left text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Wand2 className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Using {currentLabel}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="right"
        sideOffset={8}
        collisionPadding={12}
        className="w-[640px] max-w-[calc(100vw-2rem)] overflow-hidden p-0"
      >
        <div className="grid h-[420px] grid-cols-[150px_minmax(0,1fr)]">
          <div className="min-h-0 border-r bg-muted/20">
            <div className="px-3 py-2 text-[10px] font-semibold uppercase text-muted-foreground">
              Provider
            </div>
            <div className="h-[calc(100%-28px)] overflow-y-auto px-2 pb-2 pt-1">
              {providerEntries.map(({ provider, matchingModels }) => {
                const isActive = activeEntry?.provider.id === provider.id;
                const isCurrent = currentProviderId === provider.id;
                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => setActiveProviderId(provider.id)}
                    className={cn(
                      'mb-1 flex h-10 w-full items-center gap-2 rounded-md px-2 text-left transition-colors',
                      isActive
                        ? 'bg-background text-foreground shadow-sm ring-1 ring-border/70'
                        : 'text-muted-foreground hover:bg-background/70 hover:text-foreground',
                    )}
                  >
                    {provider.icon ? (
                      <img
                        src={provider.icon}
                        alt={provider.name}
                        className={cn(
                          'size-4 shrink-0 rounded-sm',
                          MONO_LOGO_PROVIDERS.has(provider.id) && 'dark:invert',
                        )}
                      />
                    ) : (
                      <Bot className="size-4 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium">{provider.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {searchTerm ? `${matchingModels.length}/` : ''}
                        {provider.models.length}
                      </div>
                    </div>
                    {isCurrent && <span className="size-1.5 rounded-full bg-orange-500" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
            <div className="border-b p-3">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search models"
                  className="h-8 pl-8 text-xs"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {!activeEntry || activeEntry.matchingModels.length === 0 ? (
                <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                  No models found
                </div>
              ) : (
                activeEntry.matchingModels.map((model) => {
                  const isSelected =
                    currentProviderId === activeEntry.provider.id && currentModelId === model.id;
                  return (
                    <button
                      key={`${activeEntry.provider.id}:${model.id}`}
                      type="button"
                      onClick={() => {
                        onModelChange(activeEntry.provider.id, model.id);
                        setOpen(false);
                      }}
                      className={cn(
                        'mb-1 flex min-h-11 w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors',
                        isSelected
                          ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-950/25 dark:text-orange-300 dark:ring-orange-800'
                          : 'hover:bg-muted/60',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-mono text-xs font-medium">{model.name}</div>
                        {model.id !== model.name && (
                          <div className="truncate font-mono text-[10px] text-muted-foreground">
                            {model.id}
                          </div>
                        )}
                      </div>
                      {isSelected && <Check className="size-3.5 shrink-0 text-orange-500" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function QuizPage() {
  const providerId = useSettingsStore((state) => state.providerId);
  const modelId = useSettingsStore((state) => state.modelId);
  const providersConfig = useSettingsStore((state) => state.providersConfig);
  const setModel = useSettingsStore((state) => state.setModel);
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [currentTopic, setCurrentTopic] = useState('');
  const [questions, setQuestions] = useState<QuizAttemptQuestion[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadQuizAttempts()
      .then(setAttempts)
      .catch(() => toast.error('Could not load saved quizzes'));
  }, []);

  const score = useMemo(
    () =>
      questions.reduce(
        (total, question) =>
          total + (question.selectedAnswerIndex === question.correctAnswerIndex ? 1 : 0),
        0,
      ),
    [questions],
  );

  const selectedAttempt = attempts.find((attempt) => attempt.id === selectedAttemptId);
  const isReviewingSavedAttempt = Boolean(selectedAttemptId);

  const configuredProviders = useMemo(
    () =>
      Object.entries(providersConfig)
        .filter(
          ([, config]) =>
            (!config.requiresApiKey || config.apiKey || config.isServerConfigured) &&
            config.models.length >= 1 &&
            (config.baseUrl || config.defaultBaseUrl || config.serverBaseUrl),
        )
        .map(([id, config]) => ({
          id: id as ProviderId,
          name: config.name,
          icon: config.icon,
          models:
            config.isServerConfigured && !config.apiKey && config.serverModels?.length
              ? config.models.filter((model) => new Set(config.serverModels).has(model.id))
              : config.models,
        })),
    [providersConfig],
  );

  const generateQuiz = async () => {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      toast.error('Enter a topic first');
      return;
    }

    setIsGenerating(true);
    setSelectedAttemptId(null);
    setSubmitted(false);

    try {
      const modelConfig = getCurrentModelConfig();
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: trimmedTopic,
          questionCount,
          apiKey: modelConfig.apiKey,
          baseUrl: modelConfig.baseUrl,
          model: modelConfig.modelString,
          providerType: modelConfig.providerType,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate quiz');
      }

      const quiz = data as GeneratedQuiz & { success: true };
      setCurrentTopic(quiz.topic || trimmedTopic);
      setQuestions(toAttemptQuestions(quiz));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate quiz');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectAnswer = (questionId: string, optionIndex: number) => {
    if (submitted || isReviewingSavedAttempt) return;
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId ? { ...question, selectedAnswerIndex: optionIndex } : question,
      ),
    );
  };

  const submitQuiz = async () => {
    if (questions.length === 0) return;
    if (questions.some((question) => question.selectedAnswerIndex === null)) {
      toast.error('Answer every question before submitting');
      return;
    }

    const now = Date.now();
    const modelConfig = getCurrentModelConfig();
    const attempt: QuizAttempt = {
      id: nanoid(),
      topic: currentTopic,
      createdAt: now,
      submittedAt: now,
      score,
      total: questions.length,
      questions,
      model: modelConfig.modelString,
    };

    try {
      await saveQuizAttempt(attempt);
      setSubmitted(true);
      setAttempts((current) => [attempt, ...current]);
      setSelectedAttemptId(attempt.id);
      toast.success('Quiz saved');
    } catch {
      toast.error('Could not save quiz result');
    }
  };

  const startFresh = () => {
    setSelectedAttemptId(null);
    setSubmitted(false);
    setQuestions([]);
    setCurrentTopic('');
  };

  const visibleQuestions = selectedAttempt?.questions ?? questions;
  const visibleTopic = selectedAttempt?.topic ?? currentTopic;
  const visibleScore = selectedAttempt?.score ?? score;
  const visibleTotal = selectedAttempt?.total ?? questions.length;
  const showResults = submitted || isReviewingSavedAttempt;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex h-16 items-center justify-between border-b px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/dashboard" aria-label="Back to dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-base font-semibold">Quiz</h1>
            <p className="text-xs text-muted-foreground">Generate, submit, and review saved quizzes</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={startFresh}>
          <RefreshCcw className="h-4 w-4" />
          New
        </Button>
      </header>

      <main className="mx-auto grid max-w-6xl gap-5 p-4 md:grid-cols-[280px_minmax(0,1fr)] md:p-6">
        <aside className="space-y-4">
          <section className="rounded-lg border bg-card p-4">
            <div className="mb-3 flex items-center gap-2 font-medium">
              <Sparkles className="h-4 w-4 text-orange-500" />
              Create Quiz
            </div>
            <div className="space-y-3">
              <Input
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="Topic name"
                disabled={isGenerating}
              />
              <div className="flex gap-2">
                {[3, 5, 10].map((count) => (
                  <Button
                    key={count}
                    type="button"
                    variant={questionCount === count ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setQuestionCount(count)}
                    className="flex-1"
                  >
                    {count}
                  </Button>
                ))}
              </div>
              <QuizModelPicker
                configuredProviders={configuredProviders}
                currentProviderId={providerId}
                currentModelId={modelId}
                onModelChange={setModel}
              />
              <Button onClick={generateQuiz} disabled={isGenerating} className="w-full">
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate
              </Button>
            </div>
          </section>

          <section className="rounded-lg border bg-card p-4">
            <div className="mb-3 flex items-center gap-2 font-medium">
              <History className="h-4 w-4 text-muted-foreground" />
              Previous Quizzes
            </div>
            <div className="space-y-2">
              {attempts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No saved quizzes yet.</p>
              ) : (
                attempts.map((attempt) => (
                  <button
                    key={attempt.id}
                    type="button"
                    onClick={() => {
                      setSelectedAttemptId(attempt.id);
                      setSubmitted(true);
                    }}
                    className={cn(
                      'w-full rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60',
                      selectedAttemptId === attempt.id && 'border-orange-300 bg-orange-50 dark:bg-orange-950/20',
                    )}
                  >
                    <div className="truncate font-medium">{attempt.topic}</div>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{attempt.score}/{attempt.total}</span>
                      <span>{formatDate(attempt.submittedAt)}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>
        </aside>

        <section className="min-h-[620px] rounded-lg border bg-card p-4 md:p-6">
          {visibleQuestions.length === 0 ? (
            <div className="flex h-full min-h-[520px] flex-col items-center justify-center text-center">
              <Sparkles className="mb-3 h-10 w-10 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Create a quiz</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Enter a topic and generate a simple MCQ quiz. Submitted quizzes will appear in history.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                <div>
                  <h2 className="text-xl font-semibold">{visibleTopic}</h2>
                  <p className="text-sm text-muted-foreground">{visibleQuestions.length} questions</p>
                </div>
                {showResults && (
                  <Badge variant="secondary" className="text-sm">
                    Score {visibleScore}/{visibleTotal}
                  </Badge>
                )}
              </div>

              {visibleQuestions.map((question, questionIndex) => (
                <div key={question.id} className="rounded-lg border p-4">
                  <div className="mb-3 font-medium">
                    {questionIndex + 1}. {question.question}
                  </div>
                  <div className="grid gap-2">
                    {question.options.map((option, optionIndex) => {
                      const isSelected = question.selectedAnswerIndex === optionIndex;
                      const isCorrect = question.correctAnswerIndex === optionIndex;
                      const revealCorrect = showResults && isCorrect;
                      const revealWrong = showResults && isSelected && !isCorrect;

                      return (
                        <button
                          key={optionIndex}
                          type="button"
                          onClick={() => selectAnswer(question.id, optionIndex)}
                          className={cn(
                            'flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors',
                            !showResults && isSelected && 'border-orange-400 bg-orange-50 dark:bg-orange-950/20',
                            !showResults && 'hover:bg-muted/60',
                            revealCorrect && 'border-green-500 bg-green-50 text-green-800 dark:bg-green-950/20 dark:text-green-300',
                            revealWrong && 'border-red-500 bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-300',
                          )}
                        >
                          <span>{option}</span>
                          {revealCorrect && <CheckCircle2 className="h-4 w-4" />}
                        </button>
                      );
                    })}
                  </div>
                  {showResults && (
                    <p className="mt-3 text-sm text-muted-foreground">{question.explanation}</p>
                  )}
                </div>
              ))}

              {!showResults && (
                <div className="flex justify-end">
                  <Button onClick={submitQuiz}>Submit Quiz</Button>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
