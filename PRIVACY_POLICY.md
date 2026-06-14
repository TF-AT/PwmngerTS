# Privacy Policy for PwmngerTS

**Last Updated: February 8, 2026**

The Factory Studios NG (PwmngerTs) is dedicated to protecting your privacy and ensuring your data remains secure. This Privacy Policy describes how we handle information in our open-source, zero-knowledge password manager.

## 1. Zero-Knowledge Architecture

PwmngerTS is built on a **Zero-Knowledge** architecture. This means:

- All encryption and decryption happen locally on your device.
- We **never** see, store, or have access to your master password.
- Your vault data is encrypted with AES-256-GCM before it is synced to our servers.
- We cannot "reset" your password or recover your data if you lose your master password and your emergency recovery kit.

## 2. Information We Collect

Because of our architecture, we collect minimal information:

- **Account Information:** We store your email address (for account identification) and a cryptographic hash of your master password (derived via Argon2id) to authenticate you.
- **Encrypted Vault Data:** We store the encrypted "blobs" of your vault data to allow synchronization across your devices. We cannot read the contents of these blobs.
- **Usage Data:** We do not track your browsing history or which sites you use with the password manager.

## 3. Browser Extension Permissions

Our browser extension requires specific permissions to function correctly. Here is how and why they are used:

- **`storage`**: We use this to save your encrypted vault and settings locally on your device for fast access and offline use.
- **`clipboardWrite`**: This allows you to copy usernames and passwords to your clipboard for manual entry.
- **`activeTab`**: This allows the extension to interact only with the website you are currently viewing to provide autofill services. It is significantly more secure than requiring access to all website data at all times.

## 4. Data Security

We use industry-standard security protocols:

- **Argon2id:** For memory-hard key derivation.
- **AES-256-GCM:** For authenticated client-side encryption.
- **TLS/SSL:** To protect data in transit between your device and our servers.

## 5. Third-Party Services

If you choose to self-host PwmngerTS using our recommended providers (Vercel, Render, Supabase), please review their respective privacy policies as your data will reside on their infrastructure.

## 6. Open Source

PwmngerTS is open-source. You are encouraged to audit our [source code](https://github.com/okikijesutech/PwmngerTS) to verify these privacy claims.

## 7. Contact

For any questions regarding this policy, please open an issue on our GitHub repository.
