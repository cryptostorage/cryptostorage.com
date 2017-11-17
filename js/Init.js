// TODO
// import/export design
// form validation
// security checks
// homepage
// faq
// safari export checkboxes move
// wait for images before loading homepage
// run minimum tests when site accessed
// todos throughout code
// test alert if key creation fails for any reason
// minimize initial dependencies: condense files to single files, lazy load css
// test on IE

// design:
// export controller progress design, initial and re-render
// import / decryption complete - click button to view
// start over button on form
// start with all currencies on form
// bip38 checkboxes on form
// diagnostic checks: window.crypto, access from domain, live connection, open source browser
// ability to encrypt / decrypton export page?
// print progress
// homepage scale too big on small screens?
// light blue little bit ligher / brighter
// homepage design with 8 supported currencies

// low priority:
// save as txt and csv
// try all imported file / key combinations to recover
// prevent scroll revealing some of next picture
// copy line break in pdf inserts space
// code scan
// console warning "unexpected end of file" in firefox caused by ddslick
// timeouts in tests so browser doesn't lock
// csv import to support "bring your own keys"
// optimize tests by getting one set of keys of repeat_long size
// verify no name collisions
// how does jaxx generate zcash and bitcoin variations

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
		
		CryptoUtils.getSecurityChecks(function(securityChecks) {
			console.log(securityChecks);
		});
		
		// generate lib/b64-images.js file
		if (GENERATE_B64_IMAGES) {
			CryptoUtils.getB64ImageFile(function(js) {
				LOADER.load("lib/FileSaver.js", function() {
					saveAs(new Blob([js]), "b64-images.js");
				});
			});
		}
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