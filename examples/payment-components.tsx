/**
 * Example: Payment Button Component
 * 
 * Usage in your Next.js app:
 * 
 * import { PaystackButton } from '@/components/PaystackButton'
 * 
 * <PaystackButton
 *   email="customer@example.com"
 *   amount={50000} // ₦500
 *   onSuccess={(reference) => console.log('Paid!', reference)}
 * />
 */

'use client';

import { useState } from 'react';

interface PaystackButtonProps {
  email: string;
  amount: number;
  plan?: string;
  metadata?: Record<string, any>;
  buttonText?: string;
  onSuccess?: (reference: string) => void;
  onError?: (error: string) => void;
}

export function PaystackButton({
  email,
  amount,
  plan,
  metadata,
  buttonText = 'Pay Now',
  onSuccess,
  onError,
}: PaystackButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    try {
      // Initialize payment
      const response = await fetch('/api/paystack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, amount, plan, metadata }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment initialization failed');
      }

      // Redirect to Paystack payment page
      window.location.href = data.authorization_url;
    } catch (error: any) {
      console.error('Payment error:', error);
      onError?.(error.message);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
    >
      {loading ? 'Processing...' : buttonText}
    </button>
  );
}

/**
 * Example: Payment Callback Page
 * 
 * Create this at: app/payment/callback/page.tsx
 * 
 * This page handles the redirect after Paystack payment
 */

export async function PaymentCallbackPage({
  searchParams,
}: {
  searchParams: { reference?: string };
}) {
  const reference = searchParams.reference;

  if (!reference) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Invalid Payment Reference
          </h1>
          <a href="/" className="text-blue-600 hover:underline">
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  // Verify payment
  const verifyResponse = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/paystack?reference=${reference}`,
    { cache: 'no-store' }
  );

  const verification = await verifyResponse.json();

  if (verification.status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-green-600 mb-4">
            Payment Successful!
          </h1>
          <p className="text-gray-600 mb-6">
            Your payment of{' '}
            <span className="font-bold">
              ₦{(verification.amount / 100).toLocaleString()}
            </span>{' '}
            has been received.
          </p>
          <div className="bg-gray-100 p-4 rounded mb-6">
            <p className="text-sm text-gray-500">Reference:</p>
            <p className="font-mono text-sm">{reference}</p>
          </div>
          <a
            href="/dashboard"
            className="inline-block px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-3xl font-bold text-red-600 mb-4">
          Payment Failed
        </h1>
        <p className="text-gray-600 mb-6">
          We couldn't process your payment. Please try again.
        </p>
        <a
          href="/pricing"
          className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
        >
          Try Again
        </a>
      </div>
    </div>
  );
}
