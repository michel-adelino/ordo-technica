'use client';

interface ProcessingStatusProps {
  status: 'uploading' | 'processing' | 'analyzing' | 'generating';
  progress?: number;
}

const statusMessages = {
  uploading: 'Uploading photos...',
  processing: 'Processing images with AI...',
  analyzing: 'Analyzing property features...',
  generating: 'Generating listing content...',
};

export default function ProcessingStatus({ status, progress }: ProcessingStatusProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-8">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-indigo-600 border-r-purple-600 rounded-full animate-spin"></div>
        <div className="absolute inset-2 border-4 border-transparent border-t-blue-500 border-r-pink-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
      <div className="text-center space-y-3">
        <p className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {statusMessages[status]}
        </p>
        {progress !== undefined && (
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {Math.round(progress)}% complete
          </p>
        )}
        <p className="text-sm text-slate-500 dark:text-slate-400">
          This usually takes about 15 seconds
        </p>
      </div>
    </div>
  );
}
