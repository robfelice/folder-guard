import { App, Modal, Setting } from 'obsidian';
import { ValidationResult } from './password-validator';

/**
 * Modal dialog that warns users about weak passwords
 * Provides option to change password or proceed anyway
 */
export class PasswordStrengthModal extends Modal {
    private result: ValidationResult;
    private onAccept: () => void;
    private onCancel: () => void;

    constructor(app: App, result: ValidationResult, onAccept: () => void, onCancel: () => void) {
        super(app);
        this.result = result;
        this.onAccept = onAccept;
        this.onCancel = onCancel;
    }

    onOpen() {
        const { contentEl } = this;

        new Setting(contentEl).setName('Weak password warning').setHeading();

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
                    .setButtonText('Change password')
                    .setCta()
                    .onClick(() => {
                        this.close();
                        this.onCancel();
                    }))
            .addButton((btn) =>
                btn
                    .setButtonText('Use anyway')
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
