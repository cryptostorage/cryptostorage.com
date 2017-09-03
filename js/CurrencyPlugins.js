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
		plugins.push(new EthereumPlugin());
		plugins.push(new MoneroPlugin());
		plugins.push(new LitecoinPlugin());
		plugins.push(new BitcoinCashPlugin());
		plugins.push(new EthereumClassicPlugin());
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
CurrencyPlugin.prototype.isPrivateKey = function(str) { return this.isUnencryptedPrivateKey(str) || this.isEncryptedPrivateKey(str); }
CurrencyPlugin.prototype.isUnencryptedPrivateKey = function(str) { throw new Error("Subclass must implement"); }
CurrencyPlugin.prototype.isUnencryptedPrivateKeyWif = function(str) { return this.isUnencryptedPrivateKey(str); }										// override if wif is different
CurrencyPlugin.prototype.getUnencryptedPrivateKey = function(privateKey) { assertTrue(this.isUnencryptedPrivateKey(privateKey)); return privateKey; }	// override if wif is different
CurrencyPlugin.prototype.getUnencryptedPrivateKeyWif = function(privateKey) { return this.getUnencryptedPrivateKey(privateKey); }						// override if wif is different
CurrencyPlugin.prototype.isEncryptedPrivateKey = function(privateKey) { try { return isInitialized(this.getEncryptionScheme(privateKey)); } catch(err) { return false; } }
CurrencyPlugin.prototype.getAddress = function(privateKey) { throw new Error("Subclass must implement"); }
CurrencyPlugin.prototype.getEncryptionSchemes = function() { return [EncryptionScheme.CRYPTOJS]; }
CurrencyPlugin.prototype.getEncryptionScheme = function(privateKey) { throw new Error("Subclass must implement"); }
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
		var key = new Bitcoin.ECKey(false);	// bitaddress.js:5367	// TODO: handle randomization
		key.setCompressed(true);
		return key.getBitcoinWalletImportFormat();
	}
	this.isUnencryptedPrivateKey = function(str) {
		if (!isString(str)) return false;
		return ninja.privateKey.isPrivateKey(str);
	}
	this.getAddress = function(privateKey) {
		assertTrue(this.isUnencryptedPrivateKey(privateKey));
		return new Bitcoin.ECKey(privateKey).getBitcoinAddress();
	}
	this.getEncryptionSchemes = function() { return [EncryptionScheme.BIP38, EncryptionScheme.CRYPTOJS]; }
	this.getEncryptionScheme = function(privateKey) {
		if (!isString(privateKey)) throw new Error("Argument must be a string");
		if (ninja.privateKey.isBIP38Format(privateKey)) return EncryptionScheme.BIP38;	// bitaddress.js:6353
		if (privateKey[0] === 'U') return EncryptionScheme.CRYPTOJS;					// TODO: better cryptojs validation
		assertTrue(this.isUnencryptedPrivateKey(privateKey));
		return undefined;
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
	this.isUnencryptedPrivateKey = function(str) {
		if (isHex(str) && str.length >= 63 && str.length <= 65) return true;	// TODO: use library
		if (this.isUnencryptedPrivateKeyWif(str)) return true;
		return false;
	}
	this.isUnencryptedPrivateKeyWif = function(str) {
		try {
			mn_decode(str);
			return true;
		} catch (err) {
			return false;
		}
	}
	this.getAddress = function(privateKey) {
		var keys = cnUtil.create_address(this.getUnencryptedPrivateKey(privateKey));
		return cnUtil.pubkeys_to_string(keys.spend.pub, keys.view.pub);
	}
	this.getUnencryptedPrivateKey = function(privateKey) {
		assertTrue(this.isUnencryptedPrivateKey(privateKey));
		if (privateKey.indexOf(' ') !== -1) return mn_decode(privateKey);
		return privateKey;
	}
	this.getUnencryptedPrivateKeyWif = function(privateKey) {
		return mn_encode(this.getUnencryptedPrivateKey(privateKey), 'english');
	}
	this.getEncryptionScheme = function(privateKey) {
		if (!isString(privateKey)) throw new Error("privateKey must be a string");
		if (privateKey[0] === 'U') return EncryptionScheme.CRYPTOJS;	// TODO: better cryptojs validation
		assertTrue(this.isUnencryptedPrivateKey(privateKey));
		return undefined;
	}
	this.split = function(privateKey, numPieces, minPieces) {
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
	this.isUnencryptedPrivateKey = function(str) {
		if (isHex(str) && str.length >= 63 && str.length <= 65) return true;	// TODO: use library
		return false;
	}
	this.getAddress = function(privateKey) {
		assertTrue(this.isUnencryptedPrivateKey(privateKey));
		return keythereum.privateKeyToAddress(privateKey);
	}
	this.getEncryptionScheme = function(privateKey) {
		if (typeof privateKey !== 'string') throw new Error("privateKey must be a string");
		if (privateKey[0] === 'U') return EncryptionScheme.CRYPTOJS;			// TODO: better cryptojs validation
		assertTrue(this.isUnencryptedPrivateKey(privateKey));
		return undefined;
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
 * Ethereum classic plugin.
 */
function EthereumClassicPlugin() {
	EthereumPlugin.call(this);
	this.getName = function() { return "Ethereum Classic"; }
	this.getTickerSymbol = function() { return "ETC" };
	this.getLogo = function() { return $("<img src='img/ethereum_classic.png'>"); }
}
inheritsFrom(EthereumClassicPlugin, EthereumPlugin);

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
	this.isUnencryptedPrivateKey = function(str) {
		return litecore.PrivateKey.isValid(str);
	}
	this.getAddress = function(privateKey) {
		assertTrue(this.isUnencryptedPrivateKey(privateKey));
		return new litecore.PrivateKey(privateKey).toAddress().toString();
	}
	this.getEncryptionScheme = function(privateKey) {
		if (!isString(privateKey)) throw new Error("Argument must be a string");
		if (privateKey[0] === 'U') return EncryptionScheme.CRYPTOJS;	// TODO: better cryptojs validation
		assertTrue(this.isUnencryptedPrivateKey(privateKey));
		return undefined;
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