# Architecture Overview

## System Components

```
┌──────────────────────────────────────────────────────────────────┐
│                         RAILWAY PLATFORM                          │
│  ┌─────────────────────────┐    ┌─────────────────────────────┐  │
│  │    Node.js App          │    │      PostgreSQL             │  │
│  │    (Express Server)     │◄──►│      Database               │  │
│  │                         │    │                             │  │
│  │  - Serves static files  │    │  - grades                   │  │
│  │  - API endpoints        │    │  - categories               │  │
│  │  - Dashboard            │    │  - topics                   │  │
│  │                         │    │  - media                    │  │
│  │  Port: 8080             │    │  - users                    │  │
│  │                         │    │  - student_progress         │  │
│  └─────────────────────────┘    └─────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              ▲
                              │ HTTPS
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                           BROWSERS                                │
│                                                                   │
│   Student View              Teacher View           Admin View     │
│   /?student=skye           /?student=teacher      /?student=admin │
│   - Browse content         - Browse content       - Browse        │
│   - Mark watched           - Mark watched         - Dashboard     │
│   - Track progress         - View dashboard       - All progress  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

```
┌─────────────┐
│   grades    │
├─────────────┤
│ id          │──┐
│ grade_number│  │
│ name        │  │
│ curriculum_ │  │
│   focus     │  │
└─────────────┘  │
                 │ 1:N
                 ▼
┌─────────────┐
│ categories  │
├─────────────┤
│ id          │──┐
│ grade_id    │  │
│ slug        │  │
│ name        │  │
│ description │  │
└─────────────┘  │
                 │ 1:N
                 ▼
┌─────────────┐
│   topics    │
├─────────────┤
│ id          │──┐
│ category_id │  │
│ slug        │  │
│ name        │  │
│ description │  │
└─────────────┘  │
                 │ 1:N
                 ▼
┌─────────────────┐      ┌─────────────────┐
│     media       │      │     users       │
├─────────────────┤      ├─────────────────┤
│ id              │◄─┐   │ id              │
│ topic_id        │  │   │ user_id         │◄─┐
│ title           │  │   │ name            │  │
│ type            │  │   │ role            │  │
│ year            │  │   │ avatar_color    │  │
│ rating          │  │   └─────────────────┘  │
│ runtime         │  │                        │
│ relevance       │  │                        │
│ links (JSONB)   │  │                        │
│ lesson_plan     │  │                        │
└─────────────────┘  │                        │
                     │                        │
                     │   ┌─────────────────┐  │
                     └───┤student_progress │──┘
                         ├─────────────────┤
                         │ id              │
                         │ student_id      │
                         │ media_id        │
                         │ watched         │
                         │ watch_date      │
                         │ notes           │
                         │ rating          │
                         └─────────────────┘
```

---

## API Endpoints

### Curriculum Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/grades` | List all grades with counts |
| GET | `/api/grades/:num` | Get grade with all categories/topics/media |
| GET | `/api/search?q=...` | Search media by title/relevance |
| GET | `/api/media/:id` | Get single media item details |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users with stats |
| GET | `/api/users/:id` | Get single user |
| GET | `/api/students` | List students with progress |

### Progress Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/progress/:studentId` | Get student's watched items |
| POST | `/api/progress` | Save watched status |
| GET | `/api/stats/:studentId` | Get student stats by grade |
| GET | `/api/dashboard` | Get admin dashboard data |

---

## Frontend Architecture

### Pages

1. **index.html** - Main curriculum browser
   - Grade selector tabs
   - Category sidebar
   - Topic cards
   - Media cards with watched checkboxes
   - Movie detail modal
   - Lesson plan generator

2. **dashboard.html** - Admin/Teacher view
   - Overview stats
   - Per-student progress cards
   - Progress bars by grade
   - Recent activity feed

### State Management (app.js)

```javascript
const state = {
    currentGrade: '5',      // Selected grade tab
    currentCategory: null,   // Selected category filter
    currentTopic: null,      // Selected topic
    searchQuery: '',         // Search input
    filters: {...},          // Type/age filters
    data: {},                // Cached grade data from API
    studentId: null,         // Current user ID
    users: [],               // All users (for selector)
    watched: {}              // Watched status cache
};
```

### Data Flow

```
User Action → State Update → API Call → Re-render UI
     │                           │
     └───────────────────────────┘
              (optimistic UI)
```

---

## File Responsibilities

| File | Purpose |
|------|---------|
| `server.js` | Express routes, database queries, static file serving |
| `app.js` | Frontend logic, state management, rendering, API calls |
| `index.html` | Page structure, modals, layout |
| `dashboard.html` | Admin dashboard page |
| `styles.css` | All styling (chalkboard theme) |
| `database/schema.sql` | Table definitions, indexes |
| `database/seed.js` | Import curriculum from JSON |
| `database/seed-users.js` | Create user accounts |
| `grades/*.json` | Source curriculum data |

---

## Technology Choices

| Component | Technology | Why |
|-----------|------------|-----|
| Backend | Node.js + Express | Simple, fast, good Railway support |
| Database | PostgreSQL | Reliable, JSONB support for flexible data |
| Frontend | Vanilla JS | No build step, fast iteration |
| Styling | CSS Custom Properties | Easy theming, no dependencies |
| Hosting | Railway | Auto-deploy from GitHub, free tier |

