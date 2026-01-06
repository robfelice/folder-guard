export class CryptoHelper {
    private static readonly ALGORITHM = 'AES-GCM';
    private static readonly KDF_ALGORITHM = 'PBKDF2';
    private static readonly HASH_ALGORITHM = 'SHA-256';
    private static readonly ITERATIONS = 100000;
    private static readonly KEY_LENGTH = 256;

    static async generateSalt(): Promise<Uint8Array> {
        return window.crypto.getRandomValues(new Uint8Array(16));
    }

    static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            enc.encode(password),
            { name: this.KDF_ALGORITHM },
            false,
            ['deriveBits', 'deriveKey']
        );

        return await window.crypto.subtle.deriveKey(
            {
                name: this.KDF_ALGORITHM,
                salt: salt,
                iterations: this.ITERATIONS,
                hash: this.HASH_ALGORITHM,
            },
            keyMaterial,
            { name: this.ALGORITHM, length: this.KEY_LENGTH },
            false,
            ['encrypt', 'decrypt']
        );
    }

    static async encrypt(data: string, key: CryptoKey): Promise<{ iv: Uint8Array; ciphertext: ArrayBuffer }> {
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const enc = new TextEncoder();
        const encodedData = enc.encode(data);

        const ciphertext = await window.crypto.subtle.encrypt(
            {
                name: this.ALGORITHM,
                iv: iv,
            },
            key,
            encodedData
        );

        return { iv, ciphertext };
    }

    static async decrypt(ciphertext: ArrayBuffer, iv: Uint8Array, key: CryptoKey): Promise<string> {
        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: this.ALGORITHM,
                iv: iv,
            },
            key,
            ciphertext
        );

        const dec = new TextDecoder();
        return dec.decode(decrypted);
    }

    static arrayBufferToBase64(buffer: ArrayBuffer): string {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    static base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binary_string = window.atob(base64);
        const len = binary_string.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
    }
}
