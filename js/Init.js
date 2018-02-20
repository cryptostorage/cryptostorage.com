/**
 * MIT License
 * 
 * Copyright (c) 2018 cryptostorage
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Invoked when document initialized.
 */
$(document).ready(function() {
	
	// welcome :)
	console.log("Hey there!  Find an issue?  Let us know!  Submit an issue at https://github.com/cryptostorage/cryptostorage.com/issues");
	
	// catch unexpected errors
	window.onerror = function(err) {
		AppUtils.setRuntimeError(err);
		throw err;
	};

	// assign window.crypto (supports IE11)
	window.crypto = window.crypto || window.msCrypto;
	
	// override Math.random() to use a cryptographically secure RNG
	Math.random = function() {
    var randArray = new Uint32Array(1);
    window.crypto.getRandomValues(randArray);
    return randArray[0] / Math.pow(2, 32);
	}
		
	// delete window.crypto for testing
	if (AppUtils.DELETE_WINDOW_CRYPTO) delete window.crypto;
	
	// render application to html body
	new AppController($("body")).render(function() {
		
		// run tests
		if (AppUtils.RUN_MIN_TESTS || AppUtils.RUN_FULL_TESTS) {
			
			// load dependencies
			LOADER.load(AppUtils.getAppDependencies(), function(err) {
				if (err) throw err;
				
				// run minimum tests
				if (AppUtils.RUN_MIN_TESTS) {
					AppUtils.runMinimumTests(function(err) {
						if (err) throw err;
						console.log("Minimum tests pass");
					});
				}
				
				// run full tests
				if (AppUtils.RUN_FULL_TESTS) {
					console.log("Running test suite...");
					Tests.runTests(function(err) {
						if (err) throw err;
						console.log("Test suite passes");
					});
				}
			});
		}
	});
});