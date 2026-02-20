'use client';

import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { validateImageFile, formatFileSize } from '@/lib/utils';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface PhotoUploadProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
}

export default function PhotoUpload({ onFilesChange, maxFiles = 5 }: PhotoUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles: File[] = [];
      const newPreviews: string[] = [];

      // Validate and add new files
      for (const file of acceptedFiles) {
        if (files.length + newFiles.length >= maxFiles) {
          toast.error(`Maximum ${maxFiles} photos allowed`);
          break;
        }

        const validation = validateImageFile(file);
        if (!validation.valid) {
          toast.error(validation.error || 'Invalid file');
          continue;
        }

        newFiles.push(file);
        const preview = URL.createObjectURL(file);
        newPreviews.push(preview);
      }

      if (newFiles.length > 0) {
        const updatedFiles = [...files, ...newFiles];
        const updatedPreviews = [...previews, ...newPreviews];
        setFiles(updatedFiles);
        setPreviews(updatedPreviews);
        onFilesChange(updatedFiles);
        toast.success(`Added ${newFiles.length} photo(s)`);
      }
    },
    [files, previews, maxFiles, onFilesChange]
  );

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(previews[index]);
    
    setFiles(updatedFiles);
    setPreviews(updatedPreviews);
    onFilesChange(updatedFiles);
    toast.success('Photo removed');
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: maxFiles - files.length,
    multiple: true,
    noClick: false,
    noKeyboard: false,
  });

  return (
    <div className="w-full space-y-4">
      {/* Upload Area */}
      {files.length < maxFiles && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-2xl p-10 sm:p-12 text-center cursor-pointer
            transition-all duration-300 touch-manipulation
            ${
              isDragActive
                ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/50 dark:to-blue-950/50 shadow-medium'
                : 'border-slate-300 dark:border-slate-600 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-5">
            <div className={`p-4 rounded-2xl ${
              isDragActive 
                ? 'bg-indigo-100 dark:bg-indigo-900/50' 
                : 'bg-slate-100 dark:bg-slate-800'
            }`}>
              <svg
                className={`w-10 h-10 ${
                  isDragActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <p className={`text-base font-semibold ${
                isDragActive
                  ? 'text-indigo-700 dark:text-indigo-300'
                  : 'text-slate-700 dark:text-slate-300'
              }`}>
                {isDragActive
                  ? 'Drop photos here'
                  : 'Drag & drop photos here, or click to select'}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Upload up to {maxFiles} photos (JPEG, PNG, WebP)
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Max 10MB per file
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Preview Grid */}
      {files.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
              Photos ({files.length}/{maxFiles})
            </h3>
            {files.length >= maxFiles && (
              <span className="text-xs font-medium px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full">
                Maximum reached
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {files.map((file, index) => (
              <div
                key={index}
                className="relative group aspect-square rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-soft"
              >
                <Image
                  src={previews[index]}
                  alt={`Preview ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 33vw"
                />
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-90 transition-opacity touch-manipulation shadow-medium"
                  aria-label={`Remove photo ${index + 1}`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs p-2">
                  {formatFileSize(file.size)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
