/**
 * Curriculum Media Hunter
 * Educational media browser for NY State Social Studies
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
    data: {},
    allMedia: [],
    watched: {} // Track watched titles
};

// Load watched state from localStorage
function loadWatchedState() {
    try {
        const saved = localStorage.getItem('curriculum-watched');
        if (saved) {
            state.watched = JSON.parse(saved);
        }
    } catch (e) {
        console.error('Error loading watched state:', e);
    }
}

// Save watched state to localStorage
function saveWatchedState() {
    try {
        localStorage.setItem('curriculum-watched', JSON.stringify(state.watched));
    } catch (e) {
        console.error('Error saving watched state:', e);
    }
}

// Generate unique key for media item
function getMediaKey(media) {
    return `${media.title}-${media.year || 'unknown'}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

// Check if media is watched
function isWatched(media) {
    const key = getMediaKey(media);
    return state.watched[key] === true;
}

// Toggle watched state
function toggleWatched(media, event) {
    if (event) {
        event.stopPropagation();
    }
    const key = getMediaKey(media);
    state.watched[key] = !state.watched[key];
    saveWatchedState();
    renderMedia();
    updateWatchedStats();
}

// Streaming service configurations
const streamingServices = {
    'Disney+': { icon: 'D+', color: '#113ccf', baseUrl: 'https://www.disneyplus.com/search/' },
    'Netflix': { icon: 'N', color: '#e50914', baseUrl: 'https://www.netflix.com/search?q=' },
    'PBS': { icon: 'PBS', color: '#2638c4', baseUrl: 'https://www.pbs.org/search/?q=' },
    'YouTube': { icon: '▶', color: '#ff0000', baseUrl: '' },
    'Amazon': { icon: 'A', color: '#ff9900', baseUrl: 'https://www.amazon.com/s?k=' },
    'Hulu': { icon: 'h', color: '#1ce783', baseUrl: 'https://www.hulu.com/search?q=' },
    'HBO Max': { icon: 'HBO', color: '#5822b4', baseUrl: 'https://play.hbomax.com/search/' },
    'BrainPOP': { icon: 'BP', color: '#ff6b35', baseUrl: 'https://www.brainpop.com/search/?keyword=' },
    'JustWatch': { icon: 'JW', color: '#ffce00', baseUrl: 'https://www.justwatch.com/us/search?q=' },
    'Amazon Prime Video': { icon: 'P', color: '#00A8E1', baseUrl: 'https://www.amazon.com/gp/video/search/' },
    'YouTube (Trailer)': { icon: '▶', color: '#ff0000', baseUrl: '' }
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

// Initialize Application
async function init() {
    loadWatchedState();
    setupEventListeners();
    await loadGradeData(state.currentGrade);
    renderUI();
}

// Event Listeners
function setupEventListeners() {
    // Grade tabs
    document.querySelectorAll('.grade-tab').forEach(tab => {
        tab.addEventListener('click', () => selectGrade(tab.dataset.grade));
    });

    // Search
    elements.search.addEventListener('input', debounce(handleSearch, 300));
    
    // Keyboard shortcut for search
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

// Data Loading
async function loadGradeData(grade) {
    if (state.data[grade]) return;

    try {
        const response = await fetch(`grades/grade-${grade}.json`);
        const data = await response.json();
        state.data[grade] = data;

        // For grade 11, also load part 2
        if (grade === '11') {
            try {
                const response2 = await fetch('grades/grade-11-part2.json');
                const data2 = await response2.json();
                // Merge categories
                state.data[grade].categories = [
                    ...state.data[grade].categories,
                    ...data2.categories
                ];
            } catch (e) {
                console.log('Grade 11 part 2 not found or error loading');
            }
        }

        // Index all media for search
        indexMedia(grade);
    } catch (error) {
        console.error(`Error loading grade ${grade}:`, error);
        state.data[grade] = { categories: [] };
    }
}

function indexMedia(grade) {
    const data = state.data[grade];
    if (!data || !data.categories) return;

    data.categories.forEach(category => {
        category.topics?.forEach(topic => {
            topic.media?.forEach(media => {
                state.allMedia.push({
                    ...media,
                    grade,
                    categoryId: category.id,
                    categoryName: category.name,
                    topicId: topic.id,
                    topicName: topic.name,
                    topicDescription: topic.description
                });
            });
        });
    });
}

// Grade Selection
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

// Render Functions
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
        elements.categoryList.innerHTML = '<div class="empty-state">No categories found</div>';
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

    // Add click handlers
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
        // Show all topics from all categories
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

    // Add click handlers
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
    
    // Scroll to media section
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
    let categoryName = '';
    
    for (const category of data.categories) {
        const found = category.topics?.find(t => t.id === state.currentTopic);
        if (found) {
            topic = found;
            categoryName = category.name;
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

    // Count watched
    const watchedCount = media.filter(m => isWatched(m)).length;
    elements.mediaCount.textContent = `${media.length} titles${watchedCount > 0 ? ` (${watchedCount} watched)` : ''}`;

    if (media.length === 0) {
        elements.mediaGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <h3>No media matches your filters</h3>
                <p>Try changing your filter settings</p>
            </div>
        `;
        return;
    }

    elements.mediaGrid.innerHTML = media.map((m, index) => renderMediaCard(m, topic, index)).join('');

    // Add click handlers for cards (excluding checkbox)
    elements.mediaGrid.querySelectorAll('.media-card').forEach((card, index) => {
        card.addEventListener('click', (e) => {
            // Don't trigger if clicking on checkbox or link
            if (e.target.closest('.watched-checkbox') || e.target.closest('a')) return;
            showMovieDetail(media[index], topic);
        });
    });

    // Add click handlers for checkboxes
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
    const mediaKey = getMediaKey(media);
    
    return `
        <div class="media-card ${watched ? 'watched' : ''}" data-key="${mediaKey}">
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
                <div class="streaming-links">
                    ${streamingLinks}
                </div>
                <span class="age-badge ${media.ageAppropriate ? 'safe' : 'caution'}">
                    ${media.ageAppropriate ? '✓ Classroom' : '⚠ Review'}
                </span>
            </div>
        </div>
    `;
}

function getTypeIcon(type) {
    const icons = {
        movie: '🎬',
        documentary: '📹',
        series: '📺',
        short: '⏱',
        educational: '🎓'
    };
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
    
    // IMDB link
    if (media.links?.imdb) {
        links.push(`<a href="${media.links.imdb}" target="_blank" class="streaming-link imdb" title="IMDb" onclick="event.stopPropagation()">IMDb</a>`);
    }
    
    // YouTube link
    if (media.links?.youtube) {
        links.push(`<a href="${media.links.youtube}" target="_blank" class="streaming-link youtube" title="YouTube" onclick="event.stopPropagation()">▶</a>`);
    }
    
    // Streaming services array
    if (media.links?.streaming && Array.isArray(media.links.streaming)) {
        media.links.streaming.forEach(s => {
            const service = streamingServices[s.service];
            if (service) {
                const url = s.url || service.baseUrl + encodeURIComponent(media.title);
                links.push(`<a href="${url}" target="_blank" class="streaming-link" style="color: ${service.color}" title="${s.service}" onclick="event.stopPropagation()">${service.icon}</a>`);
            }
        });
    }
    
    return links.join('');
}

// Update watched stats display
function updateWatchedStats() {
    const watchedCount = Object.values(state.watched).filter(v => v).length;
    const statsEl = document.getElementById('watchedStats');
    if (statsEl) {
        statsEl.innerHTML = `<span class="count">${watchedCount}</span> watched`;
    }
}

// Movie Detail Modal
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
                    <input type="checkbox" ${watched ? 'checked' : ''} onchange="toggleWatchedFromModal('${getMediaKey(media).replace(/'/g, "\\'")}', this.checked)" />
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
            <div class="streaming-buttons">
                ${streamingButtons}
            </div>
        </div>
        
        <div class="movie-detail-section">
            <button class="lesson-plan-btn" onclick="showLessonPlan(${JSON.stringify(media).replace(/"/g, '&quot;')}, ${JSON.stringify(topic).replace(/"/g, '&quot;')})">
                📋 Generate Lesson Plan
            </button>
        </div>
    `;
    
    elements.movieModal.classList.add('active');
}

// Toggle watched from modal
function toggleWatchedFromModal(key, checked) {
    state.watched[key] = checked;
    saveWatchedState();
    renderMedia();
    updateWatchedStats();
}

function getStreamingButtons(media) {
    const buttons = [];
    
    if (media.links?.imdb) {
        buttons.push(`<a href="${media.links.imdb}" target="_blank" class="streaming-btn">🎬 IMDb Page</a>`);
    }
    
    if (media.links?.youtube) {
        buttons.push(`<a href="${media.links.youtube}" target="_blank" class="streaming-btn">▶️ YouTube</a>`);
    }
    
    if (media.links?.justwatch) {
        buttons.push(`<a href="${media.links.justwatch}" target="_blank" class="streaming-btn">📺 JustWatch</a>`);
    }
    
    if (media.links?.streaming && Array.isArray(media.links.streaming)) {
        media.links.streaming.forEach(s => {
            const service = streamingServices[s.service];
            if (service) {
                const url = s.url || service.baseUrl + encodeURIComponent(media.title);
                buttons.push(`<a href="${url}" target="_blank" class="streaming-btn">${service.icon} ${s.service}</a>`);
            }
        });
    }
    
    // Fallback search links
    if (buttons.length <= 1) {
        const searchQuery = encodeURIComponent(media.title + ' ' + (media.year || ''));
        if (!media.links?.justwatch) {
            buttons.push(`<a href="https://www.justwatch.com/us/search?q=${searchQuery}" target="_blank" class="streaming-btn">📺 Find Streaming</a>`);
        }
        buttons.push(`<a href="https://www.google.com/search?q=${searchQuery}+watch+online" target="_blank" class="streaming-btn">🔍 Search Online</a>`);
    }
    
    return buttons.join('');
}

// Lesson Plan Generator
function showLessonPlan(media, topic) {
    const lessonPlan = generateLessonPlan(media, topic);
    
    elements.lessonBody.innerHTML = `
        <div class="lesson-plan">
            <h2>📋 Lesson Plan</h2>
            <p class="subtitle">${media.title} (${media.year})</p>
            
            <div class="lesson-section">
                <h3>🎯 Learning Objectives</h3>
                <ul>
                    ${lessonPlan.objectives.map(obj => `<li>${obj}</li>`).join('')}
                </ul>
            </div>
            
            <div class="lesson-section">
                <h3>📚 Curriculum Connection</h3>
                <p style="color: var(--text-secondary);">${lessonPlan.connection}</p>
            </div>
            
            <div class="lesson-section">
                <h3>⏱ Before Viewing (10-15 min)</h3>
                <ul>
                    ${lessonPlan.beforeViewing.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
            
            <div class="lesson-section">
                <h3>👀 During Viewing</h3>
                <ul>
                    ${lessonPlan.duringViewing.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
            
            <div class="lesson-section">
                <h3>💭 After Viewing (15-20 min)</h3>
                <ul>
                    ${lessonPlan.afterViewing.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
            
            <div class="lesson-section">
                <h3>❓ Discussion Questions</h3>
                <div class="discussion-questions">
                    <ol>
                        ${lessonPlan.discussionQuestions.map(q => `<li>${q}</li>`).join('')}
                    </ol>
                </div>
            </div>
            
            <div class="lesson-section">
                <h3>📝 Extension Activities</h3>
                <ul>
                    ${lessonPlan.extensions.map(ext => `<li>${ext}</li>`).join('')}
                </ul>
            </div>
            
            ${!media.ageAppropriate ? `
            <div class="lesson-section">
                <h3>⚠️ Content Advisory</h3>
                <div class="teacher-notes">
                    ${lessonPlan.contentAdvisory}
                </div>
            </div>
            ` : ''}
            
            <button class="print-btn" onclick="window.print()">
                🖨 Print Lesson Plan
            </button>
        </div>
    `;
    
    elements.lessonModal.classList.add('active');
}

function generateLessonPlan(media, topic) {
    const topicName = topic.name || 'this topic';
    const subtopics = topic.subtopics || [];
    
    // Use embedded lesson plan if available
    const embedded = media.lessonPlan || {};
    
    return {
        objectives: embedded.objectives || [
            `Students will understand key aspects of ${topicName} as portrayed in "${media.title}"`,
            `Students will analyze primary and secondary source perspectives on historical events`,
            `Students will evaluate the accuracy and perspective of historical media`,
            `Students will connect historical content to broader themes in the curriculum`
        ],
        connection: `This film supports the study of ${topicName}. ${media.relevance || ''} Key subtopics covered include: ${subtopics.slice(0, 3).join(', ')}.`,
        beforeViewing: embedded.preActivities || [
            `Review background information on ${topicName}`,
            `Introduce key vocabulary and historical figures that will appear`,
            `Discuss the difference between historical fact and dramatic interpretation`,
            `Provide students with a viewing guide with questions to consider`,
            `Set purpose: "As you watch, think about..."`,
            media.notes ? `Note: ${media.notes}` : ''
        ].filter(Boolean),
        duringViewing: [
            `Pause at key moments for brief clarification if needed`,
            `Have students take notes on their viewing guide`,
            `Consider showing in segments across multiple class periods`,
            `Monitor for student engagement and comprehension`,
            `Note scenes that may need additional context or discussion`
        ],
        afterViewing: [
            `Lead whole-class discussion using prepared questions`,
            `Have students share observations from their viewing guides`,
            `Compare film depiction to textbook/primary source accounts`,
            `Identify what was historically accurate vs. dramatized`,
            `Connect themes to current events or other curriculum topics`
        ],
        discussionQuestions: embedded.discussionQuestions || [
            `What did you learn about ${topicName} from this film?`,
            `How do you think the filmmakers wanted you to feel about the events/people shown?`,
            `What might be different between this film's portrayal and actual historical events?`,
            `How does this connect to what we've learned in class about this period?`,
            `If you could ask one of the historical figures in this film a question, what would it be?`,
            `What perspectives or voices might be missing from this film's narrative?`
        ],
        extensions: embedded.extensions || [
            `Research project: Compare film to primary sources from the period`,
            `Creative writing: Write a diary entry from a character's perspective`,
            `Debate: Evaluate different historical interpretations of events`,
            `Art project: Create a visual timeline of events depicted`,
            `Presentation: Research a related topic not covered in the film`
        ],
        contentAdvisory: media.ageAppropriate ? '' : 
            `This film is rated ${media.rating} and may contain content that requires teacher preview. ${media.notes || ''} Consider: viewing with parental permission, showing selected clips only, or using as teacher background reference.`
    };
}

// Search Handler
function handleSearch(e) {
    state.searchQuery = e.target.value;
    renderTopics();
    if (state.currentTopic) {
        renderMedia();
    }
}

// Filter Handlers
function handleFilterClick(chip) {
    const filterType = chip.closest('.filter-chips').id;
    const value = chip.dataset.type || chip.dataset.age;
    
    // Update UI
    chip.closest('.filter-chips').querySelectorAll('.filter-chip').forEach(c => {
        c.classList.remove('active');
    });
    chip.classList.add('active');
    
    // Update state
    if (filterType === 'typeFilters') {
        state.filters.type = value;
    } else if (filterType === 'ageFilters') {
        state.filters.ageAppropriate = value;
    }
    
    renderMedia();
}

// View Toggle
function toggleView(view) {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    const isGrid = view === 'grid';
    elements.topicGrid.style.gridTemplateColumns = isGrid ? 
        'repeat(auto-fill, minmax(300px, 1fr))' : '1fr';
    elements.mediaGrid.style.gridTemplateColumns = isGrid ? 
        'repeat(auto-fill, minmax(320px, 1fr))' : '1fr';
}

// Modal Management
function closeModals() {
    elements.movieModal.classList.remove('active');
    elements.lessonModal.classList.remove('active');
}

// Update Stats
function updateStats() {
    const data = state.data[state.currentGrade];
    if (!data) return;
    
    let totalMedia = 0;
    let totalTopics = 0;
    
    data.categories?.forEach(cat => {
        cat.topics?.forEach(topic => {
            totalTopics++;
            totalMedia += topic.media?.length || 0;
        });
    });
    
    elements.totalMovies.textContent = totalMedia;
    elements.totalTopics.textContent = totalTopics;
}

// Update Breadcrumb
function updateBreadcrumb() {
    const data = state.data[state.currentGrade];
    const gradeLabel = document.querySelector(`.grade-tab[data-grade="${state.currentGrade}"] .grade-label`)?.textContent || `Grade ${state.currentGrade}`;
    
    let crumbs = [`Grade ${state.currentGrade}`];
    
    if (state.currentCategory && data) {
        const category = data.categories?.find(c => c.id === state.currentCategory);
        if (category) {
            crumbs.push(category.name);
        }
    }
    
    if (state.currentTopic && data) {
        for (const cat of data.categories || []) {
            const topic = cat.topics?.find(t => t.id === state.currentTopic);
            if (topic) {
                crumbs.push(topic.name);
                break;
            }
        }
    }
    
    if (crumbs.length === 1) {
        crumbs.push('All Topics');
    }
    
    elements.breadcrumb.innerHTML = crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return `
            <span class="crumb ${isLast ? 'active' : ''}">${crumb}</span>
            ${!isLast ? '<span class="crumb-separator">›</span>' : ''}
        `;
    }).join('');
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Make functions available globally for onclick
window.showLessonPlan = showLessonPlan;
window.toggleWatched = toggleWatched;
window.toggleWatchedFromModal = toggleWatchedFromModal;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
