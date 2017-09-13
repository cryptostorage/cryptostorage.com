/**
 * Tests the cryptostorage application.
 */
let Tests = {
	
	// constants
	Tests.REPEAT_LONG: 50,
	Tests.REPEAT_SHORT: 1,
	Tests.NUM_PIECES: 3,
	Tests.MIN_PIECES: 2,
	Tests.PASSWORD: "MySuperSecretTests.PASSWORDAbcTesting123",
	
	runTests: function(callback) {
		
		// window.crypto required for tests
		if (!window.crypto) throw new Error("Cannot run tests without window.crypto");
		
		// get test plugins
		let plugins = CryptoUtils.getTestCryptoPlugins();
		
		// load dependencies
		let dependencies = new Set(COMMON_DEPENDENCIES);
		for (let plugin of plugins) {
			for (let dependency of plugin.getDependencies()) dependencies.add(dependency);
		}
		loader.load(Array.from(dependencies), function() {
			
			// run tests
			Tests.testUtils();
			Tests.testPathTracker();
			if (plugins.length >= 2) Tests.testInvalidPiecesToKeys(plugins);
			Tests.testCryptoKeys(plugins, function(error) {
				if (callback) callback(error);
			});
		})
	},

	testUtils: function() {
	
		// test isHex()
		assertFalse(isHex(false));
		assertFalse(isHex(true));
		assertFalse(isHex("hello there"));
		assertTrue(isHex("fcc256cbc5a180831956fba7b9b7de5f521037c39980921ebe6dbd822f791007"));
		assertTrue(isString("abctesting123"));
		assertFalse(isString(null));
		assertFalse(isString(undefined));
		assertFalse(isString(123));
	},

	testPathTracker: function() {
		var tracker = new PathTracker(onUpdate);
		
		// assert initial state
		assertEquals(-1, tracker.getIndex());
		assertEquals(0, tracker.getItems().length);
		assertFalse(tracker.hasNext());
		assertFalse(tracker.hasPrev());
		assertNull(tracker.current());
		try {
			tracker.next();
			throw new Error("fail");
		} catch (err) {
			if (err.message === "fail") throw err;
		}
		try {
			tracker.prev();
			throw new Error("fail");
		} catch (err) {
			if (err.message === "fail") throw err;
		}
		
		// add item
		tracker.next("1");
		assertEquals("1", tracker.current());
		assertFalse(tracker.hasPrev());
		assertFalse(tracker.hasNext());
		try {
			tracker.next();
			throw new Error("fail");
		} catch (err) {
			if (err.message === "fail") throw new Error("fail");
		}
		try {
			tracker.prev();
			throw new Error("fail");
		} catch (err) {
			if (err.message === "fail") throw new Error("fail");
		}
		
		// add another item
		tracker.next("2");
		assertEquals("2", tracker.current());
		assertTrue(tracker.hasPrev());
		assertFalse(tracker.hasNext());
		assertEquals("1", tracker.prev());
		assertEquals("1", tracker.current());
		assertTrue(tracker.hasNext());
		assertFalse(tracker.hasPrev());
		assertEquals("2", tracker.next());
		assertTrue(tracker.hasPrev());
		assertFalse(tracker.hasNext());
		
		// test current
		try {
			tracker.current("3");
			throw new Error("fail");
		} catch (err) {
			if (err.message === "fail") throw err;
		}
		tracker.current("1");
		assertFalse(tracker.hasPrev());
		assertTrue(tracker.hasNext());
		assertEquals("2", tracker.next());
		assertEquals("3", tracker.next("3"));
		assertFalse(tracker.hasNext());
		assertTrue(tracker.hasPrev());
		assertEquals("2", tracker.prev());
		assertTrue(tracker.hasNext());
		assertTrue(tracker.hasPrev());
		assertEquals("1", tracker.prev());
		assertEquals("2", tracker.next("2"));
		assertTrue(tracker.hasPrev());
		assertFalse(tracker.hasNext());
		
		function onUpdate(lastIdx, curIdx, item) {
			assertNotNull(lastIdx);
			assertNotNull(curIdx);
			assertNotNull(item);
		}
	},

	testCryptoKeys: function(plugins, callback) {
		let funcs = [];
		for (let plugin of plugins) funcs.push(function(callback) { Tests.testCryptoKey(plugin, callback); });
		async.series(funcs, callback);
	},

	testCryptoKey: function(plugin, callback) {
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
		
		// test splitting unencrypted keys
		for (let key of keys) Tests.testKeysToPieces([key], Tests.NUM_PIECES, Tests.MIN_PIECES);
		Tests.testKeysToPieces(keys, Tests.NUM_PIECES, Tests.MIN_PIECES);
		
		// test invalid private keys
		let invalids = ["ab", "abctesting123", "abc testing 123", 12345, plugin.newKey().getAddress(), "1ac1f31ddd1ce02ac13cf10b77b42be0aca008faa2f45f223a73d32e261e98013002b3086c88c4fcd8912cd5729d56c2eee2dcd10a8035666f848112fc58317ab7f9ada371b8fc8ac6c3fd5eaf24056ec7fdc785597f6dada9c66c67329a140a"];
		for (let invalid of invalids) {
			try {
				let key = new CryptoKey(plugin, invalid);
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
		
		// test each encryption scheme
		assertTrue(plugin.getEncryptionSchemes().length >= 1);
		let funcs = [];
		for (let scheme of plugin.getEncryptionSchemes()) {
			let max = scheme === CryptoUtils.EncryptionScheme.BIP38 ? Tests.REPEAT_SHORT : Tests.REPEAT_LONG;
			let keys = [];
			for (let i = 0; i < max; i++) keys.push(plugin.newKey());
			funcs.push(function(callback) { Tests.testEncryptKeys(keys, scheme, Tests.PASSWORD, callback); });
		}
		async.parallel(funcs, callback);
	},

	testEncryptKeys: function(keys, scheme, Tests.PASSWORD, callback) {
		assertTrue(keys.length > 0);
		
		// keep originals for later validation
		let originals = Tests.copyKeys(keys);
		
		// test encryption of all keys
		let funcs = [];
		for (let key of keys) funcs.push(function(callback) { Tests.testEncryptKey(key, scheme, Tests.PASSWORD, callback); });
		async.parallel(funcs, function(err, result) {
			if (err) throw err;
			
			// test splitting encrypted keys
			for (let key of keys) Tests.testKeysToPieces([key], Tests.NUM_PIECES, Tests.MIN_PIECES);
			Tests.testKeysToPieces(keys, Tests.NUM_PIECES, Tests.MIN_PIECES);
			
			// test decryption with wrong Tests.PASSWORD
			Tests.testDecryptKeys([keys[0]], "wrongTests.PASSWORD123", function(err) {
				assertEquals("Incorrect Tests.PASSWORD", err.message);
				
				// test decryption
				Tests.testDecryptKeys(keys, Tests.PASSWORD, function(err, result) {
					if (err) throw err;
					assertEquals(originals.length, keys.length);
					for (let i = 0; i < originals.length; i++) assertTrue(originals[i].equals(keys[i]));
					callback();
				});
			});
		});
	},

	testEncryptKey: function(key, scheme, Tests.PASSWORD, callback) {
		assertObject(key, 'CryptoKey');
		let original = key.copy();
		key.encrypt(scheme, Tests.PASSWORD, function(err, encrypted) {
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
	},

	testDecryptKeys: function(keys, Tests.PASSWORD, callback) {
		assertTrue(keys.length > 0);
		let funcs = [];
		for (let key of keys) funcs.push(function(callback) { Tests.testDecryptKey(key, Tests.PASSWORD, callback); });
		async.parallel(funcs, callback);
	},

	testDecryptKey: function(key, Tests.PASSWORD, callback) {
		assertObject(key, 'CryptoKey');
		let original = key.copy();
		key.decrypt(Tests.PASSWORD, function(err, decrypted) {
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
	},

	testSplit: function(key, numPieces, minPieces) {
		assertInitialized(key);
		assertTrue(numPieces >= 2);
		assertTrue(minPieces >= 2);
		
		// split private key into shares
		let shares = key.getPlugin().split(key, numPieces, minPieces);
		assertEquals(numPieces, shares.length);
		
		// test each share combination
		let combinations = getCombinations(shares, minPieces);
		for (let i = 0; i < combinations.length; i++) {
			let combination = combinations[i];
			let combined = key.getPlugin().combine(combination);
			assertEquals(key.getHex(), combined.getHex());
			assertEquals(key.getWif(), combined.getWif());
			assertEquals(key.getEncryptionScheme(), combined.getEncryptionScheme());
			if (!key.isEncrypted()) assertEquals(key.getAddress(), combined.getAddress());
		}
		
//			// apparently these tests are invalid because shamir's can return some valid hex key without threshold met
//			// test one share which does not meet minimum threshold
//			try {
//				key.getPlugin().newKey(shares[0]);
//				fail("fail");
//			} catch (err) {
//				if (err.message === "fail") throw new Error("Creating key with too few shares should fail");
//			}
	//	
//			// test two shares which does not meet minimum threshold
//			try {
//				let combined = key.getPlugin().combine([shares[0], shares[1]]);
//				console.log(shares);
//				console.log(key.getState());
//				console.log(combined.getState());
//				fail("fail");
//			} catch (err) {
//				if (err.message === "fail") throw new Error("Creating key with too few shares should fail");
//			}
	},

	testKeysToPieces: function(keys, numPieces, minPieces) {
		
		// validate input
		assertTrue(keys.length > 0);
		minPieces = minPieces ? minPieces : 1;
		
		// split keys into pieces
		let pieces = CryptoUtils.keysToPieces(keys, numPieces, minPieces);
		
		// test each share in each piece
		for (let piece of pieces) {
			for (let i = 0; i < keys.length; i++) {
				assertEquals(keys[i].getPlugin().getTicker(), piece[i].crypto);
				assertEquals(keys[i].getAddress(), piece[i].address);
				assertEquals(keys[i].getEncryptionScheme(), piece[i].encryption);
				if (numPieces > 1) {
					assertTrue(piece[i].isSplit);
					assertFalse(keys[i].getWif() === piece[i].privateKey);
				} else {
					assertFalse(piece[i].isSplit);
					asserTrue(keys[i].getWif() === piece[i].privateKey);
				}
			}
		}
		
		// verify secrets is initialized with 7 bits
		if (numPieces > 1) {
			for (let share of pieces[0]) {
				if (!share.encryption && share.crypto === 'BTC') {
					assertTrue(share.privateKey.startsWith("3X"));
				}
			}
		}
		
		// test each piece combination
		let combinations = getCombinations(pieces, minPieces);
		for (let i = 0; i < combinations.length; i++) {
			let combination = combinations[i];
			let keysFromPieces = CryptoUtils.piecesToKeys(pieces);
			assertEquals(keys.length, keysFromPieces.length);
			for (let i = 0; i < keys.length; i++) {
				assertTrue(keys[i].equals(keysFromPieces[i]));
			}
		}
		
//		// apparently these tests are invalid because shamir's can return some valid hex key without threshold met
//		// test keys from one piece which is too few
//		if (minPieces >= 2) {
//			let keysFromPieces = CryptoUtils.piecesToKeys([pieces[0]]);
//			assertEquals(keysFromPieces.length, 0);
//		}
//
//		// test keys from two pieces which is too few
//		if (minPieces >= 3) {
//			keysFromPieces = CryptoUtils.piecesToKeys([pieces[0], pieces[1]]);
//			if (keysFromPieces.length !== 0) {
//				console.log(pieces[0]);
//				console.log(pieces[1]);
//				console.log("Originals:");
//				for (let key of keys) console.log(key.getState());
//				console.log("Pieces to keys:");
//				for (let key of keysFromPieces) console.log(key.getState());
//			}
//			assertEquals(0, keysFromPieces.length);
//		}
	},

	testInvalidPiecesToKeys: function(plugins) {
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
	},

	copyKeys: function(keys) {
		let copies = [];
		for (let key of keys) copies.push(key.copy());
		return copies;
	}
}