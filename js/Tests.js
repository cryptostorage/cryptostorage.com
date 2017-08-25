const REPEAT_LONG = 1;
const REPEAT_SHORT = 1;
const NUM_PIECES = 5;
const MIN_PIECES = 3;
const PASSWORD = "MySuperSecretPasswordAbcTesting123";

function runTests(callback) {
	console.log("Running tests");
	testUtils();
	testPathTracker();
	testWallets(function() {
		console.log("All tests passed");
		if (callback) callback();
	});
}

function testUtils() {
	
	// test isHex()
	assertFalse(isHex(false));
	assertFalse(isHex(true));
	assertFalse(isHex("hello there"));
	assertTrue(isHex("fcc256cbc5a180831956fba7b9b7de5f521037c39980921ebe6dbd822f791007"));
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

function testWallets(callback) {
	
	// collect callback functions
	let funcs = [];
	for (let plugin of getCurrencyPlugins()) {
		funcs.push(getCallbackFunctionTestWallet(plugin));
	}
	
	// execute callback functions in sequence
	executeCallbackFunctionsInSequence(funcs, callback);
	
	function getCallbackFunctionTestWallet(plugin) {
		return function(callback) { testWallet(plugin, callback); }
	}
}

function testWallet(plugin, callback) {
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