/**
 * Tests keypairs and pieces.
 */
function TestCrypto() {
	
	var PASSPHRASE = "MySuperSecretPassphraseAbcTesting123";
	var REPEAT_LONG = 10;
	var REPEAT_SHORT = 2;
	var NUM_PIECES = 3;
	var MIN_PIECES = 2;
	var INVALID_PKS = [" ", "ab", "abctesting123", "abc testing 123", 12345, "U2FsdGVkX1+41CvHWzRBzaBdh5Iz/Qu42bV4t0Q5WMeuvkiI7bzns76l6gJgquKcH2GqHjHpfh7TaYmJwYgr3QYzNtNA/vRrszD/lkqR2+uRVABUnfVziAW1JgdccHE", "U2FsdGVkX19kbqSAg6GjhHE+DEgGjx2mY4Sb7K/op0NHAxxHZM34E6eKEBviUp1U9OC6MdG fEOfc9zkAfMTCAvRwoZu36h5tpHl7TKdQvOg3BanArtii8s4UbvXxeGgy", "7ac1f31ddd1ce02ac13cf10b77b42be0aca008faa2f45f223a73d32e261e98013002b3086c88c4fcd8912cd5729d56c2eee2dcd10a8035666f848112fc58317ab7f9ada371b8fc8ac6c3fd5eaf24056ec7fdc785597f6dada9c66c67329a140a", "3b20836520fe2e8eef1fd3f898fd97b5a3bcb6702fae72e3ca1ba8fb6e1ddd75b12f74dc6422606d1750e40"];

	/**
	 * Runs the tests.
	 */
	this.run = function(onDone) {
		var plugins = getTestPlugins();
		
		// test utils
		testUtils();
		
		// test new keypairs
		console.log("Testing keypair creation");
		for (var i = 0; i < plugins.length; i++) {
			testPlugin(plugins[i]);
			testKeypairs(plugins[i]);
		}
		
		// test generate pieces
		testGeneratePieces(plugins, function(err) {
			if (err) throw err;
			
			// test piece encryption and splitting
			testPieceEncryption(plugins, function(err) {
				if (err) throw err;
				onDone();
			});
		});
	}
	
	// --------------------------------- PRIVATE --------------------------------
	
	function getTestPlugins() {
		var plugins = [];
		plugins.push(new BitcoinPlugin());
		//plugins.push(new BitcoinCashPlugin());
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
	
	function testUtils() {
		assertTrue(isString("abctesting123"));
		assertFalse(isString(null));
		assertFalse(isString(undefined));
		assertFalse(isString(123));
		
		// test valid versions
		var validVersions = [[0, 0, 1], [12, 23, 4], [16, 1, 5]];
		for (var i = 0; i < validVersions.length; i++) {
			var versionNumbers = AppUtils.getVersionNumbers(validVersions[i][0] + "." + validVersions[i][1] + "." + validVersions[i][2]);
			for (var j = 0; j < validVersions[0].length; j++) {
				assertEquals(validVersions[i][j], versionNumbers[j], "Unexpected version number at [" + i + "][" + j + "]: " + validVersions[i][j] + " vs " + versionNumbers[j]);
			}
		}
		
		// test invalid versions
		var invalidVersions = ["3.0.1.0", "3.0.-1", "3.0", "4", "asdf", "4.f.2", "0.0.0"];
		for (var i = 0; i < invalidVersions.length; i++) {
			try {
				AppUtils.getVersionNumbers(invalidVersions[i]);
				throw new Error("fail");
			} catch (err) {
				if (err.message === "fail") throw new Error("Should have thrown exception on version string: " + invalidVersions[i]);
			}
		}
		
		// test base encoding
		assertFalse(isHex(false));
		assertFalse(isHex(true));
		assertFalse(isHex("hello there"));
		assertTrue(isBase58("abcd"))
		assertFalse(isBase58("abcd0"))
		assertTrue(isHex("fcc256cbc5a180831956fba7b9b7de5f521037c39980921ebe6dbd822f791007"));
		var keypair = new CryptoKeypair({plugin: getTestPlugins()[0]});
		var bases = [16, 58, 64];
		var converted = keypair.getPrivateHex();
		for (var i = 0; i < bases.length; i++) {
			if (i === bases.length - 1) {
				converted = AppUtils.toBase(bases[i], bases[0], converted);
				assertEquals(keypair.getPrivateHex(), converted);
			} else {
				converted = AppUtils.toBase(bases[i], bases[i + 1], converted)
			}
		}
		bases = [16, 64, 58];
		converted = keypair.getPrivateHex();
		for (var i = 0; i < bases.length; i++) {
			if (i === bases.length - 1) {
				converted = AppUtils.toBase(bases[i], bases[0], converted);
				assertEquals(keypair.getPrivateHex(), converted);
			} else {
				converted = AppUtils.toBase(bases[i], bases[i + 1], converted)
			}
		}
	}
	
	function testPlugin(plugin) {
		assertInitialized(plugin.getName());
		assertInitialized(plugin.getTicker());
		assertInitialized(plugin.getLogo());
		
		// test invalid addresses
		assertFalse(plugin.isAddress("invalidAddress123"));
		assertFalse(plugin.isAddress(null));
		plugin.hasPublicAddress() ? assertFalse(plugin.isAddress(undefined)) : assertTrue(plugin.isAddress(undefined));
		assertFalse(plugin.isAddress([]));
		
		// test decode invalid private keys
		var invalids = copyArray(INVALID_PKS);
		invalids.push(new CryptoKeypair({plugin: plugin}).getPublicAddress());
		for (var i = 0; i < invalids.length; i++) {
			var invalid = invalids[i];
			if (isString(invalid)) {
				assertNull(plugin.decode(invalid));	
			} else {
				try {
					plugin.decode(invalid);
					fail("fail");
				} catch (err) {
					if (err.message === "fail") throw new Error(plugin.getTicker() + " should throw exception if decoding non-string");
				}
			}
		}
	}
	
	function testKeypairs(plugin) {
		
		// create new keypairs
		for (var i = 0; i < REPEAT_LONG; i++) {
			var keypair = new CryptoKeypair({plugin: plugin});
			assertInitialized(keypair.getPrivateHex());
			assertInitialized(keypair.getPrivateWif());
			assertFalse(keypair.isEncrypted());
			assertNull(keypair.getEncryptionScheme());
			assertFalse(keypair.isSplit());
			assertNull(keypair.getMinShares());
			assertTrue(plugin.isAddress(keypair.getPublicAddress()));
		}
		
		// test invalid private keys
		// TODO: CryptoKey sometimes accepts invalid PKs because of split/encryption encoding
//		var invalids = copyArray(INVALID_PKS);
//		invalids.push(new CryptoKeypair({plugin: plugin}).getPublicAddress());
//		for (var i = 0; i < invalids.length; i++) {
//			var invalid = invalids[i];
//			try {
//				new CryptoKeypair({plugin: plugin, privateKey: invalid});
//				fail("fail");
//			} catch (err) {
//				if (err.message === "fail") throw new Error("Should not create " + plugin.getTicker() + " keypair from invalid input: " + invalid);
//			}
//		}
	}
	
	function testPieceEncryption(plugins, onDone) {
		
		// collect test functions
		var testFuncs = [];
		for (var i = 0; i < plugins.length; i++) {
			testFuncs.push(testFunc(plugins[i]));
		}
		function testFunc(plugin) {
			return function(onDone) {
				testPieceEncryptionPlugin(plugin, onDone);
			}
		}
		
		// execute test functions
		async.series(testFuncs, function(err) {
			if (err) throw err;
			onDone();
		});
		
		function testPieceEncryptionPlugin(plugin, onDone) {
			console.log("Testing " + plugin.getTicker() + " encryption and splitting");
			
			// collect keypair per encryption scheme
			var keypairs = [];
			var schemes = [];
			for (var i = 0; i < plugin.getEncryptionSchemes().length; i++) {
				keypairs.push(new CryptoKeypair({plugin: plugin}));
				schemes.push(plugin.getEncryptionSchemes()[i]);
			}
			
			// create piece from keypairs
			var piece = new CryptoPiece({keypairs: keypairs});
			var original = piece.copy();
			
			// test piece
			assertFalse(piece.isEncrypted());
			assertFalse(piece.isSplit());
			testPieceWithoutEncryption(piece);
			
			// encrypt piece
			var progressStarted = false;
			var progressComplete = false;
			var lastPercent = 0;
			piece.encrypt(PASSPHRASE, schemes, function(percent, label) {
				if (percent === 0) progressStarted = true;
				if (percent === 1) progressComplete = true;
				assertEquals("Encrypting keypairs", label);
				assertTrue(percent >= lastPercent);
				lastPercent = percent;
			}, function(err, encryptedPiece) {
				if (err) throw err;
				
				// test state
				assertTrue(piece === encryptedPiece);
				assertTrue(progressStarted, "Progress was not started");
				assertTrue(progressComplete, "Progress was not completed");
				assertTrue(piece.isEncrypted());
				assertFalse(piece.isSplit());
				assertNull(piece.getPieceNum());
				testPieceWithoutEncryption(encryptedPiece);
				
				// cannot encrypt encrypted piece
				try {
					piece.encrypt(PASSPHRASE, schemes, function(percent, label) {}, function(err, encryptedPiece) { fail("fail"); });
					fail("fail");
				} catch (err) {
					if (err.message === "fail") throw new Error("Cannot encrypt encrypted piece");
				}
				
				// decrypt with wrong password
				piece.decrypt("wrongPassphrase123", function(percent, label) {}, function(err, decryptedPiece) {
					assertInitialized(err);
					assertEquals("Incorrect passphrase", err.message);
					assertUndefined(decryptedPiece);
					
					// decrypt piece
					progressStarted = false;
					progressCompleted = false;
					piece.decrypt(PASSPHRASE, function(percent, label) {
						if (percent === 0) progressStarted = true;
						if (percent === 1) progressComplete = true;
						assertEquals("Decrypting", label);
					}, function(err, decryptedPiece) {
						if (err) throw err;
						
						// test state
						assertTrue(progressStarted, "Progress was not started");
						assertTrue(progressComplete, "Progress was not completed");
						assertTrue(piece.equals(original));
						assertFalse(piece.isEncrypted());
						assertFalse(piece.isSplit());
						assertNull(piece.getPieceNum());
						
						// done testing
						onDone();
					});
				});
			});
		}
	}
	
	// tests piece splitting, initialization, and conversion
	function testPieceWithoutEncryption(piece) {
		assertObject(piece, CryptoPiece);
		if (piece.isSplit() === false) testPieceSplit(piece);
		testPieceState(piece);
		testPieceInit(piece);
		testPieceRemoval(piece);
	}
	
	function testPieceSplit(unsplitPiece) {
		assertObject(unsplitPiece, CryptoPiece);
		assertFalse(unsplitPiece.isSplit());
		
		// copy original for later testing
		var original = unsplitPiece.copy();
		assertTrue(original.equals(unsplitPiece));
		
		// split piece
		var splitPieces = unsplitPiece.split(NUM_PIECES, MIN_PIECES);
		assertEquals(splitPieces.length, NUM_PIECES);
		for (var i = 0; i < splitPieces.length; i++) {
			
			// test split piece state
			testPieceState(splitPieces[i]);
			assertTrue(splitPieces[i].isSplit());
			assertEquals(i + 1, splitPieces[i].getPieceNum());
			assertEquals(unsplitPiece.getKeypairs().length, splitPieces[i].getKeypairs().length);
			
			// test that public addresses are equal
			for (var j = 0; j < unsplitPiece.getKeypairs().length; j++) {
				assertEquals(unsplitPiece.getKeypairs()[j].getPublicAddress(), splitPieces[i].getKeypairs()[j].getPublicAddress());
			}
		}
		
		// cannot encrypt split pieces
		try {
			splitPieces[0].encrypt(PASSPHRASE, [], function(percent, label) {}, function(err, encryptedPiece) { fail("fail"); });
			fail("fail");
		} catch (err) {
			if (err.message === "fail") throw new Error("Cannot encrypt split unsplitPiece");
		}
		
		// cannot split split piece
		try {
			var temps = splitPieces[0].split(NUM_PIECES, MIN_PIECES);
			fail("fail");
		} catch (err) {
			if (err.message === "fail") throw new Error("Cannot split split piece");
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
			if (!original.hasPublicAddresses()) combined.removePublicAddresses();
			assertTrue(original.equals(combined));
		}
		
		// combine all pieces
		var combined = new CryptoPiece({splitPieces: splitPieces});
		if (!original.hasPublicAddresses()) combined.removePublicAddresses();
		assertTrue(original.equals(combined));
		
		// test split with max shares
		splitPieces = combined.split(AppUtils.MAX_SHARES, AppUtils.MAX_SHARES - 10);
		var combined = new CryptoPiece({splitPieces: splitPieces});
		if (!original.hasPublicAddresses()) combined.removePublicAddresses();
		assertTrue(original.equals(combined));
	}
	
	function testPieceState(piece) {
		for (var i = 0; i < piece.getKeypairs().length; i++) {
			testKeypairState(piece.getKeypairs()[i]);
		}
	}
	
	function testKeypairState(keypair) {
		assertInitialized(keypair.getPlugin());
		
		// test split keypair
		if (keypair.isSplit()) {
			assertInitialized(keypair.getPrivateHex());
			assertInitialized(keypair.getPrivateWif());
			assertEquals(undefined, keypair.isEncrypted());
			assertEquals(undefined, keypair.getEncryptionScheme());
			assertNumber(keypair.getMinShares());
			assertTrue(keypair.getMinShares() >= 2);
			assertTrue(keypair.getMinShares() <= AppUtils.MAX_SHARES);
			if (keypair.isPublicApplicable()) assertTrue(keypair.getPublicAddress() === undefined || isInitialized(keypair.getPublicAddress()));
			else assertUndefined(keypair.getPublicAddress());
		}
		
		// test encrypted keypair
		else if (keypair.isEncrypted()) {
			assertFalse(keypair.isSplit());
			assertNull(keypair.getMinShares());
			assertNull(keypair.getShareNum());
			if (keypair.isPublicApplicable()) assertTrue(keypair.getPublicAddress() === undefined || isInitialized(keypair.getPublicAddress()));
			else assertUndefined(keypair.getPublicAddress());
		}
		
		// test unencrypted keypair
		else if (keypair.isEncrypted() === false) {
			assertInitialized(keypair.getPrivateHex());
			assertInitialized(keypair.getPrivateWif());
			assertFalse(keypair.isEncrypted());
			assertNull(keypair.getEncryptionScheme());
			assertFalse(keypair.isSplit());
			assertNull(keypair.getMinShares());
			if (!keypair.isPublicApplicable()) assertUndefined(keypair.getPublicAddress());
		}
		
		// test keypair without private keys
		else if (!keypair.hasPrivateKey()) {
			assertUndefined(keypair.getPrivateHex());
			assertUndefined(keypair.getPrivateWif());
			assertUndefined(keypair.isEncrypted());
			assertUndefined(keypair.getEncryptionScheme());
			assertUndefined(keypair.isSplit());
			assertUndefined(keypair.getMinShares());
			keypair.isPublicApplicable() ? assertInitialized(keypair.getPublicAddress()) : assertUndefined(keypair.getPublicAddress());
		}
		
		// invalid state
		else {
			console.log(keypair.toJson());
			throw new Error("Keypair has invalid state");
		}
	}
	
	function testPieceInit(piece) {
		assertObject(piece, CryptoPiece);
		
		// test init from keypairs
		var piece2 = new CryptoPiece({keypairs: piece.getKeypairs()});
		assertTrue(piece.equals(piece2));
		
		// test init from piece
		piece2 = new CryptoPiece({piece: piece});
		assertTrue(piece.equals(piece2));
		for (var i = 0; i < piece.getKeypairs().length; i++) {
			assertFalse(piece.getKeypairs()[i] === piece2.getKeypairs()[i]);
		}
		
		// test init from split pieces
		if (piece.isSplit() === false) {
			var splitPieces = piece.split(3, 2);
			for (var i = 0; i < splitPieces.length; i++) assertEquals(i + 1, splitPieces[i].getPieceNum());
			var splitPiece = new CryptoPiece({piece: splitPieces[0]});
			assertEquals(1, splitPiece.getPieceNum());
			splitPiece = new CryptoPiece({keypairs: splitPieces[0].getKeypairs(), pieceNum: 5});
			assertEquals(5, splitPiece.getPieceNum());
			for (var i = 0; i < splitPiece.getKeypairs(); i++) assertEquals(5, splitPiece.getKeypairs()[i].getShareNum());
			piece2 = new CryptoPiece({splitPieces: splitPieces});
			if (!piece.hasPublicAddresses()) piece2.removePublicAddresses();
			assertTrue(piece.equals(piece2));
		}
		
		// test init with invalid pieceNum
		try {
			new CryptoPiece({keypairs: keypairs, pieceNum: 2});
			throw new Error("fail");
		} catch (err) {
			if (err.message === "fail") throw new Error("Should not be able to set pieceNum on unencrypted keys");
		}
		
		// test json conversion
		piece2 = new CryptoPiece({json: piece.toJson()});
		if (!piece.hasPublicAddresses()) piece2.removePublicAddresses();
		assertTrue(piece.equals(piece2));
		
		// test csv conversion
		piece2 = new CryptoPiece({csv: piece.toCsv()});
		if (!piece.hasPublicAddresses()) piece2.removePublicAddresses();
		assertTrue(piece.equals(piece2));
		
		// test txt conversion
		assertString(piece.toTxt());
//		piece2 = new CryptoPiece({txt: piece.toTxt()});	// TODO
//		if (!piece.hasPublicAddresses()) piece2.removePublicAddresses();
//		assertTrue(piece.equals(piece2));
	}
	
	function testPieceRemoval(piece) {
		assertObject(piece, CryptoPiece);
		
		// determine if public addresses apply to any keypairs
		var anyPublicsApply = false;
		for (var i = 0; i < piece.getKeypairs().length; i++) {
			if (piece.getKeypairs()[i].isPublicApplicable()) {
				anyPublicsApply = true;
				break;
			}
		}
		
		// don't test removal if public or private missing
		if (!piece.hasPrivateKeys()) return;
		if (!piece.hasPublicAddresses() && anyPublicsApply) return;
		
		// test remove public addresses
		var modified = piece.copy();
		modified.removePublicAddresses();
		for (var i = 0; i < modified.getKeypairs().length; i++) {
			var keypair = modified.getKeypairs()[i];
			assertUndefined(keypair.getPublicAddress());
			assertTrue(keypair.hasPrivateKey());
			testKeypairState(keypair);
			if (piece.getPieceNum()) assertEquals(piece.getPieceNum(), modified.getPieceNum());
		}
		if (anyPublicsApply) testPieceWithoutEncryption(modified);
		
		// test remove private keys
		modified = piece.copy();
		modified.removePrivateKeys();
		for (var i = 0; i < modified.getKeypairs().length; i++) {
			var keypair = modified.getKeypairs()[i];
			keypair.isPublicApplicable() ? assertDefined(keypair.getPublicAddress()) : assertUndefined(keypair.getPublicAddress());
			assertFalse(keypair.hasPrivateKey());
			assertUndefined(keypair.isEncrypted());
			assertUndefined(keypair.getMinShares());
			assertUndefined(keypair.getShareNum());
			testKeypairState(keypair);
		}
		if (anyPublicsApply) testPieceWithoutEncryption(modified);
	}
	
	function testGeneratePieces(plugins, onDone) {
		console.log("Testing generating pieces from config");
		
		// simple config
		var config = {};
		config.keypairs = [];
		for (var i = 0; i < plugins.length; i++) {
			config.keypairs.push({
				ticker: plugins[i].getTicker(),
				numKeypairs: 1
			});
		}
		config.pieceRendererClass = CompactPieceRenderer;
		testGenerateConfig(config, function(err) {
			if (err) {
				onDone(err);
				return;
			}
			
			// config with encryption and split
			config.passphrase = PASSPHRASE;
			for (var i = 0; i < config.keypairs.length; i++) {
				config.keypairs[i].encryptionScheme = AppUtils.EncryptionScheme.V0_CRYPTOJS;
			}
			config.numPieces = NUM_PIECES;
			config.minPieces = MIN_PIECES;
			testGenerateConfig(config, function(err) {
				if (err) {
					onDone(err);
					return;
				}
				onDone();
			});
		});
		
		function testGenerateConfig(config, onDone) {
			
			// generate pieces
			var progressStart = false;
			var progressMiddle = false;
			var progressEnd = false;
			var lastPercent = 0;
			var generator = new PieceGenerator(config);
			generator.generatePieces(function(percent, label) {
				if (percent === 0) progressStart = true;
				else if (percent === 1) progressEnd = true;
				else if (percent > 0 && percent < 1) progressMiddle = true;
				else throw new Error("Invalid progress percent: " + percent);
				
				// assert percent increases
				assertTrue(percent >= lastPercent, "Percent " + percent + " is less than last percent " + lastPercent);
				lastPercent = percent;
				
				// test label
				assertString(label);
				switch (label) {
					case "Generating keypairs":
					case "Encrypting keypairs":
					case "Rendering keypairs":
						break;
					default: throw new Error("Unrecognized progress label: " + label);
				}
			}, function (err, pieces, pieceRenderers) {
				assertNull(err);
				if (config.numPieces) {
					assertEquals(config.numPieces, pieces.length);
					assertEquals(config.numPieces, pieceRenderers.length);
				} else {
					assertEquals(1, pieces.length);
					assertEquals(1, pieceRenderers.length);
				}
				assertEquals(plugins.length, pieces[0].getKeypairs().length);
				for (var i = 0; i < pieceRenderers.length; i++) assertInitialized(pieceRenderers[i].getDiv());
				assertTrue(progressStart);
				assertTrue(progressMiddle);
				assertTrue(progressEnd);
				onDone();
			});
		}
	}
}