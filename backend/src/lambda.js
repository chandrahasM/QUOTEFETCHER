const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const QuoteScraper = require('./scraper');
const { BulkQuoteRequestSchema, QuoteResponseSchema } = require('./schemas');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Quote Fetcher API',
      version: '1.0.0',
      description: 'API for fetching quotes using Puppeteer',
      contact: {
        name: 'API Support'
      }
    }
  },
  apis: ['./src/lambda.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://quotefetcher-frontend.onrender.com'
  ],
  credentials: true
}));
app.use(express.json());

// Initialize scraper instance
let scraper = null;

// Initialize scraper on cold start
async function initializeScraper() {
  if (!scraper) {
    try {
      console.log('🚀 Initializing quote scraper...');
      scraper = new QuoteScraper({
        maxPages: 10,
        maxConcurrentTabs: 5, // Reduced for Lambda
        timeout: 30000
      });
      await scraper.initialize();
      console.log('✅ Scraper initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize scraper:', error);
    }
  }
  return scraper;
}

// Add Swagger UI route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Health check endpoint
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check API health status
 *     description: Returns the health status of the API
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   example: 2023-01-01T00:00:00.000Z
 *                 scraperReady:
 *                   type: boolean
 *                   example: true
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    scraperReady: scraper !== null
  });
});

// Get random quotes endpoint
/**
 * @swagger
 * /api/quotes/random:
 *   post:
 *     summary: Get random quotes
 *     description: Fetches random quotes from quotes.toscrape.com
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               count:
 *                 type: integer
 *                 description: Number of quotes to fetch
 *                 minimum: 1
 *                 maximum: 100
 *                 default: 1
 *             example:
 *               count: 1
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       text:
 *                         type: string
 *                       author:
 *                         type: string
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                       sourceUrl:
 *                         type: string
 *                       pageNumber:
 *                         type: integer
 *                       quoteIndex:
 *                         type: integer
 *                 count:
 *                   type: integer
 *       500:
 *         description: Server error
 *       503:
 *         description: Scraper not initialized
 */
app.post('/api/quotes/random', async (req, res) => {
  try {
    const scraperInstance = await initializeScraper();
    
    if (!scraperInstance) {
      return res.status(503).json({
        success: false,
        error: 'Scraper not initialized'
      });
    }

    const { count = 1 } = BulkQuoteRequestSchema.parse(req.body);
    
    console.log(`🎲 Fetching ${count} random quotes...`);
    
    // Simulate loading stages for frontend
    const loadingStages = [
      "Starting fetch...",
      "Logging in...",
      `Browsing to page #${Math.floor(Math.random() * 10) + 1}...`,
      "Selecting random quote...",
      "Selected."
    ];

    // Add random delay between stages (1.2-2.4 seconds)
    for (let i = 0; i < loadingStages.length; i++) {
      const delay = Math.random() * 1200 + 1200;
      await new Promise(resolve => setTimeout(resolve, delay));
      console.log(`⏳ ${loadingStages[i]}`);
    }

    const quotes = await scraperInstance.fetchRandomQuotes(count);
    
    const response = QuoteResponseSchema.parse({
      success: true,
      data: quotes,
      count: quotes.length
    });

    res.json(response);

  } catch (error) {
    console.error('❌ Error fetching random quotes:', error);
    
    const response = QuoteResponseSchema.parse({
      success: false,
      error: error.message
    });

    res.status(500).json(response);
  }
});

// Get all quotes endpoint
/**
 * @swagger
 * /api/quotes/all:
 *   get:
 *     summary: Get all quotes
 *     description: Fetches all quotes from quotes.toscrape.com
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Quote'
 *                 count:
 *                   type: integer
 *       500:
 *         description: Server error
 *       503:
 *         description: Scraper not initialized
 */
app.get('/api/quotes/all', async (req, res) => {
  try {
    const scraperInstance = await initializeScraper();
    
    if (!scraperInstance) {
      return res.status(503).json({
        success: false,
        error: 'Scraper not initialized'
      });
    }

    console.log('🌐 Fetching all quotes...');
    const quotes = await scraperInstance.scrapeAllQuotes();
    
    const response = QuoteResponseSchema.parse({
      success: true,
      data: quotes,
      count: quotes.length
    });

    res.json(response);

  } catch (error) {
    console.error('❌ Error fetching all quotes:', error);
    
    const response = QuoteResponseSchema.parse({
      success: false,
      error: error.message
    });

    res.status(500).json(response);
  }
});

// Bulk fetch endpoint for multiple cells
/**
 * @swagger
 * /api/quotes/bulk:
 *   post:
 *     summary: Bulk fetch quotes
 *     description: Fetches multiple quotes in a single request
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               count:
 *                 type: integer
 *                 description: Number of quotes to fetch
 *                 minimum: 1
 *                 maximum: 100
 *             example:
 *               count: 10
 *     responses:
 *       200:
 *         description: Successful response
 *       500:
 *         description: Server error
 *       503:
 *         description: Scraper not initialized
 */
app.post('/api/quotes/bulk', async (req, res) => {
  try {
    const scraperInstance = await initializeScraper();
    
    if (!scraperInstance) {
      return res.status(503).json({
        success: false,
        error: 'Scraper not initialized'
      });
    }

    const { count } = BulkQuoteRequestSchema.parse(req.body);
    
    console.log(`📦 Bulk fetching ${count} quotes...`);
    
    // For bulk requests, use pagination to efficiently fetch quotes
    const quotes = await scraperInstance.fetchQuotesWithPagination(0, count);
    
    const response = QuoteResponseSchema.parse({
      success: true,
      data: quotes,
      count: quotes.length
    });

    res.json(response);

  } catch (error) {
    console.error('❌ Error in bulk fetch:', error);
    
    const response = QuoteResponseSchema.parse({
      success: false,
      error: error.message
    });

    res.status(500).json(response);
  }
});

// Paginated quotes endpoint for scroll-based loading
/**
 * @swagger
 * /api/quotes/paginated:
 *   get:
 *     summary: Get paginated quotes
 *     description: Fetches quotes with pagination support for infinite scrolling
 *     parameters:
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of quotes to skip
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *         description: Maximum number of quotes to return
 *     responses:
 *       200:
 *         description: Successful response
 *       500:
 *         description: Server error
 *       503:
 *         description: Scraper not initialized
 */
app.get('/api/quotes/paginated', async (req, res) => {
  try {
    const scraperInstance = await initializeScraper();
    
    if (!scraperInstance) {
      return res.status(503).json({
        success: false,
        error: 'Scraper not initialized'
      });
    }

    // Parse pagination parameters
    const offset = parseInt(req.query.offset) || 0;
    // Allow larger limits for initial loads but still cap it
    const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Increased cap to 100
    
    console.log(`📓 Fetching paginated quotes: offset=${offset}, limit=${limit}`);
    
    // Fetch quotes with pagination
    const quotes = await scraperInstance.fetchQuotesWithPagination(offset, limit);
    
    // Get total count for pagination info
    const totalQuotes = scraperInstance.pageMetadata?.estimatedTotalQuotes || 100;
    
    const response = {
      success: true,
      data: quotes,
      pagination: {
        offset,
        limit,
        total: totalQuotes,
        hasMore: offset + limit < totalQuotes
      }
    };

    res.json(response);

  } catch (error) {
    console.error('❌ Error in paginated fetch:', error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get scraper statistics
/**
 * @swagger
 * /api/stats:
 *   get:
 *     summary: Get scraper statistics
 *     description: Returns statistics about the scraper
 *     responses:
 *       200:
 *         description: Successful response
 *       500:
 *         description: Server error
 *       503:
 *         description: Scraper not initialized
 */
app.get('/api/stats', (req, res) => {
  try {
    if (!scraper) {
      return res.status(503).json({
        success: false,
        error: 'Scraper not initialized'
      });
    }

    const stats = scraper.getStats();
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('💥 Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Export the handler for Lambda
module.exports.handler = serverless(app);
