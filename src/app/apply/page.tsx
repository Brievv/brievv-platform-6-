import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ApplicationForm } from "./application-form";

export default function ApplyPage() {
  return (
    <>
      <SiteNav />
      <main className="py-16 lg:py-24">
        <div className="container-brievv">
          <div className="mx-auto max-w-xl text-center">
            <div className="mono-label mb-4">§ APPLY</div>
            <h1 className="font-display text-3xl font-medium text-ink lg:text-4xl">Join the BRIEVV network.</h1>
            <p className="mt-3 text-steel">BRIEVV's ops team reviews every application before you're eligible for project matching.</p>
          </div>
          <div className="mt-10">
            <ApplicationForm />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
