export const PLANS = {
  FREE: {
    name: "Free",
    price: 0,
    priceId: null as string | null,
    features: ["3 projects", "2 team members", "Basic analytics", "Email support"],
    limits: { projects: 3, members: 2 },
  },
  PRO: {
    name: "Pro",
    price: 2900,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? null,
    features: ["Unlimited projects", "10 team members", "Advanced analytics", "Priority support", "Custom domains"],
    limits: { projects: -1, members: 10 },
  },
  ENTERPRISE: {
    name: "Enterprise",
    price: 9900,
    priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID ?? null,
    features: ["Unlimited everything", "Unlimited team members", "White-label", "SLA", "Dedicated support", "SSO"],
    limits: { projects: -1, members: -1 },
  },
};
