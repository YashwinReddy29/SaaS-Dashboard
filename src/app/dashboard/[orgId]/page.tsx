import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { FolderOpen, Users, TrendingUp, CreditCard } from "lucide-react";

export default async function OverviewPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [projectCount, memberCount, invoices, org] = await Promise.all([
    db.project.count({ where: { organizationId: orgId } }),
    db.membership.count({ where: { organizationId: orgId } }),
    db.invoice.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.organization.findUnique({ where: { id: orgId } }),
  ]);

  const totalRevenue = invoices
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + i.amount, 0);

  const stats = [
    { label: "Total Projects", value: projectCount, icon: FolderOpen, color: "text-blue-600 bg-blue-50" },
    { label: "Team Members", value: memberCount, icon: Users, color: "text-green-600 bg-green-50" },
    { label: "Total Paid", value: formatCurrency(totalRevenue), icon: TrendingUp, color: "text-purple-600 bg-purple-50" },
    { label: "Current Plan", value: org?.plan ?? "FREE", icon: CreditCard, color: "text-indigo-600 bg-indigo-50" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-500 mt-1">Welcome back to {org?.name}</p>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border p-6">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border">
        <div className="p-6 border-b">
          <h2 className="font-semibold text-gray-900">Recent Invoices</h2>
        </div>
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No invoices yet. Upgrade your plan to get started.
          </div>
        ) : (
          <div className="divide-y">
            {invoices.map((inv) => (
              <div key={inv.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{inv.stripeInvoiceId ?? "Invoice"}</p>
                  <p className="text-xs text-gray-500">{new Date(inv.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">{formatCurrency(inv.amount)}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    inv.status === "PAID"
                      ? "bg-green-50 text-green-700"
                      : inv.status === "FAILED"
                      ? "bg-red-50 text-red-700"
                      : "bg-yellow-50 text-yellow-700"
                  }`}>
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
