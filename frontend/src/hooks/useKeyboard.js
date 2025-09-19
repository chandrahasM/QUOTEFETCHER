import { useEffect, useCallback } from 'react';
import { useQuote, ACTIONS } from '../context/QuoteContext';
import { 
  getCellId, 
  parseCellId, 
  getAdjacentCell, 
  getCellsInPath,
  getAllCellIds,
  generateMockQuote 
} from '../utils/gridUtils';

// Configure the API URL - can be changed if backend port changes
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Helper function to handle API URL changes
const getApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

export function useKeyboard() {
  const { state, dispatch } = useQuote();
  
  // Fetch quote from backend API with loading stages
  const fetchQuote = useCallback(async (cellId) => {
    // Set initial loading state
    dispatch({ type: ACTIONS.SET_LOADING_CELL, payload: cellId });
    
    // Define loading stages with more descriptive messages
    const loadingStages = [
      "Starting fetch...",
      "Logging in...",
      `Browsing to page #${Math.floor(Math.random() * 10) + 1}...`,
      "Selecting random quote...",
      "Selected."
    ];
    
    // Define stage durations (in ms) - vary them for more realistic feel
    const stageDurations = [1000, 1500, 2000, 1200, 800];
    
    // Create a function to update the cell with loading message
    const updateLoadingMessage = (cellId, message, stageIndex) => {
      console.log(`Cell ${cellId}: ${message}`);
      
      // Create a loading quote object with appropriate stage information
      const loadingQuote = { 
        text: message, 
        author: stageIndex < 4 ? "Loading..." : "Ready", 
        tags: ["loading", `stage-${stageIndex + 1}`],
        sourceUrl: "",
        isLoading: true,
        loadingStage: stageIndex,
        cellId: cellId
      };
      
      // Update the cell with the loading message
      dispatch({
        type: ACTIONS.SET_QUOTE,
        payload: { 
          cellId, 
          quote: loadingQuote
        }
      });
      
      // Also update the active quote if this is the focused cell
      if (state.focusedCell === cellId) {
        dispatch({
          type: ACTIONS.SET_ACTIVE_QUOTE,
          payload: loadingQuote
        });
      }
    };
    
    try {
      // Go through each loading stage with appropriate delays
      for (let i = 0; i < loadingStages.length - 1; i++) {
        // Update with current stage message
        updateLoadingMessage(cellId, loadingStages[i], i);
        
        // If this is the stage where we make the API call
        if (i === 2) { // During "Browsing to page" stage
          // Make the actual API request
          const response = await fetch(getApiUrl('/api/quotes/random'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ count: 1 })
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          // Parse the response while still showing the loading stage
          const data = await response.json();
          
          // Check if we have valid data
          if (!data.success || !data.data || data.data.length === 0) {
            throw new Error(data.error || 'Failed to fetch quote');
          }
          
          // Store the quote data for later use
          window.tempQuoteData = data.data[0];
        }
        
        // Wait for the specified duration for this stage
        await new Promise(resolve => setTimeout(resolve, stageDurations[i]));
      }
      
      // Show the final "Selected" stage
      updateLoadingMessage(cellId, loadingStages[loadingStages.length - 1], loadingStages.length - 1);
      
      // Short delay before showing the actual quote
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Get the quote data we stored earlier
      const quoteData = window.tempQuoteData;
      if (!quoteData) {
        throw new Error('Quote data not available');
      }
      
      // Create the final quote object with the cellId
      const quote = {
        ...quoteData,
        cellId: cellId
      };
      
      // Update the cell with the actual quote
      dispatch({ 
        type: ACTIONS.SET_QUOTE, 
        payload: { cellId, quote } 
      });
      
      // If this is the focused cell, update the active quote for details panel
      if (state.focusedCell === cellId) {
        dispatch({
          type: ACTIONS.SET_ACTIVE_QUOTE,
          payload: quote
        });
      }
      
      // Clean up the temporary data
      delete window.tempQuoteData;
      
    } catch (error) {
      console.error('Error fetching quote:', error);
      // Fallback to mock quote if API fails
      const quote = {
        ...generateMockQuote(),
        cellId: cellId  // Add cellId to the quote for reference
      };
      
      dispatch({ 
        type: ACTIONS.SET_QUOTE, 
        payload: { cellId, quote } 
      });
      
      // If this is the focused cell, update the active quote for details panel
      if (state.focusedCell === cellId) {
        dispatch({
          type: ACTIONS.SET_ACTIVE_QUOTE,
          payload: quote
        });
      }
    } finally {
      dispatch({ type: ACTIONS.CLEAR_LOADING_CELL, payload: cellId });
    }
  }, [dispatch, state.focusedCell]);
  
  // Handle arrow key navigation
  const handleArrowKey = useCallback((direction) => {
    if (!state.focusedCell) {
      // If no cell is focused, do nothing
      // Focus will only happen when X is pressed
      return;
    }
    
    const { row, col } = parseCellId(state.focusedCell);
    const newPos = getAdjacentCell(row, col, direction);
    
    if (newPos) {
      const newCellId = getCellId(newPos.row, newPos.col);
      dispatch({ type: ACTIONS.SET_FOCUSED_CELL, payload: newCellId });
      
      // Clear selection start when navigating normally
      dispatch({ type: ACTIONS.SET_SELECTION_START, payload: null });
    }
  }, [state.focusedCell, dispatch]);
  
  // Handle shift + arrow key for multi-selection
  const handleShiftArrowKey = useCallback((direction) => {
    if (!state.focusedCell) {
      // If no cell is focused, do nothing
      return;
    }
    
    const { row, col } = parseCellId(state.focusedCell);
    const newPos = getAdjacentCell(row, col, direction);
    
    if (newPos) {
      const newCellId = getCellId(newPos.row, newPos.col);
      
      // Update focused cell
      dispatch({ type: ACTIONS.SET_FOCUSED_CELL, payload: newCellId });
      
      // Only add the new cell to the existing selection
      // This ensures we only select previously selected cells and the new cell
      if (!state.selectedCells.includes(newCellId)) {
        const newSelectedCells = [...state.selectedCells, newCellId];
        dispatch({ type: ACTIONS.SET_SELECTED_CELLS, payload: newSelectedCells });
      }
    }
  }, [state.focusedCell, state.selectedCells, dispatch]);
  
  // Handle X key for toggling selection
  const handleToggleSelection = useCallback(() => {
    // If no cell is focused, focus the first cell
    if (!state.focusedCell) {
      const firstCellId = '0-0';
      dispatch({ type: ACTIONS.SET_FOCUSED_CELL, payload: firstCellId });
      dispatch({ type: ACTIONS.TOGGLE_CELL_SELECTION, payload: firstCellId });
    } else {
      dispatch({ type: ACTIONS.TOGGLE_CELL_SELECTION, payload: state.focusedCell });
    }
  }, [state.focusedCell, dispatch]);
  
  // Bulk fetch quotes for multiple cells
  const fetchBulkQuotes = useCallback(async (cellIds, onComplete = null) => {
    if (cellIds.length === 0) {
      if (onComplete) onComplete();
      return;
    }
    
    // Define loading stages with more descriptive messages
    const loadingStages = [
      "Starting fetch...",
      "Logging in...",
      `Browsing to page...`,
      "Selecting quotes...",
      "Selected."
    ];
    
    // Define stage durations (in ms) - vary them for more realistic feel
    const stageDurations = [1000, 1500, 2000, 1200, 800];
    
    // Create a function to update a cell with loading message
    const updateLoadingMessage = (cellId, message, stageIndex) => {
      // Create a loading quote object with appropriate stage information
      const loadingQuote = { 
        text: message, 
        author: stageIndex < 4 ? "Loading..." : "Ready", 
        tags: ["loading", `stage-${stageIndex + 1}`],
        sourceUrl: "",
        isLoading: true,
        loadingStage: stageIndex,
        cellId: cellId
      };
      
      // Update the cell with the loading message
      dispatch({
        type: ACTIONS.SET_QUOTE,
        payload: { 
          cellId, 
          quote: loadingQuote
        }
      });
    };
    
    // Set all cells to initial loading state
    cellIds.forEach(cellId => {
      dispatch({ type: ACTIONS.SET_LOADING_CELL, payload: cellId });
      updateLoadingMessage(cellId, loadingStages[0], 0);
    });
    
    try {
      // Go through each loading stage with appropriate delays
      for (let i = 1; i < loadingStages.length - 1; i++) {
        // Update all cells with current stage message
        cellIds.forEach(cellId => {
          // For browsing stage, add random page numbers for each cell
          const message = i === 2 ? 
            `Browsing to page #${Math.floor(Math.random() * 10) + 1}...` : 
            loadingStages[i];
            
          updateLoadingMessage(cellId, message, i);
        });
        
        // If this is the stage where we make the API call
        if (i === 2) { // During "Browsing to page" stage
          // Make the actual API request - use bulk endpoint for <= 100 records, paginated for > 100
          const endpoint = cellIds.length > 100 ? 
            getApiUrl(`/api/quotes/paginated?limit=${cellIds.length}`) : 
            getApiUrl('/api/quotes/bulk');
            
          const response = await fetch(endpoint, {
            method: endpoint.includes('paginated') ? 'GET' : 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: endpoint.includes('paginated') ? undefined : JSON.stringify({ count: cellIds.length })
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          // Parse the response while still showing the loading stage
          const data = await response.json();
          
          // Check if we have valid data
          if (!data.success || !data.data || data.data.length === 0) {
            throw new Error(data.error || 'Failed to fetch quotes');
          }
          
          // Store the quotes data for later use
          window.tempBulkQuotesData = data.data;
        }
        
        // Wait for the specified duration for this stage
        await new Promise(resolve => setTimeout(resolve, stageDurations[i]));
      }
      
      // Show the final "Selected" stage
      cellIds.forEach(cellId => {
        updateLoadingMessage(cellId, loadingStages[loadingStages.length - 1], loadingStages.length - 1);
      });
      
      // Short delay before showing the actual quotes
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Get the quotes data we stored earlier
      const quotesData = window.tempBulkQuotesData;
      if (!quotesData) {
        throw new Error('Quotes data not available');
      }
      
      // Assign quotes to cells - make sure we have enough quotes
      if (quotesData.length < cellIds.length) {
        console.warn(`Warning: Not enough quotes returned (${quotesData.length}) for all selected cells (${cellIds.length})`);
      }
      
      // Assign quotes to cells, ensuring each cell gets a quote
      cellIds.forEach((cellId, index) => {
        if (index < quotesData.length) {
          const quote = quotesData[index];
          const quoteWithCellId = {
            ...quote,
            cellId: cellId,
            isLoading: false // Ensure the quote is not in loading state
          };
          
          dispatch({ 
            type: ACTIONS.SET_QUOTE, 
            payload: { cellId, quote: quoteWithCellId } 
          });
          
          // Clear loading state for this cell
          dispatch({ type: ACTIONS.CLEAR_LOADING_CELL, payload: cellId });
        } else {
          console.warn(`No quote available for cell ${cellId} (index ${index})`);
          // Create a placeholder quote so the cell doesn't remain empty
          const placeholderQuote = {
            text: "No quote available",
            author: "Try refreshing",
            tags: ["error"],
            sourceUrl: "",
            cellId: cellId,
            isPlaceholder: true,
            isLoading: false
          };
          
          dispatch({ 
            type: ACTIONS.SET_QUOTE, 
            payload: { cellId, quote: placeholderQuote } 
          });
          
          // Clear loading state for this cell
          dispatch({ type: ACTIONS.CLEAR_LOADING_CELL, payload: cellId });
        }
      });
      
      // Clean up the temporary data
      delete window.tempBulkQuotesData;
      
    } catch (error) {
      console.error('Error fetching bulk quotes:', error);
      // Fallback to individual fetch for each cell
      cellIds.forEach(cellId => {
        fetchQuote(cellId);
      });
    } finally {
      // Call the completion callback if provided
      if (onComplete) onComplete();
    }
  }, [dispatch, fetchQuote]);

  // Helper function to debounce scroll events
  const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  };
  
  // Helper function to load a batch of cells using pagination API
  const loadBatchWithPagination = useCallback(async (cellIds, offset) => {
    console.log(`Loading batch of ${cellIds.length} cells with offset ${offset}`);
    
    try {
      // Make the pagination API request
      const response = await fetch(getApiUrl(`/api/quotes/paginated?offset=${offset}&limit=${cellIds.length}`), {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (!data.success || !data.data) {
            throw new Error(data.error || 'Failed to fetch quotes');
          }
          
          const quotesData = data.data;
      console.log(`Received ${quotesData.length} quotes for ${cellIds.length} cells`);
          
          // Assign quotes to cells, ensuring each cell gets a quote
      cellIds.forEach((cellId, index) => {
            if (index < quotesData.length) {
              const quote = quotesData[index];
              const quoteWithCellId = {
                ...quote,
                cellId: cellId,
                isLoading: false
              };
              
              dispatch({ 
                type: ACTIONS.SET_QUOTE, 
                payload: { cellId, quote: quoteWithCellId } 
              });
              
              // Clear loading state for this cell
              dispatch({ type: ACTIONS.CLEAR_LOADING_CELL, payload: cellId });
            } else {
              console.warn(`No quote available for cell ${cellId} (index ${index})`);
              // Create a placeholder quote
              const placeholderQuote = {
                text: "No quote available",
                author: "Try refreshing",
                tags: ["error"],
                sourceUrl: "",
                cellId: cellId,
                isPlaceholder: true,
                isLoading: false
              };
              
              dispatch({ 
                type: ACTIONS.SET_QUOTE, 
                payload: { cellId, quote: placeholderQuote } 
              });
              
              // Clear loading state for this cell
              dispatch({ type: ACTIONS.CLEAR_LOADING_CELL, payload: cellId });
            }
          });
          
          console.log('Batch loaded successfully');
        } catch (error) {
          console.error('Error loading batch:', error);
          
          // Create placeholder quotes for all cells in the batch
      cellIds.forEach(cellId => {
            const errorQuote = {
              text: "Error loading quote",
              author: "Please try again",
              tags: ["error"],
              sourceUrl: "",
              cellId: cellId,
              isError: true,
              isLoading: false
            };
            
            dispatch({ 
              type: ACTIONS.SET_QUOTE, 
              payload: { cellId, quote: errorQuote } 
            });
            
            // Clear loading state for this cell
            dispatch({ type: ACTIONS.CLEAR_LOADING_CELL, payload: cellId });
          });
    }
  }, [dispatch]);
  
  // Function to setup virtual scrolling for very large selections
  const setupVirtualScrolling = useCallback((cellIds, initialBatchSize) => {
    console.log(`Setting up virtual scrolling for ${cellIds.length} cells`);
    
    // Create a virtual scrolling manager
    window.virtualScroller = {
      allCells: cellIds,
      loadedCells: new Set(cellIds.slice(0, initialBatchSize)), // First 100 are already loaded
      batchSize: 100,
      viewportBuffer: 200, // Load 200 cells ahead of viewport
      isLoading: false,
      
      // Get cells that should be visible based on scroll position
      getVisibleCells: function() {
        // This would integrate with your grid component
        // For now, we'll load cells in order as user scrolls
        return this.allCells.filter(cellId => this.loadedCells.has(cellId));
      },
      
      // Load cells around the current viewport
      loadAroundViewport: async function() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        
        // Find the next batch of unloaded cells
        const unloadedCells = this.allCells.filter(cellId => !this.loadedCells.has(cellId));
        const nextBatch = unloadedCells.slice(0, this.batchSize);
        
        if (nextBatch.length === 0) {
          console.log('All cells loaded via virtual scrolling');
          this.isLoading = false;
          return;
        }
        
        const offset = this.allCells.length - unloadedCells.length;
        console.log(`Virtual scrolling: Loading batch of ${nextBatch.length} cells at offset ${offset}`);
        
        try {
          await loadBatchWithPagination(nextBatch, offset);
          
          // Mark these cells as loaded
          nextBatch.forEach(cellId => this.loadedCells.add(cellId));
          
          console.log(`Virtual scrolling: Loaded ${this.loadedCells.size}/${this.allCells.length} cells`);
        } catch (error) {
          console.error('Virtual scrolling error:', error);
        } finally {
          this.isLoading = false;
        }
      }
    };
    
    // Set up scroll listener for virtual scrolling
    const handleVirtualScroll = () => {
      if (window.virtualScroller && !window.virtualScroller.isLoading) {
        // Load more cells when user scrolls
        window.virtualScroller.loadAroundViewport();
      }
    };
    
    // Throttled scroll handler
    const throttledScroll = (() => {
      let timeout;
      return () => {
        clearTimeout(timeout);
        timeout = setTimeout(handleVirtualScroll, 500); // Check every 500ms
      };
    })();
    
    window.addEventListener('scroll', throttledScroll);
    
    // Load initial batches progressively
    const loadInitialBatches = async () => {
      // Load 3 more batches (300 more cells) immediately
      for (let i = 0; i < 3; i++) {
        await window.virtualScroller.loadAroundViewport();
        await new Promise(resolve => setTimeout(resolve, 200)); // Small delay between batches
      }
    };
    
    // Start loading initial batches
    loadInitialBatches();
    
    console.log('Virtual scrolling setup complete');
  }, [loadBatchWithPagination]);
  
  // Function to handle very large selections with pagination and scroll-based loading
  const fetchLargeBulkQuotes = useCallback(async (cellIds) => {
    console.log(`Fetching quotes for ${cellIds.length} cells with pagination`);
    
    // Initial batch size - always load exactly 100 records initially
    const initialBatchSize = Math.min(100, cellIds.length);
    console.log(`Loading initial ${initialBatchSize} cells (fixed at 100 or less)`);
    
    const initialCells = cellIds.slice(0, initialBatchSize);
    const remainingCells = cellIds.slice(initialBatchSize);
    
    // Store all cell IDs for reference
    window.allCellIds = cellIds;
    console.log(`Stored ${cellIds.length} total cell IDs, with ${remainingCells.length} remaining after initial load`);
    
    // Update UI to show loading state
    dispatch({ 
      type: ACTIONS.SET_LOADING, 
      payload: true
    });
    
    // Set up pagination info
    dispatch({
      type: ACTIONS.SET_PAGINATION_INFO,
      payload: {
        loaded: initialBatchSize,
        total: cellIds.length,
        isComplete: initialBatchSize === cellIds.length
      }
    });
    
    // Load initial batch immediately using pagination
    console.log(`Loading initial ${initialBatchSize} cells using pagination`);
    await loadBatchWithPagination(initialCells, 0);
    
    // If there are more cells, use smart loading strategy based on quantity
    if (remainingCells.length > 0) {
      console.log(`Starting smart loading of remaining ${remainingCells.length} cells`);
      
      if (remainingCells.length <= 500) {
        // Small numbers: Load immediately with delays
        const remainingBatches = [];
        for (let i = 0; i < remainingCells.length; i += 100) {
          const batch = remainingCells.slice(i, i + 100);
          remainingBatches.push(batch);
        }
        
        // Load each batch with a delay
        remainingBatches.forEach(async (batch, index) => {
          const delay = (index + 1) * 1000; // 1s, 2s, 3s, etc.
          setTimeout(async () => {
            const offset = initialBatchSize + (index * 100);
            console.log(`Loading batch ${index + 1} with offset ${offset}`);
            await loadBatchWithPagination(batch, offset);
          }, delay);
        });
      } else {
        // Large numbers: Use virtual scrolling approach
        console.log(`Large selection detected (${remainingCells.length} cells). Using virtual scrolling approach.`);
        setupVirtualScrolling(cellIds, initialBatchSize);
      }
    }
    
    // Update pagination info to show all cells will be loaded
    dispatch({
      type: ACTIONS.SET_PAGINATION_INFO,
      payload: {
        loaded: cellIds.length,
        total: cellIds.length,
        isComplete: true
      }
    });
    
    // Clear loading state
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    
    console.log(`All ${cellIds.length} cells will be loaded with immediate pagination`);
  }, [dispatch, fetchBulkQuotes, state.remainingBatches]);
  
  // Handle space key for fetching quotes
  const handleFetchQuote = useCallback(() => {
    const cellsToFetch = [];
    
    if (state.selectedCells.length > 0) {
      // Fetch quotes for all selected empty cells
      state.selectedCells.forEach(cellId => {
        if (!state.quotes[cellId] && !state.loadingCells.has(cellId)) {
          cellsToFetch.push(cellId);
        }
      });
      
      // Handle different selection sizes
      if (cellsToFetch.length === 0) {
        console.log('No empty cells to fetch quotes for');
      } else if (cellsToFetch.length === 1) {
        // Single cell - use random endpoint
        fetchQuote(cellsToFetch[0]);
      } else if (cellsToFetch.length <= 100) {
        // Multiple cells up to 100 - use bulk endpoint
        fetchBulkQuotes(cellsToFetch);
      } else {
        // 100+ cells - use pagination approach with lazy loading
        fetchLargeBulkQuotes(cellsToFetch);
      }
    } else if (state.focusedCell && !state.quotes[state.focusedCell] && !state.loadingCells.has(state.focusedCell)) {
      // Fetch quote for focused cell if empty
      fetchQuote(state.focusedCell);
    }
  }, [state.selectedCells, state.focusedCell, state.quotes, state.loadingCells, fetchQuote, fetchBulkQuotes, fetchLargeBulkQuotes]);
  
  // Handle escape key to clear selection
  const handleClearSelection = useCallback(() => {
    // Clear all selected cells
    dispatch({ type: ACTIONS.CLEAR_SELECTION });
    
    // Also clear any ongoing batch processes
    dispatch({ type: ACTIONS.SET_BATCH_PROGRESS, payload: null });
    
    // Make sure we're not in a loading state
    dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    
    console.log('Selection cleared');
  }, [dispatch]);
  
  // Handle Ctrl+A / Cmd+A to select all
  const handleSelectAll = useCallback(() => {
    const allCells = getAllCellIds();
    dispatch({ type: ACTIONS.SET_SELECTED_CELLS, payload: allCells });
  }, [dispatch]);
  
  // Main keyboard event handler
  const handleKeyDown = useCallback((event) => {
    // Prevent default behavior for our handled keys
    const handledKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'x', 'X', ' ', 'Escape'];
    
    if (handledKeys.includes(event.key)) {
      event.preventDefault();
    }
    
    switch (event.key) {
      case 'ArrowUp':
        if (event.shiftKey) {
          handleShiftArrowKey('up');
        } else {
          handleArrowKey('up');
        }
        break;
        
      case 'ArrowDown':
        if (event.shiftKey) {
          handleShiftArrowKey('down');
        } else {
          handleArrowKey('down');
        }
        break;
        
      case 'ArrowLeft':
        if (event.shiftKey) {
          handleShiftArrowKey('left');
        } else {
          handleArrowKey('left');
        }
        break;
        
      case 'ArrowRight':
        if (event.shiftKey) {
          handleShiftArrowKey('right');
        } else {
          handleArrowKey('right');
        }
        break;
        
      case 'x':
      case 'X':
        handleToggleSelection();
        break;
        
      case ' ':
        handleFetchQuote();
        break;
        
      case 'Escape':
        handleClearSelection();
        break;
        
      case 'a':
      case 'A':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          handleSelectAll();
        }
        break;
    }
  }, [
    handleArrowKey,
    handleShiftArrowKey,
    handleToggleSelection,
    handleFetchQuote,
    handleClearSelection,
    handleSelectAll
  ]);
  
  // Set up keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  // We don't want to auto-focus on mount anymore
  // Focus will happen when user interacts with the grid
  
  return {
    fetchQuote,
    handleKeyDown
  };
}
