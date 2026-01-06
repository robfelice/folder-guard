# Task 014: Setup CI/CD Pipeline

## Overview
**Status:** Not Started | **Complexity:** Medium (M) | **Priority:** MEDIUM
**Phase:** Phase 4 - Community Preparation | **Dependencies:** Task 013
**Estimated Effort:** 2-3 hours | **Last Updated:** 06/01/2026

## Objective
Setup GitHub Actions for automated building, linting, and releasing.

## GitHub Actions Workflows

### 1. Build and Lint (.github/workflows/build.yml)
```yaml
name: Build

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm ci
      - run: npm run build
      - run: npm run lint (if configured)
```

### 2. Release (.github/workflows/release.yml)
```yaml
name: Release

on:
  push:
    tags:
      - '*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run build
      - name: Create Release
        uses: actions/create-release@v1
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: false
          prerelease: false
      - name: Upload Release Assets
        # Upload main.js, manifest.json, styles.css
```

### 3. Package Scripts (package.json)
```json
{
  "scripts": {
    "dev": "node esbuild.config.mjs",
    "build": "node esbuild.config.mjs production",
    "version": "node version-bump.mjs && git add manifest.json versions.json",
    "lint": "eslint src/ --ext .ts (optional)"
  }
}
```

## Success Criteria
- [ ] Build workflow runs on every push
- [ ] Release workflow creates GitHub releases
- [ ] Automated version bumping works
- [ ] Release artifacts include main.js, manifest.json, styles.css
- [ ] CI badge added to README

---
**Version:** 1.0 | **Created:** 06/01/2026
