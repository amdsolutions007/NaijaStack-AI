import { NextRequest, NextResponse } from 'next/server';
import { initializePayment, verifyPayment } from '@/lib/paystack';

/**
 * POST /api/paystack
 * Initialize a new Paystack payment
 * 
 * @body { email: string, amount: number, plan?: string }
 * @returns { authorization_url: string, reference: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, amount, plan, metadata } = body;

    // Validate required fields
    if (!email || !amount) {
      return NextResponse.json(
        { error: 'Email and amount are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate amount (must be positive)
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Initialize payment with Paystack
    const payment = await initializePayment({
      email,
      amount,
      plan,
      metadata: {
        ...metadata,
        initiated_at: new Date().toISOString(),
        source: 'naijastack-ai',
      },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
    });

    if (!payment.status) {
      return NextResponse.json(
        { error: payment.message || 'Payment initialization failed' },
        { status: 500 }
      );
    }

    // Return payment details
    return NextResponse.json({
      success: true,
      authorization_url: payment.data.authorization_url,
      access_code: payment.data.access_code,
      reference: payment.data.reference,
    });
  } catch (error: any) {
    console.error('Payment initialization error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to initialize payment',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/paystack?reference=xyz123
 * Verify a Paystack transaction
 * 
 * @query reference - Transaction reference to verify
 * @returns { status: string, amount: number, customer: object }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json(
        { error: 'Transaction reference is required' },
        { status: 400 }
      );
    }

    // Verify payment with Paystack
    const verification = await verifyPayment(reference);

    if (!verification.status) {
      return NextResponse.json(
        { error: verification.message || 'Verification failed' },
        { status: 500 }
      );
    }

    const { data } = verification;

    // Return verification result
    return NextResponse.json({
      success: true,
      status: data.status,
      reference: data.reference,
      amount: data.amount,
      currency: data.currency,
      customer: {
        email: data.customer.email,
      },
      paid_at: data.paid_at || null,
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to verify payment',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
