import { TFile, Vault, TFolder } from 'obsidian';

export class VaultHandler {
    constructor(private vault: Vault) { }

    async readFile(file: TFile): Promise<string> {
        return await this.vault.read(file);
    }

    async modifyFile(file: TFile, content: string): Promise<void> {
        await this.vault.modify(file, content);
    }

    async renameFile(file: TFile, newPath: string): Promise<void> {
        await this.vault.rename(file, newPath);
    }

    // New folder operations
    async getFiles(folder: TFolder): Promise<TFile[]> {
        let files: TFile[] = [];
        for (const child of folder.children) {
            if (child instanceof TFile) {
                files.push(child);
            } else if (child instanceof TFolder) {
                files = files.concat(await this.getFiles(child));
            }
        }
        return files;
    }

}
