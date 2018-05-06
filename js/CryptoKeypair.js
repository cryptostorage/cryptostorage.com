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
 * 				config.plugin is the crypto plugin
 * 				config.json is exportable json to initialize from
 * 				config.splitKeypairs are split keypairs to combine and initialize from
 * 				config.privateKey is a private key (hex or wif, encrypted or unencrypted) (optional)
 * 				config.publicAddress is a public address to manually set if not unencrypted (optional)
 * 				config.shareNum is the share number if otherwise undefined (optional)
 */
function CryptoKeypair(config) {
	
	var that = this;
	var state;
	var _isDestroyed;
	
	this.getPlugin = function() {
		assertFalse(_isDestroyed, "Keypair is destroyed");
		return state.plugin;
	}
	
	this.isPublicApplicable = function() {
		assertFalse(_isDestroyed, "Keypair is destroyed");
		return state.plugin.hasPublicAddress();
	}
	
	this.getPublicAddress = function() {
		assertFalse(_isDestroyed, "Keypair is destroyed");
		return state.publicAddress;
	}
	
	this.hasPublicAddress = function() {
		assertFalse(_isDestroyed, "Keypair is destroyed");
		return isDefined(state.publicAddress);
	}
	
	this.getPrivateLabel = function() {
		assertFalse(_isDestroyed, "Keypair is destroyed");
		return state.plugin.getPrivateLabel();
	}
	
	this.getPrivateHex = function() {
		assertFalse(_isDestroyed, "Keypair is destroyed");
		return state.privateHex;
	}
	
	this.getPrivateWif = function() {
		assertFalse(_isDestroyed, "Keypair is destroyed");
		return state.privateWif;
	}
	
	this.hasPrivateKey = function() {
		assertFalse(_isDestroyed, "Keypair is destroyed");
		return isDefined(that.getPrivateHex());
	}
	
	this.encrypt = function(scheme, passphrase, onProgress, onDone) {
		assertFalse(_isDestroyed, "Keypair is destroyed");
		assertNull(state.encryption, "Keypair must be unencrypted to encrypt");
		var address = that.getPublicAddress();
		AppUtils.encryptHex(that.getPrivateHex(), scheme, passphrase, function(percent, label) {
			if (_isDestroyed) return;
			if (onProgress) onProgress(percent, label);
		}, function(err, encryptedHex) {
			if (_isDestroyed) return;
			if (err) onDone(err);
			else {
				setPrivateKey(encryptedHex);
				setPublicAddress(address);
				validateState();
				onDone(null, that);
			}
		});
	}
	
	/**
	 * Returns null if unencrypted, undefined if unknown, or one of AppUtils.EncryptionScheme otherwise.
	 */
	this.getEncryptionScheme = function() {
		assertFalse(_isDestroyed, "Keypair is destroyed");
		return state.encryption;
	}
	
	this.isEncrypted = function() {
		assertFalse(_isDestroyed, "Keypair is destroyed");
		if (isUndefined(that.getEncryptionScheme())) return undefined;
		return that.getEncryptionScheme() !== null;
	}
	
	this.decrypt = function(passphrase, onProgress, onDone) {
		assertFalse(_isDestroyed, "Keypair is destroyed");
		assertInitialized(state.encryption, "Keypair must be encrypted to decrypt");
		AppUtils.decryptHex(that.getPrivateHex(), that.getEncryptionScheme(), passphrase, function(percent, label) {
			if (_isDestroyed) return;
			if (onProgress) onProgress(percent, label);
		}, function(err, decryptedHex) {
			if (_isDestroyed) return;
			if (err) onDone(err);
			else {
				try {
					setPrivateKey(decryptedHex);
				} catch (err) {
					console.log("Error setting private key after decryption!!!");
					console.log(that.toJson());
					console.log(err);
					throw new Error(err);
				}
				validateState();
				onDone(null, that);
			}
		});
	}
	
	this.split = function(numShares, minShares) {
		assertFalse(_isDestroyed, "Keypair is destroyed");
		
		// validate input
		assertFalse(that.isSplit());
		assertTrue(numShares >= 2);
		assertTrue(numShares <= AppUtils.MAX_SHARES, "Cannot split into more than " + AppUtils.MAX_SHARES + " shares");
		assertTrue(minShares >= 2);
		assertTrue(minShares <= numShares);
		
		// split private hex into shares
		var shares = secrets.share(that.getPrivateHex(), numShares, minShares);
		
		// encode shares with minimum threshold
		for (var i = 0; i < shares.length; i++) {
			shares[i] = encodeHexShare(shares[i], minShares);
		}
		
		// create keypairs
		var splitKeypairs = [];
		for (var i = 0; i < shares.length; i++) {
			var keypair = new CryptoKeypair({
				plugin: state.plugin,
				privateKey: shares[i],
				publicAddress: that.getPublicAddress(),
				shareNum: i + 1
			});
			if (!that.hasPublicAddress()) keypair.removePublicAddress();
			splitKeypairs.push(keypair);
		}
		return splitKeypairs;
	}
	
	this.isSplit = function() {
		assertFalse(_isDestroyed, "Keypair is destroyed");
		return state.isSplit;
	}
	
	this.getMinShares = function() {
		assertFalse(_isDestroyed, "Keypair is destroyed");
		return state.minShares;
	}
	
	this.getShareNum = function() {
		assertFalse(_isDestroyed, "Keypair is destroyed");
		return state.shareNum;
	}
	
	this.setShareNum = function(shareNum) {
		assertFalse(_isDestroyed, "Keypair is destroyed");
		if (that.isSplit()) {
			assertNumber(shareNum);
			assertTrue(shareNum >= 1);
			assertTrue(shareNum <= AppUtils.MAX_SHARES);
			assertTrue(isUndefined(state.shareNum) || state.shareNum === shareNum, "Cannot override previously assigned share num");
			state.shareNum = shareNum;
		} else if (that.isSplit() === false) {
			assertNull(shareNum);
			assertNull(state.shareNum);
		} else if (that.isSplit() === undefined) {
			assertUndefined(shareNum);
			assertUndefined(state.shareNum);
		}
		return this;
	}
	
	this.removePublicAddress = function() {
		assertFalse(_isDestroyed, "Keypair is destroyed");
		assertTrue(that.hasPrivateKey());
		state.publicAddress = undefined;
		return this;
	}
	
	this.removePrivateKey = function() {
		assertFalse(_isDestroyed, "Keypair is destroyed");
		assertDefined(that.getPublicAddress());
		state.privateHex = undefined;
		state.privateWif = undefined;
		state.encryption = undefined;
		state.isSplit = undefined;
		state.minShares = undefined;
		state.shareNum = undefined;
		return this;
	}
	
	this.copy = function() {
		assertFalse(_isDestroyed, "Keypair is destroyed");
		return new CryptoKeypair({keypair: that});
	}
	
	this.toJson = function() {
		assertFalse(_isDestroyed, "Keypair is destroyed");
		return {
			ticker: state.plugin.getTicker(),
			publicAddress: that.getPublicAddress(),
			privateWif: that.getPrivateWif(),
			privateHex: that.getPrivateHex(),
			encryption: that.getEncryptionScheme(),
			isSplit: that.isSplit(),
			minShares: that.getMinShares(),
			shareNum: that.getShareNum()
		};
	}
	
	this.getCsvValue = function(header) {
		assertFalse(_isDestroyed, "Keypair is destroyed");
		switch(header) {
			case CryptoKeypair.CsvHeader.TICKER:
				return that.getPlugin().getTicker();
			case CryptoKeypair.CsvHeader.PRIVATE_WIF:
				return that.getPrivateWif();
			case CryptoKeypair.CsvHeader.PRIVATE_HEX:
				return that.getPrivateHex();
			case CryptoKeypair.CsvHeader.PUBLIC_ADDRESS:
				return that.getPublicAddress();
			case CryptoKeypair.CsvHeader.ENCRYPTION:
				return that.getEncryptionScheme();
			case CryptoKeypair.CsvHeader.MIN_SHARES:
				return that.getMinShares();
			case CryptoKeypair.CsvHeader.SHARE_NUM:
				return that.getShareNum();
			default:
				throw new Error("Unrecognized CSV header: " + header);
		}
	}
	
	this.equals = function(keypair) {
		assertFalse(_isDestroyed, "Keypair is destroyed");
		assertObject(keypair, CryptoKeypair);
		var state2 = keypair.getInternalState();
		if (state.plugin.getTicker() !== state2.plugin.getTicker()) return false;
		if (state.privateHex !== state2.privateHex) return false;
		if (state.privateWif !== state2.privateWif) return false;
		if (state.publicAddress !== state2.publicAddress) return false;
		if (state.encryption !== state2.encryption) return false;
		if (state.isSplit !== state2.isSplit) return false;
		if (state.minShares !== state2.minShares) return false;
		if (state.shareNum !== state2.shareNum) return false;
		return true;
	}
	
	this.getInternalState = function() {
		assertFalse(_isDestroyed, "Keypair is destroyed");
		return state;
	}
	
	this.destroy = function() {
		assertFalse(_isDestroyed, "Keypair is already destroyed");
		deleteProperties(state);
		_isDestroyed = true;
	}
	
	this.isDestroyed = function() {
		return _isDestroyed;
	}
	
	// -------------------------------- PRIVATE ---------------------------------
	
	init();
	function init() {
		state = {};
		_isDestroyed = false;
		
		// direct copy internal state from keypair, no validation
		if (config.keypair) {
			assertUndefined(config.json);
			assertUndefined(config.splitKeypairs);
			assertUndefined(config.privateKey);
			assertUndefined(config.publicAddress);
			assertUndefined(config.shareNum);
			state = Object.assign({}, config.keypair.getInternalState());
			return;
		}
		
		// create from plugin
		if (config.plugin) {
			assertUndefined(config.keypair);
			assertUndefined(config.splitKeypairs);
			assertUndefined(config.json);
			assertTrue(isObject(config.plugin, CryptoPlugin), "Plugin is not a CryptoPlugin");
			state.plugin = config.plugin;
			if (isDefined(config.privateKey)) setPrivateKey(config.privateKey);
			else if (isUndefined(config.publicAddress)) setPrivateKey(config.plugin.randomPrivateKey());
			if (isDefined(config.publicAddress)) setPublicAddress(config.publicAddress);
		}
		
		// create from json
		else if (config.json) {
			assertUndefined(config.keypair);
			assertUndefined(config.plugin);
			assertUndefined(config.splitKeypairs);
			fromJson(config.json);
		}
		
		// create from splitKeypairs
		else if (config.splitKeypairs) {
			assertUndefined(config.keypair);
			assertUndefined(config.plugin);
			assertUndefined(config.json);
			combine(config.splitKeypairs);
		}
		
		// set share num
		if (isDefined(config.shareNum)) that.setShareNum(config.shareNum);
		
		// verify state
		validateState();
	}
	
	function validateState() {
		if (!state.plugin && !state.json && !state.splitKeypairs) {
			throw new Error("Config missing required fields");
		}
		
		if (state.isSplit === true) {
			assertInitialized(state.privateHex);
			assertInitialized(state.privateWif);
		} else if (state.isSplit === false) {
			assertInitialized(state.privateHex);
			assertInitialized(state.privateWif);
			assertNull(state.minShares);
			assertNull(state.shareNum);
		} else if (state.isSplit ===  undefined) {
			assertUndefined(state.privateHex);
			assertUndefined(state.privateHex);
			assertUndefined(state.minShares);
			assertUndefined(state.shareNum);
		}
		
		if (state.minShares) {
			assertTrue(state.isSplit);
			assertNumber(state.minShares);
			assertTrue(state.minShares >= 2 && state.minShares <= AppUtils.MAX_SHARES);
		}
		
		if (state.shareNum) {
			assertTrue(state.isSplit);
			assertNumber(state.shareNum);
			assertTrue(state.shareNum >= 1 && state.shareNum <= AppUtils.MAX_SHARES);
		}
		
		// hex and wif must both be initialized or undefined
		if (isInitialized(state.privateHex)) {
			assertInitialized(state.privateWif);
		}
		else {
			assertUndefined(state.privateHex);
			assertUndefined(state.privateWif);
		}
		
		// public or private must be known if address applicable
		if (that.getPlugin().hasPublicAddress()) {
			if (isUndefined(state.publicAddress)) assertTrue(that.hasPrivateKey());
			if (!that.hasPrivateKey()) assertInitialized(state.publicAddress);
		}
				
		// private key known
		if (that.hasPrivateKey()) {
			
			// split state is known or not applicable
			assertDefined(state.isSplit);
			
			// if not split then encryption is known
			if (state.isSplit === false) assertDefined(state.encryption);
			
			// unencrypted
			if (state.encryption === null) {
				state.plugin.hasPublicAddress() ? assertInitialized(state.publicAddress) : assertNull(state.publicAddress);
				assertFalse(state.isSplit);
				assertNull(state.minShares);
				assertNull(state.shareNum);
			}
			
			// split
			if (state.encryption === undefined || state.isSplit) {
				assertUndefined(state.encryption);
				assertNotNull(state.minShares);	// either undefined or share number
			}
			
			// encrypted
			if (isInitialized(state.encryption)) {
				assertFalse(state.isSplit);
				assertNull(state.minShares);
				assertNull(state.shareNum);
			}
		}
		
		// private key unknown
		if (!that.hasPrivateKey()) {
			assertUndefined(state.privateHex);
			assertUndefined(state.privateWif);
			assertUndefined(state.isSplit);
			assertUndefined(state.minShares);
			assertUndefined(state.shareNum);
			assertUndefined(state.encryption);
		}
	}
	
	function setPrivateKey(privateKey) {
		assertInitialized(state.plugin);
		assertString(privateKey);
		assertInitialized(privateKey);

		// decode with plugin
		var decoded = state.plugin.decode(privateKey);
		if (decoded) {
			state.privateHex = decoded.privateHex.toLowerCase();
			state.privateWif = decoded.privateWif;
			state.publicAddress = decoded.publicAddress;
			state.encryption = decoded.encryption;
			state.isSplit = false;
			state.minShares = null;
			state.shareNum = null;
			return;
		}
		
		// encrypted with cryptostorage conventions
		decoded = decodeEncryptedKey(privateKey);
		if (decoded) {
			state.privateHex = decoded.privateHex.toLowerCase();
			state.privateWif = decoded.privateWif;
			state.publicAddress = state.plugin.hasPublicAddress() ? undefined : null;
			state.encryption = decoded.encryption;
			state.isSplit = false;
			state.minShares = null;
			state.shareNum = null;
			return;
		}
		
		// split share
		decoded = decodeShare(privateKey);
		if (decoded) {
			state.privateHex = decoded.privateHex.toLowerCase();
			state.privateWif = decoded.privateWif;
			state.publicAddress = state.plugin.hasPublicAddress() ? undefined : null;
			state.encryption = undefined;
			state.isSplit = true;
			state.minShares = decoded.minShares;
			state.shareNum = undefined;
			return;
		}
		
		// unrecognized private key
		throw new Error("Unrecognized " + state.plugin.getTicker() + " private key: " + privateKey);
	}
	
	// TODO: support old and new format
	function fromJson(json) {
		assertInitialized(json.ticker);
		state.plugin = AppUtils.getCryptoPlugin(json.ticker);
		state.privateHex = json.privateHex;
		state.privateWif = json.privateWif;
		state.encryption = json.encryption;
		state.isSplit = json.isSplit;
		state.minShares = json.minShares;
		if (isDefined(state.privateHex)) setPrivateKey(state.privateHex);
		else if (isDefined(state.privateWif)) setPrivateKey(state.privateWif);
		if (isDefined(json.publicAddress)) setPublicAddress(json.publicAddress);
		if (json.encryption === null) assertUninitialized(json.shareNum);
		if (isDefined(json.shareNum)) that.setShareNum(json.shareNum);
	}
	
	function combine(splitKeypairs) {
		
		// verify keypairs and assign plugin
		var publicAddress;
		for (var i = 0; i < splitKeypairs.length; i++) {
			if (!state.plugin) state.plugin = splitKeypairs[i].getPlugin();
			else if (state.plugin !== splitKeypairs[i].getPlugin()) throw new Error("splitKeypairs[" + i + "] has inconsistent plugin");
			if (!publicAddress) publicAddress = splitKeypairs[i].getPublicAddress();
			else if (publicAddress !== splitKeypairs[i].getPublicAddress()) throw new Error("splitKeypairs[" + i + "] has inconsistent public address");
		}
		
		// collect decoded hex shares and verify consistent min shares
		var minShares;
		var shamirHexes = [];
		for (var i = 0; i < splitKeypairs.length; i++) {
			var decodedShare = decodeShare(splitKeypairs[i].getPrivateWif());
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
			setPrivateKey(privateHex);
			if (isDefined(publicAddress)) setPublicAddress(publicAddress);
		} catch (err) {
			throw new Error("Need additional shares to recover private key");
		}
		
		// pieces must combine to create an unsplit piece with known encryption
    assertFalse(that.isSplit(), "Pieces are not compatible shares");
    assertBoolean(that.isEncrypted(), "Pieces are not compatible shares");
	}
	
	function setPublicAddress(address) {
		if (state.publicAddress === address) return;
		if (isDefined(state.publicAddress)) throw new Error("Cannot override known public address: " + state.publicAddress + " vs " + address);
		if (that.getEncryptionScheme() === null) throw new Error("Cannot set public address of unencrypted keypair");
		assertTrue(state.plugin.isAddress(address), "Invalid address: " + address);
		state.publicAddress = address;
	}
	
	/**
	 * Decodes the given encrypted private key.
	 * 
	 * @param str is the encrypted private key to decode
	 * @returns Object with hex, wif, and encryption fields or null if not recognized
	 */
	function decodeEncryptedKey(str) {
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
			var state = {};
			state.privateHex = str;
			state.privateWif = b64;
			state.encryption = AppUtils.EncryptionScheme.V0_CRYPTOJS;
			return state;
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
			var version = parseInt(str.substring(0, AppUtils.ENCRYPTION_V1_VERSION.toString(16).length), 16);
			if (version !== AppUtils.ENCRYPTION_V1_VERSION) return null;
			
			// decode
			var state = {};
			state.privateHex = str;
			state.privateWif = Bitcoin.Base58.encode(Crypto.util.hexToBytes(str));
			state.encryption = AppUtils.EncryptionScheme.V1_CRYPTOJS;
			return state;
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
	function encodeHexShare(share, minShares) {
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
	function decodeShare(share) {
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

// CSV headers
CryptoKeypair.CsvHeader = {
		TICKER: "TICKER",
		PRIVATE_HEX: "PRIVATE_HEX",
		PRIVATE_WIF: "PRIVATE_WIF",
		PUBLIC_ADDRESS: "PUBLIC_ADDRESS",
		ENCRYPTION: "ENCRYPTION",
		MIN_SHARES: "MIN_SHARES",
		SHARE_NUM: "SHARE_NUM"
}

// split 2 encoded version
CryptoKeypair.SPLIT_V2_VERSION = 1;