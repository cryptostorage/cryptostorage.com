/**
 * Renders an export page to the current tab's body.
 * 
 * Used to run export code in child tab which is unaffected if parent tab is closed.
 * 
 * @param window is the window to export to
 * @param importedPieces are original exported pieces
 * @param keyGenConfig is a configuration to generate new storage
 * @param keys are keys to generate pieces from
 * @param pieces are pieces to export and generate pieceDivs from
 * @param pieceDivs are pre-generated piece divs ready for display
 */
window.exportToBody = function(window, importedPieces, keyGenConfig, keys, pieces, pieceDivs) {
	
	// pagination requires div attached to dom
	var body = $("body", window.document);
	var container = $("<div>").appendTo(body);
	container.hide();
	
	// handle two tabs with split and reconstituted pieces
	if (importedPieces && importedPieces.length > 1) {
		new ExportController($("<div>").appendTo(container), window, null, null, importedPieces).render(function(tab1) {
			var tabName2 = keys[0].isEncrypted() ? "Encrypted Keys" : "Decrypted Keys";
			new ExportController($("<div>").appendTo(container), window, keyGenConfig, keys, pieces, pieceDivs).render(function(tab2) {
				container.detach();
				container.children().detach();
				renderExportTabs(body, "Imported Pieces", tab1, tabName2, tab2, 1);
			});
		});
	}
	
	// handle one tab
	else {
		new ExportController($("<div>").appendTo(container), window, keyGenConfig, keys, pieces, pieceDivs).render(function(tab1) {
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
}