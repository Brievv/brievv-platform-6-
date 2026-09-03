import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";

export function MarketingPageShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children?: React.ReactNode;
}) {
  return (
    <>
      <SiteNav />
      <main className="py-16 lg:py-24">
        <div className="container-brievv">
          <div className="glass-surface mx-auto max-w-3xl rounded-xl p-8 sm:p-12">
            <div className="mono-label mb-4">{eyebrow}</div>
            <h1 className="font-display text-3xl font-medium leading-tight text-ink lg:text-4xl">{title}</h1>
            {intro && <p className="mt-4 text-base leading-relaxed text-steel">{intro}</p>}
            {children && <div className="prose-brievv mt-8 space-y-5 text-sm leading-relaxed text-ink">{children}</div>}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
