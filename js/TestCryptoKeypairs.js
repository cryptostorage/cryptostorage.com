function TestCryptoKeypairs() {
	
	var plugins = [AppUtils.getCryptoPlugin("BTC"), AppUtils.getCryptoPlugin("BCH")];
	var REPEAT_LONG = 10;
	var REPEAT_SHORT = 2;

	this.run = function(onDone) {
		
		// test new keypairs
		try {
			testNewKeypairs();
		} catch (err) {
			onDone(err);
			return;
		}
		
		// test encryption and splitting
		testEncryptionAndSplitting(function(err) {
			if (err) {
				onDone(err);
				return;
			}
			
			// tests pass
			onDone();
		});
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
	
	function testEncryptionAndSplitting(onDone) {
		
		// collect keypairs and schemes
		var keypairs = [];
		var schemes = [];
		for (var i = 0; i < plugins.length; i++) {
			for (var j = 0; j < plugins[i].getEncryptionSchemes().length; j++) {
				keypairs.push(new CryptoKeypair(plugins[i]));
				schemes.push(plugins[i].getEncryptionSchemes()[j]);
			}
		}
		
		// copy originals for later comparison
		var originals = [];
		for (var i = 0; i < keypairs.length; i++) originals.push(keypairs[i].copy());
		
		// test splitting unencrypted keys
		testSplit(keypairs);
		
		// encrypt keypairs
		var progressCompleted = false;
		AppUtils.encryptKeypairs(keypairs, schemes, PASSPHRASE, function(percent) {
			if (percent === 1) progressCompleted = true;
		}, function(err, encryptedKeypairs) {
			if (err) {
				onDone(err);
				return;
			}
			
			// test splitting encrypted keys
			testSplit(keypairs);
			
			// decrypt keypairs
			AppUtils.decryptKeypairs(encryptedKeypairs, passphrase, cancellor, onProgress, onDone);	// TODO
		});
	}
	
	function testSplit(keypairs) {
		throw new Error("Not implemented");
	}
}