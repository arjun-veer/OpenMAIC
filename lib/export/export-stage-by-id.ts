import { db, getGeneratedAgentsByStageId } from '@/lib/utils/database';
import {
  CLASSROOM_ZIP_FORMAT_VERSION,
  CLASSROOM_ZIP_EXTENSION,
  type ClassroomManifest,
  type ManifestStage,
  type ManifestAgent,
  type ManifestScene,
  type MediaIndexEntry,
} from './classroom-zip-types';
import { collectAudioFiles, collectMediaFiles, actionsToManifest } from './classroom-zip-utils';
import type { SpeechAction } from '@/lib/types/action';

/** Returns a ZIP Blob for any stage by ID. Used for folder-level exports. */
export async function exportStageToBlob(stageId: string): Promise<{ blob: Blob; name: string } | null> {
  const JSZip = (await import('jszip')).default;

  const stage = await db.stages.get(stageId);
  if (!stage) return null;

  const scenesRaw = await db.scenes.where('stageId').equals(stageId).sortBy('order');
  if (scenesRaw.length === 0) return null;

  // Map db scene records to the shape expected by collect helpers
  const scenes = scenesRaw.map((s) => ({
    ...s,
    actions: s.actions ?? (s as any).whiteboard ?? undefined,
    whiteboards: (s as any).whiteboard ?? undefined,
  }));

  const agentRecords = await getGeneratedAgentsByStageId(stageId);
  const audioFiles = await collectAudioFiles(scenes as any);
  const mediaFiles = await collectMediaFiles(stageId);

  const audioIdToPath = new Map<string, string>();
  for (const af of audioFiles) audioIdToPath.set(af.record.id, af.zipPath);

  const manifestStage: ManifestStage = {
    name: stage.name,
    description: stage.description,
    language: stage.languageDirective,
    style: stage.style,
    createdAt: stage.createdAt,
    updatedAt: stage.updatedAt,
  };

  const manifestAgents: ManifestAgent[] = agentRecords.map((a) => ({
    name: a.name,
    role: a.role,
    persona: a.persona,
    avatar: a.avatar,
    color: a.color,
    priority: a.priority,
  }));

  const agentIdToIndex = new Map<string, number>();
  agentRecords.forEach((a, i) => agentIdToIndex.set(a.id, i));

  const manifestScenes: ManifestScene[] = scenes.map((scene) => ({
    type: scene.type,
    title: scene.title,
    order: scene.order,
    content: scene.content,
    actions: scene.actions ? actionsToManifest(scene.actions as any, audioIdToPath) : undefined,
    whiteboards: scene.whiteboards,
    ...((scene as any).multiAgent?.enabled
      ? {
          multiAgent: {
            enabled: true,
            agentIndices: ((scene as any).multiAgent.agentIds ?? [])
              .map((id: string) => agentIdToIndex.get(id))
              .filter((i: number | undefined): i is number => i !== undefined),
            directorPrompt: (scene as any).multiAgent.directorPrompt,
          },
        }
      : {}),
  }));

  const mediaIndex: Record<string, MediaIndexEntry> = {};
  for (const af of audioFiles) {
    mediaIndex[af.zipPath] = { type: 'audio', format: af.record.format, duration: af.record.duration, voice: af.record.voice };
  }
  for (const mf of mediaFiles) {
    mediaIndex[mf.zipPath] = { type: 'generated', mimeType: mf.record.mimeType, size: mf.record.size, prompt: mf.record.prompt };
  }
  for (const scene of scenes) {
    for (const action of (scene.actions as any[]) ?? []) {
      if (action.type === 'speech') {
        const audioId = (action as SpeechAction).audioId;
        if (audioId && !audioIdToPath.has(audioId)) {
          mediaIndex[`audio/${audioId}.mp3`] = { type: 'audio', missing: true };
        }
      }
    }
  }

  const manifest: ClassroomManifest = {
    formatVersion: CLASSROOM_ZIP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: process.env.npm_package_version || '0.0.0',
    stage: manifestStage,
    agents: manifestAgents,
    scenes: manifestScenes,
    mediaIndex,
  };

  const zip = new JSZip();
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  for (const af of audioFiles) zip.file(af.zipPath, af.record.blob);
  for (const mf of mediaFiles) {
    zip.file(mf.zipPath, mf.record.blob);
    if (mf.record.poster) zip.file(mf.zipPath.replace(/\.\w+$/, '.poster.jpg'), mf.record.poster);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const safeName = stage.name.replace(/[\\/:*?"<>|]/g, '_') || 'classroom';
  return { blob, name: `${safeName}${CLASSROOM_ZIP_EXTENSION}` };
}
