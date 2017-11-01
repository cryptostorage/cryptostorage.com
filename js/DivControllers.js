/**
 * UI utilities.
 */
let UiUtils = {
		
	setupContentDiv: function(div) {
		div.empty();
		div.attr("class", "page_div");
	},
	
	getProgressBar: function(div) {
		return new ProgressBar.Line(div.get(0), {
			strokeWidth: 2.5,
			color: 'rgb(96, 178, 198)',	// cryptostorage teal
			duration: 0,
			svgStyle: {width: '100%', height: '100%'},
			text: {
				className: 'progresbar-text',
				style: {
					color: 'black',
          position: 'absolute',
          left: '50%',
          top: '50%',
          padding: 0,
          margin: 0,
          transform: {
              prefix: true,
              value: 'translate(-50%, -50%)'
          }
				}
			}
		});
	},
	
	getCurrencyRow: function(plugins, isMajor, onCurrencyClicked) {
		let row = $("<div class='currency_row'>");
		for (let plugin of plugins) {
			let item = $("<div>").appendTo(row);
			item.attr("class", isMajor ? "currency_row_item_major" : "currency_row_item_minor");
			item.click(function() { onCurrencyClicked(plugin); });
			let img = $("<img src='" + plugin.getLogo().get(0).src + "'>").appendTo(item);
			img.attr("class", isMajor ? "currency_row_logo_major" : "currency_row_logo_minor");
			img.append(plugin.getLogo());
			let label = $("<div>").appendTo(item);
			label.attr("class", isMajor ? "currency_row_label_major" : "currency_row_label_minor");
			label.html(plugin.getName());
		}
		return row;
	}
}

/**
 * Base class to render and control a div.
 */
function DivController(div) {
	this.div = div;
}
DivController.prototype.getDiv = function() { return this.div; }
DivController.prototype.render = function(onDone) { }	// callback called with rendered div
DivController.prototype.onShow = function() { }
DivController.prototype.onHide = function() { }

/**
 * Slider main features.
 */
function SliderController(div, onSelectGenerate, onSelectRecover) {
	DivController.call(this, div);
	this.render = function(onDone) {
		div.empty();
		div.attr("class", "intro_div");
		
		// intro slider
		let sliderContainerDiv = $("<div class='slider_container'>").appendTo(div);
		let sliderDiv = $("<div class='single-item'>").appendTo(sliderContainerDiv);
		getSlide($("<img src='img/mix.png'>"), "Generate secure storage for multiple cryptocurrencies.").appendTo(sliderDiv);
		getSlide($("<img src='img/security.png'>"), "Keys are generated in your browser so funds are never entrusted to a third party.").appendTo(sliderDiv);
		getSlide($("<img src='img/printer.png'>"), "Export to digital and printable formats for safe storage and easy recovery.").appendTo(sliderDiv);
		getSlide($("<img src='img/search_file.png'>"), "100% open source and free to use.  No account necessary.").appendTo(sliderDiv);
		getSlide($("<img src='img/password_protected.png'>"), "Private keys can be password protected and split into pieces.").appendTo(sliderDiv);
		sliderDiv.slick({autoplay:true, arrows:false, dots:true, autoplaySpeed:3000});
		
		function getSlide(img, text) {
			let slide = $("<div class='slide'>");
			let slideContent = $("<div class='slide_content'>").appendTo(slide);
			if (img) {
				let imgDiv = $("<div>").appendTo(slideContent);
				img.appendTo(imgDiv);
				img.attr("class", "slide_img");
			}
			let labelDiv = $("<div class='slide_label'>").appendTo(slideContent);
			labelDiv.html(text);
			return slide;
		}
		
		// call to action is overlaid
		let ctaDiv = $("<div class='cta_div'>").appendTo(div);
		
		// button to generate keys
		let btnGenerate = $("<div class='btn btn_start_generate'>").appendTo(ctaDiv);
		btnGenerate.append("Generate New Keys");
		btnGenerate.click(function() { onSelectGenerate(); });
		
		// button to recover keys
		let btnRecover = $("<div class='btn btn_recover'>").appendTo(ctaDiv);
		btnRecover.append("or Recover Existing Keys");
		btnRecover.click(function() { onSelectRecover(); });
		
		if (onDone) onDone(div);
	}
}
inheritsFrom(SliderController, DivController);

/**
 * Home page content.
 * 
 * @param div is the div to render to
 * @param onCurrencyClicked(plugin) is called when the user clicks a currency
 */
function HomeController(div, onCurrencyClicked) {
	DivController.call(this, div);
	this.render = function(onDone) {
		div.empty();
		div.attr("class", "page_div home_div");
		
		// supported currencies
		div.append("Supports these popular cryptocurrencies");
		let plugins = CryptoUtils.getCryptoPlugins();
		div.append(UiUtils.getCurrencyRow(plugins.slice(0, 3), true, onCurrencyClicked));
		for (let i = 3; i < plugins.length; i += 4) {
			div.append(UiUtils.getCurrencyRow(plugins.slice(i, i + 4), false, onCurrencyClicked));
		}
		
		if (onDone) onDone(div);
	}
}
inheritsFrom(HomeController, DivController);

/**
 * FAQ page.
 */
function FaqController(div) {
	DivController.call(this, div);
	this.render = function(onDone) {
		UiUtils.setupContentDiv(div);
		
		let titleDiv = $("<div class='title'>").appendTo(div);
		titleDiv.html("Frequently Asked Questions");
		
		$("<div class='question'>").html("What is cryptostorage.com?").appendTo(div);
		$("<div class='answer'>").html("Cryptostorage.com is an open source application to generate public/private key pairs for multiple cryptocurrencies.  This site runs only in your device's browser.").appendTo(div);
		$("<div class='question'>").html("How should I use cryptostorage.com to generate secure storage for my cryptocurrencies?").appendTo(div);
		$("<div class='answer'>").html("<ol><li>Download the source code and its signature file to a flash drive.</li><li>Verify the source code has not been tampered with: TODO</li><li>Test before using by sending a small transaction and verifying that funds can be recovered from the private key.</li></ol>").appendTo(div);
		$("<div class='question'>").html("How can I trust this service?").appendTo(div);
		$("<div class='answer'>").html("Cryptostorage.com is 100% open source and verifiable.  Downloading and verifying the source code will ensure the source code matches what is publicly audited.  See \"How do I generate secure storage using cryptostorage.com?\" for instructions to download and verify the source code.").appendTo(div);
		$("<div class='question'>").html("Do I need internet access to recover my private keys?").appendTo(div);
		$("<div class='answer'>").html("No.  The source code is everything you need to recover the private keys.  Users should save a copy of this site for future use so there is no dependence on third parties to access this software.  Further, the source code for this site is hosted on GitHub.com. (TODO)").appendTo(div);
		$("<div class='question'>").html("Can I send funds from private keys using cryptostorage.com?").appendTo(div);
		$("<div class='answer'>").html("Not currently.  Cryptostorage.com is a public/private key generation and recovery service.  It is expected that users will import private keys into the wallet software of their choice after keys have been recovered using crypstorage.com.  Support to send funds from cryptostorage.com may be considered in the future.").appendTo(div);
		$("<div class='question'>").html("What formats can I export to?").appendTo(div);
		$("<div class='answer'>").html("TODO").appendTo(div);
		
		// done rendering
		if (onDone) onDone(div);
	}
}
inheritsFrom(FaqController, DivController);

/**
 * Donate page.
 */
function DonateController(div, appController) {
	DivController.call(this, div);
	
	this.render = function(onDone) {
		UiUtils.setupContentDiv(div);
		
		// load qr code dependency
		loader.load("lib/qrcode.js", function() {
			
			// build donate section
			let titleDiv = $("<div class='title'>").appendTo(div);
			titleDiv.html("Donate");
			let values = [];
			for (let plugin of CryptoUtils.getCryptoPlugins()) {
				values.push({
					logo: plugin.getLogo(),
					label: plugin.getName(),
					value: plugin.getDonationAddress()
				});
			}
			renderValues(values, null, null, function(valuesDiv) {
				div.append(valuesDiv);
				
				// build credits section
				div.append("<br><br>");
				titleDiv = $("<div class='title'>").appendTo(div);
				titleDiv.html("Credits");
				let values = [];
				values.push({
					logo: CryptoUtils.getCryptoPlugin("BTC").getLogo(),
					label: "bitaddress.org",
					value: "1NiNja1bUmhSoTXozBRBEtR8LeF9TGbZBN"
				});
				values.push({
					logo: CryptoUtils.getCryptoPlugin("XMR").getLogo(),
					label: "moneroaddress.org",
					value: "4AfUP827TeRZ1cck3tZThgZbRCEwBrpcJTkA1LCiyFVuMH4b5y59bKMZHGb9y58K3gSjWDCBsB4RkGsGDhsmMG5R2qmbLeW"
				});
				renderValues(values, null, null, function(valuesDiv) {
					div.append(valuesDiv);
					if (onDone) onDone(div);
				});
			});
		});
		
		/**
		 * Renders the given values.
		 * 
		 * @param values are [{logo: <logo>, label: <label>, value: <value>}, ...].
		 * @param config is the config to render (TODO)
		 * @param onProgress(done, total, label) is invoked as progress is made (TODO)
		 * @param onDone(div) is invoked when done
		 */
		function renderValues(values, config, onProgress, onDone) {
			
			// div to render to
			let valuesDiv = $("<div>");
			
			// collect functions to render values
			let left = true;
			let funcs = [];
			for (let value of values) {
				let valueDiv = $("<div>").appendTo(valuesDiv); 
				if (left) {
					funcs.push(function(onDone) { renderLeft(valueDiv, value, onDone); });
				} else {
					funcs.push(function(onDone) { renderRight(valueDiv, value, onDone); });
				}
				left = !left;
			}
			
			// render addresses in parallel
			async.parallel(funcs, function(err, results) {
				if (err) throw err;
				onDone(valuesDiv);
			});
		}
		
		function renderLeft(div, value, onDone) {
			div.attr("class", "value_left");
			let qrDiv = $("<div>").appendTo(div);
			let labelValueDiv = $("<div class='value_label_value'>").appendTo(div);
			let logoLabelDiv = $("<div class='value_left_logo_label'>").appendTo(labelValueDiv);
			let logo = $("<img src='" + value.logo.get(0).src + "'>").appendTo(logoLabelDiv);
			logo.attr("class", "value_logo");
			let valueLabelDiv = $("<div class='value_label'>").appendTo(logoLabelDiv);
			valueLabelDiv.append(value.label);
			let valueDiv = $("<div class='value_left_value'>").appendTo(labelValueDiv);
			valueDiv.append(value.value);
			
			// render qr code
			CryptoUtils.renderQrCode(value.value, null, function(img) {
				img.attr("class", "value_qr");
				qrDiv.append(img);
				onDone();
			});
		}
		
		function renderRight(div, value, onDone) {
			div.attr("class", "value_right");
			let labelValueDiv = $("<div class='value_label_value'>").appendTo(div);
			let logoLabelDiv = $("<div class='value_right_logo_label'>").appendTo(labelValueDiv);
			let logo = $("<img src='" + value.logo.get(0).src + "'>").appendTo(logoLabelDiv);
			logo.attr("class", "value_logo");
			let valueLabelDiv = $("<div class='value_label'>").appendTo(logoLabelDiv);
			valueLabelDiv.append(value.label);
			let valueDiv = $("<div class='value_right_value'>").appendTo(labelValueDiv);
			valueDiv.append(value.value);
			let qrDiv = $("<div>").appendTo(div);
			
			// render qr code
			CryptoUtils.renderQrCode(value.value, null, function(img) {
				img.attr("class", "value_qr");
				qrDiv.append(img);
				onDone();
			});
		}
		
		function renderValuePairs(values, config, onProgress, onDone) {
			// TODO: reconcile with PieceRenderer
		}
	}
}
inheritsFrom(DonateController, DivController);

/**
 * Form page.
 */
function FormController(div) {
	DivController.call(this, div);
	
	let passphraseCheckbox;
	let passphraseInput;
	let splitCheckbox;
	let numPiecesInput;
	let minPiecesInput;
	let currencyInputsDiv;	// container for each currency input
	let currencyInputs;			// tracks each currency input
	let decommissioned;
	let progressDiv;
	let progressBar;
	
	this.render = function(onDone) {
		
		// initial state
		UiUtils.setupContentDiv(div);
		decommissioned = false;
		
		// currency inputs
		currencyInputs = [];
		let currencyDiv = $("<div class='form_section_div'>").appendTo(div);
		currencyInputsDiv = $("<div class='currency_inputs_div'>").appendTo(currencyDiv);
		
		// link to add currency
		let addCurrencyDiv = $("<div class='add_currency_div'>").appendTo(currencyDiv);
		let addCurrencySpan = $("<span class='add_currency_span'>").appendTo(addCurrencyDiv);
		addCurrencySpan.html("+ Add another currency");
		addCurrencySpan.click(function() {
			addCurrency();
		});
		
		// add first currency input
		addCurrency();
		
		// passphrase checkbox
		let passphraseDiv = $("<div class='form_section_div'>").appendTo(div);
		passphraseCheckbox = $("<input type='checkbox' id='passphrase_checkbox'>").appendTo(passphraseDiv);
		let passphraseCheckboxLabel = $("<label for='passphrase_checkbox'>").appendTo(passphraseDiv);
		passphraseCheckboxLabel.html("&nbsp;Do you want to protect your private keys with a passphrase?");
		passphraseCheckbox.click(function() {
			if (passphraseCheckbox.prop('checked')) {
				passphraseInputDiv.show();
				passphraseInput.focus();
			} else {
				passphraseInputDiv.hide();
			}
		});
		
		// passphrase input
		let passphraseInputDiv = $("<div class='passphrase_input_div'>").appendTo(passphraseDiv);
		let passphraseWarnDiv = $("<div class='passphrase_warn_div'>").appendTo(passphraseInputDiv);
		passphraseWarnDiv.append("This passphrase is required to access funds later on.  Don’t lose it!");
		passphraseInputDiv.append("Passphrase");
		passphraseInput = $("<input type='password' class='passphrase_input'>").appendTo(passphraseInputDiv);
		let showPassphraseCheckboxDiv = $("<div class='passphrase_checkbox_div'>").appendTo(passphraseInputDiv);
		let showPassphraseCheckbox = $("<input type='checkbox' id='show_passphrase'>").appendTo(showPassphraseCheckboxDiv);
		let showPassphraseCheckboxLabel = $("<label for='show_passphrase'>").appendTo(showPassphraseCheckboxDiv);
		showPassphraseCheckboxLabel.html("&nbsp;Show passphrase");
		showPassphraseCheckbox.click(function() {
			if (showPassphraseCheckbox.prop('checked')) {
				passphraseInput.attr("type", "text");
			} else {
				passphraseInput.attr("type", "password");
			}
			passphraseInput.focus();
		});
		
		// split checkbox
		let splitDiv = $("<div class='form_section_div'>").appendTo(div);
		splitCheckbox = $("<input type='checkbox' id='split_checkbox'>").appendTo(splitDiv);
		let splitCheckboxLabel = $("<label for='split_checkbox'>").appendTo(splitDiv);
		splitCheckboxLabel.html("&nbsp;Do you want to split your private keys into separate pieces?");
		splitCheckbox.click(function() {
			if (splitCheckbox.prop('checked')) {
				splitInputDiv.show();
			} else {
				splitInputDiv.hide();
			}
		});
		
		// split input
		let splitInputDiv = $("<div class='split_input_div'>").appendTo(splitDiv);
		let splitQr = $("<img class='split_qr' src='img/qr_code.png'>").appendTo(splitInputDiv);
		let splitLines3 = $("<img class='split_lines_3' src='img/split_lines_3.png'>").appendTo(splitInputDiv);
		let splitNumDiv = $("<div class='split_num_div'>").appendTo(splitInputDiv);
		let splitNumLabelTop = $("<div class='split_num_label_top'>").appendTo(splitNumDiv);
		splitNumLabelTop.html("Split Each Key Into");
		numPiecesInput = $("<input type='number' value='3'>").appendTo(splitNumDiv);
		let splitNumLabelBottom = $("<div class='split_num_label_bottom'>").appendTo(splitNumDiv);
		splitNumLabelBottom.html("Pieces");
		let splitLines2 = $("<img class='split_lines_2' src='img/split_lines_2.png'>").appendTo(splitInputDiv);
		let splitMinDiv = $("<div class='split_min_div'>").appendTo(splitInputDiv);
		let splitMinLabelTop = $("<div class='split_min_label_top'>").appendTo(splitMinDiv);
		splitMinLabelTop.html("Require");
		minPiecesInput = $("<input type='number' value='2'>").appendTo(splitMinDiv);
		let splitMinLabelBottom = $("<div class='split_min_label_bottom'>").appendTo(splitMinDiv);
		splitMinLabelBottom.html("To Recover");		
		
		// apply default configuration
		passphraseCheckbox.prop('checked', false);
		passphraseInputDiv.hide();
		showPassphraseCheckbox.prop('checked', false);
		splitCheckbox.prop('checked', false);
		splitInputDiv.hide();
		
		// add generate button
		let generateDiv = $("<div class='generate_div'>").appendTo(div);
		let btnGenerate = $("<div class='btn_generate'>").appendTo(generateDiv);
		btnGenerate.append("Generate keys");
		btnGenerate.click(function() { onGenerate() });
		
		// under development warning
		let warningDiv = $("<div class='app_header_warning'>").appendTo(div);
		warningDiv.append("Under Development: Not Ready for Use");
		
		// add progress bar and div
		progressDiv = $("<div>").appendTo(div);
		progressDiv.hide();
		progressBar = UiUtils.getProgressBar(progressDiv);
		
		// done rendering
		if (onDone) onDone(div);
	}
	
	this.setSelectedCurrency = function(plugin) {
		assertTrue(currencyInputs.length === 1);
		currencyInputs[0].setSelectedCurrency(plugin.getName());
	}
	
	// -------------------------------- PRIVATE ---------------------------------
	
	/**
	 * Handles when generate button clicked.
	 */
	function onGenerate(onDone) {
		let window = newWindow(null, "Export Storage", null, "css/style.css", getInternalStyleSheetText());
		let body = $("body", window.document);
		new ExportController(body, window, getConfig()).render(function(div) {
			if (onDone) onDone();
		});
	}
	
	function getConfig() {
		let config = {};
		config.passphraseChecked = passphraseCheckbox.prop('checked');
		config.passphrase = passphraseInput.val();
		config.splitChecked = splitCheckbox.prop('checked');
		config.numPieces = config.splitChecked ? parseFloat(numPiecesInput.val()) : 1;
		config.minPieces = config.splitChecked ? parseFloat(minPiecesInput.val()) : null;
		config.currencies = [];
		for (let currencyInput of currencyInputs) {
			config.currencies.push({
				plugin: currencyInput.getSelectedPlugin(),
				numKeys: currencyInput.getNumKeys(),
				encryption: config.passphraseChecked ? CryptoUtils.EncryptionScheme.CRYPTOJS : null	// TODO: collect encryption scheme from UI
			});
		}
		return config;
	}
	
	function addCurrency() {
		if (DEBUG) console.log("addCurrency()");
		
		// create input
		let currencyInput = new CurrencyInput($("<div>"), currencyInputs.length, CryptoUtils.getCryptoPlugins(), function() {
			removeCurrency(currencyInput);
		});
		
		// add to page and track
		currencyInputs.push(currencyInput);
		currencyInput.getDiv().appendTo(currencyInputsDiv);
	}
	
	function removeCurrency(currencyInput) {
		let idx = currencyInputs.indexOf(currencyInput);
		if (idx < 0) throw new Error("Could not find currency input");
		currencyInputs.splice(idx, 1);
		currencyInput.getDiv().remove();
	}
	
	/**
	 * Encapsulate a currency input.
	 * 
	 * @param div is the div to render to
	 * @param idx is the index of this input relative to the other inputs to accomodate ddslick's id requirement
	 * @param onDelete is invoked when the user delets this input
	 */
	function CurrencyInput(div, idx, plugins, onDelete) {
		assertInitialized(div);
		assertInitialized(plugins);
		
		let that = this;
		let selectedPlugin;
		let numKeysInput;
		let selector;
		let selectorData;
		
		this.getDiv = function() {
			return div;
		}
		
		this.getSelectedPlugin = function() {
			return selectedPlugin;
		}
		
		this.setSelectedCurrency = function(name) {
			for (let i = 0; i < selectorData.length; i++) {
				if (selectorData[i].text === name) {
					selector.ddslick('select', {index: i});
					selectedPlugin = plugins[i];
					break;
				}
			}
		}
		
		this.getNumKeys = function() {
			return parseFloat(numKeysInput.val());
		}
		
		// render input
		render();
		function render() {
			div.empty();
			div.attr("class", "currency_input_div");
			
			// format pull down plugin data
			selectorData = [];
			for (let plugin of plugins) {
				selectorData.push({
					text: plugin.getName(),
					imageSrc: plugin.getLogo().get(0).src
				});
			}
			
			// create pull down
			selector = $("<div id='currency_selector_" + idx + "'>").appendTo(div);
			selector.ddslick({
				data:selectorData,
				background: "white",
				imagePosition: "left",
				selectText: "Select a Currency",
				defaultSelectedIndex: 0,
				onSelected: function(selection) {
					selectedPlugin = plugins[selection.selectedIndex];
					loader.load(selectedPlugin.getDependencies());	// start loading dependencies
				},
			});
			selector = $("#currency_selector_" + idx);	// ddslick requires id reference
			that.setSelectedCurrency("Bitcoin");	// default value
			
			// create right div
			let rightDiv = $("<div class='currency_input_right_div'>").appendTo(div);
			rightDiv.append("Number of keys&nbsp;&nbsp;");
			numKeysInput = $("<input type='number'>").appendTo(rightDiv);
			numKeysInput.attr("value", 1);
			rightDiv.append("&nbsp;&nbsp;");
			let trashDiv = $("<div class='trash_div'>").appendTo(rightDiv);
			trashDiv.click(function() { onDelete(); });
			let trashImg = $("<img class='trash_img' src='img/trash.png'>").appendTo(trashDiv);
		}
	}
}
inheritsFrom(FormController, DivController);

/**
 * Recover page.
 */
function RecoverController(div) {
	DivController.call(this, div);
	this.render = function(onDone) {
		div.empty();
		div.attr("class", "recover_page");
		
		// filler to push recover div down
		$("<div class='recover_filler'>").appendTo(div);
		let recoverDiv = $("<div class='recover_div'>").appendTo(div);
		
		// set up recover div
		let tabsDiv = $("<div class='recover_tabs_div'>").appendTo(recoverDiv);
		let recoverFileTab = $("<div class='recover_tab_div'>").appendTo(tabsDiv);
		recoverFileTab.html("Recover From File");
		recoverFileTab.click(function() { selectTab("file"); });
		let recoverTextTab = $("<div class='recover_tab_div'>").appendTo(tabsDiv);
		recoverTextTab.html("Recover From Text");
		recoverTextTab.click(function() { selectTab("text"); });
		let recoverContentDiv = $("<div class='recover_content_div'>").appendTo(recoverDiv);
		
		// render recover file and text divs
		let recoverFileDiv = $("<div>");
		let recoverTextDiv = $("<div>");
		new RecoverFileController(recoverFileDiv).render(function() {
			new RecoverTextController(recoverTextDiv, CryptoUtils.getCryptoPlugins()).render(function() {
				
				// start on file tab by default
				selectTab("file");
				
				// done rendering
				if (onDone) onDone(div);
			});
		});
		
		function selectTab(selected) {
			switch (selected) {
			case "file":
				recoverFileTab.addClass("active_tab");
				recoverTextTab.removeClass("active_tab");
				recoverContentDiv.children().detach();
				recoverContentDiv.append(recoverFileDiv);
				break;
			case "text":
				recoverFileTab.removeClass("active_tab");
				recoverTextTab.addClass("active_tab");
				recoverContentDiv.children().detach();
				recoverContentDiv.append(recoverTextDiv);
				break;
			default: throw new Error("Unrecognized selection: " + selected);
			}
		}
	}
}
inheritsFrom(RecoverController, DivController);

/**
 * Controller to recover from file.
 * 
 * @param div is the div to render to
 */
function RecoverFileController(div) {
	DivController.call(this, div);
	
	let warningDiv;
	let importedPieces = [];	// [{name: 'btc.json', value: {...}}, ...]
	let piecesAndControls;		// div for imported files and controls
	let importedPiecesDiv;
	let lastKeys;
	
	this.render = function(onDone) {
		
		// warning div
		warningDiv = $("<div class='recover_warning_div'>").appendTo(div);
		warningDiv.hide();
		
		// drag and drop div
		let dragDropDiv = $("<div class='recover_drag_drop'>").appendTo(div);
		let dragDropImg = $("<img class='drag_drop_img' src='img/drag_and_drop.png'>").appendTo(dragDropDiv);
		let dragDropText = $("<div class='drag_drop_text'>").appendTo(dragDropDiv);
		let dragDropLabel = $("<div class='drag_drop_label'>").appendTo(dragDropText);
		dragDropLabel.append("Drag and Drop Files To Import");
		let dragDropBrowse = $("<div class='drag_drop_browse'>").appendTo(dragDropText);
		dragDropBrowse.append("or click to browse");
		
		// register browse link with hidden input
		let inputFiles = $("<input type='file' multiple>").appendTo(dragDropDiv);
		inputFiles.change(function() { onFilesImported($(this).get(0).files); });
		inputFiles.hide();
		dragDropBrowse.click(function() {
			inputFiles.click();
		});
		
		// setup drag and drop
		setupDragAndDrop(dragDropDiv, onFilesImported);
		
		// files and controls
		piecesAndControls = $("<div>").appendTo(div);
		piecesAndControls.hide();
		
		// imported files
		importedPiecesDiv = $("<div class='recover_imported_pieces'>").appendTo(piecesAndControls);
		importedPiecesDiv.hide();
		
		// start over
		let startOverDiv = $("<div class='recover_controls'>").appendTo(piecesAndControls);
		let startOverLink = $("<div class='recover_start_over'>").appendTo(startOverDiv);
		startOverLink.append("start over");
		startOverLink.click(function(e) {
			warningDiv.empty();
			warningDiv.hide();
			removePieces();
			piecesAndControls.hide();
		});
		
		// done rendering
		if (onDone) onDone(div);
	}
	
	function onKeysImported(keys) {
		keys = listify(keys);
		assertTrue(keys.length > 0);
		let pieces = CryptoUtils.keysToPieces(keys);
		let window = newWindow(null, "Imported Storage", null, "css/style.css", getInternalStyleSheetText());
		let body = $("body", window.document);
		new ExportController(body, window, null, keys, pieces).render();
	}
	
	function setWarning(str, img) {
		warningDiv.empty();
		if (!img) img = $("<img src='img/warning.png'>");
		warningDiv.append(img);
		img.addClass("recover_warning_div_icon");
		warningDiv.append(str);
		str === "" ? warningDiv.hide() : warningDiv.show();
	}
	
	// handle imported files
	function onFilesImported(files) {
		
		// collect functions to read files
		let funcs = [];
		for (let i = 0; i < files.length; i++) {
			funcs.push(function(callback) {
				readFile(files[i], callback);
			});
		};
		
		// read files asynchronously
		async.parallel(funcs, function(err, results) {
			
			// collect named pieces from results
			let namedPieces = [];
			for (let result of results) {
				namedPieces = namedPieces.concat(result);
			}
			
			// add all named pieces
			addNamedPieces(namedPieces);
		});
		
		// reads the given file and calls onNamedPieces(err, namedPieces) when done
		function readFile(file, onNamedPieces) {
			let reader = new FileReader();
			reader.onload = function() {
				getNamedPiecesFromFile(file, reader.result, function(namedPieces) {
					if (namedPieces.length === 0) {
						if (file.type === "application/json") setWarning("File '" + file.name + "' is not a valid json piece");
						else if (file.type === "application/zip") setWarning("Zip '" + file.name + "' does not contain any valid json pieces");
						else throw new Error("Unrecognized file type: " + file.type);
					} else {
						onNamedPieces(null, namedPieces);
					}
				});
			}
			if (file.type === 'application/json') reader.readAsText(file);
			else if (file.type === 'application/zip') reader.readAsArrayBuffer(file);
			else setWarning("'" + file.name + "' is not a zip or json file");
		}
	}
	
	function getNamedPiecesFromFile(file, data, onNamedPieces) {
		if (file.type === 'application/json') {
			let piece = JSON.parse(data);
			CryptoUtils.validatePiece(piece);
			let namedPiece = {name: file.name, piece: piece};
			onNamedPieces([namedPiece]);
		}
		else if (file.type === 'application/zip') {
			CryptoUtils.zipToPieces(data, function(namedPieces) {
				onNamedPieces(namedPieces);
			});
		}
	}
	
	function addNamedPieces(namedPieces) {
		for (let namedPiece of namedPieces) {
			if (!isPieceImported(namedPiece.name)) importedPieces.push(namedPiece);
		}
		updatePieces();
	}
	
	function isPieceImported(name) {
		for (let importedPiece of importedPieces) {
			if (importedPiece.name === name) return true;
		}
		return false;
	}
	
	function removePieces() {
		importedPieces = [];
		lastKeys = undefined;
		updatePieces();
	}
	
	function removePiece(name) {
		for (let i = 0; i < importedPieces.length; i++) {
			if (importedPieces[i].name === name) {
				importedPieces.splice(i, 1);
				updatePieces();
				return;
			}
		}
		throw new Error("No piece with name '" + name + "' imported");
	}
	
	function updatePieces() {
		
		// update UI
		setWarning("");
		renderImportedPieces(importedPieces);
		
		// collect all pieces
		let pieces = [];
		for (let importedPiece of importedPieces) pieces.push(importedPiece.piece);
		if (!pieces.length) return;
		
		// collect tickers being imported
		let tickers = new Set();
		for (let pieceKey of pieces[0].keys) tickers.add(pieceKey.ticker);
		
		// collect dependencies
		let dependencies = new Set(COMMON_DEPENDENCIES);
		for (let ticker of tickers) {
			let plugin = CryptoUtils.getCryptoPlugin(ticker);
			for (let dependency of plugin.getDependencies()) dependencies.add(dependency);
		}
		
		// load dependencies
		loader.load(Array.from(dependencies), function() {
			
			// create keys
			try {
				let keys = CryptoUtils.piecesToKeys(pieces);
				if (keysDifferent(lastKeys, keys) && keys.length) onKeysImported(keys);
				if (!keys.length) setWarning("Need additional pieces to recover private keys", $("<img src='img/files.png'>"));
				lastKeys = keys;
			} catch (err) {
				setWarning(err.message);
			}
		});
		
		function keysDifferent(keys1, keys2) {
			if (!keys1 && keys2) return true;
			if (keys1 && !keys2) return true;
			if (keys1.length !== keys2.length) return true;
			for (let i = 0; i < keys1.length; i++) {
				if (!keys1[i].equals(keys2[i])) return true;
			}
			return false;
		}
	}
	
	function renderImportedPieces(namedPieces) {
		importedPiecesDiv.empty();
		if (namedPieces.length === 0) {
			piecesAndControls.hide();
			importedPiecesDiv.hide();
			return;
		}
		
		importedPiecesDiv.show();
		piecesAndControls.show();
		for (let namedPiece of namedPieces) {
			importedPiecesDiv.append(getImportedPieceDiv(namedPiece));
		}
		
		function getImportedPieceDiv(namedPiece) {
			let importedPieceDiv = $("<div class='recover_file_imported_piece'>").appendTo(importedPiecesDiv);
			let icon = $("<img src='img/file.png' class='recover_imported_icon'>").appendTo(importedPieceDiv);
			importedPieceDiv.append(namedPiece.name);
			let trash = $("<img src='img/trash.png' class='recover_imported_trash'>").appendTo(importedPieceDiv);
			trash.click(function() { removePiece(namedPiece.name); });
			return importedPieceDiv;
		}
	}
	
	/**
	 * Sets up a drag and drop zone.
	 * 
	 * @param div is the drop zone as a jquery node
	 * @param onFilesImported(files) is called when files are dropped into the drop zone
	 */
	function setupDragAndDrop(div, onFilesImported) {
		
		// register drag and drop events
		div.get(0).ondrop = function(event) {
			event.preventDefault();  
	    event.stopPropagation();
			div.removeClass("inner_outline");
			let dt = event.dataTransfer;
			
			// use DataTransferItemList interface to access file(s)
			if (dt.items) {
				let files = [];
				for (let i = 0; i < dt.items.length; i++) {
					if (dt.items[i].kind == 'file') {
						files.push(dt.items[i].getAsFile());
					}
				}
				onFilesImported(files);
			}
			
			// use DataTransfer interface to access file(s)
			else {
				onFilesImported(dt.files);
			}
		}
		div.get(0).ondragenter = function(event) {
			div.addClass("inner_outline");
		}
		div.get(0).ondragexit = function(event) {
			div.removeClass("inner_outline");
		}
		div.get(0).ondragover = function(event) {
			event.preventDefault();  
	    event.stopPropagation();
	    event.dataTransfer.dropEffect = 'copy';
		}
	}
}
inheritsFrom(RecoverFileController, DivController);

/**
 * Controller to recover from text.
 * 
 * @param div is the div to render to
 */
function RecoverTextController(div, plugins) {
	DivController.call(this, div);
	assertTrue(plugins.length > 0);
	
	const MAX_PIECE_LENGTH = 58;					// max length of piece strings to render
	const MAX_INVALID_PIECE_LENGTH = 25;	// max length of invalid piece string to display in warning
	let warningDiv;
	let selector;
	let selectorDisabler;
	let selectedPlugin;
	let textArea;
	let importedPieces = [];	// string[]
	let piecesAndControls;		// div for imported pieces and controls
	let importedPiecesDiv;		// div for imported pieces
	let lastKeys;
	
	this.render = function(onDone) {
		
		// warning div
		warningDiv = $("<div class='recover_warning_div'>").appendTo(div);
		warningDiv.hide();
		
		// currency selector data
		selectorData = [];
		for (let plugin of plugins) {
			selectorData.push({
				text: plugin.getName(),
				imageSrc: plugin.getLogo().get(0).src
			});
		}
		
		// currency selector
		let selectorContainer = $("<div class='recover_selector_container'>").appendTo(div);
		selector = $("<div id='recover_selector'>").appendTo(selectorContainer);
		loader.load("lib/jquery.ddslick.js", function() {	// ensure loaded before or only return after loaded
			selector.ddslick({
				data:selectorData,
				background: "white",
				imagePosition: "left",
				selectText: "Select a Currency",
				width:'100%',
				defaultSelectedIndex: 0,
				onSelected: function(selection) {
					selectedPlugin = plugins[selection.selectedIndex];
					loader.load(selectedPlugin.getDependencies());	// start loading dependencies
				},
			});
			selector = $("#recover_selector");	// ddslick requires id reference
			setSelectedCurrency("Bitcoin");			// default value
			selectorDisabler = $("<div class='recover_selector_disabler'>").appendTo(selectorContainer);
			setSelectorEnabled(true);
		});
		
		// text area
		textArea = $("<textarea class='recover_textarea'>").appendTo(div);
		textArea.attr("placeholder", "Enter a private key or split pieces of a private key");
		
		// submit button
		let submit = $("<div class='recover_submit'>").appendTo(div);
		submit.html("Submit");
		submit.click(function() { submitPieces(); });
		
		// pieces and controls
		piecesAndControls = $("<div>").appendTo(div);
		piecesAndControls.hide();
		
		// imported pieces
		importedPiecesDiv = $("<div class='recover_imported_pieces'>").appendTo(piecesAndControls);
		importedPiecesDiv.hide();
		
		// start over
		let startOverDiv = $("<div class='recover_controls'>").appendTo(piecesAndControls);
		let startOverLink = $("<div class='recover_start_over'>").appendTo(startOverDiv);
		startOverLink.append("start over");
		startOverLink.click(function(e) {
			warningDiv.empty();
			warningDiv.hide();
			removePieces();
			piecesAndControls.hide();
		});
		
		// done rendering
		if (onDone) onDone(div);
	}
	
	function setSelectorEnabled(bool) {
		if (bool) {
			$("#recover_selector *").removeClass("disabled_text");
			selectorDisabler.hide();
		} else {
			$("#recover_selector *").addClass("disabled_text");
			selectorDisabler.show();
		}
	}
	
	function onKeysImported(keys) {
		keys = listify(keys);
		assertTrue(keys.length > 0);
		let pieces = CryptoUtils.keysToPieces(keys);
		let window = newWindow(null, "Imported Storage", null, "css/style.css", getInternalStyleSheetText());
		let body = $("body", window.document);
		new ExportController(body, window, null, keys, pieces).render();
	}
	
	function setSelectedCurrency(name) {
		for (let i = 0; i < selectorData.length; i++) {
			if (selectorData[i].text === name) {
				selector.ddslick('select', {index: i});
				selectedPlugin = plugins[i];
				break;
			}
		}
	}
	
	function setWarning(str, img) {
		warningDiv.empty();
		if (!img) img = $("<img src='img/warning.png'>");
		warningDiv.append(img);
		img.addClass("recover_warning_div_icon");
		warningDiv.append(str);
		str === "" ? warningDiv.hide() : warningDiv.show();
	}
	
	function submitPieces() {
		
		// get and clear text
		let val = textArea.val();
		textArea.val("");
		
		// check for empty text
		if (val.trim() === "") {
			setWarning("No text entered");
			return;
		}
		
		// get lines
		let lines = getLines(val);
		
		// get lines with content
		let contentLines = [];
		for (let line of lines) {
			if (line.trim() !== "") contentLines.push(line);
		}
		
		// load dependencies
		let dependencies = new Set(COMMON_DEPENDENCIES);
		for (let dependency of selectedPlugin.getDependencies()) dependencies.add(dependency);
		loader.load(Array.from(dependencies), function() {
			
			// add pieces
			updatePieces(contentLines);
		});
	}
	
	function removePieces() {
		importedPieces = [];
		lastKeys = undefined;
		updatePieces();
	}
	
	function removePiece(piece) {
		for (let i = 0; i < importedPieces.length; i++) {
			if (importedPieces[i] === piece) {
				importedPieces.splice(i, 1);
				updatePieces();
				return;
			}
		}
		throw new Error("No piece imported: " + piece);
	}
	
	function updatePieces(newPieces) {
		
		// reset warning
		setWarning("");
		
		// interanl warning setter to track if warning is set
		let warningSet = false;
		function setWarningAux(str, icon) {
			setWarning(str, icon);
			warningSet = true;
		}
		
		// scenarios:
		// add private key, don't allow anything after
		// add private keys, add first, don't allow anything after
		// add piece, need additional, allow pieces, don't allow private key
		// add pieces, check if key created, allow pieces, don't allow private key
		
		// check for existing private key
		let key;
		if (importedPieces.length === 1) {
			try {
				key = selectedPlugin.newKey(importedPieces[0]);
			} catch (err) {
				// nothing to do
			}
		}
		
		// add new pieces
		if (newPieces) {
			if (key) setWarningAux("Private key already added");
			else {
				for (let piece of newPieces) {
					if (contains(importedPieces, piece)) {
						setWarningAux("Piece already added");
						continue;
					}
					if (key) setWarningAux("Private key alread added");
					else {
						try {
							let thisKey = selectedPlugin.newKey(piece);
							if (importedPieces.length > 0) setWarningAux("Cannot add private key to existing pieces");
							else {
								key = thisKey;
								importedPieces.push(piece);
							}
						} catch (err) {
							if (CryptoUtils.isPossibleSplitPiece(piece)) importedPieces.push(piece);
							else setWarningAux("Invalid private key or piece: " + CryptoUtils.getShortenedString(piece, MAX_INVALID_PIECE_LENGTH));
						}
					}
				}
			}
		}
		
		// check if pieces combine to make private key
		if (!key && importedPieces.length > 0) {
			try {
				key = selectedPlugin.combine(importedPieces);
			} catch (err) {
				if (!warningSet) setWarning("Need additional pieces to recover private keys", $("<img src='img/files.png'>"));
			}
		}
		
		// render pieces
		renderImportedPieces(importedPieces);
		
		// selector only enabled if no pieces
		setSelectorEnabled(importedPieces.length === 0);
		
		// handle if key exists
		if (key) onKeysImported(key);
	}
	
	function renderImportedPieces(pieces) {
		importedPiecesDiv.empty();
		if (pieces.length === 0) {
			piecesAndControls.hide();
			importedPiecesDiv.hide();
			return;
		}
		
		importedPiecesDiv.show();
		piecesAndControls.show();
		for (let piece of pieces) {
			importedPiecesDiv.append(getImportedPieceDiv(piece));
		}
		
		function getImportedPieceDiv(piece) {
			let importedPieceDiv = $("<div class='recover_text_imported_piece'>").appendTo(importedPiecesDiv);
			let icon = $("<img src='img/file.png' class='recover_imported_icon'>").appendTo(importedPieceDiv);
			importedPieceDiv.append(CryptoUtils.getShortenedString(piece, MAX_PIECE_LENGTH));
			let trash = $("<img src='img/trash.png' class='recover_imported_trash'>").appendTo(importedPieceDiv);
			trash.click(function() { removePiece(piece); });
			return importedPieceDiv;
		}
	}
}
inheritsFrom(RecoverTextController, DivController);

/**
 * Export page.
 * 
 * At least one of keyGenConfig, keys, pieces, and pieceDivs are required.
 * 
 * @param div is the div to render to
 * @param window is a reference to the window for printing
 * @param keyGenConfig is a configuration to generate new storage
 * @param keys are keys to generate pieces from
 * @param pieces are pieces to export and generate pieceDivs from
 * @param pieceDivs are pre-generated piece divs ready for display
 */
function ExportController(div, window, keyGenConfig, keys, pieces, pieceDivs) {
	DivController.call(this, div);
	
	// global variables
	let progressDiv;
	let progressBar;
	let printButton;
	let showPublicCheckbox;
	let showPrivateCheckbox;
	let showLogosCheckbox;
	let currentPiece;
	let pieceSelector;
	let printEnabled;
	
	this.render = function(onDone) {
		div.empty();
		
		// key generation
		let keyGenDiv = $("<div class='key_gen_div'>").appendTo(div);
		progressDiv = $("<div>").appendTo(keyGenDiv);
		progressDiv.hide();
		progressBar = UiUtils.getProgressBar(progressDiv);
		
		// export header
		let exportHeader = $("<div class='export_header'>").appendTo(div);
		
		// export buttons
		let exportButtons = $("<div class='export_buttons'>").appendTo(exportHeader);
		printButton = $("<div class='export_button'>").appendTo(exportButtons);
		printButton.html("Print All");
		printButton.click(function() { printAll(); });
		let exportButton = $("<div class='export_button'>").appendTo(exportButtons);
		exportButton.html("Export All");
		exportButton.click(function() { exportAll(pieces); });
		let savePublicButton = $("<div class='export_button'>").appendTo(exportButtons);
		savePublicButton.html("Save Public Addresses");
		savePublicButton.click(function() { savePublicAddresses(); });
		let moreButton = $("<div class='export_button'>").appendTo(exportButtons);
		moreButton.html("...");
		moreButton.click(function() { console.log("More button clicked"); });
		
		// export checkboxes
		let exportCheckboxes = $("<div class='export_checkboxes'>").appendTo(exportHeader);
		showPublicCheckbox = $("<input type='checkbox' class='export_checkbox' id='showPublicCheckbox'>").appendTo(exportCheckboxes);
		let showPublicCheckboxLabel = $("<label class='export_checkbox_label' for='showPublicCheckbox'>").appendTo(exportCheckboxes);
		showPublicCheckboxLabel.html("Show public addresses");
		exportCheckboxes.append("&nbsp;&nbsp;&nbsp;");
		showPrivateCheckbox = $("<input type='checkbox' class='export_checkbox' id='showPrivateCheckbox'>").appendTo(exportCheckboxes);
		let showPrivateCheckboxLabel = $("<label class='export_checkbox_label' for='showPrivateCheckbox'>").appendTo(exportCheckboxes);
		showPrivateCheckboxLabel.html("Show private keys");
		exportCheckboxes.append("&nbsp;&nbsp;&nbsp;");
		showLogosCheckbox = $("<input type='checkbox' class='export_checkbox' id='showLogosCheckbox'>").appendTo(exportCheckboxes);
		let showLogosCheckboxLabel = $("<label class='export_checkbox_label' for='showLogosCheckbox'>").appendTo(exportCheckboxes);
		showLogosCheckboxLabel.html("Show currency logos");
		
		// apply default state
		showPublicCheckbox.prop('checked', true);
		showPrivateCheckbox.prop('checked', true);
		showLogosCheckbox.prop('checked', true);
		
		// piece selection
		let exportPieceSelection = $("<div class='export_piece_selection'>").appendTo(exportHeader);
		pieceSelector = $("<select class='piece_selector'>").appendTo(exportPieceSelection);
		
		// currently showing piece
		currentPiece = $("<div class='export_current_piece'>").appendTo(div);
		
		// register events
		showPublicCheckbox.click(function() { update(); });
		showPrivateCheckbox.click(function() { update(); });
		showLogosCheckbox.click(function() { update(); });
		pieceSelector.change(function() {
			setVisible(pieceDivs, parseFloat(pieceSelector.find(":selected").val()));
		});
		
		// build ui based on keyGenConfig, pieces, and pieceDivs
		update();

		// done rendering
		if (onDone) onDone(div);
	}
	
	// --------------------------------- PRIVATE --------------------------------
	
	function getPieceRendererConfig() {
		return {
			showPublic: showPublicCheckbox.prop('checked'),
			showPrivate: showPrivateCheckbox.prop('checked'),
			showCurrencyLogos: showLogosCheckbox.prop('checked')
		};
	}
	
	function printAll() {
		if (!printEnabled) return;
		window.print();
	}
	
	function exportAll(pieces) {
		assertInitialized(pieces);
		assertTrue(pieces.length > 0);
		if (pieces.length === 1) {
			let jsonStr = CryptoUtils.pieceToJson(pieces[0]);
			saveAs(new Blob([jsonStr]), "cryptostorage_" + CryptoUtils.getCommonTicker(pieces[0]).toLowerCase() + ".json");
		} else {
			CryptoUtils.piecesToZip(pieces, function(name, blob) {
				saveAs(blob, name);
			});
		}
	}
	
	function savePublicAddresses() {
		assertInitialized(pieces);
		assertTrue(pieces.length > 0);
		let publicAddressesStr = CryptoUtils.pieceToAddresses(pieces[0]);
		saveAs(new Blob([publicAddressesStr]), "cryptostorage_" + CryptoUtils.getCommonTicker(pieces[0]).toLowerCase() + "_public_addresses.txt");
	}
	
	function setPrintEnabled(bool) {
		printEnabled = bool;
		if (bool) {
			printButton.addClass("export_button");
			printButton.removeClass("export_button_disabled");
		} else {
			printButton.addClass("export_button_disabled");
			printButton.removeClass("export_button");
		}
	}
	
	function update(onDone) {
		updateHeader();
		
		// add piece divs if given
		if (pieceDivs) {
			updateSelector(pieceSelector, pieces.length);
			setVisible(pieceDivs, parseFloat(pieceSelector.find(":selected").val()));
			setPieceDivs(pieceDivs);
			setPrintEnabled(true);
			if (onDone) onDone();
		}
		
		// else render from pieces
		else {
			pieceDivs = [];
			
			// render pieces if given
			if (pieces) {
				for (piece of pieces) pieceDivs.push($("<div>"));
				updateSelector(pieceSelector, pieces.length);
				setVisible(pieceDivs, parseFloat(pieceSelector.find(":selected").val()));
				setPieceDivs(pieceDivs);
				setPrintEnabled(false);
				PieceRenderer.renderPieces(pieces, pieceDivs, getPieceRendererConfig(), null, function(err, pieceDivs) {
					setPrintEnabled(true);
					if (onDone) onDone();
				});
			}
			
			// generate pieces from keys if given
			else if (keys) {
				pieces = CryptoUtils.keysToPieces(keys);
				update();
			}
			
			// otherwise generate keys from config
			else {
				
				
				assertInitialized(keyGenConfig);
				console.log(keyGenConfig);
				throw Error("Key generation from config not implemented");
			}
		}
	}
	
	function updateSelector(pieceSelector, numPieces) {
		pieceSelector.empty();
		for (let i = 0; i < numPieces; i++) {
			let option = $("<option value='" + i + "'>").appendTo(pieceSelector);
			option.html("Piece " + (i + 1));
		}
	}
	
	function setPieceDivs(pieceDivs) {
		currentPiece.empty();
		for (let pieceDiv of pieceDivs) currentPiece.append(pieceDiv);
	}
	
	/**
	 * Adds the hidden class to each of the given divs except at the given idx.
	 */
	function setVisible(divs, idx) {
		for (let i = 0; i < divs.length; i++) {
			if (i === idx) divs[i].removeClass("hidden");
			else divs[i].addClass("hidden");
		}
	}
	
	function updateHeader() {
		showPrivateCheckbox.prop('checked') ? showPublicCheckbox.removeAttr('disabled') : showPublicCheckbox.attr('disabled', 'disabled');
		showPublicCheckbox.prop('checked') ? showPrivateCheckbox.removeAttr('disabled') : showPrivateCheckbox.attr('disabled', 'disabled');
		showLogosCheckbox.removeAttr('disabled');
	}
}
inheritsFrom(ExportController, DivController);