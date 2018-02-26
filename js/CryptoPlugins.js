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
	this.getEncryptionSchemes = function() { return [AppUtils.EncryptionScheme.CRYPTOJS_PBKDF2, AppUtils.EncryptionScheme.BIP38, AppUtils.EncryptionScheme.CRYPTOJS]; }
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
		
		// wif cryptojs pbkdf2
		else if (AppUtils.isWifCryptoJsPbkdf2Standard(str)) {
			state.hex = Crypto.util.bytesToHex(Bitcoin.Base58.decode(str));
			state.wif = str;
			state.encryption = AppUtils.EncryptionScheme.CRYPTOJS_PBKDF2;
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
			
			// cryptojs pbkdf2
			if (str.length === 224) {
				state.hex = str;
				state.wif = Bitcoin.Base58.encode(Crypto.util.hexToBytes(state.hex));
				if (!AppUtils.isWifCryptoJsPbkdf2Standard(state.wif)) throw new Error("Unrecognized private key: " + str);
				state.encryption = AppUtils.EncryptionScheme.CRYPTOJS_PBKDF2;
				return new CryptoKey(this, state);
			}
			
			// cryptojs
			else if (str.length > 100) {
				state.hex = str;
				state.wif = CryptoJS.enc.Hex.parse(str).toString(CryptoJS.enc.Base64).toString(CryptoJS.enc.Utf8);
				if (!AppUtils.isWifCryptoJs(state.wif)) throw new Error("Unrecognized private key: " + str);
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
 * Bitcoin Cash plugin.
 */
function BitcoinCashPlugin() {
	var bitcoinPlugin = new BitcoinPlugin();
	this.getName = function() { return "Bitcoin Cash"; }
	this.getTicker = function() { return "BCH" };
	this.getLogoPath = function() { return "img/bitcoin_cash.png"; }
	this.getDependencies = function() { return ["lib/bitaddress.js", "lib/bchaddrjs-0.1.4.js"]; }
	this.getDonationAddress = function() { return "qqcsh20ltcnxxw2wqd3m7j8j8qeh46qwuv5s93987x"; }
	this.getEncryptionSchemes = function() { return [AppUtils.EncryptionScheme.CRYPTOJS, AppUtils.EncryptionScheme.BIP38]; }
	this.newKey = function(str) {
		var key = bitcoinPlugin.newKey(str);
		key.setPlugin(this);
		if (!key.getAddress()) return key;
		var address = bchaddr.toCashAddress(key.getAddress());
		key.setAddress(address.substring(address.indexOf(':') + 1), true);	// override address with CashAddr format
		return key;
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
			
			// hex cryptojs pbkdf2
			else if (str.length === 224) {
				state.hex = str;
				state.wif = Bitcoin.Base58.encode(Crypto.util.hexToBytes(state.hex));
				if (!AppUtils.isWifCryptoJsPbkdf2Standard(state.wif)) throw new Error("Unrecognized private key: " + str);
				state.encryption = AppUtils.EncryptionScheme.CRYPTOJS_PBKDF2;
				return new CryptoKey(this, state);
			}
			
			// hex cryptojs
			else if (str.length > 100) {
				state.hex = str;
				state.wif = CryptoJS.enc.Hex.parse(str).toString(CryptoJS.enc.Base64).toString(CryptoJS.enc.Utf8);
				if (!AppUtils.isWifCryptoJs(state.wif)) throw new Error("Unrecognized private key: " + str);
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
		
		// wif cryptojs pbkdf2
		else if (AppUtils.isWifCryptoJsPbkdf2Standard(str)) {
			state.hex = Crypto.util.bytesToHex(Bitcoin.Base58.decode(str));
			state.wif = str;
			state.encryption = AppUtils.EncryptionScheme.CRYPTOJS_PBKDF2;
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
	this.getEncryptionSchemes = function() { return [AppUtils.EncryptionScheme.CRYPTOJS_PBKDF2, AppUtils.EncryptionScheme.CRYPTOJS]; }
	this.newKey = function(str) {
		
		// create key if not given
		//if (!str) str = "31fe7a8b58100ef54e9dda4446b5193df3299e220c6542d3685db6536081cf";
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
		
		// key encrypted with cryptostorage conventions
		else if (AppUtils.isEncryptedKey(str)) return new CryptoKey(this, AppUtils.decodeEncryptedKey(str));
		
		// otherwise key is not recognized
		throw new Error("Unrecognized private key: " + str);
		
		function isWifCryptoJsPbkdf2Litecoin(str) {
			return AppUtils.isBase58(str) && str.length === 131 || str.length === 132 || str.length === 153;
		}
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
		
		// hex
		if (isHex(str)) {
			
			// hex cryptojs pbkdf2
			if (str.length === 224) {
				state.hex = str;
				state.wif = Bitcoin.Base58.encode(Crypto.util.hexToBytes(state.hex));
				if (!AppUtils.isWifCryptoJsPbkdf2Standard(state.wif)) throw new Error("Unrecognized private key: " + str);
				state.encryption = AppUtils.EncryptionScheme.CRYPTOJS_PBKDF2;
				return new CryptoKey(this, state);
			}
			
			// hex cryptojs
			else if (str.length > 100) {
				state.hex = str;
				state.wif = CryptoJS.enc.Hex.parse(str).toString(CryptoJS.enc.Base64).toString(CryptoJS.enc.Utf8);
				if (!AppUtils.isWifCryptoJs(state.wif)) throw new Error("Unrecognized private key: " + str);
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
		
		// wif cryptojs pbkdf2
		else if (AppUtils.isWifCryptoJsPbkdf2Standard(str)) {
			state.hex = Crypto.util.bytesToHex(Bitcoin.Base58.decode(str));
			state.wif = str;
			state.encryption = AppUtils.EncryptionScheme.CRYPTOJS_PBKDF2;
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
	this.getEncryptionSchemes = function() { return [AppUtils.EncryptionScheme.CRYPTOJS_PBKDF2, AppUtils.EncryptionScheme.CRYPTOJS]; }
	this.newKey = function(str) {
		
		// create key if not given
		if (!str) str = cnUtil.sc_reduce32(cnUtil.rand_32());
		assertTrue(isString(str), "Argument to parse must be a string: " + str);
		
		// wif unencrypted
		if (str.indexOf(' ') !== -1) {
			var state = {};
			state.hex = mn_decode(str);
			state.wif = str;
			state.address = cnUtil.create_address(state.hex).public_addr;
			state.encryption = null;
			return new CryptoKey(this, state);
		}
		
		// key encrypted with cryptostorage conventions
		else if (AppUtils.isEncryptedKey(str)) return new CryptoKey(this, AppUtils.decodeEncryptedKey(str));
		
		// unencrypted hex
		else if (isHex(str) && str.length >= 63 && str.length <= 65) {	// TODO: should not be necessary to check length
			var address = cnUtil.create_address(str);
			if (!cnUtil.valid_keys(address.view.pub, address.view.sec, address.spend.pub, address.spend.sec)) throw new Error("Invalid address keys derived from hex key");
			var state = {};
			state.hex = str;
			state.wif = mn_encode(state.hex, 'english');
			state.address = address.public_addr;
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
		
		// hex
		if (isHex(str)) {
			
			// hex cryptojs pbkdf2
			if (str.length === 224) {
				state.hex = str;
				state.wif = Bitcoin.Base58.encode(Crypto.util.hexToBytes(state.hex));
				if (!AppUtils.isWifCryptoJsPbkdf2Standard(state.wif)) throw new Error("Unrecognized private key: " + str);
				state.encryption = AppUtils.EncryptionScheme.CRYPTOJS_PBKDF2;
				return new CryptoKey(this, state);
			}
			
			// hex cryptojs
			else if (isHex(str) && str.length > 100) {
				state.hex = str;
				state.wif = CryptoJS.enc.Hex.parse(str).toString(CryptoJS.enc.Base64).toString(CryptoJS.enc.Utf8);
				if (!AppUtils.isWifCryptoJs(state.wif)) throw new Error("Unrecognized private key: " + str);
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
		
		// wif cryptojs pbkdf2
		else if (AppUtils.isWifCryptoJsPbkdf2Standard(str)) {
			state.hex = Crypto.util.bytesToHex(Bitcoin.Base58.decode(str));
			state.wif = str;
			state.encryption = AppUtils.EncryptionScheme.CRYPTOJS_PBKDF2;
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

/**
 * Ripple plugin.
 */
function RipplePlugin() {
	this.getName = function() { return "Ripple"; }
	this.getTicker = function() { return "XRP" };
	this.getLogoPath = function() { return "img/ripple.png"; }
	this.getDependencies = function() { return ["lib/bitaddress.js", "lib/ripple-key-pairs.js"]; }
	this.getDonationAddress = function() { return "r9AWMe2aSjTaj9aWpGrXQAHruodTDnHfaK"; }
	this.newKey = function(str) {
		
		// generate seed if not given
		if (!str) str = ripple_key_pairs.generateSeed();
		else assertTrue(isString(str), "Argument to parse must be a string: " + str);
		var state = {};
		
		// unencrypted wif
		if (str.length === 29 && AppUtils.isBase58(str)) {
			state.hex = Crypto.util.bytesToHex(Bitcoin.Base58.decode(str));
			state.wif = str;
			state.address = ripple_key_pairs.deriveAddress(ripple_key_pairs.deriveKeypair(str).publicKey);
			state.encryption = null;
			return new CryptoKey(this, state);
		}
		
		// hex
		if (isHex(str)) {
			
			// unencrypted hex
			if (str.length === 44) {
				state.hex = str;
				state.wif = Bitcoin.Base58.encode(Crypto.util.hexToBytes(str));
				state.address = ripple_key_pairs.deriveAddress(ripple_key_pairs.deriveKeypair(state.wif).publicKey);			
				state.encryption = null;
				return new CryptoKey(this, state);
			}
			
			// hex cryptojs pbkdf2
			if (str.length === 160) {
				state.hex = str;
				state.wif = Bitcoin.Base58.encode(Crypto.util.hexToBytes(state.hex));
				if (!isWifCryptoJsPbkdf2Ripple(state.wif)) throw new Error("Unrecognized private key: " + str);
				state.encryption = AppUtils.EncryptionScheme.CRYPTOJS_PBKDF2;
				return new CryptoKey(this, state);
			}
			
			// cryptojs hex
			else if (str.length > 100) {
				state.hex = str;
				state.wif = CryptoJS.enc.Hex.parse(str).toString(CryptoJS.enc.Base64).toString(CryptoJS.enc.Utf8);
				if (!AppUtils.isWifCryptoJs(state.wif)) throw new Error("Unrecognized private key: " + str);
				state.encryption = AppUtils.EncryptionScheme.CRYPTOJS;
				return new CryptoKey(this, state);
			}
		}
		
		// cryptojs wif
		else if (AppUtils.isWifCryptoJs(str)) {
			state.hex = CryptoJS.enc.Base64.parse(str).toString(CryptoJS.enc.Hex);
			state.wif = str;
			state.encryption = AppUtils.EncryptionScheme.CRYPTOJS;
			return new CryptoKey(this, state);
		}
		
		// wif cryptojs pbkdf2
		else if (isWifCryptoJsPbkdf2Ripple(str)) {
			state.hex = Crypto.util.bytesToHex(Bitcoin.Base58.decode(str));
			state.wif = str;
			state.encryption = AppUtils.EncryptionScheme.CRYPTOJS_PBKDF2;
			return new CryptoKey(this, state);
		}
		
		// otherwise key is not recognized
		throw new Error("Unrecognized private key: " + str);
		
		function isWifCryptoJsPbkdf2Ripple(str) {
			return AppUtils.isBase58(str) && str.length === 109 || str.length === 110;
		}
	}
	this.isAddress = function(str) {
		return isString(str) && (str.length === 33  || str.length === 34) && AppUtils.isBase58(str);
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
	this.newKey = function(str) {
				
		// generate seed if not given
		if (!str) str = StellarBase.Keypair.random().secret();
		else assertTrue(isString(str), "Argument to parse must be a string: " + str);
		var state = {};
		
		// unencrypted wif
		if (str.length === 56 && isUpperCase(str) && AppUtils.isBase32(str)) {
			var keypair = StellarBase.Keypair.fromSecret(str);
			state.hex = keypair.rawSecretKey().toString('hex');
			state.wif = str;			
			state.address = keypair.publicKey();
			state.encryption = null;
			return new CryptoKey(this, state);
		}
		
		if (isHex(str)) {
			
			// unencrypted hex
			if (str.length === 64) {
				var rawSecret = new Uint8Array(Crypto.util.hexToBytes(str));
				var keypair = StellarBase.Keypair.fromRawEd25519Seed(rawSecret);
				state.hex = str;
				state.wif = keypair.secret();
				state.address = keypair.publicKey();
				state.encryption = null;
				return new CryptoKey(this, state);
			}
			
			// hex cryptojs pbkdf2
			else if (str.length === 224) {
				state.hex = str;
				state.wif = Bitcoin.Base58.encode(Crypto.util.hexToBytes(state.hex));
				if (!AppUtils.isWifCryptoJsPbkdf2Standard(state.wif)) throw new Error("Unrecognized private key: " + str);
				state.encryption = AppUtils.EncryptionScheme.CRYPTOJS_PBKDF2;
				return new CryptoKey(this, state);
			}
			
			// cryptojs hex
			else if (str.length > 100) {
				state.hex = str;
				state.wif = CryptoJS.enc.Hex.parse(str).toString(CryptoJS.enc.Base64).toString(CryptoJS.enc.Utf8);
				if (!AppUtils.isWifCryptoJs(state.wif)) throw new Error("Unrecognized private key: " + str);
				state.encryption = AppUtils.EncryptionScheme.CRYPTOJS;
				return new CryptoKey(this, state);
			}
		}
		
		// cryptojs wif
		else if (AppUtils.isWifCryptoJs(str)) {
			state.hex = CryptoJS.enc.Base64.parse(str).toString(CryptoJS.enc.Hex);
			state.wif = str;
			state.encryption = AppUtils.EncryptionScheme.CRYPTOJS;
			return new CryptoKey(this, state);
		}
		
		// wif cryptojs pbkdf2
		else if (AppUtils.isWifCryptoJsPbkdf2Standard(str)) {
			state.hex = Crypto.util.bytesToHex(Bitcoin.Base58.decode(str));
			state.wif = str;
			state.encryption = AppUtils.EncryptionScheme.CRYPTOJS_PBKDF2;
			return new CryptoKey(this, state);
		}
		
		// otherwise key is not recognized
		throw new Error("Unrecognized private key: " + str);
	}
	this.isAddress = function(str) {
		return isString(str) && isUpperCase(str) && str.length === 56 && AppUtils.isBase32(str);
	}
}
inheritsFrom(StellarPlugin, CryptoPlugin);

/**
 * BIP39 plugin.
 */
function BIP39Plugin() {
	this.getName = function() { return "BIP39"; }
	this.getTicker = function() { return "BIP39" };
	this.getLogoPath = function() { return "img/usb.png"; }
	this.getDependencies = function() { return ["lib/bip39.js"]; }
	this.getDonationAddress = function() { return null; }
	this.newKey = function(str) {
		
		// initialize
		var language = "english";
		var wordlist = WORDLISTS[language];
		var shamir39 = new Shamir39();
		var mnemonic = new Mnemonic(language);

		// generate phrase if not given
		if (!str) str = mnemonic.generate(256); 
		else assertTrue(isString(str), "Argument to parse must be a string: " + str);
		
		// initialize state
		var state = {address: AppUtils.NA};
		
		// unencrypted wif
		if (mnemonic.check(str)) {
			state.hex = shamir39.getHexFromWords(mnemonic.splitWords(str), wordlist);
			state.wif = str;
			state.encryption = null;
			return new CryptoKey(this, state);
		}
		
		// hex
		if (isHex(str)) {
			
			// unencrypted hex
			if (str.length === 66) {
				state.hex = str;
				state.wif = mnemonic.joinWords(shamir39.getWordsFromHex(str, wordlist));
				state.encryption = null;
				return new CryptoKey(this, state);
			}
			
			// hex cryptojs pbkdf2
			else if (str.length === 224) {
				state.hex = str;
				state.wif = Bitcoin.Base58.encode(Crypto.util.hexToBytes(state.hex));
				if (!AppUtils.isWifCryptoJsPbkdf2Standard(state.wif)) throw new Error("Unrecognized private key: " + str);
				state.encryption = AppUtils.EncryptionScheme.CRYPTOJS_PBKDF2;
				return new CryptoKey(this, state);
			}
			
			// cryptojs hex
			else if (str.length === 192) {
				state.hex = str;
				state.wif = CryptoJS.enc.Hex.parse(str).toString(CryptoJS.enc.Base64).toString(CryptoJS.enc.Utf8);
				if (!AppUtils.isWifCryptoJs(state.wif)) throw new Error("Unrecognized private key: " + str);
				state.encryption = AppUtils.EncryptionScheme.CRYPTOJS;
				return new CryptoKey(this, state);
			}
		}
		
		// cryptojs wif
		else if (AppUtils.isWifCryptoJs(str)) {
			state.hex = CryptoJS.enc.Base64.parse(str).toString(CryptoJS.enc.Hex);
			state.wif = str;
			state.encryption = AppUtils.EncryptionScheme.CRYPTOJS;
			return new CryptoKey(this, state);
		}
		
		// wif cryptojs pbkdf2
		else if (AppUtils.isWifCryptoJsPbkdf2Standard(str)) {
			state.hex = Crypto.util.bytesToHex(Bitcoin.Base58.decode(str));
			state.wif = str;
			state.encryption = AppUtils.EncryptionScheme.CRYPTOJS_PBKDF2;
			return new CryptoKey(this, state);
		}
		
		// unrecognized bip39 wif or hex phrase
		throw new Error("Unrecognized bip39 seed: " + str);
	}
	this.isAddress = function(str) {
		return str === AppUtils.NA;
	}
}
inheritsFrom(BIP39Plugin, CryptoPlugin);

/**
 * Waves plugin.
 */
function WavesPlugin() {
	this.getName = function() { return "Waves"; }
	this.getTicker = function() { return "WAVES" };
	this.getLogoPath = function() { return "img/waves.png"; }
	this.getDependencies = function() { return ["lib/bip39.js", "lib/polyfill.js", "lib/waves-api.js"]; }
	this.getDonationAddress = function() { return "3P2xXtsfe4FUnQmu2iuKwXLshYYc2CjnXQH"; }
	this.newKey = function(str) {
		
		// initialize
		var Waves = WavesAPI.create(WavesAPI.MAINNET_CONFIG);
		var wordlist = Waves.Seed.getSeedDictionary();
		var shamir39 = new Shamir39();

		// generate phrase if not given
		if (!str) str = Waves.Seed.create().phrase;
		else assertTrue(isString(str), "Argument to parse must be a string: " + str);
		
		// initialize state
		var state = {};
		
		// unencrypted wif
		if (str.indexOf(' ') !== -1 && str.split(' ').length === 15) {
			state.hex = shamir39.getHexFromWords(str.split(' '), wordlist);
			state.wif = str;
			state.address = Waves.Seed.fromExistingPhrase(state.wif).address;
			state.encryption = null;
			return new CryptoKey(this, state);
		}
		
		// hex
		if (isHex(str)) {
			
			// unencrypted hex
			if (str.length === 42) {
				state.hex = str;
				state.wif = shamir39.getWordsFromHex(str, wordlist).join(' ');
				state.address = Waves.Seed.fromExistingPhrase(state.wif).address;
				state.encryption = null;
				return new CryptoKey(this, state);
			}
			
			// hex cryptojs pbkdf2
			else if (str.length === 160) {
				state.hex = str;
				state.wif = Bitcoin.Base58.encode(Crypto.util.hexToBytes(state.hex));
				if (!isWifCryptoJsPbkdf2Waves(state.wif)) throw new Error("Unrecognized private key: " + str);
				state.encryption = AppUtils.EncryptionScheme.CRYPTOJS_PBKDF2;
				return new CryptoKey(this, state);
			}
			
			// cryptojs hex
			else if (str.length === 128) {
				state.hex = str;
				state.wif = CryptoJS.enc.Hex.parse(str).toString(CryptoJS.enc.Base64).toString(CryptoJS.enc.Utf8);
				if (!AppUtils.isWifCryptoJs(state.wif)) throw new Error("Unrecognized wif or hex: " + str);
				state.encryption = AppUtils.EncryptionScheme.CRYPTOJS;
				return new CryptoKey(this, state);
			}
		}
		
		// cryptojs wif
		else if (AppUtils.isWifCryptoJs(str)) {
			state.hex = CryptoJS.enc.Base64.parse(str).toString(CryptoJS.enc.Hex);
			state.wif = str;
			state.encryption = AppUtils.EncryptionScheme.CRYPTOJS;
			return new CryptoKey(this, state);
		}
		
		// wif cryptojs pbkdf2
		else if (isWifCryptoJsPbkdf2Waves(str)) {
			state.hex = Crypto.util.bytesToHex(Bitcoin.Base58.decode(str));
			state.wif = str;
			state.encryption = AppUtils.EncryptionScheme.CRYPTOJS_PBKDF2;
			return new CryptoKey(this, state);
		}
		
		// unrecognized wif or hex
		throw new Error("Unrecognized wif or hex: " + str);
		
		function isWifCryptoJsPbkdf2Waves(str) {
			return AppUtils.isBase58(str) && str.length === 109 || str.length === 110;
		}
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
	this.newKey = function(str) {

		// generate phrase if not given
		if (!str) str = Neon.wallet.generatePrivateKey();
		else assertTrue(isString(str), "Argument to parse must be a string: " + str);
		
		// initialize state
		var state = {};
		
		// unencrypted wif
		if (Neon.wallet.isWIF(str)) {
			state.hex = Neon.wallet.getPrivateKeyFromWIF(str);
			state.wif = str;
			state.address = Neon.wallet.getAddressFromScriptHash(Neon.wallet.getScriptHashFromPublicKey(Neon.wallet.getPublicKeyFromPrivateKey(state.hex)));
			state.encryption = null;
			return new CryptoKey(this, state);
		}
		
		// hex
		if (isHex(str)) {
			
			// unencrypted hex
			if (str.length === 64) {
				state.hex = str;
				state.wif = Neon.wallet.getWIFFromPrivateKey(state.hex);
				state.address = Neon.wallet.getAddressFromScriptHash(Neon.wallet.getScriptHashFromPublicKey(Neon.wallet.getPublicKeyFromPrivateKey(state.hex)));
				state.encryption = null;
				return new CryptoKey(this, state);
			}
			
			// hex cryptojs pbkdf2
			else if (str.length === 224) {
				state.hex = str;
				state.wif = Bitcoin.Base58.encode(Crypto.util.hexToBytes(state.hex));
				if (!AppUtils.isWifCryptoJsPbkdf2Standard(state.wif)) throw new Error("Unrecognized private key: " + str);
				state.encryption = AppUtils.EncryptionScheme.CRYPTOJS_PBKDF2;
				return new CryptoKey(this, state);
			}
			
			// cryptojs hex
			else if (str.length === 192) {
				state.hex = str;
				state.wif = CryptoJS.enc.Hex.parse(str).toString(CryptoJS.enc.Base64).toString(CryptoJS.enc.Utf8);
				if (!AppUtils.isWifCryptoJs(state.wif)) throw new Error("Unrecognized private key: " + str);
				state.encryption = AppUtils.EncryptionScheme.CRYPTOJS;
				return new CryptoKey(this, state);
			}
		}
		
		// cryptojs wif
		else if (AppUtils.isWifCryptoJs(str)) {
			state.hex = CryptoJS.enc.Base64.parse(str).toString(CryptoJS.enc.Hex);
			state.wif = str;
			state.encryption = AppUtils.EncryptionScheme.CRYPTOJS;
			return new CryptoKey(this, state);
		}
		
		// wif cryptojs pbkdf2
		else if (AppUtils.isWifCryptoJsPbkdf2Standard(str)) {
			state.hex = Crypto.util.bytesToHex(Bitcoin.Base58.decode(str));
			state.wif = str;
			state.encryption = AppUtils.EncryptionScheme.CRYPTOJS_PBKDF2;
			return new CryptoKey(this, state);
		}
		
		// unrecognized wif or hex
		throw new Error("Unrecognized private key: " + str);
	}
	this.isAddress = function(str) {
		return Neon.wallet.isAddress(str);
	}
}
inheritsFrom(NeoPlugin, CryptoPlugin);