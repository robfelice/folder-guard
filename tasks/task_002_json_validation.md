# Task 002: Add JSON Validation and Error Handling

## Overview
**Status:** Not Started
**Complexity:** Simple (S)
**Priority:** CRITICAL
**Phase:** Phase 1 - Critical Security Fixes
**Dependencies:** Task 0 (Complete)
**Estimated Effort:** 1-2 hours
**Actual Effort:** TBD
**Last Updated:** 06/01/2026

## Objective

Add robust validation of encrypted file JSON structure before attempting decryption to prevent crashes from corrupted or malformed `.encrypted` files.

## Problem Statement

**Current Behavior** (main.ts:142-146):
```typescript
const json = JSON.parse(content);  // Can throw on invalid JSON
const salt = new Uint8Array(CryptoHelper.base64ToArrayBuffer(json.salt));  // Crashes if salt missing
const iv = new Uint8Array(CryptoHelper.base64ToArrayBuffer(json.iv));      // Crashes if iv missing
const ciphertext = CryptoHelper.base64ToArrayBuffer(json.data);            // Crashes if data missing
```

**Issues:**
- No validation that JSON contains required fields
- No type checking on field values
- Crashes with unhelpful error messages
- User can't distinguish between wrong password vs corrupted file

## Implementation Requirements

### 1. Create Validation Interface

**File:** `src/main.ts` or new `src/types.ts`

```typescript
interface EncryptedFileData {
    salt: string;  // Base64-encoded
    iv: string;    // Base64-encoded
    data: string;  // Base64-encoded ciphertext
}
```

### 2. Implement Validation Method

**File:** `src/main.ts`

```typescript
private validateEncryptedStructure(content: string): EncryptedFileData {
    // Step 1: Parse JSON
    let json: any;
    try {
        json = JSON.parse(content);
    } catch (e) {
        throw new Error('Invalid encrypted file: Not valid JSON');
    }

    // Step 2: Check required fields exist
    if (!json.salt || !json.iv || !json.data) {
        const missing = [];
        if (!json.salt) missing.push('salt');
        if (!json.iv) missing.push('iv');
        if (!json.data) missing.push('data');
        throw new Error(`Invalid encrypted file: Missing required fields: ${missing.join(', ')}`);
    }

    // Step 3: Check field types
    if (typeof json.salt !== 'string') {
        throw new Error('Invalid encrypted file: salt must be a string');
    }
    if (typeof json.iv !== 'string') {
        throw new Error('Invalid encrypted file: iv must be a string');
    }
    if (typeof json.data !== 'string') {
        throw new Error('Invalid encrypted file: data must be a string');
    }

    // Step 4: Validate Base64 format
    if (!this.isValidBase64(json.salt)) {
        throw new Error('Invalid encrypted file: salt is not valid Base64');
    }
    if (!this.isValidBase64(json.iv)) {
        throw new Error('Invalid encrypted file: iv is not valid Base64');
    }
    if (!this.isValidBase64(json.data)) {
        throw new Error('Invalid encrypted file: data is not valid Base64');
    }

    return json as EncryptedFileData;
}

private isValidBase64(str: string): boolean {
    try {
        // Attempt to decode - will throw if invalid
        window.atob(str);
        return true;
    } catch {
        return false;
    }
}
```

### 3. Use Validation in decryptFile

**Update main.ts decryptFile():**

```typescript
async decryptFile(file: TFile, password: string): Promise<boolean> {
    try {
        if (file.extension !== 'encrypted') {
            return false;
        }

        const content = await this.vaultHandler.readFile(file);

        // Validate structure BEFORE attempting decryption
        const json = this.validateEncryptedStructure(content);

        // Now safe to use json.salt, json.iv, json.data
        const salt = new Uint8Array(CryptoHelper.base64ToArrayBuffer(json.salt));
        const iv = new Uint8Array(CryptoHelper.base64ToArrayBuffer(json.iv));
        const ciphertext = CryptoHelper.base64ToArrayBuffer(json.data);

        // ... rest of decryption logic

    } catch (e) {
        console.error(`Failed to decrypt ${file.name}`, e);

        // Improved error messages
        let userMessage = `Failed to decrypt ${file.name}`;
        if (e.message.includes('Invalid encrypted file')) {
            userMessage = `${file.name} appears corrupted or modified`;
        } else if (e.message.includes('decrypt')) {
            userMessage = `Failed to decrypt ${file.name} (Wrong password?)`;
        }

        if (this.settings.showNotices) {
            new Notice(userMessage);
        }
        return false;
    }
}
```

## Testing Requirements

1. **Valid Encrypted File**:
   - Encrypt a file normally
   - Decrypt it
   - Verify: Works without errors

2. **Missing Fields**:
   - Manually create `.encrypted` file: `{"salt": "test", "iv": "test"}`
   - Attempt decrypt
   - Verify: Clear error "Missing required fields: data"

3. **Wrong Types**:
   - Create file: `{"salt": 123, "iv": "test", "data": "test"}`
   - Attempt decrypt
   - Verify: Clear error "salt must be a string"

4. **Invalid Base64**:
   - Create file: `{"salt": "not-base64!", "iv": "test", "data": "test"}`
   - Attempt decrypt
   - Verify: Clear error "salt is not valid Base64"

5. **Corrupted JSON**:
   - Create file with broken JSON: `{"salt": "test", "iv": `
   - Attempt decrypt
   - Verify: Clear error "Not valid JSON"

6. **Wrong Password**:
   - Valid encrypted file, wrong password
   - Verify: Error message distinguishes from corruption

## Success Criteria

- [ ] `validateEncryptedStructure()` method implemented
- [ ] All required fields checked
- [ ] Type validation for all fields
- [ ] Base64 validation for encoded fields
- [ ] Clear error messages for each failure type
- [ ] User can distinguish corruption from wrong password
- [ ] All test scenarios pass
- [ ] No crashes on malformed files

## Error Message Improvements

**Before:**
- "Failed to decrypt file.md (Wrong password?)"

**After:**
- "file.md appears corrupted or modified" (structure invalid)
- "Failed to decrypt file.md (Wrong password?)" (decryption failed)
- "file.md: Invalid encrypted file format" (JSON invalid)

## Dependencies

- **Requires**: Task 0 complete
- **Works with**: Task 001 (improved error handling in decrypt)
- **Blocks**: None (independent improvement)

## Risk Assessment

- **Implementation Risk**: LOW - Simple validation logic
- **Testing Risk**: LOW - Easy to create test cases
- **User Impact**: HIGH - Prevents crashes, better UX

## Notes

- Keep error messages user-friendly but informative
- Log detailed errors to console for debugging
- Consider adding file integrity check (hash) in future
- Base64 validation prevents crashes in atob()

## Completion Checklist

- [ ] Validation method implemented
- [ ] Error messages improved
- [ ] All test cases pass
- [ ] Code reviewed
- [ ] Inline documentation added
- [ ] Manual testing with corrupted files
- [ ] Committed with descriptive message

---

**Version:** 1.0
**Created:** 06/01/2026
**Security Review Reference:** Section 3 "Edge Cases" Issue #8
