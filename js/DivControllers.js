/**
 * UI utilities.
 */
UiUtils = {
	getButton: function(label, isNext, icon) {
		let button = $("<div class='btn'>");
		if (icon) {
			var logoDiv = $("<div class='crypto_icon_div'>").appendTo(button);
			icon.attr("class", "crypto_icon");
			logoDiv.append(icon);
		}
		button.append(label);
		if (isNext) {
			let nextIcon = $("<div class='btn_arrow_div'>").appendTo(button);
			nextIcon.append($("<img class='btn_arrow' src='img/arrow.png'>"));
		}
		return button;
	},
	
	getNextButton: function(label, icon) {
		return this.getButton(label, true, icon);
	},

	pageSetup: function(div) {
		div.empty();
		div.attr("class", "page");
	},
	
	getPageHeader: function(title, icon) {
		var headerDiv = $("<div>");
		headerDiv.attr("class", "page_header_div");
		
		var contentDiv = $("<div>").appendTo(headerDiv);
		contentDiv.attr("class", "page_header_content_div");
		if (icon) {
			var iconDiv = $("<div>").appendTo(contentDiv);
			iconDiv.attr("class", "page_header_icon_div");
			icon.attr("class", "page_header_icon");
			iconDiv.append(icon);
		}
		contentDiv.append(title);
		
		return headerDiv;
	},

	getCryptoName: function(state) {
		if (state.mix) return state.mix.length > 1 ? "mixed" : state.mix[0].plugin.getName();
		else {
			let name;
			for (let key of state.keys) {
				if (!name) name = key.getPlugin().getName();
				else if (name !== key.getPlugin().getName()) return "mixed";
			}
			return name;
		}
	},
	
	getCryptoLogo: function(state) {
		if (state.mix) return state.mix.length > 1 ? this.getMixLogo() : state.mix[0].plugin.getLogo();
		else {
			let ticker;
			for (let key of state.keys) {
				if (!ticker) ticker = key.getPlugin().getTicker();
				else if (ticker !== key.getPlugin().getTicker()) return this.getMixLogo();
			}
			return getCryptoPlugin(ticker).getLogo();
		}
	},
	
	getMixLogo: function() {
		return $("<img src='img/mix.png'>");
	}
}

/**
 * Base class to render and control a div.
 */
function DivController(div) {
	this.div = div;
}
DivController.prototype.getDiv = function() { return this.div; }
DivController.prototype.render = function(callback) { }	// callback called with rendered div
DivController.prototype.onShow = function() { }
DivController.prototype.onHide = function() { }

/**
 * Manages page navigation and rendering.
 */
function PageManager(contentDiv) {
	
	var pathTracker = new PathTracker(onPageChange);	// track path through decision tree
	var pageDiv;										// container to render page content
	var leftArrow;										// reference to left navigation arrow
	var rightArrow;										// reference to right navigation arrow
	var transitioning = false;							// indicates if transition in progress to prevent duplicates
	
	this.render = function(callback) {
		
		// swipe div
		var scrollDiv = $("<div class='swipe_div'>").appendTo(contentDiv);
		
		// left arrow
		var leftArrowDiv = $("<div class='arrow_div'>").appendTo(scrollDiv);
		leftArrow = $("<img id='left_arrow' class='nav_arrow' src='img/closed_arrow.png'>");
		leftArrow.click(function() { pathTracker.prev(); });
		leftArrow.hide();
		leftArrow.appendTo(leftArrowDiv);
		
		// page div
		pageDiv = $("<div class='page_div'>").appendTo(scrollDiv);
		
		// right arrow
		var rightArrowDiv = $("<div class='arrow_div'>").appendTo(scrollDiv);
		rightArrow = $("<img id='right_arrow' class='nav_arrow' src='img/closed_arrow.png'>");
		rightArrow.click(function() { pathTracker.next(); });
		rightArrow.hide();
		rightArrowDiv.append(rightArrow);
		
		// done rendering
		callback();
	}
	
	this.next = function(renderer) {
		if (transitioning) return;	// cannot add page if transitioning
		transitioning = true;
		renderer.render(function(div) {
			let toRemoves = pathTracker.getNexts();
			pathTracker.next(renderer);
			for (let toRemove of toRemoves) toRemove.getDiv().remove();
		});
	};
	
	this.getPathTracker = function() {
		return pathTracker;
	}
	
	/**
	 * Invoked when the current page is changed.
	 * 
	 * @param lastIdx the index of the page prior to the change
	 * @param curIdx the index of the current page
	 * @param renderer the page renderer for the page
	 */
	function onPageChange(lastIdx, curIdx, renderer) {
		if (DEBUG) console.log("onPageMove(" + lastIdx + ", " + curIdx + ")");
		
		// handle first page
		if (lastIdx === -1) {
			transitioning = false;
			pageDiv.append(renderer.getDiv());
		}
		
		// handle non-first page change
		else if (lastIdx !== curIdx){
			renderer.getDiv().css("display", "none");	// so div swipes into view
			pageDiv.append(renderer.getDiv());
			
			// swipe right
			if (lastIdx < curIdx) {
				pathTracker.getItems()[lastIdx].getDiv().toggle("slide", {direction: "left"}, 250);
				pathTracker.getItems()[curIdx].getDiv().toggle("slide", {direction: "right", complete:function() { transitioning = false; renderer.onShow(); }}, 250);
			}
			
			// swipe left
			else {
				pathTracker.getItems()[lastIdx].getDiv().toggle("slide", {direction: "right"}, 250);
				pathTracker.getItems()[curIdx].getDiv().toggle("slide", {direction: "left", complete:function() { transitioning = false; renderer.onShow(); }}, 250);
			}
		}
		
		// update arrows	
		pathTracker.hasPrev() ? leftArrow.show() : leftArrow.hide();
		pathTracker.hasNext() ? rightArrow.show() : rightArrow.hide();
	}
}
inheritsFrom(PageManager, DivController);

/**
 * Render home page.
 */
function HomeController(div, onSelectCreate, onSelectImport) {
	DivController.call(this, div);
	this.render = function(callback) {
		UiUtils.pageSetup(div);

		// render title
		div.append(UiUtils.getPageHeader("Welcome to cryptostorage.com."));
		
		div.append(getCheckmarkDiv("Generate secure storage for multiple cryptocurrencies."));
		div.append(getCheckmarkDiv("Protect your private keys with password encryption."));
		div.append(getCheckmarkDiv("Optionally split your private keys into separate pieces which must be combined."));
		div.append(getCheckmarkDiv("100% open source, client-side, and free to use.  No registration or trusted third parties."));
		div.append(getCheckmarkDiv("Export to printable QR codes, csv, json, and txt for long term storage and easy recovery."));
		div.append("<br>");
		
		div.append("Select an option to get started.")
		div.append("<br><br>");
		
		// render create button
		var btnCreate = UiUtils.getNextButton("Create new storage");
		btnCreate.click(function() { onSelectCreate(); });
		div.append(btnCreate);
		
		// render import button
		var btnExisting = UiUtils.getNextButton("Import existing storage");
		btnExisting.click(function() { onSelectImport(); });
		div.append(btnExisting);
		
//		// render create crypto-cash button
//		var btnCreateCash = UiUtils.getNextButton("Create crypto-cash (coming soon)");
//		div.append(btnCreateCash);
		
		// done rendering
		callback(div);
	}
	
	function getCheckmarkDiv(str) {
		let div = $("<div class='checkmark_text_div'>");
		let checkmarkDiv = $("<div class='checkmark_text_icon_div'>").appendTo(div);
		let checkmark = $("<img class='checkmark_text_icon' src='img/checkmark.png'>").appendTo(checkmarkDiv);
		div.append(str);
		return div;
	}
}
inheritsFrom(HomeController, DivController);

/**
 * Render crypto selection.
 */
function SelectCryptoController(div, state, onCryptoSelection) {
	DivController.call(this, div);
	this.render = function(callback) {
		UiUtils.pageSetup(div);
		
		// render title
		if (state.mix) div.append(UiUtils.getPageHeader("Select a currency to store."));
		else div.append(UiUtils.getPageHeader("Select a currency to import."));
		
		// render mix and match button if creating new storage
		if (state.mix) {
			let btn = UiUtils.getNextButton("Select multiple", UiUtils.getMixLogo()).appendTo(div);
			btn.click(function() { onCryptoSelection("MIX"); });
		}
		
		// render crypto buttons
		for (let plugin of state.plugins) {
			let btn = UiUtils.getNextButton(plugin.getName() + " (" + plugin.getTicker() + ")", plugin.getLogo()).appendTo(div);
			btn.click(function() {
				
				// start loading dependencies but don't wait
				loader.load(plugin.getDependencies());
				
				// invoke callback
				onCryptoSelection(plugin.getTicker());
			});
		}
		
		// done rendering
		callback(div);
	}
}
inheritsFrom(SelectCryptoController, DivController);

/**
 * Render mixed num keys input.
 * 
 * Modifies state.mix and invokes onMixNumKeysInput() on input.
 */
function MixNumKeysController(div, state, onMixNumKeysInput) {
	DivController.call(this, div);
	var errorDiv = $("<div>");
	
	this.render = function(callback) {
		UiUtils.pageSetup(div);
		
		// render title
		div.append(UiUtils.getPageHeader("Enter the number of keys to create for each currency.", UiUtils.getMixLogo()));
		
		// render num key inputs
		let numKeysInputs = [];
		for (let plugin of state.plugins) {
			let numKeysDiv = $("<div class='crypto_num_keys_div'>").appendTo(div);
			let numKeysLogoDiv = $("<div class='crypto_icon_div'>").appendTo(numKeysDiv);
			let logo = plugin.getLogo().appendTo(numKeysLogoDiv);
			logo.attr("class", "crypto_icon");
			numKeysDiv.append(plugin.getName());
			let numKeysInput = $("<input>").appendTo(numKeysDiv);
			numKeysInput.attr("class", "crypto_num_keys_input");
			numKeysInput.attr("type", "number");
			numKeysInput.attr("min", 0);
			numKeysInput.attr("value", 0);
			numKeysInputs.push(numKeysInput);
		}
		
		// add error div
		errorDiv.attr("class", "error_msg");
		setErrorMessage("");
		div.append(errorDiv);
		
		// next button
		let btnNext = UiUtils.getNextButton("Next").appendTo(div);
		
		// validate num keys when button clicked
		btnNext.click(function() {
			
			// validate number of keys for each plugin
			let sum = 0;
			let error = false;
			let numKeysInts = [];
			for (let i = 0; i < state.plugins.length; i++) {
				try {
					let numKeys = parseFloat(numKeysInputs[i].val());
					validateNumKeys(state.plugins[i].getName(), numKeys);
					sum += numKeys;
					numKeysInts.push(numKeys);
				} catch (err) {
					setErrorMessage(err.message);
					error = true;
					break;
				}
			}
			
			// continue if no error
			if (!error) {
				
				// validate at least one key
				if (sum === 0) setErrorMessage("Must create at least one key");
								
				// build state.mix
				else {
					setErrorMessage("");
					state.mix = [];
					for (let i = 0; i < plugins.length; i++) {
						if (!numKeysInts[i]) continue;
						state.mix.push({plugin: plugins[i], numKeys: numKeysInts[i]});
					}
					onMixNumKeysInput();
				}
			}
		});
		
		// done rendering
		callback(div);
	}
	
	function validateNumKeys(name, numKeys) {
		if (!isInt(numKeys)) throw new Error("Number of " + name + " keys must be an integer");
		else if (numKeys < 0) throw new Error("Number of " + name + " keys cannot be negative");
	}
	
	function setErrorMessage(str) {
		errorDiv.html(str);
		str === "" ? errorDiv.hide() : errorDiv.show();
	}
}
inheritsFrom(MixNumKeysController, DivController);

/**
 * Render number of keys.
 * 
 * Invokes onNumKeysInput(numKeys) when done.
 */
function NumKeysController(div, state, onNumKeysInput) {
	DivController.call(this, div);
	var errorDiv = $("<div>");
	
	this.render = function(callback) {
		UiUtils.pageSetup(div);
		
		// render title
		let plugin = state.mix[0].plugin;
		div.append(UiUtils.getPageHeader("How many keys do you want to create?", plugin.getLogo()));
		
		// num key keys input
		let numKeysInput = $("<input>");
		numKeysInput.attr("class", "num_input");
		numKeysInput.attr("type", "number");
		numKeysInput.attr("min", 1);
		numKeysInput.attr("value", 10);
		div.append(numKeysInput);
		div.append("<br><br>");
		numKeysInput.keypress(function() { state.pageManager.getPathTracker().clearNexts(); });
		
		// error message
		errorDiv.attr("class", "error_msg");
		setErrorMessage("");
		div.append(errorDiv);
		
		// next button
		let btnNext = UiUtils.getNextButton("Next").appendTo(div);
		
		// validate num keys when button clicked
		btnNext.click(function() {
			var numKeys = parseFloat(numKeysInput.val());
			try {
				validateNumKeys(numKeys);
				setErrorMessage("");
				onNumKeysInput(numKeys);
			} catch (err) {
				setErrorMessage(err.message);
			}
		});
		
		// done rendering
		callback(div);
	}
	
	// validates number of pairs is integer >= 1
	function validateNumKeys(numPairs) {
		if (isInt(numPairs)) {
			if (numPairs < 1) throw new Error("Number of keys must be at least 1");
		} else throw new Error("Number of keys must be an integer greater than 0");
	}
	
	function setErrorMessage(str) {
		errorDiv.html(str);
		str === "" ? errorDiv.hide() : errorDiv.show();
	}
}
inheritsFrom(NumKeysController, DivController);

/**
 * Render password selection page.
 */
function PasswordSelectionController(div, state, onPasswordSelection) {
	DivController.call(this, div);
	this.render = function(callback) {
		UiUtils.pageSetup(div);
		
		// render title
		div.append(UiUtils.getPageHeader("Do you want to password protect your private keys?", UiUtils.getCryptoLogo(state)));
		
		var btnYes = UiUtils.getNextButton("Yes (recommended)");
		btnYes.click(function() { onPasswordSelection(true); });
		div.append(btnYes);
		var btnNo = UiUtils.getNextButton("No");
		btnNo.click(function() { onPasswordSelection(false); });
		div.append(btnNo);
		
		// done rendering
		callback(div);
	}
}
inheritsFrom(PasswordSelectionController, DivController);

/**
 * Render password input page.
 * 
 * @param div is the div to render to
 * @param state is updated with the new password configuration
 */
function PasswordInputController(div, state, onPasswordInput) {
	DivController.call(this, div);
	var passwordInput;	// for later focus on show
	var errorDiv = $("<div>");
	let advancedOpen;
	
	this.render = function(callback) {
		UiUtils.pageSetup(div);

		// render title
		div.append(UiUtils.getPageHeader("Enter a password to protect your private keys.", UiUtils.getCryptoLogo(state)));
		
		// render error div
		div.append(errorDiv);
		errorDiv.attr("class", "error_msg");
		errorDiv.hide();
		div.append(errorDiv);
		
		// render password input
		div.append("Password: ");
		passwordInput = $("<input type='text'>");
		passwordInput.attr("class", "text_input");
		div.append(passwordInput);
		div.append("<br><br>");
		passwordInput.keypress(function() { state.pageManager.getPathTracker().clearNexts(); });
		
		// render advanced link
		let advancedLink = $("<div class='mock_link'>").appendTo(div);
		advancedLink.click(function() { toggleAdvanced(); });
		function toggleAdvanced() {
			advancedOpen = !advancedOpen;
			advancedLink.text(advancedOpen ? "\u25be Advanced" : "\u25b8 Advanced");
			advancedOpen ? advancedDiv.show() : advancedDiv.hide();
		}
		
		// render each encryption selection div
		let advancedDiv = $("<div>").appendTo(div);
		advancedDiv.css("margin-left", "18px");
		advancedDiv.append("<br>Encryption options:");
		let options = false;
		let encryptionSelectors = [];
		for (let elem of state.mix) {
			if (elem.plugin.getEncryptionSchemes().length > 1) {
				options = true;
				let encryptionSelector = new EncryptionSelector(elem.plugin, $("<div>"));
				encryptionSelectors.push(encryptionSelector);
				advancedDiv.append(encryptionSelector.getDiv());
			} else {
				encryptionSelectors.push(null);
			}
		}
		
		// toggle advanced closed by default
		advancedOpen = true;
		toggleAdvanced();
		
		// only render advanced div if options exist
		if (!options) advancedLink.hide();
		
		// render next button
		div.append("<br>");
		var btnNext = UiUtils.getNextButton("Next").appendTo(div);
		btnNext.click(function() {
			let password = passwordInput.val();
			if (password === "") setErrorMessage("Password cannot be empty")
			else if (password.length < 6) setErrorMessage("Password must be at least 6 characters");
			else {
				setErrorMessage("");
				for (let i = 0; i < state.mix.length; i++) {
					state.mix[i].password = passwordInput.val();
					state.mix[i].encryption = encryptionSelectors[i] ? encryptionSelectors[i].getSelection() : state.mix[i].plugin.getEncryptionSchemes()[0];
				}
				onPasswordInput();
			}
			passwordInput.focus();
		});
		
		// register pasword enter key
		passwordInput.keyup(function(e) {
			var code = e.which;
		    if (code == 13) {
		    	e.preventDefault();
		        btnNext.click();
		    }
		});
		
		// done rendering
		callback(div);
		
		// private renderer to select encryption scheme
		function EncryptionSelector(plugin, div) {
			let inputs = [];
			render();
			function render() {
				div.attr("class", "encryption_selection_div");
				
				// append logo div
				let logoDiv = $("<div class='crypto_icon_div'>").appendTo(div);
				let icon = plugin.getLogo();
				icon.attr("class", "crypto_icon");
				logoDiv.append(icon);
				
				// append name
				div.append(plugin.getName());
								
				// append encryption selections
				let schemesDiv = $("<div>").appendTo(div);
				schemesDiv.attr("class", "schemes_div");
				let schemes = plugin.getEncryptionSchemes();
				for (let scheme of schemes) {
					let input = $("<input type='radio' name='" + plugin.getName() + "' value='" + scheme + "'" + (scheme === schemes[0] ? " checked" : "") + ">");
					inputs.push(input);
					let schemeDiv = $("<div class='scheme_div'>");
					schemeDiv.append(input);
					schemeDiv.append(scheme);
					schemesDiv.append(schemeDiv);
				}
			}
			
			this.getDiv = function() {
				return div;
			}
			
			this.getSelection = function() {
				for (let input of inputs) {
					if (input.prop("checked")) return input.attr("value");
				}
				throw new Error("No encryption radio button selected");
			}
		}
	}
	
	this.onShow = function() {
		passwordInput.focus();
	}
	
	function setErrorMessage(str) {
		errorDiv.html(str);
		str === "" ? errorDiv.hide() : errorDiv.show();
	}
}
inheritsFrom(PasswordInputController, DivController);

/**
 * Render split selection page.
 */
function SplitSelectionController(div, state, onSplitSelection) {
	DivController.call(this, div);
	this.render = function(callback) {
		UiUtils.pageSetup(div);
		
		// render title
		div.append(UiUtils.getPageHeader("Do you want to split your private keys into separate pieces?", UiUtils.getCryptoLogo(state)));
		
		div.append("The pieces must be recombined to recover the private keys.");
		div.append("<br><br>");
		
		var btnYes = UiUtils.getNextButton("Yes").appendTo(div);
		btnYes.click(function() { onSplitSelection(true); });
		var btnNo = UiUtils.getNextButton("No").appendTo(div);
		btnNo.click(function() { onSplitSelection(false); });
		
		// done rendering
		callback(div);
	}
}
inheritsFrom(SplitSelectionController, DivController);

/**
 * Number of pieces input page.
 */
function NumPiecesInputController(div, state, onPiecesInput) {
	DivController.call(this, div);
	var errorDiv = $("<div>");

	this.render = function(callback) {
		UiUtils.pageSetup(div);

		// render title
		div.append(UiUtils.getPageHeader("How many pieces do you want to split your private keys into?", UiUtils.getCryptoLogo(state)));
		
		div.append("Number of pieces: ");
		var numPiecesInput = $("<input type='number'>");
		numPiecesInput.attr("class", "num_input");
		numPiecesInput.attr("value", 3);
		numPiecesInput.attr("min", 2);
		div.append(numPiecesInput);
		div.append("<br><br>");
		numPiecesInput.keypress(function() { state.pageManager.getPathTracker().clearNexts(); });
		
		div.append("Number of pieces necessary to restore private keys: ");
		var minPiecesInput = $("<input type='number'>");
		minPiecesInput.attr("min", 2);
		minPiecesInput.attr("class", "num_input");
		minPiecesInput.attr("value", 2);
		div.append(minPiecesInput);
		div.append("<br><br>");
		minPiecesInput.keypress(function() { state.pageManager.getPathTracker().clearNexts(); });
		
		// error message
		errorDiv.empty();
		errorDiv.attr("class", "error_msg");
		setErrorMessage("");
		div.append(errorDiv);
		
		// render next button
		var btnNext = UiUtils.getNextButton("Next");
		btnNext.click(function() {
			var numPieces = parseFloat(numPiecesInput.val());
			var minPieces = parseFloat(minPiecesInput.val());
			try {
				validatePiecesInput(numPieces, minPieces);
				setErrorMessage("");
				onPiecesInput(numPieces, minPieces);
			} catch (err) {
				setErrorMessage(err.message);
			}
		});
		div.append(btnNext);
		
		// done rendering
		callback(div);
	}
	
	function setErrorMessage(str) {
		errorDiv.html(str);
		str === "" ? errorDiv.hide() : errorDiv.show();
	}
	
	function validatePiecesInput(numPieces, minPieces) {
		if (!isInt(numPieces)) throw new Error("Number of pieces must be an integer");
		else if (numPieces < 2) throw new Error("Number of pieces must be at least 2");
		if (!isInt(minPieces)) throw new Error("Minimum pieces must be an integer");
		else if (minPieces < 1) throw new Error("Minimum pieces must be at least 1");
		else if (minPieces > numPieces) throw new Error("Minimum pieces cannot be more than the number of pieces");
	}
}
inheritsFrom(NumPiecesInputController, DivController);

/**
 * Summarize configuration and generate pieces.
 * 
 * @param div is the div to render to
 * @param state is the current state of the application
 * @param onPiecesGenerated(pieces) is invoked when the pieces are created
 */
function GeneratePiecesController(div, state, onPiecesGenerated) {
	DivController.call(this, div);
	
	// progress bars
	let encryptProgressDiv;
	let encryptProgressBar;
	let decryptProgressDiv;
	let decryptProgressBar;
	
	this.render = function(callback) {
		UiUtils.pageSetup(div);
		
		// render title
		div.append(UiUtils.getPageHeader("Ready to generate your " + UiUtils.getCryptoName(state) + " storage?", UiUtils.getCryptoLogo(state)));
		
		// render summary
		div.append("<b>Summary:</b><br><br>");
		for (let elem of state.mix) {
			div.append(elem.numKeys + " " + elem.plugin.getName() + " keys" + (elem.encryption ? " encrypted with " + elem.encryption : " unencrypted") + "<br>");
		}
		if (state.splitEnabled) {
			div.append("Split private keys into " + state.numPieces + " pieces with a minimum of " + state.minPieces + " to restore")
		} else {
			div.append("Private keys will not be split")
		}
		div.append("<br><br>");
		
		// render generate button
		var btnGenerate = UiUtils.getNextButton("Generate storage");
		btnGenerate.click(function() {
			btnGenerate.attr("disabled", "disabled");
			generatePieces(function(pieces) {
				onPiecesGenerated(pieces);
				btnGenerate.removeAttr("disabled");
			});
		});
		div.append(btnGenerate);
		
		// add progress bars
		encryptProgressDiv = $("<div>").appendTo(div);
		encryptProgressBar = new ProgressBar.Line(encryptProgressDiv.get(0), {
			strokeWidth: 2,
			color: '##33cc33',
			svgStyle: {width: '100%', height: '100%'}
		});
//		decryptProgressDiv = $("<div>").appendTo(div);
//		decryptProgressBar = new ProgressBar.Line(decryptProgressDiv.get(0), {
//			strokeWidth: 2,
//			color: '#33cc33',
//			svgStyle: {width: '100%', height: '100%'}
//		});
		
		// done rendering
		callback(div);
	}
	
	function generatePieces(onPiecesGenerated) {
		
		// collect dependencies
		let dependencies = new Set();
		for (let elem of state.mix) {
			for (let dependency of elem.plugin.getDependencies()) dependencies.add(dependency);
		}
		
		// load dependencies
		loader.load(Array.from(dependencies), function() {
			
			// weight BIP38 for more accurate status
			let bip38Weight = 100;
			
			// get total number of keys
			let numKeysWeighted = 0;
			for (let elem of state.mix) {
				numKeysWeighted += (elem.encryption === EncryptionScheme.BIP38 ? bip38Weight : 1) * elem.numKeys;
			}
			
			// create keys and callback functions to encrypt
			let originals = [];	// save originals for later validation
			let funcs = [];
			let passwords = [];
			let numEncrypted = 0;
			let numDecrypted = 0;
			for (let elem of state.mix) {
				for (let i = 0; i < elem.numKeys; i++) {
					let original = elem.plugin.newKey();
					originals.push(original);
					passwords.push(elem.password);
					if (elem.encryption) funcs.push(encryptFunc(original.copy(), elem.encryption, elem.password));
				}
			}
			
			// handle no encryption
			if (!funcs.length) {
				
				// convert keys to pieces
				let pieces = keysToPieces(originals, state.numPieces, state.minPieces);
				
				// validate pieces can recreate originals
				let keysFromPieces = piecesToKeys(pieces);
				assertEquals(originals.length, keysFromPieces.length);
				for (let i = 0; i < originals.length; i++) {
					assertTrue(originals[i].equals(keysFromPieces[i]));
				}
				
				// pieces created and validated
				onPiecesGenerated(pieces);
				return;
			}
			
			// encrypt keys
			async.series(funcs, function(err, encryptedKeys) {
				
				// convert keys to pieces
				let pieces = keysToPieces(encryptedKeys, state.numPieces, state.minPieces);
				
				// validate pieces can recreate originals
				let keysFromPieces = piecesToKeys(pieces);
				
				// collect decryption functions
				funcs = [];
				for (let i = 0; i < encryptedKeys.length; i++) {
					funcs.push(decryptFunc(encryptedKeys[i], passwords[i]));
				}
				
				// decrypt keys
				async.series(funcs, function(err, decryptedKeys) {
					
					// verify equivalence
					for (let i = 0; i < originals.length; i++) {
						assertTrue(originals[i].equals(decryptedKeys[i]));
					}
					
					// pieces created and validated
					onPiecesGenerated(pieces);
				});
			});
			
			function encryptFunc(key, scheme, password) {
				return function(callback) {
					key.encrypt(scheme, password, function(err, key) {
						numEncrypted += (scheme === EncryptionScheme.BIP38 ? bip38Weight : 1);
						setEncryptionStatus(numEncrypted, numKeysWeighted);
						setTimeout(function() { callback(err, key); }, 0);
					});
				}
			}
			
			function decryptFunc(key, password) {
				return function(callback) {
					let scheme = key.getEncryptionScheme();
					key.decrypt(password, function(err, key) {
						numDecrypted += (scheme === EncryptionScheme.BIP38 ? bip38Weight : 1);
						setDecryptionStatus(numDecrypted, numKeysWeighted);
						setTimeout(function() { callback(err, key); });
					});
				}
			}
		});
	}
	
	function setEncryptionStatus(done, total) {
		console.log("setEncryptionProgress(" + done + "/" + total + " (" + (done / total) + "%))");
		let rounded = Math.round(done / total);
		encryptProgressBar.animate(rounded);
	}
	
	function setDecryptionStatus(done, total) {
		console.log("setDecryptionProgress(" + done + "/" + total + " (" + (done / total) + "%))");
		let rounded = Math.round(done / total);
//		decryptProgressBar.animate(rounded);
	}
}
inheritsFrom(GeneratePiecesController, DivController);

/**
 * Renders a piece with one or more public/private components to a div with the given config.
 * 
 * @param div is the div to render to
 * @param piece is the piece with one or more public/private components to render
 * @param config specifies the render configuration (optional)
 */
function PieceRenderer(div, piece, config) {
	DivController.call(this, div);
	
	// initialize default configuration
	var DEFAULT_CONFIG = {
		public_qr: true,
		private_qr: true,
		public_text: true,
		private_text: true,
		num_columns: 2,
		qr_size: 200,
		qr_version: null,
		qr_error_correction_level: 'H',
		qr_scale: 4,
		qr_padding: 5,		// spacing in pixels
		col_spacing: 12,	// spacing in pixels
		add_table_width: 15	// spacing in pixels
	};
	
	this.render = function(callback) {
		
		// empty existing div
		div.empty();
		
		// merge configs
		config = Object.assign({}, DEFAULT_CONFIG, config);
		
		// collect callback functions to render each piece pair
		var callbackFunctions = [];
		var rowDiv;
		for (var i = 0; i < piece.length; i++) {
			
			// get public/private pair
			var keyPiece = piece[i];
			
			// create pair div
			var pairDiv = $("<div>");
			pairDiv.css("margin", 0);
			pairDiv.css("padding", 0);
			pairDiv.css("border", 0);
			pairDiv.css("flex", 1);
			pairDiv.css("page-break-inside", "avoid");
			
			// prepare function to render pair
			callbackFunctions.push(callbackFunctionRenderPairDiv(pairDiv, "==== " + (i + 1) + " ====", keyPiece.address, keyPiece.privateKey, config));
			
			// append pair div and row div
			if (i % config.num_columns === 0) {
				rowDiv = $("<div>");
				rowDiv.css("display", "flex");
				rowDiv.css("page-break-inside", "avoid");
				rowDiv.css("margin", 0);
				rowDiv.css("padding", 0);
				rowDiv.css("border", 0);
				div.append(rowDiv);
				//if (i < piece.length - 1) div.append("<br>");
			}
			rowDiv.append(pairDiv);
			if ((i + 1) % config.num_columns !== 0) {
				var spaceDiv = $("<div>");
				spaceDiv.css("min-width", config.col_spacing + "px");
				spaceDiv.css("margin", 0);
				spaceDiv.css("padding", 0);
				spaceDiv.css("border", 0);
				rowDiv.append(spaceDiv);
			}
		}
		
		// execute callback functions
		async.series(callbackFunctions, callback);
		
		/**
		 * Returns a callback function (function with single callback argument) which will render a pair div.
		 */
		function callbackFunctionRenderPairDiv(pairDiv, name, publicKey, privateKey, config) {
			
			// callback function wraps rendering
			return function(callback) {
				renderPair(pairDiv, name, publicKey, privateKey, config, callback);
			}
			
			/**
			 * Renders a single public/private pair to a div.
			 * 
			 * @param div is the div to render to
			 * @param name is the name of the key pair
			 * @param publicKey is the public component of the wallet
			 * @param privateKey is the private component of the wallet
			 * @param config specifies the render configuration
			 * @param callback is called when the rendering is complete
			 */
			function renderPair(div, name, publicKey, privateKey, config, callback) {
				
				// track number of threads to know when rendering is complete
				var numThreads = (config.public_qr ? 1 : 0) + (config.private_qr ? 1 : 0) + (config.public_text || config.private_text ? 1 : 0);	// one for each qr and one for text
				var tracker2 = new ThreadTracker();
				tracker2.onIdle(function() {
					if (tracker2.getNumStopped() === numThreads) callback();
				});
				
				// global text style
				var monoStyle = "font-size:11px; font-family:monospace;";
						
				// configure div
				div.css("margin", 0);
				div.css("padding", 0);
				div.css("border", "none");
				div.css("align-items", "stretch");
				var numQrs = (config.public_qr ? 1 : 0) + (config.private_qr ? 1 : 0);
				div.css("min-width", config.add_table_width + numQrs * (config.qr_size + (config.qr_padding * 2)) + "px");
				div.css("page-break-inside", "avoid");

				// create pair header
				div.append($("<div style='" + monoStyle + " text-align:center; border:1'>").append(name));
				div.append("<br>");
				
				// add qr codes
				if (config.public_qr || config.private_qr) {
					
					// div to hold qr table
					var qrTableDiv = $("<div>");
					qrTableDiv.css("page-break-inside", "avoid");
					qrTableDiv.css("width", "100%");
					
					// qr table
					var qrTable = $("<table border='1' width='100%' style='table-layout:fixed'>");
					qrTableDiv.append(qrTable);
					var qrTr1 = $("<tr>");
					qrTable.append(qrTr1);
					var qrTr2 = $("<tr>");
					qrTable.append(qrTr2);
					
					// render public QR
					if (config.public_qr) {
						tracker2.threadStarted();
						renderQrCode(publicKey, getQrConfig(config), function(img) {
							qrTr1.append($("<td align='center' style='" + monoStyle + "'>").html("Public"));
							qrTr2.append($("<td align='center' style='margin:0; padding:" + config.qr_padding + "px;'>").append(img));
							tracker2.threadStopped();
							
							// render private QR
							if (config.private_qr) {
								tracker2.threadStarted();
								renderQrCode(privateKey, getQrConfig(config), function(img) {
									qrTr1.append($("<td align='center' style='" + monoStyle + "'>").html("Private"));
									qrTr2.append($("<td align='center' style='margin:0; padding:" + config.qr_padding + "px;'>").append(img));
									tracker2.threadStopped();
								});
							}
						});
					}
					
					// render only private QR
					else if (config.private_qr) {
						tracker2.threadStarted();
						renderQrCode(privateKey, getQrConfig(config), function(img) {
							qrTr1.append($("<td align='center' style='" + monoStyle + "'>").html("Private"));
							qrTr2.append($("<td align='center' style='margin:0; padding:" + config.qr_padding + "px;'>").append(img));
							tracker2.threadStopped();
						});
					}
					
					qrTableDiv.append("<br>");
					div.append(qrTableDiv);
				}
				
				// add public/private text
				if (config.public_text || config.private_text) {
					tracker2.threadStarted();	// start writing text
					
					// add public text
					if (config.public_text) {
						div.append("<div style='" + monoStyle + " word-wrap:break-word;'>Public: " + publicKey + "<br><br></div>");
					}
					
					// add private text
					if (config.private_text) {
						div.append("<div style='" + monoStyle + " word-wrap:break-word;'>Private: " + privateKey + "<br><br></div>");
					}
					
					tracker2.threadStopped();
				}
				
				function getQrConfig(config) {
					var qr_config = {};
					if ("undefined" !== config.qr_size) qr_config.size = config.qr_size;
					if ("undefined" !== config.qr_version) qr_config.version = config.qr_version;
					if ("undefined" !== config.qr_error_correction_level) qr_config.errorCorrectionLevel = config.qr_error_correction_level;
					if ("undefined" !== config.qr_scale) qr_config.scale = config.qr_scale;
					return qr_config;
				}
			}
		}
	}
}
inheritsFrom(PieceRenderer, DivController);

/**
 * Render page to import private components from text.
 * 
 * @param div is the div to render to
 * @param plugin is the crypto plugin for key generation
 * @param onKeysImported(key) is invoked with the imported key
 */
function ImportTextController(div, state, onKeysImported) {
	DivController.call(this, div);
	var errorDiv = $("<div>");
	var lastCount = 0;
	var textarea;
	
	this.render = function(callback) {
		UiUtils.pageSetup(div);
		
		// render title
		div.append(UiUtils.getPageHeader("Enter " + state.plugin.getName() + " private key or pieces:", state.plugin.getLogo()));
		
		// render error div
		errorDiv.empty();
		errorDiv.attr("class", "error_msg");
		setErrorMessage("");
		div.append(errorDiv);
		
		// render textarea input
		textarea = $("<textarea>");
		div.append(textarea);
		textarea.keyup(function() {
			
			// load dependencies
			loader.load(state.plugin.getDependencies(), function() {
				
				// only continue if new characters added
				let count = countNonWhitespaceCharacters(textarea.val());
				if (lastCount === count) return;
				lastCount = count;
				
				try {
					if (textarea.val() === "") {
						setErrorMessage("");
					} else {
						var key = parseKey(state.plugin, textarea.val());
						setErrorMessage("");
						if (key) onKeysImported([key]);
					}
				} catch (err) {
					console.log(err);
					setErrorMessage(err.message);
				}
			})
		});
		
		// done rendering
		callback(div);
	}
	
	this.onShow = function() {
		textarea.focus();
	}
	
	function setErrorMessage(str) {
		errorDiv.html(str);
		str === "" ? errorDiv.hide() : errorDiv.show();
	}
}
inheritsFrom(ImportTextController, DivController);

/**
 * Render page to password decrypt keys.
 * 
 * @param div is the div to render to
 * @param keys are the keys to decrypt
 * @param onKeysDecrypt(keys) is invoked when the keys are decrypted
 */
function DecryptKeysController(div, state, onKeysDecrypted) {
	DivController.call(this, div);
	var keys = state.keys;
	var passwordInput;	// for later focus
	
	this.render = function(callback) {
		UiUtils.pageSetup(div);
		
		// render title
		var title = "Imported " + keys.length + " " + UiUtils.getCryptoName(state) + " keys which are password protected.  Enter the password to decrypt them.";
		div.append(UiUtils.getPageHeader(title, UiUtils.getCryptoLogo(state)));
		
		// render error div
		div.append(errorDiv);
		errorDiv.attr("class", "error_msg");
		errorDiv.hide();
		div.append(errorDiv);
		
		// render password input
		div.append("Password: ");
		passwordInput = $("<input type='text'>");
		passwordInput.attr("class", "text_input");

		div.append(passwordInput);
		div.append("<br><br>");
		
		// render decrypt button
		var btnDecrypt = UiUtils.getButton("Decrypt");
		btnDecrypt.click(function() {
			var password = passwordInput.val();
			if (password === "") {
				setErrorMessage("Password must not be blank");
				return;
			} else {
				setErrorMessage("");
				btnDecrypt.attr("disabled", "disabled");
			}
			
			// collect functions to decrypt
			let funcs = [];
			for (let key of keys) {
				funcs.push(function(callback) { key.decrypt(password, callback); });
			}
			
			// decrypt keys
			async.series(funcs, function(err, result) {
				if (err) {
					setErrorMessage(err.message);
					passwordInput.focus();
					btnDecrypt.removeAttr("disabled");
				} else {
					onKeysDecrypted(keys);
				}
			});
		});
		div.append(btnDecrypt);
		
		// register pasword enter key
		passwordInput.keyup(function(e) {
			var code = e.which;
		    if (code == 13) {
		    	e.preventDefault();
		    	btnDecrypt.click();
		    }
		});
		
		// done rendering
		callback();
	}
	
	this.onShow = function() {
		passwordInput.focus();
	}
	
	function setErrorMessage(str) {
		errorDiv.html(str);
		str === "" ? errorDiv.hide() : errorDiv.show();
	}
	
	var errorDiv = $("<div>");
}
inheritsFrom(DecryptKeysController, DivController);

/**
 * Render import files page.
 * 
 * @param div is the div to render to
 * @param onKeysImported is invoked when keys are extracted from uploaded files
 * @param onSelectImportText is invoked if the user prefers to import a private key from text
 */
function ImportFilesController(div, onKeysImported, onSelectImportText) {
	DivController.call(this, div);
	
	this.render = function(callback) {
		UiUtils.pageSetup(div);
		
		// render title
		div.append(UiUtils.getPageHeader("Import zip or json files from cryptostorage.com."));
		
		// add error div
		div.append(errorDiv);
		
		// add upload button
		var input = $("<input type='file' multiple>").appendTo(div);
		input.change(function() { onFilesImported($(this).get(0).files); });
		div.append("<br><br>");
		
		// add file list div
		div.append(fileList);
		
		// add button to import from text
		div.append("<br><br>");
		var btnImportText = UiUtils.getNextButton("Import private key from text instead").appendTo(div);
		btnImportText.click(onSelectImportText);
		
		// handle on files imported
		function onFilesImported(files) {
			for (let file of files) readFile(file);
			function readFile(file) {
				var reader = new FileReader();
				reader.onload = function(event) {
					getNamedPiecesFromFile(file, reader.result, function(namedPieces) {
						if (namedPieces.length === 0) {
							if (file.type === "application/json") that.setErrorMessage("File '" + file.name + "' is not a valid JSON piece");
							else if (file.type === "application/zip") that.setErrorMessage("Zip '" + file.name + "' does not contain any valid JSON pieces");
							else throw new Error("Unrecognized file type: " + file.type);
						} else {
							for (let namedPiece of namedPieces) {
								try {
									addPiece(namedPiece.name, namedPiece.piece);
									setErrorMessage("");
								} catch (err) {
									setErrorMessage(err.message);
								}
							}
							let pieces = [];
							for (let importedPiece of importedPieces) pieces.push(importedPiece.piece);
							
							// collect cryptos being imported
							let cryptos = new Set();
							for (let elem of pieces[0]) cryptos.add(elem.crypto);
							
							// collect dependencies
							let dependencies = new Set();
							for (let crypto of cryptos) {
								let plugin = getCryptoPlugin(crypto);
								for (let dependency of plugin.getDependencies()) dependencies.add(dependency);
							}
							
							// load dependencies
							loader.load(Array.from(dependencies), function() {
								
								// create keys
								let keys = piecesToKeys(pieces);
								if (keys.length > 0) onKeysImported(keys);
							})
						}
					});
				}
				if (file.type === 'application/json') reader.readAsText(file);
				else if (file.type === 'application/zip') reader.readAsArrayBuffer(file);
				else setErrorMessage("'" + file.name + "' is not a zip or json file.");
			}
		}
		
		function getNamedPiecesFromFile(file, data, onNamedPieces) {
			if (file.type === 'application/json') {
				let piece = JSON.parse(data);
				validatePiece(piece);
				let namedPiece = {name: file.name, piece: piece};
				onNamedPieces([namedPiece]);
			}
			else if (file.type === 'application/zip') {
				zipToPieces(data, function(namedPieces) {
					onNamedPieces(namedPieces);
				});
			}
		}
		
		// done rendering
		callback();
	};
	
	function setErrorMessage(str) {
		errorDiv.html(str);
		str === "" ? errorDiv.hide() : errorDiv.show();
	}
	
	function addPiece(name, piece) {
		
		// don't re-add same piece
		let found = false;
		for (let importedPiece of importedPieces) {
			if (name === importedPiece.name) found = true;
		}
		if (!found) importedPieces.push({name: name, piece: piece});
		
		// update imported pieces
		renderImportedPieces(importedPieces);
	}
	
	function removePiece(name) {
		for (let i = 0; i < importedPieces.length; i++) {
			if (importedPieces[i].name === name) {
				if (confirm("Are you sure you want to remove " + name + "?")) {
					importedPieces.splice(i, 1);
					renderImportedPieces(importedPieces);
					return;
				}
			}
		}
		throw new Error("No piece with name '" + name + "' imported");
	}
	
	function renderImportedPieces(importedPieces) {
		fileList.empty();
		for (let importedPiece of importedPieces) {
			var trashIcon = $("<img src='img/trash.png' class='trash_icon'>").appendTo(fileList);
			trashIcon.click(function() { removePiece(importedPiece.name); });
			fileList.append(importedPiece.name);
			fileList.append("<br>");
		}
	}
	
	var that = this;
	var errorDiv = $("<div>");
	errorDiv.attr("class", "error_msg");
	var fileList = $("<div>");
	var importedPieces = [];	// [{name: 'btc.json', value: {...}}, ...]
	setErrorMessage("");
}
inheritsFrom(ImportFilesController, DivController);

/**
 * Renders page to download pieces.
 * 
 * @param div is the div to render to
 * @param state informs how to render
 */
function DownloadPiecesController(div, state, onCustomExport) {
	DivController.call(this, div);
	var pieces = state.pieces;
	assertTrue(pieces.length > 0);
	
	this.render = function(callback) {
		UiUtils.pageSetup(div);
		
		// render title
		div.append(UiUtils.getPageHeader("Download your " + UiUtils.getCryptoName(state) + " storage.", UiUtils.getCryptoLogo(state)));
		
		// collect functions to render pieces and divs to be rendered to
		let pieceDivs = [];
		let renderFuncs = [];
		for (let piece of pieces) {
			let pieceDiv = $("<div>");
			pieceDivs.push(pieceDiv);
			let renderer = new PieceRenderer(pieceDiv, piece);
			renderFuncs.push(function(callback) { renderer.render(function() { callback(); }) });
		}
		
		// render each piece
		async.parallelLimit(renderFuncs, 3, function(err, result) {
			
			// wrap piece divs in html containers
			let pieceHtmls = [];
			for (let pieceDiv of pieceDivs) {
				pieceHtmls.push($("<html>").append($("<body>").append(pieceDiv)));
			}
			
			// zip pieces
			piecesToZip(pieces, pieceHtmls, function(name, blob) {
				
				// render zip download
				div.append("<br>");
				let downloadZipsDiv = $("<div>").appendTo(div);
				downloadZipsDiv.attr("class", "download_zips_div");
				let downloadZipDiv = $("<div>").appendTo(downloadZipsDiv);
				downloadZipDiv.attr("class", "download_zip_div");
				let downloadIconDiv = $("<div style='text-align:center'>").appendTo(downloadZipDiv);
				let downloadIcon = $("<img src='img/download.png' class='download_icon'>").appendTo(downloadIconDiv);
				downloadIcon.click(function() { saveAs(blob, name); });
				
				// render custom export options
				let customExport = $("<a href=''>").appendTo(downloadZipDiv);
				customExport.append("Custom export options");
				customExport.click(function(event) { event.preventDefault(); onCustomExport(pieces); });
				
				// render preview
				div.append("<br>Preview:<br>");
				div.append(pieceDivs[0]);
				
				// done rendering
				callback(div);
			});
		});
	}
}
inheritsFrom(DownloadPiecesController, DivController);

/**
 * Controls the custom export page.
 * 
 * @param div is the div to render to
 * @param state is the current state of the application
 * @param pieces are the pieces to custom export
 */
function CustomExportController(div, state, pieces) {
	DivController.call(this, div);
	assertTrue(pieces.length > 0);
	
	this.render = function(callback) {
		UiUtils.pageSetup(div);
		
		// render mock png
		let mock = $("<img src='img/mock_export.png'>").appendTo(div);
		mock.css("width", "100%");
		
		callback(div);
	}
}
inheritsFrom(CustomExportController, DivController);