/**
 * Invoked when document initialized.
 */
$(document).ready(function() {
	
	// detect any uncaught errors
	window.onerror = function(err) {
		AppUtils.setRuntimeError(err);
	};
	
	// assign window.crypto (supports IE11)
	window.crypto = window.crypto || window.msCrypto;
		
	// delete window.crypto for testing
	if (AppUtils.DELETE_WINDOW_CRYPTO) delete window.crypto;
	
	// render application to html body
	new AppController($("body")).render();
	
	// start loading common dependencies
	LOADER.load(AppUtils.APP_DEPENDENCIES, function() {
		
		// run minimum tests
		AppUtils.runMinimumTests(function(err) {
			if (err) AppUtils.setRuntimeError(err);
		});
	});
	
	// run test suite
	if (AppUtils.RUN_TESTS) {
		console.log("Running tests...");
		Tests.runTests(function(error) {
			if (error) throw error;
			console.log("All tests pass");
		});
	}
	
	// pre-load images
	var imgDiv = $("<div>").appendTo($("body"));
	imgDiv.hide();
	preloadImage("img/xmark_small.png");
	preloadImage("img/warning_orange.png");
	preloadImage("img/checkmark_small.png");
	preloadImage("img/trash.png");
	function preloadImage(src) {
		var img = new Image();
		img.src = src;
		imgDiv.append(img);
	}
});