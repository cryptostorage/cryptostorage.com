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
		
		// test generate pieces
		testGeneratePieces(PLUGINS);
		
		// test piece initialization
		testPieceInit(PLUGINS);
		
		// test plugins
		var funcs = [];
		for (var i = 0; i < PLUGINS.length; i++) funcs.push(testPluginFunc(PLUGINS[i]));
		function testPluginFunc(plugin) {
			return function(onDone) { testPlugin(plugin, onDone); }
		}
		async.series(funcs, function(err) {
			if (err) {
				onDone(err);
				return;
			}
			
			// tests pass
			onDone();
		});
	}
	
	// --------------------------------- PRIVATE --------------------------------
	
	function getTestPlugins() {
		var plugins = [];
		plugins.push(new BitcoinPlugin());
		plugins.push(new BitcoinCashPlugin());
		plugins.push(new EthereumPlugin());
		plugins.push(new MoneroPlugin());
		plugins.push(new DashPlugin());
		plugins.push(new LitecoinPlugin());
		plugins.push(new ZcashPlugin());
		plugins.push(new RipplePlugin());
		plugins.push(new StellarPlugin());
		plugins.push(new WavesPlugin());
		plugins.push(new NeoPlugin());
		plugins.push(new BIP39Plugin());
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
		piece.encrypt(PASSPHRASE, schemes, function(percent, label) {
			if (percent === 0) progressStarted = true;
			if (percent === 1) progressComplete = true;
			assertEquals("Encrypting", label);
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
				
				// cannot encrypt encrypted piece
				fail("Not implemented");
				
				// test split
				testSplit(encryptedPiece);
			} catch (err) {
				onDone(err)
				return;
			}
			
			// decrypt piece
			progressStarted = false;
			progressCompleted = false;
			piece.decrypt(PASSPHRASE, function(percent, label) {
				if (percent === 0) progressStarted = true;
				if (percent === 1) progressComplete = true;
				assertEquals("Decrypting", label);
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
		
		// cannot encrypt or decrypt split pieces
		fail("Not implemented");
		
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
	
	function testPieceInit(plugins) {
		console.log("Testing piece initialization");
		
		// create piece
		var keypairs = [];
		for (var i = 0; i < plugins.length; i++) keypairs.push(new CryptoKeypair({plugin: plugins[i]}));
		var piece1 = new CryptoPiece({keypairs: keypairs});
		
		// test init from keypairs
		var piece2 = new CryptoPiece({keypairs: keypairs});
		assertTrue(piece1.equals(piece2));
		
		// test init from piece
		piece2 = new CryptoPiece({piece: piece1});
		assertTrue(piece1.equals(piece2));
		for (var i = 0; i < piece1.getKeypairs().length; i++) {
			assertFalse(piece1.getKeypairs()[i] === piece2.getKeypairs()[i]);
		}
		
		// test init from json
		piece2 = new CryptoPiece({json: piece1.toJson()});
		assertTrue(piece1.equals(piece2));
		
		// test init from csv
		piece2 = new CryptoPiece({csv: piece1.toCsv()});
		assertTrue(piece1.equals(piece2));
		
		// test invalid init with pieceNum
		try {
			new CryptoPiece({keypairs: keypairs, pieceNum: 2});
			throw new Error("fail");
		} catch (err) {
			if (err.message === "fail") throw new Error("Should not be able to set pieceNum on unencrypted keys");
		}
		
		// test split
		var splitPieces = piece1.split(3, 2);
		for (var i = 0; i < splitPieces.length; i++) assertEquals(i + 1, splitPieces[i].getPieceNum());
		var splitPiece = new CryptoPiece({piece: splitPieces[0]});
		assertEquals(1, splitPiece.getPieceNum());
		splitPiece = new CryptoPiece({keypairs: splitPieces[0].getKeypairs(), pieceNum: 5});
		assertEquals(5, splitPiece.getPieceNum());
		for (var i = 0; i < splitPiece.getKeypairs(); i++) assertEquals(5, splitPiece.getKeypairs()[i].getShareNum());
		piece2 = new CryptoPiece({splitPieces: splitPieces});
		assertTrue(piece1.equals(piece2));
	}
	
	function testGeneratePieces(plugins) {
		console.log("Testing AppUtils.generatePieces()");
		
		// simple generate config
		var genConfig = {};
		genConfig.keypairs = [];
		for (var i = 0; i < plugins.length; i++) {
			genConfig.keypairs.push({
				ticker: plugins[i].getTicker(),
				numKeypairs: 1
			});
		}
		genConfig.rendererClass = CompactPieceRenderer;
		
		// generate pieces
		var progressStart = false;
		var progressMiddle = false;
		var progressEnd = false;
		var pieces = AppUtils.generatePieces(genConfig, function(percent, label) {
			if (percent === 0) progressStart = true;
			else if (percent === 1) progressEnd = true;
			else if (percent > 0 && percent < 1) progressMiddle = true;
			else throw new Error("Invalid progress percent: " + percent);
			
			// test label
			assertString(label);
			switch (label) {
				case "Generating keypairs":
				case "Encrypting keypairs":
				case "Rendering keypairs":
					break;
				default: throw new Error("Unrecognized progress label: " + label);
			}
		}, function(err, pieces, pieceRenderers) {
			assertNull(err);
			assertEquals(1, pieces.length);
			assertEquals(plugins.length, pieces[0].getKeypairs().length);
			assertEquals(1, pieceRenderers.length);
		});
	}
}