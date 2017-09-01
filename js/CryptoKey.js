/**
 * Maintains the state of a single private key.
 */
function CryptoKey(plugin) {
	
	this.toAddress = function() {
		throw new Error("Not implemented");
	}
	
	this.toHex = function() {
		throw new Error("Not implemented");
	}

	this.toWif = function() {
		throw new Error("Not implemented");
	}
	
	this.encrypt = function(scheme, password) {
		throw new Error("Not implemented");
	}
	
	this.decrypt = function(password) {
		throw new Error("Not implemented");
	}
	
	this.isEncrypted = function() {
		throw new Error("Not implemented");
	}
	
	this.getEncryptionScheme = function() {
		throw new Error("Not implemented");
	}
}