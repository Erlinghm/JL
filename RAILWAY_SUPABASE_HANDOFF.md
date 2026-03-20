# 🚀 Handoff: Connecting Railway to Supabase PostgreSQL

## 📋 Summary
We've migrated the Jordleie.no app from SQLite to Supabase PostgreSQL with Prisma ORM. Now we need to configure Railway to connect to Supabase in production.

**Production URL**: https://jl-production-92f6.up.railway.app/

---

## ✅ WHAT WE'VE ALREADY DONE (Dev Team)

### Code Changes ✅
- [x] Migrated Prisma schema from SQLite to PostgreSQL
- [x] Updated `app.js` to use Prisma Client
- [x] Rewrote `models/Farm.js` for async/await with Prisma
- [x] Updated `seed.js` to populate PostgreSQL
- [x] Tested locally - app runs successfully on PostgreSQL
- [x] All 6 sample farms seeded and visible in UI

### Files Modified:
- `prisma/schema.prisma` - Changed datasource provider to PostgreSQL
- `app.js` - Updated to import Prisma Client
- `models/Farm.js` - Converted to Prisma queries
- `seed.js` - Uses Prisma Client instead of SQLite
- `.env` - Added Supabase connection string

### Database Status:
- ✅ All tables created in Supabase PostgreSQL
- ✅ Sample data seeded (6 farms)
- ✅ Ready for production

---

## 🔑 WHAT WE NEED FROM SUPABASE

### Current Supabase Project Details:
- **Project ID**: `pzivujkhjjuwudguexyl`
- **Region**: EU (aws-1-eu-west-1)
- **Database**: postgres (default)
- **Connection Type**: Session Pooler (IPv4 compatible)

### Supabase Connection String:
```
postgresql://postgres.pzivujkhjjuwudguexyl:jordleie123@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

**⚠️ NOTE**: This is the Session Pooler endpoint (port 5432, not 6543)

---

## 🛤️ WHAT RAILWAY PERSON NEEDS TO DO

### Step 1: Add Environment Variables in Railway Dashboard

1. Go to https://railway.app
2. Open the **JL project** (or jordleie-no service)
3. Click on the **service/app name**
4. Go to **Settings** tab
5. Click **Variables**
6. **Add these three variables:**

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://postgres.pzivujkhjjuwudguexyl:jordleie123@aws-1-eu-west-1.pooler.supabase.com:5432/postgres` |
| `PORT` | `3000` |
| `NODE_ENV` | `production` |

**⚠️ IMPORTANT**: Copy the DATABASE_URL exactly as shown above

### Step 2: Verify Build & Deployment

1. After adding variables, Railway should auto-redeploy
2. Check the **Deployments** tab to see if build succeeded
3. Look for a **green checkmark** ✅ (not a red X ❌)

### Step 3: Check Logs for Errors

1. Go to **Logs** tab in the service
2. Look for the line: `🚜 Jordleie.no kjører på ...` 
3. If you see errors about "database", check:
   - DATABASE_URL is correct
   - Supabase project is running
   - Connection string hasn't changed

### Step 4: Test the Connection

Once deployed, visit these URLs to verify it works:

- **Home**: https://jl-production-92f6.up.railway.app/
- **Auctions List**: https://jl-production-92f6.up.railway.app/auksjoner
- **First Farm**: https://jl-production-92f6.up.railway.app/auksjoner/1

If you see a list of farms with data → ✅ **Connected successfully!**

---

## 📊 What We Need to Do After Railway Setup

### 1. Verify Production Data
- [ ] Check that farms load on production URL
- [ ] Verify database connection in Railway logs
- [ ] Test filtering by region (`/auksjoner?fylke=Østfold`)
- [ ] Test individual farm page

### 2. Monitor Production
- [ ] Set up Railway alerts for deployment failures
- [ ] Check Supabase dashboard for query performance
- [ ] Monitor app errors in Railway logs

### 3. Security Improvements (Optional but Recommended)
- [ ] Rotate Supabase password for production
- [ ] Create a separate read-only Supabase user for app
- [ ] Enable IP whitelisting in Supabase if available
- [ ] Set up HTTPS (Railway handles this automatically)

### 4. Database Backup
- [ ] Verify Supabase backups are enabled
- [ ] Test restore procedure
- [ ] Document backup location and retention

---

## 🔄 If Connection Fails

### Troubleshooting Checklist for Railway Person:

**Error: "Can't reach database server"**
- [ ] Verify DATABASE_URL in Railway Variables is exactly correct
- [ ] Check if Supabase project is running (https://supabase.com)
- [ ] Try testing connection with psql tool: 
  ```
  psql "postgresql://postgres.pzivujkhjjuwudguexyl:jordleie123@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"
  ```

**Error: "Module not found"**
- [ ] Check if `npm install` ran during build
- [ ] Verify `package-lock.json` was committed to git
- [ ] Check Railway build logs for npm errors

**Error: "Port already in use"**
- [ ] This should not happen - Railway manages ports
- [ ] Try restarting the service

**App loads but no data showing**
- [ ] Check if DATABASE_URL points to correct Supabase project
- [ ] Verify data exists in Supabase (use Supabase dashboard)
- [ ] Check Railway logs for SQL errors

---

## 📞 Contact Information

### For Database Issues:
- Check Supabase status: https://status.supabase.com/

### For Deployment Issues:
- Check Railway logs in dashboard
- Railway support: https://railway.app/support

### For Code Issues:
- Contact dev team (Kristian)

---

## 🎯 Success Criteria

✅ **You'll know it's working when:**
1. App deploys without errors in Railway
2. Visiting the production URL shows the home page
3. `/auksjoner` displays the 6 sample farms
4. Farms have correct data (title, location, size, etc.)
5. No database connection errors in logs

---

## 📝 Quick Reference

**Git Commit with these changes**: 
```
All code updated to use Supabase PostgreSQL + Prisma
Ready for production deployment
```

**What changed in the repo:**
- Migrated database layer from SQLite to PostgreSQL
- Updated ORM queries to use Prisma async patterns
- All database operations now go through Prisma Client
- Connection string configured via DATABASE_URL env var

**Production Database Location:**
- Supabase PostgreSQL in EU region (aws-1-eu-west-1)
- Session Pooler endpoint for scalability
- Automatic backups enabled

---

## ✉️ Send This to Railway Person

Dear [Railway Person],

Here's what needs to be done in Railway to connect our production app to Supabase:

1. Go to the JL project in Railway
2. Add these 3 environment variables:
   - `DATABASE_URL`: `postgresql://postgres.pzivujkhjjuwudguexyl:jordleie123@aws-1-eu-west-1.pooler.supabase.com:5432/postgres`
   - `PORT`: `3000`
   - `NODE_ENV`: `production`
3. Wait for auto-redeploy to complete
4. Check logs for "🚜 Jordleie.no kjører på" message
5. Visit https://jl-production-92f6.up.railway.app/auksjoner to verify

If any errors, check the Logs tab - most issues are DATABASE_URL related.

Thanks!

