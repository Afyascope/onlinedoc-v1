import { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Login | OnlineDoc Healthcare",
  description: "Sign in to your OnlineDoc account",
};

export default function LoginPage() {
  return <LoginForm />;
}
