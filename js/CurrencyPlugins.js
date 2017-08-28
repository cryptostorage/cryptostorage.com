/**
 * Returns supported currency plugins.
 * 
 * @returns [] are supported currency plugins
 */
var plugins;
function getCurrencyPlugins() {
	if (!plugins) {
		plugins = [];
		plugins.push(new BitcoinPlugin());
		plugins.push(new BitcoinCashPlugin());
		plugins.push(new EthereumPlugin());
		plugins.push(new LitecoinPlugin());
		plugins.push(new MoneroPlugin());
	}
	return plugins;
}

function getCurrencyPlugin(ticker) {
	for (let plugin of getCurrencyPlugins()) {
		if (plugin.getTickerSymbol() === ticker) return plugin;
	}
	return null;
}

/**
 * Base currency plugin.
 * 
 * The default assumption is the private key formats are the same for min and wif.
 */
function CurrencyPlugin() { }
CurrencyPlugin.prototype.newWallet = function(state) { return new Wallet(this, state); }
CurrencyPlugin.prototype.getName = function() { throw new Error("Subclass must implement"); }
CurrencyPlugin.prototype.getTickerSymbol = function() { throw new Error("Subclass must implement"); }
CurrencyPlugin.prototype.getLogo = function() { throw new Error("Subclass must implement"); }
CurrencyPlugin.prototype.newPrivateKey = function() { throw new Error("Subclass must implement"); }
CurrencyPlugin.prototype.isPrivateKey = function(str) { throw new Error("Subclass must implement"); }
CurrencyPlugin.prototype.isPrivateKeyWif = function(str) { return this.isPrivateKey(str); }						// override if wif is different
CurrencyPlugin.prototype.getPrivateKey = function(privateKeyWif) { return privateKeyWif; }						// override if wif is different
CurrencyPlugin.prototype.getPrivateKeyWif = function(unencryptedPrivateKey) { return unencryptedPrivateKey; }	// override if wif is different
CurrencyPlugin.prototype.getAddress = function(unencryptedPrivateKey) { throw new Error("Subclass must implement"); }
CurrencyPlugin.prototype.getEncryptionSchemes = function() { return [EncryptionScheme.CRYPTOJS]; }
CurrencyPlugin.prototype.getEncryptionScheme = function(encryptedPrivateKey) { throw new Error("Subclass must implement"); }
CurrencyPlugin.prototype.isEncrypted = function(privateKey) { return isInitialized(this.getEncryptionScheme(privateKey)); }
CurrencyPlugin.prototype.encrypt = function(scheme, unencryptedPrivateKey, password, callback) { encrypt(scheme, unencryptedPrivateKey, password, callback); }
CurrencyPlugin.prototype.decrypt = function(scheme, encryptedPrivateKey, password, callback) { decrypt(scheme, encryptedPrivateKey, password, callback); }
CurrencyPlugin.prototype.split = function(privateKey, numPieces, minPieces) { throw new Error("Subclass must implement"); }
CurrencyPlugin.prototype.reconstitute = function(pieces) { throw new Error("Subclass must implement"); }

/**
 * Bitcoin plugin.
 */
function BitcoinPlugin() {
	CurrencyPlugin.call(this);
	this.getName = function() { return "Bitcoin"; }
	this.getTickerSymbol = function() { return "BTC" };
	this.getLogo = function() { return $("<img src='img/bitcoin.png'>"); }
	this.newPrivateKey = function() {		
		var key = new Bitcoin.ECKey(false);	// line 5367 in bitaddress.js
		key.setCompressed(true);
		return key.getBitcoinWalletImportFormat();
	}
	this.isPrivateKey = function(str) {
		var firstChar = str[0];
		if (firstChar === 'L' || firstChar === 'K' || firstChar === '5') return true;	// TODO: use library
		return isInitialized(this.getEncryptionScheme(str));							// TODO: use library
	}
	this.getAddress = function(unencryptedPrivateKey) {
		return new Bitcoin.ECKey(unencryptedPrivateKey).getBitcoinAddress();
	}
	this.getEncryptionSchemes = function() { return [EncryptionScheme.BIP38, EncryptionScheme.CRYPTOJS]; }
	this.getEncryptionScheme = function(privateKey) {
		// TODO: make validation more robust
		if (typeof privateKey !== 'string') throw new Error("privateKey must be a string");
		var firstChar = privateKey[0];
		if (ninja.privateKey.isBIP38Format(privateKey)) return EncryptionScheme.BIP38;	// line 6353 in bitaddress.js
		if (firstChar === 'U') return EncryptionScheme.CRYPTOJS;
	}
	this.split = function(privateKey, numPieces, minPieces) {
		return secrets.share(secrets.str2hex(privateKey), numPieces, minPieces);
	}
	this.reconstitute = function(pieces) {
		var reconstituted = secrets.hex2str(secrets.combine(pieces));
		if (!this.isPrivateKey(reconstituted)) throw new Error("Pieces do not reconstitute valid private key");
		return reconstituted;
	}	
}
inheritsFrom(BitcoinPlugin, CurrencyPlugin);

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
	CurrencyPlugin.call(this);
	this.getName = function() { return "Monero"; }
	this.getTickerSymbol = function() { return "XMR" };
	this.getLogo = function() { return $("<img src='img/monero.png'>"); }
	this.newPrivateKey = function() {
		return cnUtil.sc_reduce32(cnUtil.rand_32());
	};
	this.isPrivateKey = function(str) {
		if (isHex(str) && str.length >= 63 && str.length <= 65) return true;	// TODO: use library
		return isInitialized(this.getEncryptionScheme(str));				// TODO: use library
	}
	this.isPrivateKeyWif = function(str) {
		try {
			return this.isPrivateKey(this.getPrivateKey(str));
		} catch (err) {
			return false;
		}
	}
	this.getAddress = function(unencryptedPrivateKey) {
		assertInitialized(unencryptedPrivateKey);
		assertFalse(this.isEncrypted(unencryptedPrivateKey));
		var keys = cnUtil.create_address(unencryptedPrivateKey);
		return cnUtil.pubkeys_to_string(keys.spend.pub, keys.view.pub);
	}
	this.getPrivateKey = function(privateKeyWif) {
		return mn_decode(privateKeyWif);
	}
	this.getPrivateKeyWif = function(unencryptedPrivateKey) {
		assertInitialized(unencryptedPrivateKey);
		return mn_encode(unencryptedPrivateKey, 'english');	// mnemonic
	}
	this.getEncryptionScheme = function(privateKey) {
		// TODO: make validation more robust
		if (typeof privateKey !== 'string') throw new Error("privateKey must be a string");
		if (privateKey[0] === 'U') return EncryptionScheme.CRYPTOJS;
	}
	this.split = function(privateKey, numPieces, minPieces) {
		assertInitialized(privateKey);
		var hex = isHex(privateKey) ? privateKey : secrets.str2hex(privateKey);
		return secrets.share(hex, numPieces, minPieces);
	}
	this.reconstitute = function(pieces) {
		var combined = secrets.combine(pieces);
		if (this.isPrivateKey(combined)) return combined;
		combined = secrets.hex2str(combined);
		if (!this.isPrivateKey(combined)) throw new Error("Pieces do not reconstitute valid private key");
		return combined;
	}
}
inheritsFrom(MoneroPlugin, CurrencyPlugin);

/**
 * Ethereum plugin.
 */
function EthereumPlugin() {
	CurrencyPlugin.call(this);
	this.getName = function() { return "Ethereum"; }
	this.getTickerSymbol = function() { return "ETH" };
	this.getLogo = function() { return $("<img src='img/ethereum.png'>"); }
	this.newPrivateKey = function() {
		return keythereum.create().privateKey.toString("hex");
	};
	this.isPrivateKey = function(str) {
		if (isHex(str) && str.length >= 63 && str.length <= 65) return true;	// TODO: use library
		return isInitialized(this.getEncryptionScheme(str));			// TODO: use library
	}
	this.getAddress = function(unencryptedPrivateKey) {
		return keythereum.privateKeyToAddress(unencryptedPrivateKey);
	}
	this.getEncryptionScheme = function(privateKey) {
		// TODO: make validation more robust
		if (typeof privateKey !== 'string') throw new Error("privateKey must be a string");
		if (privateKey[0] === 'U') return EncryptionScheme.CRYPTOJS;
	}
	this.split = function(privateKey, numPieces, minPieces) {
		assertInitialized(privateKey);
		var hex = isHex(privateKey) ? privateKey : secrets.str2hex(privateKey);
		return secrets.share(hex, numPieces, minPieces);
	}
	this.reconstitute = function(pieces) {
		var combined = secrets.combine(pieces);
		if (this.isPrivateKey(combined)) return combined;
		combined = secrets.hex2str(combined);
		if (!this.isPrivateKey(combined)) throw new Error("Pieces do not reconstitute valid private key");
		return combined;
	}
}
inheritsFrom(EthereumPlugin, CurrencyPlugin);

/**
 * Litecoin plugin.
 */
function LitecoinPlugin() {
	CurrencyPlugin.call(this);
	this.getName = function() { return "Litecoin"; }
	this.getTickerSymbol = function() { return "LTC" };
	this.getLogo = function() { return $("<img src='img/litecoin.png'>"); }
	this.newPrivateKey = function() {
		return new litecore.PrivateKey().toWIF();
	};
	this.isPrivateKey = function(str) {
		if (litecore.PrivateKey.isValid(str)) return true;
		return isInitialized(this.getEncryptionScheme(str));
	}
	this.getAddress = function(unencryptedPrivateKey) {
		return new litecore.PrivateKey(unencryptedPrivateKey).toAddress().toString();
	}
	this.getEncryptionScheme = function(privateKey) {
		// TODO: make more robust
		if (typeof privateKey !== 'string') throw new Error("Argument must be a string");
		if (privateKey[0] === 'U') return EncryptionScheme.CRYPTOJS;
	}
	this.split = function(privateKey, numPieces, minPieces) {
		assertInitialized(privateKey);
		return secrets.share(secrets.str2hex(privateKey), numPieces, minPieces);
	}
	this.reconstitute = function(pieces) {
		var reconstituted = secrets.hex2str(secrets.combine(pieces));
		if (!this.isPrivateKey(reconstituted)) throw new Error("Pieces do not reconstitute valid private key");
		return reconstituted;
	}
}
inheritsFrom(LitecoinPlugin, CurrencyPlugin);