# Publications Viewer with SSR

An embeddable publications viewer component with server-side rendering (SSR) and progressive loading capabilities. This component allows you to display and interact with publications from a BibTeX file, featuring search, sorting, grouping, and BibTeX export functionality.

## Features

- Server-side rendering for fast initial page load
- Progressive loading with "Load More" functionality
- Search publications by title, author, or journal
- Sort by date, title, author, or citation count
- Group publications by year
- Toggle BibTeX display for each publication
- Responsive design for all screen sizes

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd publications-embed-ssr
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Usage

1. Place your BibTeX file as `citations.bib` in the root directory.

2. The server will start on port 3000 (or the port specified in the `PORT` environment variable).

3. To embed the viewer in your webpage, add the following code:
```html
<div id="publications-viewer"></div>
<script src="http://localhost:3000/embed.js"></script>
```

## Configuration

The viewer can be configured through URL parameters:

- `sort`: Sort publications by (`time`, `title`, `author`, `citations`)
- `direction`: Sort direction (`asc`, `desc`)
- `group`: Group publications by (`year`, `none`)
- `search`: Initial search term
- `page`: Page number for pagination
- `limit`: Number of items per page

Example:
```
http://localhost:3000/?sort=citations&direction=desc&group=year
```

## API Endpoints

- `GET /api/publications`: Get paginated publications
  - Query parameters:
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 20)
    - `sort`: Sort field
    - `direction`: Sort direction
    - `group`: Grouping field
    - `search`: Search term

## Development

The project structure:

```
.
├── public/
│   ├── embed.js       # Client-side JavaScript
│   ├── styles.css     # Styles
│   └── index.html     # HTML template
├── server.js          # Express server
├── bibParser.js       # BibTeX parser
├── citations.bib      # Publications data
├── package.json       # Dependencies
└── README.md         # Documentation
```

## Performance Considerations

1. Server-side rendering provides fast initial page load
2. Progressive loading reduces initial payload
3. Client-side caching of loaded publications
4. Debounced search to reduce API calls
5. Efficient DOM updates with minimal re-renders

## Browser Support

The viewer supports all modern browsers:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License 