import React, { createContext, useContext, useReducer } from 'react';

// Initial state
const initialState = {
  // Grid configuration
  rows: 100, // 100 rows × 3 columns = 300 cells
  cols: 3,
  
  // Cell states
  cells: {},
  focusedCell: null,
  selectedCells: [],
  selectionStart: null,
  
  // Quote data
  quotes: {},
  
  // UI state
  isLoading: false,
  loadingCells: new Set(),
  batchProgress: null,
  
  // Details panel
  activeQuote: null,
  paginationInfo: null,
  remainingBatches: null,
};

// Action types
export const ACTIONS = {
  SET_FOCUSED_CELL: 'SET_FOCUSED_CELL',
  SET_SELECTED_CELLS: 'SET_SELECTED_CELLS',
  TOGGLE_CELL_SELECTION: 'TOGGLE_CELL_SELECTION',
  CLEAR_SELECTION: 'CLEAR_SELECTION',
  SELECT_ALL: 'SELECT_ALL',
  SET_QUOTE: 'SET_QUOTE',
  SET_LOADING: 'SET_LOADING',
  SET_LOADING_CELL: 'SET_LOADING_CELL',
  CLEAR_LOADING_CELL: 'CLEAR_LOADING_CELL',
  SET_ACTIVE_QUOTE: 'SET_ACTIVE_QUOTE',
  SET_SELECTION_START: 'SET_SELECTION_START',
  SET_BATCH_PROGRESS: 'SET_BATCH_PROGRESS',
  SET_PAGINATION_INFO: 'SET_PAGINATION_INFO',
  SET_REMAINING_BATCHES: 'SET_REMAINING_BATCHES'
};

// Reducer function
function quoteReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_FOCUSED_CELL:
      return {
        ...state,
        focusedCell: action.payload,
        activeQuote: action.payload ? state.quotes[action.payload] || null : null,
      };
      
    case ACTIONS.SET_SELECTED_CELLS:
      return {
        ...state,
        selectedCells: [...action.payload],
      };
      
    case ACTIONS.TOGGLE_CELL_SELECTION:
      const newSelectedCells = [...state.selectedCells];
      const index = newSelectedCells.indexOf(action.payload);
      if (index > -1) {
        newSelectedCells.splice(index, 1);
      } else {
        newSelectedCells.push(action.payload);
      }
      return {
        ...state,
        selectedCells: newSelectedCells,
      };
      
    case ACTIONS.CLEAR_SELECTION:
      return {
        ...state,
        selectedCells: [],
        selectionStart: null,
      };
      
    case ACTIONS.SELECT_ALL:
      const allCells = [];
      for (let row = 0; row < state.rows; row++) {
        for (let col = 0; col < state.cols; col++) {
          allCells.push(`${row}-${col}`);
        }
      }
      return {
        ...state,
        selectedCells: allCells,
      };
      
    case ACTIONS.SET_QUOTE:
      return {
        ...state,
        quotes: {
          ...state.quotes,
          [action.payload.cellId]: action.payload.quote,
        },
      };
      
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
      
    case ACTIONS.SET_LOADING_CELL:
      const newLoadingCells = new Set(state.loadingCells);
      newLoadingCells.add(action.payload);
      return {
        ...state,
        loadingCells: newLoadingCells,
      };
      
    case ACTIONS.CLEAR_LOADING_CELL:
      const clearedLoadingCells = new Set(state.loadingCells);
      clearedLoadingCells.delete(action.payload);
      return {
        ...state,
        loadingCells: clearedLoadingCells,
      };
      
    case ACTIONS.SET_ACTIVE_QUOTE:
      return {
        ...state,
        activeQuote: action.payload,
      };
      
    case ACTIONS.SET_SELECTION_START:
      return {
        ...state,
        selectionStart: action.payload,
      };
      
    case ACTIONS.SET_BATCH_PROGRESS:
      return {
        ...state,
        batchProgress: action.payload,
      };
      
    case ACTIONS.SET_PAGINATION_INFO:
      return {
        ...state,
        paginationInfo: action.payload,
      };
      
    case ACTIONS.SET_REMAINING_BATCHES:
      return {
        ...state,
        remainingBatches: action.payload,
      };
      
    default:
      return state;
  }
}

// Create context
const QuoteContext = createContext();

// Provider component
export function QuoteProvider({ children }) {
  const [state, dispatch] = useReducer(quoteReducer, initialState);
  
  return (
    <QuoteContext.Provider value={{ state, dispatch }}>
      {children}
    </QuoteContext.Provider>
  );
}

// Custom hook to use the context
export function useQuote() {
  const context = useContext(QuoteContext);
  if (!context) {
    throw new Error('useQuote must be used within a QuoteProvider');
  }
  return context;
}
