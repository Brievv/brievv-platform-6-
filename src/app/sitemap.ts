import type { MetadataRoute } from "next";

/**
 * Static marketing routes for now. Once /services and /resources are
 * backed by the CMS (spec §83-84), extend this with the dynamic
 * service/case-study/article slugs pulled from the database.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_URL ?? "https://brievv.com";
  const routes = [
    "",
    "/platform",
    "/how-it-works",
    "/services",
    "/for-businesses",
    "/for-professionals",
    "/for-professionals/verification",
    "/pricing",
    "/about",
    "/case-studies",
    "/enterprise",
    "/contact",
    "/resources",
    "/track",
    "/trust",
    "/api-docs",
    "/legal/terms",
    "/legal/privacy",
    "/legal/ai-usage",
  ];
  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
