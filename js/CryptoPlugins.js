var plugins;
function getCryptoPlugins() {
	if (!plugins) {
		plugins = [];
		plugins.push(new BitcoinPlugin());
//		plugins.push(new EthereumPlugin());
		plugins.push(new MoneroPlugin());
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
function CryptoPlugin { }

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
 * Returns the supported encryption schemes.
 * 
 * Supports CryptoJS by default.
 */
CryptoPlugin.prototype.getEncryptionSchemes = function() { return [EncryptionScheme.CRYPTOJS;] }

/**
 * Returns a new random private key.
 */
CryptoPlugin.prototype.newPrivateKey = function() { return new PrivateKey(this); }
	
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
CryptoPlugin.prototype.isPrivateKey = function(str) { return this.isPrivateKeyHex() || this.isPrivateKeyWif(); }
	
/**
 * Determines if the given string is a hex private key, encrypted or unencrypted.
 */
CryptoPlugin.prototype.isPrivateKeyHex = function(str) { throw new Error("Subclass must implement"); }
	
/**
 * Determines if the given string is a wif private key, encrypted or unencrypted.
 */
CryptoPlugin.prototype.isPrivateKeyWif = function(str) { throw new Error("Subclass must implement"); }
	
/**
 * Determines if the given string is an encrypted hex or wif private key.
 */
CryptoPlugin.prototype.isEncryptedPrivateKey = function(str) { try { return isInitialized(this.getEncryptionScheme(str)); } catch {} }
	
/**
 * Returns the encryption scheme of the given private key string.  Throws an exception if the string is not recognized.
 */
CryptoPlugin.prototype.getEncryptionScheme = function(str) { throw new Error("Subclass must implement"); }
	
/**
 * Returns the address of the given private key.
 */
CryptoPlugin.prototype.getAddress = function(privateKey) { throw new Error("Subclass must implement"); }


function BitcoinPlugin {
	this.getName = function() { return "Bitcoin"; }
	this.getTickerSymbol = function() { return "BTC" };
	this.getLogo = function() { return $("<img src='img/bitcoin.png'>"); }
	this.getEncryptionSchemes = function() { return [EncryptionScheme.BIP38, EncryptionScheme.CRYPTOJS]; }
	this.newUnencryptedPrivateKeyHex = function() {
		var key = new Bitcoin.ECKey(false);	// bitaddress.js:5367	// TODO: handle randomization
		key.setCompressed(true);
		return key.getBitcoinHexFormat();
	}
	this.privateKeyHexToWif = function(hex) {
		if (this.isEncryptedPrivateKey(hex)) throw new Error("Hex to wif conversion not supported with encrypted private key");
		throw new Error("Not implemented");
	}
}
inheritsFrom(BitcoinPlugin, CurrencyPlugin);

function MoneroPlugin {
	
}
inheritsFrom(MoneroPlugin, CurrencyPlugin);