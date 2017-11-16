// TODO
// public address (decrypt to view) instead of (omitted)
// ios print spans more than one page
// homepage design
// faq
// wait for images before loading homepage
// light blue little bit ligher / brighter
// harden inputs: >0, must have first currency, etc
// input errors
// run minimum tests when site accessed
// todos throughout code
// test alert if key creation fails for any reason
// verify no name collisions
// minimize initial dependencies: condense files to single files, lazy load css
// test on IE
// note of how b64-images.js is created
// how does jaxx generate zcash and bitcoin variations
// restrict file types for file picker

// design:
// export controller progress design, initial and re-render
// import / decryption complete - click button to view
// start over button on form
// start with all currencies on form
// bip38 checkboxes on form
// homepage scale too big on small screens?
// diagnostic checks: window.crypto, access from domain, live connection, open source browser
// ability to encrypt / decrypton export page?

// low priority:
// try all imported file / key combinations to recover
// prevent scroll revealing some of next picture
// copy line break in pdf inserts space
// code scan
// console warning "unexpected end of file" in firefox caused by ddslick
// timeouts in tests so browser doesn't lock
// csv import to support "bring your own keys"
// optimize tests by getting one set of keys of repeat_long size

// consult designers
// opinion on donate page + ui designer tip address - link to open user's wallet
// error messages on key generation page - let them click button once, outline with red, deactivate until they fix.  Constrain split input and keep in sync
// disable generate button until input valid? - let them click once then disable until error corrected
// color of generate buttons / pulsing? - form button same as home page, maybe shift to darker
// slider points, logos, and supporting content - fill icons with white, multiple locks
// BIP38 vs CryptoJS encryption option for BTC/BCH - checkbox on same line as "Show passphrase", "Use BIP38 for Bitcoin and Bitcoin Cash"
// live site warning to stop and download from github - orange bar on form page encouraging users to download
// warnings to test before using - add FAQ

/**
 * Invoked when document initialized.
 */
$(document).ready(function() {
	
	// delete window.crypto for testing
	if (DELETE_WINDOW_CRYPTO) delete window.crypto;
	
	// start loading common dependencies
	LOADER.load(APP_DEPENDENCIES, function() {
		
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
	new AppController($("body")).render();
});