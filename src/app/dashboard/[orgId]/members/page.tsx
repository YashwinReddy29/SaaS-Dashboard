import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { InviteMemberForm } from "@/components/dashboard/invite-member-form";

export default async function MembersPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: orgId } },
  });
  if (!membership) redirect("/dashboard");

  const members = await db.membership.findMany({
    where: { organizationId: orgId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { createdAt: "asc" },
  });

  const canManage = ["OWNER", "ADMIN"].includes(membership.role);

  const roleColors = {
    OWNER: "bg-purple-50 text-purple-700",
    ADMIN: "bg-blue-50 text-blue-700",
    MEMBER: "bg-gray-50 text-gray-700",
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-500 mt-1">{members.length} member{members.length !== 1 ? "s" : ""}</p>
        </div>
        {canManage && <InviteMemberForm orgId={orgId} />}
      </div>

      <div className="bg-white rounded-xl border divide-y">
        {members.map(({ user, role, createdAt }) => (
          <div key={user.id} className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                {user.name?.[0] ?? user.email?.[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user.name ?? "—"}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleColors[role]}`}>
                {role}
              </span>
              <span className="text-xs text-gray-400">
                Joined {new Date(createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
