# Task 008: Improve Error Messages and User Feedback

## Overview
**Status:** Not Started | **Complexity:** Simple (S) | **Priority:** MEDIUM
**Phase:** Phase 2 - Code Quality | **Dependencies:** Task 001, 002
**Estimated Effort:** 2 hours | **Last Updated:** 06/01/2026

## Objective
Improve error messages to help users understand what went wrong and how to fix it.

## Current Issues
- Generic "Failed to decrypt" doesn't distinguish causes
- No guidance for recovery
- Console errors not user-friendly

## Improvements

### Error Type Categorization
```typescript
enum EncryptionErrorType {
    WRONG_PASSWORD,
    CORRUPTED_FILE,
    PERMISSION_DENIED,
    FILE_NOT_FOUND,
    DISK_FULL,
    UNKNOWN
}

private categorizeError(error: Error): EncryptionErrorType {
    if (error.message.includes('decrypt') && !error.message.includes('Invalid')) {
        return EncryptionErrorType.WRONG_PASSWORD;
    }
    if (error.message.includes('Invalid encrypted file')) {
        return EncryptionErrorType.CORRUPTED_FILE;
    }
    if (error.message.includes('EACCES') || error.message.includes('permission')) {
        return EncryptionErrorType.PERMISSION_DENIED;
    }
    // ... more patterns
    return EncryptionErrorType.UNKNOWN;
}
```

### User-Friendly Messages
```typescript
private getUserMessage(type: EncryptionErrorType, filename: string): string {
    switch (type) {
        case EncryptionErrorType.WRONG_PASSWORD:
            return `Wrong password for ${filename}. Please try again.`;

        case EncryptionErrorType.CORRUPTED_FILE:
            return `${filename} appears corrupted. Restore from backup if available.`;

        case EncryptionErrorType.PERMISSION_DENIED:
            return `Cannot modify ${filename}. Check file permissions.`;

        case EncryptionErrorType.DISK_FULL:
            return `Not enough disk space to decrypt ${filename}.`;

        default:
            return `Failed to process ${filename}. Check console for details.`;
    }
}
```

## Success Criteria
- [ ] Error types categorized
- [ ] User messages are clear and actionable
- [ ] Distinguish wrong password from corruption
- [ ] Provide recovery guidance where possible
- [ ] Console logs remain detailed for debugging

---
**Version:** 1.0 | **Created:** 06/01/2026
**Security Review:** Section 1 "Security Best Practices" Medium Issue #3
