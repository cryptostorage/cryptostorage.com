/**
 * Tests keypairs and pieces.
 */
function TestCryptoKeypairs() {
	
	var PLUGINS = [AppUtils.getCryptoPlugin("BTC"), AppUtils.getCryptoPlugin("BCH")];
	var PASSPHRASE = "MySuperSecretPassphraseAbcTesting123";
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
		testPieceEncryptionAndSplitting(function(err) {
			if (err) {
				onDone(err);
				return;
			}
			
			// tests pass
			onDone();
		});
	}
	
	function testNewKeypairs() {
		for (var i = 0; i < PLUGINS.length; i++) {
			for (var j = 0; j < REPEAT_LONG; j++) {
				var keypair = new CryptoKeypair(PLUGINS[i]);
				assertInitialized(keypair.getPrivateHex());
				assertInitialized(keypair.getPrivateWif());
				assertFalse(keypair.isEncrypted());
				assertNull(keypair.getEncryptionScheme());
				assertFalse(keypair.isSplit());
				assertNull(keypair.getMinShares());
			}
		}
	}
	
	function testPieceEncryptionAndSplitting(onDone) {
		
		// collect keypairs and schemes
		var keypairs = [];
		var schemes = [];
		for (var i = 0; i < PLUGINS.length; i++) {
			for (var j = 0; j < PLUGINS[i].getEncryptionSchemes().length; j++) {
				keypairs.push(new CryptoKeypair(PLUGINS[i]));
				schemes.push(PLUGINS[i].getEncryptionSchemes()[j]);
			}
		}
		
		// create piece
		var piece = new CryptoPiece(keypairs);
		var originalPiece = piece.copy();
		
		// test split
		testSplit(piece);
		
		// encrypt piece
		var progressStarted = false;
		var progressComplete = false;
		piece.encrypt(PASSPHRASE, schemes, function(percent) {
			if (percent === 0) progressStarted = true;
			if (percent === 1) progressComplete = true;
		}, function(err, encryptedPiece) {
			
			// test state
			try {
				if (err) throw err;
				assertTrue(progressStarted, "Progress was not started");
				assertTrue(progressComplete, "Progress was not completed");
				assertTrue(piece.isEncrypted());
				assertFalse(piece.isSplit());
				assertNull(piece.getPieceNum());
				
				// test split
				testSplit(encryptedPiece);
			} catch (err) {
				onDone(err)
				return;
			}
			
			// decrypt piece
			progressStarted = false;
			progressCompleted = false;
			piece.decrypt(PASSPHRASE, function(percent) {
				if (percent === 0) progressStarted = true;
				if (percent === 1) progressComplete = true;
			}, function(err, decryptedPiece) {
				
				// test state
				try {
					if (err) throw err;
					assertTrue(progressStarted, "Progress was not started");
					assertTrue(progressComplete, "Progress was not completed");
					assertTrue(piece.equals(originalPiece));
					assertFalse(piece.isEncrypted());
					assertFalse(piece.isSplit());
					assertNull(piece.getPieceNum());
				} catch (err) {
					onDone(err)
					return;
				}
				
				// done testing
				onDone();
			});
		});
	}
	
	function testSplit(keypairs) {
		throw new Error("Not implemented");
	}
}