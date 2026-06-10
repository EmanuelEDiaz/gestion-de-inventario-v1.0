import {
  opfsFileExists,
  readOPFSFile,
} from '@/infrastructure/maps/opfs-utils';

const MIME_EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
};

function resolveOPFSPath(path: string): { dirs: string[]; name: string } {
  const segments = path.split('/').filter(Boolean);
  const name = segments.pop();
  if (!name) throw new Error(`Ruta OPFS inválida: ${path}`);
  return { dirs: segments, name };
}

export function extFromContentType(contentType: string): string {
  return MIME_EXT_MAP[contentType] || 'bin';
}

export async function computeChecksum(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function deleteOPFSImage(opfsPath: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.getDirectory) {
    return false;
  }
  try {
    const root = await navigator.storage.getDirectory();
    const { dirs, name } = resolveOPFSPath(opfsPath);
    let dir: FileSystemDirectoryHandle = root;
    for (const seg of dirs) {
      if (!seg) continue;
      dir = await dir.getDirectoryHandle(seg, { create: false });
    }
    await dir.removeEntry(name);
    return true;
  } catch {
    return false;
  }
}

export async function getOPFSImageSize(opfsPath: string): Promise<number> {
  const buffer = await readOPFSFile(opfsPath);
  return buffer?.byteLength ?? 0;
}

export async function imageExistsInOPFS(opfsPath: string): Promise<boolean> {
  return opfsFileExists(opfsPath);
}
