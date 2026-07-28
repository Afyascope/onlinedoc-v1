import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | OnlineDoc Healthcare",
  description: "Your OnlineDoc dashboard",
};

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
