// import "server-only";
import type { PaymentProvider, CheckoutParams, CheckoutResult, VerifyResult, PaymentMethod } from "./payment-service";

export class PaystackProvider implements PaymentProvider {
  name = "paystack";
  private secretKey: string;
  private baseUrl = "https://api.paystack.co";

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  private async request(endpoint: string, body?: Record<string, unknown>) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        method: body ? "POST" : "GET",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || `Paystack HTTP ${res.status}`);
      }
      return data;
    } finally {
      clearTimeout(timeout);
    }
  }

  async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
    try {
      const channels: string[] = params.channels ?? ["card", "bank", "ussd", "qr"];
      if (!params.channels && (params.paymentMethod === "mpesa" || params.paymentMethod === "mobile_money")) {
        channels.push("mobile_money");
      }

      // Paystack expects the amount in the lowest denomination (kobo for KES).
      // OnlineDoc prices are whole KES integers, so `amount * 100` is exact.
      const amountInMinor = Math.round(params.amount * 100);

      const body: Record<string, unknown> = {
        email: params.email,
        amount: amountInMinor,
        currency: params.currency,
        metadata: params.metadata,
        channels,
        callback_url: params.successUrl,
      };

      if (params.reference) {
        body.reference = params.reference;
      }

      if (params.phone) {
        body.phone = params.phone;
      }

      const data = await this.request("/transaction/initialize", body);

      if (!data.status) {
        return { success: false, url: null, reference: null, error: data.message || "Paystack error" };
      }

      return {
        success: true,
        url: data.data.authorization_url,
        reference: data.data.reference,
        accessCode: data.data.access_code,
      };
    } catch (e: any) {
      return { success: false, url: null, reference: null, error: e.message || "Paystack error" };
    }
  }

  async verifyPayment(reference: string): Promise<VerifyResult> {
    try {
      const data = await this.request(`/transaction/verify/${encodeURIComponent(reference)}`);

      if (!data.status) {
        return { success: false, reference, status: "unknown", gatewayResponse: data.message };
      }

      const tx = data.data;
      return {
        success: tx.status === "success",
        // The gateway response is authoritative. Do not echo the requested
        // reference when Paystack returns a different transaction.
        reference: tx.reference || "",
        status: tx.status || "failed",
        amount: tx.amount ? tx.amount / 100 : undefined,
        currency: tx.currency,
        channel: tx.channel,
        paidAt: tx.paid_at,
        receiptUrl: tx.receipt_url,
        gatewayResponse: tx.gateway_response,
        metadata: tx.metadata,
        customerEmail: tx.customer?.email,
      };
    } catch (e: any) {
      return { success: false, reference, status: "error", gatewayResponse: e.message || "Verification error" };
    }
  }
}
