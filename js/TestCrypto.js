/**
 * Tests keypairs and pieces.
 */
function TestCrypto() {
	
	var PLUGINS = getTestPlugins();
	var PASSPHRASE = "MySuperSecretPassphraseAbcTesting123";
	var REPEAT_LONG = 10;
	var REPEAT_SHORT = 2;
	var NUM_PIECES = 3;
	var MIN_PIECES = 2;

	/**
	 * Runs the tests.
	 */
	this.run = function(onDone) {
		
		// test plugins
		var funcs = [];
		for (var i = 0; i < PLUGINS.length; i++) funcs.push(testPluginFunc(PLUGINS[i]));
		function testPluginFunc(plugin) {
			return function(onDone) { testPlugin(plugin, onDone); }
		}
		async.series(funcs, function(err) {
			onDone(err);
		});
	}
	
	// --------------------------------- PRIVATE --------------------------------
	
	function getTestPlugins() {
		var plugins = [];
		plugins.push(new BitcoinPlugin());
//		plugins.push(new BitcoinCashPlugin());
//		plugins.push(new EthereumPlugin());
//		plugins.push(new MoneroPlugin());
//		plugins.push(new DashPlugin());
//		plugins.push(new LitecoinPlugin());
//		plugins.push(new ZcashPlugin());
//		plugins.push(new RipplePlugin());
//		plugins.push(new StellarPlugin());
//		plugins.push(new WavesPlugin());
//		plugins.push(new NeoPlugin());
//		plugins.push(new BIP39Plugin());
		return plugins;
	}
	
	function testPlugin(plugin, onDone) {
		console.log("Testing " + plugin.getTicker() + " plugin");
		testNewKeypairs(plugin);
		testEncryptAndSplit(plugin, function(err) {
			if (err) onDone(err);
			else {
				onDone();
			}
		});
	}
	
	function testNewKeypairs(plugin) {
		for (var j = 0; j < REPEAT_LONG; j++) {
			var keypair = new CryptoKeypair({plugin: plugin});
			assertInitialized(keypair.getPrivateHex());
			assertInitialized(keypair.getPrivateWif());
			assertFalse(keypair.isEncrypted());
			assertNull(keypair.getEncryptionScheme());
			assertFalse(keypair.isSplit());
			assertNull(keypair.getMinShares());
		}
	}
	
	function testEncryptAndSplit(plugin, onDone) {
		
		// collect keypairs and schemes
		var keypairs = [];
		var schemes = [];
		for (var i = 0; i < plugin.getEncryptionSchemes().length; i++) {
			keypairs.push(new CryptoKeypair({plugin: plugin}));
			schemes.push(plugin.getEncryptionSchemes()[i]);
		}
		
		// create piece
		var piece = new CryptoPiece({keypairs: keypairs});
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
				assertTrue(piece === encryptedPiece);
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
		assertObject(piece, CryptoPiece);
		
		// copy original for later testing
		var original = piece.copy();
		assertTrue(original.equals(piece));
		
		// split piece
		var splitPieces = piece.split(NUM_PIECES, MIN_PIECES);
		assertEquals(splitPieces.length, NUM_PIECES);
		for (var i = 0; i < splitPieces.length; i++) {
			assertTrue(splitPieces[i].isSplit());
			assertEquals(i + 1, splitPieces[i].getPieceNum());
			assertEquals(piece.getKeypairs().length, splitPieces[i].getKeypairs().length);
			for (var j = 0; j < piece.getKeypairs().length; j++) {
				assertEquals(piece.getKeypairs()[j].getPublicAddress(), splitPieces[i].getKeypairs()[j].getPublicAddress());
			}
		}
		
		// test that single pieces cannot create key
		for (var i = 0; i < splitPieces.length; i++) {
			try {
				new CryptoPiece({splitPieces: [splitPieces[i]]})
				throw new Error("fail");
			} catch (err) {
				if (err.message === "fail") throw new Error("Cannot combine single split piece");
			}
		}
		
		// test each piece combination
		var combinations = getCombinations(splitPieces, MIN_PIECES);
		for (var i = 0; i < combinations.length; i++) {
			var combination = combinations[i];
			var combined = new CryptoPiece({splitPieces: combination});
			assertTrue(original.equals(combined));
		}
		
		// combine all pieces
		var combined = new CryptoPiece({splitPieces: splitPieces});
		assertTrue(original.equals(combined));
		
		// test split with max shares
		splitPieces = combined.split(AppUtils.MAX_SHARES, AppUtils.MAX_SHARES - 10);
		var combined = new CryptoPiece({splitPieces: splitPieces});
		assertTrue(original.equals(combined));
	}
}