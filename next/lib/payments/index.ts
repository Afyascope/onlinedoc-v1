import "server-only";
import type { PaymentProvider, PaymentMethod } from "./payment-service";
export type { PaymentProvider, PaymentMethod } from "./payment-service";
export type { CheckoutParams, CheckoutResult, VerifyResult } from "./payment-service";
export { PaystackProvider } from "./paystack-provider";

export function getPaymentProvider(): PaymentProvider {
  const { PaystackProvider } = require("./paystack-provider");
  const { MockProvider } = require("./mock-provider");

  const paystackKey = process.env.PAYSTACK_SECRET_KEY;
  if (paystackKey) return new PaystackProvider(paystackKey);

  if (process.env.NODE_ENV === "production") {
    throw new Error("PAYSTACK_SECRET_KEY is not configured");
  }
  return new MockProvider();
}
