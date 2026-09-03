import Link from "next/link";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { buttonVariants } from "@/components/ui/button";

const SERVICES = [
  { name: "Architecture", body: "Concept through construction documents — residential, commercial, and mixed-use." },
  { name: "Structural Engineering", body: "Analysis, calculations, and stamped drawings for new construction and retrofits." },
  { name: "MEP Engineering", body: "Mechanical, electrical, and plumbing systems design and coordination." },
  { name: "Civil Engineering", body: "Site design, grading, drainage, and utility coordination." },
  { name: "CAD / Drafting", body: "Fast, precise drafting from sketches, redlines, or as-built surveys." },
  { name: "BIM", body: "Coordinated 3D models across disciplines, clash detection, and model-based deliverables." },
  { name: "Interior Design", body: "Space planning, finishes, and construction-ready interior documentation." },
  { name: "Construction Documentation", body: "Complete permit and construction sets, coordinated across disciplines." },
  { name: "Permit Packages", body: "Jurisdiction-specific packages assembled and formatted for submittal." },
  { name: "Visualization", body: "Renderings and walkthroughs for design review and client presentation." },
  { name: "Estimating", body: "Quantity takeoffs and cost estimates tied to your actual drawing set." },
  { name: "Multidisciplinary", body: "Full project teams coordinated by BRIEVV across every discipline above." },
];

export default function ServicesPage() {
  return (
    <>
      <SiteNav />
      <main className="py-16 lg:py-24">
        <div className="container-brievv">
          <div className="mono-label mb-4">§ SERVICES</div>
          <h1 className="max-w-2xl font-display text-3xl font-medium leading-tight text-ink lg:text-4xl">
            Every AEC discipline, one intake.
          </h1>
          <p className="mt-4 max-w-xl text-steel">
            Submit one brief covering any combination of these — BRIEVV coordinates the team so you don't have to.
          </p>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <div
                key={s.name}
                id={s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                className="glass-surface scroll-mt-24 rounded-md p-6"
              >
                <h2 className="font-display text-lg font-medium text-ink">{s.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-steel">{s.body}</p>
                <Link href="/start" className="mt-4 inline-block text-sm font-medium text-orange hover:underline">
                  Start a project →
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Link href="/start" className={buttonVariants({ size: "lg" })}>
              Submit a Brief
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
