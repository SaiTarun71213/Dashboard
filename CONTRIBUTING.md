# Contributing to Energy Dashboard

Thank you for your interest in contributing to the Energy Dashboard project! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** (v8 or higher)
- **MongoDB** (v5.0 or higher) or MongoDB Atlas account
- **Git**
- **Angular CLI** (v17 or higher)

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Dashboard.git
   cd Dashboard
   ```

2. **Install Dependencies**
   ```bash
   npm run install:all
   ```

3. **Environment Configuration**
   ```bash
   # Backend configuration
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   
   # Seed database
   npm run seed
   ```

4. **Start Development Servers**
   ```bash
   # From root directory
   npm run start:dev
   ```

## 📋 Development Guidelines

### Code Style

#### TypeScript/JavaScript
- Use **TypeScript** for all new code
- Follow **ESLint** configuration
- Use **Prettier** for code formatting
- Prefer `const` over `let`, avoid `var`
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

#### Angular
- Follow **Angular Style Guide**
- Use **OnPush** change detection where possible
- Implement **OnDestroy** for cleanup
- Use **reactive forms** over template-driven forms
- Prefer **standalone components** for new components

#### Node.js/Express
- Use **async/await** over callbacks
- Implement proper **error handling**
- Use **middleware** for cross-cutting concerns
- Follow **RESTful** API conventions
- Add **input validation** for all endpoints

### Git Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write clean, tested code
   - Follow commit message conventions
   - Keep commits atomic and focused

3. **Commit Messages**
   ```
   type(scope): description
   
   feat(dashboard): add widget drag and drop functionality
   fix(api): resolve authentication token refresh issue
   docs(readme): update installation instructions
   test(charts): add unit tests for chart service
   ```

4. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Testing

#### Frontend Testing
```bash
cd frontend
npm test                    # Run unit tests
npm run test:coverage      # Run with coverage
npm run e2e                # Run e2e tests
```

#### Backend Testing
```bash
cd backend
npm test                   # Run unit tests
npm run test:integration   # Run integration tests
npm run test:coverage      # Run with coverage
```

### Code Review Process

1. **Self Review**
   - Test your changes thoroughly
   - Run linting and tests
   - Check for console errors
   - Verify responsive design

2. **Pull Request**
   - Provide clear description
   - Include screenshots for UI changes
   - Reference related issues
   - Add reviewers

3. **Review Criteria**
   - Code quality and style
   - Test coverage
   - Performance impact
   - Security considerations
   - Documentation updates

## 🏗️ Project Structure

### Frontend (`/frontend`)
```
src/
├── app/
│   ├── components/        # Reusable components
│   ├── pages/            # Page components
│   ├── services/         # Angular services
│   ├── interceptors/     # HTTP interceptors
│   ├── guards/           # Route guards
│   ├── models/           # TypeScript interfaces
│   └── utils/            # Utility functions
├── assets/               # Static assets
└── environments/         # Environment configs
```

### Backend (`/backend`)
```
src/
├── controllers/          # Route controllers
├── models/              # MongoDB models
├── routes/              # API routes
├── services/            # Business logic
├── middleware/          # Express middleware
├── utils/               # Utility functions
└── config/              # Configuration files
```

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Environment Information**
   - OS and version
   - Node.js version
   - Browser and version
   - MongoDB version

2. **Steps to Reproduce**
   - Clear, numbered steps
   - Expected behavior
   - Actual behavior
   - Screenshots if applicable

3. **Additional Context**
   - Error messages
   - Console logs
   - Network requests (if relevant)

## 💡 Feature Requests

For new features:

1. **Check Existing Issues**
   - Search for similar requests
   - Comment on existing issues

2. **Provide Details**
   - Clear description
   - Use cases
   - Mockups or wireframes
   - Implementation suggestions

## 📚 Documentation

### Code Documentation
- Add JSDoc comments for public APIs
- Include usage examples
- Document complex algorithms
- Update README for new features

### API Documentation
- Update Swagger/OpenAPI specs
- Include request/response examples
- Document error codes
- Add authentication requirements

## 🔒 Security

### Reporting Security Issues
- **DO NOT** create public issues for security vulnerabilities
- Email security concerns to: security@energydashboard.com
- Include detailed description and steps to reproduce

### Security Guidelines
- Validate all user inputs
- Use parameterized queries
- Implement proper authentication
- Follow OWASP guidelines
- Keep dependencies updated

## 🚀 Release Process

### Version Numbering
We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist
- [ ] Update version numbers
- [ ] Update CHANGELOG.md
- [ ] Run full test suite
- [ ] Update documentation
- [ ] Create release notes
- [ ] Tag release in Git

## 🤝 Community

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Email**: Direct contact for sensitive issues

### Code of Conduct
- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Follow project guidelines

## 📝 License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to Energy Dashboard! 🌟
