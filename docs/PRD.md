# Folder Guard - Product Requirements Document

## Document Control
**Purpose:** This document defines the requirements, architecture, and implementation plan for Folder Guard, an Obsidian plugin providing selective folder-level encryption for vault security.

- **Status**: In Review
- **Version**: 1.0
- **Date Created**: 06/01/2026
- **Last Updated**: 06/01/2026
- **Author**: Rob Felice / Claude Code
- **Approved By**: Pending

## Version History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 06/01/2026 | Claude Code | Initial PRD from project_brief.md + security review findings |

> This document follows the standard PRD template defined in the [Project Governance Guidelines](../../governance/project_governance.md).

## 1. Executive Summary

Folder Guard is an Obsidian community plugin that provides **selective, client-side encryption** for folders within an Obsidian vault. Unlike existing solutions that either encrypt entire vaults (too broad) or individual text blocks (too granular), Folder Guard enables users to protect specific folders containing sensitive content while maintaining normal workflow with unencrypted files.

The plugin implements **AES-256-GCM encryption** with **PBKDF2 key derivation** using the Web Crypto API, providing true encryption at rest with password-based protection. Files are encrypted with unique salts and IVs, renamed with `.encrypted` extensions, and completely hidden from Obsidian's search and graph features.

**Current Status**: Feature-complete v0.1.0 implementation built by Antigravity (Google). Requires critical bug fixes and security hardening before community plugin submission.

## 2. Background

### Problem Statement
Obsidian users frequently store sensitive information in their vaults—personal notes, financial data, medical records, confidential business information. While Obsidian provides excellent knowledge management capabilities, it lacks native folder-level encryption. Users must choose between:

1. **Whole-vault encryption** (Cryptsidian): Too broad, affects all files, impacts performance
2. **Text-block encryption** (Meld Encrypt): Too granular, cumbersome for multiple notes
3. **No encryption**: Leaves sensitive data exposed

### Existing Solutions Gap
- **Cryptsidian**: Encrypts entire vault, requires decryption to access any content
- **Meld Encrypt**: Inline text encryption, doesn't hide file structure or metadata
- **Password Protection plugins**: UI-only, no actual encryption
- **External tools**: Separate from Obsidian workflow, breaks graph/search integration

### Why Folder Guard
Folder Guard fills this gap by providing **folder-level granularity** with **true encryption at rest**, allowing users to selectively protect sensitive folders while maintaining normal workflow for unencrypted content.

## 3. Goals and Objectives

### Primary Goals
1. **Selective Protection**: Enable encryption of specific folders without affecting vault-wide workflow
2. **Strong Security**: Implement industry-standard encryption (AES-256-GCM) with secure key derivation
3. **Seamless Integration**: Work naturally within Obsidian's existing UI and user experience
4. **Zero Data Loss**: Ensure atomic operations prevent corruption during encrypt/decrypt
5. **Community Ready**: Meet all Obsidian community plugin standards and security requirements

### Success Metrics
- **Security**: Zero known vulnerabilities in cryptographic implementation
- **Reliability**: 100% successful encrypt/decrypt operations in testing (no data loss)
- **Performance**: Encrypt/decrypt 100 files in <5 seconds
- **Usability**: Users can lock/unlock folders with <3 clicks
- **Adoption**: Accepted into Obsidian community plugin directory
- **Quality**: GitHub repository with proper documentation, CI/CD, and contribution guidelines

## 4. User Personas

### Primary User: Privacy-Conscious Knowledge Worker
- **Characteristics**: Uses Obsidian for mixed personal/professional content
- **Pain Points**:
  - Needs to protect sensitive folders (financial, medical, confidential work)
  - Doesn't want to encrypt entire vault (performance, accessibility)
  - Wants seamless workflow—lock sensitive folders, work normally with others
- **Usage Pattern**:
  - Locks sensitive folders when not actively using them
  - Unlocks on-demand for specific tasks
  - Keeps 80% of vault unencrypted for normal workflow

### Secondary User: Security Professional
- **Characteristics**: High security requirements, technical understanding
- **Pain Points**:
  - Needs verifiable encryption strength
  - Wants no password storage or recovery (security over convenience)
  - Requires audit trail and transparency
- **Usage Pattern**:
  - Reviews cryptographic implementation before use
  - Uses strong passwords, possibly key-based approach later
  - May contribute to project or audit code

## 5. Core Requirements

### 5.1 Folder Encryption
- **Priority: Critical**
- **Functionality**:
  - Right-click folder → "Lock Folder" → Enter password → All `.md` files encrypted
  - Encrypted files renamed to `.encrypted` extension
  - Recursive operation processes nested folders
  - Original content unrecoverable without password
- **Expected Behavior**:
  - Files disappear from Obsidian's file explorer (not recognized as markdown)
  - Search and graph features don't index encrypted content
  - Folder structure remains visible (only content encrypted)

### 5.2 Folder Decryption
- **Priority: Critical**
- **Functionality**:
  - Right-click folder → "Unlock Folder" → Enter password → All `.encrypted` files decrypted
  - Files renamed back to `.md` extension
  - Content restored to original plaintext
  - Wrong password results in graceful failure (no corruption)
- **Expected Behavior**:
  - Files reappear in Obsidian's file explorer
  - Content immediately available for search and graph
  - Failed decryption leaves files in encrypted state

### 5.3 Cryptographic Security
- **Priority: Critical**
- **Functionality**:
  - AES-256-GCM authenticated encryption
  - PBKDF2 key derivation (100,000 iterations, SHA-256)
  - Random 16-byte salt per file
  - Random 12-byte IV per encryption operation
  - No password storage or persistence
- **Expected Behavior**:
  - Different files encrypted with same password produce different ciphertext
  - Decryption validates authenticity (GCM authentication tag)
  - Keys derived from passwords are cryptographically secure

### 5.4 User Interface Integration
- **Priority: High**
- **Functionality**:
  - Context menu entries for folders ("Lock Folder", "Unlock Folder")
  - Command palette commands for current file
  - Password modal with visibility toggle
  - Optional password confirmation on encryption
  - Success/error notifications (configurable)
- **Expected Behavior**:
  - UI elements appear only where applicable (folders vs files)
  - Password modals use password input type (hidden characters)
  - Clear feedback on operation success/failure

### 5.5 Settings and Configuration
- **Priority: Medium**
- **Functionality**:
  - Toggle: Require password confirmation on encryption (default: on)
  - Toggle: Show success/error notifications (default: on)
  - Settings persist across Obsidian sessions
- **Expected Behavior**:
  - Settings accessible via Obsidian's plugin settings panel
  - Changes take effect immediately

### 5.6 Error Handling and Safety
- **Priority: Critical**
- **Functionality**:
  - Atomic operations prevent partial encryption/corruption
  - Graceful failure on wrong password
  - Validation of encrypted file structure before decryption
  - Prevention of concurrent operations on same file
  - Clear error messages guide user recovery
- **Expected Behavior**:
  - File corruption impossible under normal operation
  - User never loses data due to plugin errors
  - Error messages distinguish between wrong password vs corruption vs permissions

## 6. Technical Requirements

### 6.1 System Architecture
- **Core Components**:
  - **Encryption Engine** (crypto-helper.ts): Web Crypto API wrapper
  - **Vault Handler** (vault-handler.ts): Obsidian Vault API abstraction
  - **Main Plugin** (main.ts): Command registration, event handling, orchestration
  - **UI Components**: Password modal, settings tab
- **Design Principles**:
  - Separation of concerns (crypto, file operations, UI separate)
  - Fail-safe: Operations either complete fully or not at all
  - No plaintext password storage
  - Stateless encryption (all metadata in encrypted file)

### 6.2 Integrations
- **Obsidian Vault API**:
  - `vault.read()`: Read file contents
  - `vault.modify()`: Update file contents atomically
  - `vault.rename()`: Rename files (change extension)
  - `vault.getFiles()`: Recursive folder traversal
- **Web Crypto API**:
  - `crypto.subtle.importKey()`: Import password as key material
  - `crypto.subtle.deriveKey()`: PBKDF2 key derivation
  - `crypto.subtle.encrypt()`: AES-GCM encryption
  - `crypto.subtle.decrypt()`: AES-GCM decryption
  - `crypto.getRandomValues()`: Generate random salt/IV

### 6.3 Performance Requirements
- **File Operations**:
  - Single file encrypt/decrypt: <100ms for typical note (5KB)
  - Folder operations: <5 seconds for 100 files
  - Large file handling: Support files up to 10MB
- **Memory**:
  - Current design: All file content in memory during operations
  - Acceptable for typical Obsidian notes (<1MB)
  - Large file optimization: Future consideration
- **Responsiveness**:
  - UI remains responsive during folder operations
  - Progress indication for operations >2 seconds

### 6.4 Security Requirements

#### Authentication and Authorization
- **Password-Based**: No username, password is sole authentication factor
- **No Password Storage**: Passwords never persisted to disk or settings
- **No Password Recovery**: By design, lost password = lost data

#### Data Protection
- **Encryption Strength**: AES-256 (256-bit keys)
- **Key Derivation**: PBKDF2, 100k iterations (OWASP minimum)
- **Salt/IV**: Unique per file, cryptographically random
- **Authentication**: AES-GCM provides authenticated encryption
- **Metadata Protection**: File structure visible, content encrypted

#### Security Testing Requirements
1. **Password Strength Validation** (REQUIRED BEFORE v1.0):
   - Minimum 12 characters OR entropy check
   - Warning for weak passwords
   - No default/placeholder passwords

2. **JSON Structure Validation** (REQUIRED BEFORE v1.0):
   - Validate `{salt, iv, data}` structure before decryption
   - Prevent crashes on corrupted/malformed files
   - Clear error messages on invalid structure

3. **Operation Atomicity** (REQUIRED BEFORE v1.0):
   - Decrypt content BEFORE renaming file
   - Get fresh file reference after rename
   - Rollback on failure

4. **Concurrent Operation Prevention** (REQUIRED BEFORE v1.0):
   - Track in-progress operations per file path
   - Block concurrent operations on same file
   - Clear locks on completion/error

#### Known Vulnerabilities (MUST FIX)
1. **Decrypt Order-of-Operations Bug** (main.ts:134-164)
   - **Severity**: CRITICAL - Data loss risk
   - **Issue**: File renamed before decryption completes
   - **Impact**: Wrong password → corrupted file with .md extension
   - **Fix**: Decrypt first, only rename on success

2. **Success Counting Inaccuracy** (main.ts:201)
   - **Severity**: HIGH - Misleading user feedback
   - **Issue**: `successCount++` even if operation failed
   - **Impact**: User thinks operation succeeded when it failed
   - **Fix**: Only increment on actual success, report failures

3. **No File Locking** (all operations)
   - **Severity**: MEDIUM - Race condition risk
   - **Issue**: Concurrent operations on same file possible
   - **Impact**: Undefined behavior, possible corruption
   - **Fix**: Track in-progress operations with `Set<string>`

### 6.5 Business Continuity Requirements

> **Note**: Folder Guard is a client-side plugin with no server infrastructure. BCP focuses on user data protection.

- **Recovery Time Objective (RTO)**: N/A (client-side, no service)
- **Recovery Point Objective (RPO)**: User's last backup
- **User Data Protection**:
  - Plugin never stores backups (user responsibility)
  - Atomic operations prevent mid-operation corruption
  - Recommend: Users back up vault before first use
  - Recommend: Test decrypt on copy before bulk operations

## 7. Implementation Phases

> **AI-Assisted Development Note**: Current implementation (v0.1.0) is feature-complete but requires security hardening before production release.

### Phase 1: Critical Security Fixes
- **Complexity**: Medium
- **Dependencies**: None (fixes to existing code)
- **Parallelizable Components**: All fixes can be implemented simultaneously
- **Key Deliverables**:
  - Fix decrypt order-of-operations bug
  - Add JSON validation before decryption
  - Add password strength validation
  - Fix success counting in folder operations
  - Add operation locking mechanism
- **Success Criteria**:
  - All critical bugs from security review fixed
  - Manual testing confirms no data loss scenarios
  - All error paths tested and validated
- **BCP Considerations**: Backup test vault before implementing fixes

### Phase 2: Code Quality and Documentation
- **Complexity**: Medium
- **Dependencies**: Phase 1 complete (stable codebase)
- **Parallelizable Components**: Documentation and code improvements can proceed in parallel
- **Key Deliverables**:
  - Add comprehensive JSDoc comments
  - Extract magic numbers to named constants
  - Improve error messages and user feedback
  - Add inline documentation of crypto choices
- **Success Criteria**:
  - All public methods have JSDoc
  - No magic numbers in crypto code
  - Error messages distinguish error types
- **BCP Considerations**: None (documentation-only)

### Phase 3: Testing and Validation
- **Complexity**: Medium
- **Dependencies**: Phases 1 & 2 complete
- **Parallelizable Components**: Test plan creation and manual testing can overlap
- **Key Deliverables**:
  - Comprehensive test plan document
  - Manual testing checklist
  - Edge case validation (large files, special chars, etc.)
  - Security testing (wrong password, corrupted files)
  - Performance validation (100+ file folders)
- **Success Criteria**:
  - All test scenarios pass
  - No data loss in any tested scenario
  - Performance meets requirements
- **BCP Considerations**: Test with backup copies, not production vaults

### Phase 4: Community Plugin Preparation
- **Complexity**: Medium
- **Dependencies**: Phase 3 complete (tested and validated)
- **Parallelizable Components**: GitHub setup and documentation can be done in parallel
- **Key Deliverables**:
  - Professional README.md with usage examples
  - CONTRIBUTING.md for community contributions
  - Security disclosure policy (SECURITY.md)
  - GitHub Actions CI/CD (build, lint)
  - Community plugin submission materials
  - Screenshot/demo vault for submission
- **Success Criteria**:
  - Repository meets Obsidian community standards
  - Documentation clear for non-technical users
  - CI/CD pipeline validates builds
  - Submission package ready
- **BCP Considerations**: None (preparation only)

### Phase 5: Community Plugin Submission
- **Complexity**: Simple
- **Dependencies**: Phase 4 complete
- **Parallelizable Components**: N/A (sequential submission process)
- **Key Deliverables**:
  - Submit plugin to Obsidian community plugin repository
  - Respond to review feedback
  - Address any required changes
- **Success Criteria**:
  - Plugin accepted into community directory
  - All reviewer feedback addressed
- **BCP Considerations**: None

## 8. User Experience

### 8.1 Core User Flows

#### Lock Folder Flow
1. User right-clicks folder in Obsidian file explorer
2. Selects "Lock Folder (Folder Guard)" from context menu
3. Password modal appears, user enters password
4. If "Confirm Password" enabled: Second modal for confirmation
5. Plugin encrypts all `.md` files recursively
6. Files renamed to `.encrypted`, disappear from graph
7. Success notification: "Locked 15 files in Personal Notes"

#### Unlock Folder Flow
1. User right-clicks folder containing `.encrypted` files
2. Selects "Unlock Folder (Folder Guard)" from context menu
3. Password modal appears, user enters password
4. Plugin decrypts all `.encrypted` files recursively
5. Files renamed to `.md`, reappear in file explorer
6. Success notification: "Unlocked 15 files in Personal Notes"

#### Error Flow: Wrong Password
1. User attempts to unlock folder with wrong password
2. Decryption fails (GCM authentication tag mismatch)
3. Error notification: "Failed to decrypt X files (Wrong password?)"
4. Files remain in encrypted state (no corruption)
5. User can retry with correct password

#### Edge Case: Partial Folder (Mixed Extensions)
1. Folder contains both `.md` and `.encrypted` files
2. Lock operation: Only encrypts `.md` files (skips `.encrypted`)
3. Unlock operation: Only decrypts `.encrypted` files (skips `.md`)
4. Notification reflects actual files processed

### 8.2 Interface Requirements

#### Password Modal
- **Style**: Native Obsidian modal styling
- **Fields**:
  - Password input (type="password", hidden characters)
  - Optional: "Show password" toggle (future enhancement)
- **Actions**:
  - "Submit" button (primary action)
  - Enter key submits
  - Empty password validation before submit
- **Accessibility**:
  - Proper focus management
  - Keyboard navigation support
  - Screen reader compatibility (label associations)

#### Context Menus
- **Folder Context Menu**:
  - "Lock Folder (Folder Guard)" - Icon: lock
  - "Unlock Folder (Folder Guard)" - Icon: unlock
  - Appears only for folders
- **File Context Menu** (future):
  - "Lock File" / "Unlock File"
  - Appears only for `.md` or `.encrypted` files

#### Settings Panel
- **Location**: Obsidian Settings → Community Plugins → Folder Guard
- **Options**:
  - Toggle: "Confirm Password" (default: on)
    - Description: "Require entering password twice when encrypting"
  - Toggle: "Show Notifications" (default: on)
    - Description: "Show success/error messages"
- **Style**: Standard Obsidian settings component styling

#### Notifications
- **Success Messages**:
  - "Locked X files in [folder name]"
  - "Unlocked X files in [folder name]"
- **Error Messages**:
  - "Failed to decrypt [file] (Wrong password?)"
  - "Failed to encrypt [file] (Permission denied?)"
  - "Operation already in progress on [file]"
- **Style**: Native Obsidian Notice component
- **Duration**: 5 seconds (auto-dismiss)

## 9. Technical Considerations

### 9.1 Technology Stack
- **Language**: TypeScript 4.7.4
- **Runtime**: Obsidian Plugin API (Electron-based)
- **Build System**: esbuild 0.17.3
- **Cryptography**: Web Crypto API (window.crypto.subtle)
- **UI Framework**: Obsidian's native components (Modal, Setting, Notice)

### 9.2 Technical Dependencies
- **Obsidian**: Minimum version 0.15.0
- **Node.js**: v16+ (development only)
- **TypeScript**: 4.7.4
- **esbuild**: 0.17.3
- **@types/node**: ^16.11.6
- **Platform**: Desktop and mobile (Web Crypto API available on both)

### 9.3 Environment Separation Assessment

**Development/Production Environment Separation Required?** No

**Justification:**
- **Client-side plugin**: Runs in user's local Obsidian installation
- **No server component**: No persistent state outside user's vault
- **Testing isolation**: Development uses separate test vaults, not shared infrastructure
- **No multi-user**: Each user has independent plugin instance
- **Rollback**: User can disable plugin or revert to previous version via Obsidian's plugin manager

**Risk Mitigation:**
- **Test vaults**: All development/testing uses copy of vault, never production data
- **Version control**: Git tracks all changes, easy rollback
- **Manual review**: All changes reviewed before commit
- **User control**: Users control when to update plugin version

### 9.4 Disaster Recovery Plan

**Recovery Objectives:**
- **RTO**: N/A (client-side, no service to recover)
- **RPO**: User's vault backup schedule (plugin doesn't manage backups)

**User Data Protection Strategy:**
- **Pre-Use Backup**: Documentation strongly recommends backing up vault before first use
- **Test First**: Documentation includes testing instructions on vault copy
- **Atomic Operations**: Implementation prevents partial encryption/corruption
- **No Auto-Backup**: Plugin intentionally doesn't create backups (user's Obsidian Sync, git, or backup tool handles this)

**Plugin Recovery Procedures:**
1. **Plugin Corruption**: User reinstalls via Obsidian's plugin manager
2. **Settings Corruption**: User resets to default via settings panel
3. **File Corruption** (encrypted files):
   - If user has backup: Restore from backup
   - If no backup and forgot password: Data unrecoverable (by design)
   - If corruption detected: Error message guides user to backup

**Critical Path:**
- Plugin source code in GitHub (public, versioned)
- Community plugin directory maintains approved versions
- User's vault data independent of plugin state

## 10. Initial Implementation Focus

**Current Status**: v0.1.0 feature-complete implementation exists, built by Antigravity (Google).

**Immediate Focus**: Security hardening and production readiness (Phase 1-3)

### 1. Fix Decrypt Order-of-Operations Bug
- **File**: src/main.ts, lines 134-164
- **Implementation**:
  ```typescript
  async decryptFile(file: TFile, password: string): Promise<boolean> {
      try {
          // 1. Read and parse encrypted file
          const content = await this.vaultHandler.readFile(file);
          const json = this.validateEncryptedStructure(content);

          // 2. Decrypt content FIRST (fail early if wrong password)
          const decrypted = await CryptoHelper.decrypt(/*...*/);

          // 3. Only after successful decryption, rename and write
          const newPath = file.path.replace(/\.encrypted$/, '.md');
          await this.vaultHandler.renameFile(file, newPath);

          // 4. Get fresh file reference after rename
          const freshFile = this.vault.getAbstractFileByPath(newPath) as TFile;
          await this.vaultHandler.modifyFile(freshFile, decrypted);

          return true;
      } catch (e) {
          console.error(`Failed to decrypt ${file.name}`, e);
          return false;
      }
  }
  ```
- **Testing**: Verify wrong password doesn't corrupt files

### 2. Add JSON Validation
- **File**: src/main.ts, new method
- **Implementation**:
  ```typescript
  private validateEncryptedStructure(content: string): EncryptedData {
      let json: any;
      try {
          json = JSON.parse(content);
      } catch {
          throw new Error('Invalid encrypted file format: not valid JSON');
      }

      if (!json.salt || !json.iv || !json.data) {
          throw new Error('Invalid encrypted file format: missing required fields');
      }

      if (typeof json.salt !== 'string' ||
          typeof json.iv !== 'string' ||
          typeof json.data !== 'string') {
          throw new Error('Invalid encrypted file format: invalid field types');
      }

      return json as EncryptedData;
  }
  ```
- **Testing**: Test with corrupted/malformed files

### 3. Add Password Strength Validation
- **File**: src/main.ts or new src/password-validator.ts
- **Implementation**:
  ```typescript
  class PasswordValidator {
      static readonly MIN_LENGTH = 12;

      static validate(password: string): ValidationResult {
          if (password.length < this.MIN_LENGTH) {
              return {
                  valid: false,
                  message: `Password must be at least ${this.MIN_LENGTH} characters`
              };
          }

          // Optional: Check entropy or common passwords
          if (this.isCommonPassword(password)) {
              return {
                  valid: false,
                  message: 'This password is too common, please choose a stronger one'
              };
          }

          return { valid: true };
      }
  }
  ```
- **UX**: Show warning modal if password weak, allow override with "Use Anyway"

### 4. Fix Success Counting
- **File**: src/main.ts, processFolder method
- **Implementation**:
  ```typescript
  async processFolder(folder: TFolder, password: string, encrypt: boolean) {
      const files = await this.vaultHandler.getFiles(folder);
      const targetExtension = encrypt ? 'md' : 'encrypted';
      const targetFiles = files.filter(f => f.extension === targetExtension);

      let successCount = 0;
      let failureCount = 0;

      for (const f of targetFiles) {
          const success = encrypt
              ? await this.encryptFile(f, password)
              : await this.decryptFile(f, password);

          if (success) successCount++;
          else failureCount++;
      }

      if (this.settings.showNotices) {
          const action = encrypt ? "Locked" : "Unlocked";
          const message = failureCount > 0
              ? `${action} ${successCount} files, ${failureCount} failed`
              : `${action} ${successCount} files`;
          new Notice(message);
      }
  }
  ```
- **Testing**: Verify count accuracy with intentional failures

### 5. Add Operation Locking
- **File**: src/main.ts
- **Implementation**:
  ```typescript
  export default class FolderGuard extends Plugin {
      private inProgress = new Set<string>();

      private async lockOperation<T>(
          path: string,
          operation: () => Promise<T>
      ): Promise<T | null> {
          if (this.inProgress.has(path)) {
              new Notice('Operation already in progress on this file');
              return null;
          }

          this.inProgress.add(path);
          try {
              return await operation();
          } finally {
              this.inProgress.delete(path);
          }
      }

      async encryptFile(file: TFile, password: string): Promise<boolean> {
          return this.lockOperation(file.path, async () => {
              // existing encrypt logic
          }) ?? false;
      }
  }
  ```
- **Testing**: Attempt concurrent operations on same file

## 11. Future Considerations

### 11.1 Enhanced Security Features
- **Key File Support**: Optional key file in addition to password
- **Multi-Factor**: Integration with hardware keys (YubiKey)
- **Key Rotation**: Change encryption password without re-encrypting
- **Audit Log**: Track all lock/unlock operations

### 11.2 Performance Optimizations
- **Streaming Encryption**: Handle large files without loading entire content
- **Progress Indicators**: Show progress for large folder operations
- **Parallel Processing**: Encrypt multiple files concurrently
- **Caching**: Cache derived keys for batch operations (with timeout)

### 11.3 User Experience Enhancements
- **Quick Unlock**: Temporary unlock with auto-lock on idle
- **Folder Icons**: Visual indicators for encrypted folders
- **Password Manager Integration**: Integrate with 1Password, Bitwarden
- **Encrypted Attachments**: Support images, PDFs, other file types

### 11.4 Advanced Features
- **Shared Folders**: Asymmetric encryption for team vaults
- **Encrypted Search**: Search encrypted content without full decryption
- **File Metadata Encryption**: Hide folder structure, file names
- **Export/Import**: Encrypted vault sections portable to other systems

## 12. Success Criteria

The project will be considered successful when:

1. **Security**: All critical bugs from security review are fixed
2. **Reliability**: Zero data loss in comprehensive testing (1000+ operations)
3. **Performance**: Folder operations complete in <5s for 100 files
4. **Usability**: Users can complete encrypt/decrypt flow with <3 clicks
5. **Quality**: Code has comprehensive documentation and clear error handling
6. **Testing**: All edge cases validated (wrong password, corrupted files, concurrent ops)
7. **Compliance**: Plugin meets Obsidian community standards
8. **Publication**: Accepted into Obsidian community plugin directory
9. **User Documentation**: README includes clear usage instructions and security warnings
10. **Maintainability**: GitHub repository with CI/CD, contribution guidelines, security policy

## 13. Development Approach

> **AI-Assisted Development Model**: Claude Code with human oversight at security checkpoints.

### Complexity-Based Milestones

| Milestone | Complexity | Dependencies | Deliverables | Success Criteria |
|-----------|------------|--------------|--------------|------------------|
| M1: Critical Fixes | Medium | None | 5 security fixes | All critical bugs fixed, manual tests pass |
| M2: Code Quality | Medium | M1 | Documentation, refactoring | JSDoc complete, no magic numbers |
| M3: Testing | Medium | M1, M2 | Test plan, validation | All test scenarios pass |
| M4: Community Prep | Medium | M3 | GitHub setup, docs | Submission package ready |
| M5: Publication | Simple | M4 | Submission, review response | Plugin accepted |

### Development Velocity Factors
- **Rapid Iteration**: AI can implement fixes in minutes, not hours
- **Parallel Development**: Documentation and testing can overlap with fixes
- **Human Checkpoints**: Security review required before each phase completion
- **Continuous Integration**: GitHub Actions validates builds automatically

## 14. Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Data loss from bugs | High | Medium | Comprehensive testing, atomic operations, user backups |
| Weak encryption | High | Low | Use standard algorithms, security review, public code |
| Password forgotten | Medium | High | Clear documentation, no recovery by design |
| Community rejection | Medium | Low | Follow all standards, thorough documentation, responsive to feedback |
| Breaking Obsidian API changes | Medium | Low | Pin to minimum API version, monitor Obsidian updates |
| User misconfiguration | Low | Medium | Sensible defaults, clear settings descriptions |
| Performance issues | Low | Low | Test with large folders, optimize if needed |

## 15. Approval and Next Steps

Upon approval of this PRD, the next steps are:

1. **Complete Task 0**: Verify project structure compliance
2. **Generate Implementation Tasks**: Create task files for Phases 1-5
3. **Security Review Gate**: Human review before starting Phase 1
4. **Implement Phase 1**: Fix all critical security bugs
5. **Phase 1 Testing Gate**: Human verification of security fixes
6. **Implement Phases 2-3**: Code quality and testing
7. **Phase 3 Testing Gate**: Comprehensive test validation
8. **Implement Phase 4**: Community plugin preparation
9. **Final Review Gate**: Human approval before submission
10. **Submit to Obsidian**: Community plugin submission

## 16. Document Hierarchy

The Folder Guard plugin is defined through the following document hierarchy:

1. **Project Brief** (docs/project_brief.md) - Original concept and vision
   - Problem statement and solution overview
   - Initial feature set and user workflows
   - Built by Antigravity (Google)

2. **This PRD** (docs/PRD.md) - Complete implementation requirements
   - Comprehensive requirements and technical specifications
   - Security review findings integrated
   - Community plugin submission requirements
   - Implementation phases and success criteria

3. **Security Review Report** (to be created)
   - Detailed findings from initial code review
   - Vulnerability descriptions and risk assessments
   - Remediation requirements and testing procedures

4. **Test Plan** (to be created in Phase 3)
   - Comprehensive test scenarios
   - Edge case validation procedures
   - Performance benchmarking methodology

5. **Community Plugin Submission Package** (to be created in Phase 4)
   - README.md for GitHub
   - SECURITY.md with disclosure policy
   - CONTRIBUTING.md for community contributions

All implementation decisions should reference this hierarchy to ensure alignment with security requirements and community standards.
