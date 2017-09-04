const REPEAT_LONG = 50;
const REPEAT_SHORT = 5;
const NUM_PIECES = 5;
const MIN_PIECES = 3;
const PASSWORD = "MySuperSecretPasswordAbcTesting123";

function runTests(callback) {
	console.log("Running tests");
	testUtils();
	testPathTracker();
	testCryptoKeys(function(error) {
		if (callback) callback(error);
	});
	
//	testWalletsWithEncryption(function() {
//		console.log("All tests passed");
//		if (callback) callback();
//	});
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

function testCryptoKeys(callback) {
	let funcs = [];
	for (let plugin of getCryptoPlugins()) funcs.push(function(callback) { testCryptoKey(plugin, callback); });
	async.series(funcs, callback);
}

function testCryptoKey(plugin, callback) {
	
	// test plugin
	assertInitialized(plugin.getName());
	assertInitialized(plugin.getTickerSymbol());
	assertInitialized(plugin.getLogo());
	
	// test unencrypted keys
	for (let i = 0; i < REPEAT_LONG; i++) {
		
		// create new key
		let key = plugin.newKey();
		assertInitialized(key.toHex());
		assertInitialized(key.toWif());
		assertInitialized(key.toAddress());
		assertNull(key.getEncryptionScheme());
		let copy = key.copy();
		assertTrue(key.equals(copy));
		
		// parse unencrypted hex
		let key2 = new CryptoKey(plugin, key.toHex());
		assertTrue(key.equals(key2));
		
		// parse unencrypted wif
		key2 = new CryptoKey(plugin, key.toWif());
		assertTrue(key.equals(key2));
	}
	
	// test invalid private keys
	let invalids = [null, "abctesting123", "abc testing 123", 12345, plugin.newKey().toAddress()];
	for (let invalid of invalids) {
		try {
			new CryptoKey(plugin, invalid);
			fail("Should have thrown an error");
		} catch (error) { }
	}
	
	// parse undefined
	try {
		plugin.parse(undefined);
		fail("Should have thrown an error");
	} catch (error) { }
	
	// test encryption for each scheme
	assertTrue(plugin.getEncryptionSchemes().length >= 1);
	for (let scheme of plugin.getEncryptionSchemes()) {
		let max = scheme === EncryptionScheme.BIP38 ? REPEAT_SHORT : REPEAT_LONG;	// bip38 takes a long time
		let funcs = [];
		for (let i = 0; i < max; i++) funcs.push(function(callback) { testEncryption(plugin, scheme, callback); });
		async.parallel(funcs, callback);
	}
	
	// test encryption of one key
	function testEncryption(plugin, scheme, callback) {
		let key = plugin.newKey();
		let copy = key.copy();
		key.encrypt(scheme, PASSWORD, function(encryptedKey, error) {
			if (error) callback(error);
			else {
				
				// test basic initialization
				assertTrue(key.equals(encryptedKey));
				assertInitialized(key.toHex());
				assertInitialized(key.toWif());
				assertInitialized(key.toAddress());
				assertEquals(scheme, key.getEncryptionScheme());
				assertTrue(key.isEncrypted());
				
				// test copy
				assertFalse(key.equals(copy));
				assertTrue(key.equals(key.copy()));
				
				// test consistency
				let parsed = new CryptoKey(plugin, key.toHex());
				assertEquals(key.toHex(), parsed.toHex());
				assertEquals(key.toWif(), parsed.toWif());
				assertEquals(key.getEncryptionScheme(), parsed.getEncryptionScheme());
				parsed = new CryptoKey(plugin, key.toWif());
				assertEquals(key.toHex(), parsed.toHex());
				assertEquals(key.toWif(), parsed.toWif());
				assertEquals(key.getEncryptionScheme(), parsed.getEncryptionScheme());
				
				// test decryption
				testDecryption(key, copy, callback);
			}
		});
	}
	
	// test decryption of one key
	function testDecryption(key, expected, callback) {
		key.decrypt(PASSWORD, function(decryptedKey, error) {
			if (error) callback(error);
			else {
				
				// test basic initialization
				assertTrue(key.equals(decryptedKey));
				assertInitialized(key.toHex());
				assertInitialized(key.toWif());
				assertInitialized(key.toAddress());
				assertNull(key.getEncryptionScheme());
				assertUndefined(key.getEncryptionScheme());
				
				// test copy
				assertTrue(key.equals(expected));
				assertTrue(key.equals(key.copy()));
				
				// test consistency
				let parsed = new CryptoKey(plugin, key.toHex());
				assertEquals(key.toHex(), parsed.toHex());
				assertEquals(key.toWif(), parsed.toWif());
				assertEquals(key.getEncryptionScheme(), parsed.getEncryptionScheme());
				parsed = new CryptoKey(plugin, key.toWif());
				assertEquals(key.toHex(), parsed.toHex());
				assertEquals(key.toWif(), parsed.toWif());
				assertEquals(key.getEncryptionScheme(), parsed.getEncryptionScheme());
			}
		});
	}
}

function testWallets() {
	for (let plugin of getCurrencyPlugins()) {
		testWallet(plugin);
	}
}

function testWallet(plugin) {
	console.log("testWallet(" + plugin.getName() + ")");
	
	// basic tests
	let wallet = plugin.newWallet();
	assertEquals(plugin, wallet.getCurrencyPlugin());
	assertInitialized(wallet.getCryptoKey());
	assertInitialized(wallet.getAddress());
	assertFalse(wallet.isEncrypted());
	assertUndefined(wallet.getEncryptionScheme());
	let copy = wallet.copy();
	assertTrue(wallet.equals(copy));
	assertTrue(copy.equals(wallet));
	let oldCryptoKey = wallet.getCryptoKey();
	let oldAddress = wallet.getAddress();
	wallet.random();
	assertNotEquals(oldCryptoKey, wallet.getCryptoKey());
	assertNotEquals(oldAddress, wallet.getAddress());
	assertTrue(plugin.isUnencryptedCryptoKeyWif(wallet.getUnencryptedCryptoKeyWif()));
	wallet.setCryptoKey(oldCryptoKey);
	assertEquals(oldCryptoKey, wallet.getCryptoKey());
	assertEquals(oldAddress, wallet.getAddress());
	
	// test splitting
	assertFalse(wallet.isSplit());
	assertUndefined(wallet.getCryptoKeyPieces());
	wallet.split(NUM_PIECES, MIN_PIECES);
	assertTrue(wallet.isSplit());
	assertUndefined(wallet.isEncrypted());
	assertUndefined(wallet.getEncryptionScheme());
	assertUndefined(wallet.getCryptoKey());
	assertUndefined(wallet.getUnencryptedCryptoKeyWif());
	let pieces = wallet.getCryptoKeyPieces();
	assertEquals(NUM_PIECES, pieces.length);
	let walletSplit = new Wallet(plugin, {privateKeyPieces: pieces, address: wallet.getAddress()});
	assertTrue(walletSplit.isSplit());
	assertTrue(wallet.equals(walletSplit));
	walletSplit.reconstitute();
	wallet.reconstitute();
	assertTrue(wallet.equals(walletSplit));
	
	// test wif
	let walletWif = new Wallet(plugin, {privateKey: wallet.getUnencryptedCryptoKeyWif()});
	assertEquals(wallet, walletWif);
	
	// test without plugin
	try {
		new Wallet({privateKey: "abc"});
		fail("Must provide currency plugin");
	} catch (err) {
		assertEquals("Must provide currency plugin", err.message);
	}
}

function testWalletsWithEncryption(callback) {
	
	// collect callback functions
	let funcs = [];
	for (let plugin of getCurrencyPlugins()) {
		funcs.push(getCallbackFunctionTestWalletWithEncryption(plugin));
	}
	
	// execute callback functions in sequence
	executeInSeries(funcs, callback);
	
	function getCallbackFunctionTestWalletWithEncryption(plugin) {
		return function(callback) { testWalletWithEncryption(plugin, callback); }
	}
}

function testWalletWithEncryption(plugin, callback) {
	console.log("Testing " + plugin.getTickerSymbol());

	// test each scheme in sequence
	let funcs = [];
	for (let scheme of plugin.getEncryptionSchemes()) {
		funcs.push(getCallbackFunctionTestScheme(plugin, scheme));
	}
	executeInSeries(funcs, callback);
	
	// callback function to test a single scheme
	function getCallbackFunctionTestScheme(plugin, scheme) {
		return function(callback) {
			
			// determine maximum number of times to encrypt since bip38 is slow
			let max = scheme === EncryptionScheme.BIP38 ? REPEAT_SHORT : REPEAT_LONG;
			
			// collect wallets and functions for encryption
			let funcs = [];
			let originalWallets = [];
			for (let i = 0; i < max; i++) {
				let wallet = plugin.newWallet();
				originalWallets.push(wallet);
				funcs.push(getCallbackFunctionEncryptWallet(scheme, wallet.copy(), PASSWORD));
			}
			let wallet = plugin.newWallet({privateKey: plugin.newKey()});
			originalWallets.push(wallet);
			funcs.push(getCallbackFunctionEncryptWallet(scheme, wallet.copy(), PASSWORD));
			
			// test each wallet
			for (let wallet of originalWallets) {
				assertInitialized(wallet);
				assertEquals(plugin, wallet.getCurrencyPlugin());
				assertInitialized(wallet.getCryptoKey());
				assertInitialized(wallet.getAddress());
				assertFalse(wallet.isSplit());
				assertFalse(wallet.isEncrypted());
				assertUndefined(wallet.getEncryptionScheme());
				assertUndefined(wallet.getCryptoKeyPieces());
				assertEquals(plugin.getAddress(wallet.getCryptoKey()), wallet.getAddress());
				testSplitWallet(wallet, NUM_PIECES, MIN_PIECES);
			}
			
			// encrypt wallets
			executeInSeries(funcs, function(encryptedWallets) {
				
				// test encrypted split
				for (let encryptedWallet of encryptedWallets) {
					if (encryptedWallet.constructor.name === 'Error') throw encryptedWallet;
					testSplitWallet(encryptedWallet, NUM_PIECES, MIN_PIECES);
				}
				
				// collect callback functions to decrypt
				funcs = [];
				for (let i = 0; i < encryptedWallets.length; i++) {
					funcs.push(getCallbackFunctionDecryptWallet(encryptedWallets[i], PASSWORD));
				}
				
				// decrypt decrypt wallets
				executeInSeries(funcs, function(decryptedWallets) {
					assertTrue(decryptedWallets.length > 0);
					assertEquals(originalWallets.length, decryptedWallets.length);
					for (let i = 0; i < originalWallets.length; i++) {
						assertTrue(originalWallets[i].equals(decryptedWallets[i]));
					}
					callback();
				});
			});
			
			function getCallbackFunctionEncryptWallet(scheme, wallet, password) {
				return function(callback) { wallet.encrypt(scheme, password, callback); }
			}
			
			function getCallbackFunctionDecryptWallet(wallet, password) {
				return function(callback) { wallet.decrypt(password, callback); }
			}
		}
	}
}

function testSplitWallet(wallet, numPieces, minPieces) {
	
	// ensure wallet is not split
	assertFalse(wallet.isSplit());
	var original = wallet.copy();
	assertTrue(original.equals(wallet));
	
	// split and test
	wallet.split(numPieces, minPieces);
	assertTrue(wallet.isSplit());
	assertEquals(numPieces, wallet.getCryptoKeyPieces().length);
	assertUndefined(wallet.isEncrypted());
	assertUndefined(wallet.getEncryptionScheme());
	assertUndefined(wallet.getCryptoKey());
	
	// test reconstituting each combination
	var pieceCombinations = getCombinations(wallet.getCryptoKeyPieces(), minPieces);
	for (let pieceCombinationIdx = 0; pieceCombinationIdx < pieceCombinationIdx.length; pieceCombinationIdx++) {
		var pieceCombination = pieceCombinations[pieceCombinationIdx];
		var reconstituted = new Wallet(plugin, {privateKeyPieces: pieceCombination}).reconstitute();
		assertTrue(reconstituted.equals(original));
	}
	
	// reconstitute entire wallet
	wallet.reconstitute();
	assertTrue(wallet.equals(original));
}