"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { sendAdminMessage } from "../actions";

export function AdminComposer({ projectId, internal }: { projectId: string; internal: boolean }) {
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!body.trim()) return;
    startTransition(async () => {
      const res = await sendAdminMessage(projectId, body, internal);
      if (res.ok) {
        setBody("");
        window.location.reload();
      }
    });
  }

  return (
    <div className="flex gap-2 p-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={internal ? "Add an internal note (never visible to the client)..." : "Reply to the client..."}
        rows={2}
        className="flex-1 resize-none rounded border border-ink/15 bg-white px-3 py-2 text-sm text-ink focus-visible:outline-none focus-visible:border-orange"
      />
      <Button onClick={submit} isLoading={pending} size="sm" className="self-end" variant={internal ? "outline" : "primary"}>
        Send
      </Button>
    </div>
  );
}
