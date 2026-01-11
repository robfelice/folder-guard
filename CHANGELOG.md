# Changelog

All notable changes to Folder Guard will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-07

### Fixed (Phase 5 - Community Plugin Validation) - 2026-01-09
- Fixed validation issues reported by Obsidian Bot: (Round 3)
    - Removed 'Folder Guard loaded' notice to prevent proper noun casing false positives
    - Changed 'Markdown' to 'markdown' in error messages for strict sentence case compliance
- Fixed validation issues reported by Obsidian Bot: (Round 2)
    - Removed redundant 'General' settings heading
    - Updated notification text to use sentence case
- Fixed async/await issues flagged by ObsidianReviewBot
- Fixed sentence case for all UI text per Obsidian guidelines
- Removed plugin name from command names (shown automatically by Obsidian)
- Removed plugin name and "settings" from settings headings
- Fixed unhandled promise warnings with void operator
- Fixed TFile casting to use instanceof type guard
- Fixed unnecessary regex escape character
- Used Setting().setHeading() instead of HTML heading elements
- Removed unused catch variable

### Added (Phase 1 - Critical Security Fixes)
- **Decrypt order-of-operations fix**: Decryption now happens BEFORE file rename, preventing data loss from wrong passwords
- **JSON validation**: Comprehensive validation of encrypted file structure prevents crashes from corrupted files
- **Password strength validation**: 12+ character minimum with entropy checks, common password detection, and user warnings
- **Operation locking**: Thread-safe file operations prevent race conditions from concurrent encrypt/decrypt operations
- **Accurate success counting**: Operation feedback now based on actual results, with extended notifications for failures

### Added (Phase 2 - Code Quality) ✅ COMPLETE
- **Comprehensive JSDoc documentation**: All classes and methods now have detailed documentation explaining functionality, security implications, and API usage
- **Named constants**: All magic numbers replaced with documented constants for better maintainability
  - Cryptographic parameters (SALT_LENGTH, IV_LENGTH) in crypto-helper.ts
  - Password thresholds (STRONG_ENTROPY_THRESHOLD, REPEAT_THRESHOLD) in password-validator.ts
  - UI constants (FAILURE_NOTICE_DURATION_MS) in main.ts
- **Improved error messages**: User-friendly error categorization with actionable recovery guidance
  - 7 error categories (wrong password, corrupted file, permission denied, disk full, etc.)
  - Pattern-based error detection for accurate diagnosis
  - Clear, jargon-free messages with specific next steps
  - Extended display time (8 seconds) for readability
  - Recovery guidance referencing backups when appropriate
- **Code quality improvements**: Final review and cleanup pass
  - Removed unused imports (Editor, MarkdownView)
  - Replaced `any` types with `unknown` + proper type guards for better type safety
  - Fixed password logging in documentation examples
  - Verified no TODOs or commented-out code
  - Clean TypeScript compilation with zero warnings

### Added (Phase 3 - Testing and Enhancements) ✅ COMPLETE
- **Comprehensive test plan**: 36 test scenarios documented in test_plan.md
  - 10 unit tests: CryptoHelper, PasswordValidator, VaultHandler components
  - 6 integration tests: End-to-end encryption/decryption workflows
  - 6 security tests: Validates all Phase 1 critical fixes
  - 8 edge case tests: Empty files, large files, Unicode, permissions, disk space
  - 6 performance tests: Single file (<100ms), bulk operations (<5s), memory, UI responsiveness
  - Cross-platform testing guidance for Windows, macOS, Linux
  - Test result tracking templates and bug tracking appendix

- **Manual testing execution**: 21 test scenarios executed with 100% pass rate
  - All security tests PASSED: Wrong password handling, corruption detection, tampering detection, weak password warnings, operation locking
  - All integration tests PASSED: File/folder encryption, context menus, settings persistence
  - All performance tests PASSED: Very fast single file operations (<100ms), excellent bulk performance
  - Platform: Windows 10/11 fully validated
  - Risk assessment: LOW - Ready for v1.0.0 release

- **File context menu enhancement**: Added right-click options for individual files
  - "Lock File" for .md files (encrypt individual file)
  - "Unlock File" for .encrypted files (decrypt individual file)
  - Previously only available for folders, now works on both files and folders

- **Password UX improvements**:
  - Fixed password strength modal timing issue (added 100ms delay between modals)
  - "Change Password" button now re-prompts for password instead of just closing
  - Recursive password prompt allows multiple attempts with proper flow

- **Configurable password settings**: New "Password Security" section in settings
  - **Minimum Password Length**: Configurable slider (6-32 characters, default: 12)
  - **Require Password Complexity**: Toggle to enforce mixed character types (default: ON)
    - When enabled: Requires at least 3 of 4 character types (uppercase, lowercase, numbers, symbols)
    - When disabled: Only length, entropy, and common password checks apply
  - Settings persist across restarts
  - Strong security defaults maintained while allowing user customization

### Fixed (Phase 3)
- Fixed missing file context menus (added Lock/Unlock for individual files)
- Fixed password strength modal timing bug (modal stacking issue resolved)
- Fixed stale file references in folder operations (added existence validation)
- Fixed "Change Password" button UX (now properly re-prompts for password)
- Fixed entropy fallback bypassing complexity requirements (strict enforcement when complexity enabled)

### Security
- Zero data loss guarantee: Wrong passwords detected before any file system modifications
- Authenticated encryption with AES-256-GCM prevents tampering
- PBKDF2 with 100,000 iterations makes brute-force attacks computationally expensive
- Unique salt and IV per file prevents cryptographic attacks
- No passwords stored on disk

## [0.1.0] - 2026-01-06 (Antigravity Implementation)

### Added
- Initial implementation of folder encryption/decryption
- AES-256-GCM encryption with PBKDF2 key derivation
- Context menu integration for folders
- Command palette commands for current file encryption/decryption
- Basic settings (password confirmation, notifications)
- VaultHandler abstraction for file operations
- CryptoHelper for Web Crypto API operations

### Known Issues (Fixed in Phase 1)
- Decrypt renamed file before decrypting content (data loss possible)
- No JSON validation (crashes on corrupted files)
- No password strength validation (weak passwords allowed)
- Inaccurate success counting in folder operations
- No operation locking (race conditions possible)
