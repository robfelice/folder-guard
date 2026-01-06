# Task 001: Fix Decrypt Order-of-Operations Bug

## Overview
**Status:** Not Started
**Complexity:** Medium (M)
**Priority:** CRITICAL
**Phase:** Phase 1 - Critical Security Fixes
**Dependencies:** Task 0 (Complete)
**Estimated Effort:** 2-3 hours
**Actual Effort:** TBD
**Last Updated:** 06/01/2026

## Objective

Fix the critical data loss bug in `decryptFile()` where the file is renamed before decryption completes, potentially resulting in corrupted files with `.md` extension if the password is wrong or decryption fails.

## Problem Statement

**Current Dangerous Behavior** (main.ts:134-164):
```typescript
// 1. Read encrypted content
const content = await this.vaultHandler.readFile(file);
const json = JSON.parse(content);

// 2. Derive key and attempt decrypt
const key = await CryptoHelper.deriveKey(password, salt);
const decrypted = await CryptoHelper.decrypt(ciphertext, iv, key);

// 3. RENAME FIRST (WRONG!) ⚠️
const newPath = file.path.replace(/\.encrypted$/, '.md');
await this.vaultHandler.renameFile(file, newPath);

// 4. THEN write content
await this.vaultHandler.modifyFile(file, decrypted);
```

**What Can Go Wrong:**
1. Wrong password → Decryption throws → File already renamed to `.md` with encrypted JSON inside
2. Disk full/permission error on write → `.md` file with encrypted content
3. Stale file reference after rename → Write fails but file already renamed

**Impact:** DATA LOSS - User has `.md` file containing encrypted JSON, original is gone

## Implementation Requirements

### Required Changes

1. **Reverse Operation Order**:
   - Decrypt content FIRST (fail early if wrong password)
   - Only rename file after successful decryption
   - Get fresh file reference after rename
   - Then write decrypted content

2. **Add Error Handling**:
   - Catch decryption errors before any file operations
   - Return success boolean to caller
   - Don't modify file system if decryption fails

3. **Update Method Signature**:
   ```typescript
   async decryptFile(file: TFile, password: string): Promise<boolean>
   ```

### Implementation Details

**New Correct Order**:
```typescript
async decryptFile(file: TFile, password: string): Promise<boolean> {
    try {
        if (file.extension !== 'encrypted') {
            return false;
        }

        // Step 1: Read and parse (no file system changes yet)
        const content = await this.vaultHandler.readFile(file);
        const json = JSON.parse(content);

        // Step 2: Decrypt FIRST (fail early if wrong password)
        const salt = new Uint8Array(CryptoHelper.base64ToArrayBuffer(json.salt));
        const iv = new Uint8Array(CryptoHelper.base64ToArrayBuffer(json.iv));
        const ciphertext = CryptoHelper.base64ToArrayBuffer(json.data);

        const key = await CryptoHelper.deriveKey(password, salt);
        const decrypted = await CryptoHelper.decrypt(ciphertext, iv, key);

        // Step 3: Only after successful decryption, rename
        const newPath = file.path.replace(/\.encrypted$/, '.md');
        await this.vaultHandler.renameFile(file, newPath);

        // Step 4: Get fresh file reference (Obsidian API may have stale reference)
        const freshFile = this.app.vault.getAbstractFileByPath(newPath) as TFile;
        if (!freshFile) {
            throw new Error(`File reference lost after rename: ${newPath}`);
        }

        // Step 5: Write decrypted content to the now-.md file
        await this.vaultHandler.modifyFile(freshFile, decrypted);

        if (this.settings.showNotices) {
            new Notice(`Unlocked ${file.basename}`);
        }

        return true;

    } catch (e) {
        console.error(`Failed to decrypt ${file.name}`, e);
        if (this.settings.showNotices) {
            new Notice(`Failed to decrypt ${file.name} (Wrong password?)`);
        }
        return false;
    }
}
```

### Affected Code

- **File**: `src/main.ts`
- **Method**: `decryptFile()` (lines 134-164)
- **Callers**: `processFolder()` (line 199), command callback (line 53)

### Testing Requirements

1. **Wrong Password Test**:
   - Create test vault with encrypted file
   - Attempt decrypt with wrong password
   - Verify: File remains `.encrypted`, content unchanged
   - Verify: No `.md` file created with encrypted JSON

2. **Correct Password Test**:
   - Decrypt with correct password
   - Verify: File becomes `.md`, content is plaintext
   - Verify: Content matches original before encryption

3. **File Reference Test**:
   - Decrypt file
   - Verify fresh file reference is used (not stale)
   - Verify content written successfully

4. **Error Path Test**:
   - Simulate write failure (read-only file)
   - Verify: File operations roll back or report error clearly

## Success Criteria

- [ ] Decryption happens BEFORE any file system modifications
- [ ] Wrong password never results in corrupted `.md` files
- [ ] Fresh file reference obtained after rename
- [ ] Method returns boolean success indicator
- [ ] All error paths tested and verified
- [ ] `processFolder()` updated to use return value
- [ ] Manual testing confirms no data loss scenarios

## Dependencies

- **Requires**: Task 0 complete
- **Blocks**: Task 004 (success counting depends on return value)
- **Related**: Task 002 (JSON validation improves error handling)

## Risk Assessment

- **Pre-Fix Risk**: HIGH - Data loss possible with wrong password
- **Implementation Risk**: LOW - Straightforward refactoring
- **Testing Risk**: MEDIUM - Requires careful validation of error paths

## Notes

- This is the highest priority bug from security review
- Must be fixed before any public release
- Consider adding rollback logic if write fails after rename
- Document the new behavior in inline comments

## Completion Checklist

- [ ] Implementation complete
- [ ] All test scenarios pass
- [ ] Code reviewed for correctness
- [ ] Inline documentation added
- [ ] `processFolder()` updated to handle return value
- [ ] Manual testing with wrong password (verify no corruption)
- [ ] Manual testing with correct password (verify success)
- [ ] Committed with descriptive message

---

**Version:** 1.0
**Created:** 06/01/2026
**Security Review Reference:** Section 2 "Obsidian API Usage" Critical Bug #1
