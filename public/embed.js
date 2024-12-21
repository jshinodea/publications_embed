// Publications viewer code
(function() {
    // Get server URL based on environment
    const SERVER_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000'
        : 'https://publications-embed.onrender.com';

    // State management
    const state = {
        publications: [],
        sort: 'time',
        direction: 'desc', // Default to descending (newer first)
        groupDirection: 'desc', // Separate state for group ordering
        group: 'year',
        search: '',
        page: 1,
        loading: false,
        hasMore: true,
        cache: new Map() // Cache for instant filtering
    };

    // Track expanded BibTeX sections
    const expandedBibTexSections = new Set();

    // Create viewer structure
    function createViewerStructure() {
        const container = document.createElement('div');
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
                            <button class="direction-btn" title="Toggle sort direction" data-direction="desc">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg>
                            </button>
                            <div class="dropdown-content sort-options">
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
                            <div class="dropdown-content group-options">
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

    // Create and inject styles
    function injectStyles() {
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            :root {
                --ucd-blue: #002855;
                --ucd-gold: #FFBF00;
                --text-primary: #002855;
                --text-secondary: #4F6379;
                --background-light: #F7F9FC;
                --border-color: #E2E8F0;
                --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.05);
                --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            }

            .publications-viewer-container {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
                color: var(--text-primary);
                background: var(--background-light);
            }

            .controls {
                display: flex;
                flex-wrap: wrap;
                gap: 20px;
                margin-bottom: 30px;
                background: white;
                padding: 20px;
                border-radius: 12px;
                box-shadow: var(--shadow-xl);
                border: 2px solid var(--ucd-blue);
                position: relative;
                z-index: 2;
            }

            .search-input {
                flex: 1;
                min-width: 200px;
                padding: 12px 16px;
                border: 2px solid var(--border-color);
                border-radius: 8px;
                font-size: 16px;
                transition: all 0.2s ease;
                color: var(--text-primary);
            }

            .search-input:focus {
                outline: none;
                border-color: var(--ucd-blue);
                box-shadow: 0 0 0 3px rgba(0, 40, 85, 0.1);
            }

            .buttons-group {
                display: flex;
                gap: 15px;
            }

            .dropdown {
                position: relative;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .button-group-label {
                font-size: 14px;
                color: var(--text-secondary);
                font-weight: 500;
            }

            .btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 16px;
                background: white;
                border: 2px solid var(--border-color);
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                color: var(--text-primary);
                font-weight: 500;
                transition: all 0.2s ease;
            }

            .btn:hover {
                border-color: var(--ucd-blue);
            }

            .direction-btn {
                padding: 8px;
                background: white;
                border: 2px solid var(--border-color);
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .direction-btn:hover {
                border-color: var(--ucd-blue);
            }

            .direction-btn svg {
                width: 16px;
                height: 16px;
                stroke: var(--text-secondary);
            }

            .direction-btn[data-direction="asc"] svg {
                transform: rotate(180deg);
            }

            .dropdown-content {
                display: none;
                position: absolute;
                top: calc(100% + 8px);
                left: 0;
                min-width: 160px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                z-index: 1000;
                border: 1px solid var(--border-color);
            }

            .dropdown.active .dropdown-content {
                display: block;
            }

            .dropdown-content a {
                display: block;
                padding: 10px 16px;
                color: var(--text-primary);
                text-decoration: none;
                font-size: 14px;
                transition: all 0.2s ease;
            }

            .dropdown-content a:hover {
                background: var(--background-light);
                color: var(--ucd-blue);
            }

            .publication-card {
                background: white;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 16px;
                border: 1px solid var(--border-color);
                transition: all 0.2s ease;
                box-shadow: var(--shadow-sm);
            }

            .publication-card:hover {
                box-shadow: var(--shadow-md);
                transform: translateY(-1px);
            }

            .publication-title-row {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 20px;
                margin-bottom: 16px;
            }

            .publication-title {
                font-size: 18px;
                font-weight: 600;
                color: var(--text-primary);
                margin: 0;
                line-height: 1.4;
                flex: 1;
            }

            .publication-link {
                display: inline-flex;
                align-items: center;
                padding: 8px 16px;
                background: var(--ucd-blue);
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 500;
                font-size: 14px;
                transition: all 0.2s ease;
                white-space: nowrap;
            }

            .publication-link:hover {
                background: #003875;
                transform: translateY(-1px);
            }

            .publication-authors {
                color: var(--text-secondary);
                font-size: 14px;
                margin-bottom: 16px;
                line-height: 1.6;
            }

            .publication-meta {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-top: 16px;
                border-top: 1px solid var(--border-color);
            }

            .meta-left {
                display: flex;
                gap: 16px;
                align-items: center;
                color: var(--text-secondary);
                font-size: 14px;
            }

            .citation-count {
                display: inline-flex;
                align-items: center;
                padding: 4px 10px;
                background: rgba(0, 40, 85, 0.1);
                color: var(--ucd-blue);
                border-radius: 6px;
                font-weight: 500;
            }

            .bibtex-toggle {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                color: var(--text-secondary);
                background: transparent;
                border: none;
                padding: 8px 12px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .bibtex-toggle:hover {
                color: var(--ucd-blue);
            }

            .bibtex-toggle .chevron-icon {
                transition: transform 0.2s ease;
            }

            .bibtex-toggle.active .chevron-icon {
                transform: rotate(180deg);
            }

            .bibtex-section {
                display: none;
                margin-top: 16px;
                background: var(--background-light);
                border-radius: 8px;
                overflow: hidden;
                border: 1px solid var(--border-color);
            }

            .bibtex-section.expanded {
                display: block;
                animation: slideDown 0.2s ease;
            }

            .bibtex-header {
                display: flex;
                justify-content: flex-end;
                padding: 8px;
                background: white;
                border-bottom: 1px solid var(--border-color);
            }

            .copy-button {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 12px;
                background: white;
                border: 1px solid var(--border-color);
                border-radius: 6px;
                color: var(--text-secondary);
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .copy-button:hover {
                border-color: var(--ucd-blue);
                color: var(--ucd-blue);
            }

            .copy-button svg {
                width: 14px;
                height: 14px;
                stroke: currentColor;
            }

            .copy-button.copied {
                background: var(--ucd-blue);
                color: white;
                border-color: var(--ucd-blue);
            }

            .bibtex-content {
                margin: 0;
                padding: 16px;
                font-family: 'SF Mono', 'Consolas', monospace;
                font-size: 13px;
                line-height: 1.5;
                color: var(--text-primary);
                overflow-x: auto;
                background: var(--background-light);
            }

            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .year-group {
                margin-bottom: 24px;
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: var(--shadow-lg);
                border: 2px solid var(--ucd-blue);
                transition: all 0.2s ease;
                transform: translateZ(0);
            }

            .year-group:hover {
                box-shadow: var(--shadow-xl);
                transform: translateY(-2px);
            }

            .year-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 24px;
                background: var(--ucd-blue);
                cursor: pointer;
                user-select: none;
                transition: all 0.2s ease;
                position: relative;
                z-index: 1;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }

            .year-header:hover {
                background: #003875;
            }

            .year-header:after {
                content: '';
                position: absolute;
                bottom: -2px;
                left: 0;
                right: 0;
                height: 2px;
                background: rgba(0, 0, 0, 0.1);
            }

            .year-label {
                font-size: 20px;
                font-weight: 600;
                color: white;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
            }

            .year-stats {
                color: var(--ucd-gold);
                font-size: 14px;
                font-weight: 500;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
            }

            .publications-container {
                padding: 20px;
                background: white;
                position: relative;
                z-index: 0;
            }

            .year-group.collapsed .publications-container {
                display: none;
            }

            .spinner {
                width: 40px;
                height: 40px;
                margin: 40px auto;
                border: 4px solid var(--border-color);
                border-top: 4px solid var(--ucd-blue);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            @media (max-width: 768px) {
                .controls {
                    flex-direction: column;
                }

                .search-input {
                    width: 100%;
                }

                .buttons-group {
                    flex-wrap: wrap;
                }

                .publication-title-row {
                    flex-direction: column;
                    gap: 12px;
                }

                .publication-link {
                    align-self: flex-start;
                }

                .publication-meta {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 12px;
                }
            }

            .chevron {
                stroke: white;
                transition: transform 0.2s ease;
            }

            .year-group.collapsed .chevron {
                transform: rotate(-90deg);
            }
        `;
        document.head.appendChild(styleSheet);
    }

    // Helper function to escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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

    // Toggle group collapse
    window.toggleGroup = function(header) {
        const group = header.parentElement;
        group.classList.toggle('collapsed');
    };

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
                    <button class="bibtex-toggle" onclick="toggleBibtex('${pub.id}')" data-id="${pub.id}">
                        <span>BibTeX</span>
                        <svg class="chevron-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                </div>
                <div id="bibtex-${pub.id}" class="bibtex-section">
                    <pre class="bibtex-content">${escapeHtml(pub.bibtex || '')}</pre>
                </div>
            </div>
        `;
    }

    // Toggle BibTeX visibility
    window.toggleBibtex = function(pubId) {
        const section = document.getElementById(`bibtex-${pubId}`);
        const button = section.parentElement.querySelector('.bibtex-toggle');
        const isVisible = section.style.display === 'block';
        
        // Toggle the section display
        section.style.display = isVisible ? 'none' : 'block';
        
        // Track expanded state
        if (isVisible) {
            expandedBibTexSections.delete(pubId);
        } else {
            expandedBibTexSections.add(pubId);
        }
        
        // Toggle the active class for the button (controls arrow rotation)
        button.classList.toggle('active');
    };

    // Render publications
    function renderPublications(append = false) {
        const container = document.getElementById('publications-list');
        const spinner = document.getElementById('loading-spinner');
        
        // Store collapsed state before re-rendering
        const collapsedYears = new Set();
        document.querySelectorAll('.year-group').forEach(group => {
            const yearHeader = group.querySelector('.year-header');
            if (yearHeader && group.classList.contains('collapsed')) {
                collapsedYears.add(yearHeader.querySelector('div').textContent.trim());
            }
        });

        if (!append) {
            container.innerHTML = '';
        }

        let publications = state.publications;

        // Filter publications based on search
        let filteredPubs = publications.filter(pub => {
            const searchLower = state.search.toLowerCase();
            return pub.title.toLowerCase().includes(searchLower) ||
                   pub.authors.toLowerCase().includes(searchLower) ||
                   pub.journal.toLowerCase().includes(searchLower);
        });

        // Sort publications
        if (state.sort === 'time') {
            // For time sorting, preserve the original order from citations.bib
            filteredPubs.sort((a, b) => {
                let comparison = (b.time || 0) - (a.time || 0);
                if (comparison === 0) {
                    // If times are equal (shouldn't happen with our new time field),
                    // fallback to year comparison
                    const yearA = parseInt(a.year) || 0;
                    const yearB = parseInt(b.year) || 0;
                    comparison = yearB - yearA;
                }
                return state.direction === 'asc' ? -comparison : comparison;
            });
        } else {
            filteredPubs.sort((a, b) => {
                let comparison = 0;
                switch (state.sort) {
                    case 'title':
                        comparison = a.title.localeCompare(b.title);
                        break;
                    case 'author':
                        comparison = a.authors.localeCompare(b.authors);
                        break;
                    case 'citations':
                        comparison = (b.citations || 0) - (a.citations || 0);
                        break;
                }
                return state.direction === 'asc' ? -comparison : comparison;
            });
        }

        // Group publications if needed
        if (state.group === 'year') {
            const grouped = {};
            filteredPubs.forEach(pub => {
                const year = pub.year || 'Unknown Year';
                if (!grouped[year]) {
                    grouped[year] = [];
                }
                grouped[year].push(pub);
            });

            // Sort publications within each year by selected criteria
            for (const year in grouped) {
                if (state.sort === 'time') {
                    // For time sorting, preserve the original order from citations.bib
                    grouped[year].sort((a, b) => {
                        const comparison = (b.time || 0) - (a.time || 0);
                        return state.direction === 'asc' ? -comparison : comparison;
                    });
                } else {
                    grouped[year].sort((a, b) => {
                        let comparison = 0;
                        switch (state.sort) {
                            case 'title':
                                comparison = a.title.localeCompare(b.title);
                                break;
                            case 'author':
                                comparison = a.authors.localeCompare(b.authors);
                                break;
                            case 'citations':
                                comparison = (b.citations || 0) - (a.citations || 0);
                                break;
                        }
                        return state.direction === 'asc' ? -comparison : comparison;
                    });
                }
            }

            // Create a document fragment to hold all year groups
            const fragment = document.createDocumentFragment();

            // Sort and render year groups (order depends on sort field and direction)
            Object.keys(grouped)
                .sort((a, b) => {
                    if (a === 'Unknown Year') return 1;
                    if (b === 'Unknown Year') return -1;
                    // Use groupDirection for year ordering
                    const comparison = b - a;
                    return state.groupDirection === 'asc' ? -comparison : comparison;
                })
                .forEach(year => {
                    const yearGroup = document.createElement('div');
                    yearGroup.className = 'year-group';
                    if (collapsedYears.has(year)) {
                        yearGroup.classList.add('collapsed');
                    }

                    const totalCitations = grouped[year].reduce((sum, pub) => sum + (pub.citations || 0), 0);
                    yearGroup.innerHTML = `
                        <div class="year-header" onclick="toggleGroup(this)">
                            <div class="year-label">${year}</div>
                            <div class="year-stats">
                                <span>${grouped[year].length} ${grouped[year].length === 1 ? 'publication' : 'publications'} · ${totalCitations} ${totalCitations === 1 ? 'citation' : 'citations'}</span>
                                <svg class="chevron" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>
                        </div>
                        <div class="publications-container">
                            ${grouped[year].map(pub => renderPublicationCard(pub)).join('')}
                        </div>
                    `;
                    fragment.appendChild(yearGroup);
                });

            // Add all year groups to the container at once
            container.appendChild(fragment);
        } else {
            if (append) {
                const newPubs = filteredPubs.slice(-20);
                newPubs.forEach(pub => {
                    container.insertAdjacentHTML('beforeend', renderPublicationCard(pub));
                });
            } else {
                filteredPubs.forEach(pub => {
                    container.insertAdjacentHTML('beforeend', renderPublicationCard(pub));
                });
            }
        }

        spinner.style.display = state.loading ? 'block' : 'none';

        // Restore expanded BibTeX sections after rendering
        expandedBibTexSections.forEach(pubId => {
            const section = document.getElementById(`bibtex-${pubId}`);
            const button = section?.parentElement?.querySelector('.bibtex-toggle');
            if (section && button) {
                section.style.display = 'block';
                button.classList.add('active');
            }
        });
    }

    // Load more publications
    async function loadMorePublications() {
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
                    // Create a map of existing publications by year
                    const existingByYear = new Map();
                    state.publications.forEach(pub => {
                        const year = pub.year || 'Unknown Year';
                        if (!existingByYear.has(year)) {
                            existingByYear.set(year, []);
                        }
                        existingByYear.get(year).push(pub);
                    });

                    // Merge new publications
                    data.data.forEach(group => {
                        if (group.publications) {
                            const year = group.year;
                            if (year !== 'Unknown Year' || !existingByYear.has('Unknown Year')) {
                                if (!existingByYear.has(year)) {
                                    existingByYear.set(year, []);
                                }
                                existingByYear.get(year).push(...group.publications);
                            }
                        }
                    });

                    // Convert back to array and sort by year
                    state.publications = Array.from(existingByYear.entries())
                        .sort(([yearA], [yearB]) => {
                            if (yearA === 'Unknown Year') return 1;
                            if (yearB === 'Unknown Year') return -1;
                            // Use groupDirection for year ordering
                            const comparison = yearB - yearA;
                            return state.groupDirection === 'asc' ? -comparison : comparison;
                        })
                        .flatMap(([_, pubs]) => pubs);
                } else {
                    state.publications = state.publications.concat(data.data);
                }
                renderPublications();

                // Auto-load more if we still have more to load
                if (state.hasMore) {
                    setTimeout(loadMorePublications, 1000); // Load next batch after 1 second
                }
            }
        } catch (error) {
            console.error('Error loading more publications:', error);
        } finally {
            state.loading = false;
            spinner.style.display = state.hasMore ? 'block' : 'none';
        }
    }

    // Progressive loading using Intersection Observer
    function setupProgressiveLoading() {
        // Start loading more publications automatically
        if (state.hasMore) {
            setTimeout(loadMorePublications, 1000);
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
                        state.publications.push(...group.publications);
                    }
                });
            } else {
                state.publications = data.data;
            }
            
            state.hasMore = data.pagination.totalPages > 1;
            renderPublications();

            // Start progressive loading
            if (state.hasMore) {
                setTimeout(loadMorePublications, 1000);
            }
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
                const newSort = e.target.dataset.sort;
                // If switching to time sort, sync group direction with current direction
                if (newSort === 'time' && state.sort !== 'time') {
                    state.groupDirection = state.direction;
                }
                state.sort = newSort;
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

        // Direction button
        const sortDirectionBtn = document.querySelector('.sort-button').nextElementSibling;
        sortDirectionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            state.direction = state.direction === 'asc' ? 'desc' : 'asc';
            // Only update group direction when sorting by date
            if (state.sort === 'time') {
                state.groupDirection = state.direction;
            }
            sortDirectionBtn.dataset.direction = state.direction;
            fetchPublications();
        });

        // Search input with debouncing
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
                section.classList.toggle('expanded');
            }
        });
    }

    // Initialize the viewer
    async function init() {
        try {
            console.log('Starting initialization...');
            
            // Inject styles
            injectStyles();

            // Create viewer structure
            const viewer = createViewerStructure();
            document.currentScript.parentNode.insertBefore(viewer, document.currentScript.nextSibling);
            
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