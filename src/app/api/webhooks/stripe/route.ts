import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error("[WEBHOOK] Invalid signature:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("[WEBHOOK] event type:", event.type);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("[WEBHOOK] checkout session:", JSON.stringify({
          id: session.id,
          subscription: session.subscription,
          metadata: session.metadata,
          mode: session.mode,
        }));

        if (session.mode !== "subscription") break;

        const subscriptionId = session.subscription as string;
        if (!subscriptionId) {
          console.error("[WEBHOOK] No subscription ID in checkout session");
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const orgId = session.metadata?.organizationId;

        if (!orgId) {
          console.error("[WEBHOOK] No organizationId in metadata");
          break;
        }

        const priceId = subscription.items.data[0].price.id;
        let plan: "FREE" | "PRO" | "ENTERPRISE" = "FREE";
        if (priceId === process.env.STRIPE_PRO_PRICE_ID) plan = "PRO";
        if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) plan = "ENTERPRISE";

        console.log("[WEBHOOK] updating org", orgId, "to plan", plan);

        await db.organization.update({
          where: { id: orgId },
          data: {
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
            plan,
          },
        });

        await db.invoice.create({
          data: {
            organizationId: orgId,
            amount: session.amount_total ?? 0,
            status: "PAID",
            stripeInvoiceId: session.id,
          },
        });

        console.log("[WEBHOOK] org updated successfully");
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string;
        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const orgId = subscription.metadata?.organizationId;

        await db.organization.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            stripeCurrentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
          },
        });

        if (orgId) {
          await db.invoice.create({
            data: {
              organizationId: orgId,
              amount: invoice.amount_paid,
              status: "PAID",
              stripeInvoiceId: invoice.id,
            },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string;
        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const orgId = subscription.metadata?.organizationId;

        if (orgId) {
          await db.invoice.create({
            data: {
              organizationId: orgId,
              amount: invoice.amount_due,
              status: "FAILED",
              stripeInvoiceId: invoice.id,
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await db.organization.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            plan: "FREE",
            stripeSubscriptionId: null,
            stripePriceId: null,
            stripeCurrentPeriodEnd: null,
          },
        });
        break;
      }
    }
  } catch (err: any) {
    console.error("[WEBHOOK] handler error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
