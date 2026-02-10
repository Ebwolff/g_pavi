/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                background: 'var(--bg-primary)',
                surface: 'var(--surface)',
                'surface-hover': 'var(--surface-hover)',
                primary: {
                    DEFAULT: 'var(--primary)',
                    hover: 'var(--primary-hover)',
                    glow: 'var(--primary-glow)',
                },
                secondary: 'var(--bg-secondary)',
                success: 'var(--success)',
                warning: 'var(--warning)',
                danger: 'var(--danger)',
                text: {
                    primary: 'var(--text-primary)',
                    secondary: 'var(--text-secondary)',
                    muted: 'var(--text-muted)',
                },
                border: {
                    subtle: 'var(--border-subtle)',
                    hover: 'var(--border-hover)',
                },
                'forest-green': {
                    DEFAULT: '#14532d',
                    dark: '#064e3b',
                    light: '#166534',
                },
                'accent-green': '#16a34a',
            },
            borderRadius: {
                sm: 'var(--radius-sm)',
                md: 'var(--radius-md)',
                lg: 'var(--radius-lg)',
                xl: 'var(--radius-xl)',
                full: 'var(--radius-full)',
            },
        },
    },
    plugins: [],
}
