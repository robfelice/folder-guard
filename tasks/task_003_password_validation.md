# Task 003: Add Password Strength Validation

## Overview
**Status:** Not Started
**Complexity:** Simple (S)
**Priority:** HIGH
**Phase:** Phase 1 - Critical Security Fixes
**Dependencies:** Task 0 (Complete)
**Estimated Effort:** 2-3 hours
**Actual Effort:** TBD
**Last Updated:** 06/01/2026

## Objective

Implement password strength validation to prevent users from encrypting files with weak passwords like "123" or "password", reducing security risk.

## Problem Statement

**Current Behavior:**
- No password validation
- Users can set any password, including empty strings
- "123", "password", "test" all accepted
- Weak passwords make encryption vulnerable to brute force

**Security Risk:**
- Even with 100k PBKDF2 iterations, weak passwords are crackable
- Users may not realize security implications
- No warning about password strength

## Implementation Requirements

### 1. Create Password Validator Class

**File:** New `src/password-validator.ts`

```typescript
export class PasswordValidator {
    static readonly MIN_LENGTH = 12;
    static readonly MIN_ENTROPY = 3.0;  // bits per character

    // Common weak passwords (partial list)
    private static readonly COMMON_PASSWORDS = [
        'password', 'Password1', '123456', '12345678',
        'qwerty', 'abc123', 'password123', 'admin',
        'letmein', 'welcome', 'monkey', '1234567890'
    ];

    static validate(password: string): ValidationResult {
        // Check minimum length
        if (password.length < this.MIN_LENGTH) {
            return {
                valid: false,
                strength: 'weak',
                message: `Password must be at least ${this.MIN_LENGTH} characters long`,
                suggestion: 'Use a longer passphrase with mixed characters'
            };
        }

        // Check against common passwords
        if (this.isCommonPassword(password)) {
            return {
                valid: false,
                strength: 'weak',
                message: 'This password is too common and easily guessed',
                suggestion: 'Use a unique passphrase or password manager'
            };
        }

        // Calculate entropy
        const entropy = this.calculateEntropy(password);
        if (entropy < this.MIN_ENTROPY) {
            return {
                valid: false,
                strength: 'weak',
                message: 'Password lacks complexity (repeated characters, simple patterns)',
                suggestion: 'Mix letters, numbers, and symbols'
            };
        }

        // Check for repeated characters (aaaaaa, 111111)
        if (this.hasRepeatedChars(password)) {
            return {
                valid: false,
                strength: 'weak',
                message: 'Password contains too many repeated characters',
                suggestion: 'Avoid repetition for better security'
            };
        }

        // Strong password
        return {
            valid: true,
            strength: entropy > 4.0 ? 'strong' : 'good',
            message: 'Password strength is acceptable'
        };
    }

    private static isCommonPassword(password: string): boolean {
        const lower = password.toLowerCase();
        return this.COMMON_PASSWORDS.some(common =>
            lower === common.toLowerCase() || lower.includes(common.toLowerCase())
        );
    }

    private static calculateEntropy(password: string): number {
        const charCounts = new Map<string, number>();
        for (const char of password) {
            charCounts.set(char, (charCounts.get(char) || 0) + 1);
        }

        let entropy = 0;
        for (const count of charCounts.values()) {
            const p = count / password.length;
            entropy -= p * Math.log2(p);
        }

        return entropy;
    }

    private static hasRepeatedChars(password: string, threshold: number = 4): boolean {
        let count = 1;
        for (let i = 1; i < password.length; i++) {
            if (password[i] === password[i - 1]) {
                count++;
                if (count >= threshold) return true;
            } else {
                count = 1;
            }
        }
        return false;
    }
}

export interface ValidationResult {
    valid: boolean;
    strength?: 'weak' | 'good' | 'strong';
    message: string;
    suggestion?: string;
}
```

### 2. Create Password Strength Modal

**File:** New `src/password-strength-modal.ts`

```typescript
import { App, Modal, Setting } from 'obsidian';

export class PasswordStrengthModal extends Modal {
    private result: ValidationResult;
    private onAccept: () => void;

    constructor(app: App, result: ValidationResult, onAccept: () => void) {
        super(app);
        this.result = result;
        this.onAccept = onAccept;
    }

    onOpen() {
        const { contentEl } = this;

        contentEl.createEl('h2', { text: 'Weak Password Warning' });

        contentEl.createEl('p', {
            text: this.result.message,
            cls: 'folder-guard-warning'
        });

        if (this.result.suggestion) {
            contentEl.createEl('p', {
                text: `Suggestion: ${this.result.suggestion}`,
                cls: 'folder-guard-suggestion'
            });
        }

        contentEl.createEl('p', {
            text: 'Weak passwords can be cracked even with strong encryption. If you forget this password, your data cannot be recovered.',
            cls: 'folder-guard-notice'
        });

        new Setting(contentEl)
            .addButton((btn) =>
                btn
                    .setButtonText('Change Password')
                    .setCta()
                    .onClick(() => {
                        this.close();
                    }))
            .addButton((btn) =>
                btn
                    .setButtonText('Use Anyway')
                    .setWarning()
                    .onClick(() => {
                        this.close();
                        this.onAccept();
                    }));
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
```

### 3. Integrate into Main Plugin

**File:** `src/main.ts`

```typescript
import { PasswordValidator, ValidationResult } from './password-validator';
import { PasswordStrengthModal } from './password-strength-modal';

// In handleEncryptCommand and folder lock flow:
handleEncryptCommand(file: TFile) {
    if (file.extension !== 'md') {
        new Notice('Only Markdown (.md) files can be locked.');
        return;
    }

    new PasswordModal(this.app, (password) => {
        // Validate password strength
        const validation = PasswordValidator.validate(password);

        if (!validation.valid) {
            // Show warning modal with option to use anyway
            new PasswordStrengthModal(this.app, validation, () => {
                // User chose "Use Anyway"
                this.proceedWithEncryption(file, password);
            }).open();
        } else {
            // Password is strong, proceed
            this.proceedWithEncryption(file, password);
        }
    }).open();
}

private proceedWithEncryption(file: TFile, password: string) {
    if (this.settings.confirmPassword) {
        new PasswordModal(this.app, (confirm) => {
            if (password !== confirm) {
                new Notice('Passwords do not match!');
                return;
            }
            this.encryptFile(file, password);
        }, "Confirm Password").open();
    } else {
        this.encryptFile(file, password);
    }
}
```

### 4. Add CSS Styling

**File:** `styles.css`

```css
.folder-guard-warning {
    color: var(--text-error);
    font-weight: bold;
    margin: 1em 0;
}

.folder-guard-suggestion {
    color: var(--text-muted);
    font-style: italic;
    margin: 0.5em 0;
}

.folder-guard-notice {
    background: var(--background-secondary);
    padding: 1em;
    border-radius: 4px;
    border-left: 3px solid var(--text-warning);
    margin: 1em 0;
}
```

## Testing Requirements

1. **Weak Password - Too Short**:
   - Try password "pass123"
   - Verify: Warning modal appears
   - Verify: Clear message about length requirement

2. **Weak Password - Common**:
   - Try password "password123"
   - Verify: Warning about common password
   - Verify: Suggestion to use unique password

3. **Weak Password - Low Entropy**:
   - Try password "aaaaaaaaaaaaa"
   - Verify: Warning about repeated characters

4. **Strong Password**:
   - Try password "MyS3cur3P@ssw0rd!"
   - Verify: No warning, proceeds directly

5. **Use Anyway Option**:
   - Enter weak password
   - Click "Use Anyway"
   - Verify: Encryption proceeds

6. **Change Password Option**:
   - Enter weak password
   - Click "Change Password"
   - Verify: Returns to password entry

## Success Criteria

- [ ] PasswordValidator class implemented
- [ ] Password strength checking works
- [ ] Warning modal implemented
- [ ] "Use Anyway" and "Change Password" options work
- [ ] Integration with encryption flow complete
- [ ] CSS styling applied
- [ ] All test scenarios pass
- [ ] User experience is clear and helpful

## User Experience Goals

- **Non-Blocking**: Users can override warnings if needed
- **Educational**: Clear explanations of why password is weak
- **Helpful**: Concrete suggestions for improvement
- **Professional**: Don't make users feel stupid

## Dependencies

- **Requires**: Task 0 complete
- **Blocks**: None (independent improvement)
- **Related**: Task 006 (documentation mentions password requirements)

## Risk Assessment

- **Implementation Risk**: LOW - Straightforward validation logic
- **User Impact**: HIGH - Significantly improves security
- **UX Risk**: MEDIUM - Must not be annoying for advanced users

## Notes

- Consider adding password strength indicator (future enhancement)
- Could integrate with password managers (future)
- Entropy calculation is simple but effective
- Common password list can be expanded

## Completion Checklist

- [ ] PasswordValidator class created
- [ ] Password strength modal created
- [ ] Integration complete
- [ ] CSS styling added
- [ ] All test scenarios pass
- [ ] Code reviewed
- [ ] User experience tested
- [ ] Documentation updated
- [ ] Committed with descriptive message

---

**Version:** 1.0
**Created:** 06/01/2026
**Security Review Reference:** Section 1 "Security Best Practices" Critical Issue #1
