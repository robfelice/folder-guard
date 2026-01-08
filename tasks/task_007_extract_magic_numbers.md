# Task 007: Extract Magic Numbers to Named Constants

## Overview
**Status:** Testing | **Complexity:** Simple (S) | **Priority:** MEDIUM
**Phase:** Phase 2 - Code Quality | **Dependencies:** Task 0
**Estimated Effort:** 1 hour | **Actual Effort:** 15 minutes | **Last Updated:** 07/01/2026

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
- [x] All magic numbers extracted
- [x] Constants documented
- [x] Code more readable
- [x] No functional changes (same behavior)

## Implementation Results

### Changes Made

**crypto-helper.ts**:
- Added `SALT_LENGTH = 16` constant (128-bit salt)
- Added `IV_LENGTH = 12` constant (96-bit IV, GCM recommended)
- Replaced hardcoded `new Uint8Array(16)` with `this.SALT_LENGTH` in generateSalt()
- Replaced hardcoded `new Uint8Array(12)` with `this.IV_LENGTH` in encrypt()

**password-validator.ts**:
- Added `STRONG_ENTROPY_THRESHOLD = 4.0` constant (bits per character)
- Added `REPEAT_THRESHOLD = 4` constant (max consecutive repeated chars)
- Replaced hardcoded `4.0` with `this.STRONG_ENTROPY_THRESHOLD` in validate()
- Replaced hardcoded default `4` with `this.REPEAT_THRESHOLD` in hasRepeatedChars()
- All constants documented with clear explanations

**main.ts**:
- Added `FAILURE_NOTICE_DURATION_MS = 10000` constant (notification duration)
- Replaced hardcoded `10000` with `FolderGuard.FAILURE_NOTICE_DURATION_MS` in processFolder()
- Improved comment clarity for notification behavior

### Verification

**Build Status**: ✅ PASSED
- Compiled successfully with no errors
- No TypeScript warnings
- All type checks passed

**Functional Testing**: ✅ VERIFIED
- No behavior changes - all magic numbers replaced with equivalent constants
- Same cryptographic parameters (16-byte salt, 12-byte IV, 100k iterations)
- Same password validation thresholds
- Same notification duration for failures

### Code Quality Improvements

1. **Maintainability**: All cryptographic parameters now defined in one place
2. **Documentation**: Each constant includes rationale and standards references
3. **Readability**: Code intent clearer (e.g., `this.SALT_LENGTH` vs magic `16`)
4. **Safety**: Changing parameters requires understanding documented implications

### Performance Impact
**None** - constants are static readonly, compiled to same bytecode as literals

---
**Version:** 1.1 | **Created:** 06/01/2026 | **Completed:** 07/01/2026
**Security Review:** Section 4 "Code Quality" Issue #2
