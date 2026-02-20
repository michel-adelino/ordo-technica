import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe, SUBSCRIPTION_AMOUNT, SUBSCRIPTION_CURRENCY } from '@/lib/stripe';
import { updateUserSubscriptionData } from '@/lib/subscription';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create Stripe customer
    const subscriptionData = await import('@/lib/subscription').then((m) =>
      m.getUserSubscriptionData(userId)
    );

    let customerId = subscriptionData.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: {
          clerkUserId: userId,
        },
      });
      customerId = customer.id;

      // Save customer ID to user metadata
      await updateUserSubscriptionData(userId, {
        stripeCustomerId: customerId,
      });
    }

    // Create checkout session with price data directly (no price ID needed)
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: SUBSCRIPTION_CURRENCY,
            product_data: {
              name: 'Ordo Technica Monthly Subscription',
              description: 'Unlimited AI-powered real estate listing generations',
            },
            unit_amount: SUBSCRIPTION_AMOUNT * 100, // Convert to cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${request.headers.get('origin')}/dashboard?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/pricing?subscription=cancelled`,
      subscription_data: {
        // No trial_period_days - users already get 2 free listings before subscribing
        metadata: {
          clerkUserId: userId,
        },
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
