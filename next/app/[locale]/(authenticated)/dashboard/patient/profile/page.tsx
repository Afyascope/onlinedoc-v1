import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PatientProfileClient } from "./client";

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;

  return <PatientProfileClient user={user ? { id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified } : null} />;
}
