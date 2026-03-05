/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            keyframes: {
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'zoom-in-95': {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                'slide-in-from-bottom-2': {
                    '0%': { opacity: '0', transform: 'translateY(0.5rem)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'slide-in-from-right': {
                    '0%': { opacity: '0', transform: 'translateX(100%)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
            },
            animation: {
                'in-fade': 'fade-in 0.2s ease-out',
                'in-zoom-95': 'zoom-in-95 0.2s ease-out',
                'in-slide-bottom': 'slide-in-from-bottom-2 0.3s ease-out',
                'in-slide-right': 'slide-in-from-right 0.3s ease-out',
            },
        },
    },
    plugins: [],
};
