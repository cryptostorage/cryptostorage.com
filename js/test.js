function renderExport(importedPieces, keyGenConfig, keys, pieces, pieceDivs) {
	
	// pagination requires div attached to dom
	let container = $("<div>").appendTo($("body"));
	container.hide();
	let body = $("body");
	
	//handle two tabs with split and reconstituted pieces
	if (importedPieces && importedPieces.length > 1) {
		new ExportController($("<div>").appendTo(container), window, null, null, importedPieces).render(function(tab1) {
			let tabName2 = keys[0].isEncrypted() ? "Encrypted Keys" : "Decrypted Keys";
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
		let tabController = new TwoTabController(div, tabName1, tabContent1, tabName2, tabContent2, defaultTabIdx);
		tabController.render(function(div) {
			tabController.getTabsDiv().addClass("export_tabs");
			if (onDone) onDone(div);
		});
	}
}