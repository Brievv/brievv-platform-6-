"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { runMatchingForProject, proposeAssignment } from "./actions";
import type { MatchResult } from "@/server/services/matching/matching-engine";

export interface ProjectOption {
  id: string;
  label: string;
}

export function MatchingConsole({ projects }: { projects: ProjectOption[] }) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proposedIds, setProposedIds] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  function runMatch() {
    setError(null);
    setResults(null);
    startTransition(async () => {
      const res = await runMatchingForProject(projectId);
      if (res.ok) setResults(res.results);
      else setError(res.error);
    });
  }

  function propose(professionalId: string, score: number) {
    startTransition(async () => {
      const res = await proposeAssignment(projectId, professionalId, score);
      if (res.ok) setProposedIds((prev) => new Set(prev).add(professionalId));
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <label className="mono-label mb-2 block">Project</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="h-11 w-full max-w-md rounded border border-ink/15 bg-white px-3.5 text-sm text-ink"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={runMatch} isLoading={pending} disabled={!projectId}>
          Run matching
        </Button>
      </div>

      {error && <p className="font-mono text-xs text-danger">{error}</p>}

      {results && (
        <div className="space-y-2.5">
          {results.length === 0 ? (
            <p className="text-sm text-steel">No professionals found for this project's disciplines.</p>
          ) : (
            results.map((r) => (
              <div key={r.professionalId} className="flex items-center justify-between gap-3 rounded-md border border-ink/10 bg-white p-4">
                <div>
                  <div className="font-medium text-ink">{r.name}</div>
                  {!r.eligible && <div className="mt-1 text-xs text-danger">{r.ineligibleReason}</div>}
                  {r.eligible && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5 font-mono text-[0.68rem] text-steel">
                      {Object.entries(r.breakdown).map(([k, v]) => (
                        <span key={k}>
                          {k} {Math.round(v * 100)}%
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={r.eligible ? (r.score >= 70 ? "success" : "info") : "neutral"}>{r.score}% match</Badge>
                  {r.eligible &&
                    (proposedIds.has(r.professionalId) ? (
                      <Badge tone="success">Proposed</Badge>
                    ) : (
                      <Button size="sm" onClick={() => propose(r.professionalId, r.score)} disabled={pending}>
                        Propose
                      </Button>
                    ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
