import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your OnlineDoc dashboard",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
