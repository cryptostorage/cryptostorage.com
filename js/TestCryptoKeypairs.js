function TestCryptoKeypairs() {
	
	var plugins = [AppUtils.getCryptoPlugin("BTC"), AppUtils.getCryptoPlugin("BCH")];
	var REPEAT_LONG = 10;
	var REPEAT_SHORT = 2;

	this.run = function(onDone) {
		try {
			testNewKeypairs();
			onDone();
		} catch (err) {
			onDone(err);
		}
	}
	
	function testNewKeypairs() {
		for (var i = 0; i < plugins.length; i++) {
			for (var j = 0; j < REPEAT_LONG; j++) {
				var keypair = new CryptoKeypair(plugins[i]);
				assertInitialized(keypair.getPrivateHex());
				assertInitialized(keypair.getPrivateWif());
				assertFalse(keypair.isEncrypted());
				assertNull(keypair.getEncryptionScheme());
				assertFalse(keypair.isSplit());
				assertNull(keypair.getMinShares());
			}
		}
	}
}