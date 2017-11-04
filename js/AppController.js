// TODO
// all the error messages
// memory bug in bip38 encryption
// num keys input flashes on first load
// cannot delete first currency
// faq
// donate
// label keys with pieces e.g. #1.3, #2.3, #3.3
// peer review key formats
// piece export: print, download, select pieces
// faster load time

// generate export tab, then in source change to import, export tab no longer works
// public address "decrypt private key to view"
// ddslick pulldown loading before homepage loads, dependency management
// load all of home page when all images loaded
// plugin.newKey() returns null for unrecognized strs instead of throws error
// ios print spans more than one page
// was able to print missing pair divs with large number of keys (200)
// low priority: try all imported file / key combinations to recover
// scale too big on small screens, carousel doesn't slide when hovered but can't see when scroll down

// slider:
// prevent scroll revealing some of next picture
// sometimes scroll timer doesn't start for like 8 seconds - new slider?

// use @media to dynamically space piece pages
// todos throughout code
// run minimum tests when site accessed
// test alert if key creation fails for any reason
// verify no name collisions
// file import zip with invalid json shouldn't prevent others from importing
// wording on front page / be consistent
// condense files to single files as much as possible
// warning if live and/or online
// test on IE
// smaller html exports
// note of how b64-images.js is created
// how does jaxx generate zcash and bitcoin variations
// warning to discard storage
// double click keys should select all
// hide page breaks in previews with @media print
// copy line break in pdf inserts space
// import html / other formats?
// restrict file types for file picker
// code scan

// consult designers
// opinion on donate page + ui designer tip address - link to open user's wallet
// color of 'c' within cs logo - little bit lighter
// error messages on key generation page - let them click button once, outline with red, deactivate until they fix.  Constrain split input and keep in sync
// disable generate button until input valid?
// color of generate buttons / pulsing? - form button same as home page, maybe shift to darker
// slider points, logos, and supporting content - fill icons with white, multiple locks
// BIP38 vs CryptoJS encryption option for BTC/BCH - checkbox on same line as "Show passphrase", "Use BIP38 for Bitcoin and Bitcoin Cash"
// export flow after key generation + options
// import flow to read zip + import from private key
// how to handle progress bar + status during key generation - hijack button to display both progress and status
// live site warning to stop and download from github - orange bar on form page encouraging users to download
// use tabs for pieces?
// mobile static frame?
// password confirmation - re-enter or show
// title bar should not scroll?
// warnings to test before using - add FAQ
// code review

// low priority
// console warning "unexpected end of file" in firefox caused by ddslick
// html export is horizontally centered with @media print for actual print
// timeouts in tests so browser doesn't lock
// csv import to support "bring your own keys"
// optimize tests by getting one set of keys of repeat_long size
// depressed blue format on hover for links - why does it stay hovered?

const RUN_TESTS = false;
const DEBUG = true;
const DELETE_WINDOW_CRYPTO = false;
const VERIFY_ENCRYPTION = false;
const COMMON_DEPENDENCIES = ["lib/b64-images.js", "lib/jquery-csv.js", "lib/qrcode.js", "lib/jszip.js", "lib/FileSaver.js", "lib/crypto-js.js", "lib/bitaddress.js", "lib/progressbar.js", "lib/jquery.ddslick.js"];
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
		
		// get data url of logo
//		let plugin = CryptoUtils.getCryptoPlugin("BCH");
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
	var appController = new AppController($("body"));
	appController.render();
	
	// preload donation page
	loader.load("lib/qrcode.js", function() {
		appController.loadDonationPage();
	});
});

/**
 * Controls the entire application.
 * 
 * @param div is the div to render the application to
 */
function AppController(div) {
	
	let that = this;
	let sliderController;
	let sliderDiv;
	let contentDiv;
	let homeController;
	let formController;
	let recoverController;
	let faqController;
	let donateController;
	
	this.render = function(onDone) {
		div.empty();
		
		// header
		let headerDiv = $("<div class='app_header'>").appendTo(div);
		
		// header logo
		let headerTopDiv = $("<div class='app_header_top'>").appendTo(headerDiv);
		let logo = $("<img class='app_header_logo_img' src='img/cryptostorage.png'>").appendTo(headerTopDiv);
		logo.click(function() {
			that.showHome();
		});
		
		// header links
		let linksDiv = $("<div class='app_header_links_div'>").appendTo(headerTopDiv);
		let homeLink = getLinkDiv("Home");
		homeLink.click(function() {
			window.location.href = "#";
			that.showHome();
		});
		let gitHubLink = getLinkDiv("GitHub");
		gitHubLink.click(function() { window.open("https://github.com/cryptostorage/cryptostorage.com", "_blank"); });
		let faqLink = getLinkDiv("FAQ");
		faqLink.click(function() {
			window.location.href = "#faq";
			that.showFaq();
		});
		let donateLink = getLinkDiv("Donate");
		donateLink.click(function() {
			window.location.href = "#donate";
			that.showDonate();
		});
		linksDiv.append(homeLink);
		linksDiv.append(gitHubLink);
		linksDiv.append(faqLink);
		linksDiv.append(donateLink);
		
		function getLinkDiv(label) {
			let div = $("<div class='link_div'>");
			div.html(label);
			return div;
		}
		
		// slider
		sliderDiv = $("<div>").appendTo(headerDiv);
		sliderController = new SliderController(sliderDiv, onSelectGenerate, onSelectRecover);
		
		// main content
		contentDiv = $("<div class='app_content'>").appendTo(div);
		
		// initialize controllers
		homeController = new HomeController($("<div>"), onCurrencyClicked);
		formController = new FormController($("<div>"));
		recoverController = new RecoverController($("<div>"));
		faqController = new FaqController($("<div>"));
		donateController = new DonateController($("<div>"));
		recoverController.render();
		faqController.render();
		
		// timeout fixes issue on safari where cryptostorage logo doesn't reliably show
		setImmediate(function() {
			
			// render body and start on home
			homeController.render(function() {
				
				// get identifier
				let href = window.location.href;
				let lastIdx = href.lastIndexOf("#");
				let identifier = lastIdx === -1 ? null : href.substring(lastIdx + 1);
				
				// show page based on identifier
				if (identifier === "faq") that.showFaq();
				else if (identifier === "donate") that.showDonate();
				else that.showHome();
				
				// done rendering
				if (onDone) onDone(div);
			});
		});
	}
	
	this.showHome = function() {
		if (DEBUG) console.log("showHome()");
		sliderDiv.show();
		sliderController.render(function(div) {
			setContentDiv(homeController.getDiv());
		});
	}
	
	this.showForm = function(onDone) {
		if (DEBUG) console.log("showForm()");
		formController.render(function(div) {
			setContentDiv(div);
			sliderDiv.hide();
			if (onDone) onDone();
		});
	}
	
	this.showFaq = function() {
		if (DEBUG) console.log("showFaq()");
		setContentDiv(faqController.getDiv());
		sliderDiv.hide();
	}
	
	this.showDonate = function() {
		if (DEBUG) console.log("showDonate()");
		sliderDiv.hide();
		setContentDiv(donateController.getDiv());
	}
	
	this.showRecover = function() {
		if (DEBUG) console.log("showRecover()");
		sliderDiv.hide();
		setContentDiv(recoverController.getDiv());
	}
	
	this.loadDonationPage = function() {
		donateController.render();
	}
	
	// ---------------------------------- PRIVATE -------------------------------
	
	function setContentDiv(div) {
		while (contentDiv.get(0).hasChildNodes()) {
			contentDiv.get(0).removeChild(contentDiv.get(0).lastChild);
		}
		contentDiv.append(div);
	}
	
	function onSelectGenerate() {
		that.showForm();
	}
	
	function onSelectRecover() {
		that.showRecover();
	}
	
	function onCurrencyClicked(plugin) {
		if (DEBUG) console.log("onCurrencyClicked(" + plugin.getName() + ")");
	}
}
inheritsFrom(AppController, DivController);