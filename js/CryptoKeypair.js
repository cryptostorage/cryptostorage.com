/**
 * Encapsulates a crypto keypair which has a public and private component.
 * 
 * One of plugin or json is required.
 * 
 * @param plugin is the crypto plugin
 * @param privateStr is a private string (hex or wif, encrypted or unencrypted) (optional)
 * @param json is a json state to initialize from
 */
function CryptoKeypair(plugin, privateStr, json) {
	
	var that = this;
	var decoded;
	initialize();
	
	this.getPlugin = function() {
		return plugin;
	}
	
	this.copy = function() {
		return new CryptoKeypair(plugin, that.getPrivateHex());
	}
	
	this.equals = function(keypair) {
		assertObject(keypair, CryptoKeypair);
		return objectsEqual(that.getJson(), keypair.getJson());
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
	
	this.getSplitKeypairs = function(numPieces, minPieces) {
		throw new Error("Not implemented");
	}
	
	this.isSplit = function() {
		assertDefined(that.getMinPieces(), "Keypair split is unknown");
		return that.getMinPieces() !== null;
	}
	
	this.getMinPieces = function() {
		return decoded.minPieces;
	}
	
	this.getJson = function() {
		return {
			ticker: plugin.getTicker(),
			address: that.getPublicAddress(),
			wif: that.getPrivateWif(),
			encryption: that.getEncryptionScheme()
		};
	}
	
	// -------------------------------- PRIVATE ---------------------------------
	
	function initialize() {
		
		// initialize with plugin
		if (plugin) {
			assertTrue(isObject(plugin, CryptoPlugin), "Plugin is not a CryptoPlugin");
			
			// initialize with private str
			if (privateStr) {
				decoded = plugin.decode(privateStr);
				assertInitialized(decoded, "Cannot decode " + plugin.getTicker() + " private string: " + privateStr);
			} else {
				decoded = plugin.random();
			}
		}
		
		// initialize with json
		else {
			plugin = AppUtils.getCryptoPlugin(json.ticker);
			assertInitialized(plugin);
			if (json.wif) {
				decoded = plugin.decode(privateStr);
				assertInitialized(decoded, "Cannot decode " + plugin.getTicker() + " private string: " + privateStr);
				if (!decoded.address) decoded.address = json.address;
				else if (json.address) assertEquals(decoded.address, json.address, "Derived and given addresses do not match");
				if (!decoded.encryption) decoded.encryption = json.encryption;
				else if (json.encryption) assertEquals(decoded.encryption, json.encryption, "Decoded and given encryption schemes do not match");			
			} else {
				decoded = {};
				decoded.address = json.address;
			}
		}
	}
}