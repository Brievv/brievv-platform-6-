"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch("/api/v1/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.notifications);
      setUnreadCount(data.unreadCount);
      setLoaded(true);
    } catch {
      // Silent — the bell just stays at its last known state on failure.
    }
  }

  // Poll for unread count periodically so the badge stays roughly current
  // without needing a WebSocket/SSE layer (spec §61 lists that as a
  // future real-time upgrade — this is the honest interim).
  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    setUnreadCount(0);
    await fetch("/api/v1/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAll: true }) });
  }

  async function markOneRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    await fetch("/api/v1/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationId: id }) });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        className="relative flex h-9 w-9 items-center justify-center rounded hover:bg-ink/[0.05]"
        aria-label="Notifications"
        onClick={() => {
          setOpen((v) => !v);
          if (!loaded) load();
        }}
      >
        <Bell size={18} strokeWidth={1.75} />
        {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-orange" />}
      </button>

      {open && (
        <div className="glass-surface absolute right-0 top-11 z-50 w-80 rounded-md">
          <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
            <span className="mono-label">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs font-medium text-orange hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-steel">No notifications yet.</p>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id}
                  href={n.link ?? "#"}
                  onClick={() => markOneRead(n.id)}
                  className={cn("block border-b border-ink/5 px-4 py-3 text-sm last:border-0 hover:bg-ink/[0.02]", !n.readAt && "bg-orange/[0.04]")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-ink">{n.title}</span>
                    {!n.readAt && <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-orange" />}
                  </div>
                  <p className="mt-0.5 text-xs text-steel">{n.body}</p>
                  <p className="mt-1 font-mono text-[0.68rem] text-steel/60">{timeAgo(n.createdAt)}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
