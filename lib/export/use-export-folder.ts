'use client';

import { useState, useCallback } from 'react';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { exportStageToBlob } from './export-stage-by-id';
import type { StageListItem } from '@/lib/utils/stage-storage';

export function useExportFolder() {
  const [exporting, setExporting] = useState(false);

  const exportFolderZip = useCallback(async (folderName: string, classrooms: StageListItem[]) => {
    if (classrooms.length === 0) {
      toast.error('No classrooms in this folder to export');
      return;
    }

    setExporting(true);
    const toastId = toast.loading(`Exporting folder "${folderName}"…`);

    try {
      const JSZip = (await import('jszip')).default;
      const folderZip = new JSZip();

      // Add a folder manifest
      folderZip.file('folder.json', JSON.stringify({
        folderName,
        exportedAt: new Date().toISOString(),
        classrooms: classrooms.map((c) => ({ id: c.id, name: c.name })),
      }, null, 2));

      // Export each classroom as an inner ZIP
      let exported = 0;
      for (const classroom of classrooms) {
        const result = await exportStageToBlob(classroom.id);
        if (result) {
          folderZip.file(result.name, result.blob);
          exported++;
        }
      }

      if (exported === 0) {
        toast.error('No classroom data found to export', { id: toastId });
        return;
      }

      const blob = await folderZip.generateAsync({ type: 'blob' });
      const safeName = folderName.replace(/[\\/:*?"<>|]/g, '_') || 'folder';
      saveAs(blob, `${safeName}_folder.zip`);

      toast.success(`Exported ${exported} classroom${exported !== 1 ? 's' : ''} from "${folderName}"`, { id: toastId });
    } catch (err) {
      toast.error('Folder export failed', { id: toastId });
    } finally {
      setExporting(false);
    }
  }, []);

  return { exporting, exportFolderZip };
}
