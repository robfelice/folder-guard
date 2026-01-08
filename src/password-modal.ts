import { App, Modal, Setting } from 'obsidian';

/**
 * Modal dialog for password entry
 *
 * Provides a simple, secure password input dialog with configurable title and placeholder.
 * Supports Enter key submission for better UX.
 *
 * @remarks
 * - Password field uses HTML password input (characters masked)
 * - Enter key triggers submission
 * - Used for both encryption and decryption password entry
 * - Can be customized with different titles (e.g., "Confirm Password")
 *
 * @example
 * ```typescript
 * new PasswordModal(app, (password) => {
 *     // Handle password securely (never log it!)
 *     this.encryptFile(file, password);
 * }).open();
 * ```
 */
export class PasswordModal extends Modal {
    result: string;
    onSubmit: (result: string) => void;

    constructor(
        app: App,
        onSubmit: (result: string) => void,
        private title: string = 'Enter Password',
        private placeholder: string = 'Enter your password'
    ) {
        super(app);
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;

        contentEl.createEl('h2', { text: this.title });

        new Setting(contentEl)
            .setName('Password')
            .addText((text) =>
                text
                    .setPlaceholder(this.placeholder)
                    .onChange((value) => {
                        this.result = value;
                    })
                    .inputEl.type = 'password' // Make it a password field
            );

        new Setting(contentEl)
            .addButton((btn) =>
                btn
                    .setButtonText('Submit')
                    .setCta()
                    .onClick(() => {
                        this.close();
                        this.onSubmit(this.result);
                    }));

        // Allow pressing Enter to submit
        contentEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.close();
                this.onSubmit(this.result);
            }
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
