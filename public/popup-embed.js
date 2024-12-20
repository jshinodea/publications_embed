(function() {
    // Get server URL based on environment
    const SERVER_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000'
        : 'https://publications-embed.onrender.com';

    // Cache configuration
    const CACHE_KEY = 'publications_cache';
    const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

    // Cache management functions
    function getCache() {
        try {
            const cache = localStorage.getItem(CACHE_KEY);
            if (!cache) return null;

            const { timestamp, data } = JSON.parse(cache);
            if (Date.now() - timestamp > CACHE_DURATION) {
                localStorage.removeItem(CACHE_KEY);
                return null;
            }

            return data;
        } catch (error) {
            console.warn('Error reading cache:', error);
            return null;
        }
    }

    function setCache(data) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                data
            }));
        } catch (error) {
            console.warn('Error setting cache:', error);
        }
    }

    // Create and inject styles for popup
    function injectStyles() {
        const styles = `
            /* Styles for the trigger elements */
            [data-publications-search] {
                display: inline-block;
                padding: 8px 16px;
                background-color: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 4px;
                color: #2c3e50;
                cursor: pointer;
                margin: 4px;
                transition: all 0.2s ease;
            }

            [data-publications-search]:hover {
                background-color: #e9ecef;
                border-color: #dee2e6;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            /* Research focus container */
            .research-focus {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                padding: 16px;
            }

            /* Popup styles */
            .publications-popup {
                position: fixed;
                background: white;
                border: 1px solid rgba(0, 0, 0, 0.1);
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
                width: 400px;
                max-height: 500px;
                overflow-y: auto;
                z-index: 1000;
                display: none;
                padding: 16px;
                scrollbar-width: thin;
                scrollbar-color: #CBD5E0 #F7FAFC;
            }

            /* Webkit scrollbar styles */
            .publications-popup::-webkit-scrollbar {
                width: 6px;
            }

            .publications-popup::-webkit-scrollbar-track {
                background: #F7FAFC;
                border-radius: 3px;
            }

            .publications-popup::-webkit-scrollbar-thumb {
                background-color: #CBD5E0;
                border-radius: 3px;
                border: 2px solid #F7FAFC;
            }

            .publications-popup .popup-publication {
                padding: 12px;
                margin: 0 -16px;
                transition: background-color 0.2s ease;
                cursor: pointer;
            }

            .publications-popup .popup-publication:hover {
                background-color: #F8FAFC;
            }

            .publications-popup .popup-title {
                font-size: 14px;
                font-weight: 500;
                color: #2D3748;
                margin-bottom: 4px;
                line-height: 1.4;
                transition: color 0.2s ease;
            }

            .publications-popup .popup-publication:hover .popup-title {
                color: #3182CE;
            }

            .publications-popup .popup-meta {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 12px;
                color: #718096;
            }

            .publications-popup .popup-authors {
                flex: 1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .publications-popup .popup-year {
                font-weight: 500;
                color: #4A5568;
                padding: 2px 6px;
                background: #EDF2F7;
                border-radius: 4px;
                font-size: 11px;
            }

            .publications-popup:empty {
                display: none;
            }

            .publications-popup-loading {
                text-align: center;
                padding: 20px;
                color: #718096;
                font-size: 14px;
            }

            .publications-popup-header {
                margin: -16px -16px 12px -16px;
                padding: 12px 16px;
                background: #F8FAFC;
                border-bottom: 1px solid #E2E8F0;
                border-radius: 12px 12px 0 0;
                font-size: 13px;
                font-weight: 500;
                color: #4A5568;
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    // Render a compact publication card for popup
    function renderPopupPublication(pub) {
        // Ensure we have valid data or fallbacks
        const title = pub.title || 'Untitled';
        const authors = pub.authors || 'Unknown Authors';
        const year = pub.year || '';
        const url = pub.url && pub.url !== '#' ? pub.url : null;

        if (!url) return ''; // Skip publications without URLs

        return `
            <div class="popup-publication" onclick="window.open('${url}', '_blank')">
                <div class="popup-title">${title}</div>
                <div class="popup-meta">
                    <div class="popup-authors">${authors}</div>
                    <div class="popup-year">${year}</div>
                </div>
            </div>
        `;
    }

    // Create popup container
    function createPopup() {
        const popup = document.createElement('div');
        popup.className = 'publications-popup';
        document.body.appendChild(popup);
        return popup;
    }

    // Position popup next to trigger element
    function positionPopup(popup, trigger) {
        const triggerRect = trigger.getBoundingClientRect();
        const popupRect = popup.getBoundingClientRect();
        
        // Default position to the right
        let left = triggerRect.right + 10;
        let top = triggerRect.top;

        // Check if popup would go off screen to the right
        if (left + popupRect.width > window.innerWidth) {
            // Position to the left instead
            left = triggerRect.left - popupRect.width - 10;
        }

        // Adjust vertical position if needed
        if (top + popupRect.height > window.innerHeight) {
            top = window.innerHeight - popupRect.height - 10;
        }

        popup.style.left = `${left}px`;
        popup.style.top = `${top}px`;
    }

    // Filter and sort publications client-side
    function filterPublications(publications, searchTerm) {
        const searchTerms = searchTerm.toLowerCase().split(/\s+/);
        return publications
            .filter(pub => {
                const titleLower = (pub.title || '').toLowerCase();
                const authorsLower = (pub.authors || '').toLowerCase();
                const journalLower = (pub.journal || '').toLowerCase();
                
                return searchTerms.every(term =>
                    titleLower.includes(term) ||
                    authorsLower.includes(term) ||
                    journalLower.includes(term)
                );
            })
            .sort((a, b) => (b.citations || 0) - (a.citations || 0))
            .slice(0, 50);
    }

    // Fetch and display publications for popup
    async function fetchPopupPublications(searchTerm, popup) {
        popup.innerHTML = '<div class="publications-popup-loading">Loading publications...</div>';
        
        try {
            // Try to get from cache first
            let publications = getCache();

            if (!publications) {
                // First fetch minimal data quickly
                const minimalParams = new URLSearchParams({
                    limit: 1000,
                    mode: 'minimal'
                });
                
                const minimalResponse = await fetch(`${SERVER_URL}/api/publications?${minimalParams}`);
                const minimalResult = await minimalResponse.json();
                
                if (minimalResult.data && minimalResult.data.length > 0) {
                    // Show minimal results immediately
                    const filtered = filterPublications(minimalResult.data, searchTerm);
                    showMinimalResults(filtered, popup);
                    
                    // Then fetch full data in the background
                    const fullParams = new URLSearchParams({
                        limit: 1000,
                        mode: 'full'
                    });
                    
                    const fullResponse = await fetch(`${SERVER_URL}/api/publications?${fullParams}`);
                    const fullResult = await fullResponse.json();
                    publications = fullResult.data;
                    
                    // Store in cache
                    if (publications && publications.length > 0) {
                        setCache(publications);
                    }
                    
                    // Update display with full data
                    const fullFiltered = filterPublications(publications, searchTerm);
                    showFullResults(fullFiltered, popup);
                } else {
                    popup.innerHTML = '<div class="publications-popup-loading">No publications found</div>';
                    return;
                }
            } else {
                // Use cached data
                const filtered = filterPublications(publications, searchTerm);
                showFullResults(filtered, popup);
            }
        } catch (error) {
            console.error('Error fetching publications:', error);
            popup.innerHTML = '<div class="publications-popup-loading">Error loading publications</div>';
        }
    }

    // Show minimal results while loading
    function showMinimalResults(publications, popup) {
        if (publications.length === 0) {
            popup.innerHTML = '<div class="publications-popup-loading">No matching publications found</div>';
            return;
        }

        const publicationsHtml = publications
            .filter(pub => pub.url && pub.url !== '#')
            .map(pub => `
                <div class="popup-publication" onclick="window.open('${pub.url}', '_blank')">
                    <div class="popup-title">${pub.title}</div>
                    <div class="popup-meta">
                        <div class="popup-year">${pub.year}</div>
                    </div>
                </div>
            `)
            .join('');

        popup.innerHTML = `
            <div class="publications-popup-header">
                Found ${publications.length} related publications
            </div>
            ${publicationsHtml}
        `;
    }

    // Show full results once loaded
    function showFullResults(publications, popup) {
        if (publications.length === 0) {
            popup.innerHTML = '<div class="publications-popup-loading">No matching publications found</div>';
            return;
        }

        const publicationsHtml = publications
            .filter(pub => pub.url && pub.url !== '#')
            .map(pub => renderPopupPublication(pub))
            .join('');

        popup.innerHTML = `
            <div class="publications-popup-header">
                Found ${publications.length} related publications
            </div>
            ${publicationsHtml}
        `;
    }

    // Initialize popup functionality
    function init() {
        // Inject styles
        injectStyles();

        // Create popup container
        const popup = createPopup();

        // Find all elements with data-publications-search attribute
        document.querySelectorAll('[data-publications-search]').forEach(element => {
            let timeout;

            element.addEventListener('mouseenter', () => {
                const searchTerm = element.getAttribute('data-publications-search');
                if (!searchTerm) return;

                // Show popup after a small delay
                timeout = setTimeout(() => {
                    popup.style.display = 'block';
                    positionPopup(popup, element);
                    fetchPopupPublications(searchTerm, popup);
                }, 300);
            });

            element.addEventListener('mouseleave', () => {
                clearTimeout(timeout);
                // Hide popup after a delay (in case user moves to popup)
                setTimeout(() => {
                    if (!popup.matches(':hover')) {
                        popup.style.display = 'none';
                    }
                }, 100);
            });
        });

        // Hide popup when moving out of it
        popup.addEventListener('mouseleave', () => {
            popup.style.display = 'none';
        });
    }

    // Start initialization
    init();
})(); 