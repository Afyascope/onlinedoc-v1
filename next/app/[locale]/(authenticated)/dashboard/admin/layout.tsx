import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDashboardPath } from "@/lib/clinician-status";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.role !== "admin") {
    if (!session?.user) redirect(`/${params.locale}/login`);
    const dashboardPath = getDashboardPath(session.user as any);
    redirect(`/${params.locale}${dashboardPath}`);
  }

  return children;
}
