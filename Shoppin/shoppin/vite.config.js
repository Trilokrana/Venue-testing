// import { defineConfig } from 'vite'
// import tailwindcss from '@tailwindcss/vite'
// export default defineConfig({
//   plugins: [
//     tailwindcss(),
//   ],
// })


// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { // <-- Add or modify this block
    host: true, // <-- This tells Vite to listen on all network interfaces (like 0.0.0.0)
    port: 5173 // Optional: You can explicitly set the port here too if needed
  }
})