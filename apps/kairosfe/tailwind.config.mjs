/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#1E3A8A',
        'primary-alt': '#3B82F6',
        accent: '#10B981',
        background: {
          light: '#FFFFFF',
          dark: '#0F172A',
        },
        surface: {
          light: '#FFFFFF',
          'light-raised': '#F8FAFC',
          dark: '#1E293B',
          'dark-raised': '#111827',
        },
        text: {
          light: '#111827',
          dark: '#F8FAFC',
        },
        muted: {
          light: '#6B7280',
          dark: '#94A3B8',
        },
        border: {
          light: '#E5E7EB',
          dark: '#334155',
        },
        link: {
          light: '#3B82F6',
          dark: '#38BDF8',
        },
        focus: {
          light: '#60A5FA',
          dark: '#38BDF8',
        },
        success: {
          light: '#10B981',
          dark: '#22C55E',
        },
        warning: {
          light: '#F59E0B',
          dark: '#FBBF24',
        },
        error: {
          light: '#EF4444',
          dark: '#F87171',
        },
        info: {
          light: '#3B82F6',
          dark: '#60A5FA',
        },
      },
      fontFamily: {
        display: [
          'Inter',
          'Manrope',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      fontSize: {
        display: ['56px', { lineHeight: '64px', letterSpacing: '-0.5px' }],
        h1: ['40px', { lineHeight: '48px', letterSpacing: '-0.25px' }],
        h2: ['28px', { lineHeight: '36px', letterSpacing: '-0.2px' }],
        h3: ['20px', { lineHeight: '28px' }],
        body: ['16px', { lineHeight: '24px' }],
        caption: ['12px', { lineHeight: '16px', letterSpacing: '1px' }],
      },
      spacing: {
        0: '0',
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        6: '24px',
        8: '32px',
        12: '48px',
        16: '64px',
      },
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        pill: '999px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(0,0,0,0.06)',
        sm: '0 2px 6px rgba(0,0,0,0.08)',
        md: '0 4px 12px rgba(0,0,0,0.10)',
        lg: '0 10px 24px rgba(0,0,0,0.12)',
        'inner-glow-dark': 'inset 0 0 0 1px rgba(255,255,255,0.06)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
