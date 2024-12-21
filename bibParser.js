const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

class BibParseError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'BibParseError';
    this.code = code;
  }
}

// Cache regex patterns
const FIELD_REGEX_CACHE = {};
const CITATIONS_REGEX = /Cited by (\d+|None)/;

function getFieldRegex(fieldName) {
  if (!FIELD_REGEX_CACHE[fieldName]) {
    FIELD_REGEX_CACHE[fieldName] = new RegExp(`${fieldName}\\s*=\\s*{([^}]*)}`, 'i');
  }
  return FIELD_REGEX_CACHE[fieldName];
}

function extractField(entry, fieldName) {
  const regex = getFieldRegex(fieldName);
  const match = entry.match(regex);
  return match ? match[1].trim() : null;
}

function parseCitations(note) {
  if (!note) return 0;
  const match = note.match(CITATIONS_REGEX);
  return match ? (match[1] === 'None' ? 0 : parseInt(match[1])) : 0;
}

// Cache month names mapping
const MONTH_NAMES = {
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

function extractDate(entry) {
  const year = extractField(entry, 'year');
  if (!year) return null;

  const month = extractField(entry, 'month');
  const monthNum = month ? MONTH_NAMES[month.toLowerCase()] : 0;
  return new Date(year, monthNum || 0, 1).getTime();
}

function parseBibTeXContent(content) {
  try {
    logger.info('Starting BibTeX parsing');
    
    // Split content more efficiently
    const entries = content.split('\n@').filter(entry => entry.trim());
    const publications = new Array(entries.length);
    let validCount = 0;
    
    // Assign time based on reverse order in file (newer entries first)
    const baseTime = Date.now();
    const timeIncrement = 1000; // 1 second increment between entries
    
    for (let i = 0; i < entries.length; i++) {
      try {
        const entry = entries[i];
        
        // Extract fields directly from BibTeX entry
        const title = extractField(entry, 'title') || 'Untitled';
        const authors = extractField(entry, 'author') || 'Unknown Authors';
        const year = extractField(entry, 'year') || 'Unknown Year';
        const journal = extractField(entry, 'journal') || '';
        const note = extractField(entry, 'note');
        const url = extractField(entry, 'url') || '#';
        const timestamp = extractDate(entry);
        
        publications[validCount++] = {
          id: uuidv4(),
          title,
          authors: authors.replace(/\s+/g, ' '),
          year,
          journal,
          citations: parseCitations(note),
          url,
          bibtex: (i === 0 ? '@' : '\n@') + entry.trim(),
          timestamp,
          // Add time property based on file order (newer entries first)
          time: baseTime - (i * timeIncrement)
        };
      } catch (err) {
        logger.error(`Error parsing entry ${i + 1}:`, err);
      }
    }
    
    // Trim array to actual size and sort by time (newer first)
    publications.length = validCount;
    publications.sort((a, b) => b.time - a.time);
    
    if (validCount === 0) {
      throw new BibParseError('No valid publications found in file', 'NO_VALID_PUBLICATIONS');
    }
    
    logger.info(`Successfully parsed ${validCount} publications`);
    return publications;
  } catch (error) {
    logger.error('Failed to parse BibTeX content:', error);
    throw new BibParseError('Failed to parse BibTeX content', 'PARSE_ERROR');
  }
}

module.exports = {
  parseBibTeXContent
};