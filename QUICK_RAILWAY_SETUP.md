# ⚡ QUICK CHECKLIST FOR RAILWAY TEAM

## 🎯 What to Do in Railway Dashboard (5 minutes)

### Add 3 Environment Variables:

Go to: Railway App → Settings → Variables

| Name | Value |
|------|-------|
| `DATABASE_URL` | `postgresql://postgres.pzivujkhjjuwudguexyl:jordleie123@aws-1-eu-west-1.pooler.supabase.com:5432/postgres` |
| `PORT` | `3000` |
| `NODE_ENV` | `production` |

### That's it! ✅

Railway will auto-redeploy. Give it 2-3 minutes.

---

## 🧪 Test It Works

Visit: https://jl-production-92f6.up.railway.app/auksjoner

**Should see**: A list of 6 farms with details (location, size, bids, etc.)

**If it works**: ✅ Done!

**If blank/error**: Check Railway Logs tab for "database" errors

---

## ❓ If Something's Wrong

### Most Common Issue:
Database connection error → Check DATABASE_URL is copied exactly

### How to Check:
1. Go to Railway → Logs tab
2. Look for errors mentioning "database" or "postgres"
3. If it says "Can't reach database" → DATABASE_URL might be wrong

---

## 📞 Need Help?
Contact dev team with error message from Logs tab.

