(function() {
    // Get server URL based on environment
    const SERVER_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000'
        : 'https://publications-embed.onrender.com';

    // Create and inject styles
    function injectStyles() {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `${SERVER_URL}/popup-styles.css`;
        document.head.appendChild(link);
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
            // Fetch publications with server-side search
            const params = new URLSearchParams({
                search: searchTerm,
                limit: 50,
                sort: 'time', // Default to time-based sorting
                direction: 'desc', // Default to newest first
                group: 'none'  // Ensure we get a flat list of publications
            });
            
            const response = await fetch(`${SERVER_URL}/api/publications?${params}`);
            const result = await response.json();
            
            if (!result.data || result.data.length === 0) {
                popup.innerHTML = '<div class="publications-popup-loading">No matching publications found</div>';
                return;
            }

            // Generate HTML for each publication
            const publicationsHtml = result.data.map(pub => `
                <div class="popup-publication" onclick="window.open('${pub.url}', '_blank')">
                    <div class="popup-title">${pub.title}</div>
                    <div class="popup-meta">
                        <div class="popup-authors">${pub.authors}</div>
                        <div class="popup-year">${pub.year}</div>
                    </div>
                </div>
            `).join('');

            // Update popup content
            popup.innerHTML = `
                <div class="publications-popup-header">
                    Found ${result.data.length} related publications
                </div>
                ${publicationsHtml}
            `;
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