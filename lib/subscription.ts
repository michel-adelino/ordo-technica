import { createClerkClient } from '@clerk/backend';
import { FREE_LISTINGS_COUNT, FREE_TRIAL_DAYS } from './stripe';

// Create Clerk client instance
function getClerkClient() {
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY is not set in environment variables');
  }
  return createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
}

export interface UserSubscriptionData {
  subscriptionStatus: 'active' | 'trialing' | 'past_due' | 'canceled' | 'none';
  listingCount: number;
  trialStartDate?: string;
  subscriptionEndDate?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

/**
 * Get user subscription data from Clerk metadata
 */
export async function getUserSubscriptionData(
  userId: string
): Promise<UserSubscriptionData> {
  try {
    const client = getClerkClient();
    const user = await client.users.getUser(userId);
    const metadata = user.publicMetadata as Record<string, any>;

    return {
      subscriptionStatus: metadata.subscriptionStatus || 'none',
      listingCount: metadata.listingCount || 0,
      trialStartDate: metadata.trialStartDate,
      subscriptionEndDate: metadata.subscriptionEndDate,
      stripeCustomerId: metadata.stripeCustomerId,
      stripeSubscriptionId: metadata.stripeSubscriptionId,
    };
  } catch (error) {
    console.error('Error fetching user subscription data:', error);
    return {
      subscriptionStatus: 'none',
      listingCount: 0,
    };
  }
}

/**
 * Update user subscription data in Clerk metadata
 */
export async function updateUserSubscriptionData(
  userId: string,
  data: Partial<UserSubscriptionData>
): Promise<void> {
  try {
    const currentData = await getUserSubscriptionData(userId);
    const updatedData = { ...currentData, ...data };

    const client = getClerkClient();
    await client.users.updateUser(userId, {
      publicMetadata: {
        ...updatedData,
      },
    });
  } catch (error) {
    console.error('Error updating user subscription data:', error);
    throw error;
  }
}

/**
 * Check if user can create a listing
 */
export async function canCreateListing(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const subscriptionData = await getUserSubscriptionData(userId);

  // Check if user has active subscription
  if (subscriptionData.subscriptionStatus === 'active') {
    return { allowed: true };
  }

  // Check if user is in trial period
  if (subscriptionData.subscriptionStatus === 'trialing') {
    const trialStart = subscriptionData.trialStartDate
      ? new Date(subscriptionData.trialStartDate)
      : null;

    if (trialStart) {
      const trialEnd = new Date(trialStart);
      trialEnd.setDate(trialEnd.getDate() + FREE_TRIAL_DAYS);
      const now = new Date();

      if (now < trialEnd) {
        return { allowed: true };
      } else {
        return {
          allowed: false,
          reason: 'Your free trial has ended. Please subscribe to continue.',
        };
      }
    }
  }

  // Check free listings count
  if (subscriptionData.listingCount < FREE_LISTINGS_COUNT) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `You've used your ${FREE_LISTINGS_COUNT} free listings. Subscribe to continue creating listings.`,
  };
}

/**
 * Increment user listing count
 */
export async function incrementListingCount(userId: string): Promise<void> {
  const subscriptionData = await getUserSubscriptionData(userId);
  const newCount = (subscriptionData.listingCount || 0) + 1;

  await updateUserSubscriptionData(userId, {
    listingCount: newCount,
  });
}

/**
 * Initialize trial for new user
 */
export async function initializeTrial(userId: string): Promise<void> {
  const subscriptionData = await getUserSubscriptionData(userId);

  // Only initialize if user hasn't started a trial yet
  if (!subscriptionData.trialStartDate) {
    await updateUserSubscriptionData(userId, {
      subscriptionStatus: 'trialing',
      trialStartDate: new Date().toISOString(),
      listingCount: 0,
    });
  }
}
