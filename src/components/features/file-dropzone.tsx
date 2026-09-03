"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud, File as FileIcon, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UploadedFileRef {
  fileId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
}

type UploadItemStatus = "uploading" | "done" | "error";
interface UploadItem {
  fileId: string;
  fileName: string;
  sizeBytes: number;
  progress: number; // 0-100
  status: UploadItemStatus;
  error?: string;
  storageKey?: string;
  mimeType?: string;
}

const ACCEPTED = ".pdf,.dwg,.dxf,.rvt,.ifc,.docx,.xlsx,.jpg,.jpeg,.png,.zip";

/**
 * Direct-to-storage upload (spec §9 step 4, §71). Flow per file:
 *   1. POST /api/v1/uploads/presign  → { uploadUrl, storageKey }
 *   2. PUT the file bytes to `uploadUrl` (via XHR so we get real progress
 *      events — fetch() doesn't expose upload progress)
 *   3. On success, bubble the {storageKey, fileName, mimeType, sizeBytes}
 *      up to the parent form so it can be submitted with the brief.
 *
 * If storage isn't configured yet (503 from the presign route), we show a
 * clear inline message instead of silently failing or pretending the
 * upload worked.
 */
export function FileDropzone({
  scope,
  onFilesChange,
}: {
  /** Exactly one of these — see /api/v1/uploads/presign for why. */
  scope: { intakeId: string } | { projectId: string } | { verification: true };
  onFilesChange: (files: UploadedFileRef[]) => void;
}) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const emitChange = useCallback(
    (next: UploadItem[]) => {
      const done = next
        .filter((i): i is UploadItem & { storageKey: string; mimeType: string } => i.status === "done" && !!i.storageKey)
        .map((i) => ({ fileId: i.fileId, fileName: i.fileName, mimeType: i.mimeType, sizeBytes: i.sizeBytes, storageKey: i.storageKey }));
      onFilesChange(done);
    },
    [onFilesChange]
  );

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    for (const file of files) {
      const fileId = crypto.randomUUID();
      const item: UploadItem = { fileId, fileName: file.name, sizeBytes: file.size, progress: 0, status: "uploading" };
      setItems((prev) => {
        const next = [...prev, item];
        return next;
      });

      try {
        const presignRes = await fetch("/api/v1/uploads/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...scope, fileName: file.name, mimeType: file.type || "application/octet-stream", sizeBytes: file.size }),
        });

        if (presignRes.status === 503) {
          setStorageUnavailable(true);
          setItems((prev) => updateItem(prev, fileId, { status: "error", error: "File storage isn't configured yet." }, emitChange));
          continue;
        }
        if (!presignRes.ok) {
          const body = await presignRes.json().catch(() => ({}));
          setItems((prev) => updateItem(prev, fileId, { status: "error", error: body.error ?? "Upload rejected." }, emitChange));
          continue;
        }

        const { uploadUrl, storageKey } = await presignRes.json();

        await uploadWithProgress(uploadUrl, file, (pct) => {
          setItems((prev) => updateItem(prev, fileId, { progress: pct }, emitChange));
        });

        setItems((prev) => updateItem(prev, fileId, { status: "done", progress: 100, storageKey, mimeType: file.type || "application/octet-stream" }, emitChange));
      } catch (err) {
        setItems((prev) => updateItem(prev, fileId, { status: "error", error: "Upload failed. Check your connection and try again." }, emitChange));
      }
    }
  }

  function removeItem(fileId: string) {
    setItems((prev) => {
      const next = prev.filter((i) => i.fileId !== fileId);
      emitChange(next);
      return next;
    });
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging ? "border-orange bg-orange/5" : "border-ink/15 hover:border-ink/25"
        )}
      >
        <UploadCloud size={26} className="text-steel" strokeWidth={1.5} />
        <p className="mt-3 text-sm font-medium text-ink">Drag files here, or click to browse</p>
        <p className="mt-1 font-mono text-xs text-steel">PDF, DWG, DXF, RVT, IFC, DOCX, XLSX, JPG, PNG, ZIP</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {storageUnavailable && (
        <div className="mt-3 flex items-start gap-2 rounded border border-warning/30 bg-warning/5 px-3.5 py-3 text-xs text-ink">
          <AlertCircle size={15} className="mt-0.5 flex-none text-warning" />
          <span>
            File storage isn't connected in this environment yet. You can still submit your brief without attachments —
            BRIEVV's team will follow up to collect reference materials directly.
          </span>
        </div>
      )}

      {items.length > 0 && (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li key={item.fileId} className="flex items-center gap-3 rounded border border-ink/10 bg-white px-3.5 py-2.5">
              <FileIcon size={16} className="flex-none text-steel" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-ink">{item.fileName}</div>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-ink/10">
                  <div
                    className={cn("h-full rounded-full transition-all", item.status === "error" ? "bg-danger" : "bg-orange")}
                    style={{ width: `${item.status === "done" ? 100 : item.progress}%` }}
                  />
                </div>
                {item.error && <p className="mt-1 font-mono text-[0.7rem] text-danger">{item.error}</p>}
              </div>
              {item.status === "done" && <CheckCircle2 size={16} className="flex-none text-success" />}
              <button type="button" onClick={() => removeItem(item.fileId)} aria-label={`Remove ${item.fileName}`}>
                <X size={15} className="text-steel hover:text-ink" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function updateItem(items: UploadItem[], fileId: string, patch: Partial<UploadItem>, emit: (items: UploadItem[]) => void): UploadItem[] {
  const next = items.map((i) => (i.fileId === fileId ? { ...i, ...patch } : i));
  emit(next);
  return next;
}

function uploadWithProgress(url: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}
