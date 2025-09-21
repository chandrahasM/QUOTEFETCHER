const { QuoteSchema, ScrapingConfigSchema } = require('./schemas');
require('dotenv').config();

// Dynamic imports for different environments
let puppeteer, chromium;

// Check if we're in Lambda environment
const isLambda = process.env.AWS_LAMBDA_FUNCTION_NAME;

if (isLambda) {
  // Lambda environment
  puppeteer = require('puppeteer-core');
  chromium = require('chrome-aws-lambda');
} else {
  // Local development environment
  puppeteer = require('puppeteer');
}

// Login credentials from environment variables
const QUOTES_USERNAME = process.env.QUOTES_USERNAME;
const QUOTES_PASSWORD = process.env.QUOTES_PASSWORD;
const QUOTES_LOGIN_URL = process.env.QUOTES_LOGIN_URL || 'https://quotes.toscrape.com/login';

class QuoteScraper {
  constructor(config = {}) {
    this.config = ScrapingConfigSchema.parse(config);
    this.browser = null;
    this.baseUrl = 'https://quotes.toscrape.com';
    this.pageCache = new Map(); // Cache quotes by page number
    this.pageMetadata = null; // Information about available pages
    this.quotesPerPage = 10; // Default quotes per page
    this.maxPages = 10; // Default max pages
    this.isInitialized = false;
  }

  async initialize() {
    console.log('🚀 Initializing Puppeteer browser...');
    
    if (isLambda) {
      // Lambda configuration
      console.log('🌐 Running in AWS Lambda environment');
      this.browser = await chromium.puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      });
      console.log('✅ Browser initialized for AWS Lambda');
    } else {
      // Local development configuration
      console.log('💻 Running in local development environment');
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
      console.log('✅ Browser initialized for local development');
    }
    
    // Try to login if credentials are provided
    if (QUOTES_USERNAME && QUOTES_PASSWORD) {
      await this.login();
    }
    
    // Fetch basic metadata about available pages (lightweight operation)
    await this.fetchPageMetadata();
    
    this.isInitialized = true;
  }
  
  async fetchPageMetadata() {
    console.log('📊 Fetching page metadata by clicking through all pages...');
    const page = await this.browser.newPage();
    
    try {
      let currentPage = 1;
      let hasNextPage = true;
      let totalPages = 1;
      let minQuotesPerPage = Infinity;
      let quotesPerPageCounts = [];
      
      // Start from page 1
      await page.goto(`${this.baseUrl}/page/${currentPage}/`, { 
        waitUntil: 'networkidle2',
        timeout: this.config.timeout 
      });
      
      // Get quotes per page from first page
      const firstPageQuotes = await page.evaluate(() => {
        return document.querySelectorAll('.quote').length;
      });
      
      quotesPerPageCounts.push(firstPageQuotes);
      minQuotesPerPage = Math.min(minQuotesPerPage, firstPageQuotes);
      
      console.log(`📄 Page ${currentPage}: Found ${firstPageQuotes} quotes`);
      
      // Iterate through pages until no "Next" button
      while (hasNextPage && currentPage < 20) { // Reduced limit for Lambda (was 50)
        // Check if there's a "Next" button
        const nextButton = await page.$('.pager .next a');
        
        if (nextButton) {
          // Click the next button with optimized navigation
          await Promise.all([
            nextButton.click(),
            page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }) // Faster navigation
          ]);
          
          currentPage++;
          totalPages = currentPage;
          
          // Count quotes on this page
          const quotesOnThisPage = await page.evaluate(() => {
            return document.querySelectorAll('.quote').length;
          });
          
          quotesPerPageCounts.push(quotesOnThisPage);
          minQuotesPerPage = Math.min(minQuotesPerPage, quotesOnThisPage);
          
          console.log(`📄 Page ${currentPage}: Found ${quotesOnThisPage} quotes`);
          
          // If this page has 0 quotes, we've gone too far
          if (quotesOnThisPage === 0) {
            totalPages = currentPage - 1;
            console.log(`⚠️ Page ${currentPage} has 0 quotes, stopping at page ${totalPages}`);
            break;
          }
          
          // Add small delay to prevent overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          hasNextPage = false;
          console.log(`✅ No more "Next" button found. Total pages: ${totalPages}`);
        }
      }
      
      // Calculate average quotes per page for estimation
      const avgQuotesPerPage = Math.round(quotesPerPageCounts.reduce((a, b) => a + b, 0) / quotesPerPageCounts.length);
      
      this.pageMetadata = {
        totalPages: Math.min(totalPages, this.maxPages),
        quotesPerPage: minQuotesPerPage, // Use minimum as limiting factor
        avgQuotesPerPage: avgQuotesPerPage, // Average for estimation
        estimatedTotalQuotes: minQuotesPerPage * Math.min(totalPages, this.maxPages),
        quotesPerPageCounts: quotesPerPageCounts // Debug info
      };
      
      console.log(`📊 Page analysis complete:`);
      console.log(`   - Total pages found: ${totalPages}`);
      console.log(`   - Quotes per page: ${quotesPerPageCounts.join(', ')}`);
      console.log(`   - Minimum quotes per page: ${minQuotesPerPage} (limiting factor)`);
      console.log(`   - Average quotes per page: ${avgQuotesPerPage}`);
      console.log(`   - Estimated total quotes: ${this.pageMetadata.estimatedTotalQuotes}`);
      
      return this.pageMetadata;
      
    } catch (error) {
      console.error('❌ Error fetching page metadata:', error);
      this.pageMetadata = { 
        totalPages: this.maxPages, 
        quotesPerPage: 10, 
        avgQuotesPerPage: 10,
        estimatedTotalQuotes: 100,
        quotesPerPageCounts: [10]
      };
      return this.pageMetadata;
    } finally {
      await page.close();
    }
  }
  
  async login() {
    console.log('🔑 Attempting to login...');
    const page = await this.browser.newPage();
    
    try {
      // Navigate to login page
      await page.goto(QUOTES_LOGIN_URL, { 
        waitUntil: 'networkidle2',
        timeout: this.config.timeout 
      });
      
      // Check if login form exists
      const loginFormExists = await page.$('form') !== null;
      if (!loginFormExists) {
        console.log('⚠️ No login form found on the page');
        return false;
      }
      
      // Fill in login form
      await page.type('input[name="username"]', QUOTES_USERNAME);
      await page.type('input[name="password"]', QUOTES_PASSWORD);
      
      // Submit form and wait for navigation
      await Promise.all([
        page.click('input[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2' })
      ]);
      
      // Check if login was successful
      const isLoggedIn = await page.evaluate(() => {
        // Check for elements that indicate successful login
        // This will depend on the website's structure
        return !document.querySelector('form input[name="username"]');
      });
      
      if (isLoggedIn) {
        console.log('✅ Login successful');
        this.isLoggedIn = true;
      } else {
        console.log('❌ Login failed');
        this.isLoggedIn = false;
      }
      
      return this.isLoggedIn;
      
    } catch (error) {
      console.error('❌ Error during login:', error.message);
      this.isLoggedIn = false;
      return false;
    } finally {
      await page.close();
    }
  }

  async fetchQuotesFromPage(pageNum) {
    // Check if we already have this page cached
    if (this.pageCache.has(pageNum)) {
      console.log(`💾 Using cached quotes for page ${pageNum}`);
      return this.pageCache.get(pageNum);
    }
    
    console.log(`📄 Fetching quotes from page ${pageNum}...`);
    const page = await this.browser.newPage();
    
    try {
      await page.goto(`${this.baseUrl}/page/${pageNum}/`, { 
        waitUntil: 'networkidle2',
        timeout: this.config.timeout 
      });
      
      // Wait for all quotes to load
      await page.waitForSelector('.quote', { timeout: 5000 });
      
      // Extract quotes from the page
      const quotes = await page.evaluate((pageNum) => {
        const quotes = document.querySelectorAll('.quote');
        const results = [];
        
        quotes.forEach((quote, index) => {
          const textElement = quote.querySelector('.text');
          const authorElement = quote.querySelector('.author');
          const authorLinkElement = quote.querySelector('.author + a');
          const tagsElement = quote.querySelector('.tags');
          
          if (textElement && authorElement) {
            const text = textElement.textContent.trim();
            const author = authorElement.textContent.trim();
            
            // Extract author page URL if available
            let authorPageUrl = null;
            if (authorLinkElement) {
              const href = authorLinkElement.getAttribute('href');
              if (href) {
                // Make sure we have the full URL
                authorPageUrl = href.startsWith('/') ? 
                  `https://quotes.toscrape.com${href}` : href;
              }
            }
            
            // Try to get direct Goodreads link if available
            let goodreadsUrl = null;
            // Look for the specific "Goodreads page" link
            const links = Array.from(quote.querySelectorAll('a'));
            const goodreadsPageLink = links.find(link => 
              link.textContent.trim() === 'Goodreads page' || 
              (link.href && link.href.includes('goodreads.com/author'))
            );
            
            if (goodreadsPageLink) {
              goodreadsUrl = goodreadsPageLink.href;
            }
            
            const tags = Array.from(tagsElement?.querySelectorAll('.tag') || [])
              .map(tag => tag.textContent.trim());
            
            // Create a unique identifier for this quote
            const quoteId = `${author.toLowerCase().replace(/\s+/g, '-')}-${text.substring(0, 20).toLowerCase().replace(/[^a-z0-9]/g, '-')}-${pageNum}-${index}`;
            
            results.push({
              id: quoteId,
              text: text,
              author: author,
              authorPageUrl: authorPageUrl,
              goodreadsUrl: goodreadsUrl,
              tags: tags,
              sourceUrl: `https://quotes.toscrape.com/page/${pageNum}/#${index}`,
              pageNumber: pageNum,
              quoteIndex: index
            });
          }
        });
        
        return results;
      }, pageNum);
      
      // Verify we got a reasonable number of quotes
      if (quotes.length === 0) {
        console.warn(`⚠️ Warning: No quotes found on page ${pageNum}. This may be an error.`);
      } else if (quotes.length < 10 && pageNum !== this.pageMetadata?.totalPages) {
        console.warn(`⚠️ Warning: Only ${quotes.length} quotes found on page ${pageNum}. Expected around 10.`);
      }
      
      // Cache the results
      this.pageCache.set(pageNum, quotes);
      console.log(`✅ Fetched ${quotes.length} quotes from page ${pageNum}`);
      
      return quotes;
      
    } catch (error) {
      console.error(`❌ Error fetching quotes from page ${pageNum}:`, error);
      return [];
    } finally {
      await page.close();
    }
  }

  async scrapeQuotesInParallel(urls = null) {
    console.log('🔍 Starting parallel quote scraping phase...');
    const quotesToScrape = urls || this.quoteUrls;
    
    if (quotesToScrape.length === 0) {
      throw new Error('No quotes to scrape');
    }

    const results = [];
    const concurrency = Math.min(this.config.maxConcurrentTabs, quotesToScrape.length);
    
    console.log(`⚡ Processing ${quotesToScrape.length} quotes with ${concurrency} concurrent tabs`);

    // Process quotes in batches
    for (let i = 0; i < quotesToScrape.length; i += concurrency) {
      const batch = quotesToScrape.slice(i, i + concurrency);
      console.log(`📦 Processing batch ${Math.floor(i / concurrency) + 1}/${Math.ceil(quotesToScrape.length / concurrency)}`);
      
      const batchPromises = batch.map(async (quoteData, index) => {
        const page = await this.browser.newPage();
        try {
          // First, try to use the Goodreads URL if it was already found during collection
          let goodreadsUrl = quoteData.goodreadsUrl;
          
          // If no Goodreads URL yet, try to extract it from the author page
          if (!goodreadsUrl && quoteData.authorPageUrl) {
            goodreadsUrl = await this.extractGoodreadsLink(quoteData.authorPageUrl);
          }
          
          // If still no Goodreads URL, visit the quote page directly to find it
          if (!goodreadsUrl) {
            const quoteUrl = `${this.baseUrl}/page/${quoteData.pageNumber}/`;
            console.log(`🔍 Visiting quote page to find Goodreads link: ${quoteUrl}`);
            
            await page.goto(quoteUrl, { waitUntil: 'networkidle2', timeout: this.config.timeout });
            
            // Find the specific quote on the page and extract the Goodreads link
            goodreadsUrl = await page.evaluate((quoteText) => {
              // Find the quote by its text
              const quotes = Array.from(document.querySelectorAll('.quote'));
              const targetQuote = quotes.find(q => {
                const text = q.querySelector('.text');
                return text && text.textContent.trim() === quoteText;
              });
              
              if (!targetQuote) return null;
              
              // Look for the Goodreads page link in this quote
              const links = Array.from(targetQuote.querySelectorAll('a'));
              const goodreadsLink = links.find(link => 
                link.textContent.trim() === 'Goodreads page' || 
                (link.href && link.href.includes('goodreads.com/author'))
              );
              
              return goodreadsLink ? goodreadsLink.href : null;
            }, quoteData.text);
          }
          
          // If still no Goodreads link found, generate a fallback search URL
          if (!goodreadsUrl) {
            goodreadsUrl = this.generateGoodreadsUrl(quoteData.text, quoteData.author);
          }
          
          // Since we already have the quote data from the listing page,
          // we can use it directly without needing to scrape individual pages
          const validatedQuote = QuoteSchema.parse({
            text: quoteData.text,
            author: quoteData.author,
            tags: quoteData.tags,
            sourceUrl: `${this.baseUrl}/page/${quoteData.pageNumber}/#${quoteData.quoteIndex}`,
            goodreadsUrl: goodreadsUrl,
            pageNumber: quoteData.pageNumber,
            quoteIndex: quoteData.quoteIndex
          });

          return validatedQuote;
        } catch (error) {
          console.error(`❌ Error validating quote ${quoteData.id}:`, error.message);
          return null;
        } finally {
          await page.close();
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(result => result !== null));
      
      // Small delay between batches to be respectful
      if (i + concurrency < quotesToScrape.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    this.scrapedQuotes = results;
    console.log(`✅ Successfully scraped ${results.length} quotes`);
    return results;
  }

  async fetchRandomQuotes(count = 10) {
    console.log(`🎲 Fetching ${count} random quotes...`);
    
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // For small counts (<=50), fetch from a subset of pages
    if (count <= 50) {
      return await this.fetchQuotesFromSubsetOfPages(count);
    } 
    // For larger counts, use pagination
    else {
      return await this.fetchQuotesWithPagination(0, count);
    }
  }
  
  async fetchQuotesFromSubsetOfPages(count) {
    // Determine how many pages we need
    const quotesPerPage = this.pageMetadata?.quotesPerPage || 10;
    const pagesNeeded = Math.min(
      Math.ceil(count / quotesPerPage),
      Math.ceil(this.pageMetadata?.totalPages / 2) // Use at most half the available pages
    );
    
    // Select random pages
    const totalPages = this.pageMetadata?.totalPages || 10;
    const pageNumbers = [];
    
    // Ensure we don't select the same page twice
    while (pageNumbers.length < pagesNeeded) {
      const randomPage = Math.floor(Math.random() * totalPages) + 1;
      if (!pageNumbers.includes(randomPage)) {
        pageNumbers.push(randomPage);
      }
    }
    
    console.log(`📑 Selected ${pagesNeeded} random pages: ${pageNumbers.join(', ')}`);
    
    // Fetch quotes from selected pages in parallel
    const fetchPromises = pageNumbers.map(pageNum => this.fetchQuotesFromPage(pageNum));
    const pageResults = await Promise.all(fetchPromises);
    
    // Flatten and shuffle the results
    let allQuotes = pageResults.flat();
    allQuotes = this.shuffleArray(allQuotes);
    
    // Return only the requested count
    return allQuotes.slice(0, count);
  }
  
  async fetchQuotesWithPagination(offset = 0, limit = 50) {
    console.log(`📃 Fetching quotes with pagination: offset=${offset}, limit=${limit}`);
    
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Use minimum quotes per page as the limiting factor
    const quotesPerPage = this.pageMetadata?.quotesPerPage || 10; // This is now the minimum
    const totalPages = this.pageMetadata?.totalPages || 10;
    const avgQuotesPerPage = this.pageMetadata?.avgQuotesPerPage || 10;
    
    console.log(`📊 Pagination info: minQuotesPerPage=${quotesPerPage}, avgQuotesPerPage=${avgQuotesPerPage}, totalPages=${totalPages}`);
    
    // Calculate which pages we need to fetch based on minimum quotes per page
    const startPage = Math.floor(offset / quotesPerPage) + 1;
    const endPage = Math.ceil((offset + limit) / quotesPerPage);
    const totalPagesToFetch = endPage - startPage + 1;
    
    console.log(`📑 Need to fetch pages ${startPage} to ${endPage} (${totalPagesToFetch} pages)`);
    console.log(`📑 Available pages: ${totalPages}, Will fetch: ${Math.min(endPage, totalPages)}`);
    
    // Fetch all needed pages in parallel
    const pagePromises = [];
    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      if (pageNum <= this.pageMetadata?.totalPages) {
        pagePromises.push(this.fetchQuotesFromPage(pageNum));
      }
    }
    
    const pageResults = await Promise.all(pagePromises);
    let allQuotes = pageResults.flat();
    
    // Calculate the exact slice we need from the fetched quotes
    const startIndex = offset % quotesPerPage;
    
    // Make sure we have enough quotes to satisfy the request
    if (allQuotes.length < startIndex + limit) {
      console.warn(`⚠️ Warning: Not enough quotes fetched. Requested ${limit} quotes starting at offset ${offset}, but only got ${allQuotes.length} quotes total.`);
      console.warn(`⚠️ This might be because we're using minimum quotes per page (${quotesPerPage}) as the limiting factor.`);
      
      // Try to fetch more pages if needed
      let additionalPage = endPage + 1;
      while (allQuotes.length < startIndex + limit && additionalPage <= this.pageMetadata?.totalPages) {
        console.log(`📄 Fetching additional page ${additionalPage} to satisfy request...`);
        const additionalQuotes = await this.fetchQuotesFromPage(additionalPage);
        allQuotes = allQuotes.concat(additionalQuotes);
        additionalPage++;
      }
    }
    
    // Get the exact slice we need
    const result = allQuotes.slice(startIndex, startIndex + limit);
    
    // Verify we got the requested number of quotes
    if (result.length < limit) {
      console.warn(`⚠️ Could only return ${result.length}/${limit} requested quotes. This may be all that's available.`);
      console.warn(`⚠️ Consider using avgQuotesPerPage (${avgQuotesPerPage}) instead of minQuotesPerPage (${quotesPerPage}) for better estimates.`);
    } else {
      console.log(`✅ Successfully returning ${result.length} quotes as requested`);
    }
    
    return result;
  }
  
  // Helper method to shuffle an array
  shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('🔒 Browser closed');
    }
  }

  // Generate a Goodreads search URL for a quote
  generateGoodreadsUrl(text, author) {
    // Extract a short snippet from the quote (first 50 chars)
    const quoteSnippet = text.substring(0, 50).trim();
    
    // Encode the search parameters
    const searchParams = encodeURIComponent(`${quoteSnippet} ${author}`);
    
    // Return the Goodreads search URL
    return `https://www.goodreads.com/quotes/search?q=${searchParams}`;
  }
  
  // Extract Goodreads link from author page
  async extractGoodreadsLink(authorUrl) {
    if (!authorUrl) return null;
    
    console.log(`🔍 Extracting Goodreads link from ${authorUrl}`);
    const page = await this.browser.newPage();
    
    try {
      await page.goto(authorUrl, { 
        waitUntil: 'networkidle2',
        timeout: this.config.timeout 
      });
      
      // Use Puppeteer's more advanced capabilities to extract the correct link
      const goodreadsUrl = await page.evaluate(async () => {
        // Helper function to get href from an element
        const getHref = (element) => element ? element.href : null;
        
        // First, try to find the exact "Goodreads page" link text
        const goodreadsPageLinks = Array.from(document.querySelectorAll('a'));
        for (const link of goodreadsPageLinks) {
          if (link.textContent.trim() === 'Goodreads page') {
            console.log('Found exact Goodreads page link');
            return link.href;
          }
        }
        
        // Next, look for links with href containing goodreads.com/author
        const goodreadsAuthorLinks = Array.from(document.querySelectorAll('a[href*="goodreads.com/author"]'));
        if (goodreadsAuthorLinks.length > 0) {
          console.log('Found Goodreads author link');
          return goodreadsAuthorLinks[0].href;
        }
        
        // Try to find links that contain both "goodreads" and "author" in the URL
        const allLinks = Array.from(document.querySelectorAll('a[href*="goodreads.com"]'));
        const authorLink = allLinks.find(link => link.href.includes('/author/'));
        if (authorLink) {
          console.log('Found author link in Goodreads URL');
          return authorLink.href;
        }
        
        // If still not found, look for any Goodreads links
        if (allLinks.length > 0) {
          console.log('Found generic Goodreads link');
          return allLinks[0].href;
        }
        
        // Last resort: look for any link with "goodreads" text
        const textLinks = Array.from(document.querySelectorAll('a'));
        const goodreadsTextLink = textLinks.find(link => 
          link.textContent.toLowerCase().includes('goodreads')
        );
        
        return goodreadsTextLink ? goodreadsTextLink.href : null;
      });
      
      // If we found a URL but it's not a proper author URL, try to convert it
      if (goodreadsUrl) {
        // If it's a generic goodreads.com URL without /author/, try to extract author name
        if (!goodreadsUrl.includes('/author/')) {
          const authorName = authorUrl.split('/').pop().replace('.html', '');
          if (authorName) {
            // Try to construct a proper author URL
            const formattedName = authorName.replace(/\s+/g, '_');
            console.log(`⚠️ Converting generic URL to author URL using name: ${formattedName}`);
            return `https://www.goodreads.com/author/show/${formattedName}`;
          }
        }
      }
      
      return goodreadsUrl;
      
    } catch (error) {
      console.error(`❌ Error extracting Goodreads link: ${error.message}`);
      return null;
    } finally {
      await page.close();
    }
  }
  
  // Utility method to get statistics
  getStats() {
    return {
      totalUrlsCollected: this.quoteUrls.length,
      totalQuotesScraped: this.scrapedQuotes.length,
      isLoggedIn: !!this.isLoggedIn,
      config: this.config
    };
  }
}

// CLI usage
async function main() {
  const scraper = new QuoteScraper({
    maxPages: 10,
    maxConcurrentTabs: 10,
    timeout: 30000
  });

  try {
    await scraper.initialize();
    
    // Scrape all quotes
    const quotes = await scraper.scrapeAllQuotes();
    
    console.log('\n📊 Scraping Statistics:');
    console.log(scraper.getStats());
    
    console.log('\n📝 Sample Quotes:');
    quotes.slice(0, 3).forEach((quote, index) => {
      console.log(`${index + 1}. "${quote.text}" - ${quote.author}`);
      console.log(`   Tags: ${quote.tags.join(', ')}`);
      console.log(`   URL: ${quote.sourceUrl}\n`);
    });

  } catch (error) {
    console.error('💥 Scraping failed:', error);
  } finally {
    await scraper.close();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = QuoteScraper;
