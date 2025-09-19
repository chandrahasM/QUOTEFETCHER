module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Puppeteer Configuration
  puppeteer: {
    headless: process.env.PUPPETEER_HEADLESS !== 'false',
    timeout: parseInt(process.env.PUPPETEER_TIMEOUT) || 30000,
    maxConcurrentTabs: parseInt(process.env.PUPPETEER_MAX_CONCURRENT_TABS) || 10,
    maxPages: parseInt(process.env.PUPPETEER_MAX_PAGES) || 10
  },
  
  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
  },
  
  // API Configuration
  api: {
    baseUrl: 'https://quotes.toscrape.com',
    endpoints: {
      random: '/api/quotes/random',
      all: '/api/quotes/all',
      bulk: '/api/quotes/bulk',
      stats: '/api/stats'
    }
  }
};

