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
	
	this.equals = function(key) {
		if (!isObject(plugin, 'CryptoPlugin')) throw new Error("Given argument must be a CryptoKey");
		return mapsEqual(this.getState(), key.getState());
	}
	
	this.getPlugin = function() {
		return this.plugin;
	}
	
	this.getState = function() {
		return this.state;
	}
	
	this.setState = function(state) {
		this.state = Object.assign({}, state);
	}
	
	this.random = function() {
		this.setState(this.plugin.newKey().getState());
	}
	
	this.setPrivateKey = function(str) {
		this.setState(this.plugin.newKey(str).getState());
	}
	
	this.getAddress = function() {
		return this.state.address;
	}
	
	this.setAddress = function(address) {
		if (!this.isEncrypted()) throw new Error("Cannot override derived address for unencrypted private key");
		if (this.state.address && this.state.address !== address) throw new Error("Given address conflicts with existing address");
		this.state.address = address;
	}
	
	this.getHex = function() {
		return this.state.hex;
	}

	this.getWif = function() {
		return this.state.wif;
	}
	
	this.encrypt = function(scheme, password, callback) {
		this.plugin.encrypt(scheme, this, password, callback);
	}
	
	this.decrypt = function(password, callback) {
		this.plugin.decrypt(this, password, callback);
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
	
	// initialize
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