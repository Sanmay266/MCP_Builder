# MCPForge Deployment Guide

## Prerequisites
- GitHub account
- Neon account (https://neon.tech)
- Render account (https://render.com)
- Vercel account (https://vercel.com)

---

## Step 1: Database Setup (Neon)

1. Go to https://neon.tech and sign up
2. Create a new project named "mcpforge"
3. Copy the connection string (looks like: `postgresql://user:pass@ep-xxx.neon.tech/mcpforge`)
4. Save it for later

---

## Step 2: Backend Deployment (Render)

1. Go to https://render.com/dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `mcpforge-api`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

5. Add Environment Variables:
   - `DATABASE_URL` = Your Neon connection string
   - `FRONTEND_URL` = `https://your-app.vercel.app` (you'll get this after frontend deploy)
   - `ENVIRONMENT` = `production`

6. Click "Create Web Service"
7. Wait for deployment (5-10 minutes)
8. Copy your backend URL (e.g., `https://mcpforge-api.onrender.com`)

---

## Step 3: Frontend Deployment (Vercel)

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

4. Add Environment Variable:
   - `NEXT_PUBLIC_API_URL` = Your Render backend URL (from Step 2)

5. Click "Deploy"
6. Wait for deployment (2-5 minutes)
7. Copy your frontend URL (e.g., `https://mcpforge.vercel.app`)

---

## Step 4: Update Backend CORS

1. Go back to Render dashboard
2. Open your `mcpforge-api` service
3. Go to "Environment" tab
4. Update `FRONTEND_URL` to your Vercel URL
5. Save changes (will trigger redeploy)

---

## Step 5: Test Deployment

1. Visit your Vercel URL
2. Create a test project
3. Add a tool
4. Export server
5. Check that everything works

### Health Checks
- Backend health: `https://your-backend.onrender.com/health`
- Database health: `https://your-backend.onrender.com/health/db`

---

## Troubleshooting

### Backend won't start
- Check Render logs for errors
- Verify DATABASE_URL is correct
- Ensure all dependencies in requirements.txt

### Frontend can't reach backend
- Check CORS settings in backend
- Verify NEXT_PUBLIC_API_URL is set correctly
- Check browser console for errors

### Database connection fails
- Verify Neon connection string
- Check if Neon project is active
- Test connection from Render logs

---

## Free Tier Limits

| Service | Free Limit | What Happens After |
|---------|------------|-------------------|
| Neon | 512MB storage | Need to upgrade ($19/month) |
| Render | 750 hours/month | Service sleeps after 15 min idle |
| Vercel | Unlimited | Still free for hobby projects |

---

## Monitoring

### Render
- View logs: Dashboard → Service → Logs
- Check metrics: Dashboard → Service → Metrics

### Vercel
- View deployments: Dashboard → Project → Deployments
- Check analytics: Dashboard → Project → Analytics

### Neon
- Check usage: Dashboard → Project → Usage

---

## Updating After Deployment

### Backend Updates
1. Push changes to GitHub
2. Render auto-deploys from main branch
3. Check logs to verify deployment

### Frontend Updates
1. Push changes to GitHub
2. Vercel auto-deploys from main branch
3. Check deployment status in Vercel dashboard

---

## Custom Domain (Optional)

### Vercel (Frontend)
1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records as instructed

### Render (Backend)
1. Go to Service Settings → Custom Domain
2. Add your domain
3. Update DNS records as instructed

---

## Backup & Recovery

### Database Backup
- Neon provides automatic backups
- Access via Dashboard → Project → Backups

### Project Backup
- Users can export projects as JSON
- Store backups in GitHub or cloud storage

---

## Security Checklist

- [x] Environment variables not in code
- [x] CORS configured for production URLs only
- [x] Security headers enabled
- [x] HTTPS enforced (automatic on Vercel/Render)
- [x] Database connection encrypted (Neon default)

---

## Cost Estimate

| Scenario | Monthly Cost |
|----------|--------------|
| **Free Tier** (< 100 users) | $0 |
| **Light Usage** (100-500 users) | $0-20 |
| **Medium Usage** (500-2000 users) | $50-100 |

---

## Support

- Render: https://render.com/docs
- Vercel: https://vercel.com/docs
- Neon: https://neon.tech/docs
