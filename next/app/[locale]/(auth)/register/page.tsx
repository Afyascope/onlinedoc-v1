import { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Register | OnlineDoc Healthcare",
  description: "Create your OnlineDoc account",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
