# Introduction
CryptoStorage is an open-source tool to generate offline storage for multiple cryptocurrencies.  This tool generates [key pairs](https://cryptostorage.com/#faq_key_pair) in your device's browser which can store cryptocurrency without exposing private keys to an internet-connected device.  Generated key pairs can be saved to file or printed to paper for long-term "cold" storage.

This tool is security-focused. Keys are generated only in your device's browser so funds are never entrusted to a third party.  Keys can be passphrase-protected and [split into pieces](https://cryptostorage.com/#faq_split_keys) which can be geographically separated so funds are not accessible at any one location.  [Recommendations](https://cryptostorage.com/#faq_recommendations) are automatically provided to improve the security of the tool's environment.

# Main Features
- Generate secure cold storage for multiple cryptocurrencies.
- 100% open-source, client-side, and free to use.
- Keys are generated only in your browser and are never entrusted to a third party.
- Create paper wallets or save to flash drive for long-term storage.
- Passphrase-protect and split private keys for maximum security.
- Supports BIP38 encryption for Bitcoin and Bitcoin Cash.
- Automatic security checks encourage keys to be generated in a secure environment.
	- Encourages internet to be disconnected.
	- Encourages tool to be downloaded and run offline.
	- Encourages using an open-source browser.
	- Encourages using an open-source operating system.
	
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

# ⚠ First Release
This is the first release of this software.  It should not be trusted with signficant amounts until it is reviewed by the community.

# Using this Tool as Securely as Possible

Security is a spectrum.  The following procedure is recommended to use this tool as securely as possible:

1. [Download and verify cryptostorage.com-*[version]*.zip.](#download-and-verify-the-source-code)
2. Transfer cryptostorage.com-*[version]*.zip to a secure computer using a flash drive.
    - The computer should be disconnected from the internet and ideally will never connect to the internet again.
    - An open-source operating system is recommended like [Tails](https://tails.boum.org), [Debian](https://www.debian.org/), or [Raspbian for the Raspberry Pi](https://www.raspberrypi.org).
3. Unzip cryptostorage.com-*[version]*.zip.
4. Open index.html in the unzipped folder in a browser.
    - An open-source browser is recommended like [Firefox](https://www.mozilla.org/en-US/firefox/) or [Chromium](https://www.chromium.org/getting-involved/download-chromium).
5. Confirm that all environment checks pass.
    1. Go to Generate New Keys from the homepage.
    2. The notice bar at the top should indicate that all security checks pass.
6. Fill out the form and click Generate Keys.
    - Protecting your keys with a passphrase is *highly recommended*.  Otherwise anyone in possession of the unencrypted keys can access the funds.
    - Optionally split your keys for maximum security.
7. Save the generated keys to a flash drive or printed paper for safe keeping.  Geographic redundancy is highly recommended so if one location is lost due to fire, flood, theft, etc, there are backup copies at other locations.

The keys can be imported at any time by relaunching this tool in a secure environment.
 
⚠ **Do not lose the generated keys or the password or the funds will be lost.**

# Download and Verify the Source Code
Verifying the source code ensures you have a copy of this tool that has been publicly reviewed and has not been modified by an attacker.

Downloading and verifying the source code is *highly recommended* but not required to use this tool.

The source code can be verified in two ways. Either method is sufficient.

## Method #1: Verify the source code has the correct checksum.

1. Download cryptostorage-*[version]*.zip and cryptostorage-*[version]*-checksum.txt from the [latest release on GitHub](https://github.com/cryptostorage/cryptostorage.com/releases).
2. Determine the SHA256 hash of the zip file.  Instructions depend on your operating system.<br>
 Linux: `sha256sum cryptostorage-[version].zip`<br>
 Mac: `openssl sha -sha256 cryptostorage-[version].zip`<br>
 Windows: `certUtil -hashfile cryptostorage-[version].zip SHA256`
3. Verify that the checksum matches the contents of the previously downloaded cryptostorage-*[version]*-checksum.txt.

## Method #2: Verify the source code has been signed by the developer's PGP key.

1. Install [PGP software](https://www.openpgp.org/) on your device.
2. Download the developer's public PGP key, "woodser.asc", from the [root of the GitHub source repository](https://github.com/cryptostorage/cryptostorage.com).
3. Import the PGP key: `gpg --import woodser.asc`
4. Download cryptostorage-*[version]*.zip, cryptostorage-*[version]*.sig, and woodser-pgp-fingerprint.txt from the [latest release on GitHub](https://github.com/cryptostorage/cryptostorage.com/releases).
5. Verify the signature of cryptostorage-*[version]*.zip:
    ```
    gpg --verify cryptostorage-[version].sig cryptostorage-[version].zip
    ```
    You should see output with this RSA key:<br>
    ```
    gpg: Signature made Fri Jan 12 09:22:37 2018 EST
    gpg: using RSA key 52FD7C01877CA968C97118D055A10DD48ADEE5EF
    gpg: Good signature ...
    ```
    The RSA key will also match the contents of the previously downloaded woodser-pgp-fingerprint.txt.<br><br>
    Note: You will probably also see a warning that the key is not certified with a trusted signature. This is expected unless you told PGP to trust woodser’s PGP key, which is not necessary.

# Frequently Asked Questions
Please see https://cryptostorage.com/#faq.

# Contact

For bug reports and feature requests, please submit an issue to https://github.com/cryptostorage/cryptostorage.com/issues.

For community discussion, please join the conversation on Reddit at https://reddit.com/r/cryptostorage.

For email support, please email support@cryptostorage.com.  Emails are answered on a best-effort basis only.

*No one can recover lost keys or passwords for you. Do not lose these or your funds will be lost.*

# Contributing
Anyone may develop and submit pull requests to improve this project.

All contributions are welcome.

# License
This project is [MIT](https://github.com/cryptostorage/cryptostorage.com/blob/master/LICENSE.txt) licensed.

# Donate
Donations may be voluntarily given to support this project. ❤

See https://cryptostorage.com/#donate for donation addresses.