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
 * Renders an export page to the current tab's body.
 * 
 * Used to run export code in child tab which is unaffected if parent tab is closed.
 * 
 * @param window is the window to export to
 * @param config is the export configuration
 * 				config.splitPieces are imported split pieces
 * 				config.keyGenConfig is a configuration to generate new storage
 * 				config.keys are keys to generate pieces from
 * 				config.pieces are pieces to export and generate pieceDivs from
 * 				config.pieceDivs are pre-generated piece divs ready for display
 * 				config.confirmExit specifies if the window should confirm exit
 * 				config.showRegenerate specifies if the regenerate button should be shown
 * 				config.environmentInfo is initial info for the export (optional)
 */
window.exportToBody = function(window, config) {

	// detect any uncaught errors
	window.onerror = function(err) {
		AppUtils.setRuntimeError(err);
		throw err;
	}
	
	// set initial environment info
	if (config.environmentInfo) AppUtils.setCachedEnvironment(config.environmentInfo);
	
	// assign window.crypto (supports IE11)
	window.crypto = window.crypto || window.msCrypto;
	
	// override Math.random() to use a cryptographically secure RNG
	if (window.crypto) {
		Math.random = function() {
	    var randArray = new Uint32Array(1);
	    window.crypto.getRandomValues(randArray);
	    return randArray[0] / Math.pow(2, 32);
		}
	}
	
	// pagination requires div attached to dom
	var body = $("body", window.document);
	
	// clone piece divs because IE cannot transfer elements across windows
	if (config.pieceDivs) {
		var clonedDivs = [];
		for (var i = 0; i < config.pieceDivs.length; i++) {
			var clonedDiv = $("<div>", window.document);
			clonedDiv[0].innerHTML = config.pieceDivs[i][0].outerHTML;
			clonedDivs.push(clonedDiv);
		}
		config.pieceDivs = clonedDivs;
	}
	
	// render storage export
	new ExportController($("<div>").appendTo(body), window, config).render();
}