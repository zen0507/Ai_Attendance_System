/** @type {import('tailwindcss').Config} */
import daisyui from "daisyui";

export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: ['class', '[data-theme="dark"]'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Cabinet Grotesk', 'Inter', 'sans-serif'],
                display: ['Clash Display', 'sans-serif'],
                body: ['Cabinet Grotesk', 'sans-serif'],
            },
            colors: {
                // Dark Mode Aesthetic
                "void-black": "#05050a",
                "electric-violet": "#4f46e5",
                "electric-cyan": "#06b6d4",

                // Light Mode Aesthetic
                "limestone": "#f5f0eb",
                "limestone-dark": "#e6e1dc",
                "deep-charcoal": "#1a1a2e",
                "neon-blue": "#2563eb",
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
            }
        },
    },
    plugins: [daisyui],
    daisyui: {
        themes: [
            {
                light: {
                    ...require("daisyui/src/theming/themes")["light"],
                    primary: "#2563eb", // Neon Blue
                    "base-100": "#f5f0eb", // Limestone
                    "base-content": "#1a1a2e", // Deep Charcoal
                },
                dark: {
                    ...require("daisyui/src/theming/themes")["dark"],
                    primary: "#4f46e5", // Electric Violet
                    "base-100": "#05050a", // Void Black
                    "base-content": "#ffffff",
                },
            },
        ],
    },
}

