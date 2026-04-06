import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/stripe";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: orgId } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const projects = await db.project.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: orgId } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Enforce plan limits
  const org = await db.organization.findUnique({ where: { id: orgId } });
  const plan = PLANS[org!.plan];
  if (plan.limits.projects !== -1) {
    const count = await db.project.count({ where: { organizationId: orgId } });
    if (count >= plan.limits.projects) {
      return NextResponse.json(
        { error: `Free plan limited to ${plan.limits.projects} projects. Upgrade to Pro.` },
        { status: 403 }
      );
    }
  }

  const { name, description } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const project = await db.project.create({
    data: { name, description, organizationId: orgId },
  });

  return NextResponse.json(project, { status: 201 });
}
