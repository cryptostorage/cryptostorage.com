const REPEAT_LONG = 50;
const REPEAT_SHORT = 2;
const NUM_PIECES = 5;
const MIN_PIECES = 3;
const PASSWORD = "MySuperSecretPasswordAbcTesting123";

function runTests(callback) {
	console.log("Running tests");
	testUtils();
	testPathTracker();
	testCryptoPlugins();
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

function testCryptoPlugins() {
	for (let plugin of getCryptoPlugins()) {
		testCryptoPlugin(plugin);
	}
}

function testCryptoPlugin(plugin) {
	console.log("testCryptoPlugin(" + plugin.getName() + ")");
	assertInitialized(plugin.getName());
	assertInitialized(plugin.getTickerSymbol());
	assertInitialized(plugin.getLogo());
	
	// test unencrypted wif and hex consistency
	for (let i = 0; i < REPEAT_LONG; i++) {
		let pkHex = plugin.newUnencryptedPrivateKeyHex();
		assertTrue(plugin.isPrivateKey(pkHex));
		assertTrue(plugin.isPrivateKeyHex(pkHex));
		let pkWif = plugin.privateKeyHexToWif(pkHex);
		assertTrue(plugin.isPrivateKey(pkWif));
		assertTrue(plugin.isPrivateKeyWif(pkWif));
		assertEquals(pkHex, plugin.privateKeyWifToHex(pkWif));
	}
	
	// test invalid private keys
	let invalids = [null, undefined, "abctesting123", "abc testing 123", 12345];
	for (let invalid of invalids) {
		assertFalse(plugin.isPrivateKey(invalid));
		assertUndefined(plugin.getEncryptionScheme(invalid));
		assertFalse(plugin.isEncryptedPrivateKey(invalid));
		try {
			plugin.privateKeyHexToWif(invalid);
			fail("Should not be able to get hex from invalid private key");
		} catch (err) { }
		try {
			plugin.privateKeyWifToHex(invalid);
			fail("Should not be able to get wif from invalid private key");
		} catch (err) { }
		try {
			plugin.getAddress(invalid);
			fail("Should not be able to get address from invalid private key");
		} catch (err) { }
		try {
			plugin.getEncryptionScheme(invalid);
			fail("Should not be able to get encryption scheme from invalid argument");
		} catch (err) { }
	}
}

function testCryptoKeys(callback) {
	let funcs = [];
	for (let plugin of getCryptoPlugins()) funcs.push(function(callback) { testCryptoKey(plugin, callback); });
	async.parallel(funcs, callback);
}

function testCryptoKey(plugin, callback) {
	
	// test unencrypted private key consistency
	for (let i = 0; i < REPEAT_LONG; i++) {
		let key = plugin.newCryptoKey();
		assertEquals(plugin, key.getPlugin());
		assertTrue(plugin.isPrivateKey(key.toHex()));
		assertTrue(plugin.isPrivateKey(key.toWif()));
		assertTrue(plugin.isPrivateKeyHex(key.toHex()));
		assertTrue(plugin.isPrivateKeyWif(key.toWif()));
		assertTrue(plugin.isAddress(key.toAddress()));
		assertFalse(key.isEncrypted());
		assertNull(key.getEncryptionScheme());
		let copy = key.copy();
		assertTrue(key.equals(copy));
	}
	
	// test basic initialization
	let hex = plugin.newUnencryptedPrivateKeyHex();
	let wif = plugin.privateKeyHexToWif(hex);
	let key1 = new CryptoKey(plugin, hex);
	let key2 = new CryptoKey(plugin, {privateKey: wif});
	assertEquals(hex, key1.toHex());
	assertEquals(wif, key1.toWif());
	assertEquals(hex, key2.toHex());
	assertEquals(wif, key2.toWif());
	
	// test initialization with an address
	let address = key1.toAddress();
	let key = new CryptoKey(plugin, {privateKey: wif, address: address});
	assertEquals(hex, key.toHex());
	assertEquals(wif, key.toWif());
	assertEquals(address, key.toAddress());
	
	// test invalid initializations
	try {
		new CryptoKey(plugin, "invalid");
		throw new Error("CryptoKey created with invalid private key");
	} catch (err) { }
	try {
		let temp = new CryptoKey(plugin);
		new CryptoKey(plugin, {privateKey: wif, address: temp.toAddress()});	// address mismatch from private key
		throw new Error("CryptoKey created with mismatching address");
	} catch (err) { }
	
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
		let key = plugin.newCryptoKey();
		let copy = key.copy();
		key.encrypt(scheme, PASSWORD, function(error) {
			if (error) {
				callback(error);
				return;
			}
			assertFalse(key.equals(copy));
			assertTrue(key.equals(key.copy()));
			assertTrue(key.isEncrypted());
			assertEquals(scheme, key.getEncryptionScheme());
			assertEquals(scheme, plugin.getEncryptionScheme(key.toHex()));
			assertEquals(scheme, plugin.getEncryptionScheme(key.toWif()));
			assertTrue(plugin.isPrivateKeyHex(key.toHex()));
			assertTrue(plugin.isPrivateKeyWif(key.toWif()));
			assertTrue(plugin.isAddress(key.toAddress()), "Not an address: " + key.toAddress());
			assertEquals(key.toHex(), plugin.privateKeyWifToHex(key.toWif()));
			assertEquals(key.toWif(), plugin.privateKeyHexToWif(key.toHex()));
			testDecryption(key, function(error) {
				if (error) callback(error);
				else {
					assertTrue(key.equals(key.copy()));
					assertTrue(key.equals(copy));
					callback();
				}
			});
		});
	}
	
	// test decryption of one key
	function testDecryption(key, callback) {
		key.decrypt(PASSWORD, function(error) {
			if (error) {
				callback(error);
				return;
			}
			assertFalse(key.isEncrypted());
			assertNull(key.getEncryptionScheme());
			assertNull(key.plugin.getEncryptionScheme(key.toHex()));
			assertNull(key.plugin.getEncryptionScheme(key.toWif()));
			assertTrue(key.plugin.isPrivateKeyHex(key.toHex()));
			assertTrue(key.plugin.isPrivateKeyWif(key.toWif()));
			assertTrue(key.plugin.isAddress(key.toAddress()), "Not an address: " + key.toAddress());
			assertEquals(key.toHex(), key.plugin.privateKeyWifToHex(key.toWif()));
			assertEquals(key.toWif(), key.plugin.privateKeyHexToWif(key.toHex()));
			callback();
		});
	}
	
	// test encryption
//	assertTrue(plugin.getEncryptionSchemes().length >= 1);
//	for (let scheme of plugin.getEncryptionSchemes()) {
//		throw new Error("Not yet implemented.");
//		// test self consistency
//		assertTrue(plugin.getEncryptionSchemes().length >= 1);
//		let pkHex = plugin.newUnencryptedCryptoKeyHex();
//		assertInitialized(pkHex);
//		assertTrue(isHex(pkHex));
//		assertTrue(plugin.isUnencryptedCryptoKey(privateKey));
//		let privateKeyWif = plugin.getUnencryptedCryptoKeyWif(privateKey);
//		assertTrue(plugin.isUnencryptedCryptoKeyWif(privateKeyWif));
//		assertEquals(privateKey, plugin.getUnencryptedCryptoKey(privateKeyWif));
//		let address = plugin.getAddress(privateKey);
//		// TODO: assertTrue(plugin.isAddress(address));
//		assertUndefined(plugin.getEncryptionScheme(privateKey));
//		assertUndefined(plugin.getEncryptionScheme(privateKeyWif));
//		assertFalse(plugin.isEncryptedCryptoKey(privateKey));
//		assertFalse(plugin.isEncryptedCryptoKey(privateKeyWif));
//		let pieces = plugin.split(privateKey, NUM_PIECES, MIN_PIECES);
//		assertEquals(NUM_PIECES, pieces.length);
//		assertEquals(privateKey, plugin.reconstitute(pieces));
//		pieces = plugin.split(privateKeyWif, NUM_PIECES, MIN_PIECES);
//		assertEquals(NUM_PIECES, pieces.length);
//		assertEquals(privateKeyWif, plugin.reconstitute(pieces));
//	}
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
			let wallet = plugin.newWallet({privateKey: plugin.newCryptoKey()});
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