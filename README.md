# Random Quote Fetcher

A modern web application that fetches and displays random quotes from [quotes.toscrape.com](https://quotes.toscrape.com) using web scraping with Puppeteer. The application features a responsive grid layout with keyboard navigation, infinite scrolling, and a beautiful modern UI.

## 🚀 Features

- **Web Scraping**: Uses Puppeteer to scrape quotes from quotes.toscrape.com
- **Responsive Design**: Modern, mobile-first UI built with React and Tailwind CSS
- **Grid Layout**: Interactive grid system for displaying quotes
- **Keyboard Navigation**: Full keyboard support for accessibility
- **Infinite Scrolling**: Load more quotes as you scroll
- **Real-time Loading**: Visual feedback during quote fetching
- **API Documentation**: Swagger/OpenAPI documentation
- **Bulk Operations**: Fetch multiple quotes at once
- **Pagination**: Efficient pagination for large datasets
- **Mobile Support**: Responsive panels and touch-friendly interface

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **React Query** - Data fetching and caching
- **React Window** - Virtual scrolling for performance
- **React Intersection Observer** - Scroll-based loading

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Puppeteer** - Web scraping and automation
- **Zod** - Schema validation
- **Swagger** - API documentation
- **CORS** - Cross-origin resource sharing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download here](https://git-scm.com/)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd quoteFetcher
```

### 2. Install Dependencies

Install dependencies for both frontend and backend:

```bash
# Install root dependencies (if any)
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Configuration

Create a `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Optional: Login credentials for quotes.toscrape.com
QUOTES_USERNAME=your_username_here
QUOTES_PASSWORD=your_password_here

# Server configuration
PORT=5000

# Scraper configuration
MAX_PAGES=10
MAX_CONCURRENT_TABS=10
TIMEOUT=30000
```

**Note**: Login credentials are optional. The scraper will work without them, but logging in may provide access to additional quotes.

### 4. Start the Application

#### Option A: Using the Development Script (Windows)

```bash
# From the root directory
start-dev.bat
```

This will start both the backend and frontend servers automatically.

#### Option B: Manual Start

Start the backend server:

```bash
cd backend
npm start
```

In a new terminal, start the frontend server:

```bash
cd frontend
npm start
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api-docs
- **Health Check**: http://localhost:5000/health

## 🎮 Usage

### Keyboard Shortcuts

- **Arrow Keys**: Navigate between quote cells
- **Enter/Space**: Fetch a new random quote for the selected cell
- **R**: Refresh all quotes
- **C**: Clear all quotes
- **Escape**: Close panels (mobile)

### Features

1. **Grid Navigation**: Use arrow keys to move between cells
2. **Quote Fetching**: Press Enter or Space to fetch a random quote
3. **Bulk Operations**: Use the action panel to fetch multiple quotes
4. **Infinite Scroll**: Scroll down to load more quotes automatically
5. **Mobile Support**: Use the menu buttons to access panels on mobile

## 📚 API Endpoints

### Health Check
```
GET /health
```

### Random Quotes
```
POST /api/quotes/random
Content-Type: application/json

{
  "count": 1
}
```

### All Quotes
```
GET /api/quotes/all
```

### Bulk Quotes
```
POST /api/quotes/bulk
Content-Type: application/json

{
  "count": 10
}
```

### Paginated Quotes
```
GET /api/quotes/paginated?offset=0&limit=20
```

### Statistics
```
GET /api/stats
```

## 🔧 Development

### Project Structure

```
quoteFetcher/
├── backend/
│   ├── src/
│   │   ├── server.js      # Express server
│   │   ├── scraper.js     # Puppeteer scraper
│   │   ├── schemas.js     # Zod validation schemas
│   │   └── config.js      # Configuration
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # React context
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/         # Utility functions
│   ├── public/
│   └── package.json
├── start-dev.bat         # Windows development script
└── README.md
```

### Available Scripts

#### Backend
```bash
cd backend
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run scrape     # Run scraper directly
```

#### Frontend
```bash
cd frontend
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   - The backend will automatically try port 5001 if 5000 is occupied
   - Kill the process using the port: `netstat -ano | findstr :5000`

2. **Puppeteer Installation Issues**
   - Ensure you have the latest version of Node.js
   - Try deleting `node_modules` and running `npm install` again

3. **CORS Issues**
   - Make sure the backend is running on port 5000
   - Check that the frontend is making requests to the correct URL

4. **Scraper Not Initializing**
   - Check your internet connection
   - Verify the quotes.toscrape.com website is accessible
   - Check the console for error messages

### Performance Tips

- The scraper uses pagination to efficiently load quotes
- React Window provides virtual scrolling for better performance
- Quotes are cached to avoid redundant requests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License - see the package.json files for details.

## 🙏 Acknowledgments

- [quotes.toscrape.com](https://quotes.toscrape.com) for providing the quote data
- [Puppeteer](https://pptr.dev/) for web scraping capabilities
- [React](https://reactjs.org/) and [Tailwind CSS](https://tailwindcss.com/) for the frontend
- [Express.js](https://expressjs.com/) for the backend API

## 📞 Support

If you encounter any issues or have questions:

1. Check the [troubleshooting section](#-troubleshooting)
2. Review the API documentation at http://localhost:5000/api-docs
3. Open an issue on GitHub

---

**Happy Quote Fetching! 🎉**