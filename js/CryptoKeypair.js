/**
 * Encapsulates a crypto keypair which has a public and private component.
 * 
 * One of plugin, json, or shares is required.
 * 
 * @param plugin is the crypto plugin
 * @param json is exportable json to initialize from
 * @param splitKeypairs are split keypairs to combine and initialize from
 * @param privateKey is a private key (hex or wif, encrypted or unencrypted) (optional)
 * @param publicAddress is a public address to manually set if not unencrypted
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
		AppUtils.encryptHex(that.getPrivateHex(), scheme, passphrase, onProgress, function(err, encryptedHex) {
			if (err) onDone(err);
			else {
				Object.assign(decoded, plugin.decode(encryptedHex));
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
		AppUtils.decryptHex(that.getPrivateHex(), passphrase, onProgress, function(err, decryptedHex) {
			if (err) onDone(err);
			else {
				Object.assign(decoded, plugin.decode(decryptedHex));
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
			shares[i] = AppUtils.encodeShare(shares[i], minShares);
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
	
	this.toJson = function() {
		return {
			ticker: plugin.getTicker(),
			address: that.getPublicAddress(),
			wif: that.getPrivateWif(),
			encryption: that.getEncryptionScheme()
		};
	}
	
	this.copy = function() {
		return new CryptoKeypair(plugin, that.getPrivateHex());
	}
	
	this.equals = function(keypair) {
		assertObject(keypair, CryptoKeypair);
		return objectsEqual(that.getJson(), keypair.getJson());
	}
	
	// -------------------------------- PRIVATE ---------------------------------
	
	init();
	function init() {
		if (plugin) {
			assertTrue(isObject(plugin, CryptoPlugin), "Plugin is not a CryptoPlugin");
			setPrivateKey(privateKey);
			if (publicAddress) setPublicAddress(publicAddress);
			if (shareNum) setShareNum(shareNum);
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
			assertDefined(decoded.encryption);
			assertDefined(decoded.minShares);
			if (isNumber(decoded.minShares)) {
				assertTrue(decoded.minShares >= 2);
				assertTrue(decoded.minShares <= AppUtils.MAX_SHARES);
				assertNumber(decoded.shareNum);
				assertTrue(decoded.shareNum >= 1);
				assertTrue(decoded.shareNum <= AppUtils.MAX_SHARES);
			}
		}
		if (decoded.hex) assertInitialized(decoded.wif);
	}
	
	function setPrivateKey(privateKey) {
		decoded = plugin.decode(privateKey);
		assertInitialized(decoded, "Cannot decode " + plugin.getTicker() + " private string: " + privateKey);
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
	
	function combine(shares) {
		throw new Error("Not implemented");
	}
	
	function setPublicAddress(address) {
		if (decoded.address && decoded.address !== address) throw new Error("Cannot override known public address");
		assertTrue(plugin.isAddress(address), "Invalid address: " + address);
		decoded.address = address;
	}
	
	function setShareNum(shareNum) {
		assertNumber(shareNum);
		assertTrue(shareNum >= 1 && shareNum <= AppUtils.MAX_SHARES);
		decoded.shareNum = shareNum;
	}
}