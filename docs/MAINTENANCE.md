# Maintenance Guide

## Common Tasks

### Adding a New Student

1. Edit `database/seed-users.js`:
   ```javascript
   const users = [
     // ... existing users ...
     { user_id: 'newkid', name: 'New Kid', role: 'student', avatar_color: '#ff6b6b' }
   ];
   ```

2. Run the seed:
   ```bash
   DATABASE_URL="postgresql://postgres:uNBAIIGiSpRmJiOvCwBXwqNNzIHeZwLB@shortline.proxy.rlwy.net:14080/railway" npm run seed-users
   ```

3. Share the URL: `https://historymediahunter-production.up.railway.app/?student=newkid`

---

### Removing a Student

```bash
railway run psql $DATABASE_URL -c "DELETE FROM users WHERE user_id = 'username';"
```

---

### Resetting a Student's Progress

```bash
# Clear all watched status for a student
railway run psql $DATABASE_URL -c "DELETE FROM student_progress WHERE student_id = 'username';"
```

---

### Adding New Movies

#### Option 1: Edit JSON and Re-seed (Recommended for bulk changes)

1. Edit the appropriate `grades/grade-X.json` file
2. Re-run the seed:
   ```bash
   DATABASE_URL="..." npm run seed
   ```
   ⚠️ This will clear and reimport ALL data

#### Option 2: Direct Database Insert (For single additions)

```bash
railway run psql $DATABASE_URL -c "
INSERT INTO media (topic_id, title, type, year, rating, runtime, relevance, age_appropriate, links)
SELECT t.id, 'Movie Title', 'movie', 2020, 'PG-13', 120, 'Relevance text', true, '{\"imdb\": \"https://...\"}'::jsonb
FROM topics t
WHERE t.slug = 'topic-slug-here'
LIMIT 1;
"
```

---

### Backup Database

```bash
# Export full database
railway run pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Export just the progress data
railway run psql $DATABASE_URL -c "COPY student_progress TO STDOUT WITH CSV HEADER" > progress_backup.csv
```

---

### Restore Database

```bash
# Full restore (destructive!)
railway run psql $DATABASE_URL < backup_file.sql
```

---

## Monitoring

### Check App Health

```bash
curl https://historymediahunter-production.up.railway.app/api/health
```

Expected response:
```json
{"status":"healthy","timestamp":"...","database":"connected"}
```

### View Recent Activity

```bash
railway run psql $DATABASE_URL -c "
SELECT u.name, m.title, sp.watch_date 
FROM student_progress sp 
JOIN users u ON u.user_id = sp.student_id 
JOIN media m ON m.id = sp.media_id 
WHERE sp.watched = true 
ORDER BY sp.watch_date DESC 
LIMIT 10;
"
```

### Database Size

```bash
railway run psql $DATABASE_URL -c "
SELECT pg_size_pretty(pg_database_size(current_database())) as size;
"
```

---

## Troubleshooting

### App Won't Start

1. Check logs: `railway logs`
2. Verify DATABASE_URL is set: `railway variables`
3. Test database connection: `railway run psql $DATABASE_URL -c "SELECT 1"`

### Database Connection Errors

- **From local machine**: Use the **public** URL (`shortline.proxy.rlwy.net`)
- **From Railway app**: Use the **internal** URL (`postgres.railway.internal`)

### Deployment Stuck

1. Go to Railway Dashboard
2. Cancel the current deployment
3. Try: `railway up` or push a new commit

### User Can't See Their Progress

1. Check they're using the correct URL parameter: `?student=username`
2. Verify user exists:
   ```bash
   railway run psql $DATABASE_URL -c "SELECT * FROM users WHERE user_id = 'username';"
   ```

---

## Railway Costs

Railway offers a free tier with:
- 500 hours/month execution time
- 1GB RAM
- 1GB disk

Current usage is well within free tier limits. Monitor at: https://railway.com/account/usage

---

## Security Notes

- Database credentials are in this doc for convenience
- For production, consider rotating the password periodically
- The `rejectUnauthorized: false` SSL setting is needed for Railway's PostgreSQL

### Rotate Database Password

1. Go to Railway Dashboard → Postgres service → Settings
2. Generate new password
3. Update the `DATABASE_URL` variable in the app service
4. Update local `.env` and documentation

