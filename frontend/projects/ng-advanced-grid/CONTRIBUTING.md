# Contributing to NgAdvancedGrid

Thank you for your interest in contributing to NgAdvancedGrid! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Angular CLI 17+
- Git

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/ng-advanced-grid.git
   cd ng-advanced-grid
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```

4. **Build Library**
   ```bash
   npm run build:lib
   ```

5. **Run Tests**
   ```bash
   npm test
   ```

## 📝 Development Guidelines

### Code Style

- Follow Angular style guide
- Use TypeScript strict mode
- Write meaningful commit messages
- Add JSDoc comments for public APIs
- Use meaningful variable and function names

### File Structure

```
projects/ng-advanced-grid/
├── src/
│   ├── lib/
│   │   ├── components/          # Grid components
│   │   ├── services/           # Core services
│   │   ├── interfaces/         # TypeScript interfaces
│   │   ├── examples/           # Example components
│   │   └── ng-advanced-grid.module.ts
│   └── public-api.ts           # Public API exports
├── README.md
├── CHANGELOG.md
├── package.json
└── ng-package.json
```

### Coding Standards

1. **TypeScript**
   - Use strict type checking
   - Prefer interfaces over types
   - Use readonly for immutable data
   - Avoid `any` type

2. **Angular**
   - Use OnPush change detection
   - Implement OnDestroy for cleanup
   - Use standalone components
   - Follow reactive patterns with RxJS

3. **Testing**
   - Write unit tests for all public methods
   - Test edge cases and error conditions
   - Use meaningful test descriptions
   - Maintain high test coverage

## 🐛 Bug Reports

When filing a bug report, please include:

1. **Environment Information**
   - Angular version
   - NgAdvancedGrid version
   - Browser and version
   - Operating system

2. **Reproduction Steps**
   - Clear steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots if applicable

3. **Code Sample**
   - Minimal reproduction case
   - StackBlitz or CodeSandbox link preferred

## ✨ Feature Requests

For feature requests, please:

1. Check existing issues first
2. Describe the use case
3. Explain why it would be beneficial
4. Provide implementation ideas if possible
5. Consider backward compatibility

## 🔄 Pull Request Process

1. **Before Starting**
   - Check existing issues and PRs
   - Discuss major changes in an issue first
   - Fork the repository

2. **Development**
   - Create a feature branch from `main`
   - Follow coding standards
   - Write tests for new functionality
   - Update documentation if needed

3. **Submission**
   - Ensure all tests pass
   - Update CHANGELOG.md
   - Write clear commit messages
   - Submit PR with detailed description

4. **Review Process**
   - Address review feedback
   - Keep PR focused and small
   - Be responsive to comments

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/tooling changes

Examples:
```
feat(grid): add responsive breakpoint support
fix(resize): handle edge case in resize calculation
docs(readme): update installation instructions
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Place test files next to source files
- Use `.spec.ts` extension
- Test public API thoroughly
- Mock external dependencies
- Use descriptive test names

## 📚 Documentation

### API Documentation

- Use JSDoc for all public methods
- Include parameter types and descriptions
- Provide usage examples
- Document return values

### README Updates

- Keep examples up to date
- Update feature lists
- Maintain accurate installation instructions
- Include migration guides for breaking changes

## 🚀 Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create release PR
4. Tag release after merge
5. Publish to npm

## 📞 Getting Help

- Check existing documentation
- Search existing issues
- Ask questions in discussions
- Join our community chat

## 🙏 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Given credit in documentation

Thank you for contributing to NgAdvancedGrid! 🎉
