/**
 * Tests the cryptostorage application.
 */
let Tests = {
	
	// constants
	REPEAT_LONG: 25,
	REPEAT_SHORT: 1,
	NUM_PIECES: 3,
	MIN_PIECES: 2,
	PASSPHRASE: "MySuperSecretPassphraseAbcTesting123",
	
	/**
	 * Returns crypto plugins to test.
	 */
	getTestCryptoPlugins: function() {
		let plugins = [];
		plugins.push(new BitcoinPlugin());
		plugins.push(new EthereumPlugin());
		plugins.push(new MoneroPlugin());
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
		for (let plugin of plugins) {
			for (let dependency of plugin.getDependencies()) dependencies.add(dependency);
		}
		LOADER.load(Array.from(dependencies), function() {
			
			// verify each plugin has logo data
			for (let plugin of CryptoUtils.getCryptoPlugins()) {
				getImageData(plugin.getTicker());	// throws exception if not found
			}
			
			// run tests
			testUtils();
			testParseKey(plugins);
			for (plugin of plugins) testSplitAndCombine(plugin);
			if (plugins.length >= 2) testInvalidPiecesToKeys(plugins);
			testCryptoKeys(plugins, function(error) {
				if (callback) callback(error);
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
			for (let plugin of Tests.getTestCryptoPlugins()) {
				let key = plugin.newKey()
				let pieces = plugin.split(key, 3, 2);
				for (let piece of pieces) {
					assertTrue(CryptoUtils.isBase58(piece));
				}
			}
		}
		
		function testParseKey(plugins) {
			for (let plugin of plugins) {
				
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
			for (let key of keys) copies.push(key.copy());
			CryptoUtils.applyKeyConfig(copies, { includePublic: false});
			for (let key of copies) {
				assertUninitialized(key.getState().address);
				assertInitialized(key.getState().wif);
				assertInitialized(key.getState().hex);
				assertDefined(key.getState().encryption);
			}
			testKeysToPieces(copies, 1);
			testKeysToPieces(copies, Tests.NUM_PIECES, Tests.MIN_PIECES);
			
			// test exclude private
			copies = [];
			for (let key of keys) copies.push(key.copy());
			CryptoUtils.applyKeyConfig(copies,  { includePrivate: false});
			for (let key of copies) {
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

		function testCryptoKeys(plugins, callback) {
			let funcs = [];
			for (let plugin of plugins) funcs.push(function(callback) { testCryptoKey(plugin, callback); });
			async.series(funcs, callback);
		}

		function testCryptoKey(plugin, callback) {
			console.log("testCryptoKey(" + plugin.getTicker() + ")");
			
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
			for (let key of keys) testKeysToPieces([key], Tests.NUM_PIECES, Tests.MIN_PIECES);
			testKeysToPieces(keys, Tests.NUM_PIECES, Tests.MIN_PIECES);
			
			// test invalid private keys
			let invalids = [" ", "ab", "abctesting123", "abc testing 123", 12345, plugin.newKey().getAddress(), "U2FsdGVkX1+41CvHWzRBzaBdh5Iz/Qu42bV4t0Q5WMeuvkiI7bzns76l6gJgquKcH2GqHjHpfh7TaYmJwYgr3QYzNtNA/vRrszD/lkqR2+uRVABUnfVziAW1JgdccHE", "U2FsdGVkX19kbqSAg6GjhHE+DEgGjx2mY4Sb7K/op0NHAxxHZM34E6eKEBviUp1U9OC6MdG fEOfc9zkAfMTCAvRwoZu36h5tpHl7TKdQvOg3BanArtii8s4UbvXxeGgy", "1ac1f31ddd1ce02ac13cf10b77b42be0aca008faa2f45f223a73d32e261e98013002b3086c88c4fcd8912cd5729d56c2eee2dcd10a8035666f848112fc58317ab7f9ada371b8fc8ac6c3fd5eaf24056ec7fdc785597f6dada9c66c67329a140a"];
			for (let invalid of invalids) {
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
			for (let scheme of plugin.getEncryptionSchemes()) {
				let max = scheme === CryptoUtils.EncryptionScheme.BIP38 ? Tests.REPEAT_SHORT : Tests.REPEAT_LONG;
				if (max < 1) continue;
				let keys = [];
				for (let i = 0; i < max; i++) keys.push(plugin.newKey());
				funcs.push(function(callback) { testEncryptKeys(keys, scheme, Tests.PASSPHRASE, callback); });
			}
			
			// execute encryption tests
			async.parallel(funcs, function(err) {
				if (err) callback(err);
				
				// test wrong passphrase decryption
				testDecryptWrongPassphrase(plugin, callback);
			});
		}

		function testEncryptKeys(keys, scheme, passphrase, callback) {
			assertTrue(keys.length > 0);
			
			// keep originals for later validation
			let originals = copyKeys(keys);
			
			// test encryption of all keys
			let funcs = [];
			for (let key of keys) funcs.push(function(callback) { testEncryptKey(key, scheme, passphrase, callback); });
			async.parallel(funcs, function(err, result) {
				if (err) throw err;
				
				// test key exclusion
				testKeyExclusion(keys);
				
				// test piece conversion
				testKeysToPieces([keys[0]], 1);
				for (let key of keys) testKeysToPieces([key], Tests.NUM_PIECES, Tests.MIN_PIECES);
				testKeysToPieces(keys, Tests.NUM_PIECES, Tests.MIN_PIECES);
				
				// test decryption with wrong passphrase
				testDecryptKeys([keys[0]], "wrongPassphrase123", function(err) {
					assertEquals("Incorrect passphrase", err.message);
					
					// test decryption
					testDecryptKeys(keys, passphrase, function(err, result) {
						if (err) throw err;
						assertEquals(originals.length, keys.length);
						for (let i = 0; i < originals.length; i++) assertTrue(originals[i].equals(keys[i]));
						callback();
					});
				});
			});
		}

		function testEncryptKey(key, scheme, passphrase, callback) {
			assertObject(key, 'CryptoKey');
			let original = key.copy();
			key.encrypt(scheme, passphrase, function(err, encrypted) {
				if (err) callback(err);
				else {
					
					// test basic initialization
					assertTrue(key.isEncrypted());
					assertTrue(key.equals(encrypted));
					assertInitialized(key.getHex());
					assertInitialized(key.getWif());
					assertEquals(scheme, key.getEncryptionScheme());
					assertFalse(key.equals(original));
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
					callback();
				}
			});
		}

		function testDecryptKeys(keys, passphrase, callback) {
			assertTrue(keys.length > 0);
			let funcs = [];
			for (let key of keys) funcs.push(function(callback) { testDecryptKey(key, passphrase, callback); });
			async.parallel(funcs, callback);
		}

		function testDecryptKey(key, passphrase, callback) {
			assertObject(key, 'CryptoKey');
			let original = key.copy();
			key.decrypt(passphrase, function(err, decrypted) {
				if (err) callback(err);
				else {
					
					// test basic initialization
					assertTrue(key.equals(decrypted));
					assertInitialized(key.getHex());
					assertInitialized(key.getWif());
					assertInitialized(key.getAddress());
					assertNull(key.getEncryptionScheme());
					assertFalse(key.equals(original));
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
					callback();
				}
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
			for (let piece of pieces) {
				for (let i = 0; i < keys.length; i++) {
					assertEquals(keys[i].getPlugin().getTicker(), piece.keys[i].ticker);
					assertEquals(keys[i].getAddress(), piece.keys[i].address);
					if (piece.keys[i].wif) {
						assertDefined(piece.keys[i].encryption);
						assertEquals(keys[i].getEncryptionScheme(), piece.keys[i].encryption);
					}
					else assertUndefined(piece.keys[i].encryption);
					if (numPieces > 1) {
						assertTrue(piece.keys[i].split);
						assertFalse(keys[i].getWif() === piece.keys[i].wif);
					} else {
						assertFalse(piece.keys[i].split);
						assertTrue(keys[i].getWif() === piece.keys[i].wif);
					}
				}
			}
			
			// verify secrets is initialized with 7 bits
			if (numPieces > 1) {
				for (let pieceKey of pieces[0].keys) {
					if (pieceKey.wif && !pieceKey.encryption && pieceKey.ticker === 'BTC') {
						assertTrue(pieceKey.wif.startsWith("3X"));
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
			for (let key of keys) copies.push(key.copy());
			return copies;
		}
		
		function testSplitAndCombine(plugin) {
			for (let i = 0; i < Tests.REPEAT_LONG; i++) {
				let key = plugin.newKey();
				let pieces = plugin.split(key, Tests.NUM_PIECES, Tests.MIN_PIECES);
				
				// test that single pieces cannot create key
				for (let piece of pieces) {
					try {
						plugin.combine([piece]);
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
	}
}