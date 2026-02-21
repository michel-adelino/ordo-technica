import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-01-28.clover',
  typescript: true,
});

// Subscription details
export const SUBSCRIPTION_AMOUNT = 39; // $39/month (in dollars)
export const SUBSCRIPTION_CURRENCY = 'usd';
export const FREE_TRIAL_DAYS = 3;
export const FREE_LISTINGS_COUNT = 2;
