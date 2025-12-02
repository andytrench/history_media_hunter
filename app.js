/**
 * Curriculum Media Hunter
 * Educational media browser - fetches all data from API
 */

// State Management
const state = {
    currentGrade: '5',
    currentCategory: null,
    currentTopic: null,
    searchQuery: '',
    filters: {
        type: 'all',
        ageAppropriate: 'all'
    },
    data: {},         // Grade data from API
    studentId: null,  // Current student ID
    watched: {}       // Watched status from DB or localStorage fallback
};

// API Base URL (empty for same origin)
const API_BASE = '';

// Streaming service configurations
const streamingServices = {
    'Disney+': { icon: 'D+', color: '#113ccf' },
    'Netflix': { icon: 'N', color: '#e50914' },
    'PBS': { icon: 'PBS', color: '#2638c4' },
    'YouTube': { icon: '▶', color: '#ff0000' },
    'Amazon': { icon: 'A', color: '#ff9900' },
    'Amazon Prime Video': { icon: 'P', color: '#00A8E1' },
    'Hulu': { icon: 'h', color: '#1ce783' },
    'HBO Max': { icon: 'HBO', color: '#5822b4' },
    'BrainPOP': { icon: 'BP', color: '#ff6b35' },
    'JustWatch': { icon: 'JW', color: '#ffce00' },
    'YouTube (Trailer)': { icon: '▶', color: '#ff0000' }
};

// DOM Elements
const elements = {
    search: document.getElementById('search'),
    categoryList: document.getElementById('categoryList'),
    categoryCount: document.getElementById('categoryCount'),
    topicGrid: document.getElementById('topicGrid'),
    mediaSection: document.getElementById('mediaSection'),
    mediaGrid: document.getElementById('mediaGrid'),
    mediaCount: document.getElementById('mediaCount'),
    selectedTopic: document.getElementById('selectedTopic'),
    breadcrumb: document.getElementById('breadcrumb'),
    totalMovies: document.getElementById('totalMovies'),
    totalTopics: document.getElementById('totalTopics'),
    movieModal: document.getElementById('movieModal'),
    lessonModal: document.getElementById('lessonModal'),
    modalBody: document.getElementById('modalBody'),
    lessonBody: document.getElementById('lessonBody')
};

// ===========================================
// Initialization
// ===========================================

async function init() {
    // Check for student ID in URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    state.studentId = urlParams.get('student') || localStorage.getItem('studentId') || generateStudentId();
    localStorage.setItem('studentId', state.studentId);
    
    // Load watched state
    await loadWatchedState();
    
    setupEventListeners();
    await loadGradeData(state.currentGrade);
    renderUI();
}

function generateStudentId() {
    return 'student_' + Math.random().toString(36).substr(2, 9);
}

// ===========================================
// Data Loading from API
// ===========================================

async function loadGradeData(grade) {
    if (state.data[grade]) return state.data[grade];

    try {
        const response = await fetch(`${API_BASE}/api/grades/${grade}`);
        if (!response.ok) throw new Error('Failed to fetch grade data');
        
        const data = await response.json();
        state.data[grade] = data;
        return data;
    } catch (error) {
        console.error(`Error loading grade ${grade}:`, error);
        // Fallback: try loading from JSON files (for local dev without DB)
        return await loadGradeFromJSON(grade);
    }
}

// Fallback for local development without database
async function loadGradeFromJSON(grade) {
    try {
        const response = await fetch(`grades/grade-${grade}.json`);
        const data = await response.json();
        
        // For grade 11, also load part 2
        if (grade === '11') {
            try {
                const response2 = await fetch('grades/grade-11-part2.json');
                const data2 = await response2.json();
                data.categories = [...data.categories, ...data2.categories];
            } catch (e) {
                console.log('Grade 11 part 2 not found');
            }
        }
        
        state.data[grade] = data;
        return data;
    } catch (error) {
        console.error('Fallback JSON load failed:', error);
        state.data[grade] = { categories: [] };
        return state.data[grade];
    }
}

// ===========================================
// Progress/Watched State
// ===========================================

async function loadWatchedState() {
    try {
        const response = await fetch(`${API_BASE}/api/progress/${state.studentId}`);
        if (response.ok) {
            const progress = await response.json();
            // Convert array to object keyed by media_id
            state.watched = {};
            progress.forEach(p => {
                if (p.watched) {
                    state.watched[p.media_id] = true;
                }
            });
            return;
        }
    } catch (error) {
        console.log('API not available, using localStorage');
    }
    
    // Fallback to localStorage
    try {
        const saved = localStorage.getItem('curriculum-watched');
        if (saved) {
            state.watched = JSON.parse(saved);
        }
    } catch (e) {
        console.error('Error loading watched state:', e);
    }
}

async function saveWatchedState(mediaId, watched) {
    // Try to save to API
    try {
        const response = await fetch(`${API_BASE}/api/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentId: state.studentId,
                mediaId: mediaId,
                watched: watched
            })
        });
        if (response.ok) {
            return;
        }
    } catch (error) {
        console.log('API save failed, using localStorage');
    }
    
    // Fallback to localStorage
    localStorage.setItem('curriculum-watched', JSON.stringify(state.watched));
}

function isWatched(media) {
    // Check by database ID first, then by generated key
    if (media.id && state.watched[media.id]) return true;
    const key = getMediaKey(media);
    return state.watched[key] === true;
}

function getMediaKey(media) {
    return `${media.title}-${media.year || 'unknown'}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

async function toggleWatched(media, event) {
    if (event) event.stopPropagation();
    
    const key = media.id || getMediaKey(media);
    const newState = !state.watched[key];
    state.watched[key] = newState;
    
    await saveWatchedState(media.id || key, newState);
    renderMedia();
    updateWatchedStats();
}

// ===========================================
// Event Listeners
// ===========================================

function setupEventListeners() {
    // Grade tabs
    document.querySelectorAll('.grade-tab').forEach(tab => {
        tab.addEventListener('click', () => selectGrade(tab.dataset.grade));
    });

    // Search
    elements.search.addEventListener('input', debounce(handleSearch, 300));
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            elements.search.focus();
        }
        if (e.key === 'Escape') {
            closeModals();
        }
    });

    // Filter chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => handleFilterClick(chip));
    });

    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => toggleView(btn.dataset.view));
    });

    // Modal close
    document.querySelectorAll('.modal-backdrop, .modal-close').forEach(el => {
        el.addEventListener('click', closeModals);
    });
}

// ===========================================
// Grade Selection
// ===========================================

async function selectGrade(grade) {
    state.currentGrade = grade;
    state.currentCategory = null;
    state.currentTopic = null;

    // Update tab UI
    document.querySelectorAll('.grade-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.grade === grade);
    });

    await loadGradeData(grade);
    renderUI();
}

// ===========================================
// Render Functions
// ===========================================

function renderUI() {
    renderCategories();
    renderTopics();
    updateStats();
    updateBreadcrumb();
    updateWatchedStats();
}

function renderCategories() {
    const data = state.data[state.currentGrade];
    if (!data || !data.categories) {
        elements.categoryList.innerHTML = '<div class="empty-state">Loading...</div>';
        return;
    }

    const categories = data.categories;
    elements.categoryCount.textContent = `${categories.length} categories`;

    elements.categoryList.innerHTML = categories.map(cat => {
        const mediaCount = countMediaInCategory(cat);
        return `
            <button class="category-item ${state.currentCategory === cat.id ? 'active' : ''}" 
                    data-category="${cat.id}">
                <span>${cat.name}</span>
                <span class="count">${mediaCount}</span>
            </button>
        `;
    }).join('');

    elements.categoryList.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', () => selectCategory(item.dataset.category));
    });
}

function countMediaInCategory(category) {
    let count = 0;
    category.topics?.forEach(topic => {
        count += topic.media?.length || 0;
    });
    return count;
}

function renderTopics() {
    const data = state.data[state.currentGrade];
    if (!data || !data.categories) return;

    let topics = [];
    
    if (state.currentCategory) {
        const category = data.categories.find(c => c.id === state.currentCategory);
        if (category) {
            topics = category.topics || [];
        }
    } else {
        data.categories.forEach(cat => {
            cat.topics?.forEach(topic => {
                topics.push({ ...topic, categoryName: cat.name });
            });
        });
    }

    // Apply search filter
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        topics = topics.filter(topic => 
            topic.name.toLowerCase().includes(query) ||
            topic.description?.toLowerCase().includes(query) ||
            topic.subtopics?.some(st => st.toLowerCase().includes(query))
        );
    }

    if (topics.length === 0) {
        elements.topicGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📚</div>
                <h3>No topics found</h3>
                <p>Try adjusting your search or filters</p>
            </div>
        `;
        return;
    }

    elements.topicGrid.innerHTML = topics.map(topic => `
        <div class="topic-card" data-topic="${topic.id}">
            <h3>${topic.name}</h3>
            <p>${topic.description || ''}</p>
            <div class="topic-meta">
                <span class="topic-meta-item highlight">
                    🎬 ${topic.media?.length || 0} titles
                </span>
                <span class="topic-meta-item">
                    📝 ${topic.subtopics?.length || 0} subtopics
                </span>
            </div>
        </div>
    `).join('');

    elements.topicGrid.querySelectorAll('.topic-card').forEach(card => {
        card.addEventListener('click', () => selectTopic(card.dataset.topic));
    });
}

function selectCategory(categoryId) {
    state.currentCategory = state.currentCategory === categoryId ? null : categoryId;
    state.currentTopic = null;
    
    renderCategories();
    renderTopics();
    renderMedia();
    updateBreadcrumb();
}

function selectTopic(topicId) {
    state.currentTopic = topicId;
    renderMedia();
    updateBreadcrumb();
    
    elements.mediaSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderMedia() {
    const data = state.data[state.currentGrade];
    if (!data || !state.currentTopic) {
        elements.selectedTopic.textContent = 'Select a topic to view media';
        elements.mediaCount.textContent = '';
        elements.mediaGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎬</div>
                <h3>Click a topic above to view its media</h3>
            </div>
        `;
        return;
    }

    // Find the topic
    let topic = null;
    for (const category of data.categories) {
        const found = category.topics?.find(t => t.id === state.currentTopic);
        if (found) {
            topic = found;
            break;
        }
    }

    if (!topic) {
        elements.mediaGrid.innerHTML = '<div class="empty-state">Topic not found</div>';
        return;
    }

    elements.selectedTopic.textContent = topic.name;
    
    let media = topic.media || [];
    
    // Apply filters
    if (state.filters.type !== 'all') {
        media = media.filter(m => m.type === state.filters.type);
    }
    if (state.filters.ageAppropriate !== 'all') {
        const filterValue = state.filters.ageAppropriate === 'true';
        media = media.filter(m => m.ageAppropriate === filterValue);
    }

    // Apply search
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        media = media.filter(m => 
            m.title.toLowerCase().includes(query) ||
            m.relevance?.toLowerCase().includes(query) ||
            m.notes?.toLowerCase().includes(query)
        );
    }

    const watchedCount = media.filter(m => isWatched(m)).length;
    elements.mediaCount.textContent = `${media.length} titles${watchedCount > 0 ? ` (${watchedCount} watched)` : ''}`;

    if (media.length === 0) {
        elements.mediaGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <h3>No media matches your filters</h3>
            </div>
        `;
        return;
    }

    elements.mediaGrid.innerHTML = media.map((m, index) => renderMediaCard(m, topic, index)).join('');

    // Add click handlers
    elements.mediaGrid.querySelectorAll('.media-card').forEach((card, index) => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.watched-checkbox') || e.target.closest('a')) return;
            showMovieDetail(media[index], topic);
        });
    });

    elements.mediaGrid.querySelectorAll('.watched-checkbox input').forEach((checkbox, index) => {
        checkbox.addEventListener('change', (e) => {
            toggleWatched(media[index], e);
        });
    });
}

function renderMediaCard(media, topic, index) {
    const ratingClass = getRatingClass(media.rating);
    const streamingLinks = getStreamingLinks(media);
    const watched = isWatched(media);
    
    return `
        <div class="media-card ${watched ? 'watched' : ''}" data-id="${media.id || index}">
            <div class="media-card-header">
                <div class="media-header-row">
                    <span class="media-type-badge ${media.type}">${getTypeIcon(media.type)} ${media.type}</span>
                    <label class="watched-checkbox" onclick="event.stopPropagation()">
                        <input type="checkbox" ${watched ? 'checked' : ''} />
                        Watched
                    </label>
                </div>
                <h4>${media.title}</h4>
                <div class="media-year-rating">
                    <span>${media.year || 'N/A'}</span>
                    <span>•</span>
                    <span class="media-rating ${ratingClass}">${media.rating || 'NR'}</span>
                    ${media.runtime ? `<span>• ${media.runtime} min</span>` : ''}
                </div>
            </div>
            <div class="media-card-body">
                <p class="media-relevance">${media.relevance || ''}</p>
            </div>
            <div class="media-card-footer">
                <div class="streaming-links">${streamingLinks}</div>
                <span class="age-badge ${media.ageAppropriate ? 'safe' : 'caution'}">
                    ${media.ageAppropriate ? '✓ Classroom' : '⚠ Review'}
                </span>
            </div>
        </div>
    `;
}

function getTypeIcon(type) {
    const icons = { movie: '🎬', documentary: '📹', series: '📺', short: '⏱', educational: '🎓' };
    return icons[type] || '🎬';
}

function getRatingClass(rating) {
    if (!rating) return '';
    if (['G', 'TV-Y', 'TV-Y7', 'TV-G'].includes(rating)) return 'safe';
    if (['PG', 'PG-13', 'TV-PG', 'TV-14', 'NR'].includes(rating)) return 'caution';
    if (['R', 'TV-MA'].includes(rating)) return 'restricted';
    return '';
}

function getStreamingLinks(media) {
    const links = [];
    
    if (media.links?.imdb) {
        links.push(`<a href="${media.links.imdb}" target="_blank" class="streaming-link imdb" title="IMDb" onclick="event.stopPropagation()">IMDb</a>`);
    }
    
    if (media.links?.youtube) {
        links.push(`<a href="${media.links.youtube}" target="_blank" class="streaming-link youtube" title="YouTube" onclick="event.stopPropagation()">▶</a>`);
    }
    
    if (media.links?.streaming && Array.isArray(media.links.streaming)) {
        media.links.streaming.forEach(s => {
            const service = streamingServices[s.service];
            if (service && s.url) {
                links.push(`<a href="${s.url}" target="_blank" class="streaming-link" style="color: ${service.color}" title="${s.service}" onclick="event.stopPropagation()">${service.icon}</a>`);
            }
        });
    }
    
    return links.join('');
}

// ===========================================
// Movie Detail Modal
// ===========================================

function showMovieDetail(media, topic) {
    const streamingButtons = getStreamingButtons(media);
    const watched = isWatched(media);
    
    elements.modalBody.innerHTML = `
        <div class="movie-detail-header">
            <div class="movie-poster">${getTypeIcon(media.type)}</div>
            <div class="movie-detail-info">
                <span class="media-type-badge ${media.type}">${media.type}</span>
                <h2>${media.title}</h2>
                <div class="movie-meta-row">
                    <span class="movie-meta-item">📅 ${media.year || 'N/A'}</span>
                    <span class="movie-meta-item">⏱ ${media.runtime ? media.runtime + ' min' : 'N/A'}</span>
                    <span class="movie-meta-item media-rating ${getRatingClass(media.rating)}">${media.rating || 'NR'}</span>
                    <span class="movie-meta-item ${media.ageAppropriate ? 'safe' : 'caution'}">
                        ${media.ageAppropriate ? '✓ Classroom Safe' : '⚠ Teacher Review Required'}
                    </span>
                </div>
                <label class="watched-checkbox" style="margin-top: 12px; font-size: 0.9rem;">
                    <input type="checkbox" ${watched ? 'checked' : ''} onchange="toggleWatchedFromModal(${media.id || 0}, '${getMediaKey(media)}', this.checked)" />
                    Mark as Watched
                </label>
            </div>
        </div>
        
        <div class="movie-detail-section">
            <h3>📖 Curriculum Connection</h3>
            <p style="color: var(--text-secondary); line-height: 1.8;">${media.relevance || 'No description available.'}</p>
        </div>
        
        ${media.notes ? `
        <div class="movie-detail-section">
            <h3>📝 Teacher Notes</h3>
            <div class="teacher-notes">${media.notes}</div>
        </div>
        ` : ''}
        
        <div class="movie-detail-section">
            <h3>🔗 Watch / Stream</h3>
            <div class="streaming-buttons">${streamingButtons}</div>
        </div>
        
        <div class="movie-detail-section">
            <button class="lesson-plan-btn" onclick="showLessonPlan(${JSON.stringify(media).replace(/"/g, '&quot;')}, ${JSON.stringify(topic).replace(/"/g, '&quot;')})">
                📋 Generate Lesson Plan
            </button>
        </div>
    `;
    
    elements.movieModal.classList.add('active');
}

async function toggleWatchedFromModal(mediaId, key, checked) {
    const id = mediaId || key;
    state.watched[id] = checked;
    await saveWatchedState(mediaId || key, checked);
    renderMedia();
    updateWatchedStats();
}

function getStreamingButtons(media) {
    const buttons = [];
    
    if (media.links?.imdb) {
        buttons.push(`<a href="${media.links.imdb}" target="_blank" class="streaming-btn">🎬 IMDb</a>`);
    }
    if (media.links?.youtube) {
        buttons.push(`<a href="${media.links.youtube}" target="_blank" class="streaming-btn">▶️ YouTube</a>`);
    }
    if (media.links?.streaming && Array.isArray(media.links.streaming)) {
        media.links.streaming.forEach(s => {
            if (s.url) {
                const service = streamingServices[s.service];
                buttons.push(`<a href="${s.url}" target="_blank" class="streaming-btn">${service?.icon || '📺'} ${s.service}</a>`);
            }
        });
    }
    
    if (buttons.length <= 1) {
        const searchQuery = encodeURIComponent(media.title + ' ' + (media.year || ''));
        buttons.push(`<a href="https://www.justwatch.com/us/search?q=${searchQuery}" target="_blank" class="streaming-btn">📺 Find Streaming</a>`);
    }
    
    return buttons.join('');
}

// ===========================================
// Lesson Plan
// ===========================================

function showLessonPlan(media, topic) {
    const plan = generateLessonPlan(media, topic);
    
    elements.lessonBody.innerHTML = `
        <div class="lesson-plan">
            <h2>📋 Lesson Plan</h2>
            <p class="subtitle">${media.title} (${media.year || 'N/A'})</p>
            
            <div class="lesson-section">
                <h3>🎯 Learning Objectives</h3>
                <ul>${plan.objectives.map(o => `<li>${o}</li>`).join('')}</ul>
            </div>
            
            <div class="lesson-section">
                <h3>📚 Curriculum Connection</h3>
                <p style="color: var(--text-secondary);">${plan.connection}</p>
            </div>
            
            <div class="lesson-section">
                <h3>⏱ Before Viewing</h3>
                <ul>${plan.beforeViewing.map(i => `<li>${i}</li>`).join('')}</ul>
            </div>
            
            <div class="lesson-section">
                <h3>❓ Discussion Questions</h3>
                <div class="discussion-questions">
                    <ol>${plan.discussionQuestions.map(q => `<li>${q}</li>`).join('')}</ol>
                </div>
            </div>
            
            <div class="lesson-section">
                <h3>📝 Extension Activities</h3>
                <ul>${plan.extensions.map(e => `<li>${e}</li>`).join('')}</ul>
            </div>
            
            <button class="print-btn" onclick="window.print()">🖨 Print Lesson Plan</button>
        </div>
    `;
    
    elements.lessonModal.classList.add('active');
}

function generateLessonPlan(media, topic) {
    const embedded = media.lessonPlan || {};
    const topicName = topic.name || 'this topic';
    const subtopics = topic.subtopics || [];
    
    return {
        objectives: embedded.objectives || [
            `Understand key aspects of ${topicName} as portrayed in "${media.title}"`,
            `Analyze perspectives on historical events`,
            `Evaluate accuracy of historical media`,
            `Connect content to broader curriculum themes`
        ],
        connection: `Supports study of ${topicName}. ${media.relevance || ''} Subtopics: ${subtopics.slice(0, 3).join(', ')}.`,
        beforeViewing: embedded.preActivities || [
            `Review background on ${topicName}`,
            `Introduce key vocabulary`,
            `Discuss fact vs. dramatization`,
            media.notes ? `Note: ${media.notes}` : ''
        ].filter(Boolean),
        discussionQuestions: embedded.discussionQuestions || [
            `What did you learn about ${topicName}?`,
            `How did filmmakers want you to feel?`,
            `What might differ from actual history?`,
            `How does this connect to class content?`
        ],
        extensions: embedded.extensions || [
            `Compare film to primary sources`,
            `Write from a character's perspective`,
            `Create visual timeline of events`,
            `Research related topic`
        ]
    };
}

// ===========================================
// Utility Functions
// ===========================================

function handleSearch(e) {
    state.searchQuery = e.target.value;
    renderTopics();
    if (state.currentTopic) renderMedia();
}

function handleFilterClick(chip) {
    const filterType = chip.closest('.filter-chips').id;
    const value = chip.dataset.type || chip.dataset.age;
    
    chip.closest('.filter-chips').querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    
    if (filterType === 'typeFilters') state.filters.type = value;
    else if (filterType === 'ageFilters') state.filters.ageAppropriate = value;
    
    renderMedia();
}

function toggleView(view) {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    const isGrid = view === 'grid';
    elements.topicGrid.style.gridTemplateColumns = isGrid ? 'repeat(auto-fill, minmax(300px, 1fr))' : '1fr';
    elements.mediaGrid.style.gridTemplateColumns = isGrid ? 'repeat(auto-fill, minmax(320px, 1fr))' : '1fr';
}

function closeModals() {
    elements.movieModal.classList.remove('active');
    elements.lessonModal.classList.remove('active');
}

function updateStats() {
    const data = state.data[state.currentGrade];
    if (!data) return;
    
    let totalMedia = 0, totalTopics = 0;
    data.categories?.forEach(cat => {
        cat.topics?.forEach(topic => {
            totalTopics++;
            totalMedia += topic.media?.length || 0;
        });
    });
    
    elements.totalMovies.textContent = totalMedia;
    elements.totalTopics.textContent = totalTopics;
}

function updateBreadcrumb() {
    const data = state.data[state.currentGrade];
    let crumbs = [`Grade ${state.currentGrade}`];
    
    if (state.currentCategory && data) {
        const cat = data.categories?.find(c => c.id === state.currentCategory);
        if (cat) crumbs.push(cat.name);
    }
    
    if (state.currentTopic && data) {
        for (const cat of data.categories || []) {
            const topic = cat.topics?.find(t => t.id === state.currentTopic);
            if (topic) { crumbs.push(topic.name); break; }
        }
    }
    
    if (crumbs.length === 1) crumbs.push('All Topics');
    
    elements.breadcrumb.innerHTML = crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        return `<span class="crumb ${isLast ? 'active' : ''}">${c}</span>${!isLast ? '<span class="crumb-separator">›</span>' : ''}`;
    }).join('');
}

function updateWatchedStats() {
    const watchedCount = Object.values(state.watched).filter(v => v).length;
    const statsEl = document.getElementById('watchedStats');
    if (statsEl) {
        statsEl.innerHTML = `<span class="count">${watchedCount}</span> watched`;
    }
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Global exports
window.showLessonPlan = showLessonPlan;
window.toggleWatched = toggleWatched;
window.toggleWatchedFromModal = toggleWatchedFromModal;

// Initialize
document.addEventListener('DOMContentLoaded', init);
