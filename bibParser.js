const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

class BibParseError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'BibParseError';
    this.code = code;
  }
}

function extractField(entry, fieldName) {
  const regex = new RegExp(`${fieldName}\\s*=\\s*{([^}]*)}`, 'i');
  const match = entry.match(regex);
  return match ? match[1].trim() : null;
}

function parseCitations(note) {
  if (!note) return 0;
  const match = note.match(/Cited by (\d+|None)/);
  if (!match) return 0;
  return match[1] === 'None' ? 0 : parseInt(match[1]);
}

function extractDate(entry) {
  // Try to get month and day from the entry
  const month = extractField(entry, 'month');
  const day = extractField(entry, 'day');
  const year = extractField(entry, 'year');
  
  if (!year) return null;

  // Convert month name to number if present
  let monthNum = null;
  if (month) {
    const monthNames = {
      jan: 0, january: 0,
      feb: 1, february: 1,
      mar: 2, march: 2,
      apr: 3, april: 3,
      may: 4,
      jun: 5, june: 5,
      jul: 6, july: 6,
      aug: 7, august: 7,
      sep: 8, september: 8,
      oct: 9, october: 9,
      nov: 10, november: 10,
      dec: 11, december: 11
    };
    monthNum = monthNames[month.toLowerCase()];
  }

  // Create a date object
  const date = new Date(year, monthNum || 0, day || 1);
  return date.getTime(); // Return timestamp for easy sorting
}

function parseBibTeXContent(content) {
  try {
    logger.info('Starting BibTeX parsing');
    
    const entries = content.split('@').filter(entry => entry.trim());
    const publications = [];
    
    entries.forEach((entry, index) => {
      try {
        // Extract fields directly from BibTeX entry
        const title = extractField(entry, 'title') || 'Untitled';
        const authors = extractField(entry, 'author') || 'Unknown Authors';
        const year = extractField(entry, 'year') || 'Unknown Year';
        const journal = extractField(entry, 'journal') || 'Unknown Journal';
        const note = extractField(entry, 'note');
        const url = extractField(entry, 'url') || '#';
        
        // Get publication date
        const timestamp = extractDate(entry);
        
        // Store the raw BibTeX entry
        const rawBibtex = '@' + entry.trim();

        publications.push({
          id: uuidv4(),
          title: title,
          authors: authors.replace(/\s+/g, ' '), // Clean up extra whitespace
          year: year,
          journal: journal,
          citations: parseCitations(note),
          url: url,
          bibtex: rawBibtex,
          timestamp: timestamp // Add timestamp for sorting
        });
      } catch (error) {
        logger.warn(`Error parsing entry at index ${index}`, { error: error.message });
      }
    });
    
    // Sort publications by timestamp before returning
    publications.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    if (publications.length === 0) {
      throw new BibParseError('No valid publications found in file', 'NO_VALID_PUBLICATIONS');
    }
    
    logger.info(`Successfully parsed ${publications.length} publications`);
    return publications;
  } catch (error) {
    logger.error('BibTeX parsing failed', { error: error.message });
    throw error;
  }
}

module.exports = {
  parseBibTeXContent,
  BibParseError
};