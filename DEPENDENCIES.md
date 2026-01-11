# Project Dependencies

**Purpose:** Tracks all external dependencies used in Folder Guard, including versions, purposes, and management policies.

**Version:** 1.1
**Last Updated:** 07/01/2026

## Core Dependencies

**Runtime Dependencies:**
- **None** - Folder Guard uses only browser-native APIs (Web Crypto API) and Obsidian Plugin API

## Development Dependencies

| Dependency | Version | Purpose | Notes |
|------------|---------|---------|-------|
| typescript | 4.7.4 | TypeScript compiler for type-safe development | Standard version for Obsidian plugins |
| esbuild | 0.17.3 | Fast JavaScript bundler for plugin compilation | Selected for build speed and small bundle size |
| obsidian | latest | Obsidian Plugin API type definitions | Always use latest for API compatibility |
| @types/node | ^16.11.6 | Node.js type definitions for TypeScript | Required for build scripts |
| tslib | 2.4.0 | TypeScript runtime library | Required by TypeScript compiler |
| builtin-modules | ^5.0.0 | List of Node.js built-in modules | Used by esbuild for external module detection |
| eslint | ^9.x | JavaScript/TypeScript linter | Enforces code quality and Obsidan guidelines |
| eslint-plugin-obsidianmd | ^1.x | Official Obsidian ESLint plugin | Checks for API usage and UI guidelines |
| @typescript-eslint/parser | ^8.x | ESLint parser for TypeScript | Enables linting of TS files |
| @typescript-eslint/eslint-plugin | ^8.x | ESLint rules for TypeScript | Standard TypeScript guidelines |

## System Requirements

**Build Environment:**
- Node.js 16.x or higher
- npm 7.x or higher
- Windows, macOS, or Linux (any platform supporting Node.js)

**Runtime Environment:**
- Obsidian v0.15.0 or higher (for Plugin API compatibility)
- Modern browser with Web Crypto API support (all recent Obsidian versions)

## Dependency Management

- **Management Tool**: npm
- **Lock File**: package-lock.json
- **Build Scripts**:
  - `npm run dev` - Development build with watch mode
  - `npm run build` - Production build (minified)

## Selection Criteria

Dependencies were selected based on:
- **Obsidian Community Standards**: Following standard plugin development practices
- **Minimal Dependencies**: Zero runtime dependencies to reduce attack surface
- **Build Performance**: esbuild chosen for fast compilation (<100ms builds)
- **Type Safety**: TypeScript for catching errors during development
- **API Compatibility**: Using latest Obsidian API definitions

## Security Considerations

- **Zero Runtime Dependencies**: No third-party code runs in production
- **Web Crypto API**: Browser-native cryptography (AES-256-GCM, PBKDF2)
- **No External Requests**: Plugin operates entirely offline
- **Minimal Build Dependencies**: Only essential tools for TypeScript compilation

## Update Policy

- **Security updates**: Apply immediately when available
- **Obsidian API updates**: Track latest for new features and bug fixes
- **Build tool updates**: Review quarterly, test thoroughly before upgrading
- **Breaking changes**: Major version updates require full testing cycle

## Known Issues

**None** - All dependencies are stable and well-maintained.

## Build Compatibility Notes

- **Platform-specific binaries**: esbuild installs platform-specific binaries
  - Reinstall node_modules when switching between Windows/WSL/macOS
  - Use `npm install` in target environment, not `npm ci`
- **TypeScript version**: Locked to 4.7.4 for Obsidian plugin compatibility

*Last Updated: 11/01/2026*
