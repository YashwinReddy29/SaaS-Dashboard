import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/stripe";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const callerMembership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: orgId } },
  });
  if (!callerMembership || !["OWNER", "ADMIN"].includes(callerMembership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Enforce plan limits
  const org = await db.organization.findUnique({ where: { id: orgId } });
  const plan = PLANS[org!.plan];
  if (plan.limits.members !== -1) {
    const count = await db.membership.count({ where: { organizationId: orgId } });
    if (count >= plan.limits.members) {
      return NextResponse.json(
        { error: `Plan limited to ${plan.limits.members} members. Upgrade to continue.` },
        { status: 403 }
      );
    }
  }

  const { email, role = "MEMBER" } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  let user = await db.user.findUnique({ where: { email } });

  // Auto-create user if they don't exist (invite flow simplified)
  if (!user) {
    user = await db.user.create({ data: { email, name: email.split("@")[0] } });
  }

  const existing = await db.membership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
  });
  if (existing) return NextResponse.json({ error: "Already a member" }, { status: 409 });

  const membership = await db.membership.create({
    data: { userId: user.id, organizationId: orgId, role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(membership, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const callerMembership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: orgId } },
  });
  if (!callerMembership || callerMembership.role !== "OWNER") {
    return NextResponse.json({ error: "Only owners can remove members" }, { status: 403 });
  }

  const { userId } = await req.json();

  await db.membership.delete({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  });

  return NextResponse.json({ success: true });
}
