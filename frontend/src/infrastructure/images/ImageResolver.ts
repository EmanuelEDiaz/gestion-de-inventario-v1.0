import { getDB } from '@/infrastructure/storage/db';
import { readOPFSFile } from '@/infrastructure/maps/opfs-utils';

const IMAGE_PATH_REGEX = /^\/api\/v1\/(products|suppliers|customers)\/([^/]+)\/images\/(\d+)$/;

const activeObjectUrls = new Set<string>();

export async function resolveImageUrl(apiPath: string): Promise<string | null> {
  const match = apiPath.match(IMAGE_PATH_REGEX);
  if (!match) return null;

  const entityType = match[1];
  const entityId = match[2];
  const imageId = match[3];

  const db = await getDB();
  const entries = await db.getAllFromIndex('imageIndex', 'by-entity', [entityType, entityId]);
  const entry = entries.find(e => e.imageId === imageId && e.size === 'thumbnail');
  if (!entry) return null;

  const buffer = await readOPFSFile(entry.opfsPath);
  if (!buffer) return null;

  const blob = new Blob([buffer], { type: entry.contentType });
  const url = URL.createObjectURL(blob);
  activeObjectUrls.add(url);
  return url;
}

export function revokeAllObjectUrls(): void {
  for (const url of activeObjectUrls) {
    URL.revokeObjectURL(url);
  }
  activeObjectUrls.clear();
}

export function revokeObjectUrl(url: string): void {
  URL.revokeObjectURL(url);
  activeObjectUrls.delete(url);
}

export { IMAGE_PATH_REGEX };
