import { App, PluginSettingTab, Setting } from 'obsidian';
import FolderGuard from './main';

/**
 * Settings tab for Folder Guard plugin configuration
 *
 * Provides UI controls for plugin settings in Obsidian's settings panel.
 * Changes are automatically persisted when modified.
 *
 * @remarks
 * **Available Settings:**
 * - **Confirm Password**: Require password re-entry when encrypting (prevents typos)
 * - **Show Notifications**: Toggle success/error toast notifications
 * - **Minimum Password Length**: Configurable minimum password length (6-32 characters)
 * - **Require Password Complexity**: Enforce mixed character types (uppercase, lowercase, numbers, symbols)
 *
 * All settings changes are immediately saved to disk via plugin.saveSettings()
 *
 * @see FolderGuardSettings interface for settings structure
 */
export class FolderGuardSettingTab extends PluginSettingTab {
    plugin: FolderGuard;

    constructor(app: App, plugin: FolderGuard) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();
        new Setting(containerEl).setName('Folder guard settings').setHeading();

        new Setting(containerEl)
            .setName('Confirm password')
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
            .setName('Show notifications')
            .setDesc('Show success/error messages when encrypting or decrypting.')
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.showNotices)
                    .onChange(async (value) => {
                        this.plugin.settings.showNotices = value;
                        await this.plugin.saveSettings();
                    })
            );

        // Password security settings section
        new Setting(containerEl).setName('Password security').setHeading();

        new Setting(containerEl)
            .setName('Minimum password length')
            .setDesc('Minimum number of characters required for passwords (6-32). Recommended: 12 or higher.')
            .addSlider((slider) =>
                slider
                    .setLimits(6, 32, 1)
                    .setValue(this.plugin.settings.minPasswordLength)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.settings.minPasswordLength = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('Require password complexity')
            .setDesc('Require passwords to contain at least 3 of: uppercase, lowercase, numbers, symbols. Disabling this reduces security.')
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.requireComplexity)
                    .onChange(async (value) => {
                        this.plugin.settings.requireComplexity = value;
                        await this.plugin.saveSettings();
                    })
            );
    }
}
