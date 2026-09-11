export type PaymentMethod = "card" | "bank" | "mpesa" | "mobile_money" | "ussd" | "qr";

export interface CheckoutParams {
  amount: number;
  currency: string;
  email: string;
  metadata: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
  reference?: string;
  paymentMethod?: PaymentMethod;
  channels?: string[];
  phone?: string;
}

export interface CheckoutResult {
  success: boolean;
  url: string | null;
  reference: string | null;
  accessCode?: string;
  error?: string;
}

export interface VerifyResult {
  success: boolean;
  reference: string;
  status: string;
  amount?: number;
  currency?: string;
  channel?: string;
  paidAt?: string;
  receiptUrl?: string;
  gatewayResponse?: string;
  metadata?: Record<string, unknown>;
  customerEmail?: string;
}

export interface PaymentProvider {
  name: string;
  createCheckout(params: CheckoutParams): Promise<CheckoutResult>;
  verifyPayment(reference: string): Promise<VerifyResult>;
}
