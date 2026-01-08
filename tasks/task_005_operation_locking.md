# Task 005: Add Operation Locking Mechanism

## Overview
**Status:** Completed
**Complexity:** Simple (S)
**Priority:** MEDIUM
**Phase:** Phase 1 - Critical Security Fixes
**Dependencies:** Task 0
**Estimated Effort:** 2 hours
**Actual Effort:** 15 minutes
**Completed:** 06/01/2026
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
- [x] `inProgress` Set tracks active operations
- [x] `withLock()` helper prevents concurrent access
- [x] User notified when operation already in progress
- [x] Locks always released (even on error)
- [x] File-level and folder-level locking work
- [ ] Testing confirms no race conditions (requires manual testing - Phase 3)

## Implementation Summary

**Changes Made:**

1. **Added `inProgress` Set** (main.ts:28)
   ```typescript
   private inProgress = new Set<string>();  // Tracks active operations
   ```
   - Uses file/folder path as unique lock identifier
   - Efficient O(1) lookup with `Set.has()`
   - Automatically prevents duplicate entries

2. **Created `withLock()` Helper Method** (main.ts:112-142)
   ```typescript
   private async withLock<T>(
       path: string,
       operation: () => Promise<T>
   ): Promise<T | null>
   ```
   - Generic method works with any return type
   - Checks if operation already in progress on path
   - Shows user notification if lock can't be acquired
   - Acquires lock, executes operation, releases in `finally` block
   - **Critical**: `finally` ensures lock released even on errors/exceptions
   - Returns `null` if lock already held (caller handles gracefully)

3. **Wrapped `encryptFile()`** (main.ts:144-181)
   - Entire method wrapped in `withLock(file.path, async () => {...})`
   - Returns `false` if lock can't be acquired (`result ?? false`)
   - Prevents concurrent encryption of same file

4. **Wrapped `decryptFile()`** (main.ts:183-240)
   - Entire method wrapped in `withLock(file.path, async () => {...})`
   - Returns `false` if lock can't be acquired
   - Prevents concurrent decryption of same file
   - Prevents encrypt/decrypt race on same file

5. **Wrapped `processFolder()`** (main.ts:310-359)
   - Entire method wrapped in `withLock(folder.path, async () => {...})`
   - Returns `{success: 0, failed: 0}` if lock can't be acquired
   - Prevents concurrent folder operations
   - Individual files within folder still use their own locks

**Lock Behavior:**

| Scenario | Behavior |
|----------|----------|
| User encrypts file.md | Lock acquired on "vault/folder/file.md" |
| User tries to encrypt same file again (while first running) | ❌ Lock check fails → Notice: "Operation already in progress on file.md" |
| User encrypts different file.md | ✅ Different path → Lock acquired |
| User locks folder | Lock acquired on "vault/folder" path |
| User tries to lock same folder again | ❌ Lock check fails → Notice: "Operation already in progress on folder" |
| Operation throws error | ✅ `finally` block releases lock anyway |

**Race Condition Prevention:**

**Before** (without locking):
```
Time 0: User right-clicks folder → "Lock Folder"
Time 1: processFolder starts iterating files
Time 2: User right-clicks folder again → "Lock Folder"
Time 3: SECOND processFolder starts iterating same files
Result: TWO operations running concurrently → UNDEFINED BEHAVIOR
```

**After** (with locking):
```
Time 0: User right-clicks folder → "Lock Folder"
Time 1: Lock acquired on "vault/folder", processFolder starts
Time 2: User right-clicks folder again → "Lock Folder"
Time 3: withLock() sees lock already held → Shows notice → Returns null
Result: Second operation prevented, user informed
```

**Build Verification:**
- ✅ TypeScript compiles without errors
- ✅ Generic `withLock<T>` works with different return types
- ✅ No breaking changes to callers

**Ready for Testing:**
- Manual testing in Phase 3 (Task 011)
- Test concurrent file encryption attempts
- Test concurrent folder operations
- Verify locks released after errors
- Verify user notifications appear

## Notes
- Use file path as lock key (unique identifier)
- `Set<string>` is efficient for checking membership
- `finally` block ensures cleanup even on errors
- Consider status bar indicator for long operations (future)
- Individual file locks prevent race even within folder operations

---
**Version:** 1.0 | **Created:** 06/01/2026
**Security Review:** Section 2 "Obsidian API Usage" Issue #3
