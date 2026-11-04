import { redirect } from "next/navigation";

export default function SignUpRedirect({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/register`);
}
