# Technical Documentation - Random Quote Fetcher

## 📋 Table of Contents

1. [Application Overview](#application-overview)
2. [User Interface Screenshots](#user-interface-screenshots)
3. [Architecture](#architecture)

## 🎯 Application Overview

The Random Quote Fetcher is a modern web application that scrapes quotes from [quotes.toscrape.com](https://quotes.toscrape.com) using Puppeteer and displays them in an interactive grid interface. The application features real-time quote fetching, keyboard navigation, and a responsive design.

### Key Features
- **Interactive Grid Interface**: 100x3 grid (300 cells total) for displaying quotes
- **Real-time Web Scraping**: Uses Puppeteer to fetch quotes dynamically
- **Keyboard Navigation**: Full keyboard support for accessibility
- **Bulk Operations**: Select and fetch multiple quotes simultaneously
- **Responsive Design**: Mobile-friendly interface with collapsible panels
- **Loading States**: Visual feedback during quote fetching process

## 🖼️ User Interface Screenshots
<img width="941" height="424" alt="image" src="https://github.com/user-attachments/assets/6291185e-e4d8-4a56-bd67-b16738e531c7" />

<img width="940" height="447" alt="image" src="https://github.com/user-attachments/assets/b0880176-4b6c-4ad8-a873-ff78fc3c0100" />



## 🏗️ Architecture

### System Architecture Diagram

```mermaid
graph TB
    A[User Interface] --> B[React Frontend]
    B --> C[Express.js Backend]
    C --> D[Puppeteer Scraper]
    D --> E[quotes.toscrape.com]
    
    B --> F[React Query Cache]
    B --> G[Context State Management]
    
    C --> H[Swagger API Docs]
    C --> I[Zod Validation]
    
    D --> J[Browser Instance]
    D --> K[Page Cache]
```

### Component Structure

```
Frontend (React)
├── App.js
├── components/
│   ├── Grid.js              # Main grid component
│   ├── ActionPanel.js       # Left sidebar controls
│   └── DetailsPanel.js      # Right sidebar details
├── context/
│   └── QuoteContext.js      # Global state management
├── hooks/
│   └── useKeyboard.js       # Keyboard navigation
└── utils/
    └── gridUtils.js         # Grid utility functions

Backend (Express.js)
├── server.js                # Main server file
├── scraper.js               # Puppeteer scraping logic
├── schemas.js               # Zod validation schemas
└── config.js                # Configuration settings
```

