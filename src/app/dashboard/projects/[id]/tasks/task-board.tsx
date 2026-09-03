"use client";

import { useState, useTransition } from "react";
import { Plus, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createTask, updateTaskStatus, addTaskComment } from "./actions";

export interface TaskData {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  discipline: string | null;
  deadline: string | null;
  comments: { id: string; body: string; authorName: string; createdAt: string }[];
}

const COLUMNS = [
  { key: "BACKLOG", label: "Backlog" },
  { key: "READY", label: "Ready" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "REVIEW", label: "Review" },
  { key: "BLOCKED", label: "Blocked" },
  { key: "APPROVED", label: "Approved" },
  { key: "COMPLETED", label: "Completed" },
];

const PRIORITY_TONE: Record<string, "neutral" | "info" | "warning" | "danger"> = {
  LOW: "neutral",
  MEDIUM: "info",
  HIGH: "warning",
  URGENT: "danger",
};

export function TaskBoard({ projectId, initialTasks }: { projectId: string; initialTasks: TaskData[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const res = await createTask(projectId, formData);
      if (res.ok) {
        setShowForm(false);
        window.location.reload(); // simplest correct refresh of server-rendered task list
      }
    });
  }

  function handleStatusChange(taskId: string, status: string) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t))); // optimistic
    startTransition(async () => {
      const res = await updateTaskStatus(projectId, taskId, status);
      if (!res.ok) {
        setTasks(initialTasks); // revert on failure
      }
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-steel">{tasks.length} task{tasks.length === 1 ? "" : "s"}</p>
        <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
          <Plus size={15} /> New task
        </Button>
      </div>

      {showForm && (
        <form action={handleCreate} className="glass-surface mb-6 space-y-4 rounded-md p-6">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <select id="priority" name="priority" defaultValue="MEDIUM" className="h-11 w-full rounded border border-ink/15 bg-white px-3.5 text-sm text-ink">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <Label htmlFor="deadline">Deadline</Label>
              <Input id="deadline" name="deadline" type="date" />
            </div>
          </div>
          <div>
            <Label htmlFor="discipline">Discipline (optional)</Label>
            <Input id="discipline" name="discipline" placeholder="Structural Engineering" />
          </div>
          <div className="flex gap-3">
            <Button type="submit" isLoading={pending}>
              Create task
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {tasks.length === 0 ? (
        <p className="glass-surface rounded-md p-8 text-center text-sm text-steel">No tasks yet.</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="w-64 flex-none">
                <div className="mono-label mb-3 flex items-center justify-between">
                  {col.label} <span className="text-steel/50">{colTasks.length}</span>
                </div>
                <div className="space-y-2.5">
                  {colTasks.map((t) => (
                    <div key={t.id} className="glass-surface rounded-md p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium text-ink">{t.title}</span>
                        <Badge tone={PRIORITY_TONE[t.priority] ?? "neutral"}>{t.priority}</Badge>
                      </div>
                      {t.description && <p className="mt-1.5 text-xs text-steel">{t.description}</p>}
                      {t.discipline && <div className="mono-label mt-2">{t.discipline}</div>}

                      <select
                        value={t.status}
                        onChange={(e) => handleStatusChange(t.id, e.target.value)}
                        className="mt-3 h-8 w-full rounded border border-ink/15 bg-white px-2 text-xs text-ink"
                        disabled={pending}
                      >
                        {COLUMNS.map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.label}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                        className="mt-2.5 flex items-center gap-1.5 text-xs text-steel hover:text-ink"
                      >
                        <MessageCircle size={13} /> {t.comments.length} comment{t.comments.length === 1 ? "" : "s"}
                      </button>

                      {expandedId === t.id && <TaskComments projectId={projectId} task={t} />}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TaskComments({ projectId, task }: { projectId: string; task: TaskData }) {
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");

  function submit() {
    if (!body.trim()) return;
    startTransition(async () => {
      const res = await addTaskComment(projectId, task.id, body);
      if (res.ok) {
        setBody("");
        window.location.reload();
      }
    });
  }

  return (
    <div className="mt-3 space-y-2 border-t border-ink/10 pt-3">
      {task.comments.map((c) => (
        <div key={c.id} className="text-xs">
          <span className="font-medium text-ink">{c.authorName}: </span>
          <span className="text-steel">{c.body}</span>
        </div>
      ))}
      <div className="flex gap-1.5">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment..."
          className="h-8 flex-1 rounded border border-ink/15 bg-white px-2 text-xs"
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <Button size="sm" onClick={submit} isLoading={pending}>
          Send
        </Button>
      </div>
    </div>
  );
}
