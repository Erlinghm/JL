# 🚀 Railway + Supabase Setup Guide

## ✅ Configuration Checklist

### In Railway Dashboard:
1. **Go to your JL project** in https://railway.app
2. **Click on your service** (jordleie-no or similar)
3. **Go to Settings tab**
4. **Click "Variables"**
5. **Add these environment variables:**

```
DATABASE_URL=postgresql://postgres.pzivujkhjjuwudguexyl:jordleie123@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
PORT=3000
NODE_ENV=production
```

### In Supabase Dashboard:
- Verify your PostgreSQL is running ✅
- Check backup status
- Optional: Enable Row Level Security (RLS) for authentication

---

## 📝 Important Files

### `.env` (Local Development)
```
DATABASE_URL="postgresql://postgres.pzivujkhjjuwudguexyl:jordleie123@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"
PORT=3000
```

### Railway Production URL
```
https://jl-production-92f6.up.railway.app/
```

---

## 🔍 Verify Connection

Visit these URLs to test:

1. **Home Page**: https://jl-production-92f6.up.railway.app/
2. **Auctions Page**: https://jl-production-92f6.up.railway.app/auksjoner
3. **Farm Details**: https://jl-production-92f6.up.railway.app/auksjoner/1

---

## 🐛 Troubleshooting

If the app doesn't work on Railway:

### 1. Check Railway Logs
- Go to Railway dashboard
- Click your service
- Go to **Logs** tab
- Look for errors

### 2. Common Issues

**"Can't reach database server"**
- Verify DATABASE_URL is correct in Railway Variables
- Check if Supabase project is running

**"Port already in use"**
- Railway handles this automatically via PORT env var
- Should be set to 3000

**"Module not found"**
- Run: `npm install` locally
- Commit `package-lock.json` to git
- Railway will auto-install dependencies on deploy

---

## 🔐 Security Note

Your Supabase password is in the DATABASE_URL. 

**Best Practice for Production:**
1. Generate a separate read-only Supabase user for production
2. Use different passwords for dev vs production
3. Rotate passwords regularly
4. Consider using Supabase's built-in connection pooling

---

## 📊 Monitor in Production

- **Supabase Dashboard**: Monitor query performance
- **Railway Dashboard**: Monitor app metrics
- **Railway Logs**: Check for errors in real-time

