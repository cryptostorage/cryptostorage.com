/**
 * Encapsulates a crypto keypair which has a public and private component.
 * 
 * One of plugin or json is required.
 * 
 * @param plugin is the crypto plugin
 * @param privateStr is a private string (hex or wif, encrypted or unencrypted) (optional)
 * @param exportJson is exportable json to initialize from
 */
function CryptoKeypair(plugin, privateStr, exportJson) {
	
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
	
	this.getSplitKeypairs = function(numPieces, minShares) {
		throw new Error("Not implemented");
	}
	
	this.isSplit = function() {
		console.log(decoded);
		assertDefined(that.getMinShares(), "Keypair split is unknown");
		return that.getMinShares() !== null;
	}
	
	this.getMinShares = function() {
		return decoded.minShares;
	}
	
	this.getExportableJson = function() {
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
			decoded = plugin.decode(privateStr);
			assertInitialized(decoded, "Cannot decode " + plugin.getTicker() + " private string: " + privateStr);
		}
		
		// initialize from exportable json
		else {
			plugin = AppUtils.getCryptoPlugin(exportableJson.ticker);
			assertInitialized(plugin);
			if (exportableJson.wif) {
				decoded = plugin.decode(privateStr);
				assertInitialized(decoded, "Cannot decode " + plugin.getTicker() + " private string: " + privateStr);
				if (!decoded.address) decoded.address = exportableJson.address;
				else if (exportableJson.address) assertEquals(decoded.address, exportableJson.address, "Derived and given addresses do not match");
				if (!decoded.encryption) decoded.encryption = exportableJson.encryption;
				else if (exportableJson.encryption) assertEquals(decoded.encryption, exportableJson.encryption, "Decoded and given encryption schemes do not match");			
			} else {
				decoded = {};
				decoded.address = exportableJson.address;
			}
		}
	}
}