import { App, PluginSettingTab, Setting } from 'obsidian';
import FolderGuard from './main';

export class FolderGuardSettingTab extends PluginSettingTab {
    plugin: FolderGuard;

    constructor(app: App, plugin: FolderGuard) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();
        containerEl.createEl('h2', { text: 'Folder Guard Settings' });

        new Setting(containerEl)
            .setName('Confirm Password')
            .setDesc('Require entering the password twice when encrypting to prevent typos.')
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.confirmPassword)
                    .onChange(async (value) => {
                        this.plugin.settings.confirmPassword = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('Show Notifications')
            .setDesc('Show success/error messages when encrypting or decrypting.')
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.showNotices)
                    .onChange(async (value) => {
                        this.plugin.settings.showNotices = value;
                        await this.plugin.saveSettings();
                    })
            );
    }
}
