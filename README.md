# Introduction
[cryptostorage.com](https://cryptostorage.com) is an open-source, client-side tool to generate public/private key pairs for multiple cryptocurrencies securely.

The tool runs only in your device's browser so funds are never entrusted to a third party by design.

# Main Features
- Generate secure cold storage for multiple cryptocurrencies.
- 100% open-source, client-side, and free to use.
- Keys are generated only in your browser and are never entrusted to a third party.
- Easily create paper wallets or save to flash drive for safe, long-term storage.
- Passphrase protect and split private keys for maximum security.
- Automated security checks encourage keys to be generated in a secure environment.
	- Encourages application to be downloaded and run offline.
	- Encourages internet to be disconnected.
	- Encourages use of an open-source browser.
	- Encourages use of an open-source operating system.
	
# Supported Tokens
- Bitcoin
- Bitcoin Cash
- Ethereum
- Monero
- Litecoin
- Dash
- Zcash
- Ethereum Classic
- Basic Attention Token
- OmiseGo

# Download and verify the source code
Download and verifying the source code is **highly recommended** but not required to use this tool.

Verifying the source code ensures you have a legitimate copy of this tool that has been publicly reviewed and has not been modified by an attacker.

The source code can be verified in two ways. Either method is sufficient.

Method #1: Verify the source code has the correct checksum.

1. Download cryptostorage-*[version]*.zip and checksum.txt from the [latest release on GitHub](https://github.com/cryptostorage/cryptostorage.com/releases).
2. Determine the SHA256 hash of the zip file.  Instructions depend on your operating system.<br>
 Linux: `sha256sum cryptostorage-[version].zip`<br>
 Mac: `openssl sha -sha256 cryptostorage-[version].zip`<br>
 Windows: `certUtil -hashfile cryptostorage-[version].zip SHA256`
3. Verify that the checksum matches the contents of the downloaded checksum.txt.

Method #2: Verify the source code has been signed by the developer's PGP key.

1. Install [PGP software](https://www.openpgp.org/) on your device.
2. Download the developer's public PGP key, "woodser.asc", from the [root of the GitHub source repository](https://github.com/cryptostorage/cryptostorage.com).
3. Import the PGP key: `gpg --import woodser.asc`
4. Download cryptostorage-*[version]*.zip, cryptostorage-*[version]*.sig, and woodser-pgp-fingerprint.txt from the [latest release on GitHub](https://github.com/cryptostorage/cryptostorage.com/releases).
5. Verify the signature of the source code zip file:<br><br>
    ```
    gpg --verify cryptostorage-[version].sig cryptostorage-[version].zip
    ```
    <br>You should see output with this RSA key:<br>
    ```
    gpg: Signature made Fri Jan 12 09:22:37 2018 EST
    gpg: using RSA key 52FD7C01877CA968C97118D055A10DD48ADEE5EF
    gpg: Good signature ...
    ```
    The RSA key will also match the contents of the downloaded woodser-pgp-fingerprint.txt.<br><br>
    Note: You will probably also see a warning that the key is not certified with a trusted signature. This is expected unless you told PGP to trust woodser’s PGP key, which is not necessary.
	
# Generate cold storage as securely as possible
Following a few recommendations can improve the security of your cryptocurrency.

To generate cold storage as securely as possible, please see https://cryptostorage.com/#faq_generate_keys.

# Other Frequently Asked Questions
Please see https://cryptostorage.com/#faq.

# Submit Questions, Feedback, or Issues
For questions, feedback, or issues, please submit a new issue to https://github.com/cryptostorage/cryptostorage.com/issues.

# Contributing
Contributions from the community are welcome and encouraged.

All are welcome to develop and submit pull requests that make this project better.

# License
This project is licensed under [MIT](https://github.com/cryptostorage/cryptostorage.com/blob/master/LICENSE.txt).

# Donate
Donations may be voluntarily given and support this project.

Please see https://cryptostorage.com/#donate for donation addresses. ❤