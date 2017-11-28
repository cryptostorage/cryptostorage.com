/**
 * Invoked when document initialized.
 */
$(document).ready(function() {
	
	// assign window.crypto (supports IE11)
	window.crypto = window.crypto || window.msCrypto;
		
	// delete window.crypto for testing
	if (DELETE_WINDOW_CRYPTO) delete window.crypto;
	
	// start loading common dependencies
	LOADER.load(APP_DEPENDENCIES, function() {
		
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