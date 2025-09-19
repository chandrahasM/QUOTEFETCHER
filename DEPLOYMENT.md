# 🚀 Deployment Guide - Render

This guide will help you deploy the Quote Fetcher application to Render.

## 📋 Prerequisites

1. **GitHub Repository**: Your code should be pushed to GitHub
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **Node.js**: Version 16 or higher

## 🛠️ Step-by-Step Deployment

### Step 1: Push Your Code to GitHub

```bash
# Add all files
git add .

# Commit changes
git commit -m "Add deployment configuration"

# Push to GitHub
git push origin main
```

### Step 2: Deploy Backend to Render

1. **Go to Render Dashboard**
   - Visit [render.com](https://render.com)
   - Sign in with your GitHub account

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `chandrahasM/QUOTEFETCHER`

3. **Configure Backend Service**
   ```
   Name: quotefetcher-backend
   Environment: Node
   Region: Choose closest to your users
   Branch: main
   Root Directory: backend
   Build Command: npm install
   Start Command: npm start
   ```

4. **Environment Variables**
   ```
   NODE_ENV=production
   PORT=10000
   PUPPETEER_MAX_CONCURRENT_TABS=5
   PUPPETEER_MAX_PAGES=10
   PUPPETEER_TIMEOUT=30000
   ```

5. **Advanced Settings**
   - **Health Check Path**: `/health`
   - **Auto-Deploy**: Yes (for automatic deployments)

### Step 3: Deploy Frontend to Render

1. **Create New Static Site**
   - Click "New +" → "Static Site"
   - Connect your GitHub repository: `chandrahasM/QUOTEFETCHER`

2. **Configure Frontend Service**
   ```
   Name: quotefetcher-frontend
   Environment: Static Site
   Region: Choose closest to your users
   Branch: main
   Root Directory: frontend
   Build Command: npm install && npm run build
   Publish Directory: build
   ```

3. **Environment Variables**
   ```
   REACT_APP_API_URL=https://quotefetcher-backend.onrender.com
   ```

### Step 4: Update Backend CORS Settings

Update your backend to allow the frontend domain:

```javascript
// In backend/src/server.js
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://quotefetcher-frontend.onrender.com'
  ]
}));
```

## 🔧 Configuration Files

### render.yaml (Root Directory)
```yaml
services:
  - type: web
    name: quotefetcher-backend
    env: node
    plan: free
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
```

### Backend package.json
- Added `engines` field for Node.js version
- Ensured all dependencies are listed

### Frontend package.json
- Added `engines` field for Node.js version
- Environment variable for API URL

## 🌐 Access Your Application

After deployment:

- **Frontend**: `https://quotefetcher-frontend.onrender.com`
- **Backend API**: `https://quotefetcher-backend.onrender.com`
- **API Documentation**: `https://quotefetcher-backend.onrender.com/api-docs`
- **Health Check**: `https://quotefetcher-backend.onrender.com/health`

## 🐛 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version (must be 16+)
   - Verify all dependencies are in package.json
   - Check build logs in Render dashboard

2. **CORS Errors**
   - Update CORS settings in backend
   - Ensure frontend URL is whitelisted

3. **Puppeteer Issues**
   - Render has limited Puppeteer support on free tier
   - Consider using a different scraping service for production

4. **Memory Issues**
   - Free tier has limited memory
   - Optimize Puppeteer settings
   - Consider upgrading to paid plan

### Performance Optimizations for Render

1. **Reduce Puppeteer Concurrency**
   ```javascript
   maxConcurrentTabs: 3  // Reduced from 10
   ```

2. **Optimize Memory Usage**
   ```javascript
   // In scraper.js
   const browser = await puppeteer.launch({
     headless: true,
     args: [
       '--no-sandbox',
       '--disable-setuid-sandbox',
       '--disable-dev-shm-usage',
       '--memory-pressure-off'
     ]
   });
   ```

3. **Add Request Timeouts**
   ```javascript
   // Add timeout to all requests
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 10000);
   ```

## 📊 Monitoring

- **Render Dashboard**: Monitor service health and logs
- **Health Checks**: Use `/health` endpoint for monitoring
- **Logs**: Check Render logs for debugging

## 🔄 Continuous Deployment

- **Auto-Deploy**: Enabled by default
- **Manual Deploy**: Trigger from Render dashboard
- **Rollback**: Available in Render dashboard

## 💰 Cost Considerations

- **Free Tier**: Limited resources, good for testing
- **Paid Plans**: Better performance, more resources
- **Usage Limits**: Monitor bandwidth and compute usage

## 🚀 Next Steps

1. **Test the deployment** thoroughly
2. **Monitor performance** and optimize as needed
3. **Set up monitoring** and alerting
4. **Consider upgrading** to paid plan for production use
5. **Implement caching** for better performance

---

**Happy Deploying! 🎉**
