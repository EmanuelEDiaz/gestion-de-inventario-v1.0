export interface TileSetInfo {
  countryCode: string;
  tilesUrl: string;
  sizeBytes: number;
  downloadedAt: number;
  zoomMax: number;
}

export interface ITileManager {
  getInstalledTileSets(): Promise<TileSetInfo[]>;
  installTileSet(config: { tilesUrl: string; geoIndexUrl: string; countryCode: string }): Promise<void>;
  removeTileSet(countryCode: string): Promise<void>;
  updateTileSet(countryCode: string): Promise<void>;
  getEstimatedSize(config: { countryCode: string }): Promise<number>;
}
