"use client";

import { useState, useTransition } from "react";
import { FileText, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { DocumentAnalysisResult } from "@/server/services/ai/document-analysis";

const ANALYZABLE_MIME_TYPES = new Set(["application/pdf"]);

export function FileRow({ fileId, fileName, mimeType, scanStatus }: { fileId: string; fileName: string; mimeType: string; scanStatus: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<DocumentAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  function analyze() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/v1/files/${fileId}/analyze`, { method: "POST" });
      const body = await res.json();
      if (res.ok) {
        setResult(body.result);
        setExpanded(true);
      } else {
        setError(body.error ?? "Analysis failed.");
      }
    });
  }

  return (
    <li className="py-2.5 text-sm">
      <div className="flex items-center gap-3">
        <FileText size={15} className="flex-none text-steel" />
        <span className="min-w-0 flex-1 truncate text-ink">{fileName}</span>
        <Badge tone={scanStatus === "clean" ? "success" : scanStatus === "infected" ? "danger" : "neutral"}>{scanStatus}</Badge>
        {ANALYZABLE_MIME_TYPES.has(mimeType) &&
          (result ? (
            <button onClick={() => setExpanded((v) => !v)} className="flex items-center gap-1 text-xs text-orange hover:underline">
              <Sparkles size={13} /> {expanded ? "Hide" : "View"} analysis
            </button>
          ) : (
            <button onClick={analyze} disabled={pending} className="flex items-center gap-1 text-xs text-steel hover:text-orange disabled:opacity-50">
              <Sparkles size={13} /> {pending ? "Analyzing..." : "Analyze"}
            </button>
          ))}
      </div>

      {error && <p className="mt-1.5 font-mono text-xs text-danger">{error}</p>}

      {expanded && result && (
        <div className="mt-3 space-y-2.5 rounded border border-ink/10 bg-white p-4 text-xs">
          <div>
            <span className="mono-label">Document type</span>
            <p className="mt-0.5 text-ink">{result.documentType}</p>
          </div>
          <div>
            <span className="mono-label">Scope</span>
            <p className="mt-0.5 text-ink">{result.approximateScope}</p>
          </div>
          {result.missingInformation.length > 0 && (
            <div>
              <span className="mono-label">Missing information</span>
              <ul className="mt-0.5 list-inside list-disc text-ink">
                {result.missingInformation.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          )}
          {result.inconsistencies.length > 0 && (
            <div>
              <span className="mono-label">Inconsistencies to review</span>
              <ul className="mt-0.5 list-inside list-disc text-ink">
                {result.inconsistencies.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="border-t border-ink/10 pt-2 text-steel">
            AI-assisted analysis for a human reviewer — not a substitute for professional judgment.
          </p>
        </div>
      )}
    </li>
  );
}
