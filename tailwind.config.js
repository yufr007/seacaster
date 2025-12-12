/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                // Dark mode ocean theme
                dark: {
                    bg: '#0B1120',
                    card: '#141B2D',
                    hover: '#1A2332',
                },
                ocean: {
                    50: '#E8F5FF',
                    100: '#D1EBFF',
                    200: '#A3D7FF',
                    300: '#75C3FF',
                    400: '#47AFFF',
                    500: '#1E96FC', // Primary
                    600: '#0077E6',
                    700: '#005BB8',
                    800: '#003F8A',
                    900: '#00235C',
                },
                success: {
                    500: '#10B981',
                    600: '#059669',
                },
                warning: {
                    500: '#F59E0B',
                    600: '#D97706',
                },
                danger: {
                    500: '#EF4444',
                    600: '#DC2626',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Orbitron', 'sans-serif'], // For headings
            },
            boxShadow: {
                'glow': '0 0 20px rgba(30, 150, 252, 0.3)',
                'glow-strong': '0 0 40px rgba(30, 150, 252, 0.5)',
                'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
            },
            backdropBlur: {
                xs: '2px',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in',
                'slide-up': 'slideUp 0.5s ease-out',
                'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                pulseGlow: {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(30, 150, 252, 0.3)' },
                    '50%': { boxShadow: '0 0 40px rgba(30, 150, 252, 0.6)' },
                },
            },
        },
    },
    plugins: [],
}
