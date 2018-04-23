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
 * One of plugin, json, or splitKeypairs is required.
 * 
 * @param config is initialization configuration
 * 				config.plugin is the crypto plugin
 * 				config.json is exportable json to initialize from
 * 				config.splitKeypairs are split keypairs to combine and initialize from
 * 				config.privateKey is a private key (hex or wif, encrypted or unencrypted) (optional)
 * 				config.publicAddress is a public address to manually set if not unencrypted (optional)
 * 				config.shareNum is the share number (optional)
 */
function CryptoKeypair(config) {
	
	var that = this;
	var state;
	
	this.getPlugin = function() {
		return state.plugin;
	}
	
	this.isPublicApplicable = function() {
		return state.plugin.hasPublicAddress();
	}
	
	this.getPublicAddress = function() {
		return state.publicAddress;
	}
	
	this.getPrivateLabel = function() {
		return state.plugin.getPrivateLabel();
	}
	
	this.getPrivateHex = function() {
		return state.privateHex;
	}
	
	this.getPrivateWif = function() {
		return state.privateWif;
	}
	
	this.hasPrivateKey = function() {
		return isDefined(that.getPrivateHex()) && isDefined(that.getPrivateWif());
	}
	
	this.encrypt = function(scheme, passphrase, onProgress, onDone) {
		assertNull(state.encryption, "Keypair must be unencrypted to encrypt");
		var address = that.getPublicAddress();
		AppUtils.encryptHex(that.getPrivateHex(), scheme, passphrase, onProgress, function(err, encryptedHex) {
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
		return state.encryption;
	}
	
	this.isEncrypted = function() {
		if (isUndefined(that.getEncryptionScheme())) return undefined;
		return that.getEncryptionScheme() !== null;
	}
	
	this.decrypt = function(passphrase, onProgress, onDone) {
		assertInitialized(state.encryption, "Keypair must be encrypted to decrypt");
		AppUtils.decryptHex(that.getPrivateHex(), that.getEncryptionScheme(), passphrase, onProgress, function(err, decryptedHex) {
			if (err) onDone(err);
			else {
				setPrivateKey(decryptedHex);
				validateState();
				onDone(null, that);
			}
		});
	}
	
	this.split = function(numShares, minShares) {
		
		// validate input
		assertFalse(that.isSplit());
		assertTrue(numShares >= 2);
		assertTrue(numShares <= AppUtils.MAX_SHARES);
		assertTrue(minShares >= 2);
		assertTrue(minShares <= numShares);
		
		// split private hex into shares
		var shares = secrets.share(that.getPrivateHex(), numShares, minShares);
		
		// encode shares with minimum threshold
		for (var i = 0; i < shares.length; i++) {
			shares[i] = encodeWifShare(shares[i], minShares);
		}
		
		// create keypairs
		var splitKeypairs = [];
		for (var i = 0; i < shares.length; i++) {
			splitKeypairs.push(new CryptoKeypair({
				plugin: state.plugin,
				privateKey: shares[i],
				publicAddress: that.getPublicAddress(),
				shareNum: i + 1
			}));
		}
		return splitKeypairs;
	}
	
	this.isSplit = function() {
		if (!that.hasPrivateKey()) return undefined;
		assertDefined(that.getMinShares(), "Min shares is unknown despite private key being known");
		return that.getMinShares() !== null;
	}
	
	this.getMinShares = function() {
		return state.minShares;
	}
	
	this.getShareNum = function() {
		return state.shareNum;
	}
	
	this.setShareNum = function(shareNum) {
		if (that.isSplit()) {
			assertNumber(shareNum);
		} else if (that.isSplit() === false) {
			assertNull(shareNum);
		} else if (that.isSplit() === undefined) {
			assertUndefined(shareNum);
		}
		state.shareNum = shareNum;
	}
	
	this.toJson = function(config) {
		
		// check for config
		if (config) return that.copy(config).toJson();
		
		// build json
		return {
			ticker: state.plugin.getTicker(),
			publicAddress: that.getPublicAddress(),
			privateHex: that.getPrivateHex(),
			privateWif: that.getPrivateWif(),
			encryption: that.getEncryptionScheme(),
			shareNum: that.getShareNum()
		};
	}
	
	this.getCsvValue = function(header) {
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
	
	this.copy = function(config) {
		
		// default config
		config = Object.assign({
			includePublic: true,
			includePrivate: true
		}, config);
		
		// return new key
		return new CryptoKeypair({
			plugin: state.plugin,
			privateKey: config.includePrivate ? state.privateHex : undefined,
			publicAddress: config.includePublic ? state.publicAddress : undefined,
			shareNum: config.includePrivate ? state.shareNum : undefined
		});
	}
	
	this.equals = function(keypair) {
		assertObject(keypair, CryptoKeypair);
		return objectsEqual(that.toJson(), keypair.toJson());
	}
	
	this.getState = function() {
		return state;
	}
	
	// -------------------------------- PRIVATE ---------------------------------
	
	init();
	function init() {
		state = {};
		if (config.plugin) {
			assertTrue(isObject(config.plugin, CryptoPlugin), "Plugin is not a CryptoPlugin");
			state.plugin = config.plugin;
			if (isDefined(config.privateKey)) setPrivateKey(config.privateKey);
			else if (isUndefined(config.publicAddress)) setPrivateKey(config.plugin.randomPrivateKey());
			if (config.publicAddress) setPublicAddress(config.publicAddress);
		}
		else if (config.json) fromJson(config.json);
		else if (config.splitKeypairs) combine(config.splitKeypairs);
		
		// set share num
		if (isDefined(config.shareNum)) that.setShareNum(config.shareNum);
		
		// verify state
		validateState();
	}
	
	function validateState() {
		if (!state.plugin && !state.json && !state.splitKeypairs) {
			throw new Error("One of plugin, json, or splitKeypairs is required");
		}
		
		if (state.minShares) {
			assertNumber(state.minShares);
			assertTrue(state.minShares >= 2 && state.minShares <= AppUtils.MAX_SHARES);
		}
		
		if (state.shareNum) {
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
		
		// public or private must be known
		if (isUndefined(state.publicAddress)) assertTrue(that.hasPrivateKey());
		if (!that.hasPrivateKey()) {
			assertInitialized(state.publicAddress);
			fail("Public address is not initialized for BIP39 so why didn't this fail");
		}
				
		// private key known
		if (that.hasPrivateKey()) {
			
			// min shares is known or not applicable
			assertDefined(state.minShares);
			
			// if not split then encryption is known
			if (state.minShares === null) assertDefined(state.encryption);
			
			// unencrypted
			if (state.encryption === null) {
				state.plugin.hasPublicAddress() ? assertInitialized(state.publicAddress) : assertNull(state.publicAddress);
				assertNull(state.minShares);
				assertNull(state.shareNum);
			}
			
			// split
			if (state.encryption === undefined || state.minShares || state.numShares) {
				assertUndefined(state.encryption);
				assertNumber(state.minShares);
			}
			
			// encrypted
			if (isInitialized(state.encryption)) {
				assertNull(state.minShares);
				assertNull(state.shareNum);
			}
		}
		
		// private key unknown
		if (!that.hasPrivateKey()) {
			assertUndefined(state.privateHex);
			assertUndefined(state.privateWif);
			assertUndefined(state.minShares);
			assertUndefined(state.shareNum);
			assertUndefined(state.encryption);
			assertDefined(state.publicAddress);
		}
	}
	
	function setPrivateKey(privateKey) {
		assertInitialized(state.plugin);
		assertString(privateKey);
		assertInitialized(privateKey);

		// decode with plugin
		var decoded = state.plugin.decode(privateKey);
		if (decoded) {
			state.privateHex = decoded.privateHex;
			state.privateWif = decoded.privateWif;
			state.publicAddress = decoded.publicAddress;
			state.encryption = decoded.encryption;
			state.minShares = null;
			state.shareNum = null;
			return;
		}
		
		// encrypted with cryptostorage conventions
		decoded = decodeEncryptedKey(privateKey);
		if (decoded) {
			state.privateHex = decoded.privateHex;
			state.privateWif = decoded.privateWif;
			state.publicAddress = that.isPublicApplicable() ? undefined : null,
			state.encryption = decoded.encryption;
			state.minShares = null;
			state.shareNum = null;
			return;
		}
		
		// split share with cryptostorage conventions
		decoded = decodeShare(privateKey);
		if (decoded) {
			state.privateHex = decoded.privateHex;
			state.privateWif = decoded.privateWif;
			state.publicAddress = that.isPublicApplicable() ? undefined : null,
			state.encryption = undefined;
			state.minShares = decoded.minShares;
			state.shareNum = undefined;
			
			// assign share num
			assertTrue(isUndefined(config.shareNum) || config.shareNum === null || isNumber(config.shareNum));
			if (isNumber(config.shareNum)) assertTrue(config.shareNum >= 1 && config.shareNum <= AppUtils.MAX_SHARES);
			state.shareNum = config.shareNum;
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
		state.minShares = json.minShares;
		if (json.encryption === null) assertUninitialized(json.shareNum);
		state.shareNum = json.shareNum;
		if (state.privateHex) setPrivateKey(state.privateHex);
		else if (state.privateWif) setPrivateKey(state.privateWif);
		if (json.publicAddress) setPublicAddress(json.publicAddress);
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
			assertInitialized(decodedShare);
			if (!minShares) minShares = decodedShare.minShares;
			else if (minShares !== decodedShare.minShares) throw new Error("splitKeypairs[" + i + "] has inconsistent min shares");
			shamirHexes.push(decodedShare.shamirHex);
		}
		
		// ensure sufficient shares provided
		if (splitKeypairs.length < minShares) {
			var additional = minShares - splitKeypairs.length;
			throw new Error("Need " + additional + " additional " + (additional === 1 ? "share" : "shares") + " to recover private key");
		}
		
		// combine hex shares
		var privateHex = secrets.combine(shamirHexes);
		assertHex(privateHex);
		setPrivateKey(privateHex);
		setPublicAddress(publicAddress);
	}
	
	function setPublicAddress(address) {
		if (state.publicAddress === address) return;
		if (state.publicAddress) throw new Error("Cannot override known public address: " + state.publicAddress + " vs " + address);
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
	 * @returns wif encoded share
	 */
	function encodeWifShare(share, minShares) {
		assertTrue(isHex(share));
		assertTrue(isNumber(minShares) && minShares <= AppUtils.MAX_SHARES);
		return encodeShareV1(share, minShares);
		
		function encodeShareV0(share, minShares) {
			try {
				return minShares + 'c' + Bitcoin.Base58.encode(ninja.wallets.splitwallet.hexToBytes(share));
			} catch (err) {
				return null;
			}
		}
		
		function encodeShareV1(share, minShares) {
			var hex = padLeft(AppUtils.SPLIT_V1_VERSION.toString(16), 2) + padLeft(minShares.toString(16), 2) + padLeft(share, 2);
			return Bitcoin.Base58.encode(Crypto.util.hexToBytes(hex));
			
			// Pads a string `str` with zeros on the left so that its length is a multiple of `bits` (credit: bitaddress.org)
			function padLeft(str, bits){
				bits = bits || config.bits
				var missing = str.length % bits;
				return (missing ? new Array(bits - missing + 1).join('0') : '') + str;
			}
		}
	}
	
	/**
	 * Decodes the given encoded share.
	 * 
	 * @param share is the encoded wif or hex share to decode
	 * @returns Object with privateHex, privateWif, shamirHex, and minShares initialized
	 */
	function decodeShare(encodedShare) {
		if (!isString(encodedShare)) return null;
		var decoded;
		if ((decoded = decodeShareHexV0(encodedShare))) return decoded;
		if ((decoded = decodeShareWifV0(encodedShare))) return decoded;
		if ((decoded = decodeShareHexV1(encodedShare))) return decoded;
		if ((decoded = decodeShareWifV1(encodedShare))) return decoded;
		return null;
		
		function decodeShareHexV0(encodedShare) {
			if (!isHex(encodedShare)) return null;
			return decodeShareWifV0(AppUtils.toBase(16, 58, encodedShare));
		}
		
		function decodeShareWifV0(encodedShare) {
			try {
				if (encodedShare.length < 34) return null;
				var decoded = {};
				decoded.minShares = getMinPiecesV0(encodedShare);
				if (!decoded.minShares) return null;
				var wif = encodedShare.substring(encodedShare.indexOf('c') + 1);
				if (!isBase58(wif)) return null;
				decoded.shamirHex = ninja.wallets.splitwallet.stripLeadZeros(Crypto.util.bytesToHex(Bitcoin.Base58.decode(wif)));
				decoded.privateWif = encodedShare;
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
			function getMinPiecesV0(splitPiece) {
				var idx = splitPiece.indexOf('c');	// look for first lowercase 'c'
				if (idx <= 0) return null;
				var minShares = Number(splitPiece.substring(0, idx));	// parse preceding numbers to int
				if (!isNumber(minShares) || minShares < 2 || minShares > AppUtils.MAX_SHARES) return null;
				return minShares;
			}
		}
		
		function decodeShareHexV1(encodedShare) {
			if (!isHex(encodedShare)) return null;
			return decodeShareWifV1(AppUtils.toBase(16, 58, encodedShare));
		}
		
		function decodeShareWifV1(encodedShare) {
			if (encodedShare.length < 33) return null;
			if (!isBase58(encodedShare)) return null;
			var hex = Crypto.util.bytesToHex(Bitcoin.Base58.decode(encodedShare));
			if (hex.length % 2 !== 0) return null;
			var version = parseInt(hex.substring(0, 2), 16);
			if (version !== AppUtils.SPLIT_V1_VERSION) return null;
			var decoded = {};
			decoded.minShares = parseInt(hex.substring(2, 4), 16);
			if (!isNumber(decoded.minShares) || decoded.minShares < 2 || decoded.minShares > AppUtils.MAX_SHARES) return null;
			decoded.shamirHex = ninja.wallets.splitwallet.stripLeadZeros(hex.substring(4));
			decoded.privateWif = encodedShare;
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

CryptoKeypair.CsvHeader = {
		TICKER: "TICKER",
		PRIVATE_HEX: "PRIVATE_HEX",
		PRIVATE_WIF: "PRIVATE_WIF",
		PUBLIC_ADDRESS: "PUBLIC_ADDRESS",
		ENCRYPTION: "ENCRYPTION",
		MIN_SHARES: "MIN_SHARES",
		SHARE_NUM: "SHARE_NUM"
}