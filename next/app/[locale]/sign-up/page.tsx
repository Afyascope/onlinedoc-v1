import { Metadata } from "next";
import { AmbientColor } from "@/components/decorations/ambient-color";
import { Register } from "@/components/register";
import { generateMetadataObject } from '@/lib/shared/metadata';

export const metadata: Metadata = generateMetadataObject(null, { locale: "en" });

export default function RegisterPage() {
  return (
    <div className="relative overflow-hidden">
      <AmbientColor />
      <Register />
    </div>
  );
}
