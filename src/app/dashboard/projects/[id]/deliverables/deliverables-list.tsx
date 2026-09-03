"use client";

import { useState, useTransition } from "react";
import { FileText, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileDropzone, type UploadedFileRef } from "@/components/features/file-dropzone";
import { attachDeliverable, getDeliverableDownloadUrl } from "./actions";

export interface DeliverableData {
  id: string;
  fileName: string;
  sizeBytes: number;
  scanStatus: string;
  createdAt: string;
}

export function DeliverablesList({ projectId, initialFiles }: { projectId: string; initialFiles: DeliverableData[] }) {
  const [showUpload, setShowUpload] = useState(false);
  const [pendingUpload, startUpload] = useTransition();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleUploadedFiles(files: UploadedFileRef[]) {
    if (files.length === 0) return;
    startUpload(async () => {
      const res = await attachDeliverable(projectId, files);
      if (res.ok) {
        setShowUpload(false);
        window.location.reload();
      } else {
        setError(res.error ?? "Could not attach file.");
      }
    });
  }

  async function handleDownload(fileId: string) {
    setError(null);
    setDownloadingId(fileId);
    try {
      const res = await getDeliverableDownloadUrl(projectId, fileId);
      if (res.ok) window.open(res.url, "_blank", "noopener,noreferrer");
      else setError(res.error);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-steel">{initialFiles.length} deliverable{initialFiles.length === 1 ? "" : "s"}</p>
        <Button size="sm" variant="outline" onClick={() => setShowUpload((v) => !v)}>
          <Upload size={15} /> Upload deliverable
        </Button>
      </div>

      {error && <p className="mb-4 font-mono text-xs text-danger">{error}</p>}

      {showUpload && (
        <div className="glass-surface mb-6 rounded-md p-6">
          <FileDropzone scope={{ projectId }} onFilesChange={handleUploadedFiles} />
          {pendingUpload && <p className="mt-3 text-xs text-steel">Saving...</p>}
        </div>
      )}

      {initialFiles.length === 0 ? (
        <p className="glass-surface rounded-md p-8 text-center text-sm text-steel">
          No deliverables uploaded yet. Final files placed here are what the client sees as delivered work product.
        </p>
      ) : (
        <div className="glass-surface divide-y divide-ink/10 rounded-md">
          {initialFiles.map((f) => (
            <div key={f.id} className="flex items-center gap-3 px-5 py-3.5 text-sm">
              <FileText size={16} className="flex-none text-steel" />
              <span className="min-w-0 flex-1 truncate text-ink">{f.fileName}</span>
              <Badge tone={f.scanStatus === "clean" ? "success" : f.scanStatus === "infected" ? "danger" : "neutral"}>{f.scanStatus}</Badge>
              <button
                type="button"
                onClick={() => handleDownload(f.id)}
                disabled={downloadingId === f.id}
                className="flex-none text-steel hover:text-orange disabled:opacity-50"
                aria-label={`Download ${f.fileName}`}
              >
                <Download size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
