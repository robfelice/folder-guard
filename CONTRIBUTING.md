# Contributing to Folder Guard

Thank you for your interest in contributing to Folder Guard! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Please be respectful and constructive in all interactions. We're building a welcoming community for everyone.

## Ways to Contribute

### Reporting Bugs

Before creating a bug report, check the [issue list](https://github.com/robfelice/folder-guard/issues) to avoid duplicates.

When reporting bugs, include:
- **Clear description** of what happened
- **Steps to reproduce** the issue
- **Expected behavior** vs actual behavior
- **Environment**: Windows/macOS/Linux, Obsidian version, plugin version
- **Screenshots or error messages** if applicable

Use the bug report template when creating issues.

### Suggesting Features

Before suggesting features, check existing issues and discussions to avoid duplicates.

When suggesting features, include:
- **Clear description** of the feature
- **Use case** or problem it solves
- **Why this would be useful** to other users
- **Alternative approaches** you've considered (if any)

Use the feature request template when creating issues.

### Improving Documentation

Documentation improvements are always welcome! You can:
- Fix typos and grammar
- Clarify existing documentation
- Add examples or use cases
- Improve README or guide clarity

## Development Setup

### Prerequisites
- Node.js 16.x or higher
- npm 7.x or higher
- Git
- Obsidian (for testing the plugin)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/robfelice/folder-guard.git
   cd folder-guard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development build**
   ```bash
   npm run dev
   ```

4. **Link to Obsidian**
   - Copy the `folder-guard` directory to `.obsidian/plugins/`
   - Reload Obsidian or use "Reload app without saving"
   - Enable the plugin in Obsidian settings

5. **Make your changes**
   - Edit TypeScript files in `src/`
   - Changes will auto-compile with `npm run dev`
   - Test in Obsidian (may need to reload plugin)

6. **Build for release**
   ```bash
   npm run build
   ```

## Code Style Guidelines

### TypeScript
- Use TypeScript for all source code (no `.js` files in `src/`)
- Enable strict type checking
- Avoid `any` types - use `unknown` with type guards instead
- Use descriptive variable and function names

### JSDoc Comments
- Add JSDoc comments to all public methods and classes
- Include parameter descriptions, return types, and usage examples
- Document security implications where relevant

### File Organization
```
src/
├── main.ts              # Plugin entry point
├── crypto-helper.ts     # Encryption logic
├── vault-handler.ts     # File operations
├── password-validator.ts # Password validation
├── password-modal.ts    # Password input UI
├── password-strength-modal.ts # Strength warning UI
└── settings-tab.ts      # Settings UI
```

### Security Considerations
- **Never log passwords** or sensitive data
- **Validate all inputs** from users
- **Use secure APIs** (Web Crypto, not custom crypto)
- **Document security implications** of changes

## Testing

### Manual Testing
Run through the [test plan](documentation/test_plan.md) when making changes:
- Single file encryption/decryption
- Folder operations
- Password validation
- Error handling
- Edge cases (large files, special characters, etc.)

### Build Verification
Always verify your changes compile without warnings:
```bash
npm run build
```

Check the output for:
- No TypeScript errors
- No ESLint warnings
- Plugin bundled correctly

## Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow code style guidelines
   - Add/update documentation
   - Test thoroughly

3. **Commit with clear messages**
   ```bash
   git commit -m "feat: add feature description"
   git commit -m "fix: resolve issue description"
   git commit -m "docs: update documentation"
   ```

4. **Push to GitHub**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**
   - Describe what your PR does
   - Reference any related issues (#123)
   - Include before/after screenshots if UI changes
   - Explain your approach and any trade-offs

6. **Respond to feedback**
   - Keep the discussion constructive
   - Ask clarifying questions if needed
   - Make requested changes promptly

## Commit Message Format

Use clear, descriptive commit messages:

- `feat: add new feature` - New functionality
- `fix: resolve bug` - Bug fix
- `docs: update README` - Documentation only
- `refactor: improve code structure` - No functionality change
- `test: add test case` - Test-related changes
- `chore: update dependencies` - Maintenance

## Licensing

By contributing to Folder Guard, you agree that your contributions will be licensed under the MIT License.

## Questions?

- **Bug or issue?** Open a [GitHub issue](https://github.com/robfelice/folder-guard/issues)
- **Security concern?** Email security-related issues (see [SECURITY.md](SECURITY.md))
- **General question?** Use [GitHub Discussions](https://github.com/robfelice/folder-guard/discussions)

Thank you for contributing to Folder Guard! 🎉
