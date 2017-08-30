const REPEAT_LONG = 100;
const REPEAT_SHORT = 1;
const NUM_PIECES = 5;
const MIN_PIECES = 3;
const PASSWORD = "MySuperSecretPasswordAbcTesting123";

function runTests(callback) {
	console.log("Running tests");
	testUtils();
	testPathTracker();
//	testCurrencyPlugins();
	testWallets();
	console.log("All tests passed");
	if (callback) callback();
	
	
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

function testCurrencyPlugins() {
	for (let plugin of getCurrencyPlugins()) {
		testCurrencyPlugin(plugin);
	}
}

function testCurrencyPlugin(plugin) {
	console.log("testCurrencyPlugin(" + plugin.getName() + ")");
	assertInitialized(plugin.getName());
	assertInitialized(plugin.getTickerSymbol());
	assertInitialized(plugin.getLogo());
	for (let i = 0; i < REPEAT_LONG; i++) {
		
		// test consistency
		assertTrue(plugin.getEncryptionSchemes().length >= 1);
		let privateKey = plugin.newPrivateKey();
		assertInitialized(privateKey);
		assertTrue(plugin.isUnencryptedPrivateKey(privateKey));
		let privateKeyWif = plugin.getUnencryptedPrivateKeyWif(privateKey);
		assertTrue(plugin.isUnencryptedPrivateKeyWif(privateKeyWif));
		assertEquals(privateKey, plugin.getUnencryptedPrivateKey(privateKeyWif));
		let address = plugin.getAddress(privateKey);
		// TODO: assertTrue(plugin.isAddress(address));
		assertUndefined(plugin.getEncryptionScheme(privateKey));
		assertUndefined(plugin.getEncryptionScheme(privateKeyWif));
		assertFalse(plugin.isEncryptedPrivateKey(privateKey));
		assertFalse(plugin.isEncryptedPrivateKey(privateKeyWif));
		let pieces = plugin.split(privateKey, NUM_PIECES, MIN_PIECES);
		assertEquals(NUM_PIECES, pieces.length);
		assertEquals(privateKey, plugin.reconstitute(pieces));
		pieces = plugin.split(privateKeyWif, NUM_PIECES, MIN_PIECES);
		assertEquals(NUM_PIECES, pieces.length);
		assertEquals(privateKeyWif, plugin.reconstitute(pieces));
		
		// test invalid private keys
		let invalids = [null, undefined, "abctesting123", "abc testing 123", 12345];
		for (let invalid of invalids) {
			assertFalse(plugin.isUnencryptedPrivateKey(invalid));
			assertFalse(plugin.isUnencryptedPrivateKeyWif(invalid));
			try {
				plugin.getUnencryptedPrivateKey(invalid);
				fail("Should not be able to get private key from invalid argument");
			} catch (err) {
				// nothing to do
			}
			try {
				plugin.getUnencryptedPrivateKeyWif(invalid);
				fail("Should not be able to get private key WIF from invalid argument");
			} catch (err) {
				// nothing to do
			}
			try {
				plugin.getAddress(invalid);
				fail("Should not be able to get private key address from invalid argument");
			} catch (err) {
				// nothing to do
			}
			try {
				plugin.getEncryptionScheme(invalid);
				fail("Should not be able to get encryption scheme from invalid argument");
			} catch (err) {
				// nothing to do
			}
			try {
				plugin.isEncryptedPrivateKey(invalid);
				fail("Should not be able to determine encryption scheme from invalid argument");
			} catch (err) {
				// nothing to do
			}
			try {
				plugin.split(invalid, NUM_PIECES, MIN_PIECES);
				fail("Should not be able to split invalid argument");
			} catch (err) {
				// nothing to do
			}
			try {
				let pieces = [];
				for (let i = 0; i < NUM_PIECES; i++) pieces.push(invalid);
				plugin.reconstitute(invalid, NUM_PIECES, MIN_PIECES);
				fail("Should not be able to reconstitute invalid pieces");
			} catch (err) {
				// nothing to do
			}
		}
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
	assertTrue(plugin === wallet.getCurrencyPlugin());
	assertInitialized(wallet.getPrivateKey());
	assertInitialized(wallet.getAddress());
	assertFalse(wallet.isEncrypted());
	assertUndefined(wallet.getEncryptionScheme());
	let copy = wallet.copy();
	assertTrue(wallet.equals(copy));
	assertTrue(copy.equals(wallet));
	let oldPrivateKey = wallet.getPrivateKey();
	let oldAddress = wallet.getAddress();
	wallet.random();
	assertNotEquals(oldPrivateKey, wallet.getPrivateKey());
	assertNotEquals(oldAddress, wallet.getAddress());
	assertTrue(plugin.isUnencryptedPrivateKeyWif(wallet.getUnencryptedPrivateKeyWif()));
	wallet.setPrivateKey(oldPrivateKey);
	assertEquals(oldPrivateKey, wallet.getPrivateKey());
	assertEquals(oldAddress, wallet.getAddress());	
	
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
	executeCallbackFunctionsInSequence(funcs, callback);
	
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
	executeCallbackFunctionsInSequence(funcs, callback);
	
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
			let wallet = plugin.newWallet({privateKey: plugin.newPrivateKey()});
			originalWallets.push(wallet);
			funcs.push(getCallbackFunctionEncryptWallet(scheme, wallet.copy(), PASSWORD));
			
			// test each wallet
			for (let wallet of originalWallets) {
				assertInitialized(wallet);
				assertEquals(plugin, wallet.getCurrencyPlugin());
				assertInitialized(wallet.getPrivateKey());
				assertInitialized(wallet.getAddress());
				assertFalse(wallet.isSplit());
				assertFalse(wallet.isEncrypted());
				assertUndefined(wallet.getEncryptionScheme());
				assertUndefined(wallet.getPrivateKeyPieces());
				assertEquals(plugin.getAddress(wallet.getPrivateKey()), wallet.getAddress());
				testSplitWallet(wallet, NUM_PIECES, MIN_PIECES);
			}
			
			// encrypt wallets
			executeCallbackFunctionsInSequence(funcs, function(encryptedWallets) {
				
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
				executeCallbackFunctionsInSequence(funcs, function(decryptedWallets) {
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
	assertEquals(numPieces, wallet.getPrivateKeyPieces().length);
	assertUndefined(wallet.isEncrypted());
	assertUndefined(wallet.getEncryptionScheme());
	assertUndefined(wallet.getPrivateKey());
	
	// test reconstituting each combination
	var pieceCombinations = getCombinations(wallet.getPrivateKeyPieces(), minPieces);
	for (let pieceCombinationIdx = 0; pieceCombinationIdx < pieceCombinationIdx.length; pieceCombinationIdx++) {
		var pieceCombination = pieceCombinations[pieceCombinationIdx];
		var reconstituted = new Wallet(plugin, {privateKeyPieces: pieceCombination}).reconstitute();
		assertTrue(reconstituted.equals(original));
	}
	
	// reconstitute entire wallet
	wallet.reconstitute();
	assertTrue(wallet.equals(original));
}