/**
 * Renders an export page to the current tab's body.
 * 
 * Used to run export code in child tab which is unaffected if parent tab is closed.
 * 
 * @param window is the window to export to
 * @param config is the export configuration
 * 				config.importedPieces are original imported pieces
 * 				config.keyGenConfig is a configuration to generate new storage
 * 				config.keys are keys to generate pieces from
 * 				config.pieces are pieces to export and generate pieceDivs from
 * 				config.pieceDivs are pre-generated piece divs ready for display
 * 				config.confirmExit specifies if the window should confirm exit if not saved or printed
 * 				config.showRegenerate specifies if the regenerate button should be shown
 * 				config.environmentInfo is initial info for the export (optional)
 */
window.exportToBody = function(window, config) {
	
	LOADER.load(AppUtils.getAppDependencies(), function(err) {
		loadImages(AppUtils.getAppImages(), function(err) {
			if (err) throw err;	// TODO
			
			// detect any uncaught errors
			window.onerror = function(err) {
				AppUtils.setRuntimeError(err);
			};
			
			// poll environment info on loop
			AppUtils.pollEnvironment(config.environmentInfo);	// TODO: this is getting called before ua-parser.js loaded
			
			// assign window.crypto (supports IE11)
			window.crypto = window.crypto || window.msCrypto;
			
			// pagination requires div attached to dom
			var body = $("body", window.document);
			var container = $("<div>").appendTo(body);
			container.hide();
			
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
			
			// handle two tabs with split and reconstituted pieces
			if (config.importedPieces && config.importedPieces.length > 1) {
				new ExportController($("<div>").appendTo(container), window, {pieces: config.importedPieces, confirmExit: config.confirmExit}).render(function(tab1) {
					var tabName2 = config.keys[0].isEncrypted() ? "Encrypted Keys" : "Decrypted Keys";
					new ExportController($("<div>").appendTo(container), window, config).render(function(tab2) {
						container.detach();
						container.children().detach();
						renderExportTabs(body, "Imported Pieces", tab1, tabName2, tab2, 1);
					});
				});
			}
			
			// handle one tab
			else {
				new ExportController($("<div>").appendTo(container), window, config).render(function(tab1) {
					container.detach();
					container.children().detach();
					renderExportTabs(body, null, tab1);
				});
			}
			
			function renderExportTabs(div, tabName1, tabContent1, tabName2, tabContent2, defaultTabIdx, onDone) {
				var tabController = new TwoTabController(div, tabName1, tabContent1, tabName2, tabContent2, defaultTabIdx);
				tabController.render(function(div) {
					tabController.getTabsDiv().addClass("export_tabs");
					if (onDone) onDone(div);
				});
			}
		});
	});
}