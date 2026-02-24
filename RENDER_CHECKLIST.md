# Render Deployment Checklist ✅

## Before Deployment
- [x] Build works locally (`npm run build`)
- [x] `render.yaml` created
- [x] `_redirects` file created
- [x] `package.json` scripts updated with `npx`
- [x] `vite.config.js` optimized for production

## Deployment Steps

### 1. Push to Git
```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### 2. Create Static Site on Render
1. Go to: https://dashboard.render.com/
2. Click: **New +** → **Static Site**
3. Connect your repository
4. Configure:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
5. Click: **Create Static Site**

### 3. Wait for Build
- Build time: ~2-5 minutes
- Watch logs for any errors
- Get your URL: `https://your-app-name.onrender.com`

## After Deployment

### Test Your Site
- [ ] Homepage loads correctly
- [ ] All routes work (no 404 errors)
- [ ] PDF upload works
- [ ] Signature creation works
- [ ] Download functionality works

### Connect to Backend (If Deployed)
1. Add environment variable in Render:
   - Key: `VITE_API_URL`
   - Value: `https://your-backend-url.onrender.com`
2. Update `frontend/src/services/api.js`:
   ```javascript
   const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
   ```
3. Redeploy

## Your Render URLs
- Frontend: `https://signature-app-frontend.onrender.com` (will be assigned)
- Backend: `https://your-backend-name.onrender.com` (if deployed)

## Common Issues

### Build Fails
- Check Node.js version (should be 18+)
- Verify `npm run build` works locally
- Check build logs in Render dashboard

### Routes Return 404
- Verify `_redirects` file exists
- Check it's copied to `dist/` folder

### Blank Page
- Check browser console for errors
- Verify API URL is correct
- Check CORS settings on backend

## Need Help?
- Read: `RENDER_DEPLOYMENT.md` for detailed guide
- Render Docs: https://render.com/docs/static-sites
- Community: https://community.render.com/
