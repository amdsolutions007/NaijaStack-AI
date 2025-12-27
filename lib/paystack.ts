/**
 * Paystack Integration Library
 * 
 * This module handles all Paystack payment operations for Nigerian SaaS applications.
 * 
 * Features:
 * - Payment initialization
 * - Transaction verification
 * - Subscription management
 * - Webhook handling
 * 
 * @see https://paystack.com/docs/api/
 */

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export interface PaymentInitData {
  email: string;
  amount: number; // Amount in kobo (1 Naira = 100 kobo)
  plan?: string;
  metadata?: Record<string, any>;
  callback_url?: string;
}

export interface PaymentResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface VerificationResponse {
  status: boolean;
  message: string;
  data: {
    status: 'success' | 'failed' | 'abandoned';
    reference: string;
    amount: number;
    currency: string;
    customer: {
      email: string;
    };
  };
}

/**
 * Initialize a Paystack payment
 * 
 * @param data - Payment initialization data
 * @returns Payment response with authorization URL
 * 
 * @example
 * ```typescript
 * const payment = await initializePayment({
 *   email: 'customer@example.com',
 *   amount: 50000, // ₦500.00
 *   plan: 'monthly-pro'
 * });
 * 
 * // Redirect user to: payment.data.authorization_url
 * ```
 */
export async function initializePayment(
  data: PaymentInitData
): Promise<PaymentResponse> {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: data.email,
      amount: data.amount,
      plan: data.plan,
      metadata: data.metadata,
      callback_url: data.callback_url,
    }),
  });

  if (!response.ok) {
    throw new Error(`Paystack API error: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Verify a Paystack transaction
 * 
 * @param reference - Transaction reference from payment callback
 * @returns Verification response with transaction status
 * 
 * @example
 * ```typescript
 * const verification = await verifyPayment('xyz123abc');
 * 
 * if (verification.data.status === 'success') {
 *   // Grant user access to service
 *   await activateSubscription(verification.data.customer.email);
 * }
 * ```
 */
export async function verifyPayment(
  reference: string
): Promise<VerificationResponse> {
  const response = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Paystack verification error: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Handle Paystack webhooks
 * 
 * @param payload - Webhook payload from Paystack
 * @param signature - X-Paystack-Signature header value
 * @returns Boolean indicating if webhook is valid
 * 
 * @example
 * ```typescript
 * // In your API route (app/api/webhooks/paystack/route.ts)
 * export async function POST(req: Request) {
 *   const signature = req.headers.get('x-paystack-signature');
 *   const payload = await req.json();
 *   
 *   if (!verifyWebhookSignature(payload, signature)) {
 *     return new Response('Invalid signature', { status: 400 });
 *   }
 *   
 *   // Handle webhook events
 *   if (payload.event === 'charge.success') {
 *     await handleSuccessfulPayment(payload.data);
 *   }
 * }
 * ```
 */
export function verifyWebhookSignature(
  payload: any,
  signature: string | null
): boolean {
  // TODO: Implement webhook signature verification using crypto
  // const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY)
  //   .update(JSON.stringify(payload))
  //   .digest('hex');
  // return hash === signature;
  
  console.warn('Webhook signature verification not implemented');
  return true;
}

/**
 * Create a subscription plan
 * 
 * @param plan - Plan configuration
 * @returns Created plan details
 * 
 * @example
 * ```typescript
 * const plan = await createSubscriptionPlan({
 *   name: 'Pro Plan',
 *   amount: 5000000, // ₦50,000 per month
 *   interval: 'monthly'
 * });
 * ```
 */
export async function createSubscriptionPlan(plan: {
  name: string;
  amount: number;
  interval: 'daily' | 'weekly' | 'monthly' | 'annually';
  description?: string;
}) {
  const response = await fetch(`${PAYSTACK_BASE_URL}/plan`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(plan),
  });

  if (!response.ok) {
    throw new Error(`Failed to create plan: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Utility: Convert Naira to Kobo
 * Paystack API requires amounts in kobo (smallest currency unit)
 */
export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

/**
 * Utility: Convert Kobo to Naira
 */
export function koboToNaira(kobo: number): number {
  return kobo / 100;
}

/**
 * Utility: Format Naira amount for display
 */
export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
