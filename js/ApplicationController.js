// TODO
// redesign pieces download page
// redesign html export
// password confirmation - re-enter or show
// register shortcut keys for page navigation (enter, y, n)
// paste private key doesn't work in iphone safari
// de-minify aes.java
// todos throughout code
// run minimum tests when site accessed
// better mix logo
// test alert if key creation fails for any reason
// verify no name collisions
// bip38 not working on old hardware
// test on IE
// create storage from csv import
// "Successfully compiled asm.js code (loaded from cache in 6ms)" messages in moneroaddress and keythereum
// title bar should not scroll
// focus on first text element if applicable
// live site warning to stop and download from github
// condense javascript to single file for production
// sanity check key formats
// peer review encodings
// consult designers
// faq page
// donation page
// condense files to single files as much as possible
// disable next if mix num keys change
// prevent rendered page from showing after home, FAQ or donate clicked
// bug on safari on file import
// flag to verify encryption

const RUN_TESTS = false;
const DEBUG = true;
const DELETE_WINDOW_CRYPTO = false;
const COMMON_DEPENDENCIES = ["lib/jquery-csv.js", "lib/qrcode.js", "lib/jszip.js", "lib/FileSaver.js", "lib/aes.js", "lib/bitaddress.js", "lib/progressbar.js"];
var loader;

/**
 * Invoked when document initialized.
 */
$(document).ready(function() {
	
	// delete window.crypto for testing
	if (DELETE_WINDOW_CRYPTO) delete window.crypto;

	// start loading common dependencies
	loader = new DependencyLoader();
	loader.load(COMMON_DEPENDENCIES);
	
	// run tests
	if (RUN_TESTS) {
		console.log("Running tests");
		Tests.runTests(function(error) {
			if (error) throw error;
			console.log("All tests pass");
		});
	}
	
	// render application to html body
	new ApplicationController($("body")).render();
});

/**
 * Controls the entire application.
 * 
 * @param div is the div to render the application to
 */
function ApplicationController(div) {
	
	let state;
	let pageController;
	let that = this;
	
	this.render = function() {
		
		// header
		let headerDiv = $("<div class='header'>").appendTo(div);
		let logoLink = $("<a href='index.html'>").appendTo(headerDiv);
		$("<img width='500px' height='500px' src='img/cryptostorage.png'>").appendTo(logoLink);
		
		// body
		let bodyDiv = $("<div class='content'>").appendTo(div);
		pageController = new PageController(bodyDiv);
		
		// footer		
		let footerDiv = $("<div class='footer'>").appendTo(div);
		let homeLink = getLink("#", "Home");
		homeLink.click(function() { that.showHome(); });
		let faqLink = getLink("#faq", "FAQ");
		faqLink.click(function() { that.showFaq(); });
		let gitHubLink = $("<a href='https://github.com/cryptostorage/cryptostorage.com'>");
		gitHubLink.html("GitHub");
		let donateLink = getLink("#donate", "Donate");
		donateLink.click(function() { that.showDonate(); });
		footerDiv.append(homeLink);
		footerDiv.append("&nbsp;&nbsp;|&nbsp;&nbsp;");
		footerDiv.append(faqLink);
		footerDiv.append("&nbsp;&nbsp;|&nbsp;&nbsp;");
		footerDiv.append(gitHubLink);
		footerDiv.append("&nbsp;&nbsp;|&nbsp;&nbsp;");
		footerDiv.append(donateLink);
		
		// timeout fixes issue on safari where cryptostorage logo doesn't reliably show
		setTimeout(function() {
			
			// render body and start on home
			pageController.render(function() {
				
				// get identifier
				let href = window.location.href;
				let lastIdx = href.lastIndexOf("#");
				let identifier = lastIdx === -1 ? null : href.substring(lastIdx + 1);
				
				// show page based on identifier
				if (identifier === "faq") that.showFaq();
				else if (identifier === "donate") that.showDonate();
				else that.showHome();
			});
		}, 0);
		
		function getLink(href, label) {
			if (!href) href = '';
			let link = $("<a href='" + href + "'>");
			link.html(label);
			return link;
		}
	}
	
	this.showHome = function() {
		if (DEBUG) console.log("showHome()");
		pageController.set(new HomeController($("<div>"), onSelectCreate, onSelectImport));
	}
	
	this.showFaq = function() {
		if (DEBUG) console.log("showFaq()");
		pageController.set(new FaqController($("<div>")));
	}
	
	this.showDonate = function() {
		if (DEBUG) console.log("showDonate()");
		pageController.set(new DonateController($("<div>")));
	}
	
	function initState() {
		state = {};
		state.pageController = pageController;
		state.plugins = CryptoUtils.getCryptoPlugins();
	}

	// ------------------------------ CREATE NEW --------------------------------
	
	function onSelectCreate() {
		if (DEBUG) console.log("onSelectCreate()");
		initState();
		state.mix = [];	// fill out mix to create as we go
		pageController.next(new SelectCryptoController($("<div>"), state, onSelectCryptoCreate));
	}
	
	function onSelectCryptoCreate(selection) {
		if (DEBUG) console.log("onSelectCrypto(" + selection + ")");
		if (selection === "MIX") {
			pageController.next(new MixNumKeysController($("<div>"), state, onMixNumKeysInput))
		} else {
			state.mix = [{plugin: CryptoUtils.getCryptoPlugin(selection)}];
			pageController.next(new NumKeysController($("<div>"), state, onNumKeysInput));
		}
	}
	
	function onMixNumKeysInput() {
		if (DEBUG) console.log("onMixNumKeysInput()");
		pageController.next(new PasswordSelectionController($("<div>"), state, onPasswordSelection))
	}
	
	function onNumKeysInput(numKeys) {
		if (DEBUG) console.log("onNumKeysInput(" + numKeys + ")");
		assertInt(numKeys);
		state.mix[0].numKeys = numKeys;
		pageController.next(new PasswordSelectionController($("<div>"), state, onPasswordSelection))
	}
	
	function onPasswordSelection(passwordEnabled) {
		if (DEBUG) console.log("onPasswordSelection(" + passwordEnabled + ")");
		state.passwordEnabled = passwordEnabled;
		if (passwordEnabled) pageController.next(new PasswordInputController($("<div>"), state, onPasswordInput));
		else {
			for (let elem of state.mix) elem.encryption = null;
			pageController.next(new SplitSelectionController($("<div>"), state, onSplitSelection));
		}
	}

	function onPasswordInput() {
		if (DEBUG) console.log("onPasswordInput()");
		pageController.next(new SplitSelectionController($("<div>"), state, onSplitSelection));
	}
	
	function onSplitSelection(splitEnabled) {
		if (DEBUG) console.log("onSplitSelection(" + splitEnabled + ")");
		state.splitEnabled = splitEnabled;
		if (splitEnabled) pageController.next(new NumPiecesInputController($("<div>"), state, onSplitInput));
		else {
			state.numPieces = 1;
			delete state.minPieces;
			pageController.next(new GeneratePiecesController($("<div>"), state, onPiecesGenerated));
		}
	}
	
	function onSplitInput(numPieces, minPieces) {
		if (DEBUG) console.log("onSplitInput(" + numPieces + ", " + minPieces + ")");
		assertInt(numPieces);
		assertInt(minPieces);
		state.numPieces = numPieces;
		state.minPieces = minPieces;
		pageController.next(new GeneratePiecesController($("<div>"), state, onPiecesGenerated));
	}
	
	function onPiecesGenerated(pieces, pieceDivs) {
		if (DEBUG) console.log("onPiecesGenerated(" + pieces.length + ")");
		assertTrue(pieces.length > 0);
		assertEquals(pieces.length, pieceDivs.length);
		state.pieces = pieces;
		state.pieceDivs = pieceDivs;
		pageController.next(new RenderPiecesController($("<div>"), state, onCustomExport));
	}
	
	// ------------------------------ RESTORE --------------------------------
	
	function onSelectImport() {
		if (DEBUG) console.log("onSelectImport()");
		initState();
		pageController.next(new ImportFilesController($("<div>"), onKeysImported, onSelectImportText));
	}
	
	function onSelectImportText() {
		if (DEBUG) console.log("onSelectImportText()");
		delete state.pieceDivs;
		pageController.next(new SelectCryptoController($("<div>"), state, onSelectCryptoImport));
	}
	
	function onSelectCryptoImport(tickerSymbol) {
		if (DEBUG) console.log("onSelectCryptoImport(" + tickerSymbol + ")");
		for (let plugin of state.plugins) {
			if (plugin.getTicker() === tickerSymbol) state.plugin = plugin;
		}
		if (!state.plugin) throw new Error("plugin not found with ticker symbol: " + tickerSymbol);
		pageController.next(new ImportTextController($("<div>"), state, onKeysImported));
	}
	
	function onKeysImported(keys) {
		if (DEBUG) console.log("onKeysImported(" + keys.length + " keys)");
		assertTrue(keys.length >= 1);
		state.keys = keys;
		if (keys[0].isEncrypted()) pageController.next(new DecryptKeysController($("<div>"), state, onPiecesGenerated));
		else {
			state.pieces = CryptoUtils.keysToPieces(keys);
			pageController.next(new RenderPiecesController($("<div>"), state, onCustomExport));
		}
	}
	
	function onCustomExport(pieces) {
		if (DEBUG) console.log("onCustomExport(" + pieces.length + ")");
		assertTrue(pieces.length > 0);
		pageController.next(new CustomExportController($("<div>"), state, pieces));
	}
}