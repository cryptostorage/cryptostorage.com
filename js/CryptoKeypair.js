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
 * Encapsulates a crypto keypair which has a public and private component.
 * 
 * One of keypair, plugin, json, or splitKeypairs is required.
 * 
 * @param config is initialization configuration
 * 				config.keypair is a keypair to copy from
 * 				config.plugin is the crypto plugin or string ticker
 * 				config.json is exportable json to initialize from
 * 				config.splitKeypairs are split keypairs to combine and initialize from
 * 				config.privateKey is a private key (hex or wif, encrypted or unencrypted) (optional)
 * 				config.publicAddress is a public address to manually set if not unencrypted (optional)
 * 				config.shareNum is the share number if otherwise undefined (optional)
 */
function CryptoKeypair(config) {
	
	this._state = {};
	this._isDestroyed = false;
		
	// direct copy internal state from keypair, no validation
	if (config.keypair) {
		assertUndefined(config.json);
		assertUndefined(config.splitKeypairs);
		assertUndefined(config.privateKey);
		assertUndefined(config.publicAddress);
		assertUndefined(config.shareNum);
		assertObject(config.keypair, CryptoKeypair);
		this._state = Object.assign({}, config.keypair._state);
		return;
	}
	
	// create from plugin
	if (config.plugin) {
		assertUndefined(config.keypair);
		assertUndefined(config.splitKeypairs);
		assertUndefined(config.json);
		var plugin = isString(config.plugin) ? AppUtils.getCryptoPlugin(config.plugin) : config.plugin;
		assertTrue(isObject(plugin, CryptoPlugin), "Plugin is not a CryptoPlugin");
		this._state.plugin = plugin;
		if (isDefined(config.privateKey)) this._setPrivateKey(config.privateKey);
		else if (isUndefined(config.publicAddress)) this._setPrivateKey(config.plugin.randomPrivateKey());
		if (isDefined(config.publicAddress)) this._setPublicAddress(config.publicAddress);
	}
	
	// create from json
	else if (config.json) {
		assertUndefined(config.keypair);
		assertUndefined(config.plugin);
		assertUndefined(config.splitKeypairs);
		this._fromJson(config.json);
	}
	
	// create from splitKeypairs
	else if (config.splitKeypairs) {
		assertUndefined(config.keypair);
		assertUndefined(config.plugin);
		assertUndefined(config.json);
		this._combine(config.splitKeypairs);
	}
	
	// set share num
	if (isDefined(config.shareNum)) this.setShareNum(config.shareNum);
	
	// verify state
	this._validateState();
}

CryptoKeypair.prototype.getPlugin = function() {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	return this._state.plugin;
}

CryptoKeypair.prototype.isPublicApplicable = function() {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	return this._state.plugin.hasPublicAddress();
}

CryptoKeypair.prototype.hasPublicAddress = function() {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	return isDefined(this._state.publicAddress);
}

CryptoKeypair.prototype.getPublicAddress = function() {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	return this._state.publicAddress;
}

CryptoKeypair.prototype.removePublicAddress = function() {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	assertTrue(this.hasPrivateKey());
	delete this._state.publicAddress;
	return this;
}

CryptoKeypair.prototype.getPrivateLabel = function() {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	return this._state.plugin.getPrivateLabel();
}

CryptoKeypair.prototype.hasPrivateKey = function() {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	return isDefined(this.getPrivateHex());
}

CryptoKeypair.prototype.getPrivateHex = function() {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	return this._state.privateHex;
}

CryptoKeypair.prototype.getPrivateWif = function() {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	return this._state.privateWif;
}

CryptoKeypair.prototype.removePrivateKey = function() {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	assertDefined(this.getPublicAddress());
	delete this._state.privateHex;
	delete this._state.privateWif;
	delete this._state.encryption;
	delete this._state.isSplit;
	delete this._state.minShares;
	delete this._state.shareNum;
	return this;
}

CryptoKeypair.prototype.encrypt = function(scheme, passphrase, onProgress, onDone) {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	assertNull(this._state.encryption, "Keypair must be unencrypted to encrypt");
	var that = this;
	var address = this.getPublicAddress();
	AppUtils.encryptHex(this.getPrivateHex(), scheme, passphrase, function(percent, label) {
		if (that._isDestroyed) return;
		if (onProgress) onProgress(percent, label);
	}, function(err, encryptedHex) {
		if (that._isDestroyed) return;
		if (err) onDone(err);
		else {
			that._setPrivateKey(encryptedHex);
			that._setPublicAddress(address);
			that._validateState();
			onDone(null, that);
		}
	});
}

/**
 * Returns null if unencrypted, undefined if unknown, or one of AppUtils.EncryptionScheme otherwise.
 */
CryptoKeypair.prototype.getEncryptionScheme = function() {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	return this._state.encryption;
}

CryptoKeypair.prototype.isEncrypted = function() {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	if (isUndefined(this.getEncryptionScheme())) return undefined;
	return this.getEncryptionScheme() !== null;
}

CryptoKeypair.prototype.decrypt = function(passphrase, onProgress, onDone) {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	assertInitialized(this._state.encryption, "Keypair must be encrypted to decrypt");
	var that = this;
	AppUtils.decryptHex(this.getPrivateHex(), this.getEncryptionScheme(), passphrase, function(percent, label) {
		if (that._isDestroyed) return;
		if (onProgress) onProgress(percent, label);
	}, function(err, decryptedHex) {
		if (that._isDestroyed) return;
		if (err) onDone(err);
		else {
			try {
				that._setPrivateKey(decryptedHex);
			} catch (err) {
				console.log("Error setting private key after decryption!!!");
				console.log(that.toJson());
				console.log(err);
				throw new Error(err);
			}
			that._validateState();
			onDone(null, that);
		}
	});
}

CryptoKeypair.prototype.split = function(numShares, minShares) {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	
	// validate input
	assertFalse(this.isSplit());
	assertTrue(numShares >= 2);
	assertTrue(numShares <= AppUtils.MAX_SHARES, "Cannot split into more than " + AppUtils.MAX_SHARES + " shares");
	assertTrue(minShares >= 2);
	assertTrue(minShares <= numShares);
	
	// split private hex into shares
	var shares = secrets.share(this.getPrivateHex(), numShares, minShares);
	
	// encode shares with minimum threshold
	for (var i = 0; i < shares.length; i++) {
		shares[i] = CryptoKeypair.encodeHexShare(shares[i], minShares);
	}
	
	// create keypairs
	var splitKeypairs = [];
	for (var i = 0; i < shares.length; i++) {
		var keypair = new CryptoKeypair({
			plugin: this._state.plugin,
			privateKey: shares[i],
			publicAddress: this.getPublicAddress(),
			shareNum: i + 1
		});
		if (!this.hasPublicAddress()) keypair.removePublicAddress();
		splitKeypairs.push(keypair);
	}
	return splitKeypairs;
}

CryptoKeypair.prototype.isSplit = function() {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	return this._state.isSplit;
}

CryptoKeypair.prototype.getMinShares = function() {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	return this._state.minShares;
}

CryptoKeypair.prototype.getShareNum = function() {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	return this._state.shareNum;
}

CryptoKeypair.prototype.setShareNum = function(shareNum) {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	if (this.isSplit()) {
		assertNumber(shareNum);
		assertTrue(shareNum >= 1);
		assertTrue(shareNum <= AppUtils.MAX_SHARES);
		assertTrue(isUndefined(this._state.shareNum) || this._state.shareNum === shareNum, "Cannot override previously assigned share num");
		this._state.shareNum = shareNum;
	} else if (this.isSplit() === false) {
		assertNull(shareNum);
		assertNull(this._state.shareNum);
	} else if (this.isSplit() === undefined) {
		assertUndefined(shareNum);
		assertUndefined(this._state.shareNum);
	}
	return this;
}

CryptoKeypair.prototype.toJson = function() {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	function isExcluded(field) { return arrayContains(CryptoKeypair.EXCLUDE_FIELDS, field); }
	return {
		ticker: isExcluded(CryptoKeypair.Field.TICKER) ? undefined : this.getPlugin().getTicker(),
		publicAddress: isExcluded(CryptoKeypair.Field.PUBLIC_ADDRESS) ? undefined : this.getPublicAddress(),
		privateWif: isExcluded(CryptoKeypair.Field.PRIVATE_WIF) ? undefined : this.getPrivateWif(),
		privateHex: isExcluded(CryptoKeypair.Field.PRIVATE_HEX) ? undefined : this.getPrivateHex(),
		encryption: isExcluded(CryptoKeypair.Field.ENCRYPTION) ? undefined : this.getEncryptionScheme(),
		isSplit: isExcluded(CryptoKeypair.Field.IS_SPLIT) ? undefined : this.isSplit(),
		minShares: isExcluded(CryptoKeypair.Field.MIN_SHARES) ? undefined : this.getMinShares(),
		shareNum: isExcluded(CryptoKeypair.Field.SHARE_NUM) ? undefined : this.getShareNum(),
	}
}

CryptoKeypair.prototype.getFieldValue = function(field) {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	switch(field) {
		case CryptoKeypair.Field.TICKER:
			return this.getPlugin().getTicker();
		case CryptoKeypair.Field.PRIVATE_WIF:
			return this.getPrivateWif();
		case CryptoKeypair.Field.PRIVATE_HEX:
			return this.getPrivateHex();
		case CryptoKeypair.Field.PUBLIC_ADDRESS:
			return this.getPublicAddress();
		case CryptoKeypair.Field.ENCRYPTION:
			return this.getEncryptionScheme();
		case CryptoKeypair.Field.IS_SPLIT:
			return this.isSplit();
		case CryptoKeypair.Field.MIN_SHARES:
			return this.getMinShares();
		case CryptoKeypair.Field.SHARE_NUM:
			return this.getShareNum();
		default:
			throw new Error("Unrecognized keypair field: " + field);
	}
}

CryptoKeypair.prototype.copy = function() {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	return new CryptoKeypair({keypair: this});
}

CryptoKeypair.prototype.equals = function(keypair) {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	assertObject(keypair, CryptoKeypair);
	if (this._state.plugin.getTicker() !== keypair._state.plugin.getTicker()) return false;
	if (this._state.privateHex !== keypair._state.privateHex) return false;
	if (this._state.privateWif !== keypair._state.privateWif) return false;
	if (this._state.publicAddress !== keypair._state.publicAddress) return false;
	if (this._state.encryption !== keypair._state.encryption) return false;
	if (this._state.isSplit !== keypair._state.isSplit) return false;
	if (this._state.minShares !== keypair._state.minShares) return false;
	if (this._state.shareNum !== keypair._state.shareNum) return false;
	return true;
}

CryptoKeypair.prototype.destroy = function() {
	assertFalse(this._isDestroyed, "Keypair is already destroyed");
	delete this._state;
	this._isDestroyed = true;
}

CryptoKeypair.prototype.isDestroyed = function() {
	return this._isDestroyed;
}

// ---------------------------------- PRIVATE ---------------------------------

CryptoKeypair.prototype._validateState = function() {
	if (!this._state.plugin) throw new Error("Keypair has no plugin");
	if (this._state.isSplit === true) {
		assertInitialized(this._state.privateHex);
		assertInitialized(this._state.privateWif);
	} else if (this._state.isSplit === false) {
		assertInitialized(this._state.privateHex);
		assertInitialized(this._state.privateWif);
		assertNull(this._state.minShares);
		assertNull(this._state.shareNum);
	} else if (this._state.isSplit ===  undefined) {
		assertUndefined(this._state.privateHex);
		assertUndefined(this._state.privateWif);
		assertUndefined(this._state.minShares);
		assertUndefined(this._state.shareNum);
	}
	
	if (this._state.minShares) {
		assertTrue(this._state.isSplit);
		assertNumber(this._state.minShares);
		assertTrue(this._state.minShares >= 2 && this._state.minShares <= AppUtils.MAX_SHARES);
	}
	
	if (this._state.shareNum) {
		assertTrue(this._state.isSplit);
		assertNumber(this._state.shareNum);
		assertTrue(this._state.shareNum >= 1 && this._state.shareNum <= AppUtils.MAX_SHARES);
	}
	
	// hex and wif must both be initialized or undefined
	if (isInitialized(this._state.privateHex) || isInitialized(this._state.privateWif)) {
		assertInitialized(this._state.privateHex);
		assertInitialized(this._state.privateWif);
	} else {
		assertUndefined(this._state.privateHex);
		assertUndefined(this._state.privateWif);
	}
	
	// public or private must be known if address applicable
	if (this.getPlugin().hasPublicAddress()) {
		if (isUndefined(this._state.publicAddress)) assertTrue(this.hasPrivateKey());
		if (!this.hasPrivateKey()) assertInitialized(this._state.publicAddress);
	}
			
	// private key known
	if (this.hasPrivateKey()) {
		
		// split state is known or not applicable
		assertDefined(this._state.isSplit);
		
		// if not split then encryption is known
		if (this._state.isSplit === false) assertDefined(this._state.encryption);
		
		// unencrypted
		if (this._state.encryption === null) {
			this._state.plugin.hasPublicAddress() ? assertInitialized(this._state.publicAddress) : assertNull(this._state.publicAddress);
			assertFalse(this._state.isSplit);
			assertNull(this._state.minShares);
			assertNull(this._state.shareNum);
		}
		
		// split
		if (this._state.encryption === undefined || this._state.isSplit) {
			assertUndefined(this._state.encryption);
			assertNotNull(this._state.minShares);	// either undefined or share number
		}
		
		// encrypted
		if (isInitialized(this._state.encryption)) {
			assertFalse(this._state.isSplit);
			assertNull(this._state.minShares);
			assertNull(this._state.shareNum);
		}
	}
	
	// private key unknown
	if (!this.hasPrivateKey()) {
		assertUndefined(this._state.privateHex);
		assertUndefined(this._state.privateWif);
		assertUndefined(this._state.isSplit);
		assertUndefined(this._state.minShares);
		assertUndefined(this._state.shareNum);
		assertUndefined(this._state.encryption);
	}
}

CryptoKeypair.prototype._setPrivateKey = function(privateKey) {
	assertInitialized(this._state.plugin);
	assertString(privateKey);
	assertInitialized(privateKey);

	// decode with plugin
	var decoded = this._state.plugin.decode(privateKey);
	if (decoded) {
		this._state.privateHex = decoded.privateHex.toLowerCase();
		this._state.privateWif = decoded.privateWif;
		this._state.publicAddress = decoded.publicAddress;
		this._state.encryption = decoded.encryption;
		this._state.isSplit = false;
		this._state.minShares = null;
		this._state.shareNum = null;
		return;
	}
	
	// encrypted with cryptostorage conventions
	decoded = CryptoKeypair.decodeEncryptedKey(privateKey);
	if (decoded) {
		this._state.privateHex = decoded.privateHex.toLowerCase();
		this._state.privateWif = decoded.privateWif;
		this._state.publicAddress = this._state.plugin.hasPublicAddress() ? undefined : null;
		this._state.encryption = decoded.encryption;
		this._state.isSplit = false;
		this._state.minShares = null;
		this._state.shareNum = null;
		return;
	}
	
	// split share
	decoded = CryptoKeypair.decodeShare(privateKey);
	if (decoded) {
		this._state.privateHex = decoded.privateHex.toLowerCase();
		this._state.privateWif = decoded.privateWif;
		this._state.publicAddress = this._state.plugin.hasPublicAddress() ? undefined : null;
		this._state.encryption = undefined;
		this._state.isSplit = true;
		this._state.minShares = decoded.minShares;
		this._state.shareNum = undefined;
		return;
	}
	
	// unrecognized private key
	throw new Error("Unrecognized " + this._state.plugin.getTicker() + " private key: " + privateKey);
}

CryptoKeypair.prototype._fromJson = function(json) {
	if (isString(json)) json = JSON.parse(json);
	json = Object.assign({}, json);	
	assertInitialized(json.ticker);
	this._state.plugin = AppUtils.getCryptoPlugin(json.ticker);
	this._state.privateHex = json.privateHex;
	this._state.privateWif = json.privateWif;
	this._state.encryption = json.encryption;
	this._state.isSplit = json.isSplit;
	this._state.minShares = json.minShares;
	if (isDefined(this._state.privateHex)) this._setPrivateKey(this._state.privateHex);
	else if (isDefined(this._state.privateWif)) this._setPrivateKey(this._state.privateWif);
	if (isDefined(json.publicAddress)) this._setPublicAddress(json.publicAddress);
	if (json.encryption === null) assertUninitialized(json.shareNum);
	if (isDefined(json.shareNum)) this.setShareNum(json.shareNum);
}

CryptoKeypair.prototype._combine = function(splitKeypairs) {
	
	// verify keypairs and assign plugin
	var publicAddress;
	for (var i = 0; i < splitKeypairs.length; i++) {
		if (!this._state.plugin) this._state.plugin = splitKeypairs[i].getPlugin();
		else if (this._state.plugin !== splitKeypairs[i].getPlugin()) throw new Error("splitKeypairs[" + i + "] has inconsistent plugin");
		if (!publicAddress) publicAddress = splitKeypairs[i].getPublicAddress();
		else if (publicAddress !== splitKeypairs[i].getPublicAddress()) throw new Error("splitKeypairs[" + i + "] has inconsistent public address");
	}
	
	// collect decoded hex shares and verify consistent min shares
	var minShares;
	var shamirHexes = [];
	for (var i = 0; i < splitKeypairs.length; i++) {
		var decodedShare = CryptoKeypair.decodeShare(splitKeypairs[i].getPrivateWif());
		assertInitialized(decodedShare, "Could not decode share: " + splitKeypairs[i].getPrivateWif());
		if (!minShares) minShares = decodedShare.minShares;
		else if (minShares !== decodedShare.minShares) throw new Error("splitKeypairs[" + i + "] has inconsistent min shares");
		shamirHexes.push(decodedShare.shamirHex);
	}
	
	// verify no duplicates
	for (var i = 0; i < shamirHexes.length - 1; i++) {
		for (var j = i + 1; j < shamirHexes.length; j++) {
			assertFalse(shamirHexes[i] === shamirHexes[j], "Cannot create keypair from duplicate shares");
		}
	}
	
	// ensure sufficient shares provided
	if (isNumber(minShares) && splitKeypairs.length < minShares) {
		var additional = minShares - splitKeypairs.length;
		throw new Error("Need " + additional + " additional " + (additional === 1 ? "share" : "shares") + " to recover private key");
	} else if (splitKeypairs.length < 2) {
		throw new Error("Need additional shares to recover private key");
	}
	
	// try to combine shares to create private key and public address, which might be invalid or incompatible
	try {
		var privateHex = secrets.combine(shamirHexes);
		this._setPrivateKey(privateHex);
		if (isDefined(publicAddress)) this._setPublicAddress(publicAddress);
	} catch (err) {
		throw new Error("Need additional shares to recover private key");
	}
	
	// pieces must combine to create an unsplit piece with known encryption
  assertFalse(this.isSplit(), "Pieces are not compatible shares");
  assertBoolean(this.isEncrypted(), "Pieces are not compatible shares");
}

CryptoKeypair.prototype._setPublicAddress = function(address) {
	if (this._state.publicAddress === address) return;
	if (isDefined(this._state.publicAddress)) throw new Error("Cannot override known public address: " + this._state.publicAddress + " vs " + address);
	if (this.getEncryptionScheme() === null) throw new Error("Cannot set public address of unencrypted keypair");
	assertTrue(this._state.plugin.isAddress(address), "Invalid address: " + address);
	this._state.publicAddress = address;
}

// --------------------------------- STATIC -----------------------------------

/**
 * Decodes the given encrypted private key.
 * 
 * @param str is the encrypted private key to decode
 * @returns Object with hex, wif, and encryption fields or null if not recognized
 */
CryptoKeypair.decodeEncryptedKey = function(str) {
	assertString(str);
	
	var decoded = null;
	if ((decoded = decodeEncryptedHexV0(str)) !== null) return decoded;
	if ((decoded = decodeEncryptedWifV0(str)) !== null) return decoded;
	if ((decoded = decodeEncryptedHexV1(str)) !== null) return decoded;
	if ((decoded = decodeEncryptedWifV1(str)) !== null) return decoded;
	return null;
	
	function decodeEncryptedHexV0(str) {
		
		// determine if encrypted hex V0
		if (!isHex(str)) return null;
		if (str.length % 32 !== 0) return null;
		var b64 = CryptoJS.enc.Hex.parse(str).toString(CryptoJS.enc.Base64).toString(CryptoJS.enc.Utf8);
		if (!b64.startsWith("U2")) return null;

		// decode
		var decoded = {};
		decoded.privateHex = str;
		decoded.privateWif = b64;
		decoded.encryption = AppUtils.EncryptionScheme.V0_CRYPTOJS;
		return decoded;
	}
	
	function decodeEncryptedWifV0(str) {
		if (!str.startsWith("U2")) return null;
		if (!isBase64(str)) return null;
		var hex = CryptoJS.enc.Base64.parse(str).toString(CryptoJS.enc.Hex);
		return decodeEncryptedHexV0(hex);
	}
	
	function decodeEncryptedHexV1(str) {
		
		// determine if encrypted hex V1
		if (!isHex(str)) return null;
		if (str.length - 32 < 1 || str.length % 32 !== 0) return null;
		var version = parseInt(str.substring(0, AppUtils.ENCRYPTION_V2_VERSION.toString(16).length), 16);
		if (version !== AppUtils.ENCRYPTION_V2_VERSION) return null;
		
		// decode
		var decoded = {};
		decoded.privateHex = str;
		decoded.privateWif = Bitcoin.Base58.encode(Crypto.util.hexToBytes(str));
		decoded.encryption = AppUtils.EncryptionScheme.V1_CRYPTOJS;
		return decoded;
	}
	
	function decodeEncryptedWifV1(str) {
		if (!isBase58(str)) return null;
		var hex = Crypto.util.bytesToHex(Bitcoin.Base58.decode(str));
		return decodeEncryptedHexV1(hex);
	}
}

/**
 * Encodes the given share with the given minimum pieces threshold.
 * 
 * @param share is the share hex to encode
 * @param minShares is the minimum threshold to combine shares
 * @returns encoded hex share
 */
CryptoKeypair.encodeHexShare = function(share, minShares) {
	assertTrue(isHex(share));
	assertTrue(isNumber(minShares) && minShares <= AppUtils.MAX_SHARES);
	return encodeShareV0(share, minShares);
	
	function encodeShareV0(share) {
		return padLeft(share, 2);
	}
	
	function encodeShareV1(share, minShares) {
		try {
			return minShares + 'c' + AppUtils.toBase(16, 58, padLeft(share, 2));
		} catch (err) {
			return null;
		}
	}
	
	function encodeShareV2(share, minShares) {
		return padLeft(CryptoKeypair.SPLIT_V2_VERSION.toString(16), 2) + padLeft(minShares.toString(16), 2) + padLeft(share, 2);
	}
	
	// Pads a string `str` with zeros on the left so that its length is a multiple of `bits` (credit: bitaddress.org)
	function padLeft(str, bits){
		bits = bits || config.bits
		var missing = str.length % bits;
		return (missing ? new Array(bits - missing + 1).join('0') : '') + str;
	}
}

/**
 * Provides a decoding of the given share which is assumed to be a correctly encoded share.
 * 
 * @param share is the encoded wif or hex share to decode
 * @returns Object with privateHex, privateWif, shamirHex, and minShares initialized as known
 */
CryptoKeypair.decodeShare = function(share) {
	if (!isString(share)) return null;
	var decoded;
	if ((decoded = decodeShareHexV1(share))) return decoded;	// 2c prefix for 2 minimum shares + hex
	if ((decoded = decodeShareWifV1(share))) return decoded;
	if ((decoded = decodeShareHexV2(share))) return decoded;	// min shares encoded in hex and b58
	if ((decoded = decodeShareWifV2(share))) return decoded;
	if ((decoded = decodeShareHexV0(share))) return decoded;	// no min shares encoding
	if ((decoded = decodeShareWifV0(share))) return decoded;
	return null;
	
	function decodeShareHexV0(share) {
		if (!isHex(share)) return null;
		if (share.length % 2 !== 0) return null;
		assertTrue(share.length > 10);
		return {
			shamirHex: ninja.wallets.splitwallet.stripLeadZeros(share),
			privateHex: share,
			privateWif: AppUtils.toBase(16, 58, share)
		};
	}
	
	function decodeShareWifV0(share) {
		if (!isBase58(share)) return null;
		assertTrue(share.length > 10);
		if (share.length < 32) return null;
		var hex = AppUtils.toBase(58, 16, share);
		return {
			shamirHex: ninja.wallets.splitwallet.stripLeadZeros(hex),
			privateHex: hex,
			privateWif: share
		}
	}
	
	function decodeShareHexV1(share) {
		if (!isHex(share)) return null;
		if (share.length % 2 !== 0) return null;
		return decodeShareWifV1(AppUtils.toBase(16, 58, share));
	}
	
	function decodeShareWifV1(share) {
		try {
			if (share.length < 34) return null;
			var decoded = {};
			decoded.minShares = getMinPiecesV1(share);
			if (!decoded.minShares) return null;
			var wif = share.substring(share.indexOf('c') + 1);
			if (!isBase58(wif)) return null;
			decoded.shamirHex = ninja.wallets.splitwallet.stripLeadZeros(AppUtils.toBase(58, 16, wif));
			decoded.privateWif = share;
			decoded.privateHex = AppUtils.toBase(58, 16, decoded.privateWif);
			return decoded;
		} catch (err) {
			return null;
		}
		
		/**
		 * Determines the minimum pieces to reconstitute based on a possible split piece string.
		 * 
		 * Looks for 'XXXc' prefix in the given split piece where XXX is the minimum to reconstitute.
		 * 
		 * @param splitPiece is a string which may be prefixed with 'XXXc...'
		 * @return the minimum pieces to reconstitute if prefixed, null otherwise
		 */
		function getMinPiecesV1(splitPiece) {
			var idx = splitPiece.indexOf('c');	// look for first lowercase 'c'
			if (idx <= 0) return null;
			var minShares = Number(splitPiece.substring(0, idx));	// parse preceding numbers to int
			if (!isNumber(minShares) || minShares < 2 || minShares > AppUtils.MAX_SHARES) return null;
			return minShares;
		}
	}
	
	function decodeShareHexV2(share) {
		if (!isHex(share)) return null;
		if (share.length % 2 !== 0) return null;
		return decodeShareWifV2(AppUtils.toBase(16, 58, share));
	}
	
	function decodeShareWifV2(share) {
		if (share.length < 33) return null;
		if (!isBase58(share)) return null;
		var hex = AppUtils.toBase(58, 16, share);
		if (hex.length % 2 !== 0) return null;
		var version = parseInt(hex.substring(0, 2), 16);
		if (version !== CryptoKeypair.SPLIT_V2_VERSION) return null;
		var decoded = {};
		decoded.minShares = parseInt(hex.substring(2, 4), 16);
		if (!isNumber(decoded.minShares) || decoded.minShares < 2 || decoded.minShares > AppUtils.MAX_SHARES) return null;
		decoded.shamirHex = ninja.wallets.splitwallet.stripLeadZeros(hex.substring(4));
		decoded.privateWif = share;
		decoded.privateHex = AppUtils.toBase(58, 16, decoded.privateWif);
		return decoded;
	}
}

CryptoKeypair.getCreateWeight = function() {
	return 63;
}

CryptoKeypair.getEncryptWeight = function(schemes) {
	schemes = listify(schemes)
	var weight = 0;
	for (var i = 0; i < schemes.length; i++) weight += getSingleEncryptWeight(schemes[i]);
	return weight;
	function getSingleEncryptWeight(scheme) {
		switch (scheme) {
			case AppUtils.EncryptionScheme.BIP38:
				return 4187;
			case AppUtils.EncryptionScheme.V0_CRYPTOJS:
				return 10;
			case AppUtils.EncryptionScheme.V1_CRYPTOJS:
				return 540;
			default: throw new Error("Unrecognized encryption scheme: " + scheme);
		}
	}
}

CryptoKeypair.getDecryptWeight = function(schemes) {
	schemes = listify(schemes);
	var weight = 0;
	for (var i = 0; i < schemes.length; i++) weight += getSingleDecryptWeight(schemes[i]);
	return weight;
	function getSingleDecryptWeight(scheme) {
		switch (scheme) {
			case AppUtils.EncryptionScheme.BIP38:
				return 4581;
			case AppUtils.EncryptionScheme.V0_CRYPTOJS:
				return 100;
			case AppUtils.EncryptionScheme.V1_CRYPTOJS:
				return 540;
			default: throw new Error("Unrecognized encryption scheme: " + scheme);
		}
	}
}

// enumerates keypair fields and maps to human readable strings
CryptoKeypair.Field = {
		TICKER: "Ticker",
		PRIVATE_HEX: "Private Hex",
		PRIVATE_WIF: "Private WIF",
		PUBLIC_ADDRESS: "Public Address",
		ENCRYPTION: "Encryption",
		IS_SPLIT: "Is Split",
		MIN_SHARES: "Minimum Shares",
		SHARE_NUM: "Share Number"
}

// hardcoded fields to exclude from json and csv export
CryptoKeypair.EXCLUDE_FIELDS = [
	CryptoKeypair.Field.PRIVATE_HEX,
	CryptoKeypair.Field.MIN_SHARES,
	CryptoKeypair.Field.IS_SPLIT
];

// split v2 encoded version
CryptoKeypair.SPLIT_V2_VERSION = 1;