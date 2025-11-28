import { withDesktopTokens } from '../../../src/design/tailwind-desktop';

/** @type {import('tailwindcss').Config} */
const baseConfig = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  darkMode: 'class',
};

export default withDesktopTokens(baseConfig);
