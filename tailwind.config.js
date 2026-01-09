/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'forest-green': {
                    DEFAULT: '#14532d',
                    dark: '#064e3b',
                    light: '#166534',
                },
                'accent-green': '#16a34a',
            },
        },
    },
    plugins: [],
}
