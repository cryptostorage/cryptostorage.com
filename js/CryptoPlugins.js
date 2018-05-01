/**
 * MIT License
 * 
 * Copyright (c) 2018 cryptostorage
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Base plugin that each currency must implement.
 */
function CryptoPlugin() { }

/**
 * Returns the name.
 */
CryptoPlugin.prototype.getName = function() { throw new Error("Subclass must implement"); }

/**
 * Returns the ticker symbol.
 */
CryptoPlugin.prototype.getTicker = function() { throw new Error("Subclass must implement"); }

/**
 * Returns the name of the token's private component.
 */
CryptoPlugin.prototype.getPrivateLabel = function() { return "Private Key"; }

/**
 * Returns the logo.
 */
CryptoPlugin.prototype.getLogo = function() {
	return $("<img src='" + this.getLogoPath() + "'>");
}

/**
 * Returns the logo path.
 */
CryptoPlugin.prototype.getLogoPath = function() { throw new Error("Subclass must implement"); }

/**
 * Returns an array of dependency paths for the plugin.
 */
CryptoPlugin.prototype.getDependencies = function() { throw new Error("Subclass must implement"); }

/**
 * Returns the donation address associated with the currency.
 */
CryptoPlugin.prototype.getDonationAddress = function() { throw new Error("Subclass must implement"); }

/**
 * Returns the supported encryption schemes.
 */
CryptoPlugin.prototype.getEncryptionSchemes = function() { return [AppUtils.EncryptionScheme.V1_CRYPTOJS, AppUtils.EncryptionScheme.V0_CRYPTOJS]; }

/**
 * Generates and decodes a random private key.
 */
CryptoPlugin.prototype.decodeRandom = function() {
	return this.prototype.decode(this.prototype.randomPrivateKey());
}

/**
 * Returns a new keypair.
 * 
 * @param privateKey is a private key to initialize with.  Generates a random key if not given.
 * @returns a new keypair initialized from the plugin
 */
CryptoPlugin.prototype.newKeypair = function(privateKey) {
	return new CryptoKeypair({plugin: this, privateKey: privateKey});
}

/**
 * Generates a random private key in hex or wif format.
 * 
 * @returns a random private key string
 */
CryptoPlugin.prototype.randomPrivateKey = function() { throw new Error("Subclass must implement"); };

/**
 * Decodes the given private key.  Decodes a randomly generated private key if not given.
 * 
 * @param privateKey is the private key to decode (optional)
 * 
 * @returns {
 *   publicAddress: str
 *   privateHex: str
 *   privateWif: str
 *   encryption: str	// encryption scheme, null if unencrypted
 * }
 */
CryptoPlugin.prototype.decode = function(privateKey) { throw new Error("Subclass must implement"); }

/**
 * Indicates if the plugin has public addresses (e.g. BIP39 does not)
 */
CryptoPlugin.prototype.hasPublicAddress = function() { return true; };

/**
 * Determines if the given string is a valid address.
 */
CryptoPlugin.prototype.isAddress = function(str) { throw new Error("Subclass must implement"); }

/**
 * Bitcoin plugin.
 */
function BitcoinPlugin() {
	var that = this;
	this.getName = function() { return "Bitcoin"; }
	this.getTicker = function() { return "BTC" };
	this.getLogoPath = function() { return "img/bitcoin.png"; }
	this.getDependencies = function() { return ["lib/bitaddress.js"]; }
	this.getDonationAddress = function() { return "1ArmuyQfgM1Sd3tN1A242FzPhbePfCjbmE"; }
	this.getEncryptionSchemes = function() { return [AppUtils.EncryptionScheme.V1_CRYPTOJS, AppUtils.EncryptionScheme.BIP38, AppUtils.EncryptionScheme.V0_CRYPTOJS]; }
	
	this.randomPrivateKey = function() {
		return new Bitcoin.ECKey().setCompressed(true).getBitcoinHexFormat();
	}
	
	this.decode = function(str) {
		assertString(str);
		assertInitialized(str);
		var decoded = {};
		
		// unencrypted
		if (ninja.privateKey.isPrivateKey(str)) {
			var key = new Bitcoin.ECKey(str);
			key.setCompressed(true);
			decoded.publicAddress = key.getBitcoinAddress();
			decoded.privateHex = key.getBitcoinHexFormat();
			decoded.privateWif = key.getBitcoinWalletImportFormat();
			decoded.encryption = null;
			return decoded;
		}
		
		// bip38 wif
		if (ninja.privateKey.isBIP38Format(str)) {
			decoded.privateHex = Crypto.util.bytesToHex(Bitcoin.Base58.decode(str));
			decoded.privateWif = str;
			decoded.encryption = AppUtils.EncryptionScheme.BIP38;
			return decoded;
		}
		
		// bip38 hex
		if (str.length > 80 && str.length < 90 && isHex(str)) return that.decode(AppUtils.toBase(16, 58, str));			
		
		// otherwise cannot decode
		return null;
	}
	
	this.isAddress = function(str) {
		try {
			Bitcoin.Address.decodeString(str);
			return true;
		} catch (err) {
			return false;
		}
	}
}
inheritsFrom(BitcoinPlugin, CryptoPlugin);

/**
 * Bitcoin Cash plugin.
 */
function BitcoinCashPlugin() {
	var bitcoinPlugin = new BitcoinPlugin();
	this.getName = function() { return "Bitcoin Cash"; }
	this.getTicker = function() { return "BCH" };
	this.getLogoPath = function() { return "img/bitcoin_cash.png"; }
	this.getDependencies = function() { return ["lib/bitaddress.js", "lib/bchaddrjs-0.1.4.js"]; }
	this.getDonationAddress = function() { return "qqcsh20ltcnxxw2wqd3m7j8j8qeh46qwuv5s93987x"; }
	this.getEncryptionSchemes = function() { return [AppUtils.EncryptionScheme.V1_CRYPTOJS, AppUtils.EncryptionScheme.BIP38, AppUtils.EncryptionScheme.V0_CRYPTOJS]; }
	
	this.randomPrivateKey = function() {
		return bitcoinPlugin.randomPrivateKey();
	}
	
	this.decode = function(str) {
		var decoded = bitcoinPlugin.decode(str);
		if (!decoded) return null;
		if (!decoded.publicAddress) return decoded;
		var cashAddr =  bchaddr.toCashAddress(decoded.publicAddress);
		decoded.publicAddress = cashAddr.substring(cashAddr.indexOf(':') + 1);
		return decoded;
	}
	
	this.isAddress = function(str) {
		if (bitcoinPlugin.isAddress(str)) return true;
		try {
			return bchaddr.isCashAddress(str);
		} catch (err) {
			return false;
		}
	}
}
inheritsFrom(BitcoinCashPlugin, CryptoPlugin);

/**
 * Ethereum plugin.
 */
function EthereumPlugin() {
	this.getName = function() { return "Ethereum"; }
	this.getTicker = function() { return "ETH" };
	this.getLogoPath = function() { return "img/ethereum.png"; }
	this.getDependencies = function() { return ["lib/bitaddress.js", "lib/keythereum.js", "lib/ethereumjs-util.js"]; }
	this.getDonationAddress = function() { return "0x8074da70E22a58A9E4a5DCeCf968Ea499D60e470"; }
	
	this.randomPrivateKey = function() {
		return keythereum.create().privateKey.toString("hex");
	}
	
	this.decode = function(str) {
		assertString(str);
		assertInitialized(str);
			
		// unencrypted hex 
		if (str.length >= 63 && str.length <= 65 && isHex(str)) {
			var decoded = {};
			decoded.privateHex = str;
			decoded.privateWif = str;
			decoded.publicAddress = ethereumjsutil.toChecksumAddress(keythereum.privateKeyToAddress(decoded.privateHex));
			decoded.encryption = null;
			return decoded;
		}
		
		// otherwise cannot decode
		return null;
	}
	
	this.isAddress = function(str) {
		return ethereumjsutil.isValidAddress(str);
	}
}
inheritsFrom(EthereumPlugin, CryptoPlugin);

/**
 * Ethereum classic plugin.
 */
function EthereumClassicPlugin() {
	EthereumPlugin.call(this);
	this.getName = function() { return "Ethereum Classic"; }
	this.getTicker = function() { return "ETC" };
	this.getLogoPath = function() { return "img/ethereum_classic.png"; }
	this.getDonationAddress = function() { return "0xa3cbe053aebfee6860e82c3ad1415279d8c51503"; }
}
inheritsFrom(EthereumClassicPlugin, EthereumPlugin);

/**
 * OmiseGo plugin.
 */
function OmiseGoPlugin() {
	EthereumPlugin.call(this);
	this.getName = function() { return "OmiseGo"; }
	this.getTicker = function() { return "OMG" };
	this.getLogoPath = function() { return "img/omisego.png"; }
	this.getDonationAddress = function() { return "0x8b0391215e691c0bee419511e6ec77b1416e8593"; }
}
inheritsFrom(OmiseGoPlugin, EthereumPlugin);

/**
 * Basic Attention Token plugin.
 */
function BasicAttentionTokenPlugin() {
	EthereumPlugin.call(this);
	this.getName = function() { return "Basic Attention Token"; }
	this.getTicker = function() { return "BAT" };
	this.getLogoPath = function() { return "img/bat.png"; }
	this.getDonationAddress = function() { return "0xf4537a85814e014e0fe31001ae5c5ed68082dbe1"; }
}
inheritsFrom(BasicAttentionTokenPlugin, EthereumPlugin);

/**
 * Ubiq plugin.
 */
function UbiqPlugin() {
	EthereumPlugin.call(this);
	this.getName = function() { return "Ubiq"; }
	this.getTicker = function() { return "UBQ" };
	this.getLogoPath = function() { return "img/ubiq.png"; }
	this.getDonationAddress = function() { return "0x0B55537E61B15b5f7601DcBf3Dd26e29a0AeD835"; }
}
inheritsFrom(UbiqPlugin, EthereumPlugin);

/**
 * Litecoin plugin.
 */
function LitecoinPlugin() {
	this.getName = function() { return "Litecoin"; }
	this.getTicker = function() { return "LTC" };
	this.getLogoPath = function() { return "img/litecoin.png"; }
	this.getDependencies = function() { return ["lib/bitaddress.js", "lib/litecore.js"]; }
	this.getDonationAddress = function() { return "LSRx2UwU5rjKGcmUXx8KDNTNXMBV1PudHB"; }
	
	this.randomPrivateKey = function() {
		return new litecore.PrivateKey().toString();
	}
	
	this.decode = function(str) {
		assertString(str);
		assertInitialized(str);
		
		// unencrypted
		if (str.length >= 52 && litecore.PrivateKey.isValid(str)) {	// litecore says 'ab' is valid?
			var decoded = {};
			var key = new litecore.PrivateKey(str);
			decoded.privateHex = key.toString();
			decoded.privateWif = key.toWIF();
			decoded.publicAddress = key.toAddress().toString();
			decoded.encryption = null;
			return decoded;
		}
		
		// otherwise key is not recognized
		return null;
	}
	
	this.isAddress = function(str) {
		return litecore.Address.isValid(str);
	}
}
inheritsFrom(LitecoinPlugin, CryptoPlugin);

/**
 * Dash plugin.
 */
function DashPlugin() {
	this.getName = function() { return "Dash"; }
	this.getTicker = function() { return "DASH" };
	this.getLogoPath = function() { return "img/dash.png"; }
	this.getDependencies = function() { return ["lib/crypto-js.js", "lib/bitaddress.js", "lib/dashcore.js"]; }
	this.getDonationAddress = function() { return "XoK6AmEGxAh2WKMh2hkVycnkEdmi8zDaQR"; }
	
	this.randomPrivateKey = function() {
		return new dashcore.PrivateKey().toString();
	}
	
	this.decode = function(str) {
		assertString(str);
		assertInitialized(str);
		
		// unencrypted
		if (str.length >= 52 && dashcore.PrivateKey.isValid(str)) {	// dashcore says 'ab' is valid?
			var decoded = {};
			var key = new dashcore.PrivateKey(str);
			decoded.privateHex = key.toString();
			decoded.privateWif = key.toWIF();
			decoded.publicAddress = key.toAddress().toString();
			decoded.encryption = null;
			return decoded;
		}
		
		// otherwise key is not recognized
		return null;
	}
	
	this.isAddress = function(str) {
		return dashcore.Address.isValid(str);
	}
}
inheritsFrom(DashPlugin, CryptoPlugin);

/**
 * Monero plugin.
 */
function MoneroPlugin() {
	this.getName = function() { return "Monero"; }
	this.getTicker = function() { return "XMR" };
	this.getPrivateLabel = function() { return "Mnemonic"; }
	this.getLogoPath = function() { return "img/monero.png"; }
	this.getDependencies = function() { return ["lib/bitaddress.js", "lib/moneroaddress.js"]; }
	this.getDonationAddress = function() { return "42fuBvVfgPUWphR6C5XgsXDGfx2KVhbv4cjhJDm9Y87oU1ixpDnzF82RAWCbt8p81f26kx3kstGJCat1YEohwS1e1o27zWE"; }
	
	this.randomPrivateKey = function() {
		return cnUtil.sc_reduce32(cnUtil.rand_32());
	}
	
	this.decode = function(str) {
		assertString(str);
		assertInitialized(str);
		var decoded = {};
		
		// unencrypted wif
		if (str.indexOf(' ') !== -1) {
			try { decoded.privateHex = mn_decode(str); }
			catch (err) { return null };
			decoded.privateWif = str;
			decoded.publicAddress = cnUtil.create_address(decoded.privateHex).public_addr;
			decoded.encryption = null;
			return decoded;
		}
		
		// unencrypted hex
		else if (str.length >= 63 && str.length <= 65 && isHex(str)) {
			var address = cnUtil.create_address(str);
			if (!cnUtil.valid_keys(address.view.pub, address.view.sec, address.spend.pub, address.spend.sec)) throw new Error("Invalid address keys derived from hex key");
			decoded.privateHex = str;
			decoded.privateWif = mn_encode(decoded.privateHex, 'english');
			decoded.publicAddress = address.public_addr;
			decoded.encryption = null;
			return decoded;
		}
		
		// otherwise key is not recognized
		return null;
	}
	
	this.isAddress = function(str) {
		if (!isString(str)) return false;
		try {
			cnUtil.decode_address(str);
			return true;
		} catch (err) {
			return false;
		}
	}
}
inheritsFrom(MoneroPlugin, CryptoPlugin);

/**
 * Zcash plugin.
 */
function ZcashPlugin() {
	this.getName = function() { return "Zcash"; }
	this.getTicker = function() { return "ZEC" };
	this.getLogoPath = function() { return "img/zcash.png"; }
	this.getDependencies = function() { return ["lib/bitaddress.js", "lib/zcashcore.js"]; }
	this.getDonationAddress = function() { return "t1g1AQ8Q8yWbkBntunJaKADJ38YjxsDuJ3H"; }
	
	this.randomPrivateKey = function() {
		return new zcashcore.PrivateKey().toString();
	}
	
	this.decode = function(str) {
		assertString(str);
		assertInitialized(str);
		
		// unencrypted
		if (str.length >= 52 && zcashcore.PrivateKey.isValid(str)) {	// zcashcore says 'ab' is valid?
			var decoded = {};
			var key = new zcashcore.PrivateKey(str);
			decoded.privateHex = key.toString();
			decoded.privateWif = key.toWIF();
			decoded.publicAddress = key.toAddress().toString();
			decoded.encryption = null;
			return decoded;
		}
		
		// otherwise key is not recognized
		return null;
	}
	
	this.isAddress = function(str) {
		return zcashcore.Address.isValid(str);
	}
}
inheritsFrom(ZcashPlugin, CryptoPlugin);

/**
 * Ripple plugin.
 */
function RipplePlugin() {
	this.getName = function() { return "Ripple"; }
	this.getTicker = function() { return "XRP" };
	this.getLogoPath = function() { return "img/ripple.png"; }
	this.getDependencies = function() { return ["lib/bitaddress.js", "lib/ripple-key-pairs.js"]; }
	this.getDonationAddress = function() { return "r9AWMe2aSjTaj9aWpGrXQAHruodTDnHfaK"; }
	
	this.randomPrivateKey = function() {
		return ripple_key_pairs.generateSeed();
	}
	
	this.decode = function(str) {
		assertString(str);
		assertInitialized(str);
		var decoded = {};
		
		// unencrypted wif
		if (str.length === 29 && isBase58(str)) {
			decoded.privateHex = Crypto.util.bytesToHex(Bitcoin.Base58.decode(str));
			decoded.privateWif = str;
			decoded.publicAddress = ripple_key_pairs.deriveAddress(ripple_key_pairs.deriveKeypair(str).publicKey);
			decoded.encryption = null;
			return decoded;
		}
		
		// unencrypted hex
		if (str.length === 44 && isHex(str)) {
			decoded.privateHex = str;
			decoded.privateWif = Bitcoin.Base58.encode(Crypto.util.hexToBytes(str));
			decoded.publicAddress = ripple_key_pairs.deriveAddress(ripple_key_pairs.deriveKeypair(decoded.privateWif).publicKey);			
			decoded.encryption = null;
			return decoded;
		}
		
		// otherwise key is not recognized
		return null;
	}
	
	this.isAddress = function(str) {
		return isString(str) && (str.length === 33  || str.length === 34) && isBase58(str);
	}
}
inheritsFrom(RipplePlugin, CryptoPlugin);

/**
 * Stellar plugin.
 */
function StellarPlugin() {
	this.getName = function() { return "Stellar"; }
	this.getTicker = function() { return "XLM" };
	this.getLogoPath = function() { return "img/stellar.png"; }
	this.getDependencies = function() { return ["lib/bitaddress.js", "lib/stellar-base.js"]; }
	this.getDonationAddress = function() { return "GBZBQUK27UKX76JMIURN5ESMJ3EEIAWQONM7HKCIUIRG66ZKLPVKT5Y6"; }
	
	this.randomPrivateKey = function() {
		return StellarBase.Keypair.random().secret();
	}
	
	this.decode = function(str) {
		assertString(str);
		assertInitialized(str);
		var decoded = {};
		
		// unencrypted wif
		if (str.length === 56 && isUpperCase(str) && isBase32(str)) {
			var keypair;
			try { keypair = StellarBase.Keypair.fromSecret(str) }
			catch (err) { return null; }
			decoded.privateHex = keypair.rawSecretKey().toString('hex');
			decoded.privateWif = str;			
			decoded.publicAddress = keypair.publicKey();
			decoded.encryption = null;
			return decoded;
		}

		// unencrypted hex
		if (str.length === 64 && isHex(str)) {
			var rawSecret = new Uint8Array(Crypto.util.hexToBytes(str));
			var keypair = StellarBase.Keypair.fromRawEd25519Seed(rawSecret);
			decoded.privateHex = str;
			decoded.privateWif = keypair.secret();
			decoded.publicAddress = keypair.publicKey();
			decoded.encryption = null;
			return decoded;
		}
		
		// otherwise key is not recognized
		return null;
	}
	
	this.isAddress = function(str) {
		return isString(str) && isUpperCase(str) && str.length === 56 && isBase32(str);
	}
}
inheritsFrom(StellarPlugin, CryptoPlugin);

/**
 * BIP39 plugin.
 */
function BIP39Plugin() {
	this.getName = function() { return "BIP39"; }
	this.getTicker = function() { return "BIP39" };
	this.getPrivateLabel = function() { return "Mnemonic"; }
	this.getLogoPath = function() { return "img/usb.png"; }
	this.getDependencies = function() { return ["lib/bip39.js"]; }
	this.getDonationAddress = function() { return null; }
	this.hasPublicAddress = function() { return false; }
	
	var mnemonic;
	var language = "english";
	
	this.randomPrivateKey = function() {
		if (!mnemonic) mnemonic = new Mnemonic(language);
		return mnemonic.generate(256);
	}
	
	this.decode = function(str) {

		// initialize
		assertString(str);
		assertInitialized(str);
		var wordlist = WORDLISTS[language];
		var shamir39 = new Shamir39();
		if (!mnemonic) mnemonic = new Mnemonic(language);
		var decoded = {};
		
		// unencrypted wif
		if (mnemonic.check(str)) {
			decoded.privateHex = shamir39.getHexFromWords(mnemonic.splitWords(str), wordlist);
			decoded.privateWif = str;
			decoded.encryption = null;
			return decoded;
		}
		
		// unencrypted hex
		if (str.length === 66 && isHex(str)) {
			decoded.privateHex = str;
			decoded.privateWif = mnemonic.joinWords(shamir39.getWordsFromHex(str, wordlist));
			decoded.encryption = null;
			return decoded;
		}
		
		// unrecognized bip39 wif or hex phrase
		return null;
	}
	
	this.isAddress = function(str) {
		return isUndefined(str);
	}
}
inheritsFrom(BIP39Plugin, CryptoPlugin);

/**
 * Waves plugin.
 */
function WavesPlugin() {
	this.getName = function() { return "Waves"; }
	this.getTicker = function() { return "WAVES" };
	this.getPrivateLabel = function() { return "Mnemonic"; }
	this.getLogoPath = function() { return "img/waves.png"; }
	this.getDependencies = function() { return ["lib/bip39.js", "lib/polyfill.js", "lib/waves-api.js"]; }
	this.getDonationAddress = function() { return "3P2xXtsfe4FUnQmu2iuKwXLshYYc2CjnXQH"; }
	
	var waves; 
	
	this.randomPrivateKey = function() {
		if (!waves) waves = WavesAPI.create(WavesAPI.MAINNET_CONFIG);
		return waves.Seed.create().phrase;
	}
	
	this.decode = function(str) {
		
		// initialize
		assertString(str);
		assertInitialized(str);
		if (!waves) waves = WavesAPI.create(WavesAPI.MAINNET_CONFIG);
		var wordlist = waves.Seed.getSeedDictionary();
		var shamir39 = new Shamir39();
		var decoded = {};

		// unencrypted wif
		if (str.indexOf(' ') !== -1 && str.split(' ').length === 15) {
			decoded.privateHex = shamir39.getHexFromWords(str.split(' '), wordlist);
			decoded.privateWif = str;
			decoded.publicAddress = waves.Seed.fromExistingPhrase(decoded.privateWif).address;
			decoded.encryption = null;
			return decoded;
		}
		
		// unencrypted hex
		if (str.length === 42 && isHex(str)) {
			decoded.privateHex = str;
			decoded.privateWif = shamir39.getWordsFromHex(str, wordlist).join(' ');
			decoded.publicAddress = waves.Seed.fromExistingPhrase(decoded.privateWif).address;
			decoded.encryption = null;
			return decoded;
		}
		
		// unrecognized wif or hex
		return null;
	}
	
	this.isAddress = function(str) {
		var Waves = WavesAPI.create(WavesAPI.MAINNET_CONFIG);
		try {
			return Waves.crypto.isValidAddress(str);
		} catch (err) {
			return false;;
		}
	}
}
inheritsFrom(WavesPlugin, CryptoPlugin);

/**
 * Neo plugin.
 */
function NeoPlugin() {
	this.getName = function() { return "Neo"; }
	this.getTicker = function() { return "NEO" };
	this.getLogoPath = function() { return "img/neo.png"; }
	this.getDependencies = function() { return ["lib/neon.js"]; }
	this.getDonationAddress = function() { return "AXi7Y5cKG6BWXwUcA5hbCmrExxwbA2yK32"; }
	
	this.randomPrivateKey = function() {
		return Neon.wallet.generatePrivateKey();
	}
	
	this.decode = function(str) {
		assertString(str);
		assertInitialized(str);
		var decoded = {};
		
		// unencrypted wif
		if (Neon.wallet.isWIF(str)) {
			decoded.privateHex = Neon.wallet.getPrivateKeyFromWIF(str);
			decoded.privateWif = str;
			decoded.publicAddress = Neon.wallet.getAddressFromScriptHash(Neon.wallet.getScriptHashFromPublicKey(Neon.wallet.getPublicKeyFromPrivateKey(decoded.privateHex)));
			decoded.encryption = null;
			return decoded;
		}
		
		// unencrypted hex
		if (str.length === 64 && isHex(str)) {
			decoded.privateHex = str;
			decoded.privateWif = Neon.wallet.getWIFFromPrivateKey(decoded.privateHex);
			decoded.publicAddress = Neon.wallet.getAddressFromScriptHash(Neon.wallet.getScriptHashFromPublicKey(Neon.wallet.getPublicKeyFromPrivateKey(decoded.privateHex)));
			decoded.encryption = null;
			return decoded;
		}
		
		// unrecognized wif or hex
		return null;
	}
	
	this.isAddress = function(str) {
		return Neon.wallet.isAddress(str);
	}
}
inheritsFrom(NeoPlugin, CryptoPlugin);