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
 * Returns the supported encryption schemes.  All support CryptoJS by default.
 */
CryptoPlugin.prototype.getEncryptionSchemes = function() { return [AppUtils.EncryptionScheme.CRYPTOJS]; }

/**
 * Encrypts the given key with the given scheme and passphrase.
 * 
 * @param scheme is the encryption scheme
 * @param key is the key to encrypt
 * @param passphrase is the passphrase to encrypt with
 * @param onProgress(percent) is invoked as progress is made (optional)
 * @param onDone(err, key) is invoked when done (optional)
 */
CryptoPlugin.prototype.encrypt = function(scheme, key, passphrase, onProgress, onDone) {
	AppUtils.encryptKey(key, scheme, passphrase, onProgress, function(err, encryptedKey) {
		if (err) { if (onDone) onDone(err); }
		else if (onDone) onDone(null, encryptedKey);
	});
}

/**
 * Decrypts the given key with the given passphrase.
 * 
 * @param key is the key to decrypt
 * @param passphrase is the passphrase to decrypt the key
 * @param onProgress(percent) is invoked as progress is made (optional)
 * @param onDone(err, key) is invoked when done (optional)
 */
CryptoPlugin.prototype.decrypt = function(key, passphrase, onProgress, onDone) {
	AppUtils.decryptKey(key, passphrase, onProgress, function(err, decryptedKey) {
		if (err) { if (onDone) onDone(err); }
		else if (onDone) onDone(null, decryptedKey);
	});
}

/**
 * Returns the given key's private key split into pieces.
 * 
 * @param key is the key to split into pieces
 * @param numPieces is the number of pieces to split the key into
 * @param minPieces is the minimum pieces to reconstitute the key
 * @returns string[] are the split pieces
 */
CryptoPlugin.prototype.split = function(key, numPieces, minPieces) {
	assertTrue(isObject(key, CryptoKey));
	assertTrue(numPieces >= 2);
	assertTrue(minPieces >= 2);

	// split key into shares
	var shares = secrets.share(key.getHex(), numPieces, minPieces).map(ninja.wallets.splitwallet.hexToBytes).map(Bitcoin.Base58.encode);

	// append minimum pieces prefix so insufficient pieces cannot create wrong key (cryptostorage convention)
	var prefix = minPieces + 'c';
	for (var i = 0; i < shares.length; i++) {
		shares[i] = prefix + shares[i];
	}
	return shares;
}

/**
 * Combines the given shares to build a key.
 * 
 * @param shares are shares to combine
 * @return CryptoKey is the key built by combining the shares
 */
CryptoPlugin.prototype.combine = function(shares) {
	assertArray(shares);
	assertTrue(shares.length > 0);
	
	// get minimum shares and shares without 'XXXc' prefix
	var minShares;
	var nonPrefixedShares = [];
	for (var i = 0; i < shares.length; i++) {
		var share = shares[i];
		if (!AppUtils.isPossibleSplitPiece(share)) throw new Error("Invalid split piece: " + share);
		var min = AppUtils.getMinPieces(share);
		if (!min) throw new Error("Share is not prefixed with minimum pieces: " + share);
		if (!isInitialized(minShares)) minShares = min;
		else if (min !== minShares) throw new Error("Shares have different minimum threshold prefixes: " + min + " vs " + minShares);
		nonPrefixedShares.push(share.substring(share.indexOf('c') + 1));
	}
	
	// ensure sufficient shares are provided
	if (shares.length < minShares) {
		var additional = minShares - shares.length;
		throw new Error("Need " + additional + " additional " + (additional === 1 ? "piece" : "pieces") + " to import private key");
	}
	
	// combine shares and create key
	try {
		return this.newKey(secrets.combine(nonPrefixedShares.map(Bitcoin.Base58.decode).map(Crypto.util.bytesToHex).map(ninja.wallets.splitwallet.stripLeadZeros)));
	} catch (err) {
		throw new Error("Pieces do not combine to make valid private key");
	}
}

/**
 * Returns a new random key.
 */
CryptoPlugin.prototype.newKey = function(str) { throw new Error("Subclass must implement"); }

/**
 * Determines if the given string is a valid address.
 */
CryptoPlugin.prototype.isAddress = function(str) { throw new Error("Subclass must implement"); }

/**
 * Bitcoin plugin.
 */
function BitcoinPlugin() {
	this.getName = function() { return "Bitcoin"; }
	this.getTicker = function() { return "BTC" };
	this.getLogoPath = function() { return "img/bitcoin.png"; }
	this.getDependencies = function() { return ["lib/bitaddress.js"]; }
	this.getDonationAddress = function() { return "1ArmuyQfgM1Sd3tN1A242FzPhbePfCjbmE"; }
	this.getEncryptionSchemes = function() { return [AppUtils.EncryptionScheme.CRYPTOJS, AppUtils.EncryptionScheme.BIP38]; }
	this.newKey = function(str) {
		
		// create key if not given
		if (!str) str = new Bitcoin.ECKey().setCompressed(true).getBitcoinHexFormat();
		assertTrue(isString(str), "Argument to parse must be a string: " + str);
		var state = {};
		
		// unencrypted private key
		if (ninja.privateKey.isPrivateKey(str)) {
			var key = new Bitcoin.ECKey(str);
			key.setCompressed(true);
			state.hex = key.getBitcoinHexFormat();
			state.wif = key.getBitcoinWalletImportFormat();
			state.address = key.getBitcoinAddress();
			state.encryption = null;
			return new CryptoKey(this, state);
		}
		
		// wif bip38
		else if (ninja.privateKey.isBIP38Format(str)) {
			state.hex = Crypto.util.bytesToHex(Bitcoin.Base58.decode(str));
			state.wif = str;
			state.encryption = AppUtils.EncryptionScheme.BIP38;
			return new CryptoKey(this, state);
		}
		
		// wif cryptojs
		else if (AppUtils.isWifCryptoJs(str)) {
			state.hex = CryptoJS.enc.Base64.parse(str).toString(CryptoJS.enc.Hex);
			state.wif = str;
			state.encryption = AppUtils.EncryptionScheme.CRYPTOJS;
			return new CryptoKey(this, state);
		}
		
		// encrypted hex
		else if (isHex(str)) {
			
			// bip38
			if (str.length > 80 && str.length < 90) {
				state.hex = str;
				state.wif = Bitcoin.Base58.encode(Crypto.util.hexToBytes(str));
				state.encryption = AppUtils.EncryptionScheme.BIP38;
				return new CryptoKey(this, state);
			}
			
			// cryptojs
			else if (str.length > 100) {
				state.hex = str;
				state.wif = CryptoJS.enc.Hex.parse(str).toString(CryptoJS.enc.Base64).toString(CryptoJS.enc.Utf8);
				if (!state.wif.startsWith("U2")) throw new Error("Unrecognized private key: " + str);
				state.encryption = AppUtils.EncryptionScheme.CRYPTOJS;
				return new CryptoKey(this, state);
			}
		}
		
		// otherwise key is not recognized
		throw new Error("Unrecognized private key: " + str);		
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
 * Bitcoin cash plugin.
 */
function BitcoinCashPlugin() {
	BitcoinPlugin.call(this);
	this.getName = function() { return "Bitcoin Cash"; }
	this.getTicker = function() { return "BCH" };
	this.getLogoPath = function() { return "img/bitcoin_cash.png"; }
	this.getDonationAddress = function() { return "15UL5qGptXxPnQKhhRCx1wLL3UAmbn61A2"; }
}
inheritsFrom(BitcoinCashPlugin, BitcoinPlugin);
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
 * Ethereum plugin.
 */
function EthereumPlugin() {
	this.getName = function() { return "Ethereum"; }
	this.getTicker = function() { return "ETH" };
	this.getLogoPath = function() { return "img/ethereum.png"; }
	this.getDependencies = function() { return ["lib/bitaddress.js", "lib/keythereum.js", "lib/ethereumjs-util.js"]; }
	this.getDonationAddress = function() { return "0x8074da70E22a58A9E4a5DCeCf968Ea499D60e470"; }
	this.newKey = function(str) {
		
		// create key if not given
		if (!str) str = keythereum.create().privateKey.toString("hex");
		assertTrue(isString(str), "Argument to parse must be a string: " + str);
		var state = {};
		
		// handle hex
		if (isHex(str)) {
			
			// unencrypted
			if (str.length >= 63 && str.length <= 65) {
				state.hex = str;
				state.wif = str;
				state.address = ethereumjsutil.toChecksumAddress(keythereum.privateKeyToAddress(state.hex));
				state.encryption = null;
				return new CryptoKey(this, state);
			}
			
			// hex cryptojs
			else if (str.length > 100) {
				state.hex = str;
				state.wif = CryptoJS.enc.Hex.parse(str).toString(CryptoJS.enc.Base64).toString(CryptoJS.enc.Utf8);
				if (!state.wif.startsWith("U2")) throw new Error("Unrecognized private key: " + str);
				state.encryption = AppUtils.EncryptionScheme.CRYPTOJS;
				return new CryptoKey(this, state);
			}
		}
		
		// wif cryptojs
		else if (AppUtils.isWifCryptoJs(str)) {
			state.hex = CryptoJS.enc.Base64.parse(str).toString(CryptoJS.enc.Hex);
			state.wif = str;
			state.encryption = AppUtils.EncryptionScheme.CRYPTOJS;
			return new CryptoKey(this, state);
		}
		
		// otherwise key is not recognized
		throw new Error("Unrecognized private key: " + str);
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
 * Litecoin plugin.
 */
function LitecoinPlugin() {
	this.getName = function() { return "Litecoin"; }
	this.getTicker = function() { return "LTC" };
	this.getLogoPath = function() { return "img/litecoin.png"; }
	this.getDependencies = function() { return ["lib/bitaddress.js", "lib/litecore.js"]; }
	this.getDonationAddress = function() { return "LSRx2UwU5rjKGcmUXx8KDNTNXMBV1PudHB"; }
	this.newKey = function(str) {
		
		// create key if not given
		if (!str) str = new litecore.PrivateKey().toString();		
		else assertTrue(isString(str), "Argument to parse must be a string: " + str);
		var state = {};
		
		// unencrypted
		if (str.length >= 52 && litecore.PrivateKey.isValid(str)) {	// litecore says 'ab' is valid?
			var key = new litecore.PrivateKey(str);
			state.hex = key.toString();
			state.wif = key.toWIF();
			state.address = key.toAddress().toString();
			state.encryption = null;
			return new CryptoKey(this, state);
		}
		
		// hex cryptojs
		else if (isHex(str) && str.length > 100) {
			state.hex = str;
			state.wif = CryptoJS.enc.Hex.parse(str).toString(CryptoJS.enc.Base64).toString(CryptoJS.enc.Utf8);
			if (!state.wif.startsWith("U2")) throw new Error("Unrecognized private key: " + str);
			state.encryption = AppUtils.EncryptionScheme.CRYPTOJS;
			return new CryptoKey(this, state);
		}
		
		// wif cryptojs
		else if (AppUtils.isWifCryptoJs(str)) {
			state.hex = CryptoJS.enc.Base64.parse(str).toString(CryptoJS.enc.Hex);
			state.wif = str;
			state.encryption = AppUtils.EncryptionScheme.CRYPTOJS;
			return new CryptoKey(this, state);
		}
		
		// otherwise key is not recognized
		throw new Error("Unrecognized private key: " + str);
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
	this.newKey = function(str) {
		
		// create key if not given
		if (!str) str = new dashcore.PrivateKey().toString();		
		else assertTrue(isString(str), "Argument to parse must be a string: " + str);
		var state = {};
		
		// unencrypted
		if (str.length >= 52 && dashcore.PrivateKey.isValid(str)) {	// dashcore says 'ab' is valid?
			var key = new dashcore.PrivateKey(str);
			state.hex = key.toString();
			state.wif = key.toWIF();
			state.address = key.toAddress().toString();
			state.encryption = null;
			return new CryptoKey(this, state);
		}
		
		// hex cryptojs
		else if (isHex(str) && str.length > 100) {
			state.hex = str;
			state.wif = CryptoJS.enc.Hex.parse(str).toString(CryptoJS.enc.Base64).toString(CryptoJS.enc.Utf8);
			if (!state.wif.startsWith("U2")) throw new Error("Unrecognized private key: " + str);
			state.encryption = AppUtils.EncryptionScheme.CRYPTOJS;
			return new CryptoKey(this, state);
		}
		
		// wif cryptojs
		else if (AppUtils.isWifCryptoJs(str)) {
			state.hex = CryptoJS.enc.Base64.parse(str).toString(CryptoJS.enc.Hex);
			state.wif = str;
			state.encryption = AppUtils.EncryptionScheme.CRYPTOJS;
			return new CryptoKey(this, state);
		}
		
		// otherwise key is not recognized
		throw new Error("Unrecognized private key: " + str);
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
	this.getLogoPath = function() { return "img/monero.png"; }
	this.getDependencies = function() { return ["lib/bitaddress.js", "lib/moneroaddress.js"]; }
	this.getDonationAddress = function() { return "42fuBvVfgPUWphR6C5XgsXDGfx2KVhbv4cjhJDm9Y87oU1ixpDnzF82RAWCbt8p81f26kx3kstGJCat1YEohwS1e1o27zWE"; }
	this.newKey = function(str) {
		
		// create key if not given
		if (!str) str = cnUtil.sc_reduce32(cnUtil.rand_32());
		assertTrue(isString(str), "Argument to parse must be a string: " + str);
		var state = {};
		
		// handle hex
		if (isHex(str)) {
			
			// unencrypted
			if (str.length >= 63 && str.length <= 65) {
				var address = cnUtil.create_address(str);
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
				state.encryption = AppUtils.EncryptionScheme.CRYPTOJS;
				return new CryptoKey(this, state);
			}
		}
		
		// wif cryptojs
		if (AppUtils.isWifCryptoJs(str)) {
			state.hex = CryptoJS.enc.Base64.parse(str).toString(CryptoJS.enc.Hex);
			state.wif = str;
			state.encryption = AppUtils.EncryptionScheme.CRYPTOJS;
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
	this.newKey = function(str) {
		
		// create key if not given
		if (!str) str = new zcashcore.PrivateKey().toString();		
		else assertTrue(isString(str), "Argument to parse must be a string: " + str);
		var state = {};
		
		// unencrypted
		if (str.length >= 52 && zcashcore.PrivateKey.isValid(str)) {	// zcashcore says 'ab' is valid?
			var key = new zcashcore.PrivateKey(str);
			state.hex = key.toString();
			state.wif = key.toWIF();
			state.address = key.toAddress().toString();
			state.encryption = null;
			return new CryptoKey(this, state);
		}
		
		// hex cryptojs
		else if (isHex(str) && str.length > 100) {
			state.hex = str;
			state.wif = CryptoJS.enc.Hex.parse(str).toString(CryptoJS.enc.Base64).toString(CryptoJS.enc.Utf8);
			if (!state.wif.startsWith("U2")) throw new Error("Unrecognized private key: " + str);
			state.encryption = AppUtils.EncryptionScheme.CRYPTOJS;
			return new CryptoKey(this, state);
		}
		
		// wif cryptojs
		else if (AppUtils.isWifCryptoJs(str)) {
			state.hex = CryptoJS.enc.Base64.parse(str).toString(CryptoJS.enc.Hex);
			state.wif = str;
			state.encryption = AppUtils.EncryptionScheme.CRYPTOJS;
			return new CryptoKey(this, state);
		}
		
		// otherwise key is not recognized
		throw new Error("Unrecognized private key: " + str);
	}
	this.isAddress = function(str) {
		return zcashcore.Address.isValid(str);
	}
}
inheritsFrom(ZcashPlugin, CryptoPlugin);