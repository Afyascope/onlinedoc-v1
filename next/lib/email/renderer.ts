import "server-only";
import { createElement } from "react";
import type { ReactElement } from "react";
import { VerifyEmail } from "./templates/VerifyEmail";
import { WelcomeEmail } from "./templates/WelcomeEmail";
import { ResetPassword } from "./templates/ResetPassword";
import { ConsultationBooked } from "./templates/ConsultationBooked";
import { ConsultationReminder } from "./templates/ConsultationReminder";
import { ClinicianApproved } from "./templates/ClinicianApproved";
import { MarketplaceReceipt, type ReceiptItem } from "./templates/MarketplaceReceipt";
import { ProductDownload } from "./templates/ProductDownload";
import { OrderStatus } from "./templates/OrderStatus";
import { PasswordChanged } from "./templates/PasswordChanged";
import { ContactMessage } from "./templates/ContactMessage";

// This module is server-only. Loading the Node renderer at runtime prevents
// Next's React Server Component transform from treating it as a component import.
const { renderToStaticMarkup } = require("react-dom/server") as {
  renderToStaticMarkup(element: ReactElement): string;
};

export type EmailTemplate = "verify-email" | "welcome" | "reset-password" | "password-changed" | "consultation-booked" | "consultation-reminder" | "clinician-approved" | "marketplace-receipt" | "product-download" | "order-status" | "contact-message";
export type EmailProps = Record<string, unknown>;

/** Render React email templates only in the server email-rendering boundary. */
export function renderEmail(template: EmailTemplate, props: EmailProps): string {
  const element = (() => {
    switch (template) {
      case "verify-email": return createElement(VerifyEmail, props as { name?: string; verificationUrl: string; expiresIn?: string });
      case "welcome": return createElement(WelcomeEmail, props as { name?: string; dashboardUrl: string });
      case "reset-password": return createElement(ResetPassword, props as { resetUrl: string; expiresIn?: string });
      case "password-changed": return createElement(PasswordChanged, props as { name?: string });
      case "consultation-booked": return createElement(ConsultationBooked, props as { recipientName?: string; title: string; consultationUrl: string; role?: "patient" | "clinician" });
      case "consultation-reminder": return createElement(ConsultationReminder, props as { name?: string; title: string; date: string; url: string });
      case "clinician-approved": return createElement(ClinicianApproved, props as { name?: string; dashboardUrl: string; approved?: boolean; reason?: string });
      case "marketplace-receipt": return createElement(MarketplaceReceipt, props as { name?: string; orderId: string; items: ReceiptItem[]; total: string; currency: string; libraryUrl: string });
      case "product-download": return createElement(ProductDownload, props as { name?: string; productName: string; downloadUrl: string });
      case "order-status": return createElement(OrderStatus, props as { name?: string; orderId: string; status: string; url: string });
      case "contact-message": return createElement(ContactMessage, props as { name: string; email: string; phone?: string; message: string });
    }
  })();

  return `<!doctype html>${renderToStaticMarkup(element)}`;
}
