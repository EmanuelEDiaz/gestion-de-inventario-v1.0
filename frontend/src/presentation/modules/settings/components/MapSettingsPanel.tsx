'use client';

import { useState, useEffect } from 'react';
import { MapIcon, Download, Trash2, RefreshCw, HardDrive } from 'lucide-react';
import { Button } from '@/presentation/shared/components/ui/Button';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';
import { Card } from '@/presentation/shared/components/ui/card';
import { AVAILABLE_REGIONS, downloadRegion } from '@/infrastructure/maps/adapters/RegionDownloadService';
import { CubaTileManager } from '@/infrastructure/maps/adapters/CubaTileManager';
import type { TileSetInfo } from '@/core/maps/ports/ITileManager';

const tileManager = new CubaTileManager();

export function MapSettingsPanel() {
  const [installed, setInstalled] = useState<TileSetInfo[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  const refreshInstalled = async () => {
    const sets = await tileManager.getInstalledTileSets();
    setInstalled(sets);
  };

  useEffect(() => {
    refreshInstalled();
  }, []);

  const handleDownload = async (regionCode: string) => {
    const region = AVAILABLE_REGIONS.find(r => r.regionCode === regionCode);
    if (!region) return;
    setIsDownloading(true);
    try {
      await downloadRegion(region);
      await refreshInstalled();
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRemove = async (countryCode: string) => {
    await tileManager.removeTileSet(countryCode);
    await refreshInstalled();
  };

  const handleUpdate = async (countryCode: string) => {
    setIsDownloading(true);
    try {
      await tileManager.updateTileSet(countryCode);
      await refreshInstalled();
    } finally {
      setIsDownloading(false);
    }
  };

  const notInstalled = AVAILABLE_REGIONS.filter(
    r => !installed.some(i => i.countryCode === r.regionCode)
  );

  const totalStorage = installed.reduce((acc, i) => acc + (i.sizeBytes || 0), 0);
  const storageMB = (totalStorage / (1024 * 1024)).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MapIcon className="h-5 w-5" />
        <h3 className="text-lg font-medium">Mapas Offline</h3>
      </div>

      {/* Storage bar */}
      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <HardDrive className="h-4 w-4" />
          <span>Almacenamiento: {storageMB} MB</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${Math.min((totalStorage / (500 * 1024 * 1024)) * 100, 100)}%` }}
          />
        </div>
      </Card>

      {/* Installed regions */}
      {installed.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Regiones instaladas</h4>
          {installed.map(tile => {
            const region = AVAILABLE_REGIONS.find(r => r.regionCode === tile.countryCode);
            return (
              <Card key={tile.countryCode} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapIcon className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{region?.label ?? tile.countryCode}</p>
                    <p className="text-xs text-muted-foreground">
                      {tile.sizeBytes ? `${(tile.sizeBytes / (1024 * 1024)).toFixed(1)} MB` : 'Tamaño desconocido'}
                      {tile.downloadedAt && ` · ${new Date(tile.downloadedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <TooltipWrapper content="Actualizar mapa">
                    <Button variant="ghost" size="icon" onClick={() => handleUpdate(tile.countryCode)}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipWrapper>
                  <TooltipWrapper content="Eliminar mapa">
                    <Button variant="ghost" size="icon" onClick={() => handleRemove(tile.countryCode)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipWrapper>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Available for download */}
      {notInstalled.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Regiones disponibles</h4>
          {notInstalled.map(region => (
            <Card key={region.regionCode} className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{region.label}</p>
                  <p className="text-xs text-muted-foreground">~{region.sizeMB} MB</p>
                </div>
              </div>
              <TooltipWrapper content={`Descargar mapa de ${region.label}`}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(region.regionCode)}
                  disabled={isDownloading}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Descargar
                </Button>
              </TooltipWrapper>
            </Card>
          ))}
        </div>
      )}

      {installed.length === 0 && notInstalled.length === 0 && (
        <p className="text-sm text-muted-foreground">No hay regiones disponibles.</p>
      )}
    </div>
  );
}
