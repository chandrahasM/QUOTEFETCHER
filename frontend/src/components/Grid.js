import React from 'react';
import { useQuote, ACTIONS } from '../context/QuoteContext';
import { getCellId, truncateQuote } from '../utils/gridUtils';
import { GRID_CONFIG } from '../utils/gridUtils';

function Cell({ row, col }) {
  const { state, dispatch } = useQuote();
  const cellId = getCellId(row, col);
  const quote = state.quotes[cellId];
  const isFocused = state.focusedCell === cellId;
  const isSelected = state.selectedCells.includes(cellId);
  const isLoading = state.loadingCells.has(cellId);
  
  // Handle click to set active quote for details panel
  const handleClick = () => {
    if (quote) {
      // Always set the active quote when a cell with a quote is clicked
      dispatch({ type: ACTIONS.SET_ACTIVE_QUOTE, payload: quote });
      
      // Also set the focused cell
      dispatch({ type: ACTIONS.SET_FOCUSED_CELL, payload: cellId });
    }
  };
  
  // Determine cell content
  let cellContent = '';
  if (isLoading) {
    cellContent = quote && quote.isLoading ? quote.text : 'Loading...';
  } else if (quote && !quote.isLoading) {
    cellContent = truncateQuote(quote.text);
  } else {
    cellContent = 'Empty';
  }
  
  // Determine cell styling
  let cellClasses = 'border border-gray-300 p-2 sm:p-4 text-center text-xs sm:text-sm transition-all duration-200 min-h-[60px] sm:min-h-[80px] flex items-center justify-center ';
  
  if (isSelected || (quote && !quote.isLoading)) {
    cellClasses += 'bg-black text-white ';
  } else if (isLoading) {
    cellClasses += 'bg-yellow-100 text-yellow-800 ';
  } else {
    cellClasses += 'bg-white text-gray-700 ';
  }
  
  // Show focus with black ring instead of blue
  if (isFocused && !isSelected && !quote) {
    cellClasses += 'ring-2 ring-black ring-offset-2 ';
  }
  
  if (isLoading) {
    cellClasses += 'animate-pulse ';
  }
  
  return (
    <div className={cellClasses} onClick={handleClick}>
      <div className="w-full h-full flex items-center justify-center">
        <div className={quote && !quote.isLoading ? "italic" : ""}>{cellContent}</div>
      </div>
    </div>
  );
}

export default function Grid() {
  const { state } = useQuote();
  
  return (
    <div className="h-full flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 sm:p-6 pb-4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Random Quote Fetcher</h2>
        <p className="text-xs sm:text-sm text-gray-600">
          Grid: {state.rows} rows × {state.cols} columns ({state.rows * state.cols} cells total)
        </p>
        
        {/* Batch progress for bulk operations */}
        {state.batchProgress && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span className="font-semibold text-sm">Batch progress: </span>
                <span className="text-sm">{state.batchProgress.current} of {state.batchProgress.total} batches</span>
              </div>
              <div className="w-full sm:w-1/2 bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${(state.batchProgress.current / state.batchProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Scrollable Grid */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 pt-0">
        <div 
          className="grid gap-2 sm:gap-4"
          style={{
            gridTemplateColumns: `repeat(${state.cols}, minmax(120px, 1fr))`,
            gridTemplateRows: `repeat(${state.rows}, minmax(60px, auto))`
          }}
        >
          {Array.from({ length: state.rows }, (_, row) =>
            Array.from({ length: state.cols }, (_, col) => (
              <Cell key={getCellId(row, col)} row={row} col={col} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
