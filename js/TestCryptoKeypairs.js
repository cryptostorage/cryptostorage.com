/**
 * Tests keypairs and pieces.
 */
function TestCryptoKeypairs() {
	
	var PLUGINS = [AppUtils.getCryptoPlugin("BTC"), AppUtils.getCryptoPlugin("BCH")];
	var PASSPHRASE = "MySuperSecretPassphraseAbcTesting123";
	var REPEAT_LONG = 10;
	var REPEAT_SHORT = 2;
	var NUM_PIECES = 3;
	var MIN_PIECES = 2;

	/**
	 * Runs the tests.
	 */
	this.run = function(onDone) {
		
		// test new keypairs
		try {
			testNewKeypairs();
		} catch (err) {
			onDone(err);
			return;
		}
		
		// test encryption and splitting
		testEncryptAndSplit(function(err) {
			if (err) {
				onDone(err);
				return;
			}
			
			// tests pass
			onDone();
		});
	}
	
	// --------------------------------- PRIVATE --------------------------------
	
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
	
	function testEncryptAndSplit(onDone) {
		
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
	
	function testSplit(piece) {
		
		// copy original for later testing
		var original = piece.copy();
		
		// split piece
		var splitPieces = piece.split(NUM_PIECES, MIN_PIECES);
		assertEqual(splitPieces.length, NUM_PIECES);
		for (var i = 0; i < splitPieces.length; i++) {
			assertTrue(splitPieces[i].isSplit());
			assertEquals(i + 1, splitPieces[i].getPieceNum());
		}
		
		// test that single pieces cannot create key
		for (var i = 0; i < splitPieces.length; i++) {
			try {
				new CryptoPiece(null, null, [splitPieces[i]]);
				throw new Error("fail");
			} catch (err) {
				if (err.message === "fail") throw new Error("Cannot combine single split piece");
			}
		}
		
		// TODO
			
//			// test each piece combination
//			var combinations = getCombinations(pieces, Tests.MIN_PIECES);
//			for (var j = 0; j < combinations.length; j++) {
//				var combination = combinations[j];
//				var combined = plugin.combine(combination);
//				assertTrue(key.equals(combined));
//			}
//		}
//		
//		// test split with max shares
//		var key = plugin.newKey();
//		var pieces = plugin.split(key, AppUtils.MAX_SHARES, AppUtils.MAX_SHARES);
//		var combined = plugin.combine(pieces);
//		assertTrue(key.equals(combined));
		
		throw new Error("Not implemented");
	}
}