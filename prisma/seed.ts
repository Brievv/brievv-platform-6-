import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

/**
 * Development/demo seed data ONLY. Never run this against a production
 * database — there is no environment guard baked into the script itself
 * beyond this comment, so wire a NODE_ENV check into your CI/CD before
 * `db:seed` can ever run against a prod DATABASE_URL.
 */
const db = new PrismaClient();

const DISCIPLINES = [
  "Architecture",
  "Structural Engineering",
  "Civil Engineering",
  "MEP Engineering",
  "Interior Design",
  "CAD / Drafting",
  "BIM",
  "Construction Documentation",
  "Visualization",
  "Estimating",
  "Permit Documentation",
  "Multidisciplinary",
];

async function main() {
  console.log("Seeding BRIEVV development data...");

  // --- Disciplines ---
  const disciplineRows = await Promise.all(
    DISCIPLINES.map((name, i) =>
      db.discipline.upsert({
        where: { name },
        update: {},
        create: { name, slug: slugify(name), sortOrder: i },
      })
    )
  );

  // --- Admin user ---
  const adminPasswordHash = await bcrypt.hash("BrievvAdmin!2026", 12);
  const admin = await db.user.upsert({
    where: { email: "ops@brievv.dev" },
    update: {},
    create: {
      email: "ops@brievv.dev",
      name: "BRIEVV Ops",
      passwordHash: adminPasswordHash,
      role: "OPERATIONS_ADMIN",
      emailVerifiedAt: new Date(),
    },
  });

  // --- Clients ---
  const clientPasswordHash = await bcrypt.hash("BrievvClient!2026", 12);
  const clients = await Promise.all(
    Array.from({ length: 5 }).map((_, i) =>
      db.user.upsert({
        where: { email: `client${i + 1}@brievv.dev` },
        update: {},
        create: {
          email: `client${i + 1}@brievv.dev`,
          name: `Demo Client ${i + 1}`,
          passwordHash: clientPasswordHash,
          role: "CLIENT",
          emailVerifiedAt: new Date(),
          clientProfile: { create: { companyName: `Demo Company ${i + 1}` } },
        },
      })
    )
  );

  // --- Professionals ---
  const proPasswordHash = await bcrypt.hash("BrievvPro!2026", 12);
  const professionals = await Promise.all(
    Array.from({ length: 10 }).map(async (_, i) => {
      const user = await db.user.upsert({
        where: { email: `pro${i + 1}@brievv.dev` },
        update: {},
        create: {
          email: `pro${i + 1}@brievv.dev`,
          name: `Demo Professional ${i + 1}`,
          passwordHash: proPasswordHash,
          role: "PROFESSIONAL",
          emailVerifiedAt: new Date(),
        },
      });
      const discipline = disciplineRows[i % disciplineRows.length]!;
      const profile = await db.professionalProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          title: `${discipline.name} Specialist`,
          yearsExperience: 3 + (i % 12),
          softwareSkills: ["AutoCAD", "Revit"].slice(0, (i % 2) + 1),
          jurisdictions: ["US-CA", "US-TX"].slice(0, (i % 2) + 1),
          hourlyRateCents: 6000 + i * 500,
          status: i % 3 === 0 ? "APPLIED" : "ACTIVE",
          disciplines: { create: { disciplineId: discipline.id } },
        },
      });
      return profile;
    })
  );

  // --- Projects + quotes ---
  for (let i = 0; i < 10; i++) {
    const client = clients[i % clients.length]!;
    const discipline = disciplineRows[i % disciplineRows.length]!;
    const statuses = ["SUBMITTED", "QUOTE_READY", "QUOTE_ACCEPTED", "IN_PROGRESS", "DELIVERED"] as const;
    const project = await db.project.create({
      data: {
        referenceCode: `BRV-2026-${String(i + 1).padStart(6, "0")}`,
        createdByUserId: client.id,
        title: `Demo Project ${i + 1} — ${discipline.name}`,
        scopeDescription: `Sample scope description for demo project ${i + 1}.`,
        status: statuses[i % statuses.length],
        urgency: "standard",
        disciplines: { create: { disciplineId: discipline.id } },
        quotes: {
          create: {
            quoteNumber: `Q-BRV-2026-${String(i + 1).padStart(6, "0")}`,
            status: "READY",
            priceLowCents: 150000 + i * 20000,
            priceHighCents: 220000 + i * 20000,
            timelineText: "2-3 weeks",
            recommendedTeam: [discipline.name],
            scopeSummary: "Demo scope summary.",
            assumptions: ["Demo assumption"],
            exclusions: [],
            risks: [],
          },
        },
      },
    });
    console.log(`Seeded project ${project.referenceCode}`);
  }

  console.log("Seed complete.");
  console.log("Demo admin login: ops@brievv.dev / BrievvAdmin!2026");
  console.log("Demo client login: client1@brievv.dev / BrievvClient!2026");
  console.log("Demo professional login: pro1@brievv.dev / BrievvPro!2026");
}

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
