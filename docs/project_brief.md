# Project Brief: Folder Guard

## Project Overview

**Project Name**: Folder Guard
**Type**: Obsidian Community Plugin
**Purpose**: Selective folder-level encryption for Obsidian vaults
**Target Platform**: Obsidian (cross-platform)

## Problem Statement

Obsidian users need a way to encrypt specific folders within their vaults to protect sensitive content while maintaining normal workflow with unencrypted files. Current solutions either encrypt entire vaults (too broad) or individual notes/text blocks (too granular), with no solution providing true folder-level encryption at rest.

## Solution Overview

Folder Guard is an Obsidian plugin that provides:
- **Selective folder encryption** - Encrypt specific folders on demand
- **Transparent workflow** - Lock/unlock folders with password prompts
- **True encryption at rest** - Files encrypted on disk using AES-256
- **Seamless integration** - Works within Obsidian's existing UI and workflow

## Core Requirements

### Functional Requirements
- Encrypt/decrypt entire folders with a single action
- Password-based protection with secure key derivation (PBKDF2)
- Encrypted files hidden from Obsidian's normal operations
- Right-click context menu for folder operations
- Command palette integration
- Settings panel for configuration

### Technical Requirements
- **Encryption**: AES-256 with secure key derivation
- **Platform**: TypeScript/JavaScript for Obsidian plugin ecosystem
- **File Handling**: Work with Obsidian's Vault API
- **UI Integration**: Command palette, context menus, modal dialogs
- **Metadata**: Store encryption metadata without exposing content

### Security Requirements
- Strong encryption algorithms (AES-256, PBKDF2)
- No password persistence in memory
- Secure deletion of temporary data
- Protection against common attack vectors

## User Workflow

### Primary Use Cases
1. **Lock Folder**: Right-click folder → "Lock Folder" → Enter password → Files encrypted with .encrypted extension
2. **Unlock Folder**: Right-click encrypted folder → "Unlock Folder" → Enter password → Files decrypted and available
3. **Normal Operation**: Work with unencrypted folders/files as usual

### User Experience Goals
- Minimal learning curve
- Non-intrusive to normal Obsidian workflow
- Clear visual indicators for encrypted vs unencrypted folders
- Fast operations for typical folder sizes

## Technical Architecture

### Core Components
- **Encryption Engine**: AES-256 encryption/decryption with PBKDF2 key derivation
- **File Operations**: Batch encrypt/decrypt files in target folder
- **UI Integration**: Context menus, command palette entries, modal dialogs
- **Metadata Management**: Track encryption state and metadata
- **Settings**: Configuration panel for user preferences

### Technology Stack
- **Language**: TypeScript/JavaScript
- **Framework**: Obsidian Plugin API
- **Cryptography**: Web Crypto API (browser-native)
- **Build System**: Standard Obsidian plugin build process

## Success Criteria

### MVP Success Metrics
- Successfully encrypt/decrypt folders containing various file types
- Encrypted files completely hidden from Obsidian's search and graph
- Password protection prevents unauthorized access
- Performance acceptable for folders up to 100MB
- Zero data loss during encryption/decryption operations

### User Acceptance Criteria
- Users can protect sensitive folders without affecting their normal workflow
- Clear, intuitive UI that requires minimal explanation
- Fast enough for daily use scenarios
- Reliable operation across different operating systems

## Project Phases

### Phase 1: Core Engine (MVP)
- Implement encryption/decryption functionality
- Basic file operations (encrypt folder, decrypt folder)
- Command palette integration
- Simple password prompts

### Phase 2: UI Integration
- Right-click context menus for folders
- Visual indicators for encrypted folders
- Settings panel with user preferences
- Error handling and user feedback

### Phase 3: Enhanced Features
- Batch operations optimization
- Progress indicators for large folders
- Advanced configuration options
- Security auditing and testing

### Phase 4: Polish & Distribution
- Comprehensive testing across platforms
- Documentation and user guides
- Community plugin store submission
- User feedback integration

## Constraints and Limitations

### Technical Constraints
- Must work within Obsidian's plugin security model
- Limited to Web Crypto API capabilities
- Cannot modify Obsidian's core file watching system
- Must handle Obsidian Sync considerations

### Design Constraints
- No password recovery by design (security over convenience)
- Encrypted files must be completely opaque to Obsidian
- Cannot provide transparent access (decrypt-on-demand)
- Plugin size and performance limitations

### User Constraints
- Requires password management by user
- Folders must be fully unlocked for access (no partial access)
- Encryption/decryption operations require user action

## Risk Assessment

### Technical Risks
- **Web Crypto API limitations** - Mitigation: Use proven crypto patterns
- **File corruption during encryption** - Mitigation: Atomic operations, backup validation
- **Performance with large folders** - Mitigation: Progress indicators, chunked operations

### Security Risks
- **Password compromise** - Mitigation: Strong key derivation, no password storage
- **Metadata leakage** - Mitigation: Minimal metadata storage
- **Side-channel attacks** - Mitigation: Follow security best practices

### Project Risks
- **Obsidian API changes** - Mitigation: Follow plugin development best practices
- **User adoption** - Mitigation: Focus on intuitive UX
- **Maintenance burden** - Mitigation: Clean, well-documented code

## References

### Prior Art Analysis
- **Cryptsidian**: Whole vault encryption (too broad)
- **Meld Encrypt**: Text-level encryption (too granular)
- **Password Protection plugins**: UI-only protection (insufficient security)
- **File Encryption Tool PRD**: Security model and encryption approach reference

### Technical References
- Obsidian Plugin API Documentation
- Web Crypto API Specifications
- OWASP Cryptographic Guidelines
- Obsidian Community Plugin Standards

## Next Steps

1. **Project Setup**: Initialize with governance standards and bootstrap scripts
2. **Architecture Design**: Detailed technical design and API planning
3. **Prototype Development**: Build core encryption functionality
4. **Integration Testing**: Test with real Obsidian vaults
5. **User Testing**: Gather feedback on workflow and UX
6. **Community Review**: Prepare for plugin store submission

---

**Document Version**: 1.0
**Created**: 2025-09-29
**Owner**: Development Team
**Review Date**: TBD