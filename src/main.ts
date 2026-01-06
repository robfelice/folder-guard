import { Plugin, Editor, MarkdownView, Notice, TFile, TFolder } from 'obsidian';
import { CryptoHelper } from './crypto-helper';
import { VaultHandler } from './vault-handler';
import { PasswordModal } from './password-modal';
import { FolderGuardSettingTab } from './settings-tab';

interface FolderGuardSettings {
    confirmPassword: boolean;
    showNotices: boolean;
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

    async encryptFile(file: TFile, password: string) {
        try {
            if (file.extension !== 'md') {
                return;
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
        } catch (e) {
            console.error(`Failed to encrypt ${file.name}`, e);
            if (this.settings.showNotices) new Notice(`Failed to encrypt ${file.name}`);
        }
    }

    async decryptFile(file: TFile, password: string) {
        try {
            if (file.extension !== 'encrypted') {
                return;
            }

            // Rename back to .md FIRST (to read it properly if needed, but we can read it directly too)
            const content = await this.vaultHandler.readFile(file);
            const json = JSON.parse(content);

            const salt = new Uint8Array(CryptoHelper.base64ToArrayBuffer(json.salt));
            const iv = new Uint8Array(CryptoHelper.base64ToArrayBuffer(json.iv));
            const ciphertext = CryptoHelper.base64ToArrayBuffer(json.data);

            const key = await CryptoHelper.deriveKey(password, salt);
            const decrypted = await CryptoHelper.decrypt(ciphertext, iv, key);

            // Rename to .md
            const newPath = file.path.replace(/\.encrypted$/, '.md');
            await this.vaultHandler.renameFile(file, newPath);

            // Write decrypted content to the (now .md) file
            // Note: After rename, the 'file' object reference usually path updates automatically in Obsidian API
            await this.vaultHandler.modifyFile(file, decrypted);

            if (this.settings.showNotices) new Notice(`Unlocked ${file.basename}`);
        } catch (e) {
            console.error(`Failed to decrypt ${file.name}`, e);
            if (this.settings.showNotices) new Notice(`Failed to decrypt ${file.name} (Wrong password?)`);
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

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    onunload() {
    }
}
