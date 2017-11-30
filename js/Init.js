/**
 * Invoked when document initialized.
 */
$(document).ready(function() {
	
	// assign window.crypto (supports IE11)
	window.crypto = window.crypto || window.msCrypto;
		
	// delete window.crypto for testing
	if (DELETE_WINDOW_CRYPTO) delete window.crypto;
	
	// render application to html body
	new AppController($("body")).render();
	
	// start loading common dependencies
	LOADER.load(APP_DEPENDENCIES);
	
	// run tests
	if (RUN_TESTS) {
		console.log("Running tests...");
		Tests.runTests(function(error) {
			if (error) throw error;
			console.log("All tests pass");
		});
	}
	
	// pre-load images
	preloadImage("img/xmark_small.png");
	preloadImage("img/warning_orange.png");
	preloadImage("img/checkmark_small.png");
	preloadImage("img/trash.png");
	function preloadImage(src) {
		var img = new Image();
		img.src = src;
	}
});