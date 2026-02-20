'use client';

import CopyButton from './CopyButton';

interface ResultsDisplayProps {
  mlsDescription: string;
  hashtags: string[];
  socialCaption: string;
  carouselText: string;
  ocrText?: string;
  isRealOCR?: boolean;
}

export default function ResultsDisplay({
  mlsDescription,
  hashtags,
  socialCaption,
  carouselText,
  ocrText,
  isRealOCR,
}: ResultsDisplayProps) {
  const hashtagsText = hashtags.join(' ');

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 p-4 sm:p-6">
      {/* Google Vision OCR Results - Show if available */}
      {ocrText && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                Text Extracted from Images
              </h2>
              {isRealOCR && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-soft">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Google Vision API
                </span>
              )}
            </div>
            <CopyButton text={ocrText} label="Copy OCR Text" />
          </div>
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 sm:p-8 shadow-medium">
            <div className="max-h-48 sm:max-h-64 md:max-h-80 lg:max-h-96 overflow-y-auto">
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-mono text-sm bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
                {ocrText}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* MLS Description */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            MLS Listing Description
          </h2>
          <CopyButton text={mlsDescription} label="Copy Description" />
        </div>
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 sm:p-8 shadow-medium">
          <div className="max-h-48 sm:max-h-64 md:max-h-80 lg:max-h-96 overflow-y-auto">
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-base">
              {mlsDescription}
            </p>
          </div>
        </div>
      </section>

      {/* Hashtags */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            Hashtags
          </h2>
          <CopyButton text={hashtagsText} label="Copy Hashtags" />
        </div>
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 sm:p-8 shadow-medium">
          <div className="flex flex-wrap gap-3">
            {hashtags.map((hashtag, index) => (
              <span
                key={index}
                className="inline-block px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 text-indigo-700 dark:text-indigo-300 rounded-xl text-sm font-semibold border border-indigo-200/50 dark:border-indigo-800/50"
              >
                {hashtag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Social Media Caption */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            Facebook/Instagram Caption
          </h2>
          <CopyButton text={socialCaption} label="Copy Caption" />
        </div>
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 sm:p-8 shadow-medium">
          <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-base">
            {socialCaption}
          </p>
        </div>
      </section>

      {/* Carousel Text */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            Carousel Post Text
          </h2>
          <CopyButton text={carouselText} label="Copy Carousel Text" />
        </div>
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 sm:p-8 shadow-medium">
          <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-base">
            {carouselText}
          </p>
        </div>
      </section>
    </div>
  );
}
