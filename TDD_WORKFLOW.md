# 🧪 Test-Driven Development (TDD) Workflow

## 📋 Overview

This project follows **strict TDD practices** with comprehensive regression testing before every deployment.

## 🔄 TDD Red-Green-Refactor Cycle

### 1. 🔴 RED: Write a Failing Test

```bash
# Create or update test file
touch src/lib/newFeature.test.js

# Write failing test first
npm run test:watch  # Keep running during development
```

### 2. 🟢 GREEN: Make Test Pass

```bash
# Write minimal code to pass the test
# Run specific test to verify
npm test -- --testPathPattern=newFeature
```

### 3. 🔵 REFACTOR: Improve Code Quality

```bash
# Refactor while keeping tests green
# All tests should still pass
npm run test:regression
```

## 🛠️ Available Commands

### Development

```bash
npm run dev              # Start development server
npm run test:watch       # TDD mode - watch tests while coding
```

### Testing (Regression)

```bash
npm run test             # Run all tests once
npm run test:coverage    # Run tests with coverage report
npm run test:regression  # Full regression suite (pre-deployment)
npm run test:ci         # CI/CD optimized test run
```

### Code Quality

```bash
npm run lint             # Check code style
npm run lint:fix         # Fix auto-fixable lint issues
npm run type-check       # TypeScript type checking
npm run quality-gate     # Full quality check (lint + test + build)
```

## 🚨 Pre-Commit Quality Gates

Every commit automatically runs:

1. **ESLint** - Code style and quality checks
2. **Prettier** - Code formatting
3. **Jest** - Related tests for changed files
4. **Type Check** - TypeScript validation

```bash
# This runs automatically on git commit
git add .
git commit -m "feat: add new feature"  # Triggers quality gates
```

## 🚀 Pre-Deployment Regression Testing

Before **every production deployment**, the full regression suite runs:

### Automated CI/CD Pipeline

```yaml
1. 🧹 Lint all code
2. 🔍 TypeScript type check
3. 🧪 Run ALL tests (not just changed files)
4. 📊 Generate coverage report
5. 🏗️ Build application
6. ✅ Deploy only if all pass
```

### Manual Regression (Optional)

```bash
npm run quality-gate  # Same as CI/CD pipeline locally
```

## 🎯 TDD Best Practices

### ✅ DO:

- Write tests **before** implementation
- Keep tests **simple and focused**
- Test **behavior, not implementation**
- Run full regression before deploying
- Commit frequently with **meaningful messages**

### ❌ DON'T:

- Skip writing tests first
- Commit failing tests to main branch
- Deploy without running regression suite
- Write tests after implementation (not TDD!)

## 📊 Coverage Requirements

- **Minimum coverage**: 80%
- **New features**: 95%+ coverage required
- **Critical paths**: 100% coverage (auth, payments, data)

## 🔧 IDE Setup for TDD

### VS Code Extensions

```json
{
  "recommendations": [
    "ms-vscode.vscode-jest",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint"
  ]
}
```

### Settings

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "jest.autoRun": "watch"
}
```

## 🏗️ Project Structure for Tests

```
src/
├── components/
│   ├── Component.js
│   └── Component.test.js     # Co-located tests
├── lib/
│   ├── utils.js
│   └── utils.test.js         # Unit tests
└── __tests__/
    └── integration/          # Integration tests
```

## 🚨 Emergency Procedures

### Broken CI/CD Pipeline

```bash
# Run quality gate locally first
npm run quality-gate

# If passing locally but failing in CI:
# 1. Check Node.js version compatibility
# 2. Verify environment variables
# 3. Review CI logs for specific failure
```

### Failed Deployment

```bash
# Immediate rollback (Vercel)
vercel --prod --rollback

# Fix and redeploy with full testing
npm run quality-gate
git push origin main  # Triggers new deployment
```

## 📈 Metrics & Monitoring

- **Test Coverage**: Tracked in CI/CD
- **Build Time**: Monitored per commit
- **Deployment Success**: 99.9% target
- **Code Quality Score**: ESLint + TypeScript
