'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ResultsDisplay from '@/components/ResultsDisplay';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import toast from 'react-hot-toast';

interface ResultsData {
  mlsDescription: string;
  hashtags: string[];
  socialCaption: string;
  carouselText: string;
  ocrText?: string;
  isRealOCR?: boolean;
}

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [results, setResults] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get results from URL params (passed from dashboard)
    const data = searchParams.get('data');
    if (data) {
      try {
        const parsed = JSON.parse(decodeURIComponent(data));
        setResults(parsed);
      } catch (error) {
        console.error('Failed to parse results:', error);
      toast.error('Failed to load results. Redirecting to dashboard...');
      setTimeout(() => router.push('/dashboard'), 2000);
      }
    } else {
      // No data in URL, redirect to dashboard
      router.push('/dashboard');
    }
    setLoading(false);
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return null;
  }

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
                Generate New
              </Link>
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 dark:from-slate-100 dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent mb-3">
              Your Listing Content is Ready!
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Copy each section to your clipboard and use it in your MLS listing or social media posts.
            </p>
          </div>
          <ResultsDisplay
            mlsDescription={results.mlsDescription}
            hashtags={results.hashtags}
            socialCaption={results.socialCaption}
            carouselText={results.carouselText}
            ocrText={results.ocrText}
            isRealOCR={results.isRealOCR}
          />
        </div>
      </main>
    </div>
  );
}
