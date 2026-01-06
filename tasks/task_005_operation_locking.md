# Task 005: Add Operation Locking Mechanism

## Overview
**Status:** Not Started
**Complexity:** Simple (S)
**Priority:** MEDIUM
**Phase:** Phase 1 - Critical Security Fixes
**Dependencies:** Task 0
**Estimated Effort:** 2 hours
**Last Updated:** 06/01/2026

## Objective
Prevent concurrent encrypt/decrypt operations on the same file, avoiding race conditions and undefined behavior.

## Problem Statement
**Current Risk:** User can trigger multiple operations on same file:
- Right-click folder → Lock
- Before completion, right-click again → Lock
- Result: Two simultaneous operations, undefined behavior

## Implementation
```typescript
export default class FolderGuard extends Plugin {
    private inProgress = new Set<string>();

    private async withLock<T>(
        path: string,
        operation: () => Promise<T>
    ): Promise<T | null> {
        // Check if already in progress
        if (this.inProgress.has(path)) {
            if (this.settings.showNotices) {
                new Notice(`Operation already in progress on ${path.split('/').pop()}`);
            }
            return null;
        }

        // Acquire lock
        this.inProgress.add(path);
        try {
            return await operation();
        } finally {
            // Always release lock
            this.inProgress.delete(path);
        }
    }

    async encryptFile(file: TFile, password: string): Promise<boolean> {
        const result = await this.withLock(file.path, async () => {
            // Existing encrypt logic here
            return true;  // or false on failure
        });

        return result ?? false;
    }

    async decryptFile(file: TFile, password: string): Promise<boolean> {
        const result = await this.withLock(file.path, async () => {
            // Existing decrypt logic here
            return true;  // or false on failure
        });

        return result ?? false;
    }

    // Folder locking: Lock entire folder path
    async processFolder(folder: TFolder, password: string, encrypt: boolean) {
        return this.withLock(folder.path, async () => {
            // Existing processFolder logic
            return { success: 0, failed: 0 };
        });
    }
}
```

## Testing
1. **Single Operation:** Normal encrypt/decrypt works
2. **Concurrent Attempts:**
   - Start folder lock operation
   - Before completion, try to lock same folder
   - Verify: Second attempt shows "operation in progress" message
3. **Lock Release:** Verify lock released after completion
4. **Lock Release on Error:** Verify lock released even if operation throws

## Success Criteria
- [ ] `inProgress` Set tracks active operations
- [ ] `withLock()` helper prevents concurrent access
- [ ] User notified when operation already in progress
- [ ] Locks always released (even on error)
- [ ] File-level and folder-level locking work
- [ ] Testing confirms no race conditions

## Notes
- Use file path as lock key (unique identifier)
- `Set<string>` is efficient for checking membership
- `finally` block ensures cleanup even on errors
- Consider status bar indicator for long operations (future)

---
**Version:** 1.0 | **Created:** 06/01/2026
**Security Review:** Section 2 "Obsidian API Usage" Issue #3
