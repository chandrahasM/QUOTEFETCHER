// Grid utility functions

export const GRID_CONFIG = {
  ROWS: 100, // 100 rows × 3 columns = 300 cells
  COLS: 3,
};

// Generate cell ID from row and column
export function getCellId(row, col) {
  return `${row}-${col}`;
}

// Parse cell ID to get row and column
export function parseCellId(cellId) {
  const [row, col] = cellId.split('-').map(Number);
  return { row, col };
}

// Check if cell coordinates are valid
export function isValidCell(row, col) {
  return row >= 0 && row < GRID_CONFIG.ROWS && col >= 0 && col < GRID_CONFIG.COLS;
}

// Get adjacent cell in a direction
export function getAdjacentCell(row, col, direction) {
  const directions = {
    up: { row: row - 1, col },
    down: { row: row + 1, col },
    left: { row, col: col - 1 },
    right: { row, col: col + 1 },
  };
  
  const newPos = directions[direction];
  return isValidCell(newPos.row, newPos.col) ? newPos : null;
}

// Get all cells in a path from start to end
export function getCellsInPath(startRow, startCol, endRow, endCol) {
  const cells = [];
  
  // First determine if we're moving horizontally or vertically
  // This ensures we only select cells in the exact path and avoid diagonal selections
  if (startRow === endRow) {
    // Horizontal movement
    const start = Math.min(startCol, endCol);
    const end = Math.max(startCol, endCol);
    
    for (let col = start; col <= end; col++) {
      cells.push(getCellId(startRow, col));
    }
  } else if (startCol === endCol) {
    // Vertical movement
    const start = Math.min(startRow, endRow);
    const end = Math.max(startRow, endRow);
    
    for (let row = start; row <= end; row++) {
      cells.push(getCellId(row, startCol));
    }
  } else {
    // For diagonal or complex paths, we need to be more careful
    // First add the start and end cells
    cells.push(getCellId(startRow, startCol));
    cells.push(getCellId(endRow, endCol));
    
    // Then determine the path based on the direction of movement
    // We'll prioritize row movement first, then column movement
    // This creates a clear L-shaped path rather than a diagonal
    
    // Move along rows first
    const rowDirection = startRow < endRow ? 1 : -1;
    for (let row = startRow + rowDirection; row !== endRow; row += rowDirection) {
      cells.push(getCellId(row, startCol));
    }
    
    // Then move along columns
    const colDirection = startCol < endCol ? 1 : -1;
    for (let col = startCol + colDirection; col !== endCol; col += colDirection) {
      cells.push(getCellId(endRow, col));
    }
  }
  
  return [...new Set(cells)]; // Remove any duplicates
}

// Get all cell IDs in the grid
export function getAllCellIds() {
  const cells = [];
  for (let row = 0; row < GRID_CONFIG.ROWS; row++) {
    for (let col = 0; col < GRID_CONFIG.COLS; col++) {
      cells.push(getCellId(row, col));
    }
  }
  return cells;
}

// Truncate quote text for display in cells
export function truncateQuote(quote, maxWords = 4) {
  if (!quote) return '';
  const words = quote.split(' ');
  if (words.length <= maxWords) return quote;
  return words.slice(0, maxWords).join(' ') + '...';
}

// Mock quote data for testing (will be replaced with real API calls)
export function generateMockQuote() {
  const mockQuotes = [
    {
      text: "There are only two ways to live your life. One is as though nothing is a miracle. The other is as though everything is a miracle.",
      author: "Albert Einstein",
      tags: ["inspirational", "life", "miracle"],
      sourceUrl: "https://example.com/quote1"
    },
    {
      text: "A day without sunshine is like, you know, night.",
      author: "Steve Martin",
      tags: ["humor", "obvious", "simile"],
      sourceUrl: "https://example.com/quote2"
    },
    {
      text: "It is better to be hated for what you are than to be loved for what you are not.",
      author: "André Gide",
      tags: ["life", "love"],
      sourceUrl: "https://example.com/quote3"
    },
    {
      text: "The world as we have created it is a process of our thinking. It cannot be changed without changing our thinking.",
      author: "Albert Einstein",
      tags: ["change", "deep-thoughts", "thinking", "world"],
      sourceUrl: "https://example.com/quote4"
    },
    {
      text: "It is our choices, Harry, that show what we truly are, far more than our abilities.",
      author: "J.K. Rowling",
      tags: ["abilities", "choices"],
      sourceUrl: "https://example.com/quote5"
    },
    {
      text: "I have not failed. I've just found 10,000 ways that won't work.",
      author: "Thomas A. Edison",
      tags: ["edison", "failure", "inspirational", "paraphrased"],
      sourceUrl: "https://example.com/quote6"
    },
    {
      text: "A woman is like a tea bag; you never know how strong it is until it's in hot water.",
      author: "Eleanor Roosevelt",
      tags: ["misattributed-eleanor-roosevelt"],
      sourceUrl: "https://example.com/quote7"
    }
  ];
  
  return mockQuotes[Math.floor(Math.random() * mockQuotes.length)];
}
