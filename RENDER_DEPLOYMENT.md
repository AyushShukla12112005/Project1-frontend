# Render Deployment Guide for Signature App Frontend

## Prerequisites
- GitHub/GitLab/Bitbucket account with your code pushed
- Render account (sign up at https://render.com)

## Step-by-Step Deployment

### 1. Push Your Code to Git
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Create Static Site on Render

1. Go to https://dashboard.render.com/
2. Click **"New +"** button → Select **"Static Site"**
3. Connect your Git repository
4. Configure the following settings:

#### Basic Settings
- **Name**: `signature-app-frontend` (or your preferred name)
- **Root Directory**: `frontend`
- **Branch**: `main` (or your default branch)

#### Build Settings
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`

#### Advanced Settings (Optional)
- **Auto-Deploy**: Yes (recommended)
- **Pull Request Previews**: Enabled (optional)

5. Click **"Create Static Site"**

### 3. Wait for Deployment
- Render will automatically build and deploy your site
- Build typically takes 2-5 minutes
- You'll get a URL like: `https://signature-app-frontend.onrender.com`

## Environment Variables (If Needed)

If your frontend needs to connect to a backend API:

1. Go to your Static Site dashboard on Render
2. Click **"Environment"** tab
3. Add environment variables:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```
4. Click **"Save Changes"**
5. Render will automatically redeploy

## Update Your Code to Use Environment Variables

In your `frontend/src/services/api.js`, update the base URL:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

## Troubleshooting

### Build Fails
- Check the build logs in Render dashboard
- Verify `npm run build` works locally
- Ensure all dependencies are in `package.json`

### 404 Errors on Routes
- The `_redirects` file should handle this automatically
- Verify `_redirects` file exists in `frontend/` directory

### API Connection Issues
- Update API URLs to use your deployed backend
- Configure CORS on your backend to allow your Render frontend domain

## Custom Domain (Optional)

1. Go to your Static Site dashboard
2. Click **"Settings"** → **"Custom Domains"**
3. Click **"Add Custom Domain"**
4. Follow the instructions to configure DNS

## Automatic Deployments

Render automatically deploys when you push to your connected branch:
```bash
git add .
git commit -m "Update frontend"
git push origin main
```

Your site will automatically rebuild and redeploy!

## Monitoring

- View build logs: Dashboard → Your Site → "Logs"
- Check deployment status: Dashboard → Your Site → "Events"
- Monitor performance: Dashboard → Your Site → "Metrics"

## Cost

- Static sites on Render are **FREE**
- No credit card required
- Includes:
  - Automatic SSL certificates
  - Global CDN
  - Unlimited bandwidth
  - Custom domains

## Support

If you encounter issues:
- Check Render documentation: https://render.com/docs/static-sites
- Render community: https://community.render.com/
- Contact Render support: https://render.com/support
