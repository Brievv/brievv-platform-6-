import Link from "next/link";
import { ArrowRight, ShieldCheck, Workflow, Users2, Gauge } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

export function TrustStrip() {
  const items = [
    { label: "Disciplines supported", value: "12+" },
    { label: "Professional network", value: "Vetted" },
    { label: "AI-assisted estimation", value: "Server-side" },
    { label: "Human review on regulated work", value: "Always" },
  ];
  return (
    <section className="border-b border-ink/10 bg-white/55 backdrop-blur-xl">
      <div className="container-brievv grid grid-cols-2 divide-x divide-ink/10 py-8 lg:grid-cols-4">
        {items.map((it) => (
          <div key={it.label} className="px-4 text-center first:pl-0 last:pr-0">
            <div className="font-display text-xl font-medium text-ink">{it.value}</div>
            <div className="mono-label mt-1 text-steel/80">{it.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    { n: "01", title: "Submit the brief", body: "Tell BRIEVV what you need, upload existing materials, and set your timeline and jurisdiction." },
    { n: "02", title: "Get an intelligent quote", body: "BRIEVV's estimator classifies the work and returns a scoped price range, timeline, and recommended team." },
    { n: "03", title: "Approve & BRIEVV assembles the team", body: "Once you approve, BRIEVV matches qualified, verified professionals to your project's disciplines." },
    { n: "04", title: "Track delivery", body: "Follow tasks, milestones, files, and messages in a dedicated project workspace until final delivery." },
  ];
  return (
    <section id="how-it-works" className="border-b border-ink/10 py-20 lg:py-28">
      <div className="container-brievv">
        <div className="mono-label mb-4">§ HOW BRIEVV WORKS</div>
        <h2 className="max-w-xl font-display text-3xl font-medium leading-tight text-ink lg:text-4xl">
          From brief to delivery, without the back-and-forth.
        </h2>

        <div className="mt-14 grid gap-px overflow-hidden rounded-md border border-ink/10 bg-ink/10 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="bg-white/60 p-7 backdrop-blur-xl">
              <div className="mono-label text-orange">{s.n}</div>
              <h3 className="mt-4 font-display text-lg font-medium text-ink">{s.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-steel">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const SERVICE_PREVIEW = [
  "Architecture",
  "Structural Engineering",
  "MEP Engineering",
  "Civil Engineering",
  "CAD / Drafting",
  "BIM",
  "Interior Design",
  "Construction Documentation",
  "Permit Packages",
  "Visualization",
  "Estimating",
  "Multidisciplinary",
];

export function ServicesPreview() {
  return (
    <section id="services" className="border-b border-ink/10 bg-white/40 py-20 backdrop-blur-xl lg:py-28">
      <div className="container-brievv">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mono-label mb-4">§ SERVICES</div>
            <h2 className="font-display text-3xl font-medium text-ink lg:text-4xl">Every AEC discipline, one intake.</h2>
          </div>
          <Link href="/services" className={buttonVariants({ variant: "outline" })}>
            View all services <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {SERVICE_PREVIEW.map((s) => (
            <Link
              key={s}
              href={`/services#${s.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              className="rounded border border-ink/10 bg-white/40 px-5 py-4 text-sm font-medium text-ink backdrop-blur-sm transition-colors hover:border-orange/40 hover:bg-orange/[0.06]"
            >
              {s}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function QualitySecurity() {
  const cols = [
    { icon: Workflow, title: "Governed AI", body: "AI recommends; deterministic pricing rules and human review thresholds set the boundaries." },
    { icon: Users2, title: "Verified professionals", body: "Every professional passes a verification workflow before matching begins." },
    { icon: ShieldCheck, title: "Tenant isolation", body: "Organizations only ever see their own projects, files, messages, and invoices." },
    { icon: Gauge, title: "Full audit trail", body: "Every quote change, status change, and payment event is logged for review." },
  ];
  return (
    <section className="border-b border-ink/10 py-20 lg:py-28">
      <div className="container-brievv">
        <div className="mono-label mb-4">§ QUALITY & SECURITY</div>
        <h2 className="max-w-xl font-display text-3xl font-medium leading-tight text-ink lg:text-4xl">
          The best infrastructure for quality work.
        </h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cols.map((c) => (
            <Card key={c.title}>
              <CardBody>
                <c.icon size={20} className="text-orange" strokeWidth={1.75} />
                <h3 className="mt-4 font-display text-base font-medium text-ink">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-steel">{c.body}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className="glass-surface-dark mx-3 mb-4 rounded-xl py-20 text-paper sm:mx-6 sm:mb-6 lg:py-28">
      <div className="container-brievv flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
        <div>
          <h2 className="font-display text-3xl font-medium leading-tight lg:text-4xl">
            Submit the work.
            <br />
            We assemble the team.
          </h2>
          <p className="mt-4 max-w-md text-paper/65">
            Get a scoped price and timeline in minutes — reviewed by BRIEVV before any work begins.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/start" className={buttonVariants({ size: "lg" })}>
            Start a Project <ArrowRight size={17} />
          </Link>
          <Link
            href="/contact"
            className={buttonVariants({ variant: "outline", size: "lg", className: "border-paper/20 text-paper hover:bg-paper/5" })}
          >
            Talk to BRIEVV
          </Link>
        </div>
      </div>
    </section>
  );
}
