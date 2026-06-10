import { getDB, setSyncMeta, getSyncMeta } from '@/infrastructure/storage/db';

const MAP_META_KEY = 'map-pmtiles';

export interface MapMetadata {
  key: typeof MAP_META_KEY;
  filename: string;
  version: string;
  serverChecksum: string;
  clientChecksum: string;
  sizeBytes: number;
  installedAt: number;
  serverNewer?: boolean;
  latestKnownVersion?: string;
}

async function navigateToDir(
  root: FileSystemDirectoryHandle,
  segments: string[],
  options: { create: boolean },
): Promise<FileSystemDirectoryHandle> {
  let dir = root;
  for (const seg of segments) {
    if (!seg) continue;
    dir = await dir.getDirectoryHandle(seg, { create: options.create });
  }
  return dir;
}

function resolvePath(path: string): { dirs: string[]; name: string } {
  const segments = path.split('/').filter(Boolean);
  const name = segments.pop();
  if (!name) throw new Error(`Invalid OPFS path: ${path}`);
  return { dirs: segments, name };
}

export async function opfsFileExists(path: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.getDirectory) {
    return false;
  }
  try {
    const root = await navigator.storage.getDirectory();
    const { dirs, name } = resolvePath(path);
    const dir = await navigateToDir(root, dirs, { create: false });
    await dir.getFileHandle(name, { create: false });
    return true;
  } catch {
    return false;
  }
}

export async function readOPFSFile(path: string): Promise<ArrayBuffer | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.getDirectory) {
    return null;
  }
  try {
    const root = await navigator.storage.getDirectory();
    const { dirs, name } = resolvePath(path);
    const dir = await navigateToDir(root, dirs, { create: false });
    const handle = await dir.getFileHandle(name, { create: false });
    const file = await handle.getFile();
    return await file.arrayBuffer();
  } catch {
    return null;
  }
}

export async function writeOPFSFile(path: string, data: ArrayBuffer | Blob): Promise<void> {
  const root = await navigator.storage.getDirectory();
  const { dirs, name } = resolvePath(path);
  const dir = await navigateToDir(root, dirs, { create: true });
  const handle = await dir.getFileHandle(name, { create: true });
  const writable = await handle.createWritable();
  try {
    await writable.write(data);
  } finally {
    await writable.close();
  }
}

export async function getMapMeta(): Promise<MapMetadata | null> {
  const value = await getSyncMeta(MAP_META_KEY);
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<MapMetadata>;
  if (candidate.key !== MAP_META_KEY) return null;
  if (typeof candidate.installedAt !== 'number') return null;
  return candidate as MapMetadata;
}

export async function setMapMeta(meta: MapMetadata): Promise<void> {
  await setSyncMeta(MAP_META_KEY, meta);
}

export async function deleteOPFSFile(path: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.getDirectory) {
    return false;
  }
  try {
    const root = await navigator.storage.getDirectory();
    const { dirs, name } = resolvePath(path);
    const dir = await navigateToDir(root, dirs, { create: false });
    await dir.removeEntry(name);
    return true;
  } catch {
    return false;
  }
}

export async function clearMapMeta(): Promise<void> {
  const db = await getDB();
  await db.delete('syncMeta', MAP_META_KEY);
}
