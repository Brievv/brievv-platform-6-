import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ContactForm } from "./contact-form";

export default function ContactPage() {
  return (
    <>
      <SiteNav />
      <main className="py-16 lg:py-24">
        <div className="container-brievv">
          <div className="mx-auto max-w-lg text-center">
            <div className="mono-label mb-4">§ CONTACT</div>
            <h1 className="font-display text-3xl font-medium text-ink lg:text-4xl">Talk to BRIEVV.</h1>
            <p className="mt-3 text-steel">Sales, enterprise, professional applications, or support — one form routes to the right team.</p>
          </div>
          <div className="mt-10">
            <ContactForm />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
