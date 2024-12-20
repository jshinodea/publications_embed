// Publications viewer code
(function() {
    // Get server URL based on environment
    const SERVER_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000'
        : 'https://publications-embed.onrender.com'; // Updated with actual Render URL

    // Create and inject styles
    function injectStyles() {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `${SERVER_URL}/styles.css`;
        document.head.appendChild(link);
    }

    // Create viewer structure
    function createViewerStructure() {
        const container = document.getElementById('publications-viewer');
        if (!container) {
            console.error('Could not find #publications-viewer element');
            return null;
        }

        container.className = 'publications-viewer-container';
        container.innerHTML = `
            <div class="container">
                <div class="controls">
                    <input type="text" id="search" placeholder="Search publications..." class="search-input">
                    
                    <div class="buttons-group">
                        <div class="dropdown">
                            <span class="button-group-label">Sort by</span>
                            <button class="btn sort-button">
                                <span>Date</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chevron-down"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </button>
                            <button class="direction-btn" title="Toggle sort direction" data-direction="asc">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg>
                            </button>
                            <div class="dropdown-content">
                                <a href="#" data-sort="time">Date</a>
                                <a href="#" data-sort="title">Title</a>
                                <a href="#" data-sort="author">Author</a>
                                <a href="#" data-sort="citations">Citations</a>
                            </div>
                        </div>
                        
                        <div class="dropdown">
                            <span class="button-group-label">Group by</span>
                            <button class="btn group-button">
                                <span>Year</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chevron-down"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </button>
                            <div class="dropdown-content">
                                <a href="#" data-group="year">Year</a>
                                <a href="#" data-group="none">None</a>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div id="publications-list"></div>

                <div class="pagination">
                    <div id="loading-spinner" class="spinner" style="display: none;"></div>
                </div>
            </div>
        `;

        return container;
    }

    // State management
    let state = {
        publications: [],
        sort: 'time',
        direction: 'asc',
        group: 'year',
        search: '',
        page: 1,
        loading: false,
        hasMore: true
    };

    // Helper function to escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Render a publication card
    function renderPublicationCard(pub) {
        return `
            <div class="publication-card">
                <div class="publication-title-row">
                    <h3 class="publication-title">${pub.title || 'Untitled'}</h3>
                    <a href="${pub.url || '#'}" target="_blank" class="publication-link">View Publication</a>
                </div>
                <div class="publication-authors">${pub.authors || 'Unknown Authors'}</div>
                <div class="publication-meta">
                    <div class="meta-left">
                        <span>${pub.journal || ''}</span>
                        <span class="citation-count">${pub.citations || 0} citations</span>
                    </div>
                    <div class="meta-right">
                        <button class="bibtex-toggle" data-id="${pub.id}">
                            <span>BibTeX</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chevron-down"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                    </div>
                </div>
                <div id="bibtex-${pub.id}" class="bibtex-section">
                    <div class="bibtex-content">${escapeHtml(pub.bibtex || '')}</div>
                </div>
            </div>
        `;
    }

    // Render publications
    function renderPublications(append = false) {
        const container = document.getElementById('publications-list');
        const spinner = document.getElementById('loading-spinner');
        
        if (!append) {
            container.innerHTML = '';
        }

        // Store collapsed state before re-rendering
        const collapsedYears = new Set();
        document.querySelectorAll('.year-group').forEach(group => {
            if (group.classList.contains('collapsed')) {
                collapsedYears.add(group.querySelector('.year-header').textContent.trim().split(' ')[0]);
            }
        });

        let publications = state.group === 'year' ? state.publications : state.publications;

        // Group publications if needed
        if (state.group === 'year') {
            // Sort years in descending order
            const years = [...new Set(publications.map(pub => pub.year))].sort((a, b) => 
                state.direction === 'asc' ? a - b : b - a
            );

            years.forEach(year => {
                const yearPubs = publications.filter(pub => pub.year === year);
                const totalCitations = yearPubs.reduce((sum, pub) => sum + (pub.citations || 0), 0);
                let yearGroup = document.querySelector(`.year-group[data-year="${year}"]`);
                
                if (!yearGroup) {
                    yearGroup = document.createElement('div');
                    yearGroup.className = 'year-group';
                    yearGroup.setAttribute('data-year', year);
                    if (collapsedYears.has(year)) {
                        yearGroup.classList.add('collapsed');
                    }
                    yearGroup.innerHTML = `
                        <div class="year-header" onclick="toggleGroup(this)">
                            <div>${year}</div>
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <span>${yearPubs.length} ${yearPubs.length === 1 ? 'publication' : 'publications'} · ${totalCitations} ${totalCitations === 1 ? 'citation' : 'citations'}</span>
                                <svg class="chevron" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>
                        </div>
                        <div class="publications-container">
                            ${yearPubs.map(pub => renderPublicationCard(pub)).join('')}
                        </div>
                    `;
                    container.appendChild(yearGroup);
                } else {
                    // Update existing year group
                    const pubsContainer = yearGroup.querySelector('.publications-container');
                    pubsContainer.innerHTML = yearPubs.map(pub => renderPublicationCard(pub)).join('');
                    yearGroup.querySelector('.year-header span').textContent = `${yearPubs.length} ${yearPubs.length === 1 ? 'publication' : 'publications'} · ${totalCitations} ${totalCitations === 1 ? 'citation' : 'citations'}`;
                }
            });
        } else {
            if (append) {
                const newPubs = publications.slice(-20); // Get only the new publications
                newPubs.forEach(pub => {
                    container.insertAdjacentHTML('beforeend', renderPublicationCard(pub));
                });
            } else {
                publications.forEach(pub => {
                    container.insertAdjacentHTML('beforeend', renderPublicationCard(pub));
                });
            }
        }

        spinner.style.display = state.loading ? 'block' : 'none';
    }

    // Progressive loading using Intersection Observer
    function setupProgressiveLoading() {
        const options = {
            root: null,
            rootMargin: '100px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !state.loading && state.hasMore) {
                    loadMore();
                }
            });
        }, options);

        // Observe the spinner element
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            observer.observe(spinner);
        }
    }

    // Load more publications
    async function loadMore() {
        if (state.loading || !state.hasMore) return;

        state.loading = true;
        const spinner = document.getElementById('loading-spinner');
        spinner.style.display = 'block';

        try {
            const params = new URLSearchParams({
                page: state.page + 1,
                limit: 20,
                sort: state.sort,
                direction: state.direction,
                group: state.group,
                search: state.search
            });

            const response = await fetch(`${SERVER_URL}/api/publications?${params}`);
            const data = await response.json();

            if (!data.data || data.data.length === 0) {
                state.hasMore = false;
            } else {
                state.page++;
                if (state.group === 'year') {
                    // For grouped data, merge new publications into existing state
                    data.data.forEach(group => {
                        if (group.publications) {
                            group.publications.forEach(pub => {
                                state.publications.push(pub);
                            });
                        }
                    });
                } else {
                    state.publications = state.publications.concat(data.data);
                }
                renderPublications(true);
            }
        } catch (error) {
            console.error('Error loading more publications:', error);
        } finally {
            state.loading = false;
            spinner.style.display = state.hasMore ? 'block' : 'none';
        }
    }

    // Update button text
    function updateButtonText(type, value) {
        const button = document.querySelector(`.dropdown:has([data-${type}]) .btn span`);
        if (button) {
            let displayText = value;
            if (type === 'sort') {
                displayText = value === 'time' ? 'Date' : 
                            value.charAt(0).toUpperCase() + value.slice(1);
            } else if (type === 'group') {
                displayText = value === 'none' ? 'None' : 'Year';
            }
            button.textContent = displayText;
        }
    }

    // Fetch publications with current filters
    async function fetchPublications() {
        state.loading = true;
        state.page = 1;
        const spinner = document.getElementById('loading-spinner');
        spinner.style.display = 'block';

        try {
            const params = new URLSearchParams({
                page: 1,
                limit: 20,
                sort: state.sort,
                direction: state.direction,
                group: state.group,
                search: state.search
            });

            const response = await fetch(`${SERVER_URL}/api/publications?${params}`);
            const data = await response.json();

            if (state.group === 'year') {
                state.publications = [];
                data.data.forEach(group => {
                    if (group.publications) {
                        group.publications.forEach(pub => {
                            state.publications.push(pub);
                        });
                    }
                });
            } else {
                state.publications = data.data;
            }
            
            state.hasMore = data.pagination.totalPages > 1;
            renderPublications();
        } catch (error) {
            console.error('Error fetching publications:', error);
        } finally {
            state.loading = false;
            spinner.style.display = state.hasMore ? 'block' : 'none';
        }
    }

    // Initialize event listeners
    function initEventListeners() {
        // Sort dropdown
        document.querySelector('.sort-button').addEventListener('click', (e) => {
            e.preventDefault();
            const dropdown = e.target.closest('.dropdown');
            dropdown.classList.toggle('active');
            // Close other dropdown if open
            const otherDropdown = document.querySelector('.dropdown.active:not(:has(.sort-button))');
            if (otherDropdown) otherDropdown.classList.remove('active');
        });

        // Group dropdown
        document.querySelector('.group-button').addEventListener('click', (e) => {
            e.preventDefault();
            const dropdown = e.target.closest('.dropdown');
            dropdown.classList.toggle('active');
            // Close other dropdown if open
            const otherDropdown = document.querySelector('.dropdown.active:not(:has(.group-button))');
            if (otherDropdown) otherDropdown.classList.remove('active');
        });

        // Sort options
        document.querySelectorAll('[data-sort]').forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                state.sort = e.target.dataset.sort;
                updateButtonText('sort', state.sort);
                e.target.closest('.dropdown').classList.remove('active');
                fetchPublications();
            });
        });

        // Group options
        document.querySelectorAll('[data-group]').forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                state.group = e.target.dataset.group;
                updateButtonText('group', state.group);
                e.target.closest('.dropdown').classList.remove('active');
                fetchPublications();
            });
        });

        // Direction button (sort only)
        const sortDirectionBtn = document.querySelector('.sort-button').nextElementSibling;
        sortDirectionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            state.direction = state.direction === 'asc' ? 'desc' : 'asc';
            sortDirectionBtn.dataset.direction = state.direction;
            fetchPublications();
        });

        // Search input
        const searchInput = document.getElementById('search');
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                state.search = e.target.value;
                fetchPublications();
            }, 300);
        });

        // BibTeX toggle
        document.addEventListener('click', (e) => {
            if (e.target.closest('.bibtex-toggle')) {
                const id = e.target.closest('.bibtex-toggle').dataset.id;
                const section = document.getElementById(`bibtex-${id}`);
                if (section) {
                    section.style.display = section.style.display === 'block' ? 'none' : 'block';
                }
            }
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown.active').forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
            }
        });
    }

    // Toggle group collapse
    window.toggleGroup = function(header) {
        const group = header.parentElement;
        group.classList.toggle('collapsed');
    };

    // Initialize the viewer
    async function init() {
        try {
            // Inject styles
            injectStyles();

            // Create viewer structure
            const container = createViewerStructure();
            if (!container) return;

            // Initialize event listeners
            initEventListeners();

            // Setup progressive loading
            setupProgressiveLoading();

            // Fetch initial publications
            await fetchPublications();

            console.log('Initialization complete');
        } catch (error) {
            console.error('Failed to initialize publications viewer:', error);
            const container = document.querySelector('.publications-viewer-container');
            if (container) {
                container.innerHTML = `
                    <div class="container">
                        <div class="publication-card" style="color: red;">
                            Error loading publications: ${error.message}
                        </div>
                    </div>
                `;
            }
        }
    }

    // Start initialization
    init();
})(); 