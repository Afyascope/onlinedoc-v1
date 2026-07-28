"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { IconBrandWhatsapp } from "@tabler/icons-react";

interface WhatsAppButtonProps {
  onClick: () => Promise<{ type: string; url: string } | { error: string }>;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function WhatsAppButton({ onClick, disabled, label = "Start Consultation on WhatsApp", className }: WhatsAppButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const result = await onClick();
    setLoading(false);

    if ("url" in result && result.url) {
      window.open(result.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
        "bg-green-600 text-white hover:bg-green-700",
        "disabled:opacity-50 disabled:pointer-events-none",
        className
      )}
    >
      <IconBrandWhatsapp size={20} />
      {loading ? "Opening WhatsApp..." : label}
    </button>
  );
}
