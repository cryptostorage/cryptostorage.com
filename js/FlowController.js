// TODO
// mockup custom export page for review
// single page swipes to reveal static page underneath
// better terminology
// disable ability for duplicate generation or decryption of wallets. page advancement is disabled but it can still start work
// load dependencies as needed
// don't disable next button, just don't decrypt
// remove isPrivateKeyWif().  only have getPrivateKeyMin(str), isPrivateKey(), and getPrivateKeyWif(privateKey)
// beef up plugin and wallet tests
// page to configure export options with previews
// progress bar on wallet generation, export generation
// a) fix current test failure, b) test wallet creation to reveal no address on decryption bug
// change number of wallets, don't destroy rest of history
// review formats of private keys (hex, base58, etc)
// peer review encryption schemes
// what happens without random movement for bitaddress.org? need true randomization
// verify final pieces
// consult designers
// namespace utils.js
// set error messages through class method
// test wallet.setState() combinations
// implement executeCallbackFunctions() and switch some things to multithreaded (like reading files)
// cryptostorage donation addresses
// make qr codes and style smaller
// popup on key generation to reconfirm password
// prevent next if imported files deleted

const RUN_TESTS = false;
const DEBUG = true;

/**
 * Invoked when document initialized.
 */
$(document).ready(function() {
	
	// run tests
	if (RUN_TESTS) runTests();
	
	// initialize content div and flow controller
	var contentController = new ContentController($("#content"));
	contentController.render(function() {
		new FlowController(contentController, getCurrencyPlugins());
	})
});

/**
 * Manages the application flow.
 * 
 * @param contentDiv is the div to render the application content to
 * @param currencies is an array of supported currencies
 */
function FlowController(contentController, currencies) {
	
	// track application state
	var state = {};
	state.currencies = currencies;
	
	// render home page
	contentController.next(new HomeController($("<div>"), onCreateWallets, onSelectImport));
	
	// ------------------------------ CREATE NEW --------------------------------
	
	function onCreateWallets() {
		if (DEBUG) console.log("onCreateWallets()");
		state.goal = Goal.CREATE_STORAGE;
		contentController.next(new CurrencySelectionController($("<div>"), state, onCurrencySelectionNew));
	}
	
	function onCurrencySelectionNew(tickerSymbol) {
		if (DEBUG) console.log("onCurrencySelectionNew(" + tickerSymbol + ")");
		for (let currency of currencies) {
			if (currency.getTickerSymbol() === tickerSymbol) state.currency = currency;
		}
		if (!state.currency) throw new Error("Currency not found with ticker symbol: " + tickerSymbol);
		contentController.next(new NumPairsController($("<div>"), state, onNumPairsInput));
	}
	
	function onNumPairsInput(numWallets) {
		if (DEBUG) console.log("onNumPairsInput(" + numWallets + ")");
		assertInt(numWallets);
		state.numWallets = numWallets;
		contentController.next(new PasswordSelectionController($("<div>"), state, onPasswordSelection))
	}
	
	function onPasswordSelection(passwordEnabled) {
		if (DEBUG) console.log("onPasswordSelection(" + passwordEnabled + ")");
		state.passwordEnabled = passwordEnabled;
		if (passwordEnabled) contentController.next(new PasswordInputController($("<div>"), state, onPasswordInput));
		else contentController.next(new SplitSelectionController($("<div>"), state, onSplitSelection));
	}

	function onPasswordInput(password, encryptionScheme) {
		if (DEBUG) console.log("onPasswordInput(" + password + ", " + encryptionScheme + ")");
		state.password = password;
		state.encryptionScheme = encryptionScheme;
		contentController.next(new SplitSelectionController($("<div>"), state, onSplitSelection));
	}
	
	function onSplitSelection(splitEnabled) {
		if (DEBUG) console.log("onSplitSelection(" + splitEnabled + ")");
		state.splitEnabled = splitEnabled;
		if (splitEnabled) contentController.next(new NumPiecesInputController($("<div>"), state, onSplitInput));
		else contentController.next(new WalletsSummaryController($("<div>"), state, onGenerateWallets));
	}
	
	function onSplitInput(numPieces, minPieces) {
		if (DEBUG) console.log("onSplitInput(" + numPieces + ", " + minPieces + ")");
		assertInt(numPieces);
		assertInt(minPieces);
		state.numPieces = numPieces;
		state.minPieces = minPieces;
		contentController.next(new WalletsSummaryController($("<div>"), state, onGenerateWallets));
	}
	
	function onGenerateWallets() {
		if (DEBUG) console.log("onGenerateWallets()");
		
		// generate wallets
		var wallets = [];
		for (var i = 0; i < state.numWallets; i++) {
			wallets.push(state.currency.newWallet());
		}
		
		// copy wallets for processing so originals are preserved for validation
		var processedWallets = [];
		for (let wallet of wallets) {
			processedWallets.push(wallet.copy());
		}
		
		// password encryption
		if (state.passwordEnabled) {
			
			// collect callback functions to encrypt wallets
			var encryptFuncs = [];
			for (let wallet of processedWallets) {
				encryptFuncs.push(getCallbackFunctionEncrypt(wallet, state.encryptionScheme, state.password));
			}
			
			// execute callback functions in sequence
			executeCallbackFunctionsInSequence(encryptFuncs, function() {
				splitAndDownload(state);
			});
			
			/**
			 * Returns a callback function to encrypt a wallet.
			 */
			function getCallbackFunctionEncrypt(wallet, encryptionScheme, password) {
				return function(callback) {
					wallet.encrypt(encryptionScheme, password, callback);
				}
			}
		}
		
		// no password encryption
		else {
			splitAndDownload(state);
		}
		
		/**
		 * Splits wallets in the given state and continues to download page.
		 */
		function splitAndDownload(state) {
			
			// split wallets
			if (state.splitEnabled) {
				for (let wallet of processedWallets) {
					wallet.split(state.numPieces, state.minPieces);
				}
			}
			
			// convert wallets to pieces for download
			contentController.next(new DownloadPiecesController($("<div>"), state, walletsToPieces(processedWallets), onCustomExport));
		}
	}
	
	// ------------------------------ RESTORE --------------------------------
	
	function onSelectImport() {
		if (DEBUG) console.log("onSelectImport()");
		contentController.next(new ImportFilesController($("<div>"), onUnsplitWalletsImported, onSelectImportText));
	}
	
	function onSelectImportText() {
		if (DEBUG) console.log("onSelectImportText()");
		state.goal = Goal.RESTORE_STORAGE;
		contentController.next(new CurrencySelectionController($("<div>"), state, onSelectImportCurrency));
	}
	
	function onSelectImportCurrency(tickerSymbol) {
		if (DEBUG) console.log("onSelectImportCurrency(" + tickerSymbol + ")");
		for (let currency of currencies) {
			if (currency.getTickerSymbol() === tickerSymbol) state.currency = currency;
		}
		if (!state.currency) throw new Error("Currency not found with ticker symbol: " + tickerSymbol);
		contentController.next(new ImportTextController($("<div>"), state, onUnsplitWalletsImported));
	}
	
	function onUnsplitWalletsImported(wallets) {
		if (DEBUG) console.log("onUnsplitWalletsImported(" + wallets.length + " wallets)");
		assertTrue(wallets.length >= 1);
		state.wallets = wallets;
		state.currency = wallets[0].getCurrencyPlugin();
		if (wallets[0].isEncrypted()) contentController.next(new DecryptWalletsController($("<div>"), state, onUnsplitWalletsImported));
		else contentController.next(new DownloadPiecesController($("<div>"), state, walletsToPieces(wallets, true), onCustomExport));
	}
	
	function onCustomExport(pieces) {
		if (DEBUG) console.log("onCustomExport(" + pieces.length + ")");
		assertTrue(pieces.length > 0);
		contentController.next(new CustomExportController($("<div>"), state, pieces));
	}
}