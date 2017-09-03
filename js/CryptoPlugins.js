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
CryptoPlugin.prototype.newKey = function() { return new CryptoKey(this); }
	
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
 * Returns a promise which is called with an encrypted private key string upon completion.
 */
CryptoPlugin.prototype.encrypt = function(scheme, cryptoKey, password, callback) { encrypt(scheme, cryptoKey, password, callback); }

/**
 * Returns a promise which is called with a decrypted private key string upon completion.
 */
CryptoPlugin.prototype.decrypt = function(scheme, cryptoKey, password, callback) { return decrypt(scheme, cryptoKey, password, callback); }

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
		switch(this.getEncryptionScheme(hex)) {
			case EncryptionScheme.BIP38:
				return Bitcoin.Base58.encode(Crypto.util.hexToBytes(hex));
			case EncryptionScheme.CRYPTOJS:
				throw new Error("CryptoJS wif to hex not implemented");
			default:
				return new Bitcoin.ECKey(hex).setCompressed(true).getBitcoinWalletImportFormat();
		}
	}
	this.privateKeyWifToHex = function(wif) {
		assertTrue(this.isPrivateKeyWif(wif), "Given argument must be a wif formatted private key");
		switch (this.getEncryptionScheme(wif)) {
			case EncryptionScheme.BIP38:
				return Crypto.util.bytesToHex(Bitcoin.Base58.decode(wif));
			case EncryptionScheme.CRYPTOJS:
				throw new Error("CryptoJS wif to hex not implemented");
			default:
				return new Bitcoin.ECKey(wif).setCompressed(true).getBitcoinHexFormat();
		}
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
	this.getEncryptionSchemes = function() { return [EncryptionScheme.BIP38]; }
	this.getEncryptionScheme = function(str) {
		if (!isString(str)) return undefined;
		if (ninja.privateKey.isBIP38Format(str)) return EncryptionScheme.BIP38;		// bitaddress.js:6353
		if (isHex(str) && str.length > 80 && str.length < 90) return EncryptionScheme.BIP38;
		if (isHex(str) && str.length > 100) return EncryptionScheme.CRYPTOJS;		// TODO: better cryptojs validation
		if (str[0] === 'U') return EncryptionScheme.CRYPTOJS;						// TODO: better cryptojs validation
		if (ninja.privateKey.isPrivateKey(str)) return null;
		return undefined;
	}
}
inheritsFrom(BitcoinPlugin, CryptoPlugin);

/**
 * Bitcoin cash plugin.
 */
function BitcoinCashPlugin() {
	BitcoinPlugin.call(this);
	this.getName = function() { return "Bitcoin Cash"; }
	this.getTickerSymbol = function() { return "BCH" };
	this.getLogo = function() { return $("<img src='img/bitcoin_cash.png'>"); }
}
inheritsFrom(BitcoinCashPlugin, BitcoinPlugin);

/**
 * Monero plugin.
 */
function MoneroPlugin() {
	this.getName = function() { return "Monero"; }
	this.getTickerSymbol = function() { return "XMR" };
	this.getLogo = function() { return $("<img src='img/monero.png'>"); }
	this.newUnencryptedPrivateKeyHex = function() {
		return cnUtil.sc_reduce32(cnUtil.rand_32());
	}
	this.privateKeyHexToWif = function(hex) {
		assertTrue(this.isPrivateKeyHex(hex), "Given argument must be a hex formatted private key");
		switch(this.getEncryptionScheme(hex)) {
			case EncryptionScheme.CRYPTOJS:
				throw new Error("CryptoJS wif to hex not implemented");
			default:
				throw new Error("Not implemented");
		}
	}
	this.privateKeyWifToHex = function(wif) {
		assertTrue(this.isPrivateKeyWif(wif), "Given argument must be a wif formatted private key");
		switch (this.getEncryptionScheme(wif)) {
			case EncryptionScheme.CRYPTOJS:
				throw new Error("CryptoJS wif to hex not implemented");
			default:
				throw new Error("Not implemented");
		}
	}
	this.isPrivateKeyHex = function(str) {
		if (isHex(str)) return false;
		return isDefined(this.getEncryptionScheme(str));
	}
	this.isPrivateKeyWif = function(str) {
		if (isHex(str)) return false;
		switch (this.getEncryptionScheme(str)) {
			case EncryptionScheme.CRYPTOJS:
				throw new Error("CryptoJS wif to hex not implemented");
			default:
				try {
					mn_decode(str);
					return true;
				} catch (err) {
					return false;
				}
		}
	}
	this.getAddress = function(cryptoKey) {
		assertFalse(cryptoKey.isEncrypted(), "Private key must not be encrypted");
		let keys = cnUtil.create_address(cryptoKey.toHex());
		return cnUtil.pubkeys_to_string(keys.spend.pub, keys.view.pub);
	}
	this.isAddress = function(str) {
		throw new Error("Not implemented");
	}
	this.getEncryptionSchemes = function() { return [EncryptionScheme.CRYPTOJS]; }
	this.getEncryptionScheme = function(str) {
		if (!isString(str)) return undefined;
		if (str[0] === 'U') return EncryptionScheme.CRYPTOJS;			// TODO: better cryptojs validation
		if (isHex(str)) {
			if (str.length > 100) return EncryptionScheme.CRYPTOJS;		// TODO: better cryptojs validation
			if (str.length >= 63 && str.length <= 65) return null;
		}
		try {
			mn_decode(str);
			return true;
		} catch (err) {
			return false;
		}
		
		return undefined;
	}
}
inheritsFrom(MoneroPlugin, CryptoPlugin);
