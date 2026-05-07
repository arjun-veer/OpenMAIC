'use client';

import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { nanoid as makeId } from 'nanoid';

const FOLDERS_KEY = 'aiguru_folders';
const FOLDER_MAP_KEY = 'aiguru_classroom_folders';
const FOLDER_COLORS = ['#f97316','#3b82f6','#8b5cf6','#10b981','#ec4899','#f59e0b','#06b6d4','#6366f1'];

/**
 * Handles importing a folder ZIP (containing multiple classroom ZIPs + folder.json)
 * or multiple individual classroom ZIPs at once.
 * Each inner classroom ZIP is imported by re-using the single-classroom import logic.
 */
export function useImportFolder(onSuccess?: (count: number) => void) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFolderSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFolderFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = '';

      const toastId = toast.loading('Reading folder ZIP…');

      try {
        const JSZip = (await import('jszip')).default;
        const outerZip = await JSZip.loadAsync(file);

        // Check if this is a folder ZIP (has folder.json)
        const folderManifestFile = outerZip.file('folder.json');
        if (!folderManifestFile) {
          toast.error('Not a valid folder ZIP (missing folder.json)', { id: toastId });
          return;
        }

        const folderManifest = JSON.parse(await folderManifestFile.async('text'));
        const innerZipNames = Object.keys(outerZip.files).filter(
          (name) => (name.endsWith('.maic.zip') || name.endsWith('.aicls')) && !name.includes('/'),
        );

        if (innerZipNames.length === 0) {
          toast.error('No classrooms found inside folder ZIP', { id: toastId });
          return;
        }

        toast.loading(`Importing ${innerZipNames.length} classroom(s)…`, { id: toastId });

        let imported = 0;
        const importedIds: string[] = [];
        for (const name of innerZipNames) {
          const innerBlob = await outerZip.files[name].async('blob');
          const innerFile = new File([innerBlob], name, { type: 'application/zip' });

          // Process each inner ZIP using existing import logic
          try {
            const { db, mediaFileKey } = await import('@/lib/utils/database');
            const { nanoid } = await import('nanoid');
            const { rewriteAudioRefsToIds } = await import('@/lib/export/classroom-zip-utils');

            const innerZip = await JSZip.loadAsync(innerFile);
            const manifestFile = innerZip.file('manifest.json');
            if (!manifestFile) continue;

            const manifest = JSON.parse(await manifestFile.async('text'));
            if (!manifest.stage || !manifest.scenes) continue;

            const newStageId = nanoid();
            const now = Date.now();
            const newAgentIds: string[] = (manifest.agents ?? []).map(() => nanoid());

            const audioRefToNewId: Record<string, string> = {};
            const mediaRefToNewId: Record<string, string> = {};
            for (const [zipPath, entry] of Object.entries<any>(manifest.mediaIndex ?? {})) {
              if (entry.type === 'audio' && !entry.missing) audioRefToNewId[zipPath] = nanoid();
              if ((entry.type === 'generated' || entry.type === 'image') && !entry.missing) {
                const filename = zipPath.split('/').pop() ?? '';
                mediaRefToNewId[zipPath] = mediaFileKey(newStageId, filename.replace(/\.\w+$/, ''));
              }
            }

            for (const [zipPath, newId] of Object.entries(audioRefToNewId)) {
              const entry = innerZip.file(zipPath);
              if (!entry) continue;
              const blob = await entry.async('blob');
              const meta: any = manifest.mediaIndex[zipPath];
              await db.audioFiles.put({ id: newId, blob, format: meta.format || 'mp3', duration: meta.duration, voice: meta.voice, createdAt: now });
            }
            for (const [zipPath, newId] of Object.entries(mediaRefToNewId)) {
              const entry = innerZip.file(zipPath);
              if (!entry) continue;
              const blob = await entry.async('blob');
              const meta: any = manifest.mediaIndex[zipPath];
              const posterEntry = innerZip.file(zipPath.replace(/\.\w+$/, '.poster.jpg'));
              await db.mediaFiles.put({
                id: newId, stageId: newStageId,
                type: meta.mimeType?.startsWith('video/') ? 'video' : 'image',
                blob, mimeType: meta.mimeType || 'image/jpeg',
                size: meta.size || blob.size, prompt: meta.prompt || '', params: '', createdAt: now,
                ...(posterEntry ? { poster: await posterEntry.async('blob') } : {}),
              });
            }

            await db.stages.put({
              id: newStageId, name: manifest.stage.name || 'Imported Classroom',
              description: manifest.stage.description, languageDirective: manifest.stage.language,
              style: manifest.stage.style, createdAt: manifest.stage.createdAt || now, updatedAt: now,
              agentIds: newAgentIds.length > 0 ? newAgentIds : undefined,
            });

            if (manifest.agents?.length) {
              await db.generatedAgents.bulkPut(manifest.agents.map((a: any, i: number) => ({
                id: newAgentIds[i], stageId: newStageId, name: a.name, role: a.role,
                persona: a.persona, avatar: a.avatar, color: a.color, priority: a.priority, createdAt: now,
              })));
            }

            await db.scenes.bulkPut(manifest.scenes.map((s: any, index: number) => ({
              id: nanoid(), stageId: newStageId, type: s.type, title: s.title,
              order: s.order ?? index, content: s.content,
              actions: s.actions ? rewriteAudioRefsToIds(s.actions, audioRefToNewId) : undefined,
              whiteboard: s.whiteboards,
              ...(s.multiAgent?.enabled ? { multiAgent: { enabled: true, agentIds: (s.multiAgent.agentIndices ?? []).map((idx: number) => newAgentIds[idx]).filter(Boolean), directorPrompt: s.multiAgent.directorPrompt } } : {}),
              createdAt: now, updatedAt: now,
            })));

            importedIds.push(newStageId);
            imported++;
          } catch (err) {
            console.error('Failed to import inner classroom zip:', name, err);
          }
        }

        const folderName: string = folderManifest.folderName || 'Imported Folder';

        // Create the folder in localStorage and map all imported classrooms into it
        if (imported > 0) {
          const existingFolders: any[] = JSON.parse(localStorage.getItem(FOLDERS_KEY) ?? '[]');
          const newFolderId = makeId();
          existingFolders.push({
            id: newFolderId,
            name: folderName,
            color: FOLDER_COLORS[existingFolders.length % FOLDER_COLORS.length],
            createdAt: Date.now(),
            parentId: null,
          });
          localStorage.setItem(FOLDERS_KEY, JSON.stringify(existingFolders));

          const folderMap: Record<string, string> = JSON.parse(localStorage.getItem(FOLDER_MAP_KEY) ?? '{}');
          for (const stageId of importedIds) folderMap[stageId] = newFolderId;
          localStorage.setItem(FOLDER_MAP_KEY, JSON.stringify(folderMap));
        }

        toast.success(`Imported ${imported} classroom(s) from "${folderName}"`, { id: toastId });
        onSuccess?.(imported);
      } catch {
        toast.error('Folder import failed — invalid folder ZIP', { id: toastId });
      }
    },
    [onSuccess],
  );

  return { fileInputRef, triggerFolderSelect, handleFolderFileChange };
}
