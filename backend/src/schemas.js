const { z } = require('zod');

// Quote schema for validation
const QuoteSchema = z.object({
  text: z.string().min(1, "Quote text is required"),
  author: z.string().min(1, "Author is required"),
  tags: z.array(z.string()).optional().default([]),
  sourceUrl: z.string().url("Valid source URL is required"),
  goodreadsUrl: z.string().url("Valid Goodreads URL is required").optional(),
  pageNumber: z.number().int().min(1).max(50),
  quoteIndex: z.number().int().min(0)
});

// Author schema
const AuthorSchema = z.object({
  name: z.string().min(1, "Author name is required"),
  aboutUrl: z.string().url("Valid about URL is required"),
  quotes: z.array(z.string()).optional() // Array of quote IDs
});

// Tag schema
const TagSchema = z.object({
  name: z.string().min(1, "Tag name is required"),
  quotes: z.array(z.string()).optional() // Array of quote IDs
});

// API Response schemas
const QuoteResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(QuoteSchema).optional(),
  error: z.string().optional(),
  count: z.number().int().optional()
});

const BulkQuoteRequestSchema = z.object({
  count: z.number().int().min(1).max(300, "Maximum 300 quotes per request")
});

// Scraping configuration schema
const ScrapingConfigSchema = z.object({
  maxPages: z.number().int().min(1).max(10).default(10),
  maxConcurrentTabs: z.number().int().min(1).max(20).default(10),
  timeout: z.number().int().min(1000).default(30000)
});

module.exports = {
  QuoteSchema,
  AuthorSchema,
  TagSchema,
  QuoteResponseSchema,
  BulkQuoteRequestSchema,
  ScrapingConfigSchema
};

