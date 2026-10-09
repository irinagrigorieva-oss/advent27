import type { Config } from 'tailwindcss';

// Sweet pastel palette: cream paper, blush pink, candy rose, mint, butter, lilac.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#fff7f2',   // page background
        card: '#ffffff',    // panels
        blush: '#ffe3ea',
        rose: '#cf3f65',    // accent (buttons, links) — 4.5:1 with white text
        berry: '#b0264b',   // errors / danger
        ink: '#4a2c35',     // body text (cocoa)
        muted: '#7d5a64',   // secondary text, 5:1 on cream
        mint: '#cfeee0',
        butter: '#ffe7a8',
        lilac: '#e6dcff',
        sky: '#d8ecff',
      },
      fontFamily: {
        display: ['Comfortaa', 'ui-rounded', 'system-ui', 'sans-serif'],
        sans: ['Nunito', 'ui-rounded', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
