# 🎬 Archer's History

**Educational media browser for NY State Social Studies curriculum**

A beautiful, searchable database of movies, documentaries, and educational content aligned with NY State K-12 Social Studies standards. Built for the Trench family homeschool.

![Archer's History](https://img.shields.io/badge/Education-Archer's%20History-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Ready-blue)

## 🌐 Live App

**https://historymediahunter-production.up.railway.app**

### Student Links
- [Seven](https://historymediahunter-production.up.railway.app/?student=seven)
- [Alya](https://historymediahunter-production.up.railway.app/?student=alya)
- [Skye](https://historymediahunter-production.up.railway.app/?student=skye)
- [Nova](https://historymediahunter-production.up.railway.app/?student=nova)
- [Truth](https://historymediahunter-production.up.railway.app/?student=truth)
- [Admin Dashboard](https://historymediahunter-production.up.railway.app/?student=admin)

---

## ✨ Features

- 📚 **Grades 5, 7, 9, 10, 11** - Full NY State curriculum coverage
- 🎬 **655+ Titles** - Movies, documentaries, series, and YouTube shorts
- 🔍 **Smart Search** - Find content by topic, title, or theme
- ✅ **Progress Tracking** - Per-student watched status in PostgreSQL
- 📋 **Lesson Plans** - Auto-generated lesson plans for each title
- 🎯 **Quick Clips** - Short YouTube educational content for each topic
- 👨‍👩‍👧‍👦 **Family Profiles** - Individual progress tracking per student
- 📊 **Admin Dashboard** - See all students' progress at a glance

---

## 📖 Documentation

| Guide | Description |
|-------|-------------|
| [**Quick Start**](docs/QUICKSTART.md) | Common tasks and commands |
| [**Development**](docs/DEVELOPMENT.md) | Local setup and coding guide |
| [**Deployment**](docs/DEPLOYMENT.md) | How GitHub → Railway works |
| [**Maintenance**](docs/MAINTENANCE.md) | Database operations and troubleshooting |
| [**Architecture**](docs/ARCHITECTURE.md) | System design and API reference |

---

## 🚀 Quick Deploy

Changes auto-deploy when pushed to GitHub:

```bash
git add -A
git commit -m "Your change"
git push
```

Railway builds and deploys in ~2 minutes.

---

## 🎓 Curriculum Coverage

| Grade | Focus | Topics | Media |
|-------|-------|--------|-------|
| **5** | Western Hemisphere | Maya, Aztec, Inca, Colonial America | 96 |
| **7** | US & NY History | Colonial NY, Revolution, Civil War | 104 |
| **9** | Global History I | Ancient Civilizations, Medieval, Renaissance | 114 |
| **10** | Global History II | Enlightenment, WWI, WWII, Cold War | 130 |
| **11** | US History | Colonial to Modern, Constitution, Civil Rights | 211 |

---

## 🔧 Tech Stack

- **Frontend**: Vanilla JS, CSS3 (chalkboard theme)
- **Backend**: Node.js, Express
- **Database**: PostgreSQL on Railway
- **Hosting**: Railway (auto-deploy from GitHub)

---

## 📁 Project Structure

```
├── index.html          # Main app UI
├── dashboard.html      # Admin/Teacher progress view
├── styles.css          # Chalkboard theme styles
├── app.js              # Frontend JavaScript
├── server.js           # Express server with API routes
├── database/
│   ├── schema.sql      # PostgreSQL table definitions
│   ├── seed.js         # Import curriculum data
│   └── seed-users.js   # Create user accounts
├── grades/             # Source curriculum data (JSON)
├── docs/               # Documentation
└── railway.json        # Railway deployment config
```

---

## 📝 License

MIT License - Built with ❤️ for the Trench family education
