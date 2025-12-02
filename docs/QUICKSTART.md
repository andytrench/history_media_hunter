# Quick Start Guide

## I want to...

### 🚀 Deploy a change

```bash
cd /Users/master15/Desktop/Software/curiculum
git add -A
git commit -m "Description of change"
git push
```
Done! Railway auto-deploys in ~2 minutes.

---

### 👀 Check if deploy succeeded

```bash
railway logs
```
Or visit: https://railway.com/project/3d8fbf92-10b2-4166-907e-f22d699811f9

---

### 🎬 Add a new movie

1. Edit `grades/grade-X.json`
2. Add movie to the topic's `media` array
3. Re-seed database:
   ```bash
   DATABASE_URL="postgresql://postgres:uNBAIIGiSpRmJiOvCwBXwqNNzIHeZwLB@shortline.proxy.rlwy.net:14080/railway" npm run seed
   ```
4. Commit and push

---

### 👤 Add a new student

1. Edit `database/seed-users.js`
2. Add to users array:
   ```javascript
   { user_id: 'kidname', name: 'Kid Name', role: 'student', avatar_color: '#58a6ff' }
   ```
3. Run:
   ```bash
   DATABASE_URL="postgresql://postgres:uNBAIIGiSpRmJiOvCwBXwqNNzIHeZwLB@shortline.proxy.rlwy.net:14080/railway" npm run seed-users
   ```
4. Share URL: `https://historymediahunter-production.up.railway.app/?student=kidname`

---

### 🔄 Reset someone's progress

```bash
railway run psql $DATABASE_URL -c "DELETE FROM student_progress WHERE student_id = 'username';"
```

---

### 💾 Backup the database

```bash
railway run pg_dump $DATABASE_URL > backup.sql
```

---

### 🔍 See what everyone has watched

```bash
railway run psql $DATABASE_URL -c "
SELECT u.name, COUNT(*) as watched 
FROM student_progress sp 
JOIN users u ON u.user_id = sp.student_id 
WHERE sp.watched = true 
GROUP BY u.name;
"
```

---

### 🖥️ Run locally for development

```bash
cd /Users/master15/Desktop/Software/curiculum
npm install
npm run dev
# Visit http://localhost:8080
```

---

### 📊 Access the admin dashboard

Visit: https://historymediahunter-production.up.railway.app/?student=admin

Then click the "📊 Dashboard" link in the header.

---

## Important URLs

| What | URL |
|------|-----|
| **Live App** | https://historymediahunter-production.up.railway.app |
| **GitHub Repo** | https://github.com/andytrench/history_media_hunter |
| **Railway Dashboard** | https://railway.com/project/3d8fbf92-10b2-4166-907e-f22d699811f9 |
| **Admin Dashboard** | https://historymediahunter-production.up.railway.app/dashboard |

---

## Student URLs (Bookmark these!)

- **Seven**: https://historymediahunter-production.up.railway.app/?student=seven
- **Alya**: https://historymediahunter-production.up.railway.app/?student=alya
- **Skye**: https://historymediahunter-production.up.railway.app/?student=skye
- **Nova**: https://historymediahunter-production.up.railway.app/?student=nova
- **Truth**: https://historymediahunter-production.up.railway.app/?student=truth

