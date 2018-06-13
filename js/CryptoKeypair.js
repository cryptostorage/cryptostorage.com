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
 * One of keypair, plugin, json, or dividedKeypairs is required.
 * 
 * @param config is initialization configuration
 * 				config.keypair is a keypair to copy from
 * 				config.plugin is the crypto plugin or string ticker
 * 				config.json is exportable json to initialize from
 * 				config.dividedKeypairs are divided keypairs to combine and initialize from
 * 				config.privateKey is a private key (hex or wif, encrypted or unencrypted) (optional)
 * 				config.publicAddress is a public address to manually set if not unencrypted (optional)
 * 				config.partNum is the part number if otherwise undefined (optional)
 */
function CryptoKeypair(config) {
	
	this._state = {};
	this._isEncrypting = false;
	this._isDecrypting = false;
	this._isDestroyed = false;
		
	// direct copy internal state from keypair, no validation
	if (config.keypair) {
		assertUndefined(config.json);
		assertUndefined(config.dividedKeypairs);
		assertUndefined(config.privateKey);
		assertUndefined(config.publicAddress);
		assertUndefined(config.partNum);
		assertObject(config.keypair, CryptoKeypair);
		this._state = Object.assign({}, config.keypair._state);
		return;
	}
	
	// create from plugin
	if (config.plugin) {
		assertUndefined(config.keypair);
		assertUndefined(config.dividedKeypairs);
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
		assertUndefined(config.dividedKeypairs);
		this._fromJson(config.json);
	}
	
	// create from dividedKeypairs
	else if (config.dividedKeypairs) {
		assertUndefined(config.keypair);
		assertUndefined(config.plugin);
		assertUndefined(config.json);
		this._combine(config.dividedKeypairs);
	}
	
	// set part num
	if (isDefined(config.partNum)) this.setPartNum(config.partNum);
	
	// verify state
	this._validateState();
}

CryptoKeypair.prototype.getPlugin = function() {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	return this._state.plugin;
}

CryptoKeypair.prototype.isPublicApplicable = function() {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	return this._state.plugin.isPublicApplicable();
}

CryptoKeypair.prototype.hasPublicAddress = function() {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	return isInitialized(this._state.publicAddress);
}

CryptoKeypair.prototype.getPublicAddress = function() {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	return this._state.publicAddress;
}

CryptoKeypair.prototype.removePublicAddress = function() {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	assertTrue(this.hasPrivateKey());
	if (this.isPublicApplicable()) delete this._state.publicAddress;
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
	delete this._state.isDivided;
	delete this._state.minParts;
	delete this._state.partNum;
	return this;
}

CryptoKeypair.prototype.encrypt = function(scheme, passphrase, onProgress, onDone) {
	
	// validate input
	assertFalse(this.isDestroyed(), "Keypair is destroyed");
	assertFalse(this._isEncrypting, "Keypair is in the process of encrypting");
  assertFalse(this._isDecrypting, "Keypair is in the process of decrypting");
	assertNull(this.getEncryptionScheme(), "Keypair must be unencrypted to encrypt");
	assertInitialized(scheme, "Scheme is not initialized");
	assertInitialized(passphrase, "Passphrase is not initialized");
	assertInitialized(onDone, "onDone is not initialized");
	
	// get encryption function
	var encryptFunc;
	switch (scheme) {
		case AppUtils.EncryptionScheme.V0_CRYPTOJS:
			encryptFunc = this._encryptCryptoJsV0.bind(this);
			break;
		case AppUtils.EncryptionScheme.V1_CRYPTOJS:
			encryptFunc = this._encryptCryptoJsV1.bind(this);
			break;
		case AppUtils.EncryptionScheme.BIP38:
			encryptFunc = this._encryptBip38.bind(this);
			break;
		default: throw new Error("Unsupported encryption scheme: " + scheme);
	}
	
	// encrypt
	var that = this;
	that._isEncrypting = true;
	encryptFunc(passphrase, function(percent, label) {
		if (that._isDestroyed) return;
		if (onProgress) onProgress(percent, label);
	}, function(err, encryptedKey) {
	  that._isEncrypting = false;
		if (that._isDestroyed) return;
		if (err) onDone(err);
		else {
			var address = that.getPublicAddress();
			that._setPrivateKey(encryptedKey);
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
	
	// validate input
	assertFalse(this.isDestroyed(), "Keypair is destroyed");
	assertFalse(this._isEncrypting, "Keypair is in the process of encrypting");
  assertFalse(this._isDecrypting, "Keypair is in the process of decrypting");
	assertInitialized(this.getEncryptionScheme(), "Keypair must be encrypted to decrypt");
	assertInitialized(passphrase, "Passphrase is not initialized");
	assertInitialized(onDone, "onDone is not initialized");
	
	// get decryption function
	var decryptFunc;
	switch (this.getEncryptionScheme()) {
		case AppUtils.EncryptionScheme.V0_CRYPTOJS:
			decryptFunc = this._decryptCryptoJsV0.bind(this);
			break;
		case AppUtils.EncryptionScheme.V1_CRYPTOJS:
			decryptFunc = this._decryptCryptoJsV1.bind(this);
			break;
		case AppUtils.EncryptionScheme.BIP38:
			decryptFunc = this._decryptBip38.bind(this);
			break;
		default: throw new Error("Unsupported encryption scheme: " + scheme);
	}
	
	// decrypt
	var that = this;
	that._isDecrypting = true;
	decryptFunc(passphrase, function(percent, label) {
		if (that._isDestroyed) return;
		if (onProgress) onProgress(percent, label);
	}, function(err, decryptedKey) {
	  that._isDecrypting = false;
		if (that._isDestroyed) return;
		if (err) onDone(err);
		else {
			try {
				that._setPrivateKey(decryptedKey);
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

CryptoKeypair.prototype.divide = function(numParts, minParts) {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	
	// validate input
	assertFalse(this.isDivided());
	assertTrue(numParts >= 2);
	assertTrue(numParts <= AppUtils.MAX_PARTS, "Cannot divide into more than " + AppUtils.MAX_PARTS + " parts");
	assertTrue(minParts >= 2);
	assertTrue(minParts <= numParts);
	
	// divide private hex into parts
	var parts = secrets.share(this.getPrivateHex(), numParts, minParts);
	
	// encode parts with minimum threshold
	for (var i = 0; i < parts.length; i++) {
		parts[i] = CryptoKeypair.encodeHexPart(parts[i], minParts);
	}

	// create keypairs
	var dividedKeypairs = [];
	for (var i = 0; i < parts.length; i++) {
		var keypair = new CryptoKeypair({
			plugin: this._state.plugin,
			privateKey: parts[i],
			publicAddress: this.getPublicAddress(),
			partNum: i + 1
		});
		if (!this.hasPublicAddress()) keypair.removePublicAddress();
		dividedKeypairs.push(keypair);
	}
	return dividedKeypairs;
}

CryptoKeypair.prototype.isDivided = function() {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	return this._state.isDivided;
}

CryptoKeypair.prototype.getMinParts = function() {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	return this._state.minParts;
}

CryptoKeypair.prototype.getPartNum = function() {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	return this._state.partNum;
}

CryptoKeypair.prototype.setPartNum = function(partNum) {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	if (this.isDivided()) {
		assertNumber(partNum);
		assertTrue(partNum >= 1);
		assertTrue(partNum <= AppUtils.MAX_PARTS);
		assertTrue(isUndefined(this._state.partNum) || this._state.partNum === partNum, "Cannot override previously assigned part num");
		this._state.partNum = partNum;
	} else if (this.isDivided() === false) {
		assertNull(partNum);
		assertNull(this._state.partNum);
	} else if (this.isDivided() === undefined) {
		assertUndefined(partNum);
		assertUndefined(this._state.partNum);
	}
	return this;
}

CryptoKeypair.prototype.toJson = function() {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	function isExcluded(field) { return arrayContains(CryptoKeypair.getExcludedFields(), field); }
	var json = {};
	if (!isExcluded(CryptoKeypair.Field.TICKER)) json.ticker = this.getPlugin().getTicker();
	if (!isExcluded(CryptoKeypair.Field.PUBLIC_ADDRESS) && this.isPublicApplicable()) json.publicAddress = this.getPublicAddress();
	if (!isExcluded(CryptoKeypair.Field.PRIVATE_WIF)) json.privateWif = this.getPrivateWif();
	if (!isExcluded(CryptoKeypair.Field.PRIVATE_HEX)) json.privateHex = this.getPrivateHex();
	if (!isExcluded(CryptoKeypair.Field.PRIVATE_STATE) && this.hasPrivateKey()) json.privateState = this.getExportValue(CryptoKeypair.Field.PRIVATE_STATE);
	if (!isExcluded(CryptoKeypair.Field.ENCRYPTION) && this.isEncrypted()) json.encryption = this.getEncryptionScheme();
	if (!isExcluded(CryptoKeypair.Field.IS_DIVIDED)) json.isDivided = this.isDivided();
	if (!isExcluded(CryptoKeypair.Field.MIN_PARTS) && this.isDivided()) json.minParts = this.getMinParts();
	if (!isExcluded(CryptoKeypair.Field.PART_NUM) && this.isDivided()) json.partNum = this.getPartNum();
	return json;
}

CryptoKeypair.prototype.toCompactTxt = function(index) {
  assertFalse(this._isDestroyed, "Keypair is destroyed");
  var txt = "";
  if (isDefined(index)) txt += "#" + (this.getPartNum() ? this.getPartNum() + "." : "") + (index + 1) + ", ";
  txt += this.getPlugin().getTicker();
  if (isInitialized(this.getPublicAddress())) {
    txt += ", public: " + this.getPublicAddress();
  }
  if (isInitialized(this.getPrivateWif())) {
    txt += ", private: " + this.getPrivateWif() + (this.getPartNum() ? ", divided" : (this.isEncrypted() ? ", encrypted" : ""));
  }
  return txt;
}

CryptoKeypair.prototype.getExportValue = function(field) {
	assertFalse(this._isDestroyed, "Keypair is destroyed");
	switch(field) {
		case CryptoKeypair.Field.TICKER:
			return this.getPlugin().getTicker();
		case CryptoKeypair.Field.PRIVATE_WIF:
			return this.getPrivateWif();
		case CryptoKeypair.Field.PRIVATE_HEX:
			return this.getPrivateHex();
		case CryptoKeypair.Field.PUBLIC_ADDRESS:
		  return this.isPublicApplicable() ? this.getPublicAddress() : AppUtils.NA;
		case CryptoKeypair.Field.ENCRYPTION:
			return this.getEncryptionScheme();
		case CryptoKeypair.Field.IS_DIVIDED:
			return this.isDivided();
		case CryptoKeypair.Field.MIN_PARTS:
			return this.getMinParts();
		case CryptoKeypair.Field.PART_NUM:
			return this.getPartNum();
		case CryptoKeypair.Field.PRIVATE_STATE:
		  if (this.isDivided()) return "Divided";
		  if (this.isEncrypted()) return "Encrypted";
		  if (this.isEncrypted() === false) return "Unencrypted";
		  return "Unknown";
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
	if (this._state.isDivided !== keypair._state.isDivided) return false;
	if (this._state.minParts !== keypair._state.minParts) return false;
	if (this._state.partNum !== keypair._state.partNum) return false;
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
	if (this._state.isDivided === true) {
		assertInitialized(this._state.privateHex);
		assertInitialized(this._state.privateWif);
	} else if (this._state.isDivided === false) {
		assertInitialized(this._state.privateHex);
		assertInitialized(this._state.privateWif);
		assertNull(this._state.minParts);
		assertNull(this._state.partNum);
	} else if (this._state.isDivided ===  undefined) {
		assertUndefined(this._state.privateHex);
		assertUndefined(this._state.privateWif);
		assertUndefined(this._state.minParts);
		assertUndefined(this._state.partNum);
	}
	
	if (this._state.minParts) {
		assertTrue(this._state.isDivided);
		assertNumber(this._state.minParts);
		assertTrue(this._state.minParts >= 2 && this._state.minParts <= AppUtils.MAX_PARTS);
	}
	
	if (this._state.partNum) {
		assertTrue(this._state.isDivided);
		assertNumber(this._state.partNum);
		assertTrue(this._state.partNum >= 1 && this._state.partNum <= AppUtils.MAX_PARTS);
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
	if (this.getPlugin().isPublicApplicable()) {
		if (isUndefined(this._state.publicAddress)) assertTrue(this.hasPrivateKey());
		if (!this.hasPrivateKey()) assertInitialized(this._state.publicAddress);
	} else {
	  assertEquals(null, this._state.publicAddress);
	}
			
	// private key known
	if (this.hasPrivateKey()) {
		
		// divided state is known or not applicable
		assertDefined(this._state.isDivided);
		
		// if not divided then encryption is known
		if (this._state.isDivided === false) assertDefined(this._state.encryption);
		
		// unencrypted
		if (this._state.encryption === null) {
			this._state.plugin.isPublicApplicable() ? assertInitialized(this._state.publicAddress) : assertNull(this._state.publicAddress);
			assertFalse(this._state.isDivided);
			assertNull(this._state.minParts);
			assertNull(this._state.partNum);
		}
		
		// divide
		if (this._state.encryption === undefined || this._state.isDivided) {
			assertUndefined(this._state.encryption);
			assertNotNull(this._state.minParts);	// either undefined or part number
		}
		
		// encrypted
		if (isInitialized(this._state.encryption)) {
			assertFalse(this._state.isDivided);
			assertNull(this._state.minParts);
			assertNull(this._state.partNum);
		}
	}
	
	// private key unknown
	if (!this.hasPrivateKey()) {
		assertUndefined(this._state.privateHex);
		assertUndefined(this._state.privateWif);
		assertUndefined(this._state.isDivided);
		assertUndefined(this._state.minParts);
		assertUndefined(this._state.partNum);
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
		this._state.privateHex = decoded.privateHex.toUpperCase();
		this._state.privateWif = decoded.privateWif;
		this._state.publicAddress = decoded.publicAddress;
		this._state.encryption = decoded.encryption;
		this._state.isDivided = false;
		this._state.minParts = null;
		this._state.partNum = null;
		return;
	}
	
	// encrypted with cryptostorage conventions
	decoded = CryptoKeypair.decodeEncryptedKey(privateKey);
	if (decoded) {
		this._state.privateHex = decoded.privateHex.toUpperCase();
		this._state.privateWif = decoded.privateWif;
		this._state.publicAddress = this._state.plugin.isPublicApplicable() ? undefined : null;
		this._state.encryption = decoded.encryption;
		this._state.isDivided = false;
		this._state.minParts = null;
		this._state.partNum = null;
		return;
	}
	
	// part
	decoded = this._decodePart(privateKey);
	if (decoded) {
		this._state.privateHex = decoded.privateHex.toUpperCase();
		this._state.privateWif = decoded.privateWif;
		this._state.publicAddress = this._state.plugin.isPublicApplicable() ? undefined : null;
		this._state.encryption = undefined;
		this._state.isDivided = true;
		this._state.minParts = decoded.minParts;
		this._state.partNum = undefined;
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
	this._state.isDivided = json.isDivided;
	this._state.minParts = json.minParts;
	if (isDefined(this._state.privateWif)) this._setPrivateKey(this._state.privateWif);
	else if (isDefined(this._state.privateHex)) this._setPrivateKey(this._state.privateHex);
	if (!this.isPublicApplicable()) this._setPublicAddress(null);
	else if (isDefined(json.publicAddress)) this._setPublicAddress(json.publicAddress);
	if (json.encryption === null) assertUninitialized(json.partNum);
	if (isDefined(json.partNum)) this.setPartNum(json.partNum);
}

CryptoKeypair.prototype._combine = function(dividedKeypairs) {
	
	// verify keypairs and assign plugin
	var publicAddress;
	for (var i = 0; i < dividedKeypairs.length; i++) {
		if (!this._state.plugin) this._state.plugin = dividedKeypairs[i].getPlugin();
		else if (this._state.plugin !== dividedKeypairs[i].getPlugin()) throw new Error("dividedKeypairs[" + i + "] has inconsistent plugin");
		if (!publicAddress) publicAddress = dividedKeypairs[i].getPublicAddress();
		else if (isDefined(publicAddress) && isDefined(dividedKeypairs[i].getPublicAddress()) && publicAddress !== dividedKeypairs[i].getPublicAddress()) throw new Error("dividedKeypairs[" + i + "] has inconsistent public address");
	}
	
	// collect decoded hex parts and verify consistent min parts
	var minParts;
	var shamirHexes = [];
	for (var i = 0; i < dividedKeypairs.length; i++) {
		var decodedPart = this._decodePart(dividedKeypairs[i].getPrivateWif());
		assertInitialized(decodedPart, "Could not decode part: " + dividedKeypairs[i].getPrivateWif());
		if (!minParts) minParts = decodedPart.minParts;
		else if (minParts !== decodedPart.minParts) throw new Error("dividedKeypairs[" + i + "] has inconsistent min parts");
		shamirHexes.push(decodedPart.shamirHex);
	}
	
	// verify no duplicates
	for (var i = 0; i < shamirHexes.length - 1; i++) {
		for (var j = i + 1; j < shamirHexes.length; j++) {
			assertFalse(shamirHexes[i] === shamirHexes[j], "Cannot create keypair from duplicate parts");
		}
	}
	
	// ensure sufficient parts provided
	if (isNumber(minParts) && dividedKeypairs.length < minParts) {
		var additional = minParts - dividedKeypairs.length;
		throw new Error("Need " + additional + " additional " + (additional === 1 ? "part" : "parts") + " to recover private key");
	} else if (dividedKeypairs.length < 2) {
		throw new Error("Need additional parts to recover private key");
	}
	
	// try to combine parts to create private key and public address, which might be invalid or incompatible
	try {
		var privateHex = secrets.combine(shamirHexes);
		this._setPrivateKey(privateHex);
		if (isDefined(publicAddress)) this._setPublicAddress(publicAddress);
	} catch (err) {
		throw new Error("Need additional parts to recover private key");
	}
	
	// parts must combine to create an undivided piece with known encryption
  assertFalse(this.isDivided(), "Parts are not compatible");
  assertBoolean(this.isEncrypted(), "Parts are not compatible");
}

CryptoKeypair.prototype._setPublicAddress = function(address) {
	if (this._state.publicAddress === address) return;
	if (isDefined(this._state.publicAddress)) throw new Error("Cannot override known public address: " + this._state.publicAddress + " vs " + address);
	if (this.getEncryptionScheme() === null) throw new Error("Cannot set public address of unencrypted keypair");
	assertTrue(this._state.plugin.isAddress(address), "Invalid address: " + address);
	this._state.publicAddress = address;
}

CryptoKeypair.prototype._encryptCryptoJsV0 = function(passphrase, onProgress, onDone) {
	var hex = this.getPrivateHex();
	try {
		var encryptedB64 = CryptoJS.AES.encrypt(hex, passphrase).toString();
	} catch (err) {
		onDone(err);
		return;
	}
	if (onProgress) onProgress(1);
	onDone(null, AppUtils.toBase(64, 16, encryptedB64));
}

CryptoKeypair.prototype._decryptCryptoJsV0 = function(passphrase, onProgress, onDone) {
	var hex = this.getPrivateHex();
	var decryptedHex;
	try {
		decryptedHex = CryptoJS.AES.decrypt(AppUtils.toBase(16, 64, hex), passphrase).toString(CryptoJS.enc.Utf8);
	} catch (err) { }
	if (!decryptedHex) onDone(new Error("Incorrect passphrase"));
	else {
		if (onProgress) onProgress(1);
		onDone(null, decryptedHex);
	}
}

CryptoKeypair.prototype._encryptCryptoJsV1 = function(passphrase, onProgress, onDone) {
	var hex = this.getPrivateHex();
	try {
		
		// create random salt and replace first two characters with version
		var salt = CryptoJS.lib.WordArray.random(AppUtils.ENCRYPTION_V2_BLOCK_SIZE);
		var hexVersion = AppUtils.ENCRYPTION_V2_VERSION.toString(16);
		salt = hexVersion + salt.toString().substring(hexVersion.length);
		salt = CryptoJS.enc.Hex.parse(salt);
		
		// strengthen passphrase with passphrase key
		var passphraseKey = CryptoJS.PBKDF2(passphrase, salt, {
      keySize: AppUtils.ENCRYPTION_V2_KEY_SIZE / 32,
      iterations: AppUtils.ENCRYPTION_V2_PBKDF_ITER,
      hasher: CryptoJS.algo.SHA512
    });
		
		// encrypt
		var iv = salt;
		var encrypted = CryptoJS.AES.encrypt(hex, passphraseKey, { 
	    iv: iv, 
	    padding: CryptoJS.pad.Pkcs7,
	    mode: CryptoJS.mode.CBC
	  });
		
		// encrypted hex = salt + hex cipher text
		var ctHex = AppUtils.toBase(64, 16, encrypted.toString());
		var encryptedHex = salt.toString() + ctHex;
	} catch (err) {
		onDone(err);
		return;
	}
	if (onProgress) onProgress(1);
	if (onDone) onDone(null, encryptedHex);
}

CryptoKeypair.prototype._decryptCryptoJsV1 = function(passphrase, onProgress, onDone) {
	var hex = this.getPrivateHex();
	
	// assert correct version
	assertEquals(AppUtils.ENCRYPTION_V2_VERSION, parseInt(hex.substring(0, AppUtils.ENCRYPTION_V2_VERSION.toString(16).length), 16));
		
	// get passphrase key
	var salt = CryptoJS.enc.Hex.parse(hex.substr(0, 32));
  var passphraseKey = CryptoJS.PBKDF2(passphrase, salt, {
  	keySize: AppUtils.ENCRYPTION_V2_KEY_SIZE / 32,
  	iterations: AppUtils.ENCRYPTION_V2_PBKDF_ITER,
  	hasher: CryptoJS.algo.SHA512
  });
  
  // decrypt
  var iv = salt;
  var ctHex = hex.substring(32);
  var ctB64 = CryptoJS.enc.Hex.parse(ctHex).toString(CryptoJS.enc.Base64);
  var decryptedHex;
  try {
  	var decrypted = CryptoJS.AES.decrypt(ctB64, passphraseKey, {
	  	iv: iv, 
	    padding: CryptoJS.pad.Pkcs7,
	    mode: CryptoJS.mode.CBC
	  });
  	decryptedHex = decrypted.toString(CryptoJS.enc.Utf8);
  	assertInitialized(decryptedHex);
  } catch (err) {
  	onDone(new Error("Incorrect passphrase"));
  	return;
  }
  if (onProgress) onProgress(1)
	onDone(null, decryptedHex);
}

CryptoKeypair.prototype._encryptBip38 = function(passphrase, onProgress, onDone) {
  var that = this;
	try {
		var decoded = bitcoinjs.wif.decode(this.getPrivateWif());
		bitcoinjs.bip38.encryptAsync(decoded.privateKey, decoded.compressed, passphrase, function(progress) {
		  if (that.isDestroyed()) return;
			if (onProgress) onProgress(progress.percent / 100);
		}, null, function(err, encryptedWif) {
		  if (that.isDestroyed()) return;
			if (err) onDone(err);
			else onDone(null, encryptedWif);
		});
	} catch (err) {
		onDone(err);
	}
}

CryptoKeypair.prototype._decryptBip38 = function(passphrase, onProgress, onDone) {
	var that = this;
	bitcoinjs.bip38.decryptAsync(this.getPrivateWif(), passphrase, function(progress) {
	  if (that.isDestroyed()) return;
		if (onProgress) onProgress(progress.percent / 100);
	}, null, function(err, decryptedKey) {
	  if (that.isDestroyed()) return;
		if (err) onDone(new Error("Incorrect passphrase"));
		else {
			var decryptedWif = bitcoinjs.wif.encode(that._state.plugin.getNetwork().wif, decryptedKey.privateKey, decryptedKey.compressed);
			if (onProgress) onProgress(1);
			onDone(null, decryptedWif);
		}
	});
}

/**
 * Provides a decoding of the given part which is assumed to be a correctly encoded part.
 * 
 * @param part is the encoded wif or hex part to decode
 * @returns Object with privateHex, privateWif, shamirHex, and minParts initialized as known
 */
CryptoKeypair.prototype._decodePart = function(part) {  
  if (!isString(part)) return null;
  var that = this;
  var decoded;
  if ((decoded = decodePartHexV1(part))) return decoded;  // 2c prefix for 2 minimum parts + hex
  if ((decoded = decodePartWifV1(part))) return decoded;
  if ((decoded = decodePartHexV2(part))) return decoded;  // min parts encoded in hex and b58
  if ((decoded = decodePartWifV2(part))) return decoded;
  if ((decoded = decodePartHexV0(part))) return decoded;  // no min parts encoding
  if ((decoded = decodePartWifV0(part))) return decoded;
  return null;
  
  function decodePartHexV0(part) {
    if (!isHex(part)) return null;
    if (part.length % 2 !== 0) return null;
    return decodePartWifV0(AppUtils.toBase(16, 58, part));
  }
  
  function decodePartWifV0(part) {
    if (!isBase58(part)) return null;
    var hex = AppUtils.toBase(58, 16, part);
    if (hex.length % 2 !== 0) return null;
    if (that._state.plugin.getTicker() === "XRP" && hex.substring(0, 2) !== "07") return null; // XRP address format is distinguished by hex (avoids potential false positive)
    var shamirHex = ninja.wallets.splitwallet.stripLeadZeros(hex);
    if (!isValidShamirHex(that._state.plugin, shamirHex)) return null;
    return {
      shamirHex: shamirHex,
      privateHex: hex,
      privateWif: part
    }
  }
  
  function decodePartHexV1(part) {
    if (!isHex(part)) return null;
    if (part.length % 2 !== 0) return null;
    return decodePartWifV1(AppUtils.toBase(16, 58, part));
  }
  
  function decodePartWifV1(part) {
    try {
      var decoded = {};
      decoded.minParts = getMinPartsV1(part);
      if (!decoded.minParts) return null;
      var wif = part.substring(part.indexOf('c') + 1);
      if (!isBase58(wif)) return null;
      var hex = AppUtils.toBase(58, 16, wif);
      if (hex.length % 2 !== 0) return null;
      decoded.shamirHex = ninja.wallets.splitwallet.stripLeadZeros(hex);
      if (!isValidShamirHex(that._state.plugin, decoded.shamirHex)) return null;
      decoded.privateWif = part;
      decoded.privateHex = hex;
      return decoded;
    } catch (err) {
      return null;
    }
    
    /**
     * Determines the minimum parts to reconstitute based on a possible divided part string.
     * 
     * Looks for 'XXXc' prefix in the given divided piece where XXX is the minimum to reconstitute.
     * 
     * @param dividedPiece is a string which may be prefixed with 'XXXc...'
     * @return the minimum parts to reconstitute if prefixed, null otherwise
     */
    function getMinPartsV1(dividedPiece) {
      var idx = dividedPiece.indexOf('c');  // look for first lowercase 'c'
      if (idx <= 0) return null;
      var minParts = Number(dividedPiece.substring(0, idx));  // parse preceding numbers to int
      if (!isNumber(minParts) || minParts < 2 || minParts > AppUtils.MAX_PARTS) return null;
      return minParts;
    }
  }
  
  function decodePartHexV2(part) {
    if (!isHex(part)) return null;
    if (part.length % 2 !== 0) return null;
    return decodePartWifV2(AppUtils.toBase(16, 58, part));
  }
  
  function decodePartWifV2(part) {
    if (part.length < 33) return null;
    if (!isBase58(part)) return null;
    var hex = AppUtils.toBase(58, 16, part);
    if (hex.length % 2 !== 0) return null;
    if (that._state.plugin.getTicker() === "WAVES" && hex.substring(0, 3) !== "010") return null; // Waves address format is distinguished by hex (avoids potential false positive)
    var version = parseInt(hex.substring(0, 2), 16);
    if (version !== CryptoKeypair.DIVIDE_V2_VERSION) return null;
    var decoded = {};
    decoded.minParts = parseInt(hex.substring(2, 4), 16);
    if (!isNumber(decoded.minParts) || decoded.minParts < 2 || decoded.minParts > AppUtils.MAX_PARTS) return null;
    decoded.shamirHex = ninja.wallets.splitwallet.stripLeadZeros(hex.substring(4));
    if (!isValidShamirHex(that._state.plugin, decoded.shamirHex)) return null;
    decoded.privateWif = part;
    decoded.privateHex = AppUtils.toBase(58, 16, decoded.privateWif);
    return decoded;
  }
  
  /**
   * Indicates if the given hex is a valid shamir part by length and beginning prefix.
	 *
   * Used to rule out false positives such as if a user tries to import a public address.
   * 
   * @param plugin specifies the min and max unencrypted hex length
   * @param hex is the hex to test
   * @returns true if the hex is a valid shamir part, false otherwise
   */
  function isValidShamirHex(plugin, hex) {
    assertString(hex);
    
    // hex parts start with '7'
    if (hex[0] !== '7') return false;
    
    // values to compute length ranges
    var MIN_DIVIDE = 4; // dividing adds 4 characters minimum
    var MAX_DIVIDE = 6; // dividing adds 6 characters maximum
    var min = plugin.getMinHexLength();
    var max = plugin.getMaxHexLength();
    var len = hex.length;
    
    // unencrypted only adds divide length
    if (len >= min + MIN_DIVIDE && len <= max + MAX_DIVIDE) return true;
    
    // cryptojs adds between min * 3 - 32 and max * 3 + 2 hex characters
    if (len >= min * 3 - 32 + MIN_DIVIDE && len <= max * 3 + 2 + MAX_DIVIDE) return true;
    
    // BIP38 adds 20-22 hex characters
    if (len >= min + 20 + MIN_DIVIDE && len <= max + 22 + MAX_DIVIDE) return true;

    // otherwise not a valid part
    return false;
  }
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
 * Encodes the given part with the given minimum threshold.
 * 
 * @param part is the part hex to encode
 * @param minParts is the minimum threshold to combine parts
 * @returns encoded hex part
 */
CryptoKeypair.encodeHexPart = function(part, minParts) {
	assertTrue(isHex(part));
	assertTrue(isNumber(minParts) && minParts <= AppUtils.MAX_PARTS);
	return encodePartV2(part, minParts);
	
	function encodePartV0(part) {
		return padLeft(part, 2);
	}
	
	function encodePartV1(part, minParts) {
		try {
			return minParts + 'c' + AppUtils.toBase(16, 58, padLeft(part, 2));
		} catch (err) {
			return null;
		}
	}
	
	function encodePartV2(part, minParts) {
		return padLeft(CryptoKeypair.DIVIDE_V2_VERSION.toString(16), 2) + padLeft(minParts.toString(16), 2) + padLeft(part, 2);
	}
	
	// Pads a string `str` with zeros on the left so that its length is a multiple of `bits` (credit: bitaddress.org)
	function padLeft(str, bits){
		bits = bits || config.bits
		var missing = str.length % bits;
		return (missing ? new Array(bits - missing + 1).join('0') : '') + str;
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
    PUBLIC_ADDRESS: "Public Address",
		PRIVATE_HEX: "Private Hex",
		PRIVATE_WIF: "Private WIF",
    PRIVATE_STATE: "Private State",
		ENCRYPTION: "Encryption",
		IS_DIVIDED: "Is Divided",
		MIN_PARTS: "Minimum Parts",
    PART_NUM: "Part Number"
}

// fields to exclude from json and csv export
CryptoKeypair.getExcludedFields = function() {
  var excluded = [
    CryptoKeypair.Field.MIN_PARTS,
    CryptoKeypair.Field.IS_DIVIDED,
  ];
  if (!AppUtils.DEV_MODE) excluded.push(CryptoKeypair.Field.PRIVATE_HEX);
  return excluded
}

// divided v2 encoded version
CryptoKeypair.DIVIDE_V2_VERSION = 1;