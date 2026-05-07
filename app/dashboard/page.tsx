'use client';

import {
  useState, useEffect, useMemo, useRef, useDeferredValue, useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check, ChevronRight, FolderOpen, FolderPlus, Pencil, Trash2,
  Search, Settings, Sun, Moon, Monitor, ChevronDown, ChevronUp,
  Upload, Atom, X, Plus, Download, MoreHorizontal, Home, PackageOpen,
  ImagePlus, Copy,
} from 'lucide-react';
import { useI18n } from '@/lib/hooks/use-i18n';
import { createLogger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupInput, InputGroupButton } from '@/components/ui/input-group';
import { Textarea as UITextarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { SettingsDialog } from '@/components/settings';
import { useTheme } from '@/lib/hooks/use-theme';
import { nanoid } from 'nanoid';
import { useSettingsStore } from '@/lib/store/settings';
import { useUserProfileStore, AVATAR_OPTIONS } from '@/lib/store/user-profile';
import {
  StageListItem, listStages, deleteStageData, renameStage, getFirstSlideByStages,
} from '@/lib/utils/stage-storage';
import { ThumbnailSlide } from '@/components/slide-renderer/components/ThumbnailSlide';
import type { Slide } from '@/lib/types/slides';
import { useMediaGenerationStore } from '@/lib/store/media-generation';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useImportClassroom } from '@/lib/import/use-import-classroom';
import { useImportFolder } from '@/lib/import/use-import-folder';
import { useExportFolder } from '@/lib/export/use-export-folder';

const log = createLogger('Home');
const FOLDERS_KEY = 'aiguru_folders';
const FOLDER_MAP_KEY = 'aiguru_classroom_folders';

// ─── Types ──────────────────────────────────────────────────────
interface FolderItem {
  id: string; name: string; color: string; createdAt: number; parentId: string | null;
}
const FOLDER_COLORS = ['#f97316','#3b82f6','#8b5cf6','#10b981','#ec4899','#f59e0b','#06b6d4','#6366f1'];

function loadFolders(): FolderItem[] {
  try { return JSON.parse(localStorage.getItem(FOLDERS_KEY) ?? '[]'); } catch { return []; }
}
function saveFolders(f: FolderItem[]) {
  try { localStorage.setItem(FOLDERS_KEY, JSON.stringify(f)); } catch {}
}
function loadFolderMap(): Record<string,string> {
  try { return JSON.parse(localStorage.getItem(FOLDER_MAP_KEY) ?? '{}'); } catch { return {}; }
}
function saveFolderMap(m: Record<string,string>) {
  try { localStorage.setItem(FOLDER_MAP_KEY, JSON.stringify(m)); } catch {}
}

// ─── Rename Modal ───────────────────────────────────────────────
interface RenameTarget { type: 'folder'|'classroom'; id: string; currentName: string; }
function RenameModal({ target, onConfirm, onClose }: {
  target: RenameTarget; onConfirm: (name: string) => void; onClose: () => void;
}) {
  const [draft, setDraft] = useState(target.currentName);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 50); }, []);
  const commit = () => { const t = draft.trim(); if (t) onConfirm(t); };
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.18 }}
        className="relative z-10 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-border/50 w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-foreground mb-1">
          Rename {target.type === 'folder' ? 'Folder' : 'Classroom'}
        </h3>
        <p className="text-xs text-muted-foreground/70 mb-4 truncate" title={target.currentName}>
          Current: <span className="font-medium text-foreground/80">{target.currentName}</span>
        </p>
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') onClose(); }}
          className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 transition-all"
          placeholder="New name…"
        />
        <div className="flex gap-2 mt-4 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted/60 transition-colors">
            Cancel
          </button>
          <button onClick={commit} disabled={!draft.trim()}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-40 transition-colors">
            Rename
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────
function HomePage() {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  // Settings / theme UI
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<
    import('@/lib/types/settings').SettingsSection | undefined
  >(undefined);
  const [themeOpen, setThemeOpen] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Folder state
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [folderMap, setFolderMap] = useState<Record<string,string>>({});
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  // Menus — managed via backdrop, not document listeners
  const [folderMenuId, setFolderMenuId] = useState<string | null>(null);
  const [moveMenuId, setMoveMenuId] = useState<string | null>(null);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);

  // Rename modal
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null);

  // Classrooms
  const [classrooms, setClassrooms] = useState<StageListItem[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, Slide>>({});
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Drag and drop
  const draggedClassroomId = useRef<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  // Init from localStorage
  useEffect(() => {
    setFolders(loadFolders());
    setFolderMap(loadFolderMap());
  }, []);

  // Close theme dropdown on outside click
  useEffect(() => {
    if (!themeOpen) return;
    const h = (e: MouseEvent) => {
      if (!toolbarRef.current?.contains(e.target as Node)) setThemeOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [themeOpen]);

  // Load classrooms
  const loadClassrooms = useCallback(async () => {
    try {
      const list = await listStages();
      setClassrooms(list);
      if (list.length > 0) {
        const slides = await getFirstSlideByStages(list.map((c) => c.id));
        setThumbnails(slides);
      }
    } catch (err) { log.error('Failed to load classrooms:', err); }
  }, []);

  useEffect(() => {
    useMediaGenerationStore.getState().revokeObjectUrls();
    useMediaGenerationStore.setState({ tasks: {} });
    loadClassrooms();
  }, [loadClassrooms]);

  // Import
  const { importing, fileInputRef, triggerFileSelect, handleFileChange } =
    useImportClassroom(loadClassrooms);
  const { fileInputRef: folderFileRef, triggerFolderSelect, handleFolderFileChange } =
    useImportFolder(() => loadClassrooms());
  const { exportFolderZip } = useExportFolder();

  // ─── Folder CRUD ─────────────────────────────────────────────
  const createFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    const f: FolderItem = {
      id: nanoid(), name, color: FOLDER_COLORS[folders.length % FOLDER_COLORS.length],
      createdAt: Date.now(), parentId: currentFolderId,
    };
    const next = [...folders, f];
    setFolders(next); saveFolders(next);
    setNewFolderName(''); setNewFolderOpen(false);
  };

  const renameFolder = (id: string, name: string) => {
    const next = folders.map((f) => f.id === id ? { ...f, name } : f);
    setFolders(next); saveFolders(next);
  };

  const deleteFolder = (id: string) => {
    const folder = folders.find((f) => f.id === id);
    const newMap = { ...folderMap };
    Object.entries(newMap).forEach(([cId, fId]) => {
      if (fId === id) { if (folder?.parentId) newMap[cId] = folder.parentId; else delete newMap[cId]; }
    });
    const next = folders.filter((f) => f.id !== id && f.parentId !== id);
    setFolders(next); saveFolders(next);
    setFolderMap(newMap); saveFolderMap(newMap);
    setDeletingFolderId(null); setFolderMenuId(null);
  };

  const moveClassroom = (classroomId: string, folderId: string | null) => {
    const m = { ...folderMap };
    if (folderId === null) delete m[classroomId]; else m[classroomId] = folderId;
    setFolderMap(m); saveFolderMap(m);
    setMoveMenuId(null);
  };

  // ─── Classroom CRUD ──────────────────────────────────────────
  const confirmDelete = async (id: string) => {
    setPendingDeleteId(null);
    try {
      await deleteStageData(id);
      const m = { ...folderMap }; delete m[id];
      setFolderMap(m); saveFolderMap(m);
      await loadClassrooms();
    } catch (err) { log.error('Failed to delete:', err); toast.error('Failed to delete classroom'); }
  };

  const handleRenameClassroom = async (id: string, name: string) => {
    try {
      await renameStage(id, name);
      setClassrooms((prev) => prev.map((c) => c.id === id ? { ...c, name } : c));
    } catch { toast.error(t('classroom.renameFailed')); }
  };

  // ─── Derived data ─────────────────────────────────────────────
  const dq = useDeferredValue(searchQuery.trim().toLowerCase());
  const filteredClassrooms = useMemo(() => {
    const inFolder = classrooms.filter((c) => (folderMap[c.id] ?? null) === currentFolderId);
    if (!dq) return inFolder;
    return inFolder.filter((c) =>
      c.name?.toLowerCase().includes(dq) || c.description?.toLowerCase().includes(dq),
    );
  }, [classrooms, folderMap, currentFolderId, dq]);

  const visibleFolders = useMemo(() =>
    folders.filter((f) => f.parentId === currentFolderId), [folders, currentFolderId]);

  const breadcrumbPath = useMemo(() => {
    const path: FolderItem[] = [];
    let id = currentFolderId;
    while (id) {
      const f = folders.find((x) => x.id === id);
      if (!f) break;
      path.unshift(f); id = f.parentId;
    }
    return path;
  }, [currentFolderId, folders]);

  const formatDate = (ts: number) => {
    const d = Math.floor((Date.now() - ts) / 86400000);
    if (d === 0) return t('classroom.today');
    if (d === 1) return t('classroom.yesterday');
    if (d < 7) return `${d} ${t('classroom.daysAgo')}`;
    return new Date(ts).toLocaleDateString();
  };

  // ─── Drag & Drop handlers ─────────────────────────────────────
  const onDragStart = (classroomId: string) => { draggedClassroomId.current = classroomId; };
  const onDragEnd = () => { draggedClassroomId.current = null; setDragOverFolderId(null); };
  const onFolderDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault(); setDragOverFolderId(folderId);
  };
  const onFolderDrop = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    if (draggedClassroomId.current) {
      moveClassroom(draggedClassroomId.current, folderId);
      toast.success('Classroom moved to folder');
    }
    setDragOverFolderId(null);
  };

  // Close all menus helper
  const closeAllMenus = () => { setFolderMenuId(null); setMoveMenuId(null); };
  const anyMenuOpen = folderMenuId !== null || moveMenuId !== null;

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Hidden inputs */}
      <input ref={fileInputRef} type="file" accept=".aicls,.zip" onChange={handleFileChange} className="hidden" />
      <input ref={folderFileRef} type="file" accept=".zip" onChange={handleFolderFileChange} className="hidden" />

      {/* Global menu backdrop — sits above content, below menus */}
      {anyMenuOpen && (
        <div className="fixed inset-0 z-[90]" onClick={closeAllMenus} />
      )}

      {/* Rename Modal */}
      <AnimatePresence>
        {renameTarget && (
          <RenameModal
            target={renameTarget}
            onClose={() => setRenameTarget(null)}
            onConfirm={(name) => {
              if (renameTarget.type === 'folder') renameFolder(renameTarget.id, name);
              else handleRenameClassroom(renameTarget.id, name);
              setRenameTarget(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* ═══ Header ═══ */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md border-b border-border/40 flex items-center px-5 gap-4">
        <div className="flex items-center gap-2.5 shrink-0">
          <img src="/logo.svg" alt="AI-Guru" className="h-8" />
          <span className="font-extrabold text-base tracking-tight text-gray-900 dark:text-white">
            AI<span className="text-orange-500">-Guru</span>
          </span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md mx-auto">
          <AnimatePresence initial={false}>
            {searchOpen ? (
              <motion.div key="open" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <InputGroup className="h-8 rounded-full bg-muted/50 border-transparent">
                  <Search className="size-3.5 ml-3 text-muted-foreground/50 shrink-0" />
                  <InputGroupInput
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Escape') { setSearchQuery(''); setSearchOpen(false); } }}
                    onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
                    placeholder="Search classrooms…"
                    className="h-8 pl-2 text-[13px]"
                  />
                  {searchQuery && (
                    <InputGroupButton size="icon-xs" onMouseDown={(e) => e.preventDefault()} onClick={() => setSearchQuery('')}>
                      <X />
                    </InputGroupButton>
                  )}
                </InputGroup>
              </motion.div>
            ) : (
              <motion.button key="closed" onClick={() => { setSearchOpen(true); requestAnimationFrame(() => searchInputRef.current?.focus()); }}
                className="flex items-center gap-2 h-8 px-3 rounded-full text-[13px] text-muted-foreground/60 hover:bg-muted/50 transition-all w-full">
                <Search className="size-3.5" />
                <span>Search classrooms…</span>
                <kbd className="ml-auto text-[10px] bg-muted rounded px-1.5 py-0.5 hidden sm:block">⌘K</kbd>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Right toolbar */}
        <div ref={toolbarRef} className="flex items-center gap-0.5 ml-auto shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={triggerFileSelect} disabled={importing} className="p-2 rounded-full text-muted-foreground/60 hover:bg-muted/60 hover:text-foreground/80 transition-all">
                <Upload className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Import classroom (.zip)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={triggerFolderSelect} className="p-2 rounded-full text-muted-foreground/60 hover:bg-muted/60 hover:text-foreground/80 transition-all">
                <PackageOpen className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Import folder (.zip)</TooltipContent>
          </Tooltip>

          {/* Theme selector */}
          <div className="relative">
            <button onClick={() => setThemeOpen((o) => !o)} className="p-2 rounded-full text-muted-foreground/60 hover:bg-muted/60 hover:text-foreground/80 transition-all">
              {theme === 'light' && <Sun className="size-4" />}
              {theme === 'dark' && <Moon className="size-4" />}
              {theme === 'system' && <Monitor className="size-4" />}
            </button>
            {themeOpen && (
              <div className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 border border-border rounded-xl shadow-xl overflow-hidden z-[100] min-w-[150px]">
                {(['light','dark','system'] as const).map((opt) => (
                  <button key={opt} onClick={() => { setTheme(opt); setThemeOpen(false); }}
                    className={cn('w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 hover:bg-muted/60 transition-colors',
                      theme === opt && 'text-orange-500 font-medium bg-orange-50 dark:bg-orange-900/20')}>
                    {opt === 'light' && <Sun className="size-4" />}
                    {opt === 'dark' && <Moon className="size-4" />}
                    {opt === 'system' && <Monitor className="size-4" />}
                    <span className="capitalize">{opt}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => setSettingsOpen(true)} className="p-2 rounded-full text-muted-foreground/60 hover:bg-muted/60 hover:text-foreground/80 transition-all group">
            <Settings className="size-4 group-hover:rotate-90 transition-transform duration-500" />
          </button>
        </div>
      </header>

      <SettingsDialog open={settingsOpen} onOpenChange={(o) => { setSettingsOpen(o); if (!o) setSettingsSection(undefined); }} initialSection={settingsSection} />

      {/* ═══ Main scrollable area ═══ */}
      <main className="pt-14 min-h-screen">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-6">

          {/* Background decor */}
          <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-orange-500/6 rounded-full blur-3xl" />
          </div>

          {/* ── Breadcrumb row ── */}
          <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
            <nav className="flex items-center gap-1 text-sm overflow-x-auto">
              <button onClick={() => setCurrentFolderId(null)}
                className={cn('flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 whitespace-nowrap transition-colors shrink-0',
                  !currentFolderId ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50')}>
                <Home className="size-3.5" /> My Classrooms
              </button>
              {breadcrumbPath.map((folder, i) => (
                <span key={folder.id} className="flex items-center gap-1 shrink-0">
                  <ChevronRight className="size-3 text-muted-foreground/40" />
                  <button onClick={() => setCurrentFolderId(folder.id)}
                    className={cn('flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors',
                      i === breadcrumbPath.length - 1
                        ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50')}>
                    <span style={{ color: folder.color }}>📁</span> {folder.name}
                  </button>
                </span>
              ))}
            </nav>

            {/* New folder control */}
            {newFolderOpen ? (
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-border rounded-xl px-3 py-1.5 shadow-sm shrink-0">
                <input ref={newFolderInputRef} autoFocus value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') createFolder(); if (e.key === 'Escape') setNewFolderOpen(false); }}
                  placeholder="Folder name…"
                  className="text-sm bg-transparent outline-none w-36 placeholder:text-muted-foreground/40" />
                <button onClick={createFolder} className="text-orange-500 hover:text-orange-600 transition-colors"><Check className="size-4" /></button>
                <button onClick={() => setNewFolderOpen(false)} className="text-muted-foreground/50 hover:text-foreground transition-colors"><X className="size-4" /></button>
              </div>
            ) : (
              <button onClick={() => { setNewFolderOpen(true); setTimeout(() => newFolderInputRef.current?.focus(), 50); }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground/60 hover:text-foreground/80 hover:bg-muted/50 rounded-xl px-3 py-1.5 border border-dashed border-border/60 hover:border-border transition-all shrink-0">
                <FolderPlus className="size-4" /> New Folder
              </button>
            )}
          </div>

          {/* ── Content grid ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">

            {/* + New Classroom card */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <button onClick={() => router.push('/new-classroom')}
                className="group w-full aspect-[16/9] rounded-2xl border-2 border-dashed border-orange-300/60 dark:border-orange-700/40 bg-orange-50/50 dark:bg-orange-900/10 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-400 transition-all flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="size-5 text-orange-500" />
                </div>
                <span className="text-xs font-semibold text-orange-500/80 group-hover:text-orange-600 transition-colors">New Classroom</span>
              </button>
              <div className="mt-2.5 px-1 h-5" />
            </motion.div>

            {/* Folder cards */}
            {visibleFolders.map((folder, i) => (
              <motion.div key={folder.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (i + 1) * 0.04 }}>
                <FolderCard
                  folder={folder}
                  classroomCount={classrooms.filter((c) => folderMap[c.id] === folder.id).length}
                  isDragOver={dragOverFolderId === folder.id}
                  isMenuOpen={folderMenuId === folder.id}
                  isDeletingConfirm={deletingFolderId === folder.id}
                  onOpen={() => setCurrentFolderId(folder.id)}
                  onMenuToggle={() => setFolderMenuId(folderMenuId === folder.id ? null : folder.id)}
                  onRenameOpen={() => {
                    setRenameTarget({ type: 'folder', id: folder.id, currentName: folder.name });
                    setFolderMenuId(null);
                  }}
                  onExport={() => {
                    exportFolderZip(folder.name, classrooms.filter((c) => folderMap[c.id] === folder.id));
                    setFolderMenuId(null);
                  }}
                  onDeleteRequest={() => { setDeletingFolderId(folder.id); setFolderMenuId(null); }}
                  onDeleteConfirm={() => deleteFolder(folder.id)}
                  onDeleteCancel={() => setDeletingFolderId(null)}
                  onDragOver={(e) => onFolderDragOver(e, folder.id)}
                  onDragLeave={() => setDragOverFolderId(null)}
                  onDrop={(e) => onFolderDrop(e, folder.id)}
                />
              </motion.div>
            ))}

            {/* Classroom cards */}
            {filteredClassrooms.map((classroom, i) => (
              <motion.div key={classroom.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (i + visibleFolders.length + 1) * 0.04 }}>
                <ClassroomCard
                  classroom={classroom}
                  slide={thumbnails[classroom.id]}
                  formatDate={formatDate}
                  confirmingDelete={pendingDeleteId === classroom.id}
                  onDelete={(e) => { e.stopPropagation(); setPendingDeleteId(classroom.id); }}
                  onConfirmDelete={() => confirmDelete(classroom.id)}
                  onCancelDelete={() => setPendingDeleteId(null)}
                  onClick={() => router.push(`/classroom/${classroom.id}`)}
                  onRenameOpen={() => setRenameTarget({ type: 'classroom', id: classroom.id, currentName: classroom.name })}
                  folders={folders}
                  currentFolderId={folderMap[classroom.id] ?? null}
                  isMoveMenuOpen={moveMenuId === classroom.id}
                  onMoveMenuToggle={() => setMoveMenuId(moveMenuId === classroom.id ? null : classroom.id)}
                  onMoveToFolder={(fid) => moveClassroom(classroom.id, fid)}
                  onDragStart={() => onDragStart(classroom.id)}
                  onDragEnd={onDragEnd}
                />
              </motion.div>
            ))}
          </div>

          {/* Empty states */}
          {classrooms.length === 0 && visibleFolders.length === 0 && !searchQuery && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="mt-16 text-center text-muted-foreground/50">
              <div className="text-4xl mb-3">📚</div>
              <p className="text-sm font-medium">No classrooms yet</p>
              <p className="text-xs mt-1">Click <span className="text-orange-500 font-semibold">New Classroom</span> to create your first one</p>
            </motion.div>
          )}
          {searchQuery && filteredClassrooms.length === 0 && (
            <div className="mt-12 text-center text-muted-foreground/50 text-sm">
              No classrooms match &ldquo;{searchQuery}&rdquo;
            </div>
          )}

          <div className="mt-16 pb-4 text-center text-xs text-muted-foreground/25">
            AI-Guru · Your personal AI tutor
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Folder Card ─────────────────────────────────────────────────
function FolderCard({
  folder, classroomCount, isDragOver, isMenuOpen, isDeletingConfirm,
  onOpen, onMenuToggle, onRenameOpen, onExport, onDeleteRequest, onDeleteConfirm, onDeleteCancel,
  onDragOver, onDragLeave, onDrop,
}: {
  folder: FolderItem; classroomCount: number; isDragOver: boolean; isMenuOpen: boolean; isDeletingConfirm: boolean;
  onOpen: () => void; onMenuToggle: () => void; onRenameOpen: () => void; onExport: () => void;
  onDeleteRequest: () => void; onDeleteConfirm: () => void; onDeleteCancel: () => void;
  onDragOver: (e: React.DragEvent) => void; onDragLeave: () => void; onDrop: (e: React.DragEvent) => void;
}) {
  return (
    <div>
      <div
        className={cn(
          'group relative w-full aspect-[16/9] rounded-2xl overflow-hidden cursor-pointer transition-all duration-200',
          'hover:scale-[1.02] hover:shadow-lg',
          isDragOver && 'ring-2 ring-orange-400 scale-[1.02] shadow-lg shadow-orange-500/20',
        )}
        style={{ background: `linear-gradient(135deg, ${folder.color}18, ${folder.color}38)`, border: `1.5px solid ${folder.color}30` }}
        onClick={isDeletingConfirm ? undefined : onOpen}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {/* Folder content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 select-none">
          <FolderOpen className="size-12 opacity-60 transition-transform group-hover:scale-110" style={{ color: folder.color }} />
          <span className="text-xs font-semibold opacity-60" style={{ color: folder.color }}>
            {classroomCount} {classroomCount === 1 ? 'classroom' : 'classrooms'}
          </span>
        </div>

        {/* Drag-over indicator */}
        {isDragOver && (
          <div className="absolute inset-0 bg-orange-400/10 flex items-center justify-center">
            <span className="text-xs font-bold text-orange-500 bg-white/80 dark:bg-gray-900/80 px-3 py-1 rounded-full">
              Drop to move here
            </span>
          </div>
        )}

        {/* ⋯ menu button */}
        {!isDeletingConfirm && (
          <div className="absolute top-2 right-2 z-[91]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => { e.stopPropagation(); onMenuToggle(); }}
              className="size-7 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
            >
              <MoreHorizontal className="size-3.5" />
            </button>
            {isMenuOpen && (
              <div
                className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 border border-border rounded-xl shadow-2xl z-[95] overflow-hidden min-w-[160px] py-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button onClick={onRenameOpen} className="w-full px-3 py-2 text-left text-sm flex items-center gap-2.5 hover:bg-muted/60 transition-colors">
                  <Pencil className="size-3.5 text-muted-foreground" /> Rename
                </button>
                <button onClick={onExport} className="w-full px-3 py-2 text-left text-sm flex items-center gap-2.5 hover:bg-muted/60 transition-colors">
                  <Download className="size-3.5 text-muted-foreground" /> Export folder
                </button>
                <div className="my-1 h-px bg-border/50" />
                <button onClick={onDeleteRequest} className="w-full px-3 py-2 text-left text-sm flex items-center gap-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors">
                  <Trash2 className="size-3.5" /> Delete folder
                </button>
              </div>
            )}
          </div>
        )}

        {/* Delete confirm overlay */}
        <AnimatePresence>
          {isDeletingConfirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/55 backdrop-blur-[4px]"
              onClick={(e) => e.stopPropagation()}>
              <span className="text-[13px] font-semibold text-white">Delete folder?</span>
              <p className="text-[11px] text-white/60 px-4 text-center leading-relaxed">Classrooms inside will move to root</p>
              <div className="flex gap-2 mt-1">
                <button onClick={onDeleteCancel} className="px-3.5 py-1 rounded-lg text-xs font-medium bg-white/15 text-white hover:bg-white/25 transition-colors">Cancel</button>
                <button onClick={onDeleteConfirm} className="px-3.5 py-1 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors">Delete</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Folder label */}
      <div className="mt-2.5 px-1">
        <p className="font-semibold text-[14px] truncate text-foreground/90" title={folder.name}>{folder.name}</p>
      </div>
    </div>
  );
}

// ─── Classroom Card ───────────────────────────────────────────────
function ClassroomCard({
  classroom, slide, formatDate, confirmingDelete, onDelete, onConfirmDelete, onCancelDelete,
  onClick, onRenameOpen, folders, currentFolderId, isMoveMenuOpen, onMoveMenuToggle, onMoveToFolder,
  onDragStart, onDragEnd,
}: {
  classroom: StageListItem; slide?: Slide; formatDate: (ts: number) => string;
  confirmingDelete: boolean;
  onDelete: (e: React.MouseEvent) => void; onConfirmDelete: () => void; onCancelDelete: () => void;
  onClick: () => void; onRenameOpen: () => void;
  folders: FolderItem[]; currentFolderId: string | null;
  isMoveMenuOpen: boolean; onMoveMenuToggle: () => void; onMoveToFolder: (fid: string | null) => void;
  onDragStart: () => void; onDragEnd: () => void;
}) {
  const { t } = useI18n();
  const thumbRef = useRef<HTMLDivElement>(null);
  const [thumbWidth, setThumbWidth] = useState(0);

  useEffect(() => {
    const el = thumbRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setThumbWidth(Math.round(e.contentRect.width)));
    ro.observe(el); return () => ro.disconnect();
  }, []);

  return (
    <div>
      <div
        ref={thumbRef}
        draggable
        onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart(); }}
        onDragEnd={onDragEnd}
        className={cn(
          'group relative w-full aspect-[16/9] rounded-2xl bg-slate-100 dark:bg-slate-800/80 overflow-hidden cursor-pointer',
          'transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg',
        )}
        onClick={confirmingDelete ? undefined : onClick}
      >
        {/* Thumbnail */}
        {slide && thumbWidth > 0 ? (
          <ThumbnailSlide slide={slide} size={thumbWidth} viewportSize={slide.viewportSize ?? 1000} viewportRatio={slide.viewportRatio ?? 0.5625} />
        ) : !slide ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-12 rounded-2xl bg-gradient-to-br from-orange-100 to-blue-100 dark:from-orange-900/30 dark:to-blue-900/30 flex items-center justify-center">
              <span className="text-xl opacity-50">📄</span>
            </div>
          </div>
        ) : null}

        {classroom.interactiveMode && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span onClick={(e) => e.stopPropagation()}
                className="absolute bottom-2 left-2 inline-flex items-center justify-center size-5 rounded-full bg-white/70 dark:bg-slate-900/60 text-cyan-600 backdrop-blur-sm shadow-sm ring-1 ring-cyan-500/30 z-10">
                <Atom className="size-3" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={-4} className="text-xs">{t('toolbar.interactiveModeLabel')}</TooltipContent>
          </Tooltip>
        )}

        {/* Hover action buttons */}
        <AnimatePresence>
          {!confirmingDelete && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Delete */}
              <Button size="icon" variant="ghost"
                className="absolute top-2 right-2 size-7 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 hover:bg-destructive/80 text-white backdrop-blur-sm rounded-full z-10"
                onClick={onDelete}>
                <Trash2 className="size-3.5" />
              </Button>
              {/* Rename */}
              <Button size="icon" variant="ghost"
                className="absolute top-2 right-11 size-7 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm rounded-full z-10"
                onClick={(e) => { e.stopPropagation(); onRenameOpen(); }}>
                <Pencil className="size-3.5" />
              </Button>
              {/* Move to folder */}
              <div className="absolute top-2 right-20 z-[91]" onClick={(e) => e.stopPropagation()}>
                <Button size="icon" variant="ghost"
                  className="size-7 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm rounded-full"
                  onClick={(e) => { e.stopPropagation(); onMoveMenuToggle(); }}>
                  <FolderOpen className="size-3.5" />
                </Button>
                {isMoveMenuOpen && (
                  <div
                    className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 border border-border rounded-xl shadow-2xl z-[95] overflow-hidden min-w-[180px] py-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-3 pt-2 pb-1.5 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Move to</div>
                    <button onClick={() => onMoveToFolder(null)}
                      className={cn('w-full px-3 py-2 text-left text-sm flex items-center gap-2.5 hover:bg-muted/60 transition-colors',
                        !currentFolderId && 'text-orange-500 font-medium')}>
                      <Home className="size-3.5 shrink-0" />
                      <span className="truncate">Root (My Classrooms)</span>
                    </button>
                    {folders.length > 0 && <div className="my-1 h-px bg-border/40" />}
                    <div className="max-h-48 overflow-y-auto">
                      {folders.map((f) => (
                        <button key={f.id} onClick={() => onMoveToFolder(f.id)}
                          className={cn('w-full px-3 py-2 text-left text-sm flex items-center gap-2.5 hover:bg-muted/60 transition-colors',
                            currentFolderId === f.id && 'text-orange-500 font-medium')}>
                          <span style={{ color: f.color }} className="shrink-0">📁</span>
                          <span className="truncate">{f.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete confirm overlay */}
        <AnimatePresence>
          {confirmingDelete && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/55 backdrop-blur-[4px]"
              onClick={(e) => e.stopPropagation()}>
              <span className="text-[13px] font-semibold text-white">{t('classroom.deleteConfirmTitle')}?</span>
              <div className="flex gap-2">
                <button onClick={onCancelDelete} className="px-3.5 py-1 rounded-lg text-xs font-medium bg-white/15 text-white hover:bg-white/25 transition-colors">{t('common.cancel')}</button>
                <button onClick={onConfirmDelete} className="px-3.5 py-1 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors">{t('classroom.delete')}</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info row */}
      <div className="mt-2.5 px-1 flex items-start gap-1.5">
        <span className="shrink-0 inline-flex items-center rounded-full bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 text-[11px] font-medium text-orange-600 dark:text-orange-400 whitespace-nowrap">
          {classroom.sceneCount} {t('classroom.slides')} · {formatDate(classroom.updatedAt)}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="font-medium text-[14px] truncate text-foreground/90 min-w-0 cursor-pointer leading-tight pt-0.5"
              onClick={(e) => { e.stopPropagation(); onRenameOpen(); }}>
              {classroom.name}
            </p>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={4} className="!max-w-[min(90vw,32rem)] break-words whitespace-normal">
            <div className="flex items-center gap-1.5">
              <span className="break-all">{classroom.name}</span>
              <button className="shrink-0 p-0.5 rounded hover:bg-foreground/10 transition-colors"
                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(classroom.name); toast.success(t('classroom.nameCopied')); }}>
                <Copy className="size-3 opacity-60" />
              </button>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

// ─── Greeting Bar (used in new-classroom page) ────────────────────
export { GreetingBar };

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
function isCustomAvatar(src: string) { return src.startsWith('data:'); }

function GreetingBar() {
  const { t } = useI18n();
  const avatar = useUserProfileStore((s) => s.avatar);
  const nickname = useUserProfileStore((s) => s.nickname);
  const bio = useUserProfileStore((s) => s.bio);
  const setAvatar = useUserProfileStore((s) => s.setAvatar);
  const setNickname = useUserProfileStore((s) => s.setNickname);
  const setBio = useUserProfileStore((s) => s.setBio);
  const [open, setOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const displayName = nickname || t('profile.defaultNickname');

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) { setOpen(false); setEditingName(false); setAvatarPickerOpen(false); }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const commitName = () => { setNickname(nameDraft.trim()); setEditingName(false); };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_AVATAR_SIZE) { toast.error(t('profile.fileTooLarge')); return; }
    if (!file.type.startsWith('image/')) { toast.error(t('profile.invalidFileType')); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext('2d')!;
        const scale = Math.max(128 / img.width, 128 / img.height);
        const w = img.width * scale, h = img.height * scale;
        ctx.drawImage(img, (128 - w) / 2, (128 - h) / 2, w, h);
        setAvatar(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div ref={containerRef} className="relative pl-4 pr-2 pt-3.5 pb-1 w-auto">
      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
      {!open && (
        <div onClick={() => setOpen(true)}
          className="flex items-center gap-2.5 cursor-pointer group rounded-full px-2.5 py-1.5 border border-border/50 text-muted-foreground/70 hover:text-foreground hover:bg-muted/60 active:scale-[0.97] transition-all">
          <div className="shrink-0 relative">
            <div className="size-8 rounded-full overflow-hidden ring-[1.5px] ring-border/30 group-hover:ring-orange-400/60 transition-all">
              <img src={avatar} alt="" className="size-full object-cover" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full bg-white dark:bg-slate-800 border border-border/40 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity">
              <Pencil className="size-[7px] text-muted-foreground/70" />
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-[13px] font-semibold text-foreground/85 group-hover:text-foreground transition-colors select-none flex items-center gap-1">
                {t('home.greetingWithName', { name: displayName })}
                <ChevronDown className="size-3 text-muted-foreground/30 shrink-0" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4}>{t('profile.editTooltip')}</TooltipContent>
          </Tooltip>
        </div>
      )}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }}
            className="absolute left-4 top-3.5 z-50 w-64">
            <div className="rounded-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06] shadow-lg px-2.5 py-2">
              <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => { setOpen(false); setEditingName(false); setAvatarPickerOpen(false); }}>
                <div className="shrink-0 relative cursor-pointer" onClick={(e) => { e.stopPropagation(); setAvatarPickerOpen(!avatarPickerOpen); }}>
                  <div className="size-8 rounded-full overflow-hidden ring-[1.5px] ring-orange-300/70">
                    <img src={avatar} alt="" className="size-full object-cover" />
                  </div>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full bg-white dark:bg-slate-800 border border-border/60 flex items-center justify-center">
                    <ChevronDown className={cn('size-2 text-muted-foreground/70 transition-transform', avatarPickerOpen && 'rotate-180')} />
                  </motion.div>
                </div>
                <div className="flex-1 min-w-0">
                  {editingName ? (
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <input ref={nameInputRef} value={nameDraft} onChange={(e) => setNameDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') setEditingName(false); }}
                        onBlur={commitName} maxLength={20}
                        className="flex-1 min-w-0 h-6 bg-transparent border-b border-border/80 text-[13px] font-semibold outline-none" />
                      <button onClick={commitName} className="size-5 rounded flex items-center justify-center text-orange-500"><Check className="size-3" /></button>
                    </div>
                  ) : (
                    <span onClick={(e) => { e.stopPropagation(); setNameDraft(nickname); setEditingName(true); setTimeout(() => nameInputRef.current?.focus(), 50); }}
                      className="group/name inline-flex items-center gap-1 cursor-pointer">
                      <span className="text-[13px] font-semibold text-foreground/85">{displayName}</span>
                      <Pencil className="size-2.5 text-muted-foreground/30 opacity-0 group-hover/name:opacity-100 transition-opacity" />
                    </span>
                  )}
                </div>
                <div className="shrink-0 size-6 rounded-full flex items-center justify-center hover:bg-black/[0.04] transition-colors">
                  <ChevronUp className="size-3.5 text-muted-foreground/50" />
                </div>
              </div>
              <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                <AnimatePresence>
                  {avatarPickerOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="p-1 pb-2.5 flex items-center gap-1.5 flex-wrap">
                        {AVATAR_OPTIONS.map((url) => (
                          <button key={url} onClick={() => setAvatar(url)}
                            className={cn('size-7 rounded-full overflow-hidden bg-gray-50 dark:bg-gray-800 cursor-pointer transition-all hover:scale-110 active:scale-95',
                              avatar === url ? 'ring-2 ring-orange-400' : 'hover:ring-1 hover:ring-muted-foreground/30')}>
                            <img src={url} alt="" className="size-full" />
                          </button>
                        ))}
                        <label className={cn('size-7 rounded-full flex items-center justify-center cursor-pointer transition-all border border-dashed hover:scale-110 active:scale-95',
                          isCustomAvatar(avatar) ? 'ring-2 ring-orange-400 border-orange-300 bg-orange-50' : 'border-muted-foreground/30 text-muted-foreground/50')}
                          onClick={() => avatarInputRef.current?.click()}>
                          <ImagePlus className="size-3" />
                        </label>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <UITextarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder={t('profile.bioPlaceholder')} maxLength={200} rows={2}
                  className="resize-none border-border/40 bg-transparent min-h-[72px] !text-[13px] !leading-relaxed placeholder:!text-[11px] focus-visible:ring-1 focus-visible:ring-border/60" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Page() { return <HomePage />; }
