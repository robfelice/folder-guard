/**
 * Cryptographic helper class for file encryption/decryption operations
 *
 * Implements AES-256-GCM encryption with PBKDF2 key derivation, following
 * OWASP cryptographic storage guidelines and NIST recommendations.
 *
 * @remarks
 * **Encryption Algorithm**: AES-256-GCM (Galois/Counter Mode)
 * - Provides both confidentiality and authenticity
 * - 256-bit key length for long-term security
 * - GCM mode detects tampering automatically
 *
 * **Key Derivation**: PBKDF2-HMAC-SHA256
 * - 100,000 iterations (OWASP recommended minimum)
 * - Unique 16-byte salt per file
 * - Makes brute-force attacks computationally expensive
 *
 * **Initialization Vector**: 12-byte random IV (GCM recommended size)
 * - Generated using cryptographically secure RNG
 * - Unique per encryption operation
 * - Never reused with same key
 *
 * @security
 * All methods use Web Crypto API (crypto.subtle) which:
 * - Runs in isolated cryptographic context
 * - Prevents key material extraction
 * - Uses constant-time operations
 * - Leverages hardware acceleration when available
 *
 * @see https://www.w3.org/TR/WebCryptoAPI/
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
 */
export class CryptoHelper {
    /** AES-GCM encryption algorithm */
    private static readonly ALGORITHM = 'AES-GCM';
    /** PBKDF2 key derivation function */
    private static readonly KDF_ALGORITHM = 'PBKDF2';
    /** SHA-256 hash for PBKDF2 */
    private static readonly HASH_ALGORITHM = 'SHA-256';
    /** 100,000 iterations (OWASP recommended minimum for PBKDF2) */
    private static readonly ITERATIONS = 100000;
    /** 256-bit key length for AES-256 */
    private static readonly KEY_LENGTH = 256;
    /** 16-byte (128-bit) salt for PBKDF2 key derivation */
    private static readonly SALT_LENGTH = 16;
    /** 12-byte (96-bit) initialization vector for AES-GCM (recommended size) */
    private static readonly IV_LENGTH = 12;

    /**
     * Generates a cryptographically secure random salt
     *
     * @returns Uint8Array - 16-byte (128-bit) random salt
     *
     * @remarks
     * - Uses window.crypto.getRandomValues() for CSPRNG
     * - Salt MUST be unique per file to prevent dictionary attacks
     * - 16 bytes provides sufficient entropy for key derivation
     *
     * @security
     * Never reuse salts - each encryption gets a fresh salt
     */
    static generateSalt(): Uint8Array {
        return window.crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
    }

    /**
     * Derives an AES-256 encryption key from password using PBKDF2
     *
     * @param password - User-provided password (strength validated separately)
     * @param salt - Unique salt for this file (16 bytes)
     * @returns Promise<CryptoKey> - AES-256 key for encrypt/decrypt operations
     *
     * @remarks
     * **Process**:
     * 1. Import password as raw key material
     * 2. Apply PBKDF2 with 100,000 iterations and SHA-256
     * 3. Derive 256-bit AES-GCM key
     *
     * **Why PBKDF2?**
     * - Deliberately slow to thwart brute-force attacks
     * - 100,000 iterations ≈ 100ms on modern hardware
     * - Makes password guessing computationally expensive
     *
     * @security
     * - Key never leaves crypto.subtle context
     * - Cannot be extracted or serialized
     * - Marked as non-exportable for security
     * - Uses constant-time operations
     *
     * @throws DOMException if key derivation fails
     */
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

    /**
     * Encrypts plaintext using AES-256-GCM
     *
     * @param data - Plaintext string to encrypt (typically file content)
     * @param key - AES-256 key from deriveKey()
     * @returns Promise containing IV and ciphertext
     *
     * @remarks
     * **Process**:
     * 1. Generate fresh 12-byte IV (recommended size for GCM)
     * 2. Encode plaintext as UTF-8
     * 3. Encrypt using AES-256-GCM
     * 4. Return IV + ciphertext (both needed for decryption)
     *
     * **Why GCM mode?**
     * - Authenticated encryption (AEAD)
     * - Detects tampering automatically
     * - No separate HMAC needed
     * - Efficient and parallelizable
     *
     * @security
     * - IV MUST be unique for each encryption
     * - Never reuse IV with same key (breaks GCM security)
     * - Authentication tag automatically included in ciphertext
     *
     * @throws DOMException if encryption fails
     */
    static async encrypt(data: string, key: CryptoKey): Promise<{ iv: Uint8Array; ciphertext: ArrayBuffer }> {
        const iv = window.crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
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

    /**
     * Decrypts ciphertext using AES-256-GCM
     *
     * @param ciphertext - Encrypted data from encrypt()
     * @param iv - Initialization vector used during encryption (12 bytes)
     * @param key - AES-256 key from deriveKey() (must match encryption key)
     * @returns Promise<string> - Decrypted plaintext
     *
     * @remarks
     * **Process**:
     * 1. Decrypt using AES-256-GCM with provided IV
     * 2. GCM automatically verifies authentication tag
     * 3. Decode decrypted bytes as UTF-8 string
     *
     * **Authentication**:
     * - GCM mode verifies data integrity automatically
     * - Throws if ciphertext has been tampered with
     * - Throws if wrong key/IV used
     *
     * @security
     * - Wrong password detected immediately (throws DOMException)
     * - Tampering detected by GCM authentication tag
     * - No partial decryption on failure
     *
     * @throws DOMException if decryption fails (wrong password, corrupted data, tampering)
     */
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

    /**
     * Converts ArrayBuffer to Base64 string for storage
     *
     * @param buffer - Binary data to encode
     * @returns Base64-encoded string
     *
     * @remarks
     * Used to convert binary cryptographic data (salt, IV, ciphertext) into
     * text format suitable for JSON storage in .encrypted files.
     *
     * **Process**:
     * 1. Convert ArrayBuffer to byte array
     * 2. Convert bytes to binary string
     * 3. Encode binary string as Base64
     *
     * @see base64ToArrayBuffer for decoding
     */
    static arrayBufferToBase64(buffer: ArrayBuffer): string {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    /**
     * Converts Base64 string back to ArrayBuffer
     *
     * @param base64 - Base64-encoded string from .encrypted file
     * @returns ArrayBuffer containing decoded binary data
     *
     * @remarks
     * Inverse of arrayBufferToBase64(). Used to restore binary cryptographic
     * parameters (salt, IV, ciphertext) from JSON storage.
     *
     * **Process**:
     * 1. Decode Base64 to binary string
     * 2. Convert binary string to byte array
     * 3. Return ArrayBuffer view of bytes
     *
     * @throws DOMException if Base64 string is invalid
     * @see arrayBufferToBase64 for encoding
     */
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
