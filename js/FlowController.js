// TODO
// verify final pieces
// load dependencies as needed
// progress bar on wallet generation, export generation
// placeholders for faq and donations
// switch to async library
// custom export options page
// namespace utils.js (reference bitaddress.org)
// cryptostorage donation addresses
// re-style html export
// popup on key generation to reconfirm password
// register shortcut keys for page navigation (enter, y, n)
// paste private key doesn't work in iphone safari
// de-minify aes.java
// todos throughout code
// run minimum tests when site accessed
// use SecureRandom() with seeded time, mouse movement, etc (bitaddress.org)

// peer review encodings
// consult designers

const RUN_TESTS = true;
const DEBUG = true;
var loader;

/**
 * Invoked when document initialized.
 */
$(document).ready(function() {
	

	// start loading common dependencies
	loader = new DependencyLoader();
	let allDependencies = ["lib/jquery-csv.js", "lib/qrcode.js", "lib/jszip.js", "lib/FileSaver.js", "lib/aes.js", "lib/bitaddress.js"];
	loader.load(allDependencies, function() {} );
	
	// run tests
	if (RUN_TESTS) {
		console.log("Running tests");
		runTests(function(error) {
			if (error) throw error;
			console.log("All tests pass");
		});
	}
	
	// initialize content div and flow controller
	var pageManager = new PageManager($("#content"));
	pageManager.render(function() {
		new FlowController(pageManager, getCryptoPlugins());
	})
});

/**
 * Manages the application flow.
 * 
 * @param pageManager manages page navigation and rendering
 * @param plugins is an array of supported cryptos
 */
function FlowController(pageManager, plugins) {
	
	// track application state
	var state = {};
	state.plugins = plugins;
	
	// render home page
	pageManager.next(new HomeController($("<div>"), onSelectCreate, onSelectImport));
	
	// ------------------------------ CREATE NEW --------------------------------
	
	function onSelectCreate() {
		if (DEBUG) console.log("onSelectCreate()");
		state.goal = Goal.CREATE_STORAGE;
		pageManager.next(new CryptoSelectionController($("<div>"), state, onCryptoSelectionCreate));
	}
	
	function onCryptoSelectionCreate(tickerSymbol) {
		if (DEBUG) console.log("onCryptoSelectionCreate(" + tickerSymbol + ")");
		for (let plugin of plugins) {
			if (plugin.getTickerSymbol() === tickerSymbol) state.plugin = plugin;
		}
		if (!state.plugin) throw new Error("plugin not found with ticker symbol: " + tickerSymbol);
		pageManager.next(new NumKeysController($("<div>"), state, pageManager.getPathTracker(), onNumKeysInput));
	}
	
	function onNumKeysInput(numKeys) {
		if (DEBUG) console.log("onNumKeysInput(" + numKeys + ")");
		assertInt(numKeys);
		state.numKeys = numKeys;
		pageManager.next(new PasswordSelectionController($("<div>"), state, onPasswordSelection))
	}
	
	function onPasswordSelection(passwordEnabled) {
		if (DEBUG) console.log("onPasswordSelection(" + passwordEnabled + ")");
		state.passwordEnabled = passwordEnabled;
		if (passwordEnabled) pageManager.next(new PasswordInputController($("<div>"), state, pageManager.getPathTracker(), onPasswordInput));
		else pageManager.next(new SplitSelectionController($("<div>"), state, onSplitSelection));
	}

	function onPasswordInput(password, encryptionScheme) {
		if (DEBUG) console.log("onPasswordInput(" + password + ", " + encryptionScheme + ")");
		state.password = password;
		state.encryptionScheme = encryptionScheme;
		pageManager.next(new SplitSelectionController($("<div>"), state, onSplitSelection));
	}
	
	function onSplitSelection(splitEnabled) {
		if (DEBUG) console.log("onSplitSelection(" + splitEnabled + ")");
		state.splitEnabled = splitEnabled;
		if (splitEnabled) pageManager.next(new NumPiecesInputController($("<div>"), state, pageManager.getPathTracker(), onSplitInput));
		else {
			delete state.numPieces;
			delete state.minPieces;
			pageManager.next(new GenerateKeysController($("<div>"), state, onKeysGenerated));
		}
	}
	
	function onSplitInput(numPieces, minPieces) {
		if (DEBUG) console.log("onSplitInput(" + numPieces + ", " + minPieces + ")");
		assertInt(numPieces);
		assertInt(minPieces);
		state.numPieces = numPieces;
		state.minPieces = minPieces;
		pageManager.next(new GenerateKeysController($("<div>"), state, onKeysGenerated));
	}
	
	function onKeysGenerated(keys) {
		if (DEBUG) console.log("onKeysGenerated(" + keys.length + ")");
		pageManager.next(new DownloadPiecesController($("<div>"), state, keysToPieces(keys, state.numPieces, state.minPieces), onCustomExport));
	}
	
	// ------------------------------ RESTORE --------------------------------
	
	function onSelectImport() {
		if (DEBUG) console.log("onSelectImport()");
		pageManager.next(new ImportFilesController($("<div>"), onKeysImported, onSelectImportText));
	}
	
	function onSelectImportText() {
		if (DEBUG) console.log("onSelectImportText()");
		state.goal = Goal.RESTORE_STORAGE;
		pageManager.next(new CryptoSelectionController($("<div>"), state, onSelectImportCrypto));
	}
	
	function onSelectImportCrypto(tickerSymbol) {
		if (DEBUG) console.log("onSelectImportCrypto(" + tickerSymbol + ")");
		for (let plugin of plugins) {
			if (plugin.getTickerSymbol() === tickerSymbol) state.plugin = plugin;
		}
		if (!state.plugin) throw new Error("plugin not found with ticker symbol: " + tickerSymbol);
		pageManager.next(new ImportTextController($("<div>"), state, onKeysImported));
	}
	
	function onKeysImported(keys) {
		if (DEBUG) console.log("onKeysImported(" + keys.length + " keys)");
		assertTrue(keys.length >= 1);
		state.keys = keys;
		state.plugin = keys[0].getPlugin();	// TODO: may not have same plugin across all keys
		if (keys[0].isEncrypted()) pageManager.next(new DecryptKeysController($("<div>"), state, onKeysImported));
		else pageManager.next(new DownloadPiecesController($("<div>"), state, keysToPieces(keys), onCustomExport));
	}
	
	function onCustomExport(pieces) {
		if (DEBUG) console.log("onCustomExport(" + pieces.length + ")");
		assertTrue(pieces.length > 0);
		pageManager.next(new CustomExportController($("<div>"), state, pieces));
	}
}