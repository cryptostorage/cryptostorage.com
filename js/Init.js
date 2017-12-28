/**
 * Invoked when document initialized.
 */
$(document).ready(function() {
	
	// catch unexpected errors
	window.onerror = function(err) {
		if (err) AppUtils.setRuntimeError(err);
		throw err;
	};

	// assign window.crypto (supports IE11)
	window.crypto = window.crypto || window.msCrypto;
		
	// delete window.crypto for testing
	if (AppUtils.DELETE_WINDOW_CRYPTO) delete window.crypto;
	
	// render application to html body
	new AppController($("body")).render(function() {
		
		// load notice bar and tests
		LOADER.load(AppUtils.getNoticeDependencies().concat(["js/Tests.js"]), function(err) {
				
			// run minimum tests
			AppUtils.runMinimumTests(function(err) {
				if (err) AppUtils.setRuntimeError(err);
			});
			
			// run test suite
			if (AppUtils.RUN_TESTS) {
				LOADER.load("js/Tests.js", function(err) {
					if (err) throw err;
					console.log("Running tests...");
					Tests.runTests(function(error) {
						if (error) throw error;
						console.log("All tests pass");
					});
				});
			}
		});
	});
});