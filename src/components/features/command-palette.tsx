"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Search, FolderKanban, FileText, User, Building2 } from "lucide-react";
import type { SearchResult } from "@/app/api/v1/search/route";

const ICONS: Record<SearchResult["type"], typeof FolderKanban> = {
  project: FolderKanban,
  quote: FileText,
  professional: User,
  client: Building2,
};

/**
 * Global Cmd/Ctrl+K search. Mount once near the root of an authenticated
 * layout (dashboard/pro/admin) — it listens for the shortcut itself, so
 * nothing else needs to trigger it.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10);
    else {
      setQuery("");
      setResults([]);
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results);
          setActiveIndex(0);
        }
      } catch {
        // silent — command palette degrades to "no results" on failure
      }
    }, 200); // debounced
    return () => clearTimeout(timeout);
  }, [query]);

  function select(result: SearchResult) {
    setOpen(false);
    router.push(result.href);
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      select(results[activeIndex]);
    }
  }

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center bg-ink/40 pt-[15vh] backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <div className="glass-surface w-full max-w-lg overflow-hidden rounded-md">
        <div className="flex items-center gap-3 border-b border-ink/10 px-4 py-3">
          <Search size={16} className="flex-none text-steel" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search projects, quotes, professionals, clients..."
            className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-steel/60"
          />
          <kbd className="rounded border border-ink/15 px-1.5 py-0.5 font-mono text-[0.65rem] text-steel">Esc</kbd>
        </div>

        {results.length > 0 && (
          <div className="max-h-80 overflow-y-auto py-1.5">
            {results.map((r, i) => {
              const Icon = ICONS[r.type];
              return (
                <button
                  key={`${r.type}-${r.id}`}
                  onClick={() => select(r)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm ${i === activeIndex ? "bg-orange/10" : ""}`}
                >
                  <Icon size={15} className="flex-none text-steel" />
                  <span className="min-w-0 flex-1 truncate text-ink">{r.title}</span>
                  <span className="flex-none truncate font-mono text-xs text-steel/70">{r.subtitle}</span>
                </button>
              );
            })}
          </div>
        )}

        {query.trim().length >= 2 && results.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-steel">No results for "{query}"</p>
        )}
      </div>
    </div>,
    document.body
  );
}
