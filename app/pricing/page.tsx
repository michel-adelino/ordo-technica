'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface SubscriptionData {
  subscriptionStatus: string;
  listingCount: number;
  trialStartDate?: string;
}

export default function PricingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/stripe/subscription-status');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionData(data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to start checkout'
      );
      setLoading(false);
    }
  };

  const getRemainingFreeListings = () => {
    if (!subscriptionData) return 2;
    return Math.max(0, 2 - (subscriptionData.listingCount || 0));
  };

  const isSubscribed = subscriptionData?.subscriptionStatus === 'active';
  const isTrialing = subscriptionData?.subscriptionStatus === 'trialing';
  const remainingFree = getRemainingFreeListings();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-800/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              Ordo Technica
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="px-5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 rounded-xl transition-colors"
              >
                Dashboard
              </Link>
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 dark:from-slate-100 dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300">
            Start with 2 free listings, then subscribe for unlimited access
          </p>
        </div>

        {/* Current Status */}
        {subscriptionData && (
          <div className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 rounded-2xl border border-indigo-200/50 dark:border-indigo-800/50 shadow-soft">
            <h2 className="text-lg font-bold text-indigo-900 dark:text-indigo-100 mb-3">
              Your Current Status
            </h2>
            <div className="space-y-2 text-indigo-800 dark:text-indigo-200">
              {isSubscribed ? (
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active Subscription - Unlimited listings
                </p>
              ) : isTrialing ? (
                <p>✓ Free Trial Active - {remainingFree} free listings remaining</p>
              ) : (
                <p>✓ {remainingFree} free listings remaining</p>
              )}
              <p className="text-sm">
                Total listings created: {subscriptionData.listingCount || 0}
              </p>
            </div>
          </div>
        )}

        {/* Pricing Card */}
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-large border border-slate-200/50 dark:border-slate-700/50 p-8 sm:p-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-3">
              Monthly Subscription
            </h2>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                $39
              </span>
              <span className="text-xl text-slate-600 dark:text-slate-400">
                /month
              </span>
            </div>
          </div>

          <ul className="space-y-4 mb-8">
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mt-0.5">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span className="text-slate-700 dark:text-slate-300 text-base">
                Unlimited listing generations
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mt-0.5">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span className="text-slate-700 dark:text-slate-300 text-base">
                Professional MLS descriptions
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mt-0.5">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span className="text-slate-700 dark:text-slate-300 text-base">
                Social media captions & hashtags
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mt-0.5">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span className="text-slate-700 dark:text-slate-300 text-base">
                Cancel anytime
              </span>
            </li>
          </ul>

          <button
            onClick={handleSubscribe}
            disabled={loading || isSubscribed}
            className={`
              w-full py-4 px-6 rounded-xl font-semibold text-lg
              transition-all duration-200 touch-manipulation shadow-large
              ${
                isSubscribed
                  ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white'
              }
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {loading
              ? 'Processing...'
              : isSubscribed
              ? 'Currently Subscribed'
              : 'Subscribe Now'}
          </button>

          {isSubscribed && (
            <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
              You're already subscribed! Enjoy unlimited listings.
            </p>
          )}
        </div>

        {/* Free Trial Info */}
        <div className="mt-8 p-6 sm:p-8 bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-indigo-950/20 dark:via-blue-950/20 dark:to-purple-950/20 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/50 shadow-soft">
          <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100 mb-3">
            Free Trial
          </h3>
          <p className="text-indigo-800 dark:text-indigo-200 leading-relaxed">
            New users get 2 free listings to try out the service. No credit card
            required for the free listings. After that, subscribe for unlimited
            access.
          </p>
        </div>
      </main>
    </div>
  );
}
