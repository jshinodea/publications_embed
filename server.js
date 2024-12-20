const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { parseBibTeXContent } = require('./bibParser');

const app = express();
const PORT = process.env.PORT || 3000;

// Cache for publications data
let publicationsCache = null;
let lastCacheUpdate = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Enable CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Middleware to serve static files
app.use(express.static('public'));

// Helper function to get publications data
async function getPublications() {
    try {
        if (publicationsCache && lastCacheUpdate && (Date.now() - lastCacheUpdate < CACHE_DURATION)) {
            return publicationsCache;
        }

        const bibContent = await fs.readFile(path.join(__dirname, 'citations.bib'), 'utf-8');
        publicationsCache = await parseBibTeXContent(bibContent);
        lastCacheUpdate = Date.now();
        
        // Ensure all publications have required fields
        publicationsCache = publicationsCache.map(pub => ({
            id: pub.id || 'unknown',
            title: pub.title || 'Untitled',
            authors: pub.authors || 'Unknown Authors',
            year: pub.year || 'Unknown Year',
            journal: pub.journal || '',
            citations: pub.citations || 0,
            url: pub.url || '#',
            bibtex: pub.bibtex || '',
            timestamp: pub.timestamp || 0
        }));

        return publicationsCache;
    } catch (error) {
        console.error('Error loading publications:', error);
        return [];
    }
}

// API endpoint for paginated publications
app.get('/api/publications', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const sort = req.query.sort || 'time';
        const direction = req.query.direction || 'asc';
        const group = req.query.group || 'year';
        const search = req.query.search || '';

        const publications = await getPublications();
        if (!publications || publications.length === 0) {
            return res.json({
                data: [],
                pagination: {
                    page: 1,
                    limit,
                    totalItems: 0,
                    totalPages: 0
                }
            });
        }
        
        // Filter publications based on search
        let filtered = publications;
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = publications.filter(pub => 
                pub.title.toLowerCase().includes(searchLower) ||
                pub.authors.toLowerCase().includes(searchLower) ||
                (pub.journal && pub.journal.toLowerCase().includes(searchLower))
            );
        }

        // Sort publications
        filtered.sort((a, b) => {
            let comparison = 0;
            switch (sort) {
                case 'time':
                    comparison = (b.timestamp || 0) - (a.timestamp || 0);
                    break;
                case 'title':
                    comparison = (a.title || '').localeCompare(b.title || '');
                    break;
                case 'author':
                    comparison = (a.authors || '').localeCompare(b.authors || '');
                    break;
                case 'citations':
                    comparison = (b.citations || 0) - (a.citations || 0);
                    break;
            }
            return direction === 'asc' ? comparison : -comparison;
        });

        // Calculate pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / limit);

        // Get paginated results
        const paginatedResults = filtered.slice(startIndex, endIndex);

        // Group publications if needed
        let result = paginatedResults;
        if (group === 'year') {
            const grouped = {};
            paginatedResults.forEach(pub => {
                const year = pub.year || 'Unknown Year';
                if (!grouped[year]) {
                    grouped[year] = [];
                }
                grouped[year].push(pub);
            });

            // Convert grouped object to array and sort years
            result = Object.entries(grouped)
                .sort(([yearA], [yearB]) => {
                    if (yearA === 'Unknown Year') return 1;
                    if (yearB === 'Unknown Year') return -1;
                    return direction === 'asc' ? yearA - yearB : yearB - yearA;
                })
                .map(([year, pubs]) => ({
                    year,
                    publications: pubs
                }));
        }

        res.json({
            data: result,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages
            }
        });
    } catch (error) {
        console.error('Error fetching publications:', error);
        res.status(500).json({ error: 'Failed to fetch publications' });
    }
});

// SSR endpoint for initial HTML
app.get('/', async (req, res) => {
    try {
        const publications = await getPublications();
        const initialState = {
            publications: publications.slice(0, 20), // Initial batch
            sort: 'time',
            direction: 'desc',
            group: 'year',
            search: ''
        };

        // Read the template HTML
        const template = await fs.readFile(path.join(__dirname, 'public', 'index.html'), 'utf-8');
        
        // Generate initial HTML for publications
        const publicationsHtml = initialState.publications
            .map(pub => `
                <div class="publication-card">
                    <h3 class="publication-title">${pub.title}</h3>
                    <div class="publication-authors">${pub.authors}</div>
                    <div class="publication-meta">
                        <div class="meta-left">
                            <span>${pub.journal}</span>
                            <span class="citation-count">${pub.citations} citations</span>
                        </div>
                        <div class="meta-right">
                            <button class="bibtex-toggle" data-id="${pub.id}">
                                <span>BibTeX</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chevron-down"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </button>
                        </div>
                    </div>
                    <a href="${pub.url}" target="_blank" class="publication-link">View Publication</a>
                    <div id="bibtex-${pub.id}" class="bibtex-section">
                        <div class="bibtex-content">${pub.bibtex}</div>
                    </div>
                </div>
            `).join('');

        // Insert the publications HTML and initial state into the template
        const html = template
            .replace('<!-- SSR_CONTENT -->', publicationsHtml)
            .replace('__INITIAL_STATE__', JSON.stringify(initialState));

        res.send(html);
    } catch (error) {
        console.error('Error rendering page:', error);
        res.status(500).send('Server Error');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 