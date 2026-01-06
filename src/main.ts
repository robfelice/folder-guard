import { Plugin, Editor, MarkdownView, Notice, TFile, TFolder } from 'obsidian';
import { CryptoHelper } from './crypto-helper';
import { VaultHandler } from './vault-handler';
import { PasswordModal } from './password-modal';
import { FolderGuardSettingTab } from './settings-tab';

interface FolderGuardSettings {
    confirmPassword: boolean;
    showNotices: boolean;
}

interface EncryptedFileData {
    salt: string;  // Base64-encoded salt
    iv: string;    // Base64-encoded IV
    data: string;  // Base64-encoded ciphertext
}

const DEFAULT_SETTINGS: FolderGuardSettings = {
    confirmPassword: true,
    showNotices: true,
}

export default class FolderGuard extends Plugin {
    settings: FolderGuardSettings;
    vaultHandler: VaultHandler;

    async onload() {
        await this.loadSettings();
        if (this.settings.showNotices) new Notice('Folder Guard Loaded');
        this.vaultHandler = new VaultHandler(this.app.vault);

        this.addSettingTab(new FolderGuardSettingTab(this.app, this));

        // Helper to get active file
        const getActiveFile = (): TFile | null => {
            return this.app.workspace.getActiveFile();
        };

        this.addCommand({
            id: 'encrypt-current-file',
            name: 'Folder Guard: Encrypt Current File',
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
            name: 'Folder Guard: Decrypt Current File',
            callback: () => {
                const file = getActiveFile();
                if (file) {
                    new PasswordModal(this.app, (password) => {
                        this.decryptFile(file, password);
                    }).open();
                } else {
                    if (this.settings.showNotices) new Notice('No active file to decrypt');
                }
            }
        });

        // Context Menu for Folders
        this.registerEvent(
            this.app.workspace.on("file-menu", (menu, file) => {
                if (file instanceof TFolder) {
                    menu.addItem((item) => {
                        item
                            .setTitle("Lock Folder (Folder Guard)")
                            .setIcon("lock")
                            .onClick(async () => {
                                // Proper folder logic:
                                new PasswordModal(this.app, async (password) => {
                                    if (this.settings.confirmPassword) {
                                        new PasswordModal(this.app, async (confirm) => {
                                            if (password !== confirm) {
                                                new Notice('Passwords do not match!');
                                                return;
                                            }
                                            this.processFolder(file, password, true);
                                        }, "Confirm Password").open();
                                    } else {
                                        this.processFolder(file, password, true);
                                    }
                                }).open();
                            });
                    });

                    menu.addItem((item) => {
                        item
                            .setTitle("Unlock Folder (Folder Guard)")
                            .setIcon("unlock")
                            .onClick(async () => {
                                new PasswordModal(this.app, async (password) => {
                                    this.processFolder(file, password, false);
                                }).open();
                            });
                    });
                }
            })
        );
    }

    async encryptFile(file: TFile, password: string): Promise<boolean> {
        try {
            if (file.extension !== 'md') {
                return false;
            }

            const content = await this.vaultHandler.readFile(file);

            const salt = await CryptoHelper.generateSalt();
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
            if (this.settings.showNotices) new Notice(`Failed to encrypt ${file.name}`);
            return false;
        }
    }

    async decryptFile(file: TFile, password: string): Promise<boolean> {
        try {
            if (file.extension !== 'encrypted') {
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
            const freshFile = this.app.vault.getAbstractFileByPath(newPath) as TFile;
            if (!freshFile) {
                throw new Error(`File reference lost after rename: ${newPath}`);
            }

            // Step 5: Write decrypted content to the now-.md file
            await this.vaultHandler.modifyFile(freshFile, decrypted);

            if (this.settings.showNotices) new Notice(`Unlocked ${file.basename}`);
            return true;

        } catch (e) {
            console.error(`Failed to decrypt ${file.name}`, e);

            // Provide specific error messages based on failure type
            if (this.settings.showNotices) {
                let userMessage = `Failed to decrypt ${file.name}`;

                if (e.message && e.message.includes('Invalid encrypted file')) {
                    // Structure validation failed - file is corrupted or tampered
                    userMessage = `${file.name} appears corrupted or has been modified`;
                } else if (e.message && e.message.includes('decrypt')) {
                    // Decryption failed - likely wrong password
                    userMessage = `Failed to decrypt ${file.name} (Wrong password?)`;
                }

                new Notice(userMessage);
            }
            return false;
        }
    }

    // Command Handlers (Updated to check extension)
    handleEncryptCommand(file: TFile) {
        if (file.extension !== 'md') {
            new Notice('Only Markdown (.md) files can be locked.');
            return;
        }
        new PasswordModal(this.app, (password) => {
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
        }).open();
    }

    async processFolder(folder: TFolder, password: string, encrypt: boolean) {
        const files = await this.vaultHandler.getFiles(folder);
        let successCount = 0;

        // Filter files based on operation
        const targetExtension = encrypt ? 'md' : 'encrypted';
        const targetFiles = files.filter(f => f.extension === targetExtension);

        for (const f of targetFiles) {
            if (encrypt) {
                await this.encryptFile(f, password);
            } else {
                await this.decryptFile(f, password);
            }
            successCount++;
        }
        if (this.settings.showNotices) {
            const action = encrypt ? "Locked" : "Unlocked";
            new Notice(`${action} ${successCount} files in ${folder.name}`);
        }
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

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    onunload() {
    }
}
