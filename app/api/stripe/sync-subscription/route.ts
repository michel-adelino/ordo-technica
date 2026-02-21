import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import { getUserSubscriptionData, updateUserSubscriptionData } from '@/lib/subscription';

/**
 * Sync subscription status from Stripe
 * This is called after checkout completion to verify subscription status
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Retrieve checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid' && session.subscription) {
      // Get subscription details
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      const subscriptionData = await getUserSubscriptionData(userId);

      // Update subscription status
      // Access current_period_end with type assertion (property exists on Subscription)
      const currentPeriodEnd = (subscription as any).current_period_end as number | null | undefined;
      const endDate = currentPeriodEnd
        ? new Date(currentPeriodEnd * 1000).toISOString()
        : undefined;
      
      await updateUserSubscriptionData(userId, {
        subscriptionStatus: subscription.status as any,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        subscriptionEndDate: endDate,
      });

      return NextResponse.json({
        success: true,
        subscriptionStatus: subscription.status,
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Payment not completed',
    });
  } catch (error) {
    console.error('Sync subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to sync subscription' },
      { status: 500 }
    );
  }
}

/**
 * Get subscription status by querying Stripe directly
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscriptionData = await getUserSubscriptionData(userId);

    // If user has a Stripe subscription ID, check it directly
    if (subscriptionData.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(
          subscriptionData.stripeSubscriptionId
        );

        // Update local status if it differs
        if (subscription.status !== subscriptionData.subscriptionStatus) {
          // Access current_period_end with type assertion (property exists on Subscription)
          const currentPeriodEnd = (subscription as any).current_period_end as number | null | undefined;
          const endDate = currentPeriodEnd
            ? new Date(currentPeriodEnd * 1000).toISOString()
            : undefined;
          
          await updateUserSubscriptionData(userId, {
            subscriptionStatus: subscription.status as any,
            subscriptionEndDate: endDate,
          });

          return NextResponse.json({
            ...subscriptionData,
            subscriptionStatus: subscription.status,
            subscriptionEndDate: endDate,
          });
        }
      } catch (error) {
        // Subscription might have been deleted
        console.error('Error retrieving subscription:', error);
        await updateUserSubscriptionData(userId, {
          subscriptionStatus: 'canceled',
        });
      }
    }

    return NextResponse.json(subscriptionData);
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}
