"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Check, Loader2, ExternalLink } from "lucide-react";
import { PLANS } from "@/lib/plans";
import { formatCurrency } from "@/lib/utils";

interface OrgData {
  plan: string;
  stripeSubscriptionId: string | null;
  stripeCurrentPeriodEnd: string | null;
}

export default function BillingPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const searchParams = useSearchParams();
  const [org, setOrg] = useState<OrgData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  useEffect(() => {
    fetch(`/api/organizations/${orgId}`)
      .then((r) => r.json())
      .then(setOrg)
      .finally(() => setLoading(false));
  }, [orgId]);

  async function startCheckout(priceId: string) {
    setCheckoutLoading(priceId);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId, priceId }),
    });
    const { url } = await res.json();
    window.location.href = url;
  }

  async function openPortal() {
    setPortalLoading(true);
    const res = await fetch("/api/billing/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId }),
    });
    const { url } = await res.json();
    window.location.href = url;
  }

  if (loading) {
    return (
      <div className="p-8 flex justify-center pt-24">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const currentPlan = org?.plan ?? "FREE";

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-500 mt-1">Manage your subscription and plan</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-green-700 text-sm">
          ✓ Subscription activated successfully!
        </div>
      )}
      {canceled && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-yellow-700 text-sm">
          Checkout canceled. Your plan was not changed.
        </div>
      )}

      {currentPlan !== "FREE" && org?.stripeCurrentPeriodEnd && (
        <div className="bg-white rounded-xl border p-5 mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Current plan</p>
            <p className="text-lg font-bold text-gray-900">{currentPlan}</p>
            <p className="text-xs text-gray-400 mt-1">
              Renews {new Date(org.stripeCurrentPeriodEnd).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={openPortal}
            disabled={portalLoading}
            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            Manage in Stripe
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {(Object.entries(PLANS) as [string, typeof PLANS.FREE][]).map(([key, plan]) => {
          const isCurrent = currentPlan === key;
          const isPopular = key === "PRO";
          return (
            <div
              key={key}
              className={`bg-white rounded-xl border p-6 relative ${isPopular ? "border-indigo-500 shadow-md" : ""}`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                  Most Popular
                </div>
              )}
              <h3 className="font-bold text-gray-900 text-lg">{plan.name}</h3>
              <div className="mt-2 mb-4">
                <span className="text-3xl font-bold text-gray-900">
                  {plan.price === 0 ? "Free" : formatCurrency(plan.price)}
                </span>
                {plan.price > 0 && <span className="text-gray-500 text-sm">/mo</span>}
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <button disabled className="w-full py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-500">
                  Current Plan
                </button>
              ) : plan.priceId ? (
                <button
                  onClick={() => startCheckout(plan.priceId!)}
                  disabled={!!checkoutLoading}
                  className={`w-full py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
                    isPopular
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "border border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                  } disabled:opacity-50`}
                >
                  {checkoutLoading === plan.priceId && <Loader2 className="h-4 w-4 animate-spin" />}
                  Upgrade to {plan.name}
                </button>
              ) : (
                <button className="w-full py-2 rounded-lg text-sm font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition">
                  Downgrade to Free
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
