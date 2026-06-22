'use client';

import { useMemo, useRef, useState } from 'react';
import type { UIMessage } from 'ai';
import { ArrowLeft, Bot, Check, Eraser, Loader2, MessageSquare, Search, Settings, Square, Wand2 } from 'lucide-react';
import Link from 'next/link';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/components/ai-elements/prompt-input';
import { SettingsDialog } from '@/components/settings';
import { getCurrentModelConfig } from '@/lib/utils/model-config';
import { useSettingsStore } from '@/lib/store/settings';
import { MONO_LOGO_PROVIDERS } from '@/lib/ai/providers';
import type { ProviderId } from '@/lib/ai/providers';
import type { ModelInfo } from '@/lib/types/provider';
import { cn } from '@/lib/utils';

type ChatEvent =
  | { type: 'delta'; delta: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

function getMessageText(message: UIMessage): string {
  return message.parts
    .map((part) => {
      if (part.type === 'text') return part.text;
      return '';
    })
    .join('');
}

function createTextMessage(role: 'user' | 'assistant', text: string): UIMessage {
  return {
    id: nanoid(),
    role,
    parts: [{ type: 'text', text }],
  };
}

function updateMessageText(message: UIMessage, text: string): UIMessage {
  return {
    ...message,
    parts: [{ type: 'text', text }],
  };
}
function ChatModelPicker({
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
          className="flex min-w-0 items-center gap-2 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Wand2 className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Using {currentLabel}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="top"
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

export default function AIChatPage() {
  const providerId = useSettingsStore((state) => state.providerId);
  const modelId = useSettingsStore((state) => state.modelId);
  const providersConfig = useSettingsStore((state) => state.providersConfig);
  const setModel = useSettingsStore((state) => state.setModel);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [status, setStatus] = useState<'ready' | 'streaming' | 'error'>('ready');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

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

  const providerConfig = providersConfig[providerId];
  const selectedModel = providerConfig?.models.find((model) => model.id === modelId);
  const isLocalModel = providerId === 'ollama' || providerConfig?.requiresApiKey === false;

  const modelLabel = useMemo(() => {
    const providerName = providerConfig?.name || providerId;
    const currentModelName = selectedModel?.name || modelId;
    return `${providerName} / ${currentModelName}`;
  }, [modelId, providerConfig?.name, providerId, selectedModel?.name]);

  const stopStreaming = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus('ready');
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || status === 'streaming') return;

    const userMessage = createTextMessage('user', trimmed);
    const assistantMessage = createTextMessage('assistant', '');
    const nextMessages = [...messages, userMessage, assistantMessage];

    setMessages(nextMessages);
    setStatus('streaming');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const modelConfig = getCurrentModelConfig();
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.slice(0, -1),
          apiKey: modelConfig.apiKey,
          baseUrl: modelConfig.baseUrl,
          model: modelConfig.modelString,
          providerType: modelConfig.providerType,
          thinkingConfig: modelConfig.thinkingConfig,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Request failed with ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let assistantText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() || '';

        for (const chunk of chunks) {
          const line = chunk.trim();
          if (!line.startsWith('data: ')) continue;

          const event = JSON.parse(line.slice(6)) as ChatEvent;
          if (event.type === 'delta') {
            assistantText += event.delta;
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantMessage.id ? updateMessageText(message, assistantText) : message,
              ),
            );
          }

          if (event.type === 'error') {
            throw new Error(event.message);
          }
        }
      }

      setStatus('ready');
      abortRef.current = null;
    } catch (error) {
      if (controller.signal.aborted) return;
      const message = error instanceof Error ? error.message : 'Failed to send message';
      setStatus('error');
      toast.error(message);
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantMessage.id
            ? updateMessageText(item, `I could not complete that request. ${message}`)
            : item,
        ),
      );
      abortRef.current = null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="shrink-0">
            <Link href="/dashboard" aria-label="Back to dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex min-w-0 items-center gap-3">
            {providerConfig?.icon ? (
              <img
                src={providerConfig.icon}
                alt=""
                className={cn('h-8 w-8 rounded-md', MONO_LOGO_PROVIDERS.has(providerId) && 'dark:invert')}
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Bot className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold">AI Chat</h1>
              <p className="truncate text-xs text-muted-foreground">{modelLabel}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isLocalModel ? 'default' : 'secondary'} className="hidden sm:inline-flex">
            {isLocalModel ? 'Local' : 'Configured'}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Model</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col px-3 py-4 md:px-6">
        <Conversation className="min-h-0 rounded-lg border bg-card">
          <ConversationContent className="gap-5 p-4 md:p-6">
            {messages.length === 0 ? (
              <ConversationEmptyState
                icon={<MessageSquare className="h-10 w-10" />}
                title="Start a conversation"
                description="Ask anything and AI-Guru will answer with the model selected in settings."
              />
            ) : (
              messages.map((message) => {
                const text = getMessageText(message);
                return (
                  <Message key={message.id} from={message.role}>
                    <MessageContent
                      className={cn(
                        message.role === 'assistant' &&
                          'w-full rounded-none bg-transparent px-0 py-0 text-foreground',
                      )}
                    >
                      {message.role === 'assistant' ? (
                        text ? (
                          <MessageResponse>{text}</MessageResponse>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Thinking
                          </div>
                        )
                      ) : (
                        text
                      )}
                    </MessageContent>
                  </Message>
                );
              })
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="mt-4 shrink-0">
          <PromptInput
            onSubmit={({ text }) => sendMessage(text)}
            className="rounded-lg border bg-card shadow-sm"
          >
            <PromptInputBody>
              <PromptInputTextarea placeholder="Message AI-Guru..." disabled={status === 'streaming'} />
            </PromptInputBody>
            <PromptInputFooter>
              <ChatModelPicker
                configuredProviders={configuredProviders}
                currentProviderId={providerId}
                currentModelId={modelId}
                onModelChange={setModel}
              />
              <div className="flex items-center gap-1">
                {messages.length > 0 && status !== 'streaming' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setMessages([])}
                    aria-label="Clear chat"
                  >
                    <Eraser className="h-4 w-4" />
                  </Button>
                )}
                {status === 'streaming' ? (
                  <Button type="button" size="icon-sm" onClick={stopStreaming} aria-label="Stop response">
                    <Square className="h-4 w-4" />
                  </Button>
                ) : (
                  <PromptInputSubmit status={status === 'error' ? 'error' : undefined} />
                )}
              </div>
            </PromptInputFooter>
          </PromptInput>
        </div>
      </main>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} initialSection="providers" />
    </div>
  );
}
