import React, { useState } from 'react';
import { QuoteProvider } from './context/QuoteContext';
import { useKeyboard } from './hooks/useKeyboard';
import Grid from './components/Grid';
import ActionPanel from './components/ActionPanel';
import DetailsPanel from './components/DetailsPanel';

function AppContent() {
  // Initialize keyboard handlers
  useKeyboard();
  
  // State for mobile panel visibility
  const [isActionPanelOpen, setIsActionPanelOpen] = useState(false);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 truncate">
              Random Quote Fetcher
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            {/* Mobile Menu Buttons */}
            <button
              onClick={() => setIsActionPanelOpen(!isActionPanelOpen)}
              className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              aria-label="Toggle Actions Panel"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setIsDetailsPanelOpen(!isDetailsPanelOpen)}
              className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              aria-label="Toggle Details Panel"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
              <span>v0.1.0</span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)]">
        {/* Action Panel - Hidden on mobile, collapsible on tablet */}
        <div className={`
          ${isActionPanelOpen ? 'block' : 'hidden'} 
          lg:block lg:relative lg:translate-x-0
          fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
          w-80 lg:w-80 xl:w-96
          bg-gray-50 border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${isActionPanelOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <ActionPanel onClose={() => setIsActionPanelOpen(false)} />
        </div>
        
        {/* Grid - Main content area */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <Grid />
        </div>
        
        {/* Details Panel - Hidden on mobile, collapsible on tablet */}
        <div className={`
          ${isDetailsPanelOpen ? 'block' : 'hidden'} 
          lg:block lg:relative lg:translate-x-0
          fixed lg:static inset-y-0 right-0 z-50 lg:z-auto
          w-64 lg:w-64 xl:w-80
          bg-white border-l border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${isDetailsPanelOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
          <DetailsPanel onClose={() => setIsDetailsPanelOpen(false)} />
        </div>
      </div>
      
      {/* Mobile Overlay */}
      {(isActionPanelOpen || isDetailsPanelOpen) && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => {
            setIsActionPanelOpen(false);
            setIsDetailsPanelOpen(false);
          }}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <QuoteProvider>
      <AppContent />
    </QuoteProvider>
  );
}

export default App;
