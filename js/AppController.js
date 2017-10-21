// TODO
// lines to represent split
// clicking on currency takes action
// all the error messages
// memory bug in bip38 encryption
// faq
// donate
// label keys with pieces e.g. #1.3, #2.3, #3.3
// peer review key formats
// piece export: print, download, select pieces

// drop down:
// tweak styling
// console warning

// slider:
// prevent scroll revealing some of next picture
// sometimes scroll timer doesn't start for like 8 seconds - new slider?

// use @media to dynamically space piece pages
// todos throughout code
// run minimum tests when site accessed
// test alert if key creation fails for any reason
// verify no name collisions
// bip38 not working on old hardware
// file import zip with invalid json shouldn't prevent others from importing
// live site warning to stop and download from github
// wording on front page / be consistent
// condense files to single files as much as possible
// warning if live and/or online
// test on IE
// smaller html exports
// note of how b64-images.js is created
// how does jaxx generate zcash and bitcoin variations
// warning to discard storage
// double click keys should select all

// consult designers
// improve selling points
// render progress bar and status
// mobile static frame?
// use tabs for pieces?
// password confirmation - re-enter or show
// title bar should not scroll?
// select one or more currencies to store (consistent look with number of addresses input)
// enter the number of addresses for each currency || enter the number of Bitcoin addresses to create)
// summary page has table with logos
// potentially collapse selection and address input
// make it clearer what to do next on save page
// navigation bar showing overall place in flow
// warnings to test before using
// register shortcut keys for page navigation (enter, y, n)
// focus on first text element if applicable
// disable next if mix num keys change
// hide page breaks in previews with @media print
// copy line break in pdf inserts space
// code review
// import html / other formats?
// restrict file types for file picker
// code scan

// low priority
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
		//linksDiv.append("&nbsp|&nbsp;");
		linksDiv.append(gitHubLink);
		//linksDiv.append("&nbsp;|&nbsp;");
		linksDiv.append(faqLink);
		//linksDiv.append("&nbsp;|&nbsp;");
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
		faqController = new FaqController($("<div>"));
		donateController = new DonateController($("<div>"));
		faqController.render();
		
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
		if (DEBUG) console.log("onSelectGenerate()");
		that.showForm();
	}
	
	function onSelectRecover() {
		if (DEBUG) console.log("onSelectRecover()");
	}
	
	function onCurrencyClicked(plugin) {
		if (DEBUG) console.log("onCurrencyClicked(" + plugin.getName() + ")");
//			setContentDiv(formController.getDiv());
//			sliderDiv.hide();
		formController.render(function(div) {
			formController.quickGenerate(plugin, function() {
				setContentDiv(formController.getDiv());
				sliderDiv.hide();
				formController.setSelectedCurrency(plugin);
			});
		});
//		that.showForm(function() {
//			formController.quickGenerate(plugin);
//		});
	}
}
inheritsFrom(AppController, DivController);