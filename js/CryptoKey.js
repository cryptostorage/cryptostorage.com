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
 * Maintains a single public/private key pair.
 * 
 * @param plugin is a plugin for a specific cryptocurrency
 * @param state specifies the initial private key or state (optional)
 */
function CryptoKey(plugin, state) {
	
	this.copy = function() {
		return new CryptoKey(this.plugin, this.state);
	}
	
	this.equals = function(key) {
		if (!isObject(plugin, CryptoPlugin)) throw new Error("Given argument must be a CryptoKey");
		return objectsEqual(this.getState(), key.getState());
	}
	
	this.getPlugin = function() {
		return this.plugin;
	}
	
	this.getState = function() {
		return this.state;
	}
	
	this.setState = function(state) {
		this.state = objectAssign({}, state);
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
		if (this.hasPrivateKey()) {
			if (this.isEncrypted()) {
				if (!this.plugin.isAddress(address)) throw new Error("Address is invalid: " + address);
				this.state.address = address;
			} else {
				if (this.state.address !== address) throw new Error("Cannot change address of unencrypted key");
			}
		} else {
			this.state.address = address;
		}
	}
	
	this.getHex = function() {
		return this.state.hex;
	}

	this.getWif = function() {
		return this.state.wif;
	}
	
	this.hasPrivateKey = function() {
		return isInitialized(this.state.hex) || isInitialized(this.state.wif);
	}
	
	this.encrypt = function(scheme, passphrase, onProgress, onDone) {
		this.plugin.encrypt(scheme, this, passphrase, onProgress, onDone);
	}
	
	this.decrypt = function(passphrase, onProgress, onDone) {
		this.plugin.decrypt(this, passphrase, onProgress, onDone);
	}
	
	this.isEncrypted = function() {
		if (!this.state.hex || !this.state.wif) throw new Error("Cannot check encryption state if private components are unknown");
		return isInitialized(this.state.encryption);
	}
	
	this.getEncryptionSchemes = function() {
		return this.plugin.getEncryptionSchemes();
	}
	
	this.getEncryptionScheme = function() {
		if (!this.state.hex || !this.state.wif) throw new Error("Cannot check encryption scheme if private components are unknown");
		return this.state.encryption;
	}
	
	// initialize
	if (!isObject(plugin, CryptoPlugin)) throw new Error("Must provide crypto plugin");
	this.plugin = plugin;
	var that = this;
	this.state = {};
	if (state) {
		if (isObject(state)) this.setState(state);
		else this.setPrivateKey(state);
	}
	else this.random();
}