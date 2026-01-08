import { TFile, Vault, TFolder } from 'obsidian';

/**
 * Wrapper for Obsidian Vault API file operations
 *
 * Provides a clean abstraction over Obsidian's vault operations,
 * simplifying file I/O and folder traversal for encryption/decryption.
 *
 * @remarks
 * All methods are async wrappers around Obsidian's Vault API
 * Handles both individual files and recursive folder operations
 */
export class VaultHandler {
    constructor(private vault: Vault) { }

    /**
     * Reads file content as UTF-8 string
     *
     * @param file - TFile to read
     * @returns Promise<string> - File content
     *
     * @remarks
     * - Reads entire file into memory
     * - Assumes UTF-8 encoding
     * - Used to read markdown before encryption and encrypted JSON
     *
     * @throws Error if file doesn't exist or can't be read
     */
    async readFile(file: TFile): Promise<string> {
        return await this.vault.read(file);
    }

    /**
     * Overwrites file content with new string
     *
     * @param file - TFile to modify
     * @param content - New content to write (replaces entire file)
     *
     * @remarks
     * - Completely replaces file content
     * - Used to write encrypted JSON or decrypted markdown
     * - Triggers Obsidian's file modified event
     *
     * @throws Error if file can't be written
     */
    async modifyFile(file: TFile, content: string): Promise<void> {
        await this.vault.modify(file, content);
    }

    /**
     * Renames/moves a file to new path
     *
     * @param file - TFile to rename
     * @param newPath - New path within vault (e.g., "folder/file.encrypted")
     *
     * @remarks
     * - Used to change extension (.md ↔ .encrypted)
     * - Obsidian handles duplicate name conflicts
     * - May invalidate file references (caller should get fresh reference)
     * - Triggers Obsidian's file renamed event
     *
     * @throws Error if rename fails or path is invalid
     */
    async renameFile(file: TFile, newPath: string): Promise<void> {
        await this.vault.rename(file, newPath);
    }

    /**
     * Recursively gets all files in folder and subfolders
     *
     * @param folder - TFolder to traverse
     * @returns Promise<TFile[]> - Array of all files found (flattened, depth-first)
     *
     * @remarks
     * - Recursively traverses all subfolders
     * - Returns flat array of TFile objects
     * - Used for folder lock/unlock operations
     * - Processes files in depth-first order
     *
     * @example
     * ```
     * folder/
     *   ├── file1.md
     *   └── subfolder/
     *       └── file2.md
     * // Returns: [file1.md, file2.md]
     * ```
     */
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
