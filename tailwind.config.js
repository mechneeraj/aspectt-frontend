/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        matte: {
          bg: '#121212',
          card: '#1E1E1E',
          surface: '#242424',
          border: '#2E2E2E',
          borderHover: '#3D3D3D',
          purple: {
            DEFAULT: '#7E57C2',
            hover: '#673AB7',
            dark: '#512DA8',
            light: '#9575CD'
          },
          text: {
            primary: '#FFFFFF',
            muted: '#B0B0B0',
            subtle: '#7E7E7E'
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
      aspectRatio: {
        'poster': '2 / 3',
      }
    },
  },
  plugins: [],
}

