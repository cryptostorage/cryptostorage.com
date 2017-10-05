// TODO
// use onHide(), don't auto advance if not next, ability to cancel
// polish: disable arrow transparent, coin logos throughout pages
// memory profiling
// new design
// faq page
// donation page
// label keys with pieces e.g. #1.3, #2.3, #3.3
// peer review key formats

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
// warnings to test before using
// register shortcut keys for page navigation (enter, y, n)
// focus on first text element if applicable
// solve issue where next page may take time to load, but previous page is done
// prevent rendered page from showing after home, FAQ or donate clicked
// home button maintains state, doesn't start over
// disable next if mix num keys change
// Include -> Omit public addresses
// horizontal scrolling bars on chrome and safari
// hide page breaks in previews with @media print

// low priority
// all div controllers directly modify state
// html export is horizontally centered with @media print for actual print
// timeouts in tests so browser doesn't lock
// csv import to support "bring your own keys"
// optimize tests by getting one set of keys of repeat_long size

const RUN_TESTS = false;
const DEBUG = true;
const DELETE_WINDOW_CRYPTO = false;
const VERIFY_ENCRYPTION = false;
const COMMON_DEPENDENCIES = ["lib/b64-images.js", "lib/jquery-csv.js", "lib/qrcode.js", "lib/jszip.js", "lib/FileSaver.js", "lib/crypto-js.js", "lib/bitaddress.js", "lib/progressbar.js"];
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
	new ApplicationController($("body")).render();
});

/**
 * Controls the entire application.
 * 
 * @param div is the div to render the application to
 */
function ApplicationController(div) {
	
	let that = this;
	let contentDiv;
	let flowController;
	let faqController;
	let donateController;
	
	this.render = function() {
		
		// header
		let headerDiv = $("<div class='app_header'>").appendTo(div);
		let logoLink = $("<a href='index.html'>").appendTo(headerDiv);
		$("<img class='app_header_logo' src='img/cryptostorage.png'>").appendTo(logoLink);
		
		// main content
		contentDiv = $("<div class='app_content'>").appendTo(div);
		
		// initialize controllers
		flowController = new FlowController($("<div class='flow_container'>"), that);
		faqController = new PageControllerFaq($("<div>"), that);
		donateController = new PageControllerDonate($("<div>"), that);
		faqController.render();
		donateController.render();
		
		// timeout fixes issue on safari where cryptostorage logo doesn't reliably show
		setTimeout(function() {
			
			// render body and start on home
			flowController.render(function() {
				
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
	
	this.getFlowController = function() {
		return flowController;
	}
	
	this.getMainState = function() {
		return flowController.getState();
	}
	
	this.showHome = function() {
		if (DEBUG) console.log("showHome()");
		clearContents();
		contentDiv.append(flowController.getDiv());
	}
	
	this.showFaq = function() {
		if (DEBUG) console.log("showFaq()");
		clearContents();
		contentDiv.append(faqController.getDiv());
	}
	
	this.showDonate = function() {
		if (DEBUG) console.log("showDonate()");
		clearContents();
		contentDiv.append(donateController.getDiv());
	}
	
	function clearContents() {
		while (contentDiv.get(0).hasChildNodes()) {
			contentDiv.get(0).removeChild(contentDiv.get(0).lastChild);
		}
	}
}