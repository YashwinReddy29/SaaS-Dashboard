import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;  // ← Promise now
}) {
  const { orgId } = await params;  // ← await it
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: { userId: session.user.id, organizationId: orgId },
    },
    include: {
      organization: true,
      user: true,
    },
  });

  if (!membership) redirect("/dashboard");

  const allMemberships = await db.membership.findMany({
    where: { userId: session.user.id },
    include: { organization: true },
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        org={membership.organization}
        role={membership.role}
        user={membership.user}
        allOrgs={allMemberships.map((m) => m.organization)}
        orgId={orgId}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
