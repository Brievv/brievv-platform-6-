"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FileDropzone, type UploadedFileRef } from "@/components/features/file-dropzone";
import { submitVerificationDocuments } from "./actions";

export function VerificationUpload() {
  const [files, setFiles] = useState<UploadedFileRef[]>([]);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function submit() {
    startTransition(async () => {
      const res = await submitVerificationDocuments(files.map((f) => f.storageKey));
      setMessage(res.ok ? "Documents submitted for review." : res.error ?? "Something went wrong.");
    });
  }

  return (
    <div className="space-y-4">
      <FileDropzone scope={{ verification: true }} onFilesChange={setFiles} />
      {message && <p className="font-mono text-xs text-steel">{message}</p>}
      <Button onClick={submit} disabled={files.length === 0} isLoading={pending}>
        Submit for review
      </Button>
    </div>
  );
}
