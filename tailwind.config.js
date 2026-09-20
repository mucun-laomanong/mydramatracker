/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        drama: {
          bg: '#FAF7F2',        
          text: '#3E362E',      
          primary: '#8C3B3A',   
          secondary: '#5C6B73', 
          border: '#E8E2D9', 
          heartBg: '#F7EBEA',
          heartBorder: '#EED9D9'
        }
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Songti SC"', '"STSong"', 'serif'], 
        sans: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif']
      }
    },
  },
  plugins: [],
}