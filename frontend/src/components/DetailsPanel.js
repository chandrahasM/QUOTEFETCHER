import React from 'react';
import { useQuote } from '../context/QuoteContext';

export default function DetailsPanel({ onClose }) {
  const { state } = useQuote();
  const { activeQuote, focusedCell } = state;
  
  return (
    <div className="h-full bg-white border-l border-gray-200 p-4 sm:p-6 overflow-y-auto">
      {/* Mobile Header with Close Button */}
      <div className="flex items-center justify-between mb-4 lg:hidden">
        <h2 className="text-lg font-semibold text-gray-800">Details</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          aria-label="Close Details Panel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-800">Details</h2>
        {focusedCell !== null && activeQuote && (
          <svg
            className="w-4 h-4 text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        )}
      </div>

      {focusedCell !== null && activeQuote ? (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium text-gray-800 mb-2">Full Quote:</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{activeQuote.text}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-800 mb-1">Author:</h3>
            <p className="text-sm text-gray-600">{activeQuote.author}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-800 mb-1">Tags:</h3>
            <div className="flex flex-wrap gap-1">
              {activeQuote.tags && activeQuote.tags.length > 0 ? (
                activeQuote.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-500 italic">No tags available</span>
              )}
            </div>
          </div>
          {activeQuote.sourceUrl && (
            <div>
              <h3 className="text-sm font-medium text-gray-800 mb-1">Source URL:</h3>
              <a 
                href={activeQuote.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
              >
                {activeQuote.sourceUrl}
              </a>
            </div>
          )}
          
          {/* Goodreads Link - This will be scraped by Puppeteer */}
          {activeQuote.goodreadsUrl && (
            <div>
              <h3 className="text-sm font-medium text-gray-800 mb-1">Goodreads Page:</h3>
              <a 
                href={activeQuote.goodreadsUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-green-600 hover:text-green-800 underline"
              >
                View {activeQuote.author} on Goodreads
              </a>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">
          {focusedCell !== null ? "Cell is empty" : "Press X to select a cell, then Space to fetch a quote"}
        </p>
      )}
    </div>
  );
}

