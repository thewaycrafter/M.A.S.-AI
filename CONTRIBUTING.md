# Contributing to M.A.S. AI

First off, thanks for taking the time to contribute! 🎉

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (include code snippets if applicable)
- **Describe the behavior you observed and expected**
- **Include screenshots if applicable**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. Create an issue and provide:

- **Use a clear and descriptive title**
- **Provide a detailed description of the enhancement**
- **Explain why this enhancement would be useful**

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code, add tests
3. Ensure the test suite passes
4. Make sure your code follows the existing style
5. Write a clear commit message

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/masai.git
cd masai

# Install dependencies
npm run install:all

# Copy environment file
cp .env.example .env

# Start development servers
./start.sh
```

## Style Guide

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters
- Reference issues and pull requests liberally

### TypeScript Style

- Use TypeScript for all new files
- Follow existing code style
- Use meaningful variable names
- Add comments for complex logic

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

---

Thank you for contributing! 🙏
