// Publications viewer code
(function() {
    console.log('Publications viewer initializing...');

    // Global variables
    let publications = [];
    let currentSort = 'time';
    let currentGroup = 'year';
    let sortDirection = 'desc';
    let groupDirection = 'desc';
    let searchTerm = '';

    // Create and inject required styles
    function injectStyles() {
        console.log('Injecting styles...');
        const style = document.createElement('style');
        style.textContent = `
            :root {
                --ucd-navy: #002855;
                --ucd-gold: #FDB515;
                --light-gray: #f8f9fa;
                --border-gray: #e5e7eb;
            }

            .publications-viewer-container {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                background-color: white;
                padding: 8px 20px 20px 20px;
                margin: 0 auto;
                max-width: 1200px;
                width: 100%;
            }

            .controls {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 24px;
                background-color: white;
                padding: 16px 20px;
                border: 1px solid var(--border-gray);
                border-radius: 12px;
                box-shadow: 0 2px 6px rgba(0,0,0,0.08);
            }

            .search-input {
                padding: 10px 16px;
                border: 1px solid var(--border-gray);
                border-radius: 6px;
                width: 300px;
                font-size: 14px;
                transition: all 0.2s;
                background-color: var(--light-gray);
            }

            .search-input:focus {
                outline: none;
                border-color: var(--ucd-navy);
                background-color: white;
                box-shadow: 0 0 0 3px rgba(0,40,85,0.1);
            }

            .buttons-group {
                display: flex;
                gap: 16px;
                align-items: center;
            }

            .button-group-label {
                color: #495057;
                font-size: 14px;
                font-weight: 500;
                margin-right: 8px;
            }

            .dropdown {
                position: relative;
                display: flex;
                align-items: center;
            }

            .btn {
                background-color: white;
                color: var(--ucd-navy);
                border: 1px solid var(--border-gray);
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 8px;
                min-width: 80px;
                justify-content: space-between;
                transition: all 0.2s;
            }

            .btn:hover {
                border-color: var(--ucd-navy);
                background-color: var(--light-gray);
            }

            .direction-btn {
                background: white;
                border: 1px solid var(--border-gray);
                color: var(--ucd-navy);
                padding: 8px;
                border-radius: 6px;
                cursor: pointer;
                margin-left: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
                height: 35px;
                width: 35px;
            }

            .direction-btn:hover {
                border-color: var(--ucd-navy);
                background-color: var(--light-gray);
            }

            .direction-btn svg {
                width: 16px;
                height: 16px;
                transition: transform 0.2s ease;
            }

            .direction-btn[data-direction="asc"] svg {
                transform: rotate(180deg);
            }

            .year-group {
                margin-bottom: 32px;
                border: 1px solid var(--border-gray);
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 6px rgba(0,0,0,0.08);
            }

            .year-header {
                background-color: var(--ucd-navy);
                color: white;
                padding: 12px 24px;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 15px;
                font-weight: 500;
                user-select: none;
                transition: background-color 0.2s;
            }

            .year-header:hover {
                background-color: #003366;
            }

            .publication-card {
                background-color: white;
                padding: 24px;
                margin: 16px;
                border: 1px solid var(--border-gray);
                border-radius: 8px;
                position: relative;
                transition: all 0.2s;
            }

            .publication-card:hover {
                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                border-color: #d1d5db;
            }

            .publication-link {
                position: absolute;
                top: 24px;
                right: 24px;
                color: var(--ucd-navy);
                text-decoration: none;
                padding: 8px 16px;
                border-radius: 4px;
                font-size: 13px;
                font-weight: 500;
                background-color: var(--light-gray);
                transition: all 0.2s;
            }

            .publication-link:hover {
                background-color: var(--ucd-gold);
            }

            .bibtex-toggle {
                background: none;
                border: none;
                color: var(--ucd-navy);
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 16px;
                font-size: 13px;
                white-space: nowrap;
                transition: color 0.2s;
            }

            .bibtex-toggle:hover {
                color: var(--ucd-gold);
            }

            .dropdown-content {
                display: none;
                position: absolute;
                top: 100%;
                right: 0;
                background-color: white;
                min-width: 120px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                border-radius: 6px;
                border: 1px solid var(--border-gray);
                margin-top: 4px;
                z-index: 1000;
                font-size: 13px;
            }

            .dropdown-content a {
                color: #495057;
                padding: 8px 12px;
                text-decoration: none;
                display: block;
                transition: all 0.2s;
            }

            .dropdown-content a:hover {
                background-color: var(--light-gray);
                color: var(--ucd-navy);
            }

            .dropdown.active .dropdown-content {
                display: block;
            }

            .year-group {
                margin-bottom: 32px;
                border: 1px solid var(--border-gray);
                border-radius: 8px;
                overflow: hidden;
            }

            .year-group.collapsed .publications-container {
                display: none;
            }

            .year-header {
                background-color: #002855;
                color: white;
                padding: 12px 24px;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 15px;
                font-weight: 500;
                user-select: none;
            }

            .year-header:hover {
                background-color: #003366;
            }

            .publication-card {
                background-color: white;
                padding: 24px;
                margin-bottom: 16px;
                border: 1px solid #e0e0e0;
                position: relative;
            }

            .publication-title {
                color: #002855;
                font-size: 16px;
                font-weight: 600;
                margin: 0 0 8px 0;
                padding-right: 140px;
                line-height: 1.4;
            }

            .publication-authors {
                color: #555;
                line-height: 1.4;
                margin-bottom: 8px;
                padding-right: 140px;
                font-size: 14px;
            }

            .publication-meta {
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: #666;
                font-size: 14px;
                margin-top: 4px;
                padding-top: 4px;
                border-top: 1px solid #e0e0e0;
                gap: 16px;
            }

            .meta-left {
                display: flex;
                align-items: center;
                gap: 24px;
                flex: 1;
                min-width: 0;
            }

            .meta-left span {
                white-space: nowrap;
                line-height: 1.2;
            }

            .citation-count {
                color: #666;
                font-size: 13px;
                position: relative;
                padding-left: 24px;
                border-left: 1px solid #e0e0e0;
            }

            .publication-link {
                position: absolute;
                top: 24px;
                right: 24px;
                color: #002855;
                text-decoration: none;
                padding: 8px 16px;
                border-radius: 4px;
                font-size: 13px;
                font-weight: 500;
                background-color: #f5f5f5;
                transition: all 0.2s;
            }

            .publication-link:hover {
                background-color: #FDB515;
            }

            .bibtex-toggle {
                background: none;
                border: none;
                color: #002855;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 16px;
                font-size: 13px;
                white-space: nowrap;
            }

            .bibtex-section {
                display: none;
                margin-top: 16px;
                border-top: 1px solid #e0e0e0;
                padding-top: 16px;
            }

            .bibtex-content {
                background-color: #f5f5f5;
                padding: 16px;
                border-radius: 6px;
                font-family: monospace;
                font-size: 13px;
                white-space: pre-wrap;
                color: #444;
                overflow-x: auto;
                line-height: 1.4;
            }

            .publications-container {
                padding: 16px;
            }

            .dropdown-content {
                display: none;
                position: absolute;
                top: 100%;
                right: 0;
                background-color: white;
                min-width: 160px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                border-radius: 6px;
                border: 1px solid #e0e0e0;
                margin-top: 4px;
                z-index: 1000;
            }

            .dropdown.active .dropdown-content {
                display: block;
            }

            .year-header .chevron {
                transition: transform 0.2s ease;
            }

            .year-group.collapsed .year-header .chevron {
                transform: rotate(-180deg);
            }
        `;
        document.head.appendChild(style);
        console.log('Styles injected');
    }

    // Create the viewer HTML structure
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
                            <button class="direction-btn" title="Toggle group direction" data-direction="desc">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg>
                            </button>
                            <div class="dropdown-content">
                                <a href="#" data-group="year">Year</a>
                                <a href="#" data-group="none">None</a>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div id="publications-list"></div>
            </div>
        `;

        return container;
    }

    // Render a publication card
    function renderPublicationCard(pub) {
        return `
            <div class="publication-card">
                <h3 class="publication-title">${pub.title}</h3>
                <div class="publication-authors">${pub.authors}</div>
                <div class="publication-meta">
                    <div class="meta-left">
                        <span>${pub.journal}</span>
                        <span class="citation-count">${pub.citations} citations</span>
                    </div>
                    <div class="meta-right">
                        <button class="bibtex-toggle" onclick="toggleBibtex('${pub.id}')">
                            <span>BibTeX</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chevron-down"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                    </div>
                </div>
                <a href="${pub.url}" target="_blank" class="publication-link">View Publication</a>
                <div id="bibtex-${pub.id}" class="bibtex-section">
                    <div class="bibtex-content">${escapeHtml(pub.bibtex)}</div>
                </div>
            </div>
        `;
    }

    // Helper function to escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Render publications
    function renderPublications() {
        const container = document.getElementById('publications-list');
        container.innerHTML = '';

        // Store collapsed state before re-rendering
        const collapsedYears = new Set();
        document.querySelectorAll('.year-group').forEach(group => {
            if (group.classList.contains('collapsed')) {
                collapsedYears.add(group.querySelector('.year-header').textContent.trim().split(' ')[0]);
            }
        });

        // Filter publications based on search
        let filteredPubs = publications.filter(pub => {
            const searchLower = searchTerm.toLowerCase();
            return pub.title.toLowerCase().includes(searchLower) ||
                   pub.authors.toLowerCase().includes(searchLower) ||
                   pub.journal.toLowerCase().includes(searchLower);
        });

        // Sort publications
        if (currentSort === 'time') {
            filteredPubs = [...filteredPubs];
            if (sortDirection === 'asc') {
                filteredPubs.reverse();
            }
        } else {
            filteredPubs.sort((a, b) => {
                let comparison = 0;
                switch (currentSort) {
                    case 'title':
                        comparison = a.title.localeCompare(b.title);
                        break;
                    case 'author':
                        comparison = a.authors.localeCompare(b.authors);
                        break;
                    case 'citations':
                        comparison = b.citations - a.citations;
                        break;
                }
                return sortDirection === 'asc' ? comparison * -1 : comparison;
            });
        }

        // Group publications if needed
        if (currentGroup === 'year') {
            const groupedPubs = {};
            filteredPubs.forEach(pub => {
                if (!groupedPubs[pub.year]) {
                    groupedPubs[pub.year] = [];
                }
                groupedPubs[pub.year].push(pub);
            });

            Object.keys(groupedPubs)
                .sort((a, b) => groupDirection === 'asc' ? a - b : b - a)
                .forEach(year => {
                    const yearGroup = document.createElement('div');
                    yearGroup.className = 'year-group';
                    if (collapsedYears.has(year)) {
                        yearGroup.classList.add('collapsed');
                    }
                    yearGroup.innerHTML = `
                        <div class="year-header" onclick="toggleGroup(this)">
                            <div>${year}</div>
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <span>${groupedPubs[year].length} publications</span>
                                <svg class="chevron" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>
                        </div>
                        <div class="publications-container">
                            ${groupedPubs[year].map(pub => renderPublicationCard(pub)).join('')}
                        </div>
                    `;
                    container.appendChild(yearGroup);
                });
        } else {
            filteredPubs.forEach(pub => {
                container.innerHTML += renderPublicationCard(pub);
            });
        }
    }

    // Toggle group collapse
    window.toggleGroup = function(header) {
        const group = header.parentElement;
        group.classList.toggle('collapsed');
    };

    // Toggle BibTeX visibility
    window.toggleBibtex = function(pubId) {
        const section = document.getElementById(`bibtex-${pubId}`);
        const button = section.parentElement.querySelector('.bibtex-toggle');
        const isVisible = section.style.display === 'block';
        section.style.display = isVisible ? 'none' : 'block';
        button.classList.toggle('active');
    };

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

    // Initialize the viewer
    async function init() {
        try {
            console.log('Starting initialization...');
            
            // Get base URL from script src
            const baseUrl = document.currentScript.src.split('/embed.js')[0];
            console.log('Base URL:', baseUrl);

            // Inject styles
            injectStyles();

            // Create and insert viewer
            const viewer = createViewerStructure();
            document.currentScript.parentNode.insertBefore(viewer, document.currentScript.nextSibling);
            
            // Load publications
            console.log('Fetching publications from:', baseUrl + '/publications');
            const response = await fetch(baseUrl + '/publications');
            
            if (!response.ok) {
                throw new Error(`Failed to load publications: ${response.status} ${response.statusText}`);
            }
            
            publications = await response.json();
            console.log('Publications loaded:', publications.length);

            // Initialize UI
            renderPublications();

            // Add event listeners for dropdowns
            document.querySelector('.sort-button').addEventListener('click', (e) => {
                e.preventDefault();
                const dropdown = e.target.closest('.dropdown');
                dropdown.classList.toggle('active');
                // Close other dropdown if open
                const otherDropdown = document.querySelector('.dropdown.active:not(:has(.sort-button))');
                if (otherDropdown) otherDropdown.classList.remove('active');
            });

            document.querySelector('.group-button').addEventListener('click', (e) => {
                e.preventDefault();
                const dropdown = e.target.closest('.dropdown');
                dropdown.classList.toggle('active');
                // Close other dropdown if open
                const otherDropdown = document.querySelector('.dropdown.active:not(:has(.group-button))');
                if (otherDropdown) otherDropdown.classList.remove('active');
            });

            // Close dropdowns when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.dropdown')) {
                    document.querySelectorAll('.dropdown.active').forEach(dropdown => {
                        dropdown.classList.remove('active');
                    });
                }
            });

            // Add event listeners for dropdown items
            document.querySelectorAll('.dropdown-content a').forEach(link => {
                link.addEventListener('click', e => {
                    e.preventDefault();
                    e.stopPropagation();
                    const dropdown = link.closest('.dropdown');
                    dropdown.classList.remove('active');
                    
                    if (link.dataset.sort) {
                        currentSort = link.dataset.sort;
                        updateButtonText('sort', currentSort);
                    } else if (link.dataset.group) {
                        currentGroup = link.dataset.group;
                        updateButtonText('group', currentGroup);
                    }
                    renderPublications();
                });
            });

            // Add event listeners for direction buttons
            document.querySelectorAll('.direction-btn').forEach(btn => {
                const isSort = btn.closest('.dropdown').querySelector('.sort-button');
                btn.addEventListener('click', () => {
                    if (isSort) {
                        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                        btn.setAttribute('data-direction', sortDirection);
                    } else {
                        groupDirection = groupDirection === 'asc' ? 'desc' : 'asc';
                        btn.setAttribute('data-direction', groupDirection);
                    }
                    renderPublications();
                });
            });

            const searchInput = document.getElementById('search');
            searchInput.addEventListener('input', e => {
                searchTerm = e.target.value;
                renderPublications();
            });

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