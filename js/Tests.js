/**
 * Tests the cryptostorage application.
 */
let Tests = {
	
	// constants
	REPEAT_LONG: 10,
	REPEAT_SHORT: 3,
	NUM_PIECES: 3,
	MIN_PIECES: 2,
	PASSPHRASE: "MySuperSecretPassphraseAbcTesting123",
	TEST_PLUGINS: true,
	
	/**
	 * Returns crypto plugins to test.
	 */
	getTestCryptoPlugins: function() {
		let plugins = [];
		plugins.push(new BitcoinPlugin());
		plugins.push(new EthereumPlugin());
		plugins.push(new MoneroPlugin());
		plugins.push(new DashPlugin());
		plugins.push(new LitecoinPlugin());
		return plugins;
	},
	
	/**
	 * Runs all tests.
	 * 
	 * Invokes callback() when done with an error argument if an error occurs.
	 */
	runTests: function(callback) {
		
		// window.crypto required for tests
		if (!window.crypto) throw new Error("Cannot run tests without window.crypto");
		
		// get test plugins
		let plugins = Tests.getTestCryptoPlugins();
		
		// load dependencies
		let dependencies = new Set(APP_DEPENDENCIES);
		for (let i = 0; i < plugins.length; i++) {
			for (let j = 0; j < plugins[i].getDependencies().length; j++) {
				dependencies.add(plugins[i].getDependencies()[j]);
			}
		}
		LOADER.load(Array.from(dependencies), function() {
			
			// verify each plugin has logo data
			for (let i = 0; i < CryptoUtils.getCryptoPlugins().length; i++) {
				getImageData(CryptoUtils.getCryptoPlugins()[i].getTicker());	// throws exception if not found
			}
			
			// run tests
			testUtils();
			testFileImport(plugins, function() {
				testParseKey(plugins);
				for (let i = 0; i < plugins.length;i ++) testSplitAndCombine(plugins[i]);
				if (plugins.length >= 2) testInvalidPiecesToKeys(plugins);
				if (Tests.TEST_PLUGINS) {
					testCryptoPlugins(plugins, function(error) {
						if (callback) callback(error);
					});
				} else {
					if (callback) callback();
				}
			});
		});
		
		function testUtils() {
			
			// test isHex()
			assertFalse(isHex(false));
			assertFalse(isHex(true));
			assertFalse(isHex("hello there"));
			assertTrue(isHex("fcc256cbc5a180831956fba7b9b7de5f521037c39980921ebe6dbd822f791007"));
			assertTrue(isString("abctesting123"));
			assertFalse(isString(null));
			assertFalse(isString(undefined));
			assertFalse(isString(123));
			assertTrue(CryptoUtils.isBase58("abcd"))
			assertFalse(CryptoUtils.isBase58("abcd0"))
			
			// test isBase58()
			for (let i = 0; i < Tests.getTestCryptoPlugins().length; i++) {
				let plugin = Tests.getTestCryptoPlugins()[i];
				let key = plugin.newKey()
				let pieces = plugin.split(key, 3, 2);
				for (let j = 0; j < pieces.length; j++) {
					assertTrue(CryptoUtils.isBase58(pieces[j]));
				}
			}
		}
		
		function testParseKey(plugins) {
			for (let i = 0; i < plugins.length; i++) {
				let plugin = plugins[i];
				
				// parse unencrypted key
				let wif = plugin.newKey().getWif();
				let key = CryptoUtils.parseKey(plugin, wif);
				assertEquals(key.getWif(), wif);
				
				// parse empty key
				try {
					CryptoUtils.parseKey(plugin, "");
					fail("fail");
				} catch (err) {
					if (err.message === "fail") throw new Error("Should not have parsed key from empty string");
				}
				
				// parse whitespace key
				key = CryptoUtils.parseKey(plugin, " ");
				assertNull(key, "Should not have parsed key from whitespace string");
			}
		}
		
		function testKeyExclusion(keys) {
			
			// test exclude public
			let copies = [];
			for (let i = 0; i < keys.length; i++) copies.push(keys[i].copy());
			CryptoUtils.applyKeyConfig(copies, { includePublic: false});
			for (let i = 0; i < copies.length; i++) {
				let key = copies[i];
				assertUninitialized(key.getState().address);
				assertInitialized(key.getState().wif);
				assertInitialized(key.getState().hex);
				assertDefined(key.getState().encryption);
			}
			testKeysToPieces(copies, 1);
			testKeysToPieces(copies, Tests.NUM_PIECES, Tests.MIN_PIECES);
			
			// test exclude private
			copies = [];
			for (let i = 0; i < keys.length; i++) copies.push(keys[i].copy());
			CryptoUtils.applyKeyConfig(copies,  { includePrivate: false});
			for (let i = 0; i < copies.length; i++) {
				let key = copies[i];
				assertInitialized(key.getState().address);
				assertUndefined(key.getState().wif);
				assertUndefined(key.getState().hex);
				assertUndefined(key.getState().encryption);
			}
			testKeysToPieces(copies, 1, null);
			try {
				testKeysToPieces(copies, Tests.NUM_PIECES, Tests.MIN_PIECES);
				fail("fail");
			} catch (err) {
				if (err.message === "fail") throw new Error("Should not have been able to split keys without private components")
			}
		}

		function testCryptoPlugins(plugins, onDone) {
			let funcs = [];
			for (let i = 0; i < plugins.length; i++) funcs.push(function(callback) { testCryptoPlugin(plugins[i], callback); });
			async.series(funcs, onDone);
		}

		function testCryptoPlugin(plugin, onDone) {
			console.log("testCryptoPlugin(" + plugin.getTicker() + ")");
			
			// test plugin
			assertInitialized(plugin.getName());
			assertInitialized(plugin.getTicker());
			assertInitialized(plugin.getLogo());
			assertFalse(plugin.isAddress("invalidAddress123"));
			assertFalse(plugin.isAddress(null));
			assertFalse(plugin.isAddress(undefined));
			assertFalse(plugin.isAddress([]));
			
			// test unencrypted keys
			let keys = [];
			for (let i = 0; i < Tests.REPEAT_LONG; i++) {
				
				// create new key
				let key = plugin.newKey();
				keys.push(key);
				assertInitialized(key.getHex());
				assertInitialized(key.getWif());
				assertNull(key.getEncryptionScheme());
				let copy = key.copy();
				assertTrue(key.equals(copy));
				
				// test address
				assertInitialized(key.getAddress());
				assertTrue(plugin.isAddress(key.getAddress()));
				key.setAddress(key.getAddress());
				try {
					key.setAddress("invalidAddress123");
					fail("fail");
				} catch(err) {
					if (err.message === "fail") throw new Error("Cannot change address of unencrypted key");
				}
				
				// test new key from unencrypted hex and wif
				let key2 = new CryptoKey(plugin, key.getHex());
				assertTrue(key.equals(key2));
				key2 = new CryptoKey(plugin, key.getWif());
				assertTrue(key.equals(key2));
			}
			
			// test excluding keys
			testKeyExclusion(keys);
			
			// test piece conversion with and without splitting
			testKeysToPieces([keys[0]], 1);
			for (let i = 0; i < keys.length; i++) testKeysToPieces([keys[i]], Tests.NUM_PIECES, Tests.MIN_PIECES);
			testKeysToPieces(keys, Tests.NUM_PIECES, Tests.MIN_PIECES);
			
			// test invalid private keys
			let invalids = [" ", "ab", "abctesting123", "abc testing 123", 12345, plugin.newKey().getAddress(), "U2FsdGVkX1+41CvHWzRBzaBdh5Iz/Qu42bV4t0Q5WMeuvkiI7bzns76l6gJgquKcH2GqHjHpfh7TaYmJwYgr3QYzNtNA/vRrszD/lkqR2+uRVABUnfVziAW1JgdccHE", "U2FsdGVkX19kbqSAg6GjhHE+DEgGjx2mY4Sb7K/op0NHAxxHZM34E6eKEBviUp1U9OC6MdG fEOfc9zkAfMTCAvRwoZu36h5tpHl7TKdQvOg3BanArtii8s4UbvXxeGgy", "1ac1f31ddd1ce02ac13cf10b77b42be0aca008faa2f45f223a73d32e261e98013002b3086c88c4fcd8912cd5729d56c2eee2dcd10a8035666f848112fc58317ab7f9ada371b8fc8ac6c3fd5eaf24056ec7fdc785597f6dada9c66c67329a140a"];
			for (let i = 0; i < invalids.length; i++) {
				let invalid = invalids[i];
				try {
					let key = plugin.newKey(invalid);
					fail("fail");
				} catch (err) {
					if (err.message === "fail") throw new Error("Should not create key from invalid input: " + plugin.getTicker() + "(" + invalid + ")");
				}
			}
			
			// parse undefined
			try {
				plugin.newKey(undefined);
				fail("Should have thrown an error");
			} catch (error) { }	
			
			// collect functions to test each encryption scheme
			assertTrue(plugin.getEncryptionSchemes().length >= 1);
			let funcs = [];
			for (let i = 0; i < plugin.getEncryptionSchemes().length; i++) {
				let scheme = plugin.getEncryptionSchemes()[i];
				let max = scheme === CryptoUtils.EncryptionScheme.BIP38 ? Tests.REPEAT_SHORT : Tests.REPEAT_LONG;
				if (max < 1) continue;
				let keys = [];
				for (let i = 0; i < max; i++) keys.push(plugin.newKey());
				funcs.push(function(onDone) { testEncryptKeys(keys, scheme, Tests.PASSPHRASE, onDone); });
			}
			
			// execute encryption tests
			async.parallel(funcs, function(err) {
				if (err) {
					onDone(err);
					return;
				}
				
				// test wrong passphrase decryption
				testDecryptWrongPassphrase(plugin, onDone);
			});
		}
		
		function testEncryptKeys(keys, scheme, passphrase, onDone) {
			assertTrue(keys.length > 0);
			
			// keep originals for later validation
			let originals = copyKeys(keys);
			
			// collect schemes
			let schemes = [];
			for (let i = 0; i < keys.length; i++) schemes.push(scheme);
			
			// encrypt keys
			CryptoUtils.encryptKeys(keys, schemes, passphrase, false, null, function(err, encryptedKeys) {
				if (err) {
					onDone(err);
					return;
				}
				
				// test state of each key
				assertEquals(keys.length, encryptedKeys.length);
				for (let i = 0; i < keys.length; i++) {
					let key = keys[i];
					
					// test basic initialization
					assertObject(key, 'CryptoKey');
					assertTrue(key.isEncrypted());
					assertTrue(key.equals(encryptedKeys[i]));
					assertFalse(key.equals(originals[i]));
					assertInitialized(key.getHex());
					assertInitialized(key.getWif());
					assertEquals(scheme, key.getEncryptionScheme());
					assertTrue(key.equals(key.copy()));
					
					// test address
					assertInitialized(key.getAddress());
					key.setAddress(key.getAddress());
					try {
						key.setAddress("invalidAddress123");
					} catch (err) {
						if (err.message === "fail") throw new Error("Cannot set encrypted key's address to invalid address");
					}
					
					// test new key from encrypted hex and wif
					let key2 = new CryptoKey(key.getPlugin(), key.getHex());
					assertUndefined(key2.getAddress());
					key2.setAddress(key.getAddress());
					assertTrue(key.equals(key2));
					key2 = new CryptoKey(key.getPlugin(), key.getWif());
					assertUndefined(key2.getAddress());
					key2.setAddress(key.getAddress());
					assertTrue(key.equals(key2));
					
					// test consistency
					let parsed = new CryptoKey(key.getPlugin(), key.getHex());
					assertEquals(key.getHex(), parsed.getHex());
					assertEquals(key.getWif(), parsed.getWif());
					assertEquals(key.getEncryptionScheme(), parsed.getEncryptionScheme());
					parsed = new CryptoKey(key.getPlugin(), key.getWif());
					assertEquals(key.getHex(), parsed.getHex());
					assertEquals(key.getWif(), parsed.getWif());
					assertEquals(key.getEncryptionScheme(), parsed.getEncryptionScheme());
				}
				
				// test key exclusion
				testKeyExclusion(keys);
				
				// test piece conversion
				testKeysToPieces([keys[0]], 1);
				for (let i = 0; i < keys.length; i++) testKeysToPieces([keys[i]], Tests.NUM_PIECES, Tests.MIN_PIECES);
				testKeysToPieces(keys, Tests.NUM_PIECES, Tests.MIN_PIECES);
				
				// test decryption with wrong passphrase
				testDecryptKeys([keys[0]], "wrongPassphrase123", function(err) {
					assertEquals("Incorrect passphrase", err.message);
					
					// test decryption
					testDecryptKeys(keys, passphrase, function(err, result) {
						if (err) throw err;
						assertEquals(originals.length, keys.length);
						for (let i = 0; i < originals.length; i++) assertTrue(originals[i].equals(keys[i]));
						onDone();
					});
				});
			});
		}
		
		function testDecryptKeys(keys, passphrase, onDone) {
			assertTrue(keys.length > 0);
			
			// save originals for later
			let originals = [];
			for (let i = 0; i < keys.length; i++) originals.push(keys[i].copy());
			
			// decrypt keys
			CryptoUtils.decryptKeys(keys, passphrase, null, function(err, decryptedKeys) {
				if (err) {
					onDone(err);
					return;
				}
				
				// test state of each key
				assertEquals(keys.length, decryptedKeys.length);
				for (let i = 0; i < keys.length; i++) {
					let key = keys[i];
					
					// test basic initialization
					assertObject(key, 'CryptoKey');
					assertTrue(key.equals(decryptedKeys[i]));
					assertFalse(key.equals(originals[i]));
					assertInitialized(key.getHex());
					assertInitialized(key.getWif());
					assertInitialized(key.getAddress());
					assertNull(key.getEncryptionScheme());
					assertTrue(key.equals(key.copy()));
					
					// test consistency
					let parsed = new CryptoKey(key.getPlugin(), key.getHex());
					assertEquals(key.getHex(), parsed.getHex());
					assertEquals(key.getWif(), parsed.getWif());
					assertEquals(key.getEncryptionScheme(), parsed.getEncryptionScheme());
					parsed = new CryptoKey(key.getPlugin(), key.getWif());
					assertEquals(key.getHex(), parsed.getHex());
					assertEquals(key.getWif(), parsed.getWif());
					assertEquals(key.getEncryptionScheme(), parsed.getEncryptionScheme());
				}
				
				// done
				onDone();
			});
		}
		
		function testDecryptWrongPassphrase(plugin, onDone) {
			let privateKey = "U2FsdGVkX19kbqSAg6GjhHE+DEgGjx2mY4Sb7K/op0NHAxxHZM34E6eKEBviUp1U9OC6MdGfEOfc9zkAfMTCAvRwoZu36h5tpHl7TKdQvOg3BanArtii8s4UbvXxeGgy";
			let key = plugin.newKey(privateKey);
			key.decrypt("abctesting123", function(err, decryptedKey) {
				assertEquals("Incorrect passphrase", err.message);
				onDone();
			});
		}

		function testKeysToPieces(keys, numPieces, minPieces) {
			
			// validate input
			assertTrue(keys.length > 0);
			assertInitialized(numPieces);
			if (numPieces > 1) assertInitialized(minPieces);
			if (minPieces) {
				assertTrue(minPieces <= numPieces);
				assertTrue(minPieces > 1);
			}
			
			// convert keys to pieces
			let pieces = CryptoUtils.keysToPieces(keys, numPieces, minPieces);
			
			// test each share in each piece
			for (let i = 0; i < pieces.length; i++) {
				let piece = pieces[i];
				for (let i = 0; i < keys.length; i++) {
					assertEquals(keys[i].getPlugin().getTicker(), piece.keys[i].ticker);
					assertEquals(keys[i].getAddress(), piece.keys[i].address);
					if (piece.keys[i].wif) {
						assertDefined(piece.keys[i].encryption);
						assertEquals(keys[i].getEncryptionScheme(), piece.keys[i].encryption);
					}
					else assertUndefined(piece.keys[i].encryption);
					if (numPieces > 1) {
						assertNumber(piece.pieceNum);
						assertInt(piece.pieceNum);
						assertTrue(piece.pieceNum > 0);
						assertFalse(keys[i].getWif() === piece.keys[i].wif);
					} else {
						assertUndefined(piece.pieceNum);
						assertTrue(keys[i].getWif() === piece.keys[i].wif);
					}
				}
			}
			
			// verify secrets is initialized with 7 bits
			if (numPieces > 1) {
				for (let i = 0; i < pieces[0].keys.length; i++) {
					let pieceKey = pieces[0].keys[i];
					if (pieceKey.wif && !pieceKey.encryption && pieceKey.ticker === 'BTC') {
						assertTrue(pieceKey.wif.startsWith(minPieces + "c3X"));
					}
				}
			}
			
			// test each piece combination
			let combinations = getCombinations(pieces, minPieces ? minPieces : 1);
			for (let i = 0; i < combinations.length; i++) {
				let combination = combinations[i];
				let keysFromPieces = CryptoUtils.piecesToKeys(pieces);
				assertEquals(keys.length, keysFromPieces.length);
				for (let i = 0; i < keys.length; i++) {
					assertTrue(keys[i].equals(keysFromPieces[i]));
				}
			}
		}

		function testInvalidPiecesToKeys(plugins) {
			assertTrue(plugins.length >= 2);
			
			// collect keys for different currencies
			let keys1 = [];
			let keys2 = [];
			for (let i = 0; i < 10; i++) {
				keys1.push(plugins[0].newKey());
				keys2.push(plugins[1].newKey());
			}
			
			// convert to pieces
			let pieces1 = CryptoUtils.keysToPieces(keys1);
			let pieces2 = CryptoUtils.keysToPieces(keys2);
			
			// try to combine pieces
			try {
				CryptoUtils.piecesToKeys([pieces1[0], pieces2[0]]);
				fail("fail");
			} catch(err) {
				if (err.message === "fail") throw new Error("Cannot get keys from incompatible pieces");
			}
		}

		function copyKeys(keys) {
			let copies = [];
			for (let i = 0; i < keys.length; i++) copies.push(keys[i].copy());
			return copies;
		}
		
		function testSplitAndCombine(plugin) {
			for (let i = 0; i < Tests.REPEAT_LONG; i++) {
				let key = plugin.newKey();
				let pieces = plugin.split(key, Tests.NUM_PIECES, Tests.MIN_PIECES);
				
				// test that single pieces cannot create key
				for (let i = 0; i < pieces.length; i++) {
					try {
						plugin.combine([pieces[i]]);
						throw Error("fail");
					} catch (err) {
						if (err.message === "fail") throw new Error("Cannot combine single pieces");
					}
				}
				
				// test each piece combination
				let combinations = getCombinations(pieces, Tests.MIN_PIECES);
				for (let i = 0; i < combinations.length; i++) {
					let combination = combinations[i];
					let combined = plugin.combine(combination);
					assertTrue(key.equals(combined));
				}
			}
		}
		
		function testFileImport(plugins, onDone) {
			console.log("testFileImport()");
			
			// initialize controller
			let controller = new RecoverFileController($("<div>"));
			controller.render(function() {
				
				// collect test functions
				let funcs = [];
				funcs.push(testOnePieceValidity());
				funcs.push(testIncompatiblePieces());
				funcs.push(testAdditionalPiecesNeeded());
				
				// run test functions
				async.series(funcs, function(err) {
					if (err) throw err;
					onDone();
				});
				
				function testOnePieceValidity() {
					return function(onDone) {
						let piece = {};
						let namedPieces = [];
						namedPieces.push({name: 'piece.json', piece: piece});
						controller.addNamedPieces(namedPieces);
						assertEquals("Invalid piece 'piece.json': piece.version is not defined", controller.getWarning());
						controller.startOver();
						
						piece = { version: "asdf" };
						namedPieces = [];
						namedPieces.push({name: 'piece.json', piece: piece});
						controller.addNamedPieces(namedPieces);
						assertEquals("Invalid piece 'piece.json': piece.version is not a number", controller.getWarning());
						controller.startOver();
						
						piece = { version: 1.0, pieceNum: "asdf" };
						namedPieces = [];
						namedPieces.push({name: 'piece.json', piece: piece});
						controller.addNamedPieces(namedPieces);
						assertEquals("Invalid piece 'piece.json': piece.pieceNum is not an integer", controller.getWarning());
						controller.startOver();
						
						piece = { version: 1.0, pieceNum: 0 };
						namedPieces = [];
						namedPieces.push({name: 'piece.json', piece: piece});
						controller.addNamedPieces(namedPieces);
						assertEquals("Invalid piece 'piece.json': piece.pieceNum is not greater than 0", controller.getWarning());
						controller.startOver();
						
						piece = { version: 1.0 };
						namedPieces = [];
						namedPieces.push({name: 'piece.json', piece: piece});
						controller.addNamedPieces(namedPieces);
						assertEquals("Invalid piece 'piece.json': piece.keys is not defined", controller.getWarning());
						controller.startOver();
						
						piece = { version: 1.0, keys: "asdf"};
						namedPieces = [];
						namedPieces.push({name: 'piece.json', piece: piece});
						controller.addNamedPieces(namedPieces);
						assertEquals("Invalid piece 'piece.json': piece.keys is not an array", controller.getWarning());
						controller.startOver();
						
						piece = { version: 1.0, keys: []};
						namedPieces = [];
						namedPieces.push({name: 'piece.json', piece: piece});
						controller.addNamedPieces(namedPieces);
						assertEquals("Invalid piece 'piece.json': piece.keys is empty", controller.getWarning());
						controller.startOver();
						
						piece = { version: 1.0, keys: [{}]};
						namedPieces = [];
						namedPieces.push({name: 'piece.json', piece: piece});
						controller.addNamedPieces(namedPieces);
						assertEquals("Invalid piece 'piece.json': piece.keys[0].ticker is not defined", controller.getWarning());
						controller.startOver();

						piece = { version: 1.0, keys: [{
							ticker: "BTC",
							wif: "Ky65sCEcvmVWjngwGnRBQEwtZ9kHnZEjsjRkjoa1xAMaDKQrzE2q",
							encryption: null
						}]};
						namedPieces = [];
						namedPieces.push({name: 'piece.json', piece: piece});
						controller.addNamedPieces(namedPieces);
						assertEquals("Invalid piece 'piece.json': piece.keys[0].address is not defined", controller.getWarning());
						controller.startOver();
						
						piece = { version: 1.0, keys: [{
							ticker: "BTC",
							address: "1Gdkr2UhDACVCzz1Xm3mB3j3RFiTBLAT8a",
							encryption: null
						}]};
						namedPieces = [];
						namedPieces.push({name: 'piece.json', piece: piece});
						controller.addNamedPieces(namedPieces);
						assertEquals("Invalid piece 'piece.json': piece.keys[0].wif is not defined", controller.getWarning());
						controller.startOver();
						
						piece = { version: 1.0, keys: [{
							ticker: "BTC",
							address: "1Gdkr2UhDACVCzz1Xm3mB3j3RFiTBLAT8a",
							wif: "Ky65sCEcvmVWjngwGnRBQEwtZ9kHnZEjsjRkjoa1xAMaDKQrzE2q",
						}]};
						namedPieces = [];
						namedPieces.push({name: 'piece.json', piece: piece});
						controller.addNamedPieces(namedPieces);
						assertEquals("Invalid piece 'piece.json': piece.keys[0].encryption is not defined", controller.getWarning());
						controller.startOver();
						
						piece = { version: 1.0, pieceNum: 1, keys: [{
							ticker: "BTC",
							address: "1PshW4gesSamVeZ5uP2C8AipMgsYeQu34X",
							wif: "2c3XyNwGVqDqke6tgWd6RcZTHBW77X1SLrUnR2jGLai9e2hpC",
							encryption: null
						}, {
							ticker: "BTC",
							address: "18Tqw3Mb1MNx7xmh8st7s9zvbEH1NagWWi",
							wif: "3c3XyEvJZiYJRdzCbDrHLU7pyEKBQdJRC6Mk1fb4A1mR79CbV",
							encryption: null
						}]};
						namedPieces = [];
						namedPieces.push({name: 'piece.json', piece: piece});
						controller.addNamedPieces(namedPieces);
						assertEquals("Invalid piece 'piece.json': piece.keys[1].wif has a different minimum threshold prefix", controller.getWarning());
						controller.startOver();
						
						// valid piece
						piece = { version: 1.0, keys: [{
							ticker: "BTC",
							address: "1Gdkr2UhDACVCzz1Xm3mB3j3RFiTBLAT8a",
							wif: "Ky65sCEcvmVWjngwGnRBQEwtZ9kHnZEjsjRkjoa1xAMaDKQrzE2q",
							encryption: null
						}]};
						namedPieces = [];
						namedPieces.push({name: 'piece.json', piece: piece});
						controller.addNamedPieces(namedPieces);
						assertEquals("", controller.getWarning());
						controller.startOver();
						
						onDone();
					}
				}
				
				function testIncompatiblePieces() {
					return function(onDone) {
						
						let pieces1 = getPieces(plugins, 1, 3, 2);
						let pieces2 = getPieces(plugins, 2, 3, 2);
						let namedPieces = [];
						namedPieces.push({name: "piece1.json", piece: pieces1[0]});
						namedPieces.push({name: "piece2.json", piece: pieces2[0]});
						controller.addNamedPieces(namedPieces);
						assertEquals("Pieces contain different number of keys", controller.getWarning());
						controller.startOver();
						
						pieces2 = getPieces(plugins, 1, 3, 2);
						namedPieces = [];
						namedPieces.push({name: "piece1.json", piece: pieces1[0]});
						namedPieces.push({name: "piece2.json", piece: pieces2[0]});
						controller.addNamedPieces(namedPieces);
						assertEquals("Pieces have different addresses", controller.getWarning());
						controller.startOver();
						
						let oldValue = pieces1[1].keys[1].ticker;
						pieces1[1].keys[1].ticker = "ABC";
						namedPieces = [];
						namedPieces.push({name: "piece1.json", piece: pieces1[0]});
						namedPieces.push({name: "piece2.json", piece: pieces1[1]});
						controller.addNamedPieces(namedPieces);
						assertEquals("Pieces are for different cryptocurrencies", controller.getWarning());
						pieces1[1].keys[1].ticker = oldValue;
						controller.startOver();
						
						oldValue = pieces1[1].keys[1].wif;
						for (let i = 0; i < pieces1[1].keys.length; i++) {
							pieces1[1].keys[i].wif = oldValue.replaceAt(0, "3");
						}
						namedPieces = [];
						namedPieces.push({name: "piece1.json", piece: pieces1[0]});
						namedPieces.push({name: "piece2.json", piece: pieces1[1]});
						controller.addNamedPieces(namedPieces);
						assertEquals("Pieces have different minimum threshold prefixes", controller.getWarning());
						pieces1[1].keys[1].wif = oldValue;
						controller.startOver();

						onDone();
					}
				}
				
				function testAdditionalPiecesNeeded() {
					return function(onDone) {
						
						// get pieces
						let pieces = getPieces(plugins, 1, 4, 3);
						
						let namedPieces = [];
						namedPieces.push({name: "piece0.json", piece: pieces[0]});
						controller.addNamedPieces(namedPieces);
						assertEquals("Need 2 additional pieces to recover private keys", controller.getWarning());
						controller.startOver();
						
						namedPieces = [];
						namedPieces.push({name: "piece0.json", piece: pieces[0]});
						namedPieces.push({name: "piece1.json", piece: pieces[1]});
						controller.addNamedPieces(namedPieces);
						assertEquals("Need 1 additional piece to recover private keys", controller.getWarning());
						controller.startOver();
						
						namedPieces = [];
						namedPieces.push({name: "piece0.json", piece: pieces[0]});
						namedPieces.push({name: "piece1.json", piece: pieces[1]});
						namedPieces.push({name: "piece2.json", piece: pieces[2]});
						controller.addNamedPieces(namedPieces);
						assertEquals("", controller.getWarning());
						controller.startOver();
						
						onDone();
					}
				}
				
				function getPieces(plugins, keysPerPlugin, numPieces, minPieces) {
					let keys = [];
					numPieces = numPieces || 1;
					for (let i = 0; i < plugins.length; i++) {
						let plugin = plugins[i];
						for (let i = 0; i < keysPerPlugin; i++) {
							keys.push(plugin.newKey());
						}
					}
					return CryptoUtils.keysToPieces(keys, numPieces, minPieces);
				}
			});
		}
	}
}