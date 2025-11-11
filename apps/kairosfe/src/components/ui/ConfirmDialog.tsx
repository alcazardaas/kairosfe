
export type ConfirmDialogVariant = 'info' | 'warning' | 'danger';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  showInput?: boolean;
  inputValue?: string;
  onInputChange?: (value: string) => void;
  inputPlaceholder?: string;
  inputLabel?: string;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  showInput = false,
  inputValue = '',
  onInputChange,
  inputPlaceholder = '',
  inputLabel = '',
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: 'error',
          iconColor: 'text-red-600 dark:text-red-400',
          buttonBg: 'bg-red-600 hover:bg-red-700',
          alertBg: 'bg-red-50 dark:bg-red-900/20',
          alertBorder: 'border-red-200 dark:border-red-800',
          alertText: 'text-red-800 dark:text-red-400',
        };
      case 'warning':
        return {
          icon: 'warning',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
          alertBg: 'bg-yellow-50 dark:bg-yellow-900/20',
          alertBorder: 'border-yellow-200 dark:border-yellow-800',
          alertText: 'text-yellow-800 dark:text-yellow-400',
        };
      case 'info':
      default:
        return {
          icon: 'info',
          iconColor: 'text-blue-600 dark:text-blue-400',
          buttonBg: 'bg-blue-600 hover:bg-blue-700',
          alertBg: 'bg-blue-50 dark:bg-blue-900/20',
          alertBorder: 'border-blue-200 dark:border-blue-800',
          alertText: 'text-blue-800 dark:text-blue-400',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md m-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <span className={`material-symbols-outlined ${styles.iconColor}`}>
              {styles.icon}
            </span>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <div className={`${styles.alertBg} border ${styles.alertBorder} rounded-lg p-3 mb-4`}>
            <p className={`text-sm ${styles.alertText}`}>
              {message}
            </p>
          </div>

          {/* Optional Input */}
          {showInput && (
            <div className="mt-4">
              {inputLabel && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {inputLabel}
                </label>
              )}
              <textarea
                value={inputValue}
                onChange={(e) => onInputChange?.(e.target.value)}
                placeholder={inputPlaceholder}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white ${styles.buttonBg} rounded-lg`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
