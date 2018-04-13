function TestCryptoKeypairs() {
	
	var plugins = AppUtils.getCryptoPlugins();

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
			var keypair = plugins[i].newKeypair();
			assertInitialized(keypair.getPrivateHex());
			assertInitialized(keypair.getPrivateWif());
			assertFalse(keypair.isEncrypted());
			assertNull(keypair.getEncryptionScheme());
			assertFalse(keypair.isSplit());
			assertNull(keypair.getMinPieces());
		}
	}
}