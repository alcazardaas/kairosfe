import { Toaster } from 'react-hot-toast';

/**
 * Toast notification provider component
 * Renders the toast container with custom styling for light/dark mode
 */
export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Default options
        duration: 3000,
        style: {
          background: 'var(--toast-bg, #363636)',
          color: 'var(--toast-color, #fff)',
          padding: '16px',
          borderRadius: '8px',
          fontSize: '14px',
          maxWidth: '500px',
        },
        // Success
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#10b981',
            secondary: '#ffffff',
          },
        },
        // Error
        error: {
          duration: 4000,
          iconTheme: {
            primary: '#ef4444',
            secondary: '#ffffff',
          },
        },
        // Loading
        loading: {
          duration: Infinity,
        },
      }}
    />
  );
}
