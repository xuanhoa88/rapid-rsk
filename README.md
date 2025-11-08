# React Starter Kit

> **Modern, production-ready React application boilerplate with server-side rendering, built on React 18, Express, and Webpack 5.**

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-18.3.1-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.txt)

## ✨ Features

- **⚛️ React 18** - Latest React with concurrent features and new JSX transform
- **🚀 Server-Side Rendering (SSR)** - Fast initial page loads with SEO optimization
- **📦 Webpack 5** - Modern bundling with code splitting and tree shaking
- **🔥 Hot Module Replacement** - Instant feedback during development with React Refresh
- **🎨 CSS Modules** - Scoped styling with PostCSS and Autoprefixer
- **🌍 Internationalization (i18n)** - Multi-language support with react-i18next
- **🔐 Authentication** - JWT-based auth with Express middleware
- **📊 Redux** - Predictable state management with Redux Toolkit patterns
- **🧪 Testing** - Jest and React Testing Library setup
- **📝 TypeScript Ready** - Easy migration path to TypeScript
- **🐳 Docker Support** - Production-ready Docker configuration
- **♿ Accessibility** - WCAG 2.1 compliant with ESLint a11y rules

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 16.0.0
- **npm** >= 7.0.0 (or yarn/pnpm)

### Installation

```bash
# Clone the repository
git clone https://github.com/xuanhoa88/rapid-rsk.git
cd react-starter-kit

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Documentation

### Core Guides

- **[Getting Started](docs/getting-started.md)** - Setup and installation
- **[Project Structure](docs/project-structure.md)** - Code organization
- **[Development](docs/development.md)** - Development workflow
- **[Configuration](docs/configuration.md)** - Webpack and build config
- **[Environment Variables](docs/environment-variables.md)** - Environment setup

### Features

- **[Routing](docs/recipes/how-to-implement-routing.md)** - Universal routing
- **[Data Fetching](docs/data-fetching.md)** - API integration
- **[Styling](docs/styling.md)** - CSS Modules
- **[Redux](docs/recipes/how-to-integrate-redux.md)** - State management
- **[i18n](docs/recipes/how-to-use-i18n.md)** - Internationalization
- **[Testing](docs/testing-your-application.md)** - Testing guide

### Deployment

- **[Deployment](docs/deployment.md)** - Docker, server, CI/CD

## 🛠️ Available Scripts

```bash
# Development
npm start              # Start development server with HMR
npm run build          # Build for production
npm test               # Run tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Generate coverage report

# Code Quality
npm run lint           # Lint JavaScript and CSS
npm run lint:js        # Lint JavaScript only
npm run lint:css       # Lint CSS only
npm run fix            # Auto-fix linting issues
npm run format         # Format code with Prettier

# Utilities
npm run clean          # Clean build artifacts
npm run i18n           # Extract i18n messages
```

## 🏗️ Tech Stack

### Frontend

- **[React 18.3.1](https://reactjs.org/)** - UI library with concurrent features
- **[Redux 4.2.1](https://redux.js.org/)** - State management
- **[Universal Router 8.3](https://github.com/kriasoft/universal-router)** - Isomorphic routing
- **[react-i18next 14.1.3](https://react.i18next.com/)** - Internationalization

### Backend

- **[Node.js](https://nodejs.org/)** - JavaScript runtime
- **[Express 4.16](http://expressjs.com/)** - Web application framework
- **[Sequelize 4.44](https://sequelize.org/)** - ORM for SQL databases
- **[SQLite 5.0](https://www.sqlite.org/)** - Default database (easily swappable)

### Build Tools

- **[Webpack 5](https://webpack.js.org/)** - Module bundler
- **[Babel 7](https://babeljs.io/)** - JavaScript compiler
- **[PostCSS](https://postcss.org/)** - CSS transformation
- **[ESLint](https://eslint.org/)** - JavaScript linting
- **[Prettier](https://prettier.io/)** - Code formatting

### Testing

- **[Jest](https://jestjs.io/)** - Testing framework
- **[React Testing Library](https://testing-library.com/react)** - React component testing

## 📁 Project Structure

```
react-starter-kit/
├── public/              # Static assets
├── src/
│   ├── actions/         # Redux actions
│   ├── api/             # API routes and database models
│   ├── components/      # Reusable React components
│   ├── constants/       # Application constants
│   ├── i18n/            # Internationalization setup
│   ├── reducers/        # Redux reducers
│   ├── routes/          # Application routes (pages)
│   ├── store/           # Redux store configuration
│   ├── client.js        # Client-side entry point
│   ├── server.js        # Server-side entry point
│   └── router.js        # Universal router configuration
├── tools/               # Build automation scripts
│   ├── lib/             # Utility libraries
│   ├── tasks/           # Build tasks
│   └── webpack/         # Webpack configurations
├── docs/                # Documentation
├── .env.example         # Environment variables template
└── package.json         # Dependencies and scripts
```

## 🔧 Configuration

The application is configured via environment variables. Copy `.env.example` to `.env` and customize:

```bash
# Server Configuration
RSK_PORT=3000                    # Application port
RSK_HOST=localhost               # Development host
RSK_HTTPS=false                  # Enable HTTPS

# API Configuration
RSK_API_CLIENT_URL=              # Client-side API URL
RSK_API_SERVER_URL=              # External API proxy (optional)

# Database
RSK_DATABASE_URL=sqlite:database.sqlite  # Database connection

# Authentication
RSK_JWT_SECRET=your-secret-key   # JWT signing secret
RSK_JWT_EXPIRES_IN=1d            # Token expiration
```

See [Configuration Guide](docs/configuration.md) for all available options.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

Tests are located next to the components they test:

```
src/components/Button/
├── Button.js
├── Button.css
└── Button.test.js
```

## 🚢 Deployment

### Production Build

```bash
# 1. Build for production
npm run build

# 2. Install production dependencies (REQUIRED!)
npm install --production

# 3. Start production server
node build/server.js
```

**Important:** The server bundle requires `node_modules/` at runtime. Always run `npm install --production` after building.

### Docker

```bash
# Build Docker image
docker build -t react-starter-kit .

# Run container
docker run -p 3000:3000 react-starter-kit
```

### Environment-Specific Builds

See [Deployment Guide](docs/deployment.md) for complete guide including:

- Docker deployment (recommended)
- Traditional server deployment
- CI/CD pipeline setup
- Environment variables
- Troubleshooting

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on:

- Code of Conduct
- Development workflow
- Submitting pull requests
- Reporting issues

## 📝 License

This project is licensed under the MIT License - see the [LICENSE.txt](LICENSE.txt) file for details.

## 🙏 Acknowledgments

- Built with inspiration from the original [React Starter Kit](https://github.com/kriasoft/react-starter-kit)
- Uses best practices from the React community
- Powered by amazing open-source projects

## 📚 Learn More

- **[React Documentation](https://react.dev/)** - Learn React
- **[Express Guide](https://expressjs.com/en/guide/routing.html)** - Express.js documentation
- **[Webpack Concepts](https://webpack.js.org/concepts/)** - Understanding Webpack
- **[Redux Toolkit](https://redux-toolkit.js.org/)** - Modern Redux patterns

---

**Made with ❤️ by the development team**
