'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import PhotoUpload from '@/components/PhotoUpload';
import ProcessingStatus from '@/components/ProcessingStatus';
import ProcessFlow from '@/components/ProcessFlow';
import toast from 'react-hot-toast';
import Link from 'next/link';

type ProcessingState = 'idle' | 'uploading' | 'processing' | 'analyzing' | 'generating';

interface SubscriptionData {
  subscriptionStatus: string;
  listingCount: number;
  trialStartDate?: string;
}

export default function DashboardPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchSubscriptionStatus();
    
    // Check for subscription success redirect
    if (searchParams.get('subscription') === 'success') {
      const sessionId = searchParams.get('session_id');
      
      if (sessionId) {
        // Sync subscription status from Stripe
        fetch('/api/stripe/sync-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              toast.success('Subscription activated! You now have unlimited listings.');
              fetchSubscriptionStatus();
            }
          })
          .catch((error) => {
            console.error('Failed to sync subscription:', error);
            toast.success('Payment successful! Refreshing subscription status...');
            fetchSubscriptionStatus();
          });
      } else {
        toast.success('Payment successful! Refreshing subscription status...');
        fetchSubscriptionStatus();
      }
      
      // Remove query params
      router.replace('/dashboard');
    }
  }, [searchParams, router]);

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

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
  };

  const handleProcess = async () => {
    if (files.length === 0) {
      toast.error('Please upload at least one photo');
      return;
    }

    if (files.length > 5) {
      toast.error('Maximum 5 photos allowed');
      return;
    }

    try {
      setProcessingState('uploading');

      // Create FormData
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });

      setProcessingState('processing');
      const response = await fetch('/api/process-images', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        
        // Handle subscription required error
        if (error.requiresSubscription || response.status === 403) {
          toast.error(error.error || 'Subscription required', {
            duration: 6000,
          });
          router.push('/pricing');
          setProcessingState('idle');
          return;
        }
        
        throw new Error(error.error || 'Failed to process images');
      }

      setProcessingState('analyzing');
      const result = await response.json();

      setProcessingState('generating');
      
      // Simulate a brief delay for UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Navigate to results page with data
      const encodedData = encodeURIComponent(JSON.stringify(result));
      router.push(`/results?data=${encodedData}`);
    } catch (error) {
      console.error('Processing error:', error);
      let errorMessage = 'Failed to process images. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String(error.message);
      }
      
      toast.error(errorMessage, {
        duration: 5000,
      });
      setProcessingState('idle');
    }
  };

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
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {processingState === 'idle' ? (
          <div className="space-y-8">
            {/* Subscription Status Banner */}
            {subscriptionData && (
              <div
                className={`p-5 rounded-2xl border shadow-soft ${
                  subscriptionData.subscriptionStatus === 'active'
                    ? 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200/50 dark:border-emerald-800/50'
                    : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200/50 dark:border-blue-800/50'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p
                      className={`font-semibold text-base ${
                        subscriptionData.subscriptionStatus === 'active'
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-blue-700 dark:text-blue-300'
                      }`}
                    >
                      {subscriptionData.subscriptionStatus === 'active' ? (
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          Active Subscription - Unlimited listings
                        </span>
                      ) : (
                        <>
                          {Math.max(0, 2 - (subscriptionData.listingCount || 0))} free listings
                          remaining
                        </>
                      )}
                    </p>
                    <p
                      className={`text-sm mt-2 ${
                        subscriptionData.subscriptionStatus === 'active'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      Total listings created: {subscriptionData.listingCount || 0}
                    </p>
                  </div>
                  {subscriptionData.subscriptionStatus !== 'active' && (
                    <Link
                      href="/pricing"
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium transition-all duration-200 text-sm touch-manipulation shadow-medium"
                    >
                      Upgrade
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Process Flow */}
            <ProcessFlow currentStep="upload" />

            {/* Welcome Section */}
            <div className="text-center space-y-5">
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 dark:from-slate-100 dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent">
                Create Your MLS Listing
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Upload up to 5 property photos and let AI generate your professional MLS listing
                description, hashtags, and social media captions in seconds.
              </p>
            </div>

            {/* Upload Component */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 sm:p-8 shadow-medium">
              <PhotoUpload onFilesChange={handleFilesChange} maxFiles={5} />
            </div>

            {/* Process Button */}
            {files.length > 0 && (
              <div className="flex justify-center">
                <button
                  onClick={handleProcess}
                  disabled={files.length === 0}
                  className="
                    px-10 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 
                    text-white text-lg font-semibold rounded-xl
                    transition-all duration-200
                    disabled:from-gray-400 disabled:via-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed
                    touch-manipulation shadow-large
                    disabled:shadow-none
                  "
                >
                  Generate Listing Content
                </button>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-indigo-950/20 dark:via-blue-950/20 dark:to-purple-950/20 rounded-2xl p-6 sm:p-8 space-y-4 border border-indigo-100/50 dark:border-indigo-900/50 shadow-soft">
              <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                How it works
              </h3>
              <ol className="space-y-3 text-indigo-800 dark:text-indigo-200">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">1</span>
                  <span>Upload up to 5 photos of your property (interior, exterior, key features)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">2</span>
                  <span>AI analyzes the photos for visual features and extracts text from documents</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">3</span>
                  <span>Get professional MLS description, hashtags, and social media captions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">4</span>
                  <span>Copy each section to your clipboard and use in your listings</span>
                </li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Process Flow - Show processing state */}
            <ProcessFlow
              currentStep={
                processingState === 'uploading' || processingState === 'processing'
                  ? 'processing'
                  : processingState === 'analyzing' || processingState === 'generating'
                  ? 'processing'
                  : 'upload'
              }
            />
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-8 shadow-medium">
              <ProcessingStatus status={processingState} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
