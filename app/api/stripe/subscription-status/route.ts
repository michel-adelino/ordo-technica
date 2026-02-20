import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import { getUserSubscriptionData, updateUserSubscriptionData } from '@/lib/subscription';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscriptionData = await getUserSubscriptionData(userId);

    // If user has a Stripe subscription ID, check it directly from Stripe
    if (subscriptionData.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(
          subscriptionData.stripeSubscriptionId
        );

        // Update local status if it differs from Stripe
        if (subscription.status !== subscriptionData.subscriptionStatus) {
          await updateUserSubscriptionData(userId, {
            subscriptionStatus: subscription.status as any,
            subscriptionEndDate: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : undefined,
          });

          return NextResponse.json({
            ...subscriptionData,
            subscriptionStatus: subscription.status,
            subscriptionEndDate: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : undefined,
          });
        }
      } catch (error) {
        // Subscription might have been deleted or doesn't exist
        console.error('Error retrieving subscription from Stripe:', error);
        // Update to canceled if subscription doesn't exist
        if (subscriptionData.subscriptionStatus === 'active') {
          await updateUserSubscriptionData(userId, {
            subscriptionStatus: 'canceled',
          });
          return NextResponse.json({
            ...subscriptionData,
            subscriptionStatus: 'canceled',
          });
        }
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
