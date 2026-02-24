# Exact Render Settings for Frontend Deployment

## When Creating Static Site on Render Dashboard

### Basic Settings
```
Name: signature-app-frontend
```

### Build & Deploy Settings

#### Root Directory
```
frontend
```

#### Build Command
```
npm install && npm run build
```

#### Publish Directory
```
dist
```

#### Auto-Deploy
```
Yes
```

### Advanced Settings (Optional)

#### Branch
```
main
```
(or whatever your default branch is)

#### Environment Variables
Leave empty for now (add later if you need to connect to backend)

---

## Step-by-Step with Screenshots Guide

### 1. Go to Render Dashboard
- URL: https://dashboard.render.com/

### 2. Click "New +" Button
- Select: **"Static Site"**

### 3. Connect Repository
- Choose your Git provider (GitHub/GitLab/Bitbucket)
- Select your repository
- Click "Connect"

### 4. Fill in the Form

**Name:**
```
signature-app-frontend
```

**Root Directory:**
```
frontend
```

**Build Command:**
```
npm install && npm run build
```

**Publish Directory:**
```
dist
```

**Branch:**
```
main
```

**Auto-Deploy:**
```
Yes (checked)
```

### 5. Click "Create Static Site"

### 6. Wait for Build
- Build will start automatically
- Takes 2-5 minutes
- Watch the logs for progress

### 7. Get Your URL
- After successful build, you'll get a URL like:
- `https://signature-app-frontend.onrender.com`

---

## Important Notes

### ✅ DO:
- Set Root Directory to `frontend`
- Use `npm install && npm run build` as build command
- Set Publish Directory to `dist`
- Enable Auto-Deploy

### ❌ DON'T:
- Don't leave Root Directory empty
- Don't use `npm start` (that's for development)
- Don't set Publish Directory to `frontend/dist` (just `dist`)
- Don't add a Start Command (static sites don't need it)

---

## If You See Errors

### "Build Failed"
- Check the build logs
- Verify `npm run build` works locally
- Make sure you set Root Directory to `frontend`

### "404 Not Found"
- Verify Publish Directory is set to `dist`
- Check that `_redirects` file exists in `frontend/` folder

### "Permission Denied"
- This is already fixed by using `npx` in package.json
- If still occurs, contact Render support

---

## After Deployment

### To Update Your Site
Just push to your Git repository:
```bash
git add .
git commit -m "Update frontend"
git push origin main
```

Render will automatically rebuild and redeploy!

### To Add Environment Variables
1. Go to your Static Site dashboard
2. Click "Environment" tab
3. Add variables like:
   - Key: `VITE_API_URL`
   - Value: `https://your-backend.onrender.com`
4. Click "Save Changes"
5. Site will automatically redeploy

---

## Summary - Copy These Values

When Render asks for:

| Field | Value |
|-------|-------|
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |
| Start Command | (leave empty - not needed for static sites) |
| Branch | `main` |
| Auto-Deploy | Yes |

That's it! 🚀
