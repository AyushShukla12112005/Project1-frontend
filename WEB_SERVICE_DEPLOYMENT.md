# Deploy Frontend as Web Service on Render

## ✅ Your Frontend is Now Ready for Web Service!

I've configured your frontend to run as a Web Service using the `serve` package.

---

## 📋 Render Web Service Settings

### Basic Settings
```
Name: signature-app-frontend
Environment: Node
```

### Build & Deploy Settings

#### Root Directory
```
frontend
```

#### Build Command
```
npm install && node node_modules/vite/bin/vite.js build
```

#### Start Command
```
npm start
```

---

## 🚀 Step-by-Step Deployment

### 1. Push Your Code
```bash
git add .
git commit -m "Configure for Render Web Service"
git push origin main
```

### 2. Create Web Service on Render

1. Go to https://dashboard.render.com/
2. Click **"New +"** → Select **"Web Service"**
3. Connect your Git repository
4. Configure settings:

**Name:**
```
signature-app-frontend
```

**Root Directory:**
```
frontend
```

**Environment:**
```
Node
```

**Build Command:**
```
npm install && node node_modules/vite/bin/vite.js build
```

**Start Command:**
```
npm start
```

**Instance Type:**
```
Free (or Starter if you need more resources)
```

5. Click **"Create Web Service"**

### 3. Wait for Deployment
- Build takes 2-5 minutes
- Service will start automatically
- You'll get a URL like: `https://signature-app-frontend.onrender.com`

---

## 🔧 What Changed?

1. **Added `serve` package** to dependencies
   - Lightweight HTTP server for production
   - Handles SPA routing automatically

2. **Updated `start` script**
   - Now runs: `serve dist -s -l $PORT`
   - `-s` = Single Page App mode (handles routing)
   - `-l $PORT` = Listen on Render's assigned port

3. **Created `serve.json`**
   - Configures URL rewrites for React Router
   - Adds security headers

4. **Updated `render.yaml`**
   - Changed from `static` to `web` service
   - Added `startCommand`

---

## 💰 Cost Comparison

### Static Site (FREE)
- ✅ Free forever
- ✅ Served from CDN
- ✅ Faster
- ❌ No server-side logic

### Web Service (FREE tier available)
- ✅ Free tier: 750 hours/month
- ✅ Can add server-side logic later
- ✅ More control
- ❌ Spins down after 15 min of inactivity (free tier)
- ❌ Slower cold starts

---

## 🎯 Environment Variables (Optional)

If you need to connect to a backend:

1. Go to your Web Service dashboard
2. Click **"Environment"** tab
3. Add variables:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```
4. Click **"Save Changes"**
5. Service will automatically redeploy

---

## 🔍 Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Verify `npm run build` works locally
- Ensure Node.js version is 18+

### Service Won't Start
- Check start logs
- Verify `npm start` works locally after building
- Make sure `serve` package is installed

### 404 Errors on Routes
- `serve.json` should handle this automatically
- Verify the file exists in `frontend/` directory

### Port Issues
- The `serve` command uses `$PORT` environment variable
- Render automatically sets this
- Don't hardcode the port

---

## 📊 Monitoring

After deployment, you can:
- View logs: Dashboard → Your Service → "Logs"
- Check metrics: Dashboard → Your Service → "Metrics"
- Monitor health: Dashboard → Your Service → "Events"

---

## 🔄 Auto-Deploy

Render automatically redeploys when you push to your branch:
```bash
git add .
git commit -m "Update frontend"
git push origin main
```

---

## ⚡ Quick Reference

| Setting | Value |
|---------|-------|
| Service Type | Web Service |
| Root Directory | `frontend` |
| Build Command | `npm install && node node_modules/vite/bin/vite.js build` |
| Start Command | `npm start` |
| Environment | Node |

---

## 🆚 Static Site vs Web Service

**Use Static Site if:**
- You only need to serve static files
- You want it completely free
- You want faster performance (CDN)

**Use Web Service if:**
- You might add server-side logic later
- You need more control
- You're okay with cold starts on free tier

---

Your frontend is ready to deploy as a Web Service! 🚀
