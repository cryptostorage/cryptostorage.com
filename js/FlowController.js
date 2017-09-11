// TODO
// password input with multiple currencies
// progress bar on wallet generation
// verify final pieces
// can buttons automatically grey out with progress wheel until next screen rendered?
// placeholders for faq and donations
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
// create new storage from csv import
// common dependencies need to be loaded at critical parts
// better mix logo

// peer review encodings
// consult designers

const RUN_TESTS = false;
const DEBUG = true;
const DEPENDENCIES = ["lib/jquery-csv.js", "lib/qrcode.js", "lib/jszip.js", "lib/FileSaver.js", "lib/aes.js", "lib/bitaddress.js"];
var loader;

/**
 * Invoked when document initialized.
 */
$(document).ready(function() {

	// start loading dependencies
	loader = new DependencyLoader();
	
	// run tests when dependencies load
	loader.load(DEPENDENCIES, function() {
		
		// run tests
		if (RUN_TESTS) {
			console.log("Running tests");
			runTests(function(error) {
				if (error) throw error;
				console.log("All tests pass");
			});
		}
	});
	
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
	var state;
	function initState() {
		state = {};
		state.pageManager = pageManager;
		state.plugins = plugins;
	}
	
	// render home page
	pageManager.next(new HomeController($("<div>"), onSelectCreate, onSelectImport));
	
	// ------------------------------ CREATE NEW --------------------------------
	
	function onSelectCreate() {
		if (DEBUG) console.log("onSelectCreate()");
		initState();
		state.mix = [];	// fill out mix to create as we go
		pageManager.next(new SelectCryptoController($("<div>"), state, onSelectCryptoCreate));
	}
	
	function onSelectCryptoCreate(selection) {
		if (DEBUG) console.log("onSelectCrypto(" + selection + ")");
		if (selection === "MIX") {
			pageManager.next(new MixNumKeysController($("<div>"), state, onMixNumKeysInput))
		} else {
			state.mix = [{plugin: getCryptoPlugin(selection)}];
			pageManager.next(new NumKeysController($("<div>"), state, onNumKeysInput));
		}
	}
	
	function onMixNumKeysInput() {
		if (DEBUG) console.log("onMixNumKeysInput");
		pageManager.next(new PasswordSelectionController($("<div>"), state, onPasswordSelection))
	}
	
	function onNumKeysInput(numKeys) {
		if (DEBUG) console.log("onNumKeysInput(" + numKeys + ")");
		assertInt(numKeys);
		state.mix[0].numKeys = numKeys;
		pageManager.next(new PasswordSelectionController($("<div>"), state, onPasswordSelection))
	}
	
	function onPasswordSelection(passwordEnabled) {
		if (DEBUG) console.log("onPasswordSelection(" + passwordEnabled + ")");
		state.passwordEnabled = passwordEnabled;
		if (passwordEnabled) pageManager.next(new PasswordInputController($("<div>"), state, onPasswordInput));
		else {
			for (let elem of state.mix) elem.encryption = null;
			pageManager.next(new SplitSelectionController($("<div>"), state, onSplitSelection));
		}
	}

	function onPasswordInput() {
		if (DEBUG) console.log("onPasswordInput()");
		pageManager.next(new SplitSelectionController($("<div>"), state, onSplitSelection));
	}
	
	function onSplitSelection(splitEnabled) {
		if (DEBUG) console.log("onSplitSelection(" + splitEnabled + ")");
		state.splitEnabled = splitEnabled;
		if (splitEnabled) pageManager.next(new NumPiecesInputController($("<div>"), state, onSplitInput));
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
		state.pieces = keysToPieces(keys, state.numPieces, state.minPieces);
		pageManager.next(new DownloadPiecesController($("<div>"), state, onCustomExport));
	}
	
	// ------------------------------ RESTORE --------------------------------
	
	function onSelectImport() {
		if (DEBUG) console.log("onSelectImport()");
		initState();
		pageManager.next(new ImportFilesController($("<div>"), onKeysImported, onSelectImportText));
	}
	
	function onSelectImportText() {
		if (DEBUG) console.log("onSelectImportText()");
		pageManager.next(new SelectCryptoController($("<div>"), state, onSelectCryptoImport));
	}
	
	function onSelectCryptoImport(tickerSymbol) {
		if (DEBUG) console.log("onSelectCryptoImport(" + tickerSymbol + ")");
		for (let plugin of plugins) {
			if (plugin.getTicker() === tickerSymbol) state.plugin = plugin;
		}
		if (!state.plugin) throw new Error("plugin not found with ticker symbol: " + tickerSymbol);
		pageManager.next(new ImportTextController($("<div>"), state, onKeysImported));
	}
	
	function onKeysImported(keys) {
		if (DEBUG) console.log("onKeysImported(" + keys.length + " keys)");
		assertTrue(keys.length >= 1);
		state.keys = keys;
		if (keys[0].isEncrypted()) pageManager.next(new DecryptKeysController($("<div>"), state, onKeysImported));
		else {
			state.pieces = keysToPieces(keys);
			pageManager.next(new DownloadPiecesController($("<div>"), state, onCustomExport));
		}
	}
	
	function onCustomExport(pieces) {
		if (DEBUG) console.log("onCustomExport(" + pieces.length + ")");
		assertTrue(pieces.length > 0);
		pageManager.next(new CustomExportController($("<div>"), state, pieces));
	}
}