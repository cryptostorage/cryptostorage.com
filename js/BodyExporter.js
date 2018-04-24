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
 * Renders an editor to the given window's body.
 * 
 * @param window is the window to export to
 * @param config specifies editor configuration
 * 				config.keyGenConfig is configuration to generate keypairs
 * 				config.pieces are pre-generated pieces to display
 * 				config.pieceRenderers are pre-rendered pieces to display
 * 				config.sourcePieces are source pieces that the given piece was generated from
 * 				config.showNotices specifies whether or not to show the notice bar
 *  			config.environmentInfo is initial environment to display
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
	if (config.pieceRenderers) {
		throw new Error("Transfer renderer divs not implemented");
	}
//	if (config.pieceDivs) {
//		var clonedDivs = [];
//		for (var i = 0; i < config.pieceDivs.length; i++) {
//			var clonedDiv = $("<div>", window.document);
//			clonedDiv[0].innerHTML = config.pieceDivs[i][0].outerHTML;
//			clonedDivs.push(clonedDiv);
//		}
//		config.pieceDivs = clonedDivs;
//	}
	
	// render editor
	new EditorController($("<div>").appendTo(body), config).render();
}