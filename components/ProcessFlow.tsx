'use client';

interface ProcessFlowProps {
  currentStep?: 'upload' | 'processing' | 'results';
}

export default function ProcessFlow({ currentStep = 'upload' }: ProcessFlowProps) {
  const steps = [
    {
      id: 'upload',
      label: 'Upload Photos',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      id: 'processing',
      label: 'AI Analysis',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
    },
    {
      id: 'results',
      label: 'Get Results',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  const getStepStatus = (stepId: string) => {
    const stepIndex = steps.findIndex((s) => s.id === stepId);
    const currentIndex = steps.findIndex((s) => s.id === currentStep);

    if (stepIndex < currentIndex) {
      return 'completed';
    } else if (stepIndex === currentIndex) {
      return 'active';
    } else {
      return 'pending';
    }
  };

  return (
    <div className="w-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-4 sm:p-6 lg:p-8 shadow-soft">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex items-center flex-1 min-w-0">
              {/* Step Circle */}
              <div className="flex flex-col items-center flex-1 min-w-0">
                <div
                  className={`
                    w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center
                    transition-all duration-300 shadow-medium flex-shrink-0
                    ${
                      status === 'completed'
                        ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white'
                        : status === 'active'
                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white ring-2 sm:ring-4 ring-indigo-200/50 dark:ring-indigo-900/50'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                    }
                  `}
                >
                  {status === 'completed' ? (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7">{step.icon}</div>
                  )}
                </div>
                <span
                  className={`
                    mt-2 sm:mt-3 text-xs sm:text-sm font-semibold text-center truncate w-full px-1
                    ${
                      status === 'active'
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : status === 'completed'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div className="flex-1 mx-1 sm:mx-2 lg:mx-3 h-0.5 sm:h-1 relative min-w-[8px] max-w-[40px] sm:max-w-none">
                  <div className="absolute top-0 left-0 h-full w-full bg-slate-200 dark:bg-slate-700 rounded-full" />
                  <div
                    className={`
                      absolute top-0 left-0 h-full rounded-full
                      transition-all duration-500
                      ${
                        status === 'completed'
                          ? 'bg-gradient-to-r from-emerald-500 to-green-600 w-full'
                          : 'w-0'
                      }
                    `}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
