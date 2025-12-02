# Development Guide

## Project Structure

```
curiculum/
├── server.js           # Express server & API routes
├── app.js              # Frontend JavaScript
├── index.html          # Main app page
├── dashboard.html      # Admin/Teacher dashboard
├── styles.css          # All styling
├── package.json        # Dependencies & scripts
├── railway.json        # Railway config
│
├── database/
│   ├── schema.sql      # Database table definitions
│   ├── seed.js         # Import curriculum data
│   └── seed-users.js   # Create user accounts
│
├── grades/             # Source JSON data (reference)
│   ├── grade-5.json
│   ├── grade-7.json
│   ├── grade-9.json
│   ├── grade-10.json
│   ├── grade-11.json
│   └── grade-11-part2.json
│
└── docs/               # Documentation
```

---

## Local Development

### Prerequisites
- Node.js 18+
- npm
- Railway CLI (optional)

### Setup

```bash
# Clone the repo
git clone https://github.com/andytrench/history_media_hunter.git
cd history_media_hunter

# Install dependencies
npm install

# Create .env file for local database (optional)
echo "DATABASE_URL=postgresql://..." > .env

# Start development server
npm run dev
```

### Running Locally

**Without database (uses JSON files):**
```bash
npm run dev
# Visit http://localhost:8080
```

**With Railway database:**
```bash
# This injects Railway's DATABASE_URL
railway run npm run dev
```

---

## Making Changes

### Frontend Changes (HTML/CSS/JS)

1. Edit `index.html`, `styles.css`, or `app.js`
2. Refresh browser to see changes
3. Commit and push when ready

### API Changes

1. Edit `server.js`
2. Restart server (`Ctrl+C` then `npm run dev`)
3. Test endpoints
4. Commit and push

### Database Schema Changes

1. Edit `database/schema.sql`
2. Run migrations on Railway:
   ```bash
   railway run psql $DATABASE_URL -f database/schema.sql
   ```
3. Commit and push

---

## Database Operations

### Connect to Production Database

```bash
# Interactive psql session
railway connect postgres

# Or run a query directly
railway run psql $DATABASE_URL -c "SELECT COUNT(*) FROM media;"
```

### Re-seed Curriculum Data

```bash
# Using public URL (from local machine)
DATABASE_URL="postgresql://postgres:uNBAIIGiSpRmJiOvCwBXwqNNzIHeZwLB@shortline.proxy.rlwy.net:14080/railway" npm run seed
```

### Add/Update Users

```bash
DATABASE_URL="postgresql://postgres:uNBAIIGiSpRmJiOvCwBXwqNNzIHeZwLB@shortline.proxy.rlwy.net:14080/railway" npm run seed-users
```

### View Database Stats

```bash
railway run psql $DATABASE_URL -c "
SELECT 
  (SELECT COUNT(*) FROM grades) as grades,
  (SELECT COUNT(*) FROM categories) as categories,
  (SELECT COUNT(*) FROM topics) as topics,
  (SELECT COUNT(*) FROM media) as media,
  (SELECT COUNT(*) FROM users) as users;
"
```

---

## Adding New Content

### Add a Movie to a Topic

1. Find the topic in `grades/grade-X.json`
2. Add to the `media` array:
   ```json
   {
     "title": "Movie Title",
     "type": "movie",
     "year": 2020,
     "rating": "PG-13",
     "runtime": 120,
     "relevance": "Why this movie is relevant...",
     "ageAppropriate": true,
     "links": {
       "imdb": "https://imdb.com/title/...",
       "youtube": "https://youtube.com/watch?v=..."
     }
   }
   ```
3. Re-run seed script to update database
4. Commit and push

### Add a New User

Edit `database/seed-users.js` and add to the `users` array:
```javascript
{ user_id: 'newuser', name: 'New User', role: 'student', avatar_color: '#58a6ff' }
```

Then run:
```bash
DATABASE_URL="..." npm run seed-users
```

---

## Testing

### Manual Testing Checklist

- [ ] App loads without errors
- [ ] Grade tabs switch correctly
- [ ] Categories filter topics
- [ ] Topics show media cards
- [ ] Watched checkboxes save state
- [ ] Search works
- [ ] User selector works
- [ ] Dashboard shows progress (admin/teacher)
- [ ] Lesson plan generates

### Check for Errors

```bash
# View Railway logs
railway logs

# Or in browser console (F12 → Console)
```

---

## Useful Commands

```bash
# Check Railway project status
railway status

# List environment variables
railway variables

# Open Railway dashboard
railway open

# View deployment logs
railway logs

# Get project domain
railway domain
```

