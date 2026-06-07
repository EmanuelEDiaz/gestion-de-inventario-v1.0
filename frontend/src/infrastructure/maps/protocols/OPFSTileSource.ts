import type { Source } from 'pmtiles';
import maplibregl from 'maplibre-gl';
import { PMTiles } from 'pmtiles';

let cachedTiles: PMTiles | null = null;
let protocolRegistered = false;

export async function openPMTilesFromOPFS(filename: string): Promise<boolean> {
  try {
    const root = await navigator.storage.getDirectory();
    const handle = await root.getFileHandle(filename, { create: false });
    const file = await handle.getFile();
    const source: Source = {
      getBytes: async (offset: number, length: number) => {
        const blob = file.slice(offset, offset + length);
        return { data: await blob.arrayBuffer() };
      },
      getKey: () => `opfs-${filename}`,
    };
    cachedTiles = new PMTiles(source);
    if (!protocolRegistered) {
      registerOPFSProtocol();
      protocolRegistered = true;
    }
    return true;
  } catch {
    return false;
  }
}

function registerOPFSProtocol(): void {
  maplibregl.addProtocol('opfs-pmtiles', async (params, abortController) => {
    if (!cachedTiles) return { data: new ArrayBuffer(0) };
    const [z, x, y] = params.url.replace('opfs-pmtiles://', '').split('/').map(Number);
    try {
      const tile = await cachedTiles.getZxy(z, x, y, abortController.signal);
      return { data: tile?.data ?? new ArrayBuffer(0) };
    } catch {
      return { data: new ArrayBuffer(0) };
    }
  });
}
