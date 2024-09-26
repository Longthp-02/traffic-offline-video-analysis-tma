/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "gray-20": "#F8F4EB", 
        "blue-200": "#2A7EF9",
        "white": "#FFFFFF" 
      },
      backgroundImage: {
        "homepage-background": "url('./assets/HomePageBackground.png')" // Removed theme parameter
      },
      content: {
        
      },
      screens: {
        xs: "480px",
        sm: "768px",
        md: "1060px"
      },
      theme: {
        inter: ['Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
}
