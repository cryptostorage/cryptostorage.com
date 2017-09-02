var plugins;
function getCryptoPlugins() {
	if (!plugins) {
		plugins = [];
		plugins.push(new BitcoinPlugin());
//		plugins.push(new EthereumPlugin());
//		plugins.push(new MoneroPlugin());
//		plugins.push(new LitecoinPlugin());
//		plugins.push(new BitcoinCashPlugin());
//		plugins.push(new EthereumClassicPlugin());
	}
	return plugins;
}

function getCryptoPlugin(ticker) {
	for (let plugin of getCryptoPlugins()) {
		if (plugin.getTickerSymbol() === ticker) return plugin;
	}
	return null;
}

/**
 * Base plugin that specific cryptocurrencies must implement.
 */
function CryptoPlugin() { }

/**
 * Returns the name.
 */
CryptoPlugin.prototype.getName = function() { throw new Error("Subclass must implement"); }

/**
 * Returns the ticker symbol.
 */
CryptoPlugin.prototype.getTickerSymbol = function() { throw new Error("Subclass must implement"); }

/**
 * Returns the logo.
 */
CryptoPlugin.prototype.getLogo = function() { throw new Error("Subclass must implement"); }

/**
 * Returns a new random key.
 */
CryptoPlugin.prototype.newCryptoKey = function() { return new CryptoKey(this); }
	
/**
 * Returns a new unencrypted hex private key.
 */
CryptoPlugin.prototype.newUnencryptedPrivateKeyHex = function() { throw new Error("Subclass must implement"); }

/**
 * Converts the given private key from hex to wif.
 */
CryptoPlugin.prototype.privateKeyHexToWif = function(hex) { throw new Error("Subclass must implement"); }

/**
 * Converts the given private key from wif to hex.
 */
CryptoPlugin.prototype.privateKeyWifToHex = function(wif) { throw new Error("Subclass must implement"); }
	
/**
 * Determines if the given string is a hex or wif private key, encrypted or unencrypted.
 */
CryptoPlugin.prototype.isPrivateKey = function(str) { return this.isPrivateKeyHex(str) || this.isPrivateKeyWif(str); }
	
/**
 * Determines if the given string is a hex private key, encrypted or unencrypted.
 */
CryptoPlugin.prototype.isPrivateKeyHex = function(str) { throw new Error("Subclass must implement"); }
	
/**
 * Determines if the given string is a wif private key, encrypted or unencrypted.
 */
CryptoPlugin.prototype.isPrivateKeyWif = function(str) { throw new Error("Subclass must implement"); }

/**
 * Returns the address of the given private key.
 */
CryptoPlugin.prototype.getAddress = function(cryptoKey) { throw new Error("Subclass must implement"); }

/**
 * Determines if the given string is an address.
 */
CryptoPlugin.prototype.isAddress = function(str) { throw new Error("Subclass must implement"); }
	
/**
 * Determines if the given string is an encrypted hex or wif private key.
 */
CryptoPlugin.prototype.isEncryptedPrivateKey = function(str) { try { return isInitialized(this.getEncryptionScheme(str)); } catch(err) {} }

/**
 * Returns the supported encryption schemes.
 * 
 * Supports CryptoJS by default.
 */
CryptoPlugin.prototype.getEncryptionSchemes = function() { return [EncryptionScheme.CRYPTOJS]; }
	
/**
 * Returns the encryption scheme of the given string if known, null if known to be unencrypted, and undefined unknown.
 */
CryptoPlugin.prototype.getEncryptionScheme = function(str) { throw new Error("Subclass must implement"); }

/**
 * Returns a private key string encrypted with the given scheme and password.
 */
CryptoPlugin.prototype.encrypt = function(scheme, cryptoKey, password) { encrypt(scheme, cryptoKey, password); }

/**
 * Returns a private key string decrypted with the given scheme and password.
 */
CryptoPlugin.prototype.decrypt = function(scheme, cryptoKey, password) { decrypt(scheme, cryptoKey, password); }

/**
 * Bitcoin plugin.
 */
function BitcoinPlugin() {
	this.getName = function() { return "Bitcoin"; }
	this.getTickerSymbol = function() { return "BTC" };
	this.getLogo = function() { return $("<img src='img/bitcoin.png'>"); }
	this.newUnencryptedPrivateKeyHex = function() {
		var key = new Bitcoin.ECKey(false);	// bitaddress.js:5367	// TODO: handle randomization
		key.setCompressed(true);
		return key.getBitcoinHexFormat();
	}
	this.privateKeyHexToWif = function(hex) {
		assertTrue(this.isPrivateKeyHex(hex), "Given argument must be a hex formatted private key");
		if (this.isEncryptedPrivateKey(hex)) throw new Error("Hex to wif with encrypted private key not implemented");
		return new Bitcoin.ECKey(hex).getBitcoinWalletImportFormat();
	}
	this.privateKeyWifToHex = function(wif) {
		assertTrue(this.isPrivateKeyWif(wif), "Given argument must be a wif formatted private key");
		if (this.isEncryptedPrivateKey(wif)) throw new Error("Wif to hex with encrypted private key not implemetented");
		return new Bitcoin.ECKey(wif).getBitcoinHexFormat();
	}
	this.isPrivateKeyHex = function(str) {
		if (!isHex(str)) return false;
		return isDefined(this.getEncryptionScheme(str));
	}
	this.isPrivateKeyWif = function(str) {
		if (isHex(str)) return false;
		return isDefined(this.getEncryptionScheme(str));
	}
	this.getAddress = function(cryptoKey) {
		assertFalse(cryptoKey.isEncrypted(), "Private key must not be encrypted");
		return new Bitcoin.ECKey(cryptoKey.toHex()).getBitcoinAddress();
	}
	this.isAddress = function(str) {
		try {
			new Bitcoin.Address.decodeString(str);
			return true;
		} catch (err) {
			return false;
		}
	}
	this.getEncryptionSchemes = function() { return [EncryptionScheme.BIP38, EncryptionScheme.CRYPTOJS]; }
	this.getEncryptionScheme = function(str) {
		if (!isString(str)) return undefined;
		if (ninja.privateKey.isBIP38Format(str)) return EncryptionScheme.BIP38;		// bitaddress.js:6353
		if (isHex(str) && str.length > 100) return EncryptionScheme.CRYPTOJS;		// TODO: better cryptojs validation
		if (str[0] === 'U') return EncryptionScheme.CRYPTOJS;						// TODO: better cryptojs validation
		if (ninja.privateKey.isPrivateKey(str)) return null;
		return undefined;
	}
}
inheritsFrom(BitcoinPlugin, CryptoPlugin);

/**
 * Monero plugin.
 */
function MoneroPlugin() {
	
}
inheritsFrom(MoneroPlugin, CryptoPlugin);
