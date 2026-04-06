import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    console.log("[CHECKOUT] session:", session?.user?.id ?? "NO SESSION");
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { orgId, priceId } = await req.json();
    console.log("[CHECKOUT] orgId:", orgId, "priceId:", priceId);

    const membership = await db.membership.findUnique({
      where: { userId_organizationId: { userId: session.user.id, organizationId: orgId } },
      include: { organization: true, user: true },
    });
    console.log("[CHECKOUT] membership role:", membership?.role ?? "NONE");

    if (!membership || membership.role !== "OWNER") {
      return NextResponse.json({ error: "Only owners can manage billing" }, { status: 403 });
    }

    const customerId = await getOrCreateStripeCustomer(
      orgId,
      membership.organization.name,
      session.user.email!
    );
    console.log("[CHECKOUT] customerId:", customerId);

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXTAUTH_URL}/dashboard/${orgId}/billing?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/${orgId}/billing?canceled=true`,
      metadata: { organizationId: orgId },
      subscription_data: { metadata: { organizationId: orgId } },
    });
    console.log("[CHECKOUT] session url:", checkoutSession.url);

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err: any) {
    console.error("[CHECKOUT] error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
