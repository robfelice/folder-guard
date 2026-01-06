# Task 004: Fix Success Counting in processFolder

## Overview
**Status:** Not Started
**Complexity:** Simple (S)
**Priority:** HIGH
**Phase:** Phase 1 - Critical Security Fixes
**Dependencies:** Task 001 (decrypt returns boolean)
**Estimated Effort:** 1 hour
**Last Updated:** 06/01/2026

## Objective
Fix `processFolder()` to accurately count successful vs failed operations, providing truthful feedback to users.

## Problem Statement
```typescript
// Current bug (main.ts:189-206):
for (const f of targetFiles) {
    if (encrypt) {
        await this.encryptFile(f, password);  // No return value checked
    } else {
        await this.decryptFile(f, password);
    }
    successCount++;  // Increments even if operation failed!
}
```

**Impact:** User sees "Unlocked 10 files" but maybe only 5 actually worked.

## Implementation
```typescript
async processFolder(folder: TFolder, password: string, encrypt: boolean): Promise<{success: number, failed: number}> {
    const files = await this.vaultHandler.getFiles(folder);
    const targetExtension = encrypt ? 'md' : 'encrypted';
    const targetFiles = files.filter(f => f.extension === targetExtension);

    let successCount = 0;
    let failureCount = 0;
    const failedFiles: string[] = [];

    for (const f of targetFiles) {
        const result = encrypt
            ? await this.encryptFile(f, password)
            : await this.decryptFile(f, password);

        if (result) {
            successCount++;
        } else {
            failureCount++;
            failedFiles.push(f.basename);
        }
    }

    // Improved notification
    if (this.settings.showNotices) {
        const action = encrypt ? "Locked" : "Unlocked";
        if (failureCount === 0) {
            new Notice(`${action} ${successCount} files in ${folder.name}`);
        } else {
            new Notice(
                `${action} ${successCount} files, ${failureCount} failed in ${folder.name}`,
                10000  // Show longer for failures
            );
            // Log failed files to console
            console.warn(`Failed to ${action.toLowerCase()}:`, failedFiles);
        }
    }

    return { success: successCount, failed: failureCount };
}
```

## Testing
1. Folder with all valid files + correct password → All succeed
2. Folder with mixed files + wrong password → Some fail, accurate count
3. Check console for failed file list

## Success Criteria
- [ ] Count only actual successes
- [ ] Track and report failures
- [ ] Extended notification time for failures
- [ ] Failed files logged to console
- [ ] Return success/failure counts

---
**Version:** 1.0 | **Created:** 06/01/2026
**Security Review:** Section 3 "Edge Cases" Issue #5
