// TODO
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
// double click keys should select all

// consult designers
// icons of supported currencies on home page
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
const COMMON_DEPENDENCIES = ["lib/b64-images.js", "lib/jquery-csv.js", "lib/qrcode.js", "lib/jszip.js", "lib/FileSaver.js", "lib/crypto-js.js", "lib/bitaddress.js", "lib/progressbar.js", "lib/jquery.ddslick.js"];
var loader;

/**
 * Invoked when document initialized.
 */
$(document).ready(function() {
	
	// delete window.crypto for testing
	if (DELETE_WINDOW_CRYPTO) delete window.crypto;
	
	$("#slick_test").slick({
		dots: true
	});
	
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
	let homeController;
	let formController;
	let faqController;
	let donateController;
	
	this.render = function() {
		
		// header logo
		let headerDiv = $("<div class='app_header'>").appendTo(div);
		let logoLink = $("<a href='index.html'>").appendTo(headerDiv);
		$("<img class='app_header_logo_img' src='img/cryptostorage.png'>").appendTo(logoLink);
		
		// header links
		let linksDiv = $("<div class='app_header_links_div'>").appendTo(headerDiv);
		let homeLink = UiUtils.getLink("#", "Home");
		homeLink.click(function() { that.showHome(); });
		let faqLink = UiUtils.getLink("#faq", "FAQ");
		faqLink.click(function() { that.showFaq(); });
		let gitHubLink = $("<a target='_blank' href='https://github.com/cryptostorage/cryptostorage.com'>");
		gitHubLink.html("GitHub");
		let donateLink = UiUtils.getLink("#donate", "Donate");
		donateLink.click(function() { that.showDonate(); });
		linksDiv.append(homeLink);
		linksDiv.append("&nbsp;&nbsp;|&nbsp;&nbsp;");
		linksDiv.append(faqLink);
		linksDiv.append("&nbsp;&nbsp;|&nbsp;&nbsp;");
		linksDiv.append(gitHubLink);
		linksDiv.append("&nbsp;&nbsp;|&nbsp;&nbsp;");
		linksDiv.append(donateLink);
		
		// intro container
		let introDiv = $("<div class='intro_div'>").appendTo(div);
		
		// intro slider
		let sliderContainerDiv = $("<div class='slider_container'>").appendTo(introDiv);
		let sliderDiv = $("<div class='single-item'>").appendTo(sliderContainerDiv);
		for (let i = 0; i < 2; i++) {
			let slide = $("<div>");
			slide.html("Slide " + (i + 1));
			sliderDiv.append(slide);
		}
		sliderDiv.slick({dots: true});
		
		// button to generate keys
		let btnGenerate = $("<div class='btn btn_start_generate'>").appendTo(div);
		btnGenerate.append("Generate New Keys");
		btnGenerate.click(function() { onSelectGenerate(); });
		
		// button to recover keys
		let btnRecover = $("<div class='btn btn_recover'>").appendTo(div);
		btnRecover.append("or Recover Existing Keys");
		btnRecover.click(function() { onSelectRecover(); });
		
		// main content
		contentDiv = $("<div class='app_content'>").appendTo(div);
		
		// initialize controllers
		homeController = new HomeController($("<div>"), onSelectGenerate, onSelectRecover);
		formController = new FormController($("<div>"));
		faqController = new FaqController($("<div>"));
		donateController = new DonateController($("<div>"));
		faqController.render();
		donateController.render();
		
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
		});
	}
	
	this.showHome = function() {
		if (DEBUG) console.log("showHome()");
		setContentDiv(homeController.getDiv());
	}
	
	this.showForm = function() {
		if (DEBUG) console.log("showForm()");
		formController.render(function(div) {
			setContentDiv(div);
		});
	}
	
	this.showFaq = function() {
		if (DEBUG) console.log("showFaq()");
		setContentDiv(faqController.getDiv());
	}
	
	this.showDonate = function() {
		if (DEBUG) console.log("showDonate()");
		setContentDiv(donateController.getDiv());
	}
	
	function setContentDiv(div) {
		while (contentDiv.get(0).hasChildNodes()) {
			contentDiv.get(0).removeChild(contentDiv.get(0).lastChild);
		}
		contentDiv.append(div);
	}
	
	// ---------------------------------- PRIVATE -------------------------------
	
	function onSelectGenerate() {
		if (DEBUG) console.log("onSelectGenerate()");
		that.showForm();
	}
	
	function onSelectRecover() {
		if (DEBUG) console.log("onSelectRecover()");
	}
}