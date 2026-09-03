"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const STAGES = [
  "BRIEF SUBMITTED",
  "AI ANALYZING",
  "SCOPE IDENTIFIED",
  "TEAM MATCHED",
  "PROJECT STARTED",
  "QA",
  "DELIVERED",
];

export function WorkflowAnimation() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setActive((a) => (a + 1) % STAGES.length), 1400);
    return () => clearInterval(id);
  }, [reduced]);

  return (
    <div className="relative rounded-lg border border-border-dark bg-navy/60 p-6 font-mono">
      <div className="mono-label mb-5 flex items-center justify-between text-paper/40">
        <span>PRODUCT VISUALIZATION</span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success" /> LIVE PIPELINE (SAMPLE)
        </span>
      </div>

      <ol className="space-y-0.5">
        {STAGES.map((stage, i) => {
          const done = reduced ? true : i < active;
          const current = reduced ? false : i === active;
          return (
            <motion.li
              key={stage}
              initial={reduced ? false : { opacity: 0.45, x: 8 }}
              animate={{ opacity: done || current ? 1 : 0.55, x: 0 }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
              className={`flex items-center gap-3 rounded px-3 py-2.5 text-sm ${current ? "bg-orange/[0.08]" : ""}`}
            >
              <span className="flex h-5 w-5 flex-none items-center justify-center">
                {done ? (
                  <motion.span
                    initial={reduced ? false : { scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-success"
                  >
                    <CheckCircle2 size={16} />
                  </motion.span>
                ) : (
                  <motion.span
                    animate={current && !reduced ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                    transition={current && !reduced ? { duration: 1.1, repeat: Infinity } : { duration: 0.2 }}
                    className={`block h-2 w-2 rounded-full border ${
                      current ? "border-orange bg-orange" : "border-paper/25"
                    }`}
                  />
                )}
              </span>
              <span className={done || current ? "text-paper" : "text-paper/35"}>{stage}</span>
              {current && !reduced && (
                <AnimatePresence mode="wait">
                  <motion.span
                    key={stage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="ml-auto text-[0.68rem] text-orange"
                  >
                    IN PROGRESS
                  </motion.span>
                </AnimatePresence>
              )}
            </motion.li>
          );
        })}
      </ol>

      <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-paper/10">
        <motion.div
          className="h-full bg-orange"
          animate={{ width: reduced ? "100%" : `${((active + 1) / STAGES.length) * 100}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
