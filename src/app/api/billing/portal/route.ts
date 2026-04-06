import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId } = await req.json();

  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: orgId } },
    include: { organization: true },
  });

  if (!membership || membership.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!membership.organization.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account found" }, { status: 400 });
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: membership.organization.stripeCustomerId,
    return_url: `${process.env.NEXTAUTH_URL}/dashboard/${orgId}/billing`,
  });

  return NextResponse.json({ url: portalSession.url });
}
