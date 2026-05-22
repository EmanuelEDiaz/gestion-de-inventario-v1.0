'use client';

import { useState, useRef } from 'react';
import { useImportController } from '../hooks/useImportController';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/shared/components/ui/card';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Badge } from '@/presentation/shared/components/ui/badge';
import { IMPORT_STATUS_LABELS, IMPORT_STATUS_COLORS } from '@/core/import/entities/import-job';
import { Upload, FileText } from '@/presentation/shared/components/ui/icon-mapping';

export function ImportView() {
  const { uploadMutation, dryRunMutation, useJobStatus } = useImportController();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const jobStatus = useJobStatus(jobId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] ?? null);
    setJobId(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const result = await uploadMutation.mutateAsync({ file: selectedFile, mapping: {} });
    setJobId(result.id);
  };

  const handleDryRun = async () => {
    if (!selectedFile) return;
    const result = await dryRunMutation.mutateAsync({ file: selectedFile, mapping: {} });
    setJobId(result.id);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Importar CSV</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()} title="Seleccionar archivo CSV">
              <FileText className="h-4 w-4 mr-2" />
              {selectedFile ? selectedFile.name : 'Seleccionar archivo'}
            </Button>
          </div>

          {selectedFile && (
            <div className="flex gap-2">
              <Button
                onClick={handleDryRun}
                variant="outline"
                disabled={dryRunMutation.isPending}
                title="Simular importación sin aplicar cambios"
              >
                {dryRunMutation.isPending ? 'Simulando...' : 'Simular (Dry Run)'}
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploadMutation.isPending}
                title="Importar datos desde CSV"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadMutation.isPending ? 'Importando...' : 'Importar'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {jobStatus.data && (
        <Card>
          <CardHeader><CardTitle>Estado de Importación</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Estado:</span>
              <Badge className={IMPORT_STATUS_COLORS[jobStatus.data.status]}>
                {IMPORT_STATUS_LABELS[jobStatus.data.status]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Archivo: {jobStatus.data.originalFilename} — Creado: {new Date(jobStatus.data.createdAt).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
