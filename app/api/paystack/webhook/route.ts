import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * POST /api/paystack/webhook
 * Handle Paystack webhook events
 * 
 * Supported events:
 * - charge.success: Payment completed successfully
 * - subscription.create: New subscription created
 * - subscription.disable: Subscription cancelled
 * - invoice.create: New invoice generated
 * 
 * @see https://paystack.com/docs/payments/webhooks/
 */
export async function POST(request: NextRequest) {
  try {
    // Get webhook signature from headers
    const signature = request.headers.get('x-paystack-signature');
    
    if (!signature) {
      console.error('Missing Paystack signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Get raw body for signature verification
    const body = await request.text();
    
    // Verify webhook signature
    const secret = process.env.PAYSTACK_SECRET_KEY || '';
    const hash = crypto
      .createHmac('sha512', secret)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse webhook payload
    const payload = JSON.parse(body);
    const { event, data } = payload;

    console.log(`Received webhook: ${event}`, data);

    // Handle different webhook events
    switch (event) {
      case 'charge.success':
        await handleSuccessfulPayment(data);
        break;

      case 'subscription.create':
        await handleSubscriptionCreated(data);
        break;

      case 'subscription.disable':
        await handleSubscriptionCancelled(data);
        break;

      case 'invoice.create':
        await handleInvoiceCreated(data);
        break;

      case 'transfer.success':
        await handleTransferSuccess(data);
        break;

      case 'transfer.failed':
        await handleTransferFailed(data);
        break;

      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    // Always return 200 OK to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    
    // Still return 200 to prevent Paystack from retrying
    return NextResponse.json({ received: true });
  }
}

/**
 * Handle successful payment
 */
async function handleSuccessfulPayment(data: any) {
  const { reference, amount, customer, metadata } = data;
  
  console.log('💰 Payment successful:', {
    reference,
    amount: amount / 100, // Convert kobo to naira
    email: customer.email,
    metadata,
  });

  // TODO: Implement your business logic here
  // Examples:
  // - Update user subscription status in database
  // - Send confirmation email
  // - Grant access to premium features
  // - Log transaction for analytics
  
  // Example implementation:
  // await db.transaction.create({
  //   reference,
  //   amount,
  //   customer_email: customer.email,
  //   status: 'success',
  //   metadata,
  // });
  
  // await sendEmail({
  //   to: customer.email,
  //   subject: 'Payment Successful',
  //   template: 'payment-success',
  //   data: { amount: amount / 100, reference },
  // });
}

/**
 * Handle new subscription
 */
async function handleSubscriptionCreated(data: any) {
  const { subscription_code, customer, plan } = data;
  
  console.log('🔄 Subscription created:', {
    subscription_code,
    email: customer.email,
    plan: plan.name,
  });

  // TODO: Activate user subscription
  // await db.subscription.create({
  //   code: subscription_code,
  //   customer_email: customer.email,
  //   plan_code: plan.plan_code,
  //   status: 'active',
  // });
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancelled(data: any) {
  const { subscription_code, customer } = data;
  
  console.log('❌ Subscription cancelled:', {
    subscription_code,
    email: customer.email,
  });

  // TODO: Deactivate user subscription
  // await db.subscription.update({
  //   where: { code: subscription_code },
  //   data: { status: 'cancelled' },
  // });
  
  // await sendEmail({
  //   to: customer.email,
  //   subject: 'Subscription Cancelled',
  //   template: 'subscription-cancelled',
  // });
}

/**
 * Handle invoice creation
 */
async function handleInvoiceCreated(data: any) {
  const { invoice_code, customer, amount } = data;
  
  console.log('📄 Invoice created:', {
    invoice_code,
    email: customer.email,
    amount: amount / 100,
  });

  // TODO: Store invoice and send to customer
  // await db.invoice.create({
  //   code: invoice_code,
  //   customer_email: customer.email,
  //   amount,
  //   status: 'pending',
  // });
}

/**
 * Handle successful transfer
 */
async function handleTransferSuccess(data: any) {
  const { transfer_code, amount, recipient } = data;
  
  console.log('💸 Transfer successful:', {
    transfer_code,
    amount: amount / 100,
    recipient,
  });

  // TODO: Update transfer status
}

/**
 * Handle failed transfer
 */
async function handleTransferFailed(data: any) {
  const { transfer_code, amount, recipient } = data;
  
  console.log('⚠️ Transfer failed:', {
    transfer_code,
    amount: amount / 100,
    recipient,
  });

  // TODO: Handle failed transfer (refund, retry, notify admin)
}
