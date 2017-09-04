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
 * Returns the supported encryption schemes.  All support CryptoJS by default.
 */
CryptoPlugin.prototype.getEncryptionSchemes = function() { return [EncryptionScheme.CRYPTOJS]; }

/**
 * Returns a new random key.
 */
CryptoPlugin.prototype.newKey = function(str) { return new CryptoKey(this, str); }

/**
 * Parses the given string into a crypto key.
 */
CryptoPlugin.prototype.parse = function(str) { throw new Error("Subclass must implement"); }

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
	this.getEncryptionSchemes = function() { return [EncryptionScheme.BIP38]; }
	this.newKey = function(str) {
		if (str) return this.parse(str);
		else {
			let key = new Bitcoin.ECKey(str);
			key.setCompressed(true);
			let state = {}
			state.hex = key.getBitcoinHexFormat();
			state.wif = key.getBitcoinWalletImportFormat();
			state.address = key.getBitcoinAddress();
			state.encryption = null;
			return new CryptoKey(this, state);
		}
	}
	this.parse = function(str) {
		assertTrue(isString(str), "Argument to parse must be a string");
		let state = {};
		
		// unencrypted private key
		if (ninja.privateKey.isPrivateKey(str)) {
			let key = new Bitcoin.ECKey(str);
			state.hex = key.getBitcoinHexFormat();
			state.wif = key.getBitcoinWalletImportFormat();
			state.address = key.getBitcoinAddress();
			state.encryption = null;
		}
		
		// wif bip38
		else if (ninja.privateKey.isBIP38Format(str)) {
			state.hex = Crypto.util.bytesToHex(Bitcoin.Base58.decode(wif));
			state.wif = str;
			state.encryption = EncryptionScheme.BIP38;
		}
		
		// wif cryptojs
		else if (str[0] === 'U') {
			state.hex = "not implemented";
			state.wif = str;
			state.encryption = EncryptionScheme.CRYPTOJS;
		}
		
		// encrypted hex
		else if (isHex(str)) {
			
			// bip38
			if (str.length > 80 && str.length < 90) {
				state.hex = str;
				state.wif = Bitcoin.Base58.encode(Crypto.util.hexToBytes(hex));
				state.encryption = EncryptionScheme.BIP38;
			}
			
			// cryptojs
			else if (str.length > 100) {
				state.hex = str;
				state.wif = "not implemented";	// TODO
				state.encryption = EncryptionScheme.CRYPTOJS;
			}
		}
		
		// address
		else if (this.isAddress(str)) {
			state.address = str;
		}
		
		// return crypto key
		return new CryptoKey(this, state);
	}
	this.isAddress = function(str) {
		try {
			new Bitcoin.Address.decodeString(str);
			return true;
		} catch (err) {
			return false;
		}
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
