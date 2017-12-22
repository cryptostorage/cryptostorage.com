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
	new AppController($("body")).render(function() {
		
	});
	
//		// start loading common dependencies
//		LOADER.load(AppUtils.getAppDependencies(), function() {
//			
//			// run minimum tests
//		<script src="js/PieceRenderer.js"></script>
//		<script src="js/Tests.js"></script>
//			AppUtils.runMinimumTests(function(err) {
//				if (err) AppUtils.setRuntimeError(err);
//			});
//		});
//		
//		// run test suite
//		if (AppUtils.RUN_TESTS) {
//			console.log("Running tests...");
//			Tests.runTests(function(error) {
//				if (error) throw error;
//				console.log("All tests pass");
//			});
//		}
//		
//		// pre-load images
//		var imgDiv = $("<div>").appendTo($("body"));
//		imgDiv.hide();
//		preloadImage("img/computer.png");
//		preloadImage("img/browser.png");
//		preloadImage("img/internet.png");
//		preloadImage("img/download.png");
//		preloadImage("img/construction.png");
//		preloadImage("img/skull.png");
//		preloadImage("img/circle_x.png");
//		preloadImage("img/circle_exclamation.png");
//		preloadImage("img/circle_checkmark.png");
//		preloadImage("img/trash.png");
//		preloadImage("img/file.png");
//		preloadImage("img/files.png");
//		function preloadImage(src) {
//			var img = new Image();
//			img.src = src;
//			imgDiv.append(img);
//		}
});