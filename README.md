# mydramatracker
A lightweight, privacy-first personal watchlist &amp; drama tracker for East Asian TV shows. 100% local, offline-first &amp; PWA enabled.
## 🚀 How to Build

This project supports two different build modes depending on how you wish to distribute or use the app:

### Option 1: Build as a Progressive Web App (PWA)

Ideal for hosting on a web domain (e.g., Cloudflare Pages, Vercel) where users can visit the URL and install it directly to their desktop or mobile home screen.

1. **Install PWA plugin** (if not already installed):
   ```bash
   npm install -D vite-plugin-pwa```
2. **Build the web app**:
   ```bash
   npm run build```
3. **Deploy**: Upload the contents of the generated dist/ directory to your static web host (HTTPS required for PWA installation).

### Option 2: Build a Standalone Single-File Offline HTML
Ideal for creating a "zero-installation / green" version. All CSS, JavaScript, and assets will be bundled into a single .html file. Users can simply double-click the file to run the app offline without needing any web server or internet connection.

1. **Install Single-File plugin** (if not already installed):
   ```bash
   npm install -D vite-plugin-singlefile```
2. **Create a dedicated config file** vite.config.offline.js in your project root:

   ```JavaScript
    import { defineConfig } from 'vite'
    import vue from '@vitejs/plugin-vue'
    import { viteSingleFile } from 'vite-plugin-singlefile'

    export default defineConfig({
    plugins: [vue(), viteSingleFile()],
    build: {
        outDir: 'dist-offline'
    }
    })```
3. **Build the offline HTML file**:
   ```Bash
   npm run build:offline```
   Locate your file: Open the dist-offline/ folder. You will find a single index.html file. You can rename it (e.g., DramaTracker-Offline.html) and distribute it directly to users!