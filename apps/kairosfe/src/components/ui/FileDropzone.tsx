import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';

interface FileDropzoneProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
}

export default function FileDropzone({
  onFileSelect,
  accept = '.csv,.xlsx',
  maxSizeMB = 10,
  disabled = false,
}: FileDropzoneProps) {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (selectedFile: File): string | null => {
    // Check file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      return t('employees.bulkImport.invalidFileType');
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (selectedFile.size > maxSizeBytes) {
      return t('employees.bulkImport.fileTooLarge', { maxSize: maxSizeMB });
    }

    return null;
  };

  const handleFile = useCallback(
    (selectedFile: File) => {
      setError(null);
      const validationError = validateFile(selectedFile);

      if (validationError) {
        setError(validationError);
        setFile(null);
        onFileSelect(null);
        return;
      }

      setFile(selectedFile);
      onFileSelect(selectedFile);
    },
    [onFileSelect, maxSizeMB, t]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFile(droppedFile);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setError(null);
    onFileSelect(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      {/* Dropzone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${isDragging
            ? 'border-primary bg-primary/5 dark:bg-primary/10'
            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-700/50'}
          ${error ? 'border-red-500 dark:border-red-500' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          id="file-upload"
        />

        <div className="space-y-2">
          <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-gray-500">
            upload_file
          </span>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('employees.bulkImport.dragDropFile')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('employees.bulkImport.acceptedFormats')}
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-xl">
            error
          </span>
          <p className="text-sm text-red-800 dark:text-red-200 flex-1">{error}</p>
        </div>
      )}

      {/* Selected File */}
      {file && !error && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
          <span className="material-symbols-outlined text-primary text-2xl">
            description
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {file.name}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {formatFileSize(file.size)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t('common.delete')}
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
