import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import type { AppState } from '@shared';

const EXPORT_VERSION = '1.0';

function buildFilename(): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `efi-export-${yyyy}-${mm}-${dd}.json`;
}

export function generateExportData(state: AppState): string {
  const payload = {
    exportedAt: new Date().toISOString(),
    version: EXPORT_VERSION,
    data: {
      tasks: state.tasks,
      partners: state.partners,
      goals: state.profile.goals,
      templates: state.templates,
    },
  };
  return JSON.stringify(payload, null, 2);
}

export async function exportUserData(state: AppState): Promise<void> {
  const jsonString = generateExportData(state);
  const filename = buildFilename();

  if (Capacitor.isNativePlatform()) {
    await Filesystem.writeFile({
      path: filename,
      data: jsonString,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });

    const { uri } = await Filesystem.getUri({
      path: filename,
      directory: Directory.Cache,
    });

    await Share.share({
      title: 'Exportar datos de Efi',
      url: uri,
    });
  } else {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }
}
