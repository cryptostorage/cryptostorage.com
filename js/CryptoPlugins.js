/**
 * Base plugin that specific cryptocurrencies must implement.
 */
function CryptoPlugin {
	
	/**
	 * Returns the cryptocurrency's name.
	 */
	this.getName = function() { throw new Error("Subclass must implement"); }
	
	/**
	 * Returns the cryptocurrency's ticker symbol.
	 */
	this.getTickerSymbol = function() { throw new Error("Subclass must implement"); }
	
	/**
	 * Returns the cryptocurrency's logo.
	 */
	this.getLogo = function() { throw new Error("Subclass must implement"); }
	
	/**
	 * Returns the cryptocurrency's supported encryption schemes.
	 */
	this.getEncryptionSchemes = function() {
		return EncryptionScheme.CRYPTOJS;	// every currency supports cryptojs
	}
	
	/**
	 * Returns the encryption scheme of the given private key string.  Throws an exception if the string is not recognized.
	 */
	this.getEncryptionScheme = function(str) { throw new Error("Subclass must implement"); }
	
	/**
	 * Returns the address of the given private key.
	 */
	this.getAddress = function(key) { throw new Error("Subclass must implement"); }
}

function BitcoinPlugin {
	
}

function MoneroPlugin {
	
}