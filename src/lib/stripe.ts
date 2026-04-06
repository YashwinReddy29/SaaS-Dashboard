import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
  typescript: true,
});

export const PLANS = {
  FREE: {
    name: "Free",
    price: 0,
    priceId: null,
    features: ["3 projects", "2 team members", "Basic analytics", "Email support"],
    limits: { projects: 3, members: 2 },
  },
  PRO: {
    name: "Pro",
    price: 2900, // $29/mo in cents
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    features: ["Unlimited projects", "10 team members", "Advanced analytics", "Priority support", "Custom domains"],
    limits: { projects: -1, members: 10 },
  },
  ENTERPRISE: {
    name: "Enterprise",
    price: 9900, // $99/mo in cents
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    features: ["Unlimited everything", "Unlimited team members", "White-label", "SLA", "Dedicated support", "SSO"],
    limits: { projects: -1, members: -1 },
  },
};

export async function getOrCreateStripeCustomer(
  organizationId: string,
  orgName: string,
  ownerEmail: string
): Promise<string> {
  const { db } = await import("@/lib/db");

  const org = await db.organization.findUnique({
    where: { id: organizationId },
  });

  if (org?.stripeCustomerId) return org.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: ownerEmail,
    name: orgName,
    metadata: { organizationId },
  });

  await db.organization.update({
    where: { id: organizationId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}
