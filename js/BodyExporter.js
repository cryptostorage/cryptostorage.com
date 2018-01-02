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