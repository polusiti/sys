# English Learning System - Deployment Configuration

## Cloudflare R2 Configuration
- **Bucket Name**: questa
- **Base URL**: https://pub-questa.r2.dev
- **Site Domain**: allfrom0.top
- **Deployment Path**: /english/

## File Structure
```
/ (root domain: allfrom0.top)
├── english/
│   ├── index.html (main landing page)
│   ├── practice.html (practice system)
│   ├── english-manager.html (management system)
│   ├── manifest.json (PWA manifest)
│   ├── sw.js (service worker)
│   ├── voca/ (vocabulary module)
│   │   ├── index.html
│   │   └── sample-data.js
│   ├── grammar/ (grammar module)
│   │   ├── index.html
│   │   └── sample-data.js
│   ├── reading/ (reading module)
│   │   ├── index.html
│   │   └── sample-data.js
│   ├── listening/ (listening module)
│   │   ├── index.html
│   │   └── sample-data.js
│   └── write/ (writing/summary module)
│       ├── index.html
│       ├── summary.html
│       └── sample-data.js
```

## Deployment Instructions

### 1. Upload to GitHub Repository
- Commit all files to: https://github.com/polusiti/sys
- Ensure files are in the `/english/` directory

### 2. Configure Cloudflare R2
1. Create bucket named "questa"
2. Upload static assets to the bucket
3. Set bucket to public access
4. Configure custom domain if needed

### 3. Deploy to allfrom0.top
- Deploy files to the `/english/` path on your domain
- Ensure proper MIME types are set for JavaScript files
- Test all functionality including PWA features

### 4. PWA Configuration
- The manifest.json is configured for PWA installation
- Service worker handles offline functionality
- Icons should be placed in `/english/assets/icons/` directory

## Features
- **35+ Sample Questions**: Across all 5 modules
- **PWA Support**: Offline functionality and app-like experience
- **Cloudflare R2 Integration**: Efficient asset delivery
- **Responsive Design**: Works on all devices
- **Japanese Language Support**: Full Japanese interface