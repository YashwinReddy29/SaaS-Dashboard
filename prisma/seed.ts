import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 12);

  const user = await db.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: { name: "Demo User", email: "demo@example.com", password },
  });

  const org = await db.organization.upsert({
    where: { slug: "demo-org" },
    update: {},
    create: {
      name: "Demo Org",
      slug: "demo-org",
      plan: "PRO",
      memberships: { create: { userId: user.id, role: "OWNER" } },
    },
  });

  await db.project.createMany({
    data: [
      { name: "Website Redesign", description: "Revamp the marketing site", organizationId: org.id },
      { name: "Mobile App", description: "iOS and Android apps", organizationId: org.id },
      { name: "API v2", description: "REST API with rate limiting", organizationId: org.id, status: "COMPLETED" },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Seed complete. Login: demo@example.com / password123");
}

main().catch(console.error).finally(() => db.$disconnect());
