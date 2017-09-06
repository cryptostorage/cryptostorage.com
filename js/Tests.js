const REPEAT_LONG = 25;
const REPEAT_SHORT = 1;
const NUM_PIECES = 5;
const MIN_PIECES = 3;
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
	
	// test unencrypted keys
	let keys = [];
	for (let i = 0; i < REPEAT_LONG; i++) {
		
		// create new key
		let key = plugin.newKey();
		keys.push(key);
		assertInitialized(key.getHex());
		assertInitialized(key.getWif());
		assertInitialized(key.getAddress());
		assertNull(key.getEncryptionScheme());
		let copy = key.copy();
		assertTrue(key.equals(copy));
		
		// parse unencrypted hex
		let key2 = new CryptoKey(plugin, key.getHex());
		assertTrue(key.equals(key2));
		
		// parse unencrypted wif
		key2 = new CryptoKey(plugin, key.getWif());
		assertTrue(key.equals(key2));
		
		// test keys to pieces
		//testSplit(key, NUM_PIECES, MIN_PIECES);
		testKeysToPieces([key], NUM_PIECES, MIN_PIECES);
	}
	
	// test keys to pieces
	// TODO: test keys to pieces with encryption.  probably modify test to encrypt all keys, then decrypt all keys
	testKeysToPieces(keys);
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
	for (let scheme of plugin.getEncryptionSchemes()) funcs.push(function(callback) { testEncryptionScheme(plugin, scheme, callback); });
	async.parallel(funcs, callback);
}

function testEncryptionScheme(plugin, scheme, callback) {
	let max = scheme === EncryptionScheme.BIP38 ? REPEAT_SHORT : REPEAT_LONG;	// bip38 takes a long time
	let funcs = [];
	for (let i = 0; i < max; i++) funcs.push(function(callback) { testEncryption(plugin.newKey(), scheme, PASSWORD, PASSWORD, callback); });
	funcs.push(function(callback) { testEncryption(plugin.newKey(), scheme, PASSWORD, "invalidPassword123", callback); });	// test wrong password
	async.parallel(funcs, callback);
}

function testEncryption(key, scheme, encryptionPassword, decryptionPassword, callback) {
	assertObject(key, 'CryptoKey');
	let original = key.copy();
	key.encrypt(scheme, encryptionPassword, function(encryptedKey, err) {
		if (err) callback(err);
		else {
			
			// test basic initialization
			assertTrue(key.equals(encryptedKey));
			assertInitialized(key.getHex());
			assertInitialized(key.getWif());
			assertInitialized(key.getAddress());
			assertEquals(scheme, key.getEncryptionScheme());
			assertTrue(key.isEncrypted());
			
			// test original
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
			
			// test keys to pieces
			testKeysToPieces([key]);
			testKeysToPieces([key], NUM_PIECES, MIN_PIECES);
			
			// test splitting
			// TODO this is unecessary if encrypted keys collected and testKeysToPieces()
			testSplit(key, NUM_PIECES, MIN_PIECES);
			
			// test decryption
			testDecryption(key, encryptionPassword, decryptionPassword, original, callback);
		}
	});
}

function testDecryption(key, encryptionPassword, decryptionPassword, expected, callback) {
	key.decrypt(decryptionPassword, function(decryptedKey, err) {
		if (encryptionPassword !== decryptionPassword) {
			if (!err) callback(new Error("Decryption with wrong password should throw an error"));
			else callback();
		} else {
			if (err) callback(err);
			else {
				
				// test basic initialization
				assertTrue(key.equals(decryptedKey));
				assertInitialized(key.getHex());
				assertInitialized(key.getWif());
				assertInitialized(key.getAddress());
				assertNull(key.getEncryptionScheme());
				
				// test decryption and copy
				assertTrue(key.equals(expected));
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
	
//	// these tests appear to be invalid because shamir's algorithm can return some valid hex key without threshold met
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
	
//	// these tests appear to be invalid because shamir's algorithm can return some valid hex key without threshold met
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