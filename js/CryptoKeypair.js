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
 * @param plugin is the crypto plugin
 * @param json is exportable json to initialize from
 * @param splitKeypairs are split keypairs to combine and initialize from
 * @param privateKey is a private key (hex or wif, encrypted or unencrypted) (optional)
 * @param publicAddress is a public address to manually set if not unencrypted (optional)
 * @param shareNum is the share number (optional)
 */
function CryptoKeypair(plugin, json, splitKeypairs, privateKey, publicAddress, shareNum) {
	
	var that = this;
	var decoded;
	
	this.getPlugin = function() {
		return plugin;
	}
	
	this.getPublicAddress = function() {
		return decoded.address;
	}
	
	this.getPrivateLabel = function() {
		return plugin.getPrivateLabel();
	}
	
	this.getPrivateHex = function() {
		return decoded.hex;
	}
	
	this.getPrivateWif = function() {
		return decoded.wif;
	}
	
	this.encrypt = function(scheme, passphrase, onProgress, onDone) {
		assertNull(decoded.encryption, "Keypair must be unencrypted to encrypt");
		var address = that.getPublicAddress();
		AppUtils.encryptHex(that.getPrivateHex(), scheme, passphrase, onProgress, function(err, encryptedHex) {
			if (err) onDone(err);
			else {
				setPrivateKey(encryptedHex);
				setPublicAddress(address);
				onDone(null, that);
			}
		});
	}
	
	/**
	 * Returns null if unencrypted, undefined if unknown, or one of AppUtils.EncryptionScheme otherwise.
	 */
	this.getEncryptionScheme = function() {
		return decoded.encryption;
	}
	
	this.isEncrypted = function() {
		assertDefined(that.getEncryptionScheme(), "Keypair encryption is unknown");
		return that.getEncryptionScheme() !== null;
	}
	
	this.decrypt = function(passphrase, onProgress, onDone) {
		assertInitialized(decoded.encryption, "Keypair must be encrypted to decrypt");
		AppUtils.decryptHex(that.getPrivateHex(), that.getEncryptionScheme(), passphrase, onProgress, function(err, decryptedHex) {
			if (err) onDone(err);
			else {
				setPrivateKey(decryptedHex);
				onDone(null, that);
			}
		});
	}
	
	this.split = function(numShares, minShares) {
		
		// validate input
		assertTrue(numShares >= 2);
		assertTrue(minShares >= 2);
		assertTrue(minShares <= numShares);
		assertTrue(numShares <= AppUtils.MAX_SHARES);
		
		// split private hex into shares
		var shares = secrets.share(that.getPrivateHex(), numShares, minShares);
		
		// encode shares with minimum threshold
		for (var i = 0; i < shares.length; i++) {
			shares[i] = encodeWifShare(shares[i], minShares);
		}
		
		// create keypairs
		var splitKeypairs = [];
		for (var i = 0; i < shares.length; i++) {
			splitKeypairs.push(new CryptoKeypair(plugin, null, null, shares[i], that.getPublicAddress(), i + 1));
		}
		return splitKeypairs;
	}
	
	this.isSplit = function() {
		assertDefined(that.getMinShares(), "Keypair split is unknown");
		return that.getMinShares() !== null;
	}
	
	this.getMinShares = function() {
		return decoded.minShares;
	}
	
	this.getShareNum = function() {
		return decoded.shareNum;
	}
	
	this.getJson = function() {
		return {
			ticker: plugin.getTicker(),
			address: that.getPublicAddress(),
			wif: that.getPrivateWif(),
			encryption: that.getEncryptionScheme(),
			shareNum: that.getShareNum()
		};
	}
	
	this.copy = function() {
		return new CryptoKeypair(plugin, null, null, that.getPrivateHex(), that.getPublicAddress(), that.getShareNum());
	}
	
	this.equals = function(keypair) {
		assertObject(keypair, CryptoKeypair);
		return objectsEqual(that.getJson(), keypair.getJson());
	}
	
	this.getDecoded = function() {
		return decoded;
	}
	
	// -------------------------------- PRIVATE ---------------------------------
	
	init();
	function init() {
		if (plugin) {
			assertTrue(isObject(plugin, CryptoPlugin), "Plugin is not a CryptoPlugin");
			setPrivateKey(privateKey);
			if (publicAddress) setPublicAddress(publicAddress);
		}
		else if (json) fromJson(json);
		else if (splitKeypairs) combine(splitKeypairs);
		else throw new Error("One of plugin, json, or splitKeypairs is required");
		
		// verify decoding
		verifyDecoded(decoded);
	}
	
	function verifyDecoded(decoded) {
		if (decoded.wif) {
			assertInitialized(decoded.hex);
			assertDefined(decoded.minShares);
			if (!decoded.minShares) assertDefined(decoded.encryption);
			if (isNumber(decoded.minShares)) {
				assertUndefined(decoded.encryption);
				assertTrue(decoded.minShares >= 2);
				assertTrue(decoded.minShares <= AppUtils.MAX_SHARES);
				assertTrue(isUndefined(decoded.shareNum) || decoded.shareNum === null || isNumber(decoded.shareNum));
				if (isNumber(decoded.shareNum)) {
					assertTrue(decoded.shareNum >= 1);
					assertTrue(decoded.shareNum <= AppUtils.MAX_SHARES);
				}
			}
		}
		if (decoded.hex) assertInitialized(decoded.wif);
	}
	
	function setPrivateKey(privateKey) {

		// decode with plugin
		decoded = plugin.decode(privateKey);
		if (decoded) {
			decoded.minShares = null;
			decoded.shareNum = null;
			return;
		}
		
		// private key must be initialized if encrypted or split
		assertNotNull(privateKey);
		
		// encrypted with cryptostorage conventions
		if ((decoded = AppUtils.decodeEncryptedKey(privateKey)) !== null) {
			decoded.minShares = null;
			decoded.shareNum = null;
			return;
		}
		
		// split share with cryptostorage conventions
		var decodedShare = decodeWifShare(privateKey);
		assertInitialized(decodedShare, "Cannot decode " + plugin.getTicker() + " private string: " + privateKey);
		decoded = {};
		decoded.wif = privateKey;
		decoded.hex = AppUtils.toBase(58, 16, decoded.wif);
		decoded.minShares = decodedShare.minShares;
		assertTrue(isUndefined(shareNum) || shareNum === null || isNumber(shareNum));
		if (isNumber(shareNum)) assertTrue(shareNum >= 1 && shareNum <= AppUtils.MAX_SHARES);
		decoded.shareNum = shareNum;
	}
	
	function fromJson(json) {
		plugin = AppUtils.getCryptoPlugin(json.ticker);
		assertInitialized(plugin);
		if (json.wif) {
			decoded = plugin.decode(json.wif);
			assertInitialized(decoded, "Cannot decode " + plugin.getTicker() + " private string: " + privateKey);
			if (!decoded.address) decoded.address = json.address;
			else if (json.address) assertEquals(decoded.address, json.address, "Derived and given addresses do not match");
			if (!decoded.encryption) decoded.encryption = json.encryption;
			else if (json.encryption) assertEquals(decoded.encryption, json.encryption, "Decoded and given encryption schemes do not match");			
		} else {
			decoded = {};
			decoded.address = json.address;
		}
	}
	
	function combine(splitKeypairs) {
		
		// verify keypairs and assign plugin
		var publicAddress;
		for (var i = 0; i < splitKeypairs.length; i++) {
			if (!plugin) plugin = splitKeypairs[i].getPlugin();
			else if (plugin !== splitKeypairs[i].getPlugin()) throw new Error("splitKeypairs[" + i + "] has inconsistent plugin");
			if (!publicAddress) publicAddress = splitKeypairs[i].getPublicAddress();
			else if (publicAddress !== splitKeypairs[i].getPublicAddress()) throw new Error("splitKeypairs[" + i + "] has inconsistent public address");
		}
		
		// collect decoded hex shares and verify consistent min shares
		var minShares;
		var decodedHexShares = [];
		for (var i = 0; i < splitKeypairs.length; i++) {
			var decodedShare = decodeWifShare(splitKeypairs[i].getPrivateWif());
			assertInitialized(decodedShare);
			if (!minShares) minShares = decodedShare.minShares;
			else if (minShares !== decodedShare.minShares) throw new Error("splitKeypairs[" + i + "] has inconsistent min shares");
			decodedHexShares.push(decodedShare.hex);
		}
		
		// ensure sufficient shares provided
		if (splitKeypairs.length < minShares) {
			var additional = minShares - splitKeypairs.length;
			throw new Error("Need " + additional + " additional " + (additional === 1 ? "share" : "shares") + " to recover private key");
		}
		
		// combine hex shares
		var privateHex = secrets.combine(decodedHexShares);
		assertHex(privateHex);
		setPrivateKey(privateHex);
		setPublicAddress(publicAddress);
	}
	
	function setPublicAddress(address) {
		if (decoded.address === address) return;
		if (decoded.address) throw new Error("Cannot override known public address");
		if (that.getEncryptionScheme() === null) throw new Error("Cannot set public address of unencrypted keypair");
		assertTrue(plugin.isAddress(address), "Invalid address: " + address);
		decoded.address = address;
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
	 * @param share is the wif encoded share to decode
	 * @returns Object with minShares and hex fields or null if cannot decode
	 */
	function decodeWifShare(encodedShare) {
		if (!isString(encodedShare)) return null;
		var decoded;
		if ((decoded = decodeShareV0(encodedShare))) return decoded;
		if ((decoded = decodeShareV1(encodedShare))) return decoded;
		return null;
		
		function decodeShareV0(encodedShare) {
			try {
				if (encodedShare.length < 34) return null;
				var decoded = {};
				decoded.minShares = getMinPiecesV0(encodedShare);
				if (!decoded.minShares) return null;
				var wif = encodedShare.substring(encodedShare.indexOf('c') + 1);
				if (!isBase58(wif)) return null;
				decoded.hex = ninja.wallets.splitwallet.stripLeadZeros(Crypto.util.bytesToHex(Bitcoin.Base58.decode(wif)));
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
		
		function decodeShareV1(encodedShare) {
			if (encodedShare.length < 33) return null;
			if (!isBase58(encodedShare)) return null;
			var hex = Crypto.util.bytesToHex(Bitcoin.Base58.decode(encodedShare));
			if (hex.length % 2 !== 0) return null;
			var version = parseInt(hex.substring(0, 2), 16);
			if (version !== AppUtils.SPLIT_V1_VERSION) return null;
			var decoded = {};
			decoded.minShares = parseInt(hex.substring(2, 4), 16);
			if (!isNumber(decoded.minShares) || decoded.minShares < 2 || decoded.minShares > AppUtils.MAX_SHARES) return null;
			decoded.hex = ninja.wallets.splitwallet.stripLeadZeros(hex.substring(4));
			return decoded;
		}
	}
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