function TestCryptoKeypairs() {
	
	var plugins = [AppUtils.getCryptoPlugin("BTC")];

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