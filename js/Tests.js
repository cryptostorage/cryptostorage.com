const REPEAT_LONG = 50;
const REPEAT_SHORT = 1;
const NUM_PIECES = 3;
const MIN_PIECES = 2;
const PASSWORD = "MySuperSecretPasswordAbcTesting123";
var counter = 0;

function runTests(callback) {
	testUtils();
	testPathTracker();
	testCryptoKeys(getTestCryptoPlugins(), function(error) {
		if (callback) callback(error);
	});
}

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
}

function testPathTracker() {
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
}

function testCryptoKeys(plugins, callback) {
	let funcs = [];
	for (let plugin of plugins) funcs.push(function(callback) { testCryptoKey(plugin, callback); });
	async.series(funcs, callback);
}

function testCryptoKey(plugin, callback) {
	console.log("testCryptoKey(" + plugin.getTickerSymbol() + ")");
	
	// test plugin
	assertInitialized(plugin.getName());
	assertInitialized(plugin.getTickerSymbol());
	assertInitialized(plugin.getLogo());
	assertFalse(plugin.isAddress("invalidAddress123"));
	assertFalse(plugin.isAddress(null));
	assertFalse(plugin.isAddress(undefined));
	assertFalse(plugin.isAddress([]));
	
	// test unencrypted keys
	let keys = [];
	for (let i = 0; i < REPEAT_LONG; i++) {
		
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
	for (let key of keys) testKeysToPieces([key], NUM_PIECES, MIN_PIECES);
	testKeysToPieces(keys, NUM_PIECES, MIN_PIECES);
	
	// test invalid private keys
	let invalids = [null, "abctesting123", "abc testing 123", 12345, plugin.newKey().getAddress()];
	for (let invalid of invalids) {
		try {
			new CryptoKey(plugin, invalid);
			fail("Should have thrown an error");
		} catch (error) { }
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
		let max = scheme === EncryptionScheme.BIP38 ? REPEAT_SHORT : REPEAT_LONG;
		let keys = [];
		for (let i = 0; i < max; i++) keys.push(plugin.newKey());
		funcs.push(function(callback) { testEncryptKeys(keys, scheme, PASSWORD, callback); });
	}
	async.parallel(funcs, callback);
}

function testEncryptKeys(keys, scheme, password, callback) {
	assertTrue(keys.length > 0);
	
	// keep originals for later validation
	let originals = copyKeys(keys);
	
	// test encryption of all keys
	let funcs = [];
	for (let key of keys) funcs.push(function(callback) { testEncryptKey(key, scheme, password, callback); });
	async.parallel(funcs, function() {
		
		// test splitting encrypted keys
		for (let key of keys) testKeysToPieces([key], NUM_PIECES, MIN_PIECES);
		testKeysToPieces(keys, NUM_PIECES, MIN_PIECES);
		
		// test decryption with wrong password
		testDecryptKeys([keys[0]], "wrongPassword123", function(err) {
			assertEquals("Incorrect password", err.message);
			
			// test decryption
			testDecryptKeys(keys, password, function() {
				if (!originals) throw new Error("Originals is not defined fool!!!!");
				assertEquals(originals.length, keys.length);
				for (let i = 0; i < originals.length; i++) assertTrue(originals[i].equals(keys[i]));
				callback();
			});
		});
	});
}

function testEncryptKey(key, scheme, password, callback) {
	assertObject(key, 'CryptoKey');
	let original = key.copy();
	key.encrypt(scheme, password, function(encrypted, err) {
		if (err) callback(err);
		else {
			
			// test basic initialization
			assertTrue(key.isEncrypted());
			assertTrue(key.equals(encrypted));
			assertInitialized(key.getHex());
			assertInitialized(key.getWif());
			assertEquals(scheme, key.getEncryptionScheme());
			if (!original) throw new Error("Original is not defined fool");
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

function testDecryptKeys(keys, password, callback) {
	assertTrue(keys.length > 0);
	let funcs = [];
	for (let key of keys) funcs.push(function(callback) { testDecryptKey(key, password, callback); });
	async.parallel(funcs, callback);
}

function testDecryptKey(key, password, callback) {
	assertObject(key, 'CryptoKey');
	let original = key.copy();
	key.decrypt(password, function(decrypted, err) {
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

function testSplit(key, numPieces, minPieces) {
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
	
//	// apparently these tests are invalid because shamir's can return some valid hex key without threshold met
//	// test one share which does not meet minimum threshold
//	try {
//		key.getPlugin().newKey(shares[0]);
//		fail("fail");
//	} catch (err) {
//		if (err.message === "fail") throw new Error("Creating key with too few shares should fail");
//	}
//	
//	// test two shares which does not meet minimum threshold
//	try {
//		let combined = key.getPlugin().combine([shares[0], shares[1]]);
//		console.log(shares);
//		console.log(key.getState());
//		console.log(combined.getState());
//		fail("fail");
//	} catch (err) {
//		if (err.message === "fail") throw new Error("Creating key with too few shares should fail");
//	}
}

function testKeysToPieces(keys, numPieces, minPieces) {
	
	// validate input
	assertTrue(keys.length > 0);
	minPieces = minPieces ? minPieces : 1;
	
	// split keys into pieces
	let pieces = keysToPieces(keys, numPieces, minPieces);
	
	// test each share in each piece
	for (let piece of pieces) {
		for (let i = 0; i < keys.length; i++) {
			assertEquals(keys[i].getPlugin().getTickerSymbol(), piece[i].crypto);
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
		let keysFromPieces = piecesToKeys(pieces);
		assertEquals(keys.length, keysFromPieces.length);
		for (let i = 0; i < keys.length; i++) {
			assertTrue(keys[i].equals(keysFromPieces[i]));
		}
	}
	
//	// apparently these tests are invalid because shamir's can return some valid hex key without threshold met
//	// test keys from one piece which is too few
//	if (minPieces >= 2) {
//		let keysFromPieces = piecesToKeys([pieces[0]]);
//		assertEquals(keysFromPieces.length, 0);
//	}
//	
//	// test keys from two pieces which is too few
//	if (minPieces >= 3) {
//		keysFromPieces = piecesToKeys([pieces[0], pieces[1]]);
//		if (keysFromPieces.length !== 0) {
//			console.log(pieces[0]);
//			console.log(pieces[1]);
//			console.log("Originals:");
//			for (let key of keys) console.log(key.getState());
//			console.log("Pieces to keys:");
//			for (let key of keysFromPieces) console.log(key.getState());
//		}
//		assertEquals(0, keysFromPieces.length);
//	}
}

function copyKeys(keys) {
	let copies = [];
	for (let key of keys) copies.push(key.copy());
	return copies;
}