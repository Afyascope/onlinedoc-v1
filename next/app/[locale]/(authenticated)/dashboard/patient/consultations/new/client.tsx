"use client";

import { ConsultationForm } from "@/components/consultations/ConsultationForm";
import { useRouter } from "next/navigation";

export function NewConsultationClient() {
  const router = useRouter();

  const handleSuccess = (consultationId: string) => {
    router.push(`/dashboard/patient/consultations/${consultationId}/payment`);
  };

  return <ConsultationForm onSuccess={handleSuccess} />;
}
