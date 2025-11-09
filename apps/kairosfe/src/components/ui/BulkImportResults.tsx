import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ImportResult } from '@/lib/api/services/employees';
import '@/lib/i18n';

interface BulkImportResultsProps {
  result: ImportResult;
}

export default function BulkImportResults({ result }: BulkImportResultsProps) {
  const { t } = useTranslation();
  const [showErrors, setShowErrors] = useState(true);
  const [showCreatedUsers, setShowCreatedUsers] = useState(false);

  if (!result) return null;

  // Success result (no errors)
  if (result.success) {
    return (
      <div className="space-y-4">
        {/* Success Header */}
        <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl">
            check_circle
          </span>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
              {result.dryRun
                ? t('employees.bulkImport.validationSuccessTitle')
                : t('employees.bulkImport.importSuccessTitle')}
            </h3>
            <p className="text-sm text-green-800 dark:text-green-200 mt-1">
              {result.message}
            </p>
          </div>
        </div>

        {/* Statistics */}
        {!result.dryRun && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t('employees.bulkImport.totalRows')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {result.totalRows}
              </p>
            </div>
            <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t('employees.bulkImport.createdCount')}
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {result.createdCount || 0}
              </p>
            </div>
            <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t('employees.bulkImport.existingCount')}
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {result.existingCount || 0}
              </p>
            </div>
            <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t('employees.bulkImport.validRows')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {result.validRows}
              </p>
            </div>
          </div>
        )}

        {/* Created Users Details */}
        {!result.dryRun && result.createdUsers && result.createdUsers.length > 0 && (
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowCreatedUsers(!showCreatedUsers)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {t('employees.bulkImport.viewCreatedUsers', { count: result.createdUsers.length })}
              </span>
              <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">
                {showCreatedUsers ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {showCreatedUsers && (
              <div className="p-4 bg-white dark:bg-gray-900 max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {result.createdUsers.map((user, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary text-xs font-semibold">
                          {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded">
                        {user.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Error result (validation failed)
  return (
    <div className="space-y-4">
      {/* Error Header */}
      <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-2xl">
          error
        </span>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
            {t('employees.bulkImport.validationErrorsTitle')}
          </h3>
          <p className="text-sm text-red-800 dark:text-red-200 mt-1">
            {t('employees.bulkImport.validationErrorsMessage', {
              count: result.errorCount,
              total: result.totalRows,
            })}
          </p>
        </div>
      </div>

      {/* Error Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {t('employees.bulkImport.totalRows')}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {result.totalRows}
          </p>
        </div>
        <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {t('employees.bulkImport.validRows')}
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {result.validRows}
          </p>
        </div>
        <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {t('employees.bulkImport.errorCount')}
          </p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            {result.errorCount}
          </p>
        </div>
      </div>

      {/* Error Details Table */}
      {result.errors && result.errors.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowErrors(!showErrors)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {t('employees.bulkImport.viewErrors', { count: result.errors.length })}
            </span>
            <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">
              {showErrors ? 'expand_less' : 'expand_more'}
            </span>
          </button>
          {showErrors && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                      {t('employees.bulkImport.row')}
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                      {t('employees.bulkImport.email')}
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                      {t('employees.bulkImport.errors')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {result.errors.map((error, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-gray-100 font-medium">
                        {error.row}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                        {error.email}
                      </td>
                      <td className="px-4 py-3">
                        <ul className="list-disc list-inside space-y-1 text-red-700 dark:text-red-300">
                          {error.errors.map((msg, i) => (
                            <li key={i} className="text-xs">
                              {msg}
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
