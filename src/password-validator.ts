/**
 * Password strength validation for Folder Guard
 * Ensures users don't encrypt files with weak, easily-guessable passwords
 */

export interface ValidationResult {
    valid: boolean;
    strength?: 'weak' | 'good' | 'strong';
    message: string;
    suggestion?: string;
}

export class PasswordValidator {
    /** Minimum password length (characters) */
    static readonly MIN_LENGTH = 12;
    /** Minimum entropy required for password acceptance (bits per character) */
    static readonly MIN_ENTROPY = 3.0;
    /** Entropy threshold for "strong" vs "good" password rating (bits per character) */
    static readonly STRONG_ENTROPY_THRESHOLD = 4.0;
    /** Maximum consecutive repeated characters allowed */
    static readonly REPEAT_THRESHOLD = 4;

    // Common weak passwords (partial list)
    private static readonly COMMON_PASSWORDS = [
        'password', 'Password1', '123456', '12345678',
        'qwerty', 'abc123', 'password123', 'admin',
        'letmein', 'welcome', 'monkey', '1234567890',
        'iloveyou', 'princess', 'football', 'starwars'
    ];

    /**
     * Validates password strength using multiple criteria:
     * - Minimum length (configurable)
     * - Not a common/weak password
     * - Sufficient entropy (character distribution)
     * - No excessive repeated characters
     * - Optional: Complexity requirements (mixed character types)
     *
     * @param password - The password to validate
     * @param minLength - Minimum password length (default: MIN_LENGTH)
     * @param requireComplexity - Whether to require character type mixing (default: true)
     * @returns ValidationResult with valid flag, strength rating, and user-friendly messages
     */
    static validate(password: string, minLength: number = this.MIN_LENGTH, requireComplexity: boolean = true): ValidationResult {
        // Check minimum length
        if (password.length < minLength) {
            return {
                valid: false,
                strength: 'weak',
                message: `Password must be at least ${minLength} characters long`,
                suggestion: 'Use a longer passphrase with mixed characters'
            };
        }

        // Check against common passwords
        if (this.isCommonPassword(password)) {
            return {
                valid: false,
                strength: 'weak',
                message: 'This password is too common and easily guessed',
                suggestion: 'Use a unique passphrase or password manager'
            };
        }

        // Check for repeated characters (aaaaaa, 111111)
        if (this.hasRepeatedChars(password)) {
            return {
                valid: false,
                strength: 'weak',
                message: 'Password contains too many repeated characters',
                suggestion: 'Avoid repetition for better security'
            };
        }

        // Check complexity requirements (if enabled)
        if (requireComplexity && !this.hasComplexity(password)) {
            return {
                valid: false,
                strength: 'weak',
                message: 'Password must contain mixed character types (uppercase, lowercase, numbers, symbols)',
                suggestion: 'Add uppercase letters, numbers, or symbols'
            };
        }

        // Calculate entropy for final strength rating
        const entropy = this.calculateEntropy(password);
        if (entropy < this.MIN_ENTROPY) {
            return {
                valid: false,
                strength: 'weak',
                message: 'Password lacks complexity (repeated characters or simple patterns)',
                suggestion: 'Mix letters, numbers, and symbols'
            };
        }

        // Strong password - rate by entropy
        return {
            valid: true,
            strength: entropy > this.STRONG_ENTROPY_THRESHOLD ? 'strong' : 'good',
            message: 'Password strength is acceptable'
        };
    }

    /**
     * Checks if password contains mixed character types
     * Requires at least 3 of 4 character types: uppercase, lowercase, numbers, symbols
     *
     * @param password - Password to check
     * @returns True if password has sufficient character type diversity
     */
    private static hasComplexity(password: string): boolean {
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSymbol = /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password);

        const typeCount = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
        return typeCount >= 3; // Require at least 3 of 4 types
    }

    /**
     * Checks if password matches or contains common weak passwords
     */
    private static isCommonPassword(password: string): boolean {
        const lower = password.toLowerCase();
        return this.COMMON_PASSWORDS.some(common =>
            lower === common.toLowerCase() || lower.includes(common.toLowerCase())
        );
    }

    /**
     * Calculates Shannon entropy to measure password complexity
     * Higher entropy = more random/complex password
     *
     * @param password - Password to analyze
     * @returns Entropy in bits per character
     */
    private static calculateEntropy(password: string): number {
        const charCounts = new Map<string, number>();
        for (const char of password) {
            charCounts.set(char, (charCounts.get(char) || 0) + 1);
        }

        let entropy = 0;
        for (const count of charCounts.values()) {
            const p = count / password.length;
            entropy -= p * Math.log2(p);
        }

        return entropy;
    }

    /**
     * Detects excessive character repetition (e.g., "aaaaaa", "111111")
     *
     * @param password - Password to check
     * @param threshold - Number of consecutive repeated chars to trigger (default REPEAT_THRESHOLD)
     * @returns True if password has too many repeated characters
     */
    private static hasRepeatedChars(password: string, threshold: number = this.REPEAT_THRESHOLD): boolean {
        let count = 1;
        for (let i = 1; i < password.length; i++) {
            if (password[i] === password[i - 1]) {
                count++;
                if (count >= threshold) return true;
            } else {
                count = 1;
            }
        }
        return false;
    }
}
