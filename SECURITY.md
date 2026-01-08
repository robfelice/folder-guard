# Security Policy

## Reporting Security Issues

**Please do not open public GitHub issues for security vulnerabilities.**

If you discover a security vulnerability in Folder Guard, please report it via:

📧 **GitHub Security Advisory**: Use the [Security tab](https://github.com/robfelice/folder-guard/security/advisories) to report privately

Or contact the maintainer:
- **GitHub**: [@robfelice](https://github.com/robfelice) (you'll receive notifications)
- **GitHub Discussions**: [Private message](https://github.com/robfelice/folder-guard/discussions) (mark as private)

**Expected response time**: 5 days

Include in your report:
- Description of the vulnerability
- Steps to reproduce (if applicable)
- Potential impact
- Suggested fix (if you have one)

We take security seriously and will work with you to address legitimate vulnerabilities responsibly.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | ✅ Yes    |
| 0.1.x   | ⚠️ Legacy (security updates only) |

## Security Model

### Architecture
- **Client-side encryption only**: All encryption happens on your computer
- **No server components**: No external services, no cloud storage
- **No telemetry**: We don't collect usage data
- **No analytics**: Your activity is not tracked
- **Open source**: Full source code available for audit

### Encryption Standards
- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key derivation**: PBKDF2-HMAC-SHA256 with 100,000 iterations
- **Random generation**: window.crypto.getRandomValues() (CSPRNG)
- **Salt length**: 16 bytes (128 bits)
- **IV length**: 12 bytes (96 bits)
- **Key length**: 256 bits

### File Format
Encrypted files are stored in JSON format:
```json
{
  "version": 1,
  "salt": "base64-encoded-salt",
  "iv": "base64-encoded-iv",
  "ciphertext": "base64-encoded-ciphertext",
  "tag": "base64-encoded-authentication-tag"
}
```

### Password Security
- **Storage**: Passwords are **never stored** on disk or in Obsidian's settings
- **Derivation**: Each encryption derives a unique key from your password using PBKDF2
- **Recovery**: No password recovery mechanism (use a password manager)
- **Validation**: Configurable minimum length (6-32 chars) and optional complexity requirements

### Data Integrity
- **Authentication**: AES-GCM provides authenticated encryption
- **Tampering detection**: Invalid authentication tags are detected before decryption
- **Corruption handling**: Corrupted files are identified and reported with clear error messages

## Known Limitations

### Scope Limitations
- **Markdown files only**: Only `.md` files are encrypted
- **Local storage**: Works only with local Obsidian vaults
- **No mobile support**: Not available on Obsidian mobile
- **No sync support**: Encrypted files may not sync properly with Obsidian Sync

### Design Limitations
- **Password is required each operation**: Every encrypt/decrypt requires password entry
- **No key derivation parameters customization**: PBKDF2 iterations are fixed at 100k
- **Single password per operation**: Cannot encrypt/decrypt with multiple passwords in batch
- **No partial encryption**: Encrypts entire file or nothing

### Security Assumptions
- **Trusted device**: Assumes the computer running Obsidian is not compromised
- **Secure password**: Security depends on password strength
- **No keyloggers**: Assumes no keylogging malware on the system
- **Random number generation**: Relies on browser's CSPRNG

## Best Practices for Users

### Password Security
1. **Use strong passwords**
   - 12+ characters recommended
   - Mix uppercase, lowercase, numbers, symbols
   - Avoid dictionary words and personal information
   - Use a password manager

2. **Never share passwords**
   - Don't share encryption passwords via email/chat
   - Don't paste passwords in documentation
   - Store passwords securely (password manager)

3. **Password recovery**
   - There is no "forgot password" feature
   - If you forget your password, the encrypted file cannot be recovered
   - Keep encrypted files in backups before losing password

### Device Security
1. **Keep system updated**
   - Update OS, Obsidian, and plugins regularly
   - Security patches often fix vulnerabilities

2. **Use antivirus/malware protection**
   - Keyloggers and password-stealing malware can compromise encryption
   - Maintain security software

3. **Secure your vault backup**
   - Regular backups are essential
   - Store backups securely
   - Consider encrypting backups at the file system level

### Obsidian Configuration
1. **Use Obsidian's built-in security**
   - Consider vault encryption if available
   - Enable PIN/biometric lock on mobile
   - Use Obsidian Sync with E2E encryption

2. **Manage plugin permissions**
   - Review plugins before installing
   - Only install from trusted sources
   - Disable plugins you don't use

## Threat Models We Protect Against

### ✅ Protected
- **File theft**: Encrypted files are useless without the password
- **Vault inspection**: Encrypted files appear as random data
- **Network interception**: No network communication occurs
- **Accidental exposure**: Password is never stored in plain text

### ⚠️ Limited Protection
- **Device compromise**: If device has malware with keyboard access
- **Weak passwords**: Brute force attacks become feasible with weak passwords
- **Forgotten passwords**: No recovery mechanism exists

### ❌ Not Protected
- **Stolen device with unlocked Obsidian**: If vault is open and plugin is enabled
- **Malicious Obsidian plugins**: Other plugins could access unencrypted content
- **Operating system vulnerabilities**: OS-level compromise can bypass encryption

## Reporting Non-Security Issues

For non-security bug reports and feature requests, use the standard GitHub issues:
- [Bug reports](https://github.com/robfelice/folder-guard/issues/new?template=bug_report.md)
- [Feature requests](https://github.com/robfelice/folder-guard/issues/new?template=feature_request.md)

## Security Audit History

| Date | Auditor | Status | Notes |
|------|---------|--------|-------|
| 2026-01-07 | Internal | ✅ Pass | Initial security review completed |

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for security-related changes and updates.

## Contact

- 🐛 **Bug reports**: [GitHub Issues](https://github.com/robfelice/folder-guard/issues)
- 🔒 **Security issues**: [GitHub Security Advisory](https://github.com/robfelice/folder-guard/security/advisories) or [@robfelice](https://github.com/robfelice)
- 💬 **General questions**: [GitHub Discussions](https://github.com/robfelice/folder-guard/discussions)
- 👤 **Author**: [Rob Felice](https://github.com/robfelice)

---

**Last Updated**: 2026-01-07
**Security Policy Version**: 1.0
