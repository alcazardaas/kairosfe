import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { employeesService } from '@/lib/api/services/employees';
import type { ImportResult } from '@/lib/api/services/employees';
import { showToast } from '@/lib/utils/toast';
import FileDropzone from '@/components/ui/FileDropzone';
import BulkImportResults from '@/components/ui/BulkImportResults';
import '@/lib/i18n';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkImportModal({ isOpen, onClose, onSuccess }: BulkImportModalProps) {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadTemplate = async (format: 'csv' | 'xlsx') => {
    try {
      const blob = await employeesService.downloadTemplate(format);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-import-template.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast.success(t('employees.bulkImport.templateDownloaded'));
    } catch (err: any) {
      console.error('Failed to download template:', err);
      showToast.error(t('employees.bulkImport.templateDownloadFailed'));
    }
  };

  const handleValidate = async () => {
    if (!file) return;

    try {
      setIsValidating(true);
      setError(null);
      setResult(null);

      const importResult = await employeesService.bulkImport(file, true);
      setResult(importResult);

      if (importResult.success) {
        showToast.success(
          t('employees.bulkImport.validationSuccess', { count: importResult.totalRows })
        );
      } else {
        showToast.warning(
          t('employees.bulkImport.validationFailed', { count: importResult.errorCount })
        );
      }
    } catch (err: any) {
      console.error('Validation failed:', err);
      const errorMessage = err.message || t('employees.bulkImport.validationError');
      setError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    const confirmed = window.confirm(t('employees.bulkImport.confirmImport'));
    if (!confirmed) return;

    try {
      setIsImporting(true);
      setError(null);
      setResult(null);

      const importResult = await employeesService.bulkImport(file, false);
      setResult(importResult);

      if (importResult.success) {
        showToast.success(
          t('employees.bulkImport.importSuccess', {
            created: importResult.createdCount || 0,
            existing: importResult.existingCount || 0,
          })
        );
        // Call onSuccess to refresh the employee list
        onSuccess();
      } else {
        showToast.error(
          t('employees.bulkImport.importFailed', { count: importResult.errorCount })
        );
      }
    } catch (err: any) {
      console.error('Import failed:', err);

      // Handle specific error codes
      let errorMessage = t('employees.bulkImport.importError');
      if (err.statusCode === 403) {
        errorMessage = t('employees.errors.createFailed') + ' - ' + t('apiErrors.forbidden');
      } else if (err.statusCode === 413) {
        errorMessage = t('employees.bulkImport.fileTooLarge', { maxSize: 10 });
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (!isValidating && !isImporting) {
      setFile(null);
      setResult(null);
      setError(null);
      onClose();
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  if (!isOpen) return null;

  const isLoading = isValidating || isImporting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {t('employees.bulkImport.title')}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t('employees.bulkImport.subtitle')}
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Download Template Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">
                download
              </span>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  {t('employees.bulkImport.downloadTemplateTitle')}
                </h3>
                <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                  {t('employees.bulkImport.downloadTemplateDescription')}
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleDownloadTemplate('csv')}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-white dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('employees.bulkImport.downloadCSV')}
                  </button>
                  <button
                    onClick={() => handleDownloadTemplate('xlsx')}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-white dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('employees.bulkImport.downloadExcel')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* File Upload Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              {t('employees.bulkImport.uploadFileTitle')}
            </h3>
            <FileDropzone
              onFileSelect={setFile}
              disabled={isLoading}
              accept=".csv,.xlsx"
              maxSizeMB={10}
            />
          </div>

          {/* Error Message */}
          {error && !result && (
            <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-xl">
                error
              </span>
              <p className="text-sm text-red-800 dark:text-red-200 flex-1">{error}</p>
            </div>
          )}

          {/* Results */}
          {result && <BulkImportResults result={result} />}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              {result && (
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('employees.bulkImport.uploadAnother')}
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('common.close')}
              </button>

              {!result && (
                <>
                  <button
                    type="button"
                    onClick={handleValidate}
                    disabled={!file || isLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isValidating && (
                      <span className="animate-spin h-4 w-4 border-2 border-gray-600 border-t-transparent rounded-full" />
                    )}
                    <span className="material-symbols-outlined text-lg">verified</span>
                    {isValidating
                      ? t('common.validating')
                      : t('employees.bulkImport.validateOnly')}
                  </button>

                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={!file || isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isImporting && (
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    )}
                    <span className="material-symbols-outlined text-lg">upload</span>
                    {isImporting ? t('common.submitting') : t('employees.bulkImport.importUsers')}
                  </button>
                </>
              )}

              {result && result.success && !result.dryRun && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {t('common.close')}
                </button>
              )}

              {result && !result.success && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {t('employees.bulkImport.fixAndRetry')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
