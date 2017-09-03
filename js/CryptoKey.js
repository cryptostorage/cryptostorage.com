/**
 * Maintains a single public/private key pair.
 * 
 * @param plugin is a plugin for a specific cryptocurrency
 * @param state defines the initial state (optional)
 */
function CryptoKey(plugin, state) {
	
	this.copy = function() {
		return new CryptoKey(this.plugin, this.state);
	}
	
	this.equals = function(cryptoKey) {
		return mapsEqual(this.getState(), cryptoKey.getState());
	}
	
	this.getPlugin = function() {
		return this.plugin;
	}
	
	this.getState = function() {
		return this.state;
	}
	
	this.random = function() {
		this.setPrivateKey(this.plugin.newUnencryptedPrivateKeyHex());
	}
	
	this.setPrivateKey = function(str) {
		this.setState({privateKey: str});
	}
	
	this.toAddress = function() {
		return this.state.address;
	}
	
	this.toHex = function() {
		return this.state.hex;
	}

	this.toWif = function() {
		return this.state.wif;
	}
	
	this.encrypt = function(scheme, password, callback) {
		this.plugin.encrypt(scheme, this, password, function(encrypted, error) {
			if (encrypted) that.setState({privateKey: encrypted, address: that.toAddress(), encryption: scheme});
			callback(error);
		});
	}
	
	this.decrypt = function(password, callback) {
		this.plugin.decrypt(this.getEncryptionScheme(), this, password, function(decrypted, error) {
			if (decrypted) that.setState({privateKey: decrypted, address: that.toAddress()});
			callback(error);
		});
	}
	
	this.isEncrypted = function() {
		return isInitialized(this.state.encryption);
	}
	
	this.getEncryptionSchemes = function() {
		return this.plugin.getEncryptionSchemes();
	}
	
	this.getEncryptionScheme = function() {
		return this.state.encryption;
	}
	
	this.setState = function(state) {
		
		// copy state
		state = Object.assign({}, state);
		
		// collect hex and wif values both given and derived
		let hexArr = [];
		let wifArr = [];
		if (state.privateKey) {
			if (plugin.isPrivateKeyHex(state.privateKey)) {
				hexArr.push(state.privateKey);
				wifArr.push(plugin.privateKeyHexToWif(state.privateKey));
			} else if (plugin.isPrivateKeyWif(state.privateKey)) {
				hexArr.push(plugin.privateKeyWifToHex(state.privateKey));
				wifArr.push(state.privateKey);
			} else throw new Error("Unrecognized private key: " + state.privateKey);
		}
		if (state.hex) {
			assertTrue(plugin.isPrivateKeyHex(state.hex));
			hexArr.push(state.hex);
			wifArr.push(plugin.privateKeyHexToWif(state.hex));
		}
		if (state.wif) {
			assertTrue(plugin.isPrivateKeyWif(state.wif));
			hexArr.push(plugin.privateKeyWifToHex(state.wif));
			wifArr.push(state.wif);
		}
		
		// ensure all values agree to initialize hex and wif
		this.state.privateKey = undefined;
		this.state.hex = getSingleValue(hexArr);
		this.state.wif = getSingleValue(wifArr);
		
		// set encryption
		let encryption = plugin.getEncryptionScheme(this.state.hex);
		if (isDefined(state.encryption) && state.encryption !== encryption) throw new Error("state.encryption does not match detected encryption");
		this.state.encryption = encryption;
		
		// set address
		if (!this.state.encryption) {
			let address = plugin.getAddress(this);
			if (state.address && state.address !== address) throw new Error("state.address does not match address derived from private key");
			this.state.address = address;
		} else {
			this.state.address = state.address;
		}
	}
	
	// initialize key
	if (!isObject(plugin, 'CryptoPlugin')) throw new Error("Must provide crypto plugin");
	this.plugin = plugin;
	var that = this;
	this.state = {};
	if (state) {
		if (isString(state)) this.setPrivateKey(state);
		else this.setState(state);
	}
	else this.random();
}