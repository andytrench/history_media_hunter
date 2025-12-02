# 🎬 Curriculum Media Hunter

**Educational media browser for NY State Social Studies curriculum**

A beautiful, searchable database of movies, documentaries, and educational content aligned with NY State K-12 Social Studies standards. Perfect for teachers and homeschool families.

![Curriculum Media Hunter](https://img.shields.io/badge/Education-Media%20Hunter-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Ready-blue)

## ✨ Features

- 📚 **Grades 5, 7, 9, 10, 11** - Full NY State curriculum coverage
- 🎬 **500+ Titles** - Movies, documentaries, series, and YouTube shorts
- 🔍 **Smart Search** - Find content by topic, title, or theme
- ✅ **Progress Tracking** - Mark titles as "Watched" (persists locally)
- 📋 **Lesson Plans** - Auto-generated lesson plans for each title
- 🎯 **Quick Clips** - Short YouTube educational content for each topic
- 👨‍👩‍👧‍👦 **Student Profiles** - PostgreSQL-ready for family progress tracking

## 🚀 Quick Start

### Local Development (without database)

```bash
# Clone the repo
git clone https://github.com/andytrench/history_media_hunter.git
cd history_media_hunter

# Install dependencies
npm install

# Start the server (uses JSON files as fallback)
npm start

# Open http://localhost:8080
```

### Local Development (with PostgreSQL)

```bash
# Set up database connection
export DATABASE_URL="postgresql://user:password@localhost:5432/curriculum"

# Install and start
npm install
npm start

# Seed the database with curriculum data
npm run seed

# Open http://localhost:8080
```

### Deploy to Railway

1. Fork this repo to your GitHub account
2. Go to [Railway](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your forked repo
5. Railway auto-deploys! 🎉

#### Adding PostgreSQL (for student tracking)

1. In your Railway project, click "New" → "Database" → "PostgreSQL"
2. Railway automatically connects the database
3. Tables are created automatically on first run

## 📁 Project Structure

```
├── index.html          # Main app UI
├── styles.css          # Chalkboard theme styles
├── app.js              # Frontend JavaScript (fetches from API)
├── server.js           # Express server with API routes
├── database/
│   ├── schema.sql      # PostgreSQL table definitions
│   └── seed.js         # Import JSON data to database
├── grades/             # Source curriculum data (JSON)
│   ├── grade-5.json
│   ├── grade-7.json
│   ├── grade-9.json
│   ├── grade-10.json
│   ├── grade-11.json
│   └── grade-11-part2.json
└── railway.json        # Railway deployment config
```

## 🎓 Curriculum Coverage

| Grade | Focus | Topics |
|-------|-------|--------|
| **5** | Western Hemisphere | Maya, Aztec, Inca, Colonial America, Revolution |
| **7** | US & NY History | Colonial NY, Revolution, Civil War, Immigration |
| **9** | Global History I | Ancient Civilizations, Medieval World, Renaissance |
| **10** | Global History II | Enlightenment, WWI, WWII, Cold War, Modern |
| **11** | US History | Colonial to Modern, Constitution, Civil Rights |

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 8080) | No |
| `DATABASE_URL` | PostgreSQL connection string | No |
| `NODE_ENV` | Environment (development/production) | No |

## 📊 API Endpoints

When PostgreSQL is connected:

- `GET /api/health` - Health check
- `GET /api/progress/:studentId` - Get student's watched history
- `POST /api/progress` - Save watched status
- `GET /api/students` - List all students
- `GET /api/stats/:studentId` - Get student stats by grade

## 🎨 Tech Stack

- **Frontend**: Vanilla JS, CSS3 (clean chalkboard theme)
- **Backend**: Node.js, Express
- **Database**: PostgreSQL (optional)
- **Hosting**: Railway

## 👨‍👩‍👧‍👦 For Families

This tool was built for homeschool and after-school enrichment. Features include:

- **Watch tracking** - Check off movies as you watch them
- **Age indicators** - See at a glance what's classroom-safe vs. needs review
- **Streaming links** - Direct links to Netflix, Disney+, PBS, YouTube
- **Lesson plans** - Printable discussion guides for each title

## 📝 License

MIT License - Feel free to use and modify for your family or classroom!

---

Built with ❤️ for education
