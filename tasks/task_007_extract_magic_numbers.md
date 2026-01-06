# Task 007: Extract Magic Numbers to Named Constants

## Overview
**Status:** Not Started | **Complexity:** Simple (S) | **Priority:** MEDIUM
**Phase:** Phase 2 - Code Quality | **Dependencies:** Task 0
**Estimated Effort:** 1 hour | **Last Updated:** 06/01/2026

## Objective
Replace all magic numbers with well-documented named constants.

## Changes Required

### crypto-helper.ts
```typescript
export class CryptoHelper {
    // Algorithm Configuration
    private static readonly ALGORITHM = 'AES-GCM';
    private static readonly KDF_ALGORITHM = 'PBKDF2';
    private static readonly HASH_ALGORITHM = 'SHA-256';

    // Key Derivation Parameters
    private static readonly ITERATIONS = 100000;  // OWASP recommended minimum
    private static readonly KEY_LENGTH = 256;     // AES-256 (256-bit keys)

    // Cryptographic Material Sizes
    private static readonly SALT_LENGTH = 16;     // 128-bit salt for PBKDF2
    private static readonly IV_LENGTH = 12;       // 96-bit IV for AES-GCM (recommended)

    static async generateSalt(): Promise<Uint8Array> {
        return window.crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
    }

    static async encrypt(data: string, key: CryptoKey) {
        const iv = window.crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
        // ...
    }
}
```

### password-validator.ts (if created in Task 003)
```typescript
export class PasswordValidator {
    static readonly MIN_LENGTH = 12;           // Minimum password characters
    static readonly MIN_ENTROPY = 3.0;         // Bits per character
    static readonly REPEAT_THRESHOLD = 4;      // Max repeated consecutive chars
    // ...
}
```

### Other Files
- Review main.ts for any hardcoded numbers
- Check for timeout values, retry counts, etc.

## Documentation
Each constant should have a comment explaining:
- Why this specific value
- Relevant standards or recommendations
- Implications of changing it

## Success Criteria
- [ ] All magic numbers extracted
- [ ] Constants documented
- [ ] Code more readable
- [ ] No functional changes (same behavior)

---
**Version:** 1.0 | **Created:** 06/01/2026
**Security Review:** Section 4 "Code Quality" Issue #2
