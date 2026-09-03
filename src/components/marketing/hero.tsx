import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { WorkflowAnimation } from "@/components/marketing/workflow-animation";

export function Hero() {
  return (
    <section className="glass-surface-dark relative mx-3 mt-4 overflow-hidden rounded-xl text-paper sm:mx-6 sm:mt-6">
      <div className="bp-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(60% 55% at 15% -10%, rgba(255,106,19,0.14) 0%, transparent 60%)" }}
        aria-hidden
      />

      <div className="container-brievv relative py-20 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="mono-label mb-6 text-paper/50">§ AEC PROJECT DELIVERY</div>
            <h1 className="text-[2.6rem] font-medium leading-[1.05] tracking-tight sm:text-6xl">
              Your project.
              <br />
              The right team.
              <br />
              Started now.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-paper/70">
              BRIEVV uses AI, workflow automation, and a global network of AEC professionals to move projects from
              brief to delivery faster.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link href="/start" className={buttonVariants({ size: "lg" })}>
                Start a Project <ArrowRight size={17} />
              </Link>
              <Link href="/how-it-works" className={buttonVariants({ variant: "outline", size: "lg", className: "border-paper/20 text-paper hover:bg-paper/5 hover:border-paper/35" })}>
                Explore the Platform
              </Link>
            </div>

            <p className="mt-8 font-mono text-xs text-paper/40">
              Illustrative workflow shown at right — not a claim about a specific live project.
            </p>
          </div>

          <WorkflowAnimation />
        </div>
      </div>
    </section>
  );
}
