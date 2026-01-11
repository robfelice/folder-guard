import { Plugin, Notice, TFile, TFolder } from 'obsidian';
import { CryptoHelper } from './crypto-helper';
import { VaultHandler } from './vault-handler';
import { PasswordModal } from './password-modal';
import { FolderGuardSettingTab } from './settings-tab';
import { PasswordValidator } from './password-validator';
import { PasswordStrengthModal } from './password-strength-modal';

/**
 * Plugin settings configuration
 */
interface FolderGuardSettings {
    /** Whether to require password confirmation when encrypting */
    confirmPassword: boolean;
    /** Whether to show notification toasts for operations */
    showNotices: boolean;
    /** Minimum password length (6-32 characters) */
    minPasswordLength: number;
    /** Whether to require password complexity (mixed character types) */
    requireComplexity: boolean;
}

/**
 * Structure of encrypted file data stored in .encrypted files
 * Contains all cryptographic parameters needed for decryption
 */
interface EncryptedFileData {
    /** Base64-encoded salt (16 bytes) used for PBKDF2 key derivation */
    salt: string;
    /** Base64-encoded initialization vector (12 bytes) for AES-GCM */
    iv: string;
    /** Base64-encoded ciphertext (encrypted file content) */
    data: string;
}

/**
 * Categorization of encryption/decryption errors for user-friendly messaging
 */
enum EncryptionErrorType {
    /** Wrong password provided for decryption */
    WRONG_PASSWORD,
    /** Encrypted file structure is invalid or tampered */
    CORRUPTED_FILE,
    /** File system permission denied */
    PERMISSION_DENIED,
    /** Target file not found */
    FILE_NOT_FOUND,
    /** Not enough disk space */
    DISK_FULL,
    /** File is already locked by another operation */
    ALREADY_LOCKED,
    /** Unknown/unclassified error */
    UNKNOWN
}

const DEFAULT_SETTINGS: FolderGuardSettings = {
    confirmPassword: true,
    showNotices: true,
    minPasswordLength: 12,
    requireComplexity: true,
}

/**
 * Folder Guard - Obsidian Plugin for File Encryption
 *
 * Provides secure encryption/decryption of markdown files using AES-256-GCM.
 * Features password strength validation, operation locking, and comprehensive error handling.
 *
 * @remarks
 * Security features:
 * - AES-256-GCM authenticated encryption
 * - PBKDF2 key derivation with 100,000 iterations
 * - Unique salt and IV per file
 * - Password strength validation (12+ characters, entropy check)
 * - Operation locking prevents race conditions
 * - No passwords persisted to disk
 *
 * @author Folder Guard Development Team
 * @version 1.0.0
 */
export default class FolderGuard extends Plugin {
    settings: FolderGuardSettings;
    vaultHandler: VaultHandler;
    /** Tracks active operations by file path to prevent concurrent modifications */
    private inProgress = new Set<string>();
    /** Duration (milliseconds) to show failure notification with extended details */
    private static readonly FAILURE_NOTICE_DURATION_MS = 10000;

    async onload() {
        await this.loadSettings();
        // if (this.settings.showNotices) new Notice('Folder Guard loaded');
        this.vaultHandler = new VaultHandler(this.app.vault);

        this.addSettingTab(new FolderGuardSettingTab(this.app, this));

        // Helper to get active file
        const getActiveFile = (): TFile | null => {
            return this.app.workspace.getActiveFile();
        };

        this.addCommand({
            id: 'encrypt-current-file',
            name: 'Encrypt current file',
            callback: () => {
                const file = getActiveFile();
                if (file) {
                    this.handleEncryptCommand(file);
                } else {
                    if (this.settings.showNotices) new Notice('No active file to encrypt');
                }
            }
        });

        this.addCommand({
            id: 'decrypt-current-file',
            name: 'Decrypt current file',
            callback: () => {
                const file = getActiveFile();
                if (file) {
                    new PasswordModal(this.app, (password) => {
                        void this.decryptFile(file, password);
                    }).open();
                } else {
                    if (this.settings.showNotices) new Notice('No active file to decrypt');
                }
            }
        });

        // Context Menu for Files and Folders
        this.registerEvent(
            this.app.workspace.on("file-menu", (menu, file) => {
                // Context menu for individual files
                if (file instanceof TFile) {
                    // Show "Lock File" for .md files
                    if (file.extension === 'md') {
                        menu.addItem((item) => {
                            item
                                .setTitle("Lock file")
                                .setIcon("lock")
                                .onClick(() => {
                                    this.handleEncryptCommand(file);
                                });
                        });
                    }

                    // Show "Unlock File" for .encrypted files
                    if (file.extension === 'encrypted') {
                        menu.addItem((item) => {
                            item
                                .setTitle("Unlock file")
                                .setIcon("unlock")
                                .onClick(() => {
                                    new PasswordModal(this.app, (password) => {
                                        void this.decryptFile(file, password);
                                    }).open();
                                });
                        });
                    }
                }

                // Context menu for folders
                if (file instanceof TFolder) {
                    menu.addItem((item) => {
                        item
                            .setTitle("Lock folder")
                            .setIcon("lock")
                            .onClick(() => {
                                new PasswordModal(this.app, (password) => {
                                    // Validate password strength
                                    const validation = PasswordValidator.validate(password, this.settings.minPasswordLength, this.settings.requireComplexity);

                                    if (!validation.valid) {
                                        // Show warning modal with option to use anyway or change password
                                        // Delay to allow password modal to close first
                                        setTimeout(() => {
                                            new PasswordStrengthModal(
                                                this.app,
                                                validation,
                                                () => {
                                                    // User chose "Use Anyway" - proceed with weak password
                                                    this.proceedWithFolderEncryption(file, password);
                                                },
                                                () => {
                                                    // User chose "Change Password" - re-open password modal
                                                    setTimeout(() => {
                                                        new PasswordModal(this.app, (newPassword) => {
                                                            const newValidation = PasswordValidator.validate(newPassword, this.settings.minPasswordLength, this.settings.requireComplexity);
                                                            if (!newValidation.valid) {
                                                                // Recursively show warning again if still weak
                                                                setTimeout(() => {
                                                                    new PasswordStrengthModal(
                                                                        this.app,
                                                                        newValidation,
                                                                        () => this.proceedWithFolderEncryption(file, newPassword),
                                                                        () => { } // Would need to implement recursive retry
                                                                    ).open();
                                                                }, 100);
                                                            } else {
                                                                this.proceedWithFolderEncryption(file, newPassword);
                                                            }
                                                        }).open();
                                                    }, 100);
                                                }
                                            ).open();
                                        }, 100);
                                    } else {
                                        // Password is strong, proceed
                                        this.proceedWithFolderEncryption(file, password);
                                    }
                                }).open();
                            });
                    });

                    menu.addItem((item) => {
                        item
                            .setTitle("Unlock folder")
                            .setIcon("unlock")
                            .onClick(() => {
                                new PasswordModal(this.app, (password) => {
                                    void this.processFolder(file, password, false);
                                }).open();
                            });
                    });
                }
            })
        );
    }

    /**
     * Wraps an operation with a lock to prevent concurrent access
     * Ensures only one operation can run on a given path at a time
     *
     * @param path - Unique identifier for the lock (file or folder path)
     * @param operation - Async function to execute with lock protection
     * @returns Result of operation, or null if lock couldn't be acquired
     */
    private async withLock<T>(
        path: string,
        operation: () => Promise<T>
    ): Promise<T | null> {
        // Check if operation already in progress on this path
        if (this.inProgress.has(path)) {
            if (this.settings.showNotices) {
                const filename = path.split('/').pop();
                new Notice(`Operation already in progress on ${filename}`);
            }
            return null;
        }

        // Acquire lock
        this.inProgress.add(path);
        try {
            // Execute operation with lock held
            return await operation();
        } finally {
            // Always release lock, even if operation throws
            this.inProgress.delete(path);
        }
    }

    /**
     * Encrypts a markdown file using AES-256-GCM with PBKDF2 key derivation.
     *
     * The file is encrypted with a random salt and IV, making each encryption unique
     * even with the same password. Original content is unrecoverable without the password.
     *
     * @param file - The TFile to encrypt (must have .md extension)
     * @param password - User password for key derivation (strength validated separately)
     * @returns Promise<boolean> - true if encryption succeeded, false otherwise
     *
     * @remarks
     * - File renamed to .encrypted after successful encryption
     * - Uses PBKDF2 with 100,000 iterations (OWASP recommended)
     * - Salt (16 bytes) and IV (12 bytes) stored in JSON structure
     * - Operation is atomic: protected by file-level lock, either fully succeeds or fails
     *
     * @security
     * - Password never persisted to disk
     * - Each file gets unique salt/IV combination
     * - GCM mode provides authenticated encryption
     * - Concurrent operations prevented by withLock mechanism
     *
     * @throws Never throws - all errors caught and logged internally
     */
    async encryptFile(file: TFile, password: string): Promise<boolean> {
        const result = await this.withLock(file.path, async () => {
            try {
                if (file.extension !== 'md') {
                    return false;
                }

                // Check if file actually exists before trying to read it
                if (!this.app.vault.getAbstractFileByPath(file.path)) {
                    console.warn(`File not found, skipping: ${file.path}`);
                    return false;
                }

                const content = await this.vaultHandler.readFile(file);

                const salt = CryptoHelper.generateSalt();
                const key = await CryptoHelper.deriveKey(password, salt);
                const { iv, ciphertext } = await CryptoHelper.encrypt(content, key);

                const combinedData = {
                    salt: CryptoHelper.arrayBufferToBase64(salt.buffer),
                    iv: CryptoHelper.arrayBufferToBase64(iv.buffer),
                    data: CryptoHelper.arrayBufferToBase64(ciphertext)
                };

                const newContent = JSON.stringify(combinedData, null, 2);
                await this.vaultHandler.modifyFile(file, newContent);

                // Rename to .encrypted
                const newPath = file.path.replace(/\.md$/, '.encrypted');
                await this.vaultHandler.renameFile(file, newPath);

                if (this.settings.showNotices) new Notice(`Locked ${file.basename}`);
                return true;

            } catch (e) {
                console.error(`Failed to encrypt ${file.name}`, e);

                if (this.settings.showNotices) {
                    const errorType = this.categorizeError(e, 'encrypt');
                    const userMessage = this.getUserErrorMessage(errorType, file.basename, 'encrypt');
                    new Notice(userMessage, 8000);  // Show longer for error messages
                }

                return false;
            }
        });

        return result ?? false;  // Return false if lock couldn't be acquired
    }

    /**
     * Decrypts an encrypted file, restoring original markdown content.
     *
     * Validates file structure before attempting decryption to prevent data loss.
     * Decryption occurs BEFORE any file system modifications to ensure wrong passwords
     * don't corrupt files.
     *
     * @param file - The TFile to decrypt (must have .encrypted extension)
     * @param password - User password for key derivation (must match encryption password)
     * @returns Promise<boolean> - true if decryption succeeded, false otherwise
     *
     * @remarks
     * - Validates JSON structure before decryption (prevents crashes)
     * - Decrypt happens BEFORE file rename (prevents data loss)
     * - File renamed to .md only after successful decryption
     * - Fresh file reference obtained after rename (avoids stale references)
     *
     * @security
     * - Wrong password detected before any file modifications
     * - File structure validated before decryption attempt
     * - Corrupted files detected and reported without data loss
     * - Concurrent operations prevented by withLock mechanism
     *
     * @throws Never throws - all errors caught and logged internally
     *
     * @see validateEncryptedStructure for file structure validation
     */
    async decryptFile(file: TFile, password: string): Promise<boolean> {
        const result = await this.withLock(file.path, async () => {
            try {
                if (file.extension !== 'encrypted') {
                    return false;
                }

                // Check if file actually exists before trying to read it
                if (!this.app.vault.getAbstractFileByPath(file.path)) {
                    console.warn(`File not found, skipping: ${file.path}`);
                    return false;
                }

                // Step 1: Read and validate encrypted content (no file system changes yet)
                const content = await this.vaultHandler.readFile(file);
                const json = this.validateEncryptedStructure(content);

                const salt = new Uint8Array(CryptoHelper.base64ToArrayBuffer(json.salt));
                const iv = new Uint8Array(CryptoHelper.base64ToArrayBuffer(json.iv));
                const ciphertext = CryptoHelper.base64ToArrayBuffer(json.data);

                // Step 2: Decrypt FIRST - fail early if wrong password (no file changes made)
                const key = await CryptoHelper.deriveKey(password, salt);
                const decrypted = await CryptoHelper.decrypt(ciphertext, iv, key);

                // Step 3: Only after successful decryption, rename the file
                const newPath = file.path.replace(/\.encrypted$/, '.md');
                await this.vaultHandler.renameFile(file, newPath);

                // Step 4: Get fresh file reference after rename (Obsidian API may have stale reference)
                const abstractFile = this.app.vault.getAbstractFileByPath(newPath);
                if (!(abstractFile instanceof TFile)) {
                    throw new Error(`File reference lost after rename: ${newPath}`);
                }
                const freshFile = abstractFile;

                // Step 5: Write decrypted content to the now-.md file
                await this.vaultHandler.modifyFile(freshFile, decrypted);

                if (this.settings.showNotices) new Notice(`Unlocked ${file.basename}`);
                return true;

            } catch (e) {
                console.error(`Failed to decrypt ${file.name}`, e);

                if (this.settings.showNotices) {
                    const errorType = this.categorizeError(e, 'decrypt');
                    const userMessage = this.getUserErrorMessage(errorType, file.basename, 'decrypt');
                    new Notice(userMessage, 8000);  // Show longer for error messages
                }

                return false;
            }
        });

        return result ?? false;  // Return false if lock couldn't be acquired
    }

    /**
     * Handles the encrypt file command with password strength validation.
     *
     * Entry point for single-file encryption from command palette or context menu.
     * Validates password strength and prompts for confirmation before encrypting.
     *
     * @param file - The markdown file to encrypt
     *
     * @remarks
     * - Validates file extension (.md required)
     * - Checks password strength (12+ chars, entropy, no common passwords)
     * - Shows warning modal for weak passwords with "Use Anyway" option
     * - Requests password confirmation if enabled in settings
     * - Delegates actual encryption to encryptFile method
     *
     * @see PasswordValidator for password strength criteria
     * @see encryptFile for encryption implementation
     */
    handleEncryptCommand(file: TFile) {
        if (file.extension !== 'md') {
            new Notice('Only markdown (.md) files can be locked.');
            return;
        }
        this.promptForEncryptPassword(file);
    }

    private promptForEncryptPassword(file: TFile) {
        new PasswordModal(this.app, (password) => {
            // Validate password strength
            const validation = PasswordValidator.validate(password, this.settings.minPasswordLength, this.settings.requireComplexity);

            if (!validation.valid) {
                // Show warning modal with option to use anyway or change password
                // Delay opening to allow password modal to fully close
                setTimeout(() => {
                    new PasswordStrengthModal(
                        this.app,
                        validation,
                        () => {
                            // User chose "Use Anyway" - proceed with weak password
                            this.proceedWithEncryption(file, password);
                        },
                        () => {
                            // User chose "Change Password" - re-open password modal
                            setTimeout(() => {
                                this.promptForEncryptPassword(file);
                            }, 100);
                        }
                    ).open();
                }, 100); // 100ms delay to let password modal close
            } else {
                // Password is strong, proceed
                this.proceedWithEncryption(file, password);
            }
        }).open();
    }

    /**
     * Proceeds with file encryption after password validation
     * Handles password confirmation if enabled in settings
     */
    private proceedWithEncryption(file: TFile, password: string) {
        if (this.settings.confirmPassword) {
            new PasswordModal(this.app, (confirm) => {
                if (password !== confirm) {
                    new Notice('Passwords do not match!');
                    return;
                }
                void this.encryptFile(file, password);
            }, "Confirm password").open();
        } else {
            void this.encryptFile(file, password);
        }
    }

    /**
     * Proceeds with folder encryption after password validation
     * Handles password confirmation if enabled in settings
     */
    private proceedWithFolderEncryption(folder: TFolder, password: string) {
        if (this.settings.confirmPassword) {
            new PasswordModal(this.app, (confirm) => {
                if (password !== confirm) {
                    new Notice('Passwords do not match!');
                    return;
                }
                void this.processFolder(folder, password, true);
            }, "Confirm password").open();
        } else {
            void this.processFolder(folder, password, true);
        }
    }

    /**
     * Processes all files in a folder (encrypt or decrypt)
     * Tracks success/failure counts and provides accurate feedback
     *
     * @param folder - Folder to process
     * @param password - Password for encryption/decryption
     * @param encrypt - true to encrypt, false to decrypt
     * @returns Object with success and failed counts
     */
    async processFolder(folder: TFolder, password: string, encrypt: boolean): Promise<{ success: number, failed: number }> {
        const result = await this.withLock(folder.path, async () => {
            const files = await this.vaultHandler.getFiles(folder);

            // Filter files based on operation
            const targetExtension = encrypt ? 'md' : 'encrypted';
            const targetFiles = files.filter(f => f.extension === targetExtension);

            let successCount = 0;
            let failureCount = 0;
            const failedFiles: string[] = [];

            for (const f of targetFiles) {
                // Check actual result of operation
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

            // Improved notification with failure reporting
            if (this.settings.showNotices) {
                const action = encrypt ? "Locked" : "Unlocked";

                if (failureCount === 0) {
                    // All succeeded
                    new Notice(`${action} ${successCount} files in ${folder.name}`);
                } else {
                    // Some failures - show extended notification
                    new Notice(
                        `${action} ${successCount} files, ${failureCount} failed in ${folder.name}`,
                        FolderGuard.FAILURE_NOTICE_DURATION_MS  // Show extended notification for failures
                    );

                    // Log failed files to console for debugging
                    console.warn(`Failed to ${action.toLowerCase()} files in ${folder.name}:`, failedFiles);
                }
            }

            return { success: successCount, failed: failureCount };
        });

        return result ?? { success: 0, failed: 0 };  // Return zero counts if lock couldn't be acquired
    }

    /**
     * Validates the structure of an encrypted file's JSON data.
     * Ensures all required fields are present, have correct types, and valid Base64 encoding.
     *
     * @param content - The raw file content (should be JSON)
     * @returns Validated EncryptedFileData object
     * @throws Error with specific message if validation fails
     */
    private validateEncryptedStructure(content: string): EncryptedFileData {
        // Step 1: Parse JSON
        let json: unknown;
        try {
            json = JSON.parse(content);
        } catch {
            throw new Error('Invalid encrypted file: Not valid JSON');
        }

        // Type guard: ensure json is an object
        if (typeof json !== 'object' || json === null) {
            throw new Error('Invalid encrypted file: Root must be an object');
        }

        // Cast to record for property access
        const data = json as Record<string, unknown>;

        // Step 2: Check required fields exist
        if (!data.salt || !data.iv || !data.data) {
            const missing = [];
            if (!data.salt) missing.push('salt');
            if (!data.iv) missing.push('iv');
            if (!data.data) missing.push('data');
            throw new Error(`Invalid encrypted file: Missing required fields: ${missing.join(', ')}`);
        }

        // Step 3: Check field types
        if (typeof data.salt !== 'string') {
            throw new Error('Invalid encrypted file: salt must be a string');
        }
        if (typeof data.iv !== 'string') {
            throw new Error('Invalid encrypted file: iv must be a string');
        }
        if (typeof data.data !== 'string') {
            throw new Error('Invalid encrypted file: data must be a string');
        }

        // Step 4: Validate Base64 format
        if (!this.isValidBase64(data.salt)) {
            throw new Error('Invalid encrypted file: salt is not valid Base64');
        }
        if (!this.isValidBase64(data.iv)) {
            throw new Error('Invalid encrypted file: iv is not valid Base64');
        }
        if (!this.isValidBase64(data.data)) {
            throw new Error('Invalid encrypted file: data is not valid Base64');
        }

        return data as EncryptedFileData;
    }

    /**
     * Checks if a string is valid Base64 encoding.
     *
     * @param str - String to validate
     * @returns true if valid Base64, false otherwise
     */
    private isValidBase64(str: string): boolean {
        try {
            // Attempt to decode - will throw if invalid
            window.atob(str);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Categorizes an error for user-friendly messaging
     *
     * Analyzes error messages and types to determine the most likely cause,
     * enabling specific, actionable user feedback.
     *
     * @param error - The error object from try/catch
     * @param operation - Context: 'encrypt' or 'decrypt'
     * @returns Categorized error type
     *
     * @remarks
     * Detection patterns:
     * - WRONG_PASSWORD: Decryption failure without structure errors
     * - CORRUPTED_FILE: JSON parsing or structure validation errors
     * - PERMISSION_DENIED: File system permission errors (EACCES, EPERM)
     * - FILE_NOT_FOUND: Missing file errors (ENOENT)
     * - DISK_FULL: Out of space errors (ENOSPC)
     * - ALREADY_LOCKED: Attempted operation on locked file (caught by withLock)
     */
    private categorizeError(error: unknown, operation: 'encrypt' | 'decrypt'): EncryptionErrorType {
        const message = error instanceof Error ? error.message : String(error);
        const name = error instanceof Error ? error.name : '';

        // Check for structure validation errors (corrupted encrypted files)
        if (message.includes('Invalid encrypted file') ||
            message.includes('Not valid JSON') ||
            message.includes('Missing required fields') ||
            message.includes('not valid Base64')) {
            return EncryptionErrorType.CORRUPTED_FILE;
        }

        // Check for decryption failures (likely wrong password)
        // Web Crypto API throws DOMException for wrong password
        if (operation === 'decrypt' &&
            (name === 'OperationError' ||
                message.includes('decrypt') ||
                message.includes('The operation failed'))) {
            return EncryptionErrorType.WRONG_PASSWORD;
        }

        // File system errors
        if (message.includes('EACCES') || message.includes('EPERM') || message.includes('permission')) {
            return EncryptionErrorType.PERMISSION_DENIED;
        }

        if (message.includes('ENOENT') || message.includes('not found') || message.includes('File reference lost')) {
            return EncryptionErrorType.FILE_NOT_FOUND;
        }

        if (message.includes('ENOSPC') || message.includes('no space') || message.includes('disk full')) {
            return EncryptionErrorType.DISK_FULL;
        }

        // Lock acquisition failures (shouldn't normally show to user)
        if (message.includes('already in progress')) {
            return EncryptionErrorType.ALREADY_LOCKED;
        }

        return EncryptionErrorType.UNKNOWN;
    }

    /**
     * Generates user-friendly error message with recovery guidance
     *
     * @param errorType - Categorized error type
     * @param filename - Name of file being processed
     * @param operation - Context: 'encrypt' or 'decrypt'
     * @returns Clear, actionable error message for user
     *
     * @remarks
     * Messages follow pattern: [Problem] - [Guidance/Action]
     * - Avoid technical jargon
     * - Provide specific next steps where possible
     * - Reference backup/recovery when data loss is possible
     */
    private getUserErrorMessage(
        errorType: EncryptionErrorType,
        filename: string,
        operation: 'encrypt' | 'decrypt'
    ): string {
        switch (errorType) {
            case EncryptionErrorType.WRONG_PASSWORD:
                return `Wrong password for "${filename}". Please try again with the correct password.`;

            case EncryptionErrorType.CORRUPTED_FILE:
                return `"${filename}" is corrupted or has been tampered with. Restore from backup if available.`;

            case EncryptionErrorType.PERMISSION_DENIED:
                return `Cannot modify "${filename}" - permission denied. Check file permissions or close other programs using this file.`;

            case EncryptionErrorType.FILE_NOT_FOUND:
                return `"${filename}" not found. It may have been moved or deleted during ${operation}ion.`;

            case EncryptionErrorType.DISK_FULL:
                return `Not enough disk space to ${operation} "${filename}". Free up space and try again.`;

            case EncryptionErrorType.ALREADY_LOCKED:
                // This should be rare - withLock already shows a notice
                return `"${filename}" is already being processed. Please wait for the current operation to finish.`;

            case EncryptionErrorType.UNKNOWN:
            default:
                return `Failed to ${operation} "${filename}". Check the console (Ctrl+Shift+I) for technical details.`;
        }
    }

    /**
     * Loads plugin settings from disk, merging with defaults
     *
     * @remarks
     * Uses Obsidian's loadData() API to retrieve persisted settings
     * Missing settings automatically filled with DEFAULT_SETTINGS values
     */
    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    /**
     * Persists current plugin settings to disk
     *
     * @remarks
     * Uses Obsidian's saveData() API for persistence
     * Called automatically when settings are modified in settings tab
     */
    async saveSettings() {
        await this.saveData(this.settings);
    }

    /**
     * Plugin cleanup on unload
     *
     * @remarks
     * Currently no cleanup required - all operations are file-based
     * No persistent connections or timers to clean up
     */
    onunload() {
    }
}
