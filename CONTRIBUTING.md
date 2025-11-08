# Contributing to React Starter Kit

Thank you for your interest in contributing! This guide will help you get started.

## Quick Start

### 1. Fork & Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/xuanhoa88/rapid-rsk.git
cd react-starter-kit
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### 4. Make Changes

```bash
# Start development server
npm start

# Run tests
npm test

# Lint code
npm run lint
```

### 5. Commit & Push

```bash
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature-name
```

### 6. Create Pull Request

Open a pull request on GitHub with a clear description of your changes.

## Development Guidelines

### Code Style

- **JavaScript:** Follow ESLint rules (`.eslintrc.js`)
- **CSS:** Follow Stylelint rules (`.stylelintrc.js`)
- **Formatting:** Use Prettier (auto-format on save)

```bash
# Check code style
npm run lint

# Auto-fix issues
npm run fix

# Format code
npm run format
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: fix bug
docs: update documentation
style: format code
refactor: refactor code
test: add tests
chore: update dependencies
```

**Examples:**

```bash
git commit -m "feat: add dark mode support"
git commit -m "fix: resolve SSR hydration issue"
git commit -m "docs: update deployment guide"
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

**Requirements:**

- All new features must have tests
- Maintain or improve code coverage
- Tests must pass before submitting PR

### Documentation

Update documentation when:

- Adding new features
- Changing APIs
- Updating configuration
- Modifying build process

**Files to update:**

- `README.md` - Main documentation
- `docs/*.md` - Detailed guides
- Code comments - JSDoc for functions
- `.env.example` - New environment variables

## Project Structure

```
react-starter-kit/
├── src/                # Application source code
│   ├── components/     # React components
│   ├── routes/         # Page components
│   ├── api/            # API routes
│   └── server.js       # Server entry point
├── tools/              # Build tools and scripts
│   ├── webpack/        # Webpack configuration
│   └── tasks/          # Build tasks
├── docs/               # Documentation
└── public/             # Static files
```

See [docs/project-structure.md](docs/project-structure.md) for details.

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] Branch is up to date with main

### PR Checklist

- [ ] Clear title and description
- [ ] Reference related issues
- [ ] Screenshots (if UI changes)
- [ ] Breaking changes documented
- [ ] Changelog updated (if needed)

### Review Process

1. **Automated Checks** - CI runs tests and linting
2. **Code Review** - Maintainers review code
3. **Feedback** - Address review comments
4. **Approval** - PR approved by maintainer
5. **Merge** - PR merged to main

## Reporting Issues

### Bug Reports

Include:

- **Description** - Clear description of the bug
- **Steps to Reproduce** - How to reproduce the issue
- **Expected Behavior** - What should happen
- **Actual Behavior** - What actually happens
- **Environment** - OS, Node version, browser
- **Screenshots** - If applicable

**Template:**

```markdown
## Bug Description

Clear description of the bug

## Steps to Reproduce

1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior

What should happen

## Actual Behavior

What actually happens

## Environment

- OS: macOS 14.0
- Node: 18.17.0
- Browser: Chrome 120

## Screenshots

[If applicable]
```

### Feature Requests

Include:

- **Description** - What feature you want
- **Use Case** - Why you need it
- **Alternatives** - Other solutions considered
- **Examples** - Similar implementations

## Development Tips

### Hot Module Replacement

```bash
# Start dev server with HMR
npm start

# Changes auto-reload in browser
# React components refresh without page reload
```

### Debugging

```bash
# Enable verbose logging
LOG_LEVEL=verbose npm start

# Debug webpack build
npm run build -- --verbose

# Debug tests
npm test -- --verbose
```

### Environment Variables

```bash
# Copy example file
cp .env.example .env

# Edit values
nano .env

# See docs/environment-variables.md for details
```

### Build Optimization

```bash
# Analyze bundle size
BUNDLE_ANALYZE=true npm run build

# Check bundle report
open build/bundle-report.html
```

## Code Review Guidelines

### For Contributors

- Keep PRs focused and small
- Write clear commit messages
- Add tests for new features
- Update documentation
- Respond to feedback promptly

### For Reviewers

- Be respectful and constructive
- Focus on code quality
- Check for edge cases
- Verify tests and docs
- Approve when ready

## Getting Help

- **Documentation** - Check [docs/](docs/)
- **Issues** - Search existing issues
- **Discussions** - Ask questions in GitHub Discussions
- **Discord** - Join our community (if available)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to React Starter Kit!** 🎉
