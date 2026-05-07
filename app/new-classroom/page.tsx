'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, ArrowUp, Atom, BotOff, Settings, Sparkles,
} from 'lucide-react';
import { useI18n } from '@/lib/hooks/use-i18n';
import { createLogger } from '@/lib/logger';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { GenerationToolbar } from '@/components/generation/generation-toolbar';
import { AgentBar } from '@/components/agent/agent-bar';
import { SpeechButton } from '@/components/audio/speech-button';
import { SettingsDialog } from '@/components/settings';
import { useDraftCache } from '@/lib/hooks/use-draft-cache';
import { useSettingsStore } from '@/lib/store/settings';
import { useUserProfileStore } from '@/lib/store/user-profile';
import { storePdfBlob } from '@/lib/utils/image-storage';
import type { UserRequirements } from '@/lib/types/generation';
import { nanoid } from 'nanoid';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const log = createLogger('NewClassroom');
const WEB_SEARCH_KEY = 'webSearchEnabled';
const INTERACTIVE_KEY = 'interactiveModeEnabled';

interface FormState {
  pdfFile: File | null;
  requirement: string;
  webSearch: boolean;
  interactiveMode: boolean;
}

export default function NewClassroomPage() {
  const { t } = useI18n();
  const router = useRouter();
  const currentModelId = useSettingsStore((s) => s.modelId);

  const [form, setForm] = useState<FormState>({
    pdfFile: null, requirement: '', webSearch: false, interactiveMode: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<
    import('@/lib/types/settings').SettingsSection | undefined
  >(undefined);

  const { cachedValue: cachedReq, updateCache: updateReqCache } =
    useDraftCache<string>({ key: 'requirementDraft' });

  const [prevCached, setPrevCached] = useState(cachedReq);
  if (cachedReq !== prevCached) {
    setPrevCached(cachedReq);
    if (cachedReq) setForm((p) => ({ ...p, requirement: cachedReq }));
  }

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const updateForm = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((p) => ({ ...p, [field]: value }));
    try {
      if (field === 'webSearch') localStorage.setItem(WEB_SEARCH_KEY, String(value));
      if (field === 'interactiveMode') localStorage.setItem(INTERACTIVE_KEY, String(value));
      if (field === 'requirement') updateReqCache(value as string);
    } catch {}
  };

  const showSetupToast = (icon: React.ReactNode, title: string, desc: string) => {
    toast.custom((id) => (
      <div className="w-[356px] rounded-xl border border-amber-200/60 dark:border-amber-800/40 bg-gradient-to-r from-amber-50 via-white to-amber-50 dark:from-amber-950/60 dark:via-slate-900 dark:to-amber-950/60 shadow-lg p-4 flex items-start gap-3 cursor-pointer"
        onClick={() => { toast.dismiss(id); setSettingsOpen(true); }}>
        <div className="shrink-0 mt-0.5 size-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">{title}</p>
          <p className="text-xs text-amber-700/80 dark:text-amber-400/70 mt-0.5">{desc}</p>
        </div>
        <Settings className="size-3.5 text-amber-500 animate-[spin_3s_linear_infinite] mt-1 shrink-0" />
      </div>
    ), { duration: 4000 });
  };

  const handleGenerate = async () => {
    if (!currentModelId) {
      showSetupToast(<BotOff className="size-4.5 text-amber-600 dark:text-amber-400" />, t('settings.modelNotConfigured'), t('settings.setupNeeded'));
      setSettingsOpen(true);
      return;
    }
    if (!form.requirement.trim()) { setError(t('upload.requirementRequired')); return; }
    setError(null);
    try {
      const userProfile = useUserProfileStore.getState();
      const requirements: UserRequirements = {
        requirement: form.requirement,
        userNickname: userProfile.nickname || undefined,
        userBio: userProfile.bio || undefined,
        webSearch: form.webSearch || undefined,
        interactiveMode: form.interactiveMode,
      };
      let pdfStorageKey: string | undefined, pdfFileName: string | undefined;
      let pdfProviderId: string | undefined;
      let pdfProviderConfig: { apiKey?: string; baseUrl?: string } | undefined;
      if (form.pdfFile) {
        pdfStorageKey = await storePdfBlob(form.pdfFile);
        pdfFileName = form.pdfFile.name;
        const settings = useSettingsStore.getState();
        pdfProviderId = settings.pdfProviderId;
        const cfg = settings.pdfProvidersConfig?.[settings.pdfProviderId];
        if (cfg) pdfProviderConfig = { apiKey: cfg.apiKey, baseUrl: cfg.baseUrl };
      }
      sessionStorage.setItem('generationSession', JSON.stringify({
        sessionId: nanoid(), requirements, pdfText: '', pdfImages: [], imageStorageIds: [],
        pdfStorageKey, pdfFileName, pdfProviderId, pdfProviderConfig,
        sceneOutlines: null, currentStep: 'generating' as const,
      }));
      router.push('/generation-preview');
    } catch (err) {
      log.error('Error preparing generation:', err);
      setError(err instanceof Error ? err.message : t('upload.generateFailed'));
    }
  };

  const canGenerate = !!form.requirement.trim();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col">
      {/* Background decor */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-orange-400/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/6 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md border-b border-border/40 flex items-center px-5 gap-4">
        <button onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
          <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Dashboard</span>
        </button>
        <div className="flex items-center gap-2.5 mx-auto">
          <img src="/logo.svg" alt="AI-Guru" className="h-7" />
          <span className="font-extrabold text-base tracking-tight text-gray-900 dark:text-white">
            AI<span className="text-orange-500">-Guru</span>
          </span>
        </div>
        <button onClick={() => setSettingsOpen(true)} className="p-2 rounded-full text-muted-foreground/60 hover:bg-muted/60 hover:text-foreground/80 transition-all group">
          <Settings className="size-4 group-hover:rotate-90 transition-transform duration-500" />
        </button>
      </header>

      <SettingsDialog open={settingsOpen} onOpenChange={(o) => { setSettingsOpen(o); if (!o) setSettingsSection(undefined); }} initialSection={settingsSection} />

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center pt-14 px-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-2xl"
        >
          {/* Page title */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800/50 text-orange-600 dark:text-orange-400 px-4 py-1.5 rounded-full text-sm font-medium mb-5"
            >
              <Sparkles className="size-3.5" /> New Classroom
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-3"
            >
              What do you want to learn?
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground text-base"
            >
              Describe a topic, paste your notes, or upload a PDF — AI-Guru builds your classroom.
            </motion.p>
          </div>

          {/* Input card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
          >
            <div className="w-full rounded-2xl border border-border/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl shadow-black/[0.04] dark:shadow-black/25 focus-within:shadow-2xl focus-within:shadow-orange-500/[0.08] transition-all">
              {/* Greeting + Agents row */}
              <div className="relative z-20 flex items-start justify-between">
                <GreetingBarInline />
                <div className="pr-3 pt-3.5 shrink-0"><AgentBar /></div>
              </div>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                autoFocus
                placeholder={t('upload.requirementPlaceholder')}
                className="w-full resize-none border-0 bg-transparent px-4 pt-1 pb-2 text-[14px] leading-relaxed placeholder:text-muted-foreground/40 focus:outline-none min-h-[160px] max-h-[400px]"
                value={form.requirement}
                onChange={(e) => updateForm('requirement', e.target.value)}
                onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canGenerate) { e.preventDefault(); handleGenerate(); } }}
                rows={5}
              />

              {/* Toolbar */}
              <div className="px-3 pb-3 flex items-end gap-2 flex-wrap">
                <div className="flex-1 min-w-0">
                  <GenerationToolbar
                    webSearch={form.webSearch}
                    onWebSearchChange={(v) => updateForm('webSearch', v)}
                    onSettingsOpen={(section) => { setSettingsSection(section); setSettingsOpen(true); }}
                    pdfFile={form.pdfFile}
                    onPdfFileChange={(f) => updateForm('pdfFile', f)}
                    onPdfError={setError}
                  />
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => updateForm('interactiveMode', !form.interactiveMode)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border shrink-0 h-8 transition-all',
                        form.interactiveMode
                          ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                          : 'border-cyan-300/60 text-cyan-600 hover:bg-cyan-50',
                      )}
                    >
                      <Atom className="size-3.5 animate-[spin_3s_linear_infinite]" />
                      <span>{t('toolbar.interactiveModeLabel')}</span>
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">{t('toolbar.interactiveModeHint')}</TooltipContent>
                </Tooltip>
                <SpeechButton size="md" onTranscription={(text) => {
                  setForm((p) => {
                    const next = p.requirement + (p.requirement ? ' ' : '') + text;
                    updateReqCache(next);
                    return { ...p, requirement: next };
                  });
                }} />
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className={cn(
                    'shrink-0 h-8 rounded-xl flex items-center justify-center gap-1.5 px-4 transition-all font-medium text-sm',
                    canGenerate
                      ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-orange-500/30 cursor-pointer'
                      : 'bg-muted text-muted-foreground/40 cursor-not-allowed',
                  )}
                >
                  {t('toolbar.enterClassroom')}
                  <ArrowUp className="size-3.5" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                <p className="text-sm text-destructive">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hint */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="mt-4 text-center text-xs text-muted-foreground/50">
            Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">⌘ Enter</kbd> to generate
          </motion.p>
        </motion.div>
      </main>
    </div>
  );
}

// Compact greeting bar for the new classroom page
function GreetingBarInline() {
  const { t } = useI18n();
  const avatar = useUserProfileStore((s) => s.avatar);
  const nickname = useUserProfileStore((s) => s.nickname);
  const displayName = nickname || t('profile.defaultNickname');
  return (
    <div className="pl-4 pt-3.5 pb-1 flex items-center gap-2">
      <div className="size-7 rounded-full overflow-hidden ring-[1.5px] ring-border/30 shrink-0">
        <img src={avatar} alt="" className="size-full object-cover" />
      </div>
      <span className="text-[13px] font-semibold text-foreground/70">
        {t('home.greetingWithName', { name: displayName })}
      </span>
    </div>
  );
}
