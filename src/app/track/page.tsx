import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { TrackForm } from "./track-form";

export default function TrackPage() {
  return (
    <>
      <SiteNav />
      <main className="py-16 lg:py-24">
        <div className="container-brievv">
          <div className="mx-auto max-w-md text-center">
            <div className="mono-label mb-4">§ TRACK</div>
            <h1 className="font-display text-3xl font-medium text-ink lg:text-4xl">Track your project.</h1>
            <p className="mt-3 text-steel">Enter the reference code from your confirmation, and the email you submitted the brief with.</p>
          </div>
          <div className="mt-10">
            <TrackForm />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
