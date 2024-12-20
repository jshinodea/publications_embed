(function() {
    // Get server URL based on environment
    const SERVER_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000'
        : 'https://publications-embed.onrender.com';

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

            /* Existing popup styles */
            .publications-popup {
                position: fixed;
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                width: 400px;
                max-height: 500px;
                overflow-y: auto;
                z-index: 1000;
                display: none;
                padding: 16px;
            }

            .publications-popup .popup-publication {
                padding: 8px 0;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 12px;
            }

            .publications-popup .popup-publication:last-child {
                border-bottom: none;
            }

            .publications-popup .popup-title {
                font-size: 14px;
                color: #2c3e50;
                flex: 1;
            }

            .publications-popup .popup-link {
                color: #3498db;
                text-decoration: none;
                font-size: 12px;
                white-space: nowrap;
            }

            .publications-popup .popup-link:not(.disabled):hover {
                text-decoration: underline;
            }

            .publications-popup .popup-link.disabled {
                color: #999;
                cursor: not-allowed;
            }

            .publications-popup:empty {
                display: none;
            }

            .publications-popup-loading {
                text-align: center;
                padding: 20px;
                color: #666;
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
        const url = pub.url && pub.url !== '#' ? pub.url : null;

        return `
            <div class="popup-publication">
                <div class="popup-title">${title}</div>
                ${url ? 
                    `<a href="${url}" target="_blank" class="popup-link">View Publication →</a>` : 
                    `<span class="popup-link disabled">No URL Available</span>`
                }
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

    // Fetch and display publications for popup
    async function fetchPopupPublications(searchTerm, popup) {
        popup.innerHTML = '<div class="publications-popup-loading">Loading publications...</div>';
        
        try {
            const params = new URLSearchParams({
                search: searchTerm,
                limit: 50,
                sort: 'citations',
                direction: 'desc',
                group: 'none' // Ensure we get flat array of publications
            });

            const response = await fetch(`${SERVER_URL}/api/publications?${params}`);
            const result = await response.json();

            if (!result.data || result.data.length === 0) {
                popup.innerHTML = '<div class="publications-popup-loading">No publications found</div>';
                return;
            }

            // Use the publications array directly since we specified group: 'none'
            popup.innerHTML = result.data
                .map(pub => renderPopupPublication(pub))
                .join('');
        } catch (error) {
            console.error('Error fetching publications:', error);
            popup.innerHTML = '<div class="publications-popup-loading">Error loading publications</div>';
        }
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