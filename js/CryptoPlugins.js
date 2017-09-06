var plugins;
function getCryptoPlugins() {
	if (!plugins) {
		plugins = [];
		plugins.push(new BitcoinPlugin());
		plugins.push(new BitcoinCashPlugin());
		plugins.push(new EthereumPlugin());
		plugins.push(new EthereumClassicPlugin());
		plugins.push(new LitecoinPlugin());
		plugins.push(new MoneroPlugin());
	}
	return plugins;
}

function getOriginalCryptoPlugins() {
	let plugins = [];
//	plugins.push(new BitcoinPlugin());
//	plugins.push(new EthereumPlugin());
//	plugins.push(new LitecoinPlugin());
	plugins.push(new MoneroPlugin());
	return plugins;
}

function getCryptoPlugin(ticker) {
	assertInitialized(ticker);
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
 * Returns the given key's private key split into pieces.
 * 
 * @param key is the key to split into pieces
 * @param numPieces is the number of pieces to split the key into
 * @param minPieces is the minimum pieces to reconstitute the key
 * @returns string[] are the split pieces
 */
CryptoPlugin.prototype.split = function(key, numPieces, minPieces) {
	assertTrue(isObject(key, 'CryptoKey'));
	assertTrue(numPieces >= 2);
	assertTrue(minPieces >= 2);
	return secrets.share(key.getHex(), numPieces, minPieces).map(ninja.wallets.splitwallet.hexToBytes).map(Bitcoin.Base58.encode);
}

/**
 * Combines the given pieces to build a key.
 * 
 * @param pieces are pieces to combine
 * @return CryptoKey is the key built from combining the pieces
 */
CryptoPlugin.prototype.combine = function(pieces) {
	return this.newKey(secrets.combine(pieces.map(Bitcoin.Base58.decode).map(Crypto.util.bytesToHex).map(ninja.wallets.splitwallet.stripLeadZeros)));
}

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
		
		// create key if not given
		if (!str) str = new Bitcoin.ECKey().setCompressed(true).getBitcoinHexFormat();
		assertTrue(isString(str), "Argument to parse must be a string: " + str);
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
 * Ethereum plugin.
 */
function EthereumPlugin() {
	this.getName = function() { return "Ethereum"; }
	this.getTickerSymbol = function() { return "ETH" };
	this.getLogo = function() { return $("<img src='img/ethereum.png'>"); }
	this.newKey = function(str) {
		
		// create key if not given
		if (!str) str = keythereum.create().privateKey.toString("hex");
		assertTrue(isString(str), "Argument to parse must be a string: " + str);
		let state = {};
		
		// handle hex
		if (isHex(str)) {
			
			// unencrypted
			if (str.length >= 63 && str.length <= 65) {
				state.hex = str;
				state.wif = str;	// TODO: different wif?
				state.address = keythereum.privateKeyToAddress(state.hex);
				state.encryption = null;
			}
			
			// hex cryptojs
			else if (str.length > 100) {
				state.hex = str;
				state.wif = CryptoJS.enc.Hex.parse(str).toString(CryptoJS.enc.Base64).toString(CryptoJS.enc.Utf8);
				state.encryption = EncryptionScheme.CRYPTOJS;
			}
		}
		
		// wif cryptojs
		else if (str[0] === 'U') {
			state.hex = CryptoJS.enc.Base64.parse(str).toString(CryptoJS.enc.Hex);
			state.wif = str;
			state.encryption = EncryptionScheme.CRYPTOJS;
		}
		
		// otherwise key is not recognized
		else throw new Error("Unrecognized private key: " + str);
		
		// return key
		return new CryptoKey(this, state);
	}
}
inheritsFrom(EthereumPlugin, CryptoPlugin);

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
	this.getName = function() { return "Litecoin"; }
	this.getTickerSymbol = function() { return "LTC" };
	this.getLogo = function() { return $("<img src='img/litecoin.png'>"); }
	this.newKey = function(str) {
		
		// create key if not given
		if (!str) str = new litecore.PrivateKey().toString();		
		else assertTrue(isString(str), "Argument to parse must be a string: " + str);
		let state = {};
		
		// unencrypted
		if (litecore.PrivateKey.isValid(str)) {
			let key = new litecore.PrivateKey(str);
			state.hex = key.toString();
			state.wif = key.toWIF();
			state.address = key.toAddress().toString();
			state.encryption = null;
		}
		
		// hex cryptojs
		else if (isHex(str) && str.length > 100) {
			state.hex = str;
			state.wif = CryptoJS.enc.Hex.parse(str).toString(CryptoJS.enc.Base64).toString(CryptoJS.enc.Utf8);
			state.encryption = EncryptionScheme.CRYPTOJS;
		}
		
		// wif cryptojs
		else if (str[0] === 'U') {
			state.hex = CryptoJS.enc.Base64.parse(str).toString(CryptoJS.enc.Hex);
			state.wif = str;
			state.encryption = EncryptionScheme.CRYPTOJS;
		}
		
		// otherwise key is not recognized
		else throw new Error("Unrecognized private key: " + str);
		
		// return key
		return new CryptoKey(this, state);
	}
}
inheritsFrom(LitecoinPlugin, CryptoPlugin);

/**
 * Monero plugin.
 */
function MoneroPlugin() {
	this.getName = function() { return "Monero"; }
	this.getTickerSymbol = function() { return "XMR" };
	this.getLogo = function() { return $("<img src='img/monero.png'>"); }
	this.newKey = function(str) {
		
		// create key if not given
		if (!str) str = cnUtil.sc_reduce32(cnUtil.rand_32());
		assertTrue(isString(str), "Argument to parse must be a string: " + str);
		let state = {};
		
		// handle hex
		if (isHex(str)) {
			
			// unencrypted
			if (str.length >= 63 && str.length <= 65) {
				let address = cnUtil.create_address(str);
				if (!cnUtil.valid_keys(address.view.pub, address.view.sec, address.spend.pub, address.spend.sec)) {
					throw new Error("Invalid address keys derived from hex key");
				}
				state.hex = str;
				state.wif = mn_encode(state.hex, 'english');
				state.address = address.public_addr;
				state.encryption = null;
				return new CryptoKey(this, state);
			}
			
			// hex cryptojs
			if (str.length > 100) {
				state.hex = str;
				state.wif = CryptoJS.enc.Hex.parse(str).toString(CryptoJS.enc.Base64).toString(CryptoJS.enc.Utf8);
				if (!state.wif.startsWith("U2")) throw new Error("Unrecognized private key: " + str);
				state.encryption = EncryptionScheme.CRYPTOJS;
				return new CryptoKey(this, state);
			}
		}
		
		// wif cryptojs
		if (str[0] === 'U') {
			state.hex = CryptoJS.enc.Base64.parse(str).toString(CryptoJS.enc.Hex);
			state.wif = str;
			state.encryption = EncryptionScheme.CRYPTOJS;
			return new CryptoKey(this, state);
		}
		
		// wif unencrypted
		if (str.indexOf(' ') !== -1) {
			state.hex = mn_decode(str);
			state.wif = str;
			state.address = cnUtil.create_address(state.hex).public_addr;
			state.encryption = null;
			return new CryptoKey(this, state);
		}
		
		// otherwise key is not recognized
		throw new Error("Unrecognized private key: " + str);
	}
}
inheritsFrom(MoneroPlugin, CryptoPlugin);