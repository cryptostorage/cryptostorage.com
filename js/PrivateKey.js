/**
 * Maintains a single private key.
 * 
 * @param plugin is a plugin for a specific cryptocurrency
 * @param state defines the initial state (optional)
 */
function PrivateKey(plugin, state) {
	
	// initialize key
	if (!isInitialized(plugin) || typeof plugin !== 'object' || plugin.constructor.name !== 'CryptoPlugin') throw new Error("Must provide crypto plugin");
	this.plugin = plugin;
	this.state = {};
	if (state) this.setState(state);
	else this.random();
	
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
	
	this.setPrivateKey(str) {
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
	
	this.encrypt = function(scheme, password) {
		this.setPrivateKey(this.plugin.encrypt(scheme, this, password));
	}
	
	this.decrypt = function(password) {
		this.setPrivateKey(this.plugin.decrypt(this.getEncrpytionScheme(), this, password));
	}
	
	this.isEncrypted = function() {
		return isInitialized(this.state.encryption);
	}
	
	this.getEncryptionScheme = function() {
		return this.state.encryption;
	}
	
	this.setState = function(state) {
		
		// copy state
		this.state = Object.assign({}, state);
		
		// set private key
		if (state.privateKey) {
			if (plugin.isPrivateKeyHex(state.privateKey)) {
				this.state.hex = privateKey;
				this.state.wif = plugin.privateKeyHexToWif(state.privateKey);
			} else if (plugin.isPrivateKeyWif(state.privateKey)) {
				this.state.hex = plugin.privateKeyWifToHex(state.privateKey);
				this.state.wif = state.privateKey;
			} else throw new Error("Unrecognized private key: " + state.privateKey);
		}
		
		// set encryption
		this.state.encryption = plugin.getEncryptionScheme(state.privateKey);
		
		// set address
		if (!this.isEncrypted) {
			let address = plugin.getAddress(this);
			if (state.address && state.address !== address) throw new Error("state.address does not match derived address");
			this.state.address = address;
		}
	}
}