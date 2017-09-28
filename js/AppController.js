// TODO
// solve issue where next page may take time to load, but previous page is done
// prevent rendered page from showing after home, FAQ or donate clicked
// bigger keys, smaller qr codes anchored to top/bottom corner (height issue with monero pushing into next page)
// home button maintains state, doesn't start over
// faq page
// donation page
// de-minify aes.java
// todos throughout code
// run minimum tests when site accessed
// better mix logo
// test alert if key creation fails for any reason
// verify no name collisions
// bip38 not working on old hardware
// file import zip with invalid json shouldn't prevent others from importing
// disable next if mix num keys change
// live site warning to stop and download from github
// wording on front page / be consistent
// condense files to single files as much as possible
// warning if live and/or online
// switch to jquery-qrcode?
// csv import to support "bring your own keys"
// test on IE
// backwards bitcoin cash logo
// smaller html exports

// peer review key formats

// consult designers
// icons of supported currencies on home page
// use tabs for pieces?
// password confirmation - re-enter or show
// title bar should not scroll
// select one or more currencies to store (consistent look with number of addresses input)
// enter the number of addresses for each currency || enter the number of Bitcoin addresses to create)
// summary page has table with logos
// potentially collapse selection and address input
// make it clearer what to do next on save page
// less wasted space
// navigation bar showing overall place in flow
// warnings to test before using.
// register shortcut keys for page navigation (enter, y, n)
// focus on first text element if applicable

// low priority
// keys -> addresses (an "address" is a public/private key pair in this terminology).
// all div controllers directly modify state
// html export is horizontally centered with @media print for actual print
// timeouts in tests so browser doesn't lock

const RUN_TESTS = false;
const DEBUG = true;
const DELETE_WINDOW_CRYPTO = false;
const VERIFY_ENCRYPTION = false;
const COMMON_DEPENDENCIES = ["lib/logos.js", "lib/jquery-csv.js", "lib/qrcode.js", "lib/jszip.js", "lib/FileSaver.js", "lib/aes.js", "lib/bitaddress.js", "lib/progressbar.js"];
var loader;

/**
 * Invoked when document initialized.
 */
$(document).ready(function() {
	
	// delete window.crypto for testing
	if (DELETE_WINDOW_CRYPTO) delete window.crypto;
	
	// start loading common dependencies
	loader = new DependencyLoader();
	loader.load(COMMON_DEPENDENCIES, function() {
		
//		// get data url of logo
//		let plugin = CryptoUtils.getCryptoPlugin("OMG");
//		console.log(imgToDataUrl($("<img src='img/cryptostorage.png'>").get(0)));
//		function imgToDataUrl(img, format) {
//			let canvas = document.createElement('canvas');
//		    canvas.height = img.naturalHeight;
//		    canvas.width = img.naturalWidth;
//		    let context = canvas.getContext('2d');
//		    context.drawImage(img, 0, 0);
//		    return canvas.toDataURL(format);
//		}
	});
	
	// run tests
	if (RUN_TESTS) {
		console.log("Running tests...");
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
		let homeLink = UiUtils.getLink("#", "Home");
		homeLink.click(function() { that.showHome(); });
		let faqLink = UiUtils.getLink("#faq", "FAQ");
		faqLink.click(function() { that.showFaq(); });
		let gitHubLink = $("<a target='_blank' href='https://github.com/cryptostorage/cryptostorage.com'>");
		gitHubLink.html("GitHub");
		let donateLink = UiUtils.getLink("#donate", "Donate");
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
			pageController.next(new GenerateKeysController($("<div>"), state, onKeysGenerated));
		}
	}
	
	function onSplitInput(numPieces, minPieces) {
		if (DEBUG) console.log("onSplitInput(" + numPieces + ", " + minPieces + ")");
		assertInt(numPieces);
		assertInt(minPieces);
		state.numPieces = numPieces;
		state.minPieces = minPieces;
		pageController.next(new GenerateKeysController($("<div>"), state, onKeysGenerated));
	}
	
	function onKeysGenerated(keys, pieces, pieceDivs) {
		if (DEBUG) console.log("onKeysGenerated(" + keys.length + ")");
		assertTrue(keys.length > 0);
		assertEquals(state.numPieces, pieces.length);
		state.keys = keys;
		state.pieces = pieces;
		state.pieceDivs = pieceDivs;
		pageController.next(new SaveController($("<div>"), state));
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
	
	function onKeysImported(keys, pieces, pieceDivs) {
		if (DEBUG) console.log("onKeysImported(" + keys.length + " keys)");
		assertTrue(keys.length >= 1);
		state.keys = keys;
		state.pieces = pieces;
		state.pieceDivs = pieceDivs;
		if (keys[0].isEncrypted()) pageController.next(new DecryptKeysController($("<div>"), state, onKeysImported));
		else {
			pageController.next(new SaveController($("<div>"), state));
		}
	}
}