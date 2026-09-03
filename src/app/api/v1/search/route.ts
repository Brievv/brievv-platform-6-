import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const STAFF_ROLES = ["SUPER_ADMIN", "OPERATIONS_ADMIN", "PROJECT_MANAGER", "FINANCE_ADMIN", "QUALITY_MANAGER", "SUPPORT_AGENT"];

export interface SearchResult {
  type: "project" | "quote" | "professional" | "client";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

/**
 * GET /api/v1/search?q=...
 *
 * Scoped by role: a client only ever searches their own projects/quotes
 * (never other clients' data — same tenant-isolation rule as everywhere
 * else in this app); staff search across everything.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;
  const isStaff = STAFF_ROLES.includes(role);

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const results: SearchResult[] = [];

  const projects = await db.project.findMany({
    where: {
      ...(isStaff ? {} : { createdByUserId: userId }),
      OR: [{ title: { contains: q, mode: "insensitive" } }, { referenceCode: { contains: q, mode: "insensitive" } }],
    },
    take: 5,
  });
  for (const p of projects) {
    results.push({ type: "project", id: p.id, title: p.title, subtitle: p.referenceCode, href: `/dashboard/projects/${p.id}` });
  }

  const quotes = await db.quote.findMany({
    where: {
      quoteNumber: { contains: q, mode: "insensitive" },
      ...(isStaff ? {} : { project: { createdByUserId: userId } }),
    },
    include: { project: true },
    take: 5,
  });
  for (const quo of quotes) {
    results.push({
      type: "quote",
      id: quo.id,
      title: quo.quoteNumber,
      subtitle: quo.project.title,
      href: `/dashboard/quotes/${quo.id}`,
    });
  }

  if (isStaff) {
    const professionals = await db.professionalProfile.findMany({
      where: { user: { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } },
      include: { user: true },
      take: 5,
    });
    for (const pro of professionals) {
      results.push({
        type: "professional",
        id: pro.id,
        title: pro.user.name,
        subtitle: pro.user.email,
        href: `/admin/professionals`,
      });
    }

    const clients = await db.user.findMany({
      where: {
        role: "CLIENT",
        OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }],
      },
      take: 5,
    });
    for (const c of clients) {
      results.push({ type: "client", id: c.id, title: c.name, subtitle: c.email, href: `/admin/clients` });
    }
  }

  return NextResponse.json({ results: results.slice(0, 15) });
}
