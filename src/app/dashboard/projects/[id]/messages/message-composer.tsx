"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendProjectMessage } from "./actions";

export function MessageComposer({ projectId }: { projectId: string }) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!body.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await sendProjectMessage(projectId, body);
      if (res.ok) {
        setBody("");
        window.location.reload(); // re-fetch the server-rendered thread
      } else {
        setError(res.error ?? "Could not send message.");
      }
    });
  }

  return (
    <div className="border-t border-ink/10 p-4">
      {error && <p className="mb-2 font-mono text-xs text-danger">{error}</p>}
      <div className="flex gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Write a message..."
          rows={2}
          className="flex-1 resize-none rounded border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink focus-visible:outline-none focus-visible:border-orange"
        />
        <Button onClick={submit} isLoading={pending} className="self-end">
          <Send size={15} />
        </Button>
      </div>
    </div>
  );
}
