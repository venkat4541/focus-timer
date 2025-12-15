# Pomodoro Timer - Deployment to venkatp.com/focus-timer

## ✅ Files Updated

All files have been configured for deployment at `venkatp.com/focus-timer`:

- ✅ `manifest.json` - Updated start_url, scope, and icon paths
- ✅ `service-worker.js` - Updated cache URLs
- ✅ `app.js` - Updated service worker registration
- ✅ `_redirects` - Created for Cloudflare Pages routing

---

## 🚀 Deployment Steps - Cloudflare Pages

### Option 1: Direct Upload (Quickest - 5 minutes)

1. **Login to Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com
   - Select your account

2. **Go to Pages**
   - Click "Workers & Pages" in the left sidebar
   - Click "Create application"
   - Click "Pages" tab
   - Click "Upload assets"

3. **Create Project**
   - Project name: `focus-timer` (or any name you like)
   - Click "Create project"

4. **Upload Files**
   - Drag and drop ALL files from `/Users/venkat/.gemini/antigravity/playground/dark-tyson/`:
     - index.html
     - index.css
     - app.js
     - manifest.json
     - service-worker.js
     - icon-192.png
     - icon-512.png
     - apple-touch-icon.png
     - _redirects
   - Click "Deploy site"

5. **Configure Custom Domain**
   - After deployment completes, click "Custom domains"
   - Click "Set up a custom domain"
   - Enter: `venkatp.com`
   - Cloudflare will automatically configure DNS
   - Your app will be live at: `https://venkatp.com/focus-timer`

---

### Option 2: Git Deployment (Better for Updates)

1. **Create Git Repository**
   ```bash
   cd /Users/venkat/.gemini/antigravity/playground/dark-tyson
   git init
   git add .
   git commit -m "Pomodoro Timer - Ready for deployment"
   ```

2. **Push to GitHub**
   - Create a new repository on GitHub (e.g., `pomodoro-timer`)
   - Follow GitHub's instructions:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/pomodoro-timer.git
   git branch -M main
   git push -u origin main
   ```

3. **Connect to Cloudflare Pages**
   - In Cloudflare Dashboard → Workers & Pages → Create application
   - Click "Pages" → "Connect to Git"
   - Authorize GitHub
   - Select your repository
   - Configure build settings:
     - **Framework preset:** None
     - **Build command:** (leave empty)
     - **Build output directory:** `/`
   - Click "Save and Deploy"

4. **Configure Custom Domain**
   - Go to "Custom domains" tab
   - Add `venkatp.com`
   - Cloudflare handles DNS automatically

---

## 📁 File Structure for Upload

Your deployment folder should contain:

```
dark-tyson/
├── index.html              ✅ Main app
├── index.css               ✅ Styles
├── app.js                  ✅ JavaScript
├── manifest.json           ✅ PWA manifest (updated)
├── service-worker.js       ✅ Service worker (updated)
├── icon-192.png            ✅ App icon
├── icon-512.png            ✅ App icon
├── apple-touch-icon.png    ✅ iOS icon
└── _redirects              ✅ Cloudflare routing (new)
```

---

## 🌐 After Deployment

Your app will be available at:
- **Production URL:** `https://venkatp.com/focus-timer`
- **Also accessible via:** Cloudflare Pages subdomain (e.g., `focus-timer.pages.dev`)

### Testing Checklist

Once deployed, test:
- ✅ Visit `https://venkatp.com/focus-timer`
- ✅ Create a timer and verify it works
- ✅ Toggle light/dark theme
- ✅ Test on mobile device
- ✅ Install as PWA on iPhone (Safari → Share → Add to Home Screen)
- ✅ Test offline functionality

---

## 📱 iPhone Installation

After deployment:

1. Open Safari on iPhone
2. Go to `https://venkatp.com/focus-timer`
3. Tap Share button
4. Tap "Add to Home Screen"
5. Tap "Add"
6. App icon appears on home screen!

---

## 🔧 Troubleshooting

**If /focus-timer doesn't work:**
- Make sure `_redirects` file is uploaded
- Check Cloudflare Pages deployment logs
- Verify custom domain is properly configured

**If PWA doesn't install:**
- Make sure you're using HTTPS (Cloudflare provides this automatically)
- Check that `manifest.json` is accessible at `/focus-timer/manifest.json`

**If service worker fails:**
- Check browser console for errors
- Verify service worker path is correct
- Clear browser cache and reload

---

## 🎯 Next Steps

1. Upload files to Cloudflare Pages (Option 1 is quickest)
2. Configure `venkatp.com` as custom domain
3. Test at `https://venkatp.com/focus-timer`
4. Install on your iPhone!

---

## 💡 Pro Tips

- **Automatic Deployments:** If you use Git (Option 2), every push to main branch auto-deploys
- **Preview Deployments:** Cloudflare creates preview URLs for every commit
- **Analytics:** Enable Cloudflare Web Analytics in dashboard for free visitor stats
- **Performance:** Cloudflare's global CDN makes your app super fast worldwide

---

All files are ready! Just upload to Cloudflare Pages and you're done! 🚀
