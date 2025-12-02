-- Curriculum Media Hunter - Database Schema
-- All curriculum data stored in PostgreSQL

-- Grades table
CREATE TABLE IF NOT EXISTS grades (
    id SERIAL PRIMARY KEY,
    grade_number VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    curriculum_standard TEXT,
    curriculum_focus TEXT,
    last_updated DATE DEFAULT CURRENT_DATE
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    grade_id INTEGER REFERENCES grades(id) ON DELETE CASCADE,
    slug VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    UNIQUE(grade_id, slug)
);

-- Topics table
CREATE TABLE IF NOT EXISTS topics (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    slug VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    UNIQUE(category_id, slug)
);

-- Subtopics table
CREATE TABLE IF NOT EXISTS subtopics (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
    name VARCHAR(300) NOT NULL,
    sort_order INTEGER DEFAULT 0
);

-- Media table (movies, documentaries, shorts, etc.)
CREATE TABLE IF NOT EXISTS media (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    type VARCHAR(50) NOT NULL, -- movie, documentary, series, short
    year INTEGER,
    rating VARCHAR(20),
    runtime INTEGER, -- in minutes
    relevance TEXT,
    notes TEXT,
    age_appropriate BOOLEAN DEFAULT true,
    
    -- Links stored as JSONB for flexibility
    links JSONB DEFAULT '{}',
    
    -- Lesson plan stored as JSONB
    lesson_plan JSONB DEFAULT NULL,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Student progress table
CREATE TABLE IF NOT EXISTS student_progress (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(100) NOT NULL,
    student_name VARCHAR(200),
    media_id INTEGER REFERENCES media(id) ON DELETE CASCADE,
    watched BOOLEAN DEFAULT false,
    watch_date TIMESTAMP,
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, media_id)
);

-- Students table (optional - for registered users)
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200),
    grade_level VARCHAR(10),
    parent_email VARCHAR(200),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_grade ON categories(grade_id);
CREATE INDEX IF NOT EXISTS idx_topics_category ON topics(category_id);
CREATE INDEX IF NOT EXISTS idx_media_topic ON media(topic_id);
CREATE INDEX IF NOT EXISTS idx_media_type ON media(type);
CREATE INDEX IF NOT EXISTS idx_media_title ON media(title);
CREATE INDEX IF NOT EXISTS idx_progress_student ON student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_progress_media ON student_progress(media_id);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_media_search ON media USING gin(
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(relevance, '') || ' ' || coalesce(notes, ''))
);

