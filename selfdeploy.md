# Self-Deploy Novel on Mac

This guide provides detailed instructions for running Novel locally on macOS and creating a standalone Mac application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Building for Production](#building-for-production)
- [Creating a Standalone Mac App](#creating-a-standalone-mac-app)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed on your Mac:

### Required Software

1. **Node.js** (version 18.17 or later)
   ```bash
   # Install using Homebrew
   brew install node
   
   # Or download from https://nodejs.org/
   # Verify installation
   node --version
   npm --version
   ```

2. **pnpm** (Package Manager)
   ```bash
   # Install pnpm globally
   npm install -g pnpm
   
   # Or using Homebrew
   brew install pnpm
   
   # Verify installation
   pnpm --version
   ```

3. **Git**
   ```bash
   # Install using Homebrew (if not already installed)
   brew install git
   
   # Verify installation
   git --version
   ```

### Optional but Recommended

4. **Homebrew** (Package Manager for macOS)
   ```bash
   # Install Homebrew if you don't have it
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

## Local Development Setup

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/steven-tey/novel.git
cd novel
```

### 2. Install Dependencies

```bash
# Install all dependencies using pnpm
pnpm install
```

This will install dependencies for all packages in the monorepo workspace.

## Environment Configuration

### 1. Create Environment File

```bash
# Navigate to the web app directory
cd apps/web

# Copy the example environment file
cp .env.example .env.local
```

### 2. Configure Environment Variables

Edit the `.env.local` file with your preferred text editor:

```bash
# Open with nano
nano .env.local

# Or with VS Code
code .env.local

# Or with vim
vim .env.local
```

#### Required Configuration

```env
# OpenAI API Key (Required for AI features)
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Custom OpenAI Base URL
OPENAI_BASE_URL=https://api.openai.com/v1
```

#### Optional Configuration

```env
# Vercel Blob (for image uploads)
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# Vercel KV (for rate limiting)
KV_REST_API_URL=your_kv_url
KV_REST_API_TOKEN=your_kv_token
```

### 3. Getting API Keys

#### OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/account/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key and paste it in your `.env.local` file

#### Vercel Blob Token (Optional)
1. Visit [Vercel Dashboard](https://vercel.com/dashboard)
2. Create a new project or select existing one
3. Go to Storage → Blob
4. Create a new Blob store
5. Copy the read/write token

## Running the Application

### Development Mode

From the root directory of the project:

```bash
# Start the development server
pnpm dev
```

This will start the development server on `http://localhost:3000`.

### Alternative: Run Only Web App

If you want to run only the web application:

```bash
# Navigate to web app directory
cd apps/web

# Start development server
pnpm dev
```

### Accessing the Application

1. Open your web browser
2. Navigate to `http://localhost:3000`
3. You should see the Novel editor interface

## Building for Production

### 1. Build the Application

```bash
# From the root directory
pnpm build
```

### 2. Start Production Server

```bash
# Navigate to web app directory
cd apps/web

# Start production server
pnpm start
```

The production server will run on `http://localhost:3000`.

## Creating a Standalone Mac App

There are several approaches to create a standalone Mac application from your Novel web app:

### Option 1: Electron (Recommended)

Electron allows you to package your web application as a native Mac app.

#### Setup Electron

1. **Create Electron wrapper directory:**
   ```bash
   mkdir novel-electron
   cd novel-electron
   npm init -y
   ```

2. **Install Electron:**
   ```bash
   npm install electron --save-dev
   npm install electron-builder --save-dev
   ```

3. **Create main Electron file (`main.js`):**
   ```javascript
   const { app, BrowserWindow } = require('electron');
   const path = require('path');
   const isDev = require('electron-is-dev');

   function createWindow() {
     const mainWindow = new BrowserWindow({
       width: 1200,
       height: 800,
       webPreferences: {
         nodeIntegration: false,
         contextIsolation: true,
         enableRemoteModule: false,
         webSecurity: true
       },
       titleBarStyle: 'hiddenInset',
       icon: path.join(__dirname, 'assets/icon.png') // Add your icon
     });

     // Load the app
     const startUrl = isDev 
       ? 'http://localhost:3000' 
       : `file://${path.join(__dirname, '../apps/web/out/index.html')}`;
     
     mainWindow.loadURL(startUrl);

     // Open DevTools in development
     if (isDev) {
       mainWindow.webContents.openDevTools();
     }
   }

   app.whenReady().then(createWindow);

   app.on('window-all-closed', () => {
     if (process.platform !== 'darwin') {
       app.quit();
     }
   });

   app.on('activate', () => {
     if (BrowserWindow.getAllWindows().length === 0) {
       createWindow();
     }
   });
   ```

4. **Update package.json:**
   ```json
   {
     "main": "main.js",
     "scripts": {
       "electron": "electron .",
       "electron-dev": "ELECTRON_IS_DEV=true electron .",
       "build-electron": "electron-builder",
       "dist": "npm run build && electron-builder"
     },
     "build": {
       "appId": "com.yourname.novel",
       "productName": "Novel Editor",
       "directories": {
         "output": "dist"
       },
       "files": [
         "build/**/*",
         "main.js",
         "package.json"
       ],
       "mac": {
         "category": "public.app-category.productivity",
         "target": "dmg"
       }
     }
   }
   ```

5. **Build and run:**
   ```bash
   # Development
   npm run electron-dev

   # Production build
   npm run dist
   ```

### Option 2: Tauri (Rust-based, smaller bundle)

Tauri creates smaller, more secure desktop apps using Rust.

1. **Install Rust:**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source ~/.cargo/env
   ```

2. **Install Tauri CLI:**
   ```bash
   cargo install tauri-cli
   ```

3. **Initialize Tauri in your project:**
   ```bash
   cd apps/web
   cargo tauri init
   ```

4. **Configure tauri.conf.json:**
   ```json
   {
     "build": {
       "beforeDevCommand": "pnpm dev",
       "beforeBuildCommand": "pnpm build",
       "devPath": "http://localhost:3000",
       "distDir": "../out"
     }
   }
   ```

5. **Build the app:**
   ```bash
   cargo tauri build
   ```

### Option 3: Progressive Web App (PWA)

Convert Novel to a PWA that can be installed from the browser.

1. **Add PWA configuration to Next.js:**
   ```bash
   cd apps/web
   npm install next-pwa
   ```

2. **Update next.config.js:**
   ```javascript
   const withPWA = require('next-pwa')({
     dest: 'public',
     register: true,
     skipWaiting: true,
   });

   module.exports = withPWA({
     // your existing config
   });
   ```

3. **Add manifest.json and service worker files**

4. **Users can install from Safari:** Share → Add to Dock

### Option 4: Nativefier (Simple wrapper)

Quick solution using Nativefier:

```bash
# Install nativefier globally
npm install -g nativefier

# Create Mac app (after starting your local server)
nativefier --platform=osx --arch=x64 "http://localhost:3000" "Novel Editor"
```

## Recommended Approach: Electron

For the best user experience and full native integration, **Electron is recommended** because:

- ✅ Full native Mac integration
- ✅ Menu bar and dock integration
- ✅ File system access
- ✅ Auto-updater support
- ✅ Code signing and notarization support
- ✅ Large community and ecosystem

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 pnpm dev
```

#### Permission Issues
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
```

#### Node Version Issues
```bash
# Use Node Version Manager
brew install nvm
nvm install 18
nvm use 18
```

#### pnpm Installation Issues
```bash
# Clear pnpm cache
pnpm store prune

# Reinstall dependencies
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

#### Environment Variables Not Loading
- Ensure `.env.local` is in the `apps/web` directory
- Restart the development server after changing environment variables
- Check that variable names match exactly (case-sensitive)

### Performance Optimization

#### For Development
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm dev
```

#### For Production
```bash
# Build with optimizations
NODE_ENV=production pnpm build
```

### Getting Help

- **GitHub Issues:** [https://github.com/steven-tey/novel/issues](https://github.com/steven-tey/novel/issues)
- **Documentation:** [https://novel.sh/docs](https://novel.sh/docs)
- **Discord Community:** Check the GitHub README for community links

## Security Considerations

When deploying locally or creating a standalone app:

1. **API Keys:** Never commit API keys to version control
2. **HTTPS:** Use HTTPS in production environments
3. **CORS:** Configure CORS properly for your domain
4. **Rate Limiting:** Implement rate limiting for API endpoints
5. **Input Validation:** Validate all user inputs

## Next Steps

After successfully running Novel locally:

1. **Customize the editor** by modifying components in `apps/web/components/`
2. **Add new features** by extending the Tiptap editor configuration
3. **Deploy to production** using Vercel, Netlify, or your preferred hosting platform
4. **Create a standalone app** using one of the methods described above

---

**Note:** This guide assumes you're using the latest version of Novel. If you encounter issues, please check the official repository for updates and changes.