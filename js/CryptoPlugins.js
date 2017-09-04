var plugins;
function getCryptoPlugins() {
	if (!plugins) {
		plugins = [];
//		plugins.push(new BitcoinPlugin());
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
 * Encrypts the given key with the given scheme and password.  Invokes callback(key, error) when done.
 */
CryptoPlugin.prototype.encrypt = function(scheme, key, password, callback) { encrypt(scheme, key, password, callback); }

/**
 * Decrypts the given key with the givne password.  Invokes callback(key, error) when done.
 */
CryptoPlugin.prototype.decrypt = function(key, password, callback) { return decrypt(key, password, callback); }

/**
 * Returns a new random key.
 */
CryptoPlugin.prototype.newKey = function(str) { throw new Error("Subclass must implement"); }

/**
 * Bitcoin plugin.
 */
function BitcoinPlugin() {
	this.getName = function() { return "Bitcoin"; }
	this.getTickerSymbol = function() { return "BTC" };
	this.getLogo = function() { return $("<img src='img/bitcoin.png'>"); }
	this.getEncryptionSchemes = function() { return [EncryptionScheme.BIP38, EncryptionScheme.CRYPTOJS]; }
	this.newKey = function(str) {
		
		// create new key
		if (!str) {
			let key = new Bitcoin.ECKey();
			key.setCompressed(true);
			let state = {}
			state.hex = key.getBitcoinHexFormat();
			state.wif = key.getBitcoinWalletImportFormat();
			state.address = key.getBitcoinAddress();
			state.encryption = null;
			return new CryptoKey(this, state);
		}
		
		// parse key
		assertTrue(isString(str), "Argument to parse must be a string");
		let state = {};
		
		// unencrypted private key
		if (ninja.privateKey.isPrivateKey(str)) {
			let key = new Bitcoin.ECKey(str);
			key.setCompressed(true);
			state.hex = key.getBitcoinHexFormat();
			state.wif = key.getBitcoinWalletImportFormat();
			state.address = key.getBitcoinAddress();
			state.encryption = null;
		}
		
		// wif bip38
		else if (ninja.privateKey.isBIP38Format(str)) {
			state.hex = Crypto.util.bytesToHex(Bitcoin.Base58.decode(str));
			state.wif = str;
			state.encryption = EncryptionScheme.BIP38;
		}
		
		// wif cryptojs
		else if (str[0] === 'U') {
			state.hex = CryptoJS.enc.Base64.parse(str).toString(CryptoJS.enc.Hex);
			state.wif = str;
			state.encryption = EncryptionScheme.CRYPTOJS;
		}
		
		// encrypted hex
		else if (isHex(str)) {
			
			// bip38
			if (str.length > 80 && str.length < 90) {
				state.hex = str;
				state.wif = Bitcoin.Base58.encode(Crypto.util.hexToBytes(str));
				state.encryption = EncryptionScheme.BIP38;
			}
			
			// cryptojs
			else if (str.length > 100) {
				state.hex = str;
				state.wif = CryptoJS.enc.Hex.parse(str).toString(CryptoJS.enc.Base64).toString(CryptoJS.enc.Utf8);
				state.encryption = EncryptionScheme.CRYPTOJS;
			}
		}
		
		// otherwise key is not recognized
		else throw new Error("Unrecognized private key: " + str);
		
		// return key
		return new CryptoKey(this, state);
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
	this.newKey = function(str) {
		
		// create new key
		if (!str) {
			let state = {};
			state.hex = cnUtil.sc_reduce32(cnUtil.rand_32());
			state.wif = mn_encode(state.hex, 'english');
			state.address = cnUtil.create_address(state.hex).public_addr;
			state.encryption = null;
			return new CryptoKey(this, state);
		}
		
		// parse key
		assertTrue(isString(str), "Argument to parse must be a string");
		let state = {};
		
		// unencrypted private key
		if (ninja.privateKey.isPrivateKey(str)) {
			let key = new Bitcoin.ECKey(str);
			key.setCompressed(true);
			state.hex = key.getBitcoinHexFormat();
			state.wif = key.getBitcoinWalletImportFormat();
			state.address = key.getBitcoinAddress();
			state.encryption = null;
		}
		
		// wif bip38
		else if (ninja.privateKey.isBIP38Format(str)) {
			state.hex = Crypto.util.bytesToHex(Bitcoin.Base58.decode(str));
			state.wif = str;
			state.encryption = EncryptionScheme.BIP38;
		}
		
		// wif cryptojs
		else if (str[0] === 'U') {
			state.hex = CryptoJS.enc.Base64.parse(str).toString(CryptoJS.enc.Hex);
			state.wif = str;
			state.encryption = EncryptionScheme.CRYPTOJS;
		}
		
		// encrypted hex
		else if (isHex(str)) {
			
			// bip38
			if (str.length > 80 && str.length < 90) {
				state.hex = str;
				state.wif = Bitcoin.Base58.encode(Crypto.util.hexToBytes(str));
				state.encryption = EncryptionScheme.BIP38;
			}
			
			// cryptojs
			else if (str.length > 100) {
				state.hex = str;
				state.wif = CryptoJS.enc.Hex.parse(str).toString(CryptoJS.enc.Base64).toString(CryptoJS.enc.Utf8);
				state.encryption = EncryptionScheme.CRYPTOJS;
			}
		}
		
		// otherwise key is not recognized
		else throw new Error("Unrecognized private key: " + str);
		
		// return key
		return new CryptoKey(this, state);
	}
}
inheritsFrom(MoneroPlugin, CryptoPlugin);
