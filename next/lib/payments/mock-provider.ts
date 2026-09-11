import type { PaymentProvider, CheckoutParams, CheckoutResult, VerifyResult } from "./payment-service";

export class MockProvider implements PaymentProvider {
  name = "mock";

  async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
    const ref = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const url = params.successUrl
      ? `${params.successUrl}${params.successUrl.includes("?") ? "&" : "?"}reference=${ref}&trxref=${ref}`
      : null;
    return { success: true, url, reference: ref, accessCode: ref };
  }

  async verifyPayment(reference: string): Promise<VerifyResult> {
    return {
      success: true,
      reference,
      status: "success",
      amount: 5000,
      currency: process.env.PAYSTACK_CURRENCY || "KES",
      channel: "card",
      paidAt: new Date().toISOString(),
      receiptUrl: undefined,
      gatewayResponse: "Successful (mock)",
    };
  }
}
