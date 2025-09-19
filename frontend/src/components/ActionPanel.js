import React from 'react';

export default function ActionPanel({ onClose }) {
  return (
    <div className="h-full bg-gray-50 p-4 sm:p-6 border-r border-gray-200 overflow-y-auto">
      {/* Mobile Header with Close Button */}
      <div className="flex items-center justify-between mb-4 lg:hidden">
        <h2 className="text-lg font-bold text-gray-800">Actions</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          aria-label="Close Actions Panel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Desktop Header */}
      <h2 className="hidden lg:block text-xl font-bold text-gray-800 mb-6">Actions</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Navigation</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <div><kbd className="px-2 py-1 bg-gray-200 rounded text-xs">↑</kbd> <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">↓</kbd> <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">←</kbd> <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">→</kbd> focus cells</div>
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Selection</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <div><kbd className="px-2 py-1 bg-gray-200 rounded text-xs">X</kbd> select cells</div>
            <div><kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Shift</kbd> + <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Arrow Keys</kbd> Bulk select cells</div>
            <div><kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl</kbd> + <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">A</kbd> select all cells</div>
            <div><kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Esc</kbd> clear selected cells</div>
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Quote Fetching</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <div><kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Space</kbd> fetch quote on focused or selected cells</div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">Note</h4>
        <p className="text-sm text-blue-700">
          If there are cells selected, focused cell will not fetch. Bulk fetch will be triggered on multiple selected cell. Each fetch is a random quote.
        </p>
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h4 className="font-semibold text-yellow-800 mb-2">Loading Stages</h4>
        <div className="text-sm text-yellow-700 space-y-1">
          <div>1. "Starting fetch..."</div>
          <div>2. "Logging in..."</div>
          <div>3. "Browsing to page #..."</div>
          <div>4. "Selecting random quote..."</div>
          <div>5. "Selected."</div>
        </div>
        <p className="text-xs text-yellow-600 mt-2">
          Each stage takes 1.2-2.4 seconds
        </p>
      </div>
    </div>
  );
}
