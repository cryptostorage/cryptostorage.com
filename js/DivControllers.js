/**
 * UI utilities.
 */
let UiUtils = {
	
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
			return CryptoUtils.getCryptoPlugin(ticker).getLogo();
		}
	},
	
	getMixLogo: function() {
		return $("<img src='img/mix.png'>");
	},
	
	getLink: function(href, label) {
		if (!href) href = '';
		let link = $("<a href='" + href + "'>");
		link.html(label);
		return link;
	},
	
	getProgressBar: function(div) {
		return new ProgressBar.Line(div, {
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
	}
}

/**
 * Relative weights of key creation and encryption/decryption operations.
 * 
 * Derived from experimentation and used for representative progress bar.
 */
let Weights = {
	getCreateKeyWeight: function() { return 63; },
	getEncryptWeight: function(scheme) {
		switch (scheme) {
			case CryptoUtils.EncryptionScheme.BIP38:
				return 4187;
			case CryptoUtils.EncryptionScheme.CRYPTOJS:
				return 10;
			default: throw new Error("Unrecognized encryption scheme: " + scheme);
		}
	},
	getDecryptWeight: function(scheme) {
		switch (scheme) {
			case CryptoUtils.EncryptionScheme.BIP38:
				return 4581;
			case CryptoUtils.EncryptionScheme.CRYPTOJS:
				return 100;
			default: throw new Error("Unrecognized encryption scheme: " + scheme);
		}
	},
	getQrWeight: function() {
		return 25;
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
 * Controls page navigation and rendering.
 * 
 * @param div is the div to render navigable pages to
 */
function PageController(div) {
	
	let pathTracker = new PathTracker(onPageChange);	// track path through decision tree
	let pageDiv;										// container to render page content
	let transitioning = false;							// indicates if transition in progress to prevent duplicates
	let leftArrowDiv;									// container for left arrow
	let leftArrow;										// left navigation arrow
	let leftArrowDisabled;								// left navigation arrow when navigation disabled
	let rightArrowDiv;									// container for right arrow
	let rightArrow;										// right navigation arrow
	let rightArrowDisabled;								// right navigation arrow when navigation disabled
	
	this.render = function(callback) {
		
		// swipe div
		let scrollDiv = $("<div class='swipe_div'>").appendTo(div);
		
		// left arrow
		let leftDiv = $("<div class='side_div'>").appendTo(scrollDiv);
		leftArrowDiv = $("<div>").appendTo(leftDiv);
		leftArrowDiv.hide();
		leftArrow = $("<img class='nav_arrow left_arrow' src='img/closed_arrow.png'>").appendTo(leftArrowDiv);
		leftArrow.click(function() { pathTracker.prev(); });
		leftArrowDisabled = $("<img class='nav_arrow_disabled left_arrow' src='img/closed_arrow_grey.png'>");
		
		// page div
		pageDiv = $("<div class='page_div'>").appendTo(scrollDiv);
		
		// right arrow
		let rightDiv = $("<div class='side_div'>").appendTo(scrollDiv);
		rightArrowDiv = $("<div>").appendTo(rightDiv);
		rightArrowDiv.hide();
		rightArrow = $("<img class='nav_arrow right_arrow' src='img/closed_arrow.png'>").appendTo(rightArrowDiv);
		rightArrow.click(function() { pathTracker.next(); });
		rightArrowDisabled = $("<img class='nav_arrow_disabled right_arrow' src='img/closed_arrow_grey.png'>");
		
		// done rendering
		callback();
	}
	
	this.set = function(renderer) {
		transitioning = false;
		renderer.render(function(div) {
			for (let renderer of pathTracker.getItems()) renderer.getDiv().remove();
			pathTracker.clear();
			pathTracker.next(renderer);
		});
		leftArrowDiv.hide();
		rightArrowDiv.hide();
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
	
	this.setNavigable = function(enabled) {
		leftArrow.detach();
		leftArrowDisabled.detach();
		rightArrow.detach();
		rightArrowDisabled.detach();
		leftArrowDiv.append(enabled ? leftArrow : leftArrowDisabled);
		rightArrowDiv.append(enabled ? rightArrow : rightArrowDisabled);
	}
	
	/**
	 * Invoked when the current page is changed.
	 * 
	 * @param lastIdx the index of the page prior to the change
	 * @param curIdx the index of the current page
	 * @param renderer the page renderer for the page
	 */
	function onPageChange(lastIdx, curIdx, renderer) {
		
		// handle first page
		if (lastIdx === -1) {
			transitioning = false;
			pageDiv.append(renderer.getDiv());
		}
		
		// handle non-first page change
		else if (lastIdx !== curIdx){
			renderer.getDiv().hide();
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
		pathTracker.hasPrev() ? leftArrowDiv.show() : leftArrowDiv.hide();
		pathTracker.hasNext() ? rightArrowDiv.show() : rightArrowDiv.hide();
	}
}
inheritsFrom(PageController, DivController);

/**
 * Render home page.
 */
function HomeController(div, onSelectCreate, onSelectImport) {
	DivController.call(this, div);
	this.render = function(callback) {
		UiUtils.pageSetup(div);

		// render title
		div.append(UiUtils.getPageHeader("Welcome to cryptostorage.com."));
		
		div.append(getCheckmarkDiv("Create long-term storage for multiple cryptocurrencies."));
		div.append(getCheckmarkDiv("Storage can be password protected and split into pieces."));
		div.append(getCheckmarkDiv("Export to digital and printable formats which can be recovered any time."));
		div.append(getCheckmarkDiv("100% open source and free to use.  No registration or trusted third parties."));
		div.append("<br>");
		
		div.append("Select an option to get started.")
		div.append("<br><br>");
		
		// render create button
		if (window.crypto) {
			let btnCreate = UiUtils.getNextButton("Create new storage").appendTo(div);
			btnCreate.click(function() { onSelectCreate(); });
		} else {
			let btnCreate = UiUtils.getNextButton("Create new storage (your browser does not support window.crypto)").appendTo(div);
			btnCreate.attr("disabled", "disabled");
		}
		
		// render import button
		let btnExisting = UiUtils.getNextButton("Import existing storage");
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
			let btn = UiUtils.getNextButton(plugin.getName(), plugin.getLogo()).appendTo(div);
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
	let errorDiv = $("<div>");
	let numKeysInputs;
	
	this.render = function(callback) {
		UiUtils.pageSetup(div);
		
		// render title
		div.append(UiUtils.getPageHeader("Enter the number of keys to create for each currency.", UiUtils.getMixLogo()));
		
		// render num key inputs
		numKeysInputs = [];
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
			numKeysInput.attr("placeholder", 0);
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
					let numKeys = numKeysInputs[i].val();
					if (numKeys) {
						let numKeysInt = parseFloat(numKeys);
						validateNumKeys(state.plugins[i].getName(), numKeysInt);
						sum += numKeys;
						numKeysInts.push(numKeysInt);
					} else {
						numKeysInts.push(0);
					}

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
					let plugins = CryptoUtils.getCryptoPlugins();
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
	
	this.onShow = function() {
		numKeysInputs[0].focus();
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
		numKeysInput.keypress(function() { state.pageController.getPathTracker().clearNexts(); });
		
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
		passwordInput.keypress(function() { state.pageController.getPathTracker().clearNexts(); });
		
		// render advanced link
		let advancedLink = $("<div class='mock_link'>").appendTo(div);
		advancedLink.click(function() { toggleAdvanced(); });
		function toggleAdvanced() {
			advancedOpen = !advancedOpen;
			advancedLink.text(advancedOpen ? "\u25be Encryption options" : "\u25b8 Encryption options");
			advancedOpen ? advancedDiv.show() : advancedDiv.hide();
		}
		
		// render each encryption selection div
		let advancedDiv = $("<div>").appendTo(div);
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
		numPiecesInput.keypress(function() { state.pageController.getPathTracker().clearNexts(); });
		
		div.append("Number of pieces necessary to restore private keys: ");
		var minPiecesInput = $("<input type='number'>");
		minPiecesInput.attr("min", 2);
		minPiecesInput.attr("class", "num_input");
		minPiecesInput.attr("value", 2);
		div.append(minPiecesInput);
		div.append("<br><br>");
		minPiecesInput.keypress(function() { state.pageController.getPathTracker().clearNexts(); });
		
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
 * Summarize and generate keys, piece, and piece divs.
 * 
 * @param div is the div to render to
 * @param state contains the configuration to generate
 * @param onKeysGenerated(keys, pieces, pieceDivs) is invoked after generation
 */
function GenerateKeysController(div, state, onKeysGenerated) {
	DivController.call(this, div);
	
	let progressDiv;
	let progressBar;
	
	this.render = function(callback) {
		UiUtils.pageSetup(div);
		
		// render title
		div.append(UiUtils.getPageHeader("Ready to generate your " + UiUtils.getCryptoName(state) + " storage?", UiUtils.getCryptoLogo(state)));
		
		// render summary
		div.append("<b>Summary:</b><br><br>");
		for (let elem of state.mix) {
			div.append(elem.numKeys + " " + elem.plugin.getName() + " keys" + (elem.encryption ? " encrypted with " + elem.encryption : " unencrypted") + "<br>");
		}
		div.append("<br><br>");
		
		// render generate button
		var btnGenerate = UiUtils.getNextButton("Generate storage");
		btnGenerate.click(function() {
			btnGenerate.attr("disabled", "disabled");
			state.pageController.setNavigable(false);
			generateKeys(function(keys, pieces, pieceDivs) {
				btnGenerate.removeAttr("disabled");
				state.pageController.setNavigable(true);
				onKeysGenerated(keys, pieces, pieceDivs);
			});
		});
		div.append(btnGenerate);
		
		// add progress bar
		progressDiv = $("<div>").appendTo(div);
		progressDiv.hide();
		progressBar = UiUtils.getProgressBar(progressDiv.get(0));
		
		// done rendering
		callback(div);
	}
	
	function generateKeys(onKeysGenerated) {
		
		// load dependencies
		let dependencies = new Set(COMMON_DEPENDENCIES);
		for (let elem of state.mix) {
			for (let dependency of elem.plugin.getDependencies()) dependencies.add(dependency);
		}
		loader.load(Array.from(dependencies), function() {
			
			// compute total weight for progress bar
			let totalWeight = 0;
			let numKeys = 0;
			for (let elem of state.mix) {
				numKeys += elem.numKeys;
				totalWeight += elem.numKeys * Weights.getCreateKeyWeight();
				if (elem.encryption) totalWeight += elem.numKeys * (Weights.getEncryptWeight(elem.encryption) + Weights.getDecryptWeight(elem.encryption));
			}
			let piecesRendererWeight = CustomPieceRenderer.getWeight(numKeys, 1, null);
			totalWeight += piecesRendererWeight;
			
			// collect key creation functions
			let funcs = [];
			for (let elem of state.mix) {
				for (let i = 0; i < elem.numKeys; i++) {
					funcs.push(newKeyFunc(elem.plugin));
				}
			}
			
			// generate keys
			let progressWeight = 0;
			setProgress(progressWeight, totalWeight, "Creating keys");
			async.series(funcs, function(err, keys) {
				if (err) throw err;
				let originals = keys;
				
				// collect encryption functions
				funcs = [];
				let keyIdx = 0;
				let passwords = [];
				for (let elem of state.mix) {
					for (let i = 0; i < elem.numKeys; i++) {
						if (elem.encryption) {
							funcs.push(encryptFunc(originals[keyIdx].copy(), elem.encryption, elem.password));
							passwords.push(elem.password);
						}
						keyIdx++;
					}
				}
				
				// no encryption
				if (!funcs.length) {
					
					// convert keys to pieces
					let pieces = CryptoUtils.keysToPieces(originals);
					
					// validate pieces can recreate originals
					let keysFromPieces = CryptoUtils.piecesToKeys(pieces);
					assertEquals(originals.length, keysFromPieces.length);
					for (let i = 0; i < originals.length; i++) {
						assertTrue(originals[i].equals(keysFromPieces[i]));
					}
					
					// render pieces to divs
					setProgress(progressWeight, totalWeight, "Rendering");
					renderPieceDivs(pieces, function(err, pieceDivs) {
						if (err) throw err;
						assertEquals(pieces.length, pieceDivs.length);
						setProgress(1, 1, "Complete");
						onKeysGenerated(keys, pieces, pieceDivs);
					});
				}
				
				// handle encryption
				else {
					
					// encrypt keys
					setProgress(progressWeight, totalWeight, "Encrypting keys");
					async.series(funcs, function(err, encryptedKeys) {
						if (err) throw err;
						
						// convert keys to pieces
						let pieces = CryptoUtils.keysToPieces(encryptedKeys);
						
						// validate pieces can recreate originals
						let keysFromPieces = CryptoUtils.piecesToKeys(pieces);
						assertEquals(encryptedKeys.length, keysFromPieces.length);
						for (let i = 0; i < encryptedKeys.length; i++) {
							assertTrue(encryptedKeys[i].equals(keysFromPieces[i]));
						}
						
						// collect decryption functions
						funcs = [];
						for (let i = 0; i < encryptedKeys.length; i++) {
							funcs.push(decryptFunc(encryptedKeys[i].copy(), passwords[i]));
						}
						
						// decrypt keys
						setProgress(progressWeight, totalWeight, "Verifying encryption");
						async.series(funcs, function(err, decryptedKeys) {
							if (err) throw err;
							
							// verify equivalence
							assertEquals(originals.length, decryptedKeys.length);
							for (let i = 0; i < originals.length; i++) {
								assertTrue(originals[i].equals(decryptedKeys[i]));
							}
							
							// render pieces to divs
							setProgress(progressWeight, totalWeight, "Rendering");
							renderPieceDivs(pieces, function(err, pieceDivs) {
								if (err) throw err;
								assertEquals(pieces.length, pieceDivs.length);
								setProgress(1, 1, "Complete");
								onKeysGenerated(encryptedKeys, pieces, pieceDivs);
							})
						});
					});
				}
			});
			
			function setProgress(done, total, label) {
				//console.log("setProgress(" + label + ", " + done + ", " + total + " (" + Math.round(done / total * 100) + "%)");
				progressDiv.show();
				progressBar.set(done / total);
				if (label) progressBar.setText(label);
			}
			
			function newKeyFunc(plugin, callback) {
				return function(callback) {
					setTimeout(function() {
						let key = plugin.newKey();
						progressWeight += Weights.getCreateKeyWeight();
						setProgress(progressWeight, totalWeight);
						callback(null, key);
					}, 0);	// let UI breath
				}
			}
			
			function encryptFunc(key, scheme, password) {
				return function(callback) {
					key.encrypt(scheme, password, function(err, key) {
						progressWeight += Weights.getEncryptWeight(scheme);
						setProgress(progressWeight, totalWeight);
						setTimeout(function() { callback(err, key); }, 0);	// let UI breath
					});
				}
			}
			
			function decryptFunc(key, password) {
				return function(callback) {
					let scheme = key.getEncryptionScheme();
					key.decrypt(password, function(err, key) {
						progressWeight += Weights.getDecryptWeight(scheme);
						setProgress(progressWeight, totalWeight);
						setTimeout(function() { callback(err, key); }, 0);	// let UI breath
					});
				}
			}
			
			function renderPieceDivs(pieces, onDone) {
				CustomPieceRenderer.renderPieces(pieces, null, function(percent) {
					setProgress(progressWeight + (percent * piecesRendererWeight), totalWeight);
				}, onDone);
			}
		});
	}
}
inheritsFrom(GenerateKeysController, DivController);

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
			let dependencies = new Set(COMMON_DEPENDENCIES);
			for (let dependency of state.plugin.getDependencies()) dependencies.add(dependency);
			loader.load(Array.from(dependencies), function() {
				
				// only continue if new characters added
				let count = countNonWhitespaceCharacters(textarea.val());
				if (lastCount === count) return;
				lastCount = count;
				
				try {
					if (textarea.val() === "") {
						setErrorMessage("");
					} else {
						var key = CryptoUtils.parseKey(state.plugin, textarea.val());
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
 * Render page to decrypt keys.
 * 
 * @param div is the div to render to
 * @param state.keys are the keys to decrypt
 * @param onKeysDecrypted(keys, pieces, pieceDivs) when done
 */
function DecryptKeysController(div, state, onKeysDecrypted) {
	DivController.call(this, div);
	let keys = state.keys;
	let passwordInput;
	let progressDiv
	let progressBar;
	
	this.render = function(callback) {
		UiUtils.pageSetup(div);
		
		// render title
		var title = "Imported " + keys.length + " " + UiUtils.getCryptoName(state) + " keys which are password protected.  Enter the password to decrypt them.";
		div.append(UiUtils.getPageHeader(title, UiUtils.getCryptoLogo(state)));
		
		// add error div
		div.append(errorDiv);
		errorDiv.attr("class", "error_msg");
		errorDiv.hide();
		div.append(errorDiv);
		
		// add password input
		div.append("Password: ");
		passwordInput = $("<input type='text'>");
		passwordInput.attr("class", "text_input");

		div.append(passwordInput);
		div.append("<br><br>");
		
		// add decrypt button
		let btnDecrypt = UiUtils.getButton("Decrypt").appendTo(div);
		btnDecrypt.click(function() {
			setErrorMessage("");
			btnDecrypt.attr("disabled", "disabled");
			state.pageController.setNavigable(false);
			onDecrypt(function(err, pieces, pieceDivs) {
				state.pageController.setNavigable(true);
				if (err) {
					setErrorMessage(err.message);
					passwordInput.focus();
					btnDecrypt.removeAttr("disabled");
					progressDiv.hide();
				} else {
					onKeysDecrypted(keys, pieces, pieceDivs);
				}
			});
		});
		
		// add progress bar
		progressDiv = $("<div>").appendTo(div);
		progressDiv.hide();
		progressBar = UiUtils.getProgressBar(progressDiv.get(0));
		
		function onDecrypt(onDone) {
			
			// get passwords
			var password = passwordInput.val();
			if (password === "") {
				onDone(new Error("Password must not be blank"));
				return;
			}
			
			// compute total weight for progress bar
			let totalWeight = 0;
			for (let key of keys) {
				totalWeight += Weights.getDecryptWeight(key.getEncryptionScheme());
			}
			let piecesRendererWeight = CustomPieceRenderer.getWeight(keys.length, 1, null);
			totalWeight += piecesRendererWeight;
			
			// decrypt keys
			let funcs = [];
			for (let key of keys) funcs.push(decryptFunc(key, password));
			let progressWeight = 0;
			setProgress(progressWeight, totalWeight, "Decrypting");
			async.series(funcs, function(err, result) {
				state.pageController.setNavigable(true);
				if (err) onDone(err);
				else {
					// convert keys to a decrypted piece
					let pieces = CryptoUtils.keysToPieces(keys);
					assertEquals(1, pieces.length);
					
					// render piece
					setProgress(progressWeight, totalWeight, "Rendering");
					renderPieceDivs(pieces, function(err, pieceDivs) {
						if (err) onDone(err);
						assertEquals(pieces.length, pieceDivs.length);
						setProgress(1, 1, "Complete");
						onDone(null, pieces, pieceDivs);
					});
				}
			});
			
			function setProgress(done, total, label) {
				//console.log("setProgress(" + label + ", " + done + ", " + total + " (" + Math.round(done / total * 100) + "%)");
				progressBar.set(done / total);
				if (label) progressBar.setText(label);
				progressDiv.show();
			}
			
			function decryptFunc(key, password) {
				return function(callback) {
					let scheme = key.getEncryptionScheme();
					key.decrypt(password, function(err, key) {
						if (err) callback(err);
						else {
							progressWeight += Weights.getDecryptWeight(scheme);
							setProgress(progressWeight, totalWeight);
							setTimeout(function() { callback(err, key); }, 0);	// let UI breath
						}
					});
				}
			}
			
			function renderPieceDivs(pieces, onDone) {
				CustomPieceRenderer.renderPieces(pieces, null, function(percent) {
					setProgress(progressWeight + (percent * piecesRendererWeight), totalWeight);
				}, onDone);
			}
		}
		
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
		div.append(UiUtils.getPageHeader("Import zip or json files created from this site."));
		
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
		btnImportText.click(function() {
			removePieces();
			onSelectImportText();
		});
		
		// handle on files imported
		function onFilesImported(files) {
			for (let i = 0; i < files.length; i++) readFile(files[0]);
			function readFile(file) {
				var reader = new FileReader();
				reader.onload = function(event) {
					getNamedPiecesFromFile(file, reader.result, function(namedPieces) {
						if (namedPieces.length === 0) {
							if (file.type === "application/json") that.setErrorMessage("File '" + file.name + "' is not a valid JSON piece");
							else if (file.type === "application/zip") that.setErrorMessage("Zip '" + file.name + "' does not contain any valid JSON pieces");
							else throw new Error("Unrecognized file type: " + file.type);
						} else {
							addPieces(namedPieces);
						}
					});
				}
				if (file.type === 'application/json') reader.readAsText(file);
				else if (file.type === 'application/zip') reader.readAsArrayBuffer(file);
				else setErrorMessage("'" + file.name + "' is not a zip or json file.");
			}
		}
		
		// done rendering
		callback();
	};
	
	function setErrorMessage(str) {
		errorDiv.html(str);
		str === "" ? errorDiv.hide() : errorDiv.show();
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
	
	function addPieces(namedPieces) {
		for (let namedPiece of namedPieces) {
			if (!isPieceImported(namedPiece.name)) importedPieces.push(namedPiece);
		}
		updatePieces();
	}
	
	function removePieces() {
		importedPieces = [];
		lastKeys = undefined;
		updatePieces();
	}
	
	function removePiece(name) {
		for (let i = 0; i < importedPieces.length; i++) {
			if (importedPieces[i].name === name) {
				if (confirm("Are you sure you want to remove " + name + "?")) {
					importedPieces.splice(i, 1);
					updatePieces();
				}
				return;
			}
		}
		throw new Error("No piece with name '" + name + "' imported");
	}
	
	function isPieceImported(name) {
		for (let importedPiece of importedPieces) {
			if (importedPiece.name === name) return true;
		}
		return false;
	}
	
	function updatePieces() {
		
		// update UI
		renderImportedPieces(importedPieces);
		
		// collect all pieces
		let pieces = [];
		for (let importedPiece of importedPieces) pieces.push(importedPiece.piece);
		if (!pieces.length) return;
		
		// collect cryptos being imported
		let cryptos = new Set();
		for (let elem of pieces[0]) cryptos.add(elem.crypto);
		
		// collect dependencies
		let dependencies = new Set(COMMON_DEPENDENCIES);
		for (let crypto of cryptos) {
			let plugin = CryptoUtils.getCryptoPlugin(crypto);
			for (let dependency of plugin.getDependencies()) dependencies.add(dependency);
		}
		
		// load dependencies
		loader.load(Array.from(dependencies), function() {
			
			// create keys
			try {
				let keys = CryptoUtils.piecesToKeys(pieces);
				setErrorMessage("");
				if (keysDifferent(lastKeys, keys) && keys.length) onKeysImported(keys);
				lastKeys = keys;
			} catch (err) {
				setErrorMessage(err.message);
			}
		})
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
	
	function keysDifferent(keys1, keys2) {
		if (!keys1 && keys2) return true;
		if (keys1 && !keys2) return true;
		if (keys1.length !== keys2.length) return true;
		for (let i = 0; i < keys1.length; i++) {
			if (!keys1[i].equals(keys2[i])) return true;
		}
		return false;
	}
	
	let that = this;
	let errorDiv = $("<div>");
	errorDiv.attr("class", "error_msg");
	let fileList = $("<div>");
	let importedPieces = [];	// [{name: 'btc.json', value: {...}}, ...]
	let lastKeys;				// tracks last imported keys so page only advances if keys change
	setErrorMessage("");
}
inheritsFrom(ImportFilesController, DivController);

/**
 * Page to view and save pieces.
 * 
 * @param div is the div to render to
 * @param state is the current application state to render
 */
function SaveController(div, state) {
	DivController.call(this, div);
	assertTrue(state.keys.length > 0);
	
	// config elements
	let includePublicCheckbox;
	let splitCheckbox;
	let numPiecesInput;
	let minPiecesInput;
	
	// save links
	let printLink;
	let downloadLink;
	
	// storage preview
	let progressDiv;
	let progressBar;
	let previewDiv;
	let currentPieceDiv;
	
	/**
	 * Main render function.
	 */
	this.render = function(onDone) {
		UiUtils.pageSetup(div);
		
		// center page contents
		div.attr("style", "display:flex; flex-direction:column; align-items:center;");
		
		// add title
		div.append(UiUtils.getPageHeader("Your storage is ready to download.", UiUtils.getCryptoLogo(state)));
		
		// add save header
		let exportHeader = $("<div class='export_header'>").appendTo(div);
		let exportHeaderLeft = $("<div class='export_header_left'>").appendTo(exportHeader);
		let exportHeaderRight = $("<div class='export_header_right'>").appendTo(exportHeader);
		
		// add config link (closed by default)
		let configLink = $("<div class='mock_link'>").appendTo(exportHeaderLeft);
		let configDiv = $("<div>").appendTo(div);
		let configOpen = true;
		toggleConfig();
		configLink.click(function() { toggleConfig(); });
		function toggleConfig() {
			configOpen = !configOpen;
			configLink.text(configOpen ? "\u25be Download options" : "\u25b8 Download options");
			configOpen ? configDiv.show() : configDiv.hide();
		}
		
		// add print and download links
		printLink = UiUtils.getLink("#", "Print").appendTo(exportHeaderRight);
		exportHeaderRight.append("&nbsp;&nbsp;|&nbsp;&nbsp;");
		downloadLink = UiUtils.getLink("#", "Download").appendTo(exportHeaderRight);

		// add config div
		renderConfig(configDiv);
		
		// add preview div
		div.append("<br>");
		previewDiv = $("<div class='preview_div'>").appendTo(div);
		updatePieces(state.pieces, state.pieceDivs, function(err) {
			if (err) throw err;
			if (onDone) onDone(div);
		});
	}
	
	function getIncludePublicAddresses() {
		return includePublicCheckbox.prop('checked');
	}
	
	function getIsSplit() {
		return splitCheckbox.prop('checked');
	}
	
	function getNumPieces() {
		return parseFloat(numPiecesInput.val());
	}
	
	function getMinPieces() {
		return parseFloat(minPiecesInput.val());
	}
	
	/**
	 * Updates pieces for the entire save page.
	 * 
	 * @param pieces are pre-existing pieces to set (optional)
	 * @param pieceDivs are pre-existing piece divs to set (optional)
	 * @param onDone(err, pieces, pieceDivs) is invoked when done
	 */
	function updatePieces(pieces, pieceDivs, onDone) {
		
		// disable print and download links
		printLink.off('click');
		printLink.attr("disabled", "disabled");
		downloadLink.off('click');
		downloadLink.attr("disabled", "disabled");
		
		// handle pieces already set
		if (pieces && pieceDivs) {
			setPieces(pieces, pieceDivs);
			if (onDone) onDone(null, pieces, pieceDivs);
			return;
		}
		
		// empty preview
		previewDiv.empty();
		
		// add progress bar
		progressDiv = $("<div>").appendTo(previewDiv);
		progressDiv.hide();
		progressBar = UiUtils.getProgressBar(progressDiv.get(0));
		
		// read configuration
		let numPieces = getIsSplit() ? getNumPieces() : 1;
		let minPieces = getIsSplit() ? getMinPieces() : null;
		pieces = pieces ? pieces : CryptoUtils.keysToPieces(state.keys, numPieces, minPieces);
		
		// render
		CustomPieceRenderer.renderPieces(pieces, null, function(percent) {
			setProgress(percent);
		}, function(err, pieceDivs) {
			if (err) {
				if (onDone) onDone(err);
			} else {
				setPieces(pieces, pieceDivs);
				if (onDone) onDone(null, pieces, pieceDivs);
			}
		});
	
		function setProgress(percent, label) {
			progressDiv.show();
			progressBar.set(percent);
			if (label) progressBar.setText(label);
		}
		
		function setPieces(pieces, pieceDivs) {
			assertTrue(pieces.length > 0);
			assertTrue(pieceDivs.length > 0);
			
			// empty existing preview
			previewDiv.empty();
			
			// add header div
			let previewHeader = $("<div class='preview_header'>").appendTo(previewDiv);
			let previewHeaderLeft = $("<div class='preview_header_left'>").appendTo(previewHeader);
			let previewHeaderCenter = $("<div class='preview_header_center'>").appendTo(previewHeader);
			previewHeaderCenter.append("Preview");
			let previewHeaderRight = $("<div class='preview_header_right'>").appendTo(previewHeader);
			
			// add piece pull-down selector
			if (pieceDivs.length > 1) {
				let selector = $("<select class='piece_selector'>").appendTo(previewHeaderRight);
				selector.change(function() {
					currentPieceDiv.empty();
					currentPieceDiv.append(pieceDivs[parseFloat(selector.find(":selected").val())]);
				});
				for (let i = 0; i < pieceDivs.length; i++) {
					let option = $("<option value='" + i + "'>").appendTo(selector);
					option.html("Piece " + (i + 1));
				}
			}
			
			// build embedded logo css rules
			let cryptos = new Set();
			for (let elem of pieces[0]) cryptos.add(elem.crypto);
			let logoCssRules = [];
			cryptos.forEach(function(crypto) {
				logoCssRules.push(getEmbeddedImgCss("key_div_logo_" + crypto.toLowerCase(), CryptoUtils.getCryptoPlugin(crypto).getLogo()));
			});
			
			//let btc_rule = ".key_div_logo_btc { background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQCAYAAACAvzbMAAAgAElEQVR4nOy9eXgc1ZWw31kgC5PJJJMv82X5ZrLwC5MxWEtrX1u7ZFuytbCEbDMkIZCErJCEJBMEISGExODepFYvUreWbtkYbAzY2HhlNwbv2MY2tjEY75bUdW91d5Xq/P6olm3AliV1l05V93mf531meXisW+feOqdv3bq3TCaCSBFO9TX8Mws2fX6kt+kq1j/PLITaasVQ8zd5qPVnLNR6rxhq6+Sh1hAfbFsqDrYtF0Ota3io9Tk+2LZJDLXuEAfb9vJQ65t8sPUYH2w7xQfbjvPB1iN8sPWwGGo9IA627RVDrbvEUOsOHmrdwgfbNvHBtufFwbblfLB1UBxs7eKDrQ+Igy13smDrLTzYcr0Qaqvl/fPywn1z/0sYaPq3TS7zZdhxIgiCSDuOBmqv4H0tX+QDzYV8oPU6Hmr9JQ+12sRQ65M81LpFDLUe4KG2E+Jga0QcbANdGWqL8VDbUXGwbScfbFvHB1t7Waj1XhZsvYWF2uayUEsu98/5whFX48ex40wQBGFYTruqPxkONV/NQ20tbLDlHh5q7eeh1g3xWUBYHGxV0AtC8pXFwdYRcbDtDTHUuoIPttpZqOVH4kBz+VB/61f2Whs+gt0vBEEQumGTy3wZ6235XDjYZmGhlh/ywVY7D7Wu56HWg2KobVQHSV0vhuOPzlbwwdYHWLDle3ywpXiof/ansPuQIAhiWjgaqL1C6J+XyYKtPxBDbT4+2LZZDLUN6yBBG9L4I7GVPNR2PxtsnTcSav7awmtNH8LuZ4IgiIQZ8Tf/a3iwpYKHWu/godZHxcG2vdhJN8XlYqh1Bx9s7eWh1p/wwZbi067qT2KPA4IgiEtywtv0CXGguUQcbLlLHGxbyQfbjusgqaa1PNT2Ng+1Luah1p+EQ81Xr223fBh7nBAEQZhMJpNpqL/1K2Ko+Tt8sLVXDLXux06Y5LjK6ivIbQ4eamvh/jlfwB4/BEGkESe8TZ8QB1vK2GDLPXyw7RlxsJXpIDGSU5APtp4RQ62rxGDb//JQSwHtUSEIIukcnl/4MWGguYaHWhxisGW/GGoFMhVt2c6DrX8VB5pLdrbPuBx73BEEYVAOzy/8WHiguZIHWxeIwZY9+MmNnGa38VDL/eJAcwntQSEI4pJscpkvEweay3mwdT4VDfKswZbXeLD1AbG/pYwW4QmCeBfDvU1XigMtd/Jg61b0ZEXqWh5qeYUHm28/E5z3JexxSxAEEkcDtVfwYEszD7YuFkOtYezERBrMYOswD7YOsoHWxsPzCz+GPZ4JgpgGwoHmq9lA8730iIpMmsGW19hA893hvrn/hT2+CYJIMofnF36MB1uuF4Mty8VQSwQ94ZCpabBVFEMtT/CBedcd6LZ8FHvcEwSRAOFA82d5qPVnYqhlO3pyIdPMlu081PqzcKD5s9j3AUEQkyAcav46D7Y+wEOt7+AnEjKd5aHWd3io5e/hUPPXse8LgiDGgQfnFvFgS0AMtgrYiYMk320L48HWXnGguQT7PiEI4jxYaF5DfH1DwU8UJDmeLYoYalnBgi1N2PcNQaQ1auFoXi2GWoAkjSYPNm9goea52PcRQaQVQv/cajHUsgI7AZBkUgw2r2aheQ3Y9xVBpDRCcF6VGGxejn7Dk6Q2rhL659Zh32cEkVKIwbmlPNi8VAc3OElOh0+E+5sqsO87gjA0I71NV/Fgc68ObmiSnHZ5qOVRFmzKwr4PCcJQjAw0fkY9bqR5GPsmJklcmxkfaP4H6235HPZ9SRC6Zm275cMs2HyTGGzZKwZbgCRJVR5sOcSCzT+mb5MQxAUQBppr+EDzM9g3KknqWT7Q/BLroze2CMJkMplMI/7mr/GB5iD2jUmSRpIPNC8KB5qvxr5/CQKFte2WD/Pg3F/wgXlnxGAzkCQ5acNicN5d9D0SIq3gfY0FPDhvgw5uQJI0vHxg3iZ67ZdIeU67qj/JBub9RRxoFrFvOpJMLedJfGDeQyP+5n/Fvs8JIumwYNNscaB5B/6NRpIp7MC83ayfztciUgTWW/c5caDZh35jkWQayYPzAtw39/9h3/8EMWVYX/MccaB5P/bNRJLpKB9oPswH5n0DOw8QxKQ44W36BO9vni8G5ynYNxFJpr0Dze5hT92nsfMCQVwS3tdYwAfmbRKD84AkSZ04MHeH2N9Uhp0fCOJifIAPzPu1GJzH0W8WkiQv4NyIONB0Z3u76YPYyYIgzjLin/U1MTjvSfwbhCTJSzowd/lw/5z/DztvEISJ9829ngfnHUe/KUiSnLB8YN4xsb/pm9j5g0hT1rZbPswH5t6HfSOQJDl1+cBc6872GZdj5xMijeB9DV8UB+Yuxx78JEkmwYG5a8T+Wf+BnVeINCDcO88iDszbjz7oSZJMmnxg3sHwQGMldn4hUhgenPtTMTg3gj3YSZLUxCgPzv0pdp4hUowT3qZPiP1zfeLAPCBJMsXtn+s+4mr8OHbeIVKAof7ZX+EDTS+KA3OBJMn0kPfPfX7EP+tr2PmHMDC8d3YR7286hD2YSZKcfvlA09vh3jkW7DxEGBDeN+d6sb9pBHsQkySJKue9jXQgIzFxeH/j7WL/3FEdDF6SJNFtUnh/4+3YeYnQOZtc5sv4wFwr/oAlSVJv8oGmBxdea/oQdp4idMhQ/+xP8f6mJdiDlCRJ/cr754aOBmqvwM5XhI4QA43/zvubNmIPTpIk9S8fmLuB++d8ATtvETpgxD/ra+LA3NewByVJkgayv2lXODD769j5i0BE8DfNFPsb94sDTUCSJDlJDwi9czKw8xiBAO+fk8f7m47oYBCSJGlQeX/TERaYlYOdz4hpJBxorOT9jSewBx9JksaX9zcdEwcaS7DzGjENsP45s8SBpiHsQUeSZOrIBxpPhQN0mm9Kw/ubrhX7G0XswUaSZAra3zTCemfPxs5zhAbw3sbrxIGmKPogI0kyde1vFHjfnGbsfEckEdbfOFccaIygDy6SJNPBKBtonIed94gkIPQ21Yv9jYIOBhVJkuljWOhtqsHOf0QChAONlWJf47DY3wQkSZLTKe9vPM37moqx8yAxBXhfUzHvbzyNPYhIkkxfeV/TMaF/ViZ2PiQmAffPyeP9jcexBw9JkiTvazxEx54YBMHfNJP3Nb6DPWhIkiTP2fj6UKDxy9j5kRiHM931XxL7Gt/AHywkSZLvsa9pG+ut+xx2niQuwJluy7/wvsaN6IOEJEnyIvK+xmdPeIs/gZ0vifPY2T7jct7f+Bj24CBJkryUvK9xsL3d9EHsvEnEEfsaO7EHBWlAe2eDGKgHsW8OflvItJL3Nf0NO28SJpNJ7J/zB+zBQBrQvtkgLv42RJ74MYjBZhD9NSD2VJ9XUBrx20imtKyv8UfY+TOtEfpn/bd6o5PkJO2pBulVL8CoBMrQQZD3PwWx5/8OkcdvAXFg7nsKymz89pKpZ19jjPXNmoOdR9MSoa+xVuxvjKIPAtKYBupAfnsjvI9RGZThQ2pBeWG+WlCC86igkJrI++ecYv6GLOx8mlaEA7O/zvvnnMDufNKg9s6CyKLrQeEn319A3ldQYqAMHQL5jZXxgnIrFRQyyc55nfvnfAE7r6YFJ7zFn+D9ja/idzppWP21EF15+6WLx4VQZFCG34wXlAch8viP3rOGUkcFhZy0vG/OhsPzCz+GnV9THt4/pw+7s0mD210F0mbv1ArI+2YoUrygrFILyhM/AjHUCmL/HNxrJA0n75vtwM6vKQ3vnXMHdieTRncOiIF6kN96MTkF5L0ooyBtDYDor9bBtZJGk/XP/h52nk1JhMDsOrGvMYbdwaTB7W0AcdF1APyUNgUEAGLP3q8+zsK+VtJ49s0RWF9jLna+TSmG+md/hfc1HkHvXNL4+mshuvIOzYoHSCJEltykLq5jXytpTPsad4+4LJ/BzrspweH5hR/jfbOfFfvmAEkmbHcVSK96NKsfyqnXQeybHTeRts5WZzH+WnXWlPC/RxpJ3jvnUezcmxKIvbNd2J1JppD+WpDfekmzAiLvXgpid3WC7ZwNYn8TxNb/CSJP3qa+5dVTrf67/loQe2fhx5HU3sCsP2DnX0Mj9s75DnonkqljoAEiC6+b2P6PKRLbcF/iBcRfD5FHvgswKsdfG34L5AOrIfbiAog8/mN1H0pPNYjdVTRDSW1l1jt7NnYeNiQj/llf432zT+mgE8lUsacGoit+pVnxADmirn/46xJsZzXE1t19kT+igDJyGOQDayD2khUiT/zkvBlKFc1QUkzeO/sI72v4InY+NhSbXObLxN7Za7E7j0wxfZXTsP4xJ/EE3l0F8muLJ/hHZVBG3gb5wNr3FJQamqGkiLQeMknE3ll3YXcamWrOBtFfp93+DwCQ9zymJu1E2tk7C8Te2aCceG3K7VBG3gL54FqQXrLH11Ba3l1QqJgYTtY3m07unQhioKFc7JsTxe4wMsUM1IM4eK22+z82/CXx9Y9APUQe+Q5AjCenUcooKOEjIB9cB7GX7OoMpb9J/RYKdp+QkzEcDsy+Gjs/65phT92nxd7Ze3TQWWSq2VMN0aemeP7VRBjb/5GU9Y97NGumIp6GyKIbzn33hDSMvG/O83utDR/BztO6hfXO7jn3Dj1JJtHuSpBecWuXmE/vBbFvVtxE2lkF8muLNGvn6NHN5w58JA0nCzTci52ndYkYmPVt7M4hU1h/jbb7P86ufyTSzlkg9jYktP5xKaQtARC7K/H7g5yqcri33oKdr3UF72v4Iu+ddUwHnUOmooF6iCxsA4Wd0Cwxx565L/HE7K+Lr38ImrUz+vSd6iu/2H1CTt3eWXuGnLM/hZ23dQPvmxVC7xQyde2phuiKX2qWlM/t/6hNuJ2xde3atTMyDOLZ9Q8d9As5ZXnvLDr63WQymXhffTN2Z5Aprq9imvZ/NCTcTnnnw5q1U37nFbV49Ca4TkPqwFmSGGgox87fqIz4q/5V7Jt1AL8zyNR1lnr+1eEXtEvMex5L/PFVbwOIvQ0wenyHZu2UtvbS+kcKyftmbT7Qbfkodh5HQ+yd7cTuBDLFDdSDONgGoOX5V8/8JfEF9EA9RB75NkCMadbO6NO/pfWPVDNdD1wMBxoqxb5ZCnoHkBMcqPXxZ+cGe/zRUw3RpzQ8/+rs/o9E1z+qxjn/KnGUyBBEHv4GrX+kmr2zhHCgNr02GB4N1F4h9s7afu69eVLX9tZDZPG3ILL4myD6a0DsrgCxpyq+n6ABv33j2V0xTfs/EoxDdyXIOxdq1k756OZ4kdNBn5DJdpXJZPoAdl6fNlig4V4dBJ2ciL0NIPZUg/zms6CIp0E+sgmkzT6Irfo1iAuvU5OSr0J9NBKoiy8k66DdY/qrp+H8q8rEYxyoB+XETs3aKW0NqP2E3R+kJrJAww+w8/q0EA7UXi0GGkT10DhS9/rrQQy2AlxoD4V4GuS3N4K0uQdiK38NkYXXq4f2+SriB/fVgRhoQG17JNSq7f6PDfep15tIO3tqIbL4W9rv/+iuxB9PpCbyQMMx7q/8AnZ+1xweaHgMO9jkJOyphsjynwOAcskkpfBT8RlKN8RW/ea8GYol/jW9+AxlutreXQ2RFT/XLCmDHFXXP3pqEmxnFcTW/FG7dkaGQVx4Qzz+OhhTpDb6G3zY+V1TWKB+FnqQycnpqwDp5c6pJS7xjDpD2eLHmaH4LNOw/jH73N6Kqeq1aLv+8c4r+LNBchpskHh3QwF2nteEvdaGj/DeWZvxg0xOyu5qkN98LimJTOGnQH7nlfgM5bcgLrxeTWyazFAaQOypAfnw80lp+4WQ9zwGoi/Bx0Lxt9tGj2/XrJ3Stj4QvQk+ZiMNYsPa9nbTB7HzfdLhvQ0/4b2zgDSQ/noQQ62gCMe0yWziGZDffhliW/wQXfVrEBfeALynBrivAnh3FXB/HfBAwxTbXgc81ArAtNv/Ed3wF+C+ygRjXAfi4m9qvv7Bu6vxxxM5LYb9Dddj5/ukIrir/o0FZr2DHVhyknZXg/jkbTCR9Y9koIin1RnKlh6Irvot8IXXA/fXqgWlpxp4oH5SbY+s+CWAolHb5QiIS25SC15CMa6E6Frt1j+UyBCIi76hxhF7PJHTY6Bhz3GH5Z+w837SEHobHuK9DUAaTK8FYps6NEtulyQyBPJbL0Ds+X+A+PitwIPz1JmJzxKfodTGi8oF2u6zQGxTl2ZNU07vi/+ti/z9ieqzgLQjpFk75aOb40VOB+OJnDaFQP2d2Hk/KQj++pk8UC9iB5ScrPXAu6tAfvMZzZLbZFFG3gb5zWcgtskF0ad+CXywTS0iXgvw7krg/ho4m9B7qjU9/0ra85g6M0o0xv5aTc+/im3tVQsu+ngip1MWqD91ylf7/7Dzf8KwQP1j2MEkp6C/DniwWbv1jySgxPehxLb1qfscFn8TeKAOuKcMeH+j5t//SDgx+2vU9Y9oWLN2qusfiRY60oiyQEMXdv5PiHB3vQU7iOQU7amCyPKfareGoAFKdASUE6+BtCMEsc3dGq5/REFc8j/qukwiMe6uhOiaP2jTRgCA6DCIi+LrSNjjiZx+A/Ux5qvLxq4DU4YFGlaiB5Gcmj4LxDY6tUtuBkY5vRd436yLr79MVK8FpB2DmrVTPvrq+OtEZMrLeusXYdeBKSH01tZgB49MQJ2tf+gJdf0jwcdXgXrggXqQj23Trp3b+tT1IeyxRGIqc39dHnY9mCwf4L31a3UQPHIqBupADDaDIhzVLLkZmegz9yW+gO6vBfHhG6dh/0cl/ngiUWW99Y9gF4RJwQL1s7CDRiZgz/Tu/zAUMQZ80TfUX/aJPBrqroDomv/VrJlKZPi8/R86GFMkpvKIv74Quy5MlA/wQP0z6uuUpCH1WiD2skOz5GZooiMQe/4BEB/7HvD+OeobTr6x14hrJx5jnwWk7UHNmikf3QLcX40/lkhdyAL1j2EXhgnBeuqbsINFJmhPJciH1muW3FICRQZl+BDIB56G2EtWEJ+8DXioWX0zy1f+nn0pF9Bfo+n5V7FtY/s/dDCeSB1Yp4wEqkuw68O4rG23fJj11r+AHyxyyvprgQfn0vrHZFEUUNhxkA8/B7HNXoiuvCP+Cm21msh9FvV/D9QB91eDuPhGbfd/rB7b/6GDMUXqQhaofwK7RowL99c0j71dQhrU7koQn/iJofZ/6BVFPA3ysa0gbRuA6Nq7QHzkW8B7G4C7CiG66jfa/eHoCIgLr1ePMMEeT6SOrFPCgZpy7DpxUbi/fh1+kMiE9Fog9pJdu+SWzkgclJO7Qdq5SNvP7B7dDLynFrhfB+OJ1JXMX7cUu05ckJGemmIeqFOwA0QmqI/WP4yOtK0fuKccfyyRejQq+KtmYteL98ED9UEdBIdMRH8diAPzQAm/g50DiQSIrvqtuk8FezyRupT5azux68W7GPHWX8UD9Rw7MGSCdlfF938QRkWJjIC46AZa/yAvKgvUDXG35YvYdeMsQqB+PnZQyCTorwVx4XUQe+FBkPavAOXMAQA5ip0TiUkgH9ty7uNbJHkRmb/2Luy6YTKZTKZwR+1nmb/+OHZAyCTprwHuLT971pO45H8guv5PIO16VN23oOHRG0TixLb2qv2HPY5IfeuvO3TaVf1J7PphEgJ1v0IPBqnRIKtVv/zntcSTUh2Ii74B0dW/B2lbH8jHtoISGcLOmcR5RJ/+LXBXgdpvgTr8MUTqVhao+wFq8TjiMn+c++texw4EOU36a9XHI2MFpacaxEU3QHTVbyC2fQCUk7sARiXsHJrWKKdeh9hGp/pxLV+F2ld+Wg8h3y/z123e5DJfhlZAwt21N2AHgcS0Ln50h+XsYxPxse+D9Ipb/UwrFRM8YgLIB9dBdM0fgPc3qv3TXal+aRJ93JB6kflr56AVEOavW4UdAFJH+mvVJOUpUz/X+tjNIO1fAaCMYqfTtEYZeRuk7QMgLvthfAZZTgvtJPBAPTB/3RKU4hH2Vf0XD9RHsQNA6lR/nfoIxWcB8cnbQDm5GzuPEooM8juvQOy5v4EYagXuLYuvlehgvJBI92k9G/JVf2XaCwjz1/0Z/eJJA1in/uLtb6Id7jpC4SfVWcmj31XXSXwVQIvu6Snz1/1uWovH4fmFH+P+un3qgCPJS1l/9nsZ8pGXsXMncT4SB2nfcog8+RO1j3yWc32GPm7I6ZAF6nbubJ9x+bQVENZT04R90aQB7a4AceG1oAjHsdMm8V6UUZAPbVC/azJ2/Dz2eCGnTaGnpnb6Coi/bjH2BZMG1VMKsZcWYKdLYhykg2sh8sSP4l9arMAfM6T2+usGpqV4nOm2fIkHasPoF0wa055q9YNV7Bh2niTGY1QGaf9TID76HeDe0vhbWzoYP6QmskDd8LScjyV0197B/XVAklPWWw7SvhXYKZKYAEp0BGKbfSD2N8Vfz65Vkw72GCKTb0/tLzQtHptc5stYT91W9Aslja2nDGLP/x07NxKTQBk+DNF198Rfza7EH0Nk0mU9da8svNb0Ic0KyEhPTTH31yrYF0oaXK8Fok/9CjsnElNAfuNp9XO5ntL4Vw91MJ7I5NhTN8q8NTmaFRDur/0b+kWSxtdbAeKyW7BzITFFFHYSYhvuBe6tUDciYo8nMmmyntp7NSkee61XfoT5a1/DvkAyBfRaqICkANK+J4H3NcYPbNTBuCITlvXUbtPkgMURb1Uh99co3F8LJJmQ3jKIrmvHzn9EElBO7gZxyU3A3aXA/TX4Y4tM0BqF+2rzk15AeE/N/fgXR6aEnlKQdj2KnfvGRT3qIwjy0S2giKexm6NvIkMQXXd3fF2kGn98kYl6X1KLx872GZezntodOrgw0uj2VAP314FySt+HK8oHVsc/zFQJ4mAbRFb8AmKvuEE+9AwowlE6YfgCxF7uOHfSL/Y4I6cs66ndkdSjTXh3dQHvqR3FvjAyBfRVgLj4WwByBDvfjUvsxYfOPZYZ+yqju1Tdnd3fCOKyWyD2/D9A2rcclDNv0Lfj40hb+9RYdVMRMa41yoivsih5BcRfex/+RZEpoacUYuvuxs5z46OMgrjslvji8HuvoebcR7Q8pec+pPXIdyG67i6Qdj0Cyun9AIqMfRVoSLuXqgWEiohx7al9ICnFY2f7jMuZv2Y7+gWRqaGnFKRdj2DnuHFRwkeA982Z+KOYnmp1g52nTC0qgXoQH7sZYi93gPz2xrT8bry06xG1ANPjLGPaU7vrQLflowkXEO6vzKO3r8jkWAPcXwPKyT3Y+W1cpANrzn1LfCrXOTZDcZeqj+wWXg+xtX8E+fVloAy/iX1504b0qlctqj30dpbxrFGSsqmQ9dT+Af9iyJRwbP1D4ti5bVxiLy5QZxJJue6ac5/59ZQC75sN0ZW3g7TnMVDYCexL1ZzY839PYizJ6VTw1/wmCTOQmtVjvxxJMiE9pfrf/6GMqt8OPzsDSbI9VeqnZD2lIAbnQWz93epHthQF+8q1YTQGkSdvixcRHYxBcsIyf/WqxGYfrtLPsZ7qIewLIVNETylIuxZjp7RxUcJHgPfPURO91vHorlQTa3cFiI/fos5KIsPYIUg6ytAh9TTf7gr8MUhOWNZTPcRcpZ+b+uyju7oF+yLIFLGnGri/BpSTu7Dz2bjIB9eqM4Tpjo23XJ2VLLoepK2BlFt4l/evUK/RX40/FsnJjM3Wqc9A/NUO9AsgU0OfBfjiGwEkETuXjUvsxQXA3SWIcaqIF5IbQNq5CCDGsEOSNM7uVscei+SEZd01nVMqHuq3P2p2YF8AmSIaZf3j8Vviv5SR4xV/i0t85NsgH1yHHZmkoAwfBt43O36Crw7GJHlpe2p27bVe+ZFJF5Cwx3I1766O8Z4aIMmEdZeCtPNh7Bw2Lkr4HXX/R3cVfrzG9JYD91ogtuEvAPwUdogSJrapC3hXCX5cyYkqM19l9qQLCO+uvk0HjSdTwmrgPdWgnNT3+VfSgTXAPfGznNBjdp7d1cC7SkAcvNbwsxElMqR+kMpbgR9XckIK3dV3TLqAsO7qR7EbTqaI3goQH77RAPs/rOrmP+x4XTSOFuC+SpC29mOHKiGkzT00CzGQrKd62aSKx2lX9SdZd9U7Y78cSTIh3aUQXftH7Lw1PmP7P87OQPRojfo9cncpxJ77m2EPcFTCR4D3zlZfY0aPKXkpWU/V4eMOyz9NuICM9FQU854qBbvhZIroLgbpNSOsfxgoqbmKILrmD4Y9tDG6rl192w07juSl7a4e5Z7KvAkXEHX9QwcNJ41vdxXwnmpQTryGnbPGRT647twHkYxiVxHEXpiPHbopIb+98dxhi6TuZd1VP5pMAenHbjCZInotwB/+hjH2f3QV48drMnZXq2+3bR/ADt/kiQkgLryOiohR7K7qm1Dx2OQyX8a6q3aiN5hMDd0lEF17F3a6Gh9FUb//4SnDj9dk9VUC91WA/PZG7ChOmuiaP8RfWtBBHMlxZT3Vr03oK4XDHsuVvKeKYzeYTBHdJeqOaj1jtPWP9+otA/HR7wLEBOxITgpp1yO0DmIUu6sjI96Kqybw+KqiBb2xZOrYXQXKCQOcf2XE2cf5dhWBtD2EHcpJoZx+Hbi/9uw6Galvhe7qGydQQKr+ht1QMkX0WtT9Hzo/zyn2kjW+L0EHMUsg1nzRDQDRMHY4J05MAHGwTT22BTt+5CVl3VX2iRSQ1dgNJVNEd4n6qqmeObv/w+AzkHi85f1PYUd04iijIC67WT39GDt25ASser693fTBixaPIWfJp1hP9TH8hpIpobtI9+sf5/Z/VODHK+F4l0B09Z3YIZ0U0TW/B+422NtvaSrrqTo57Cn89EULyIi3uoQ2EJJJsbsSeE8VKCd2YueocZEPGXD/x8X0WUBc2AYQHcEO64SJbbQD7yrCjx15aS+1oZD5Kr+P3kgyNfSWq8/kdX/+1YIUSmBVwH0Vut+0eT7Stj56E8tACt2V3x5v/eMf2A0kU0R3MRzo7QoAACAASURBVETX/C92fhofRVG//5EqM5CeauCeUpAPrMGO7ISRtgepgBjJ7uq/XnwG0l21HL2BZGroLgZpx0Ls/DQ+wtHUWf84G/cSkHbqPO7nIe1cSAXEQLKeqicvWDwOtFs+yrur9vDuaiDJxKwC7qvU/aMU+eA6dSd0d5UOYpYku0oMdbSJ9NrieB/oIHbkpfVVv354fuHH3v8Glrvsy9xXFUZvIGl8PRYQF91ggP0fNuCuIvx4JdOuEpC2B7FDO2GkXY9SATGSvmo25Kr86vsKSNhXUa7+EiPJBO0qhujq32HnpvFRFHX/x9kZSIroLgVp7xPY0Z0w0ha/eogldtzICSt4K2sv9AbWrdgNI1NEVxFIOwaxc9O4KMJR9aNGPgt+vJKppxTkt1/CDu+Eib0wPz4L1EHsyAkp+Cpvv8ACeqUVu2FkCuirAO6rhNHjO7Bz07jIh9an3uzDZwEeqAdl+E3s8E6Y6No/qq9RY8eOnLDMV+m+wAykagV2w8gU0FMG4sLrAGJ63/9hTb1fvp4yEBd/01Cfuo0s/5n6FhZ27MgJy7qrll/gDazKfdgNI1PAriKIrv49dl4aH0UBcdmtqTcD6SqG6Lq7saM7cUZjID7yHfUcMuzYkROWdVfueNe3QZi3+PPcVxnGbhiZAhrgWHFFOJaC6x+VwLuKQd63Aju8E0Zhx9V9OCnVD6kv6648PeKyfOb8BfRs3l0lYzeMNLqV8aM0dH7+1dj+D1+lDmKWJL0W4P2NoLAT2OGdMPI7r5xdM0OPHzlxfZWS4K6aeV4BscxBbxRpfD1lIC683kD7P3QQs2TpKoLYs3/FDu2kkHYvTb1+SBOZp2L2eQWk4mbeXQkkmZDuYoiuvANgVMbOTRfn7P6PEvx4JUufBXhPFYye3IMd3UkRfe7++BtYOoghOSmZ13LL+TOQP2E3iEwBu4pAetWjfptbp28CKcJR4H2z4s/ddRCzZOgqgNhz92OHdnKMSiAu+R/1IEvs+JGT11f51/NnID3oDSKNrc8C3Gc5b/+HgpqfLoZ8aENqzT7cpSAOtoHCT2KHdlIow4fV76GnUiFPI5mvctHZAsJ9lWuwG0QaXE8ZiINtBlj/sAJ3FeLHKxl6y4H7LIbaeT6GtG85cDc9vjKqrLvyJZPJZDKtbbd8mPkqd2I3iDS4XUX6/5yqIoO45L+BO3PURydG/vXrLVfPvdq9FDuqUyK65g+0/mFs9xxot3zUFO4o+izrrjiigwaRRrarSP/HiCujIB9YA7Fn7gPx0e+o3zjoKlI1UkFxFwP3WUDavQQ7olMjMgQ8OA+4tww/luSUZL7Kt8O+0v9jGnFZ/pN3V0axG0Qa2QrgXguMHt+OnZomzqgEypn9IO1eAtF1d4P48I3Ae6r0XVB8FuCuQhAfvhHkt17EjuCUkd9YFV+HqsCPKTklWXfl8JC77Msm5rXkYDeGNLieMhAHrwWIhrFz09SRIqCc3A3Srkchuu4utaB0xwuKq1BNePE1h2mPr7ccuKsAeE8NxF7uBIiOYEcrIaIr74gf4a6DsUtOTV/lqNBddo1J8FRUcV8lkOSUdRVBdNVvsfNScpEjoJzaC9KuRyC6/l4Ql34feF+juuPbVahugOsqVs9x8lpA3VFdkYR4xv8dT3m8eBWB2N8E0fX3gmKwfR4XQjlzQH106LXgj1syIUe8lhIT91nazg1+kpyCnfn6X/9IFGUUgJ8G+eirIO16FGLPPQCRx28FMdSiJsOuYrWodBaoBaarWD0uxVMaLzLlF9ZTpv53YzMdV6H6am5/I0SevA2k3UsM94rueMResqkxwh6zZOJ6y5tNzFv+A/SGkMbVawHutYB8bCt2bkJBiZwB5eRukA+uBWn7AMRemA/Rp+8EcdkPQVz8LeDBZuC9s9Q9Dz01wP016v/urwUeqAdxYC6Ij3wbIk/8BKJr7wJpWx/I77xqqDOtJowQPzzRU4Y/bsmEZd7yH5gEX8WvsRtCGlh3KYihVnX3OXEORVF348cEAH4KlKFDoJx5I+4B1fARdd1Ip7v2k01so5NmHykk81b8zsS9lvuwG0IaWFchRJ/W+f4PAh1l6E0QA/U0+0ghBU/FfBPzWTqxG0IaWFchSNv6sPMToXNiq3+nru9gj1cyaTKfpcfEvZYgdkNIo2oB7ikH+dg27PxE6Bj5wJr4a9AW5PFKJvn+D5mYr+IJ/IaQhjR+kJ+h938QmqIIx0EcmBv/gJcOxiyZNJnX8qiJey3PYDeENKiuIoiu+jV2jiL0iiJDdOXt6iZI7LFKJl3mq3jCxHzlG8eO4ibJSdmZD9K2fuw0RegU6aUF8eKhg7FKJl+v5WkT85W/gt4Q0njGN8Kl6/4PYnyk7UF1Y6VXB2OV1CoHPGNi3vKt6A0hjaenFMRQC+3/IN6HtHORugPfW4Y/TknNZL7yjSbmLd+J3RDSgLoKILrqN9i5itAZ0rZ+9bh5DxWPVJd5LVtM3GvZjd0Q0oB2FoC0tRc7XxF6YTQGsef+Fn9sRcUjPSzfZeI+yz78hpCG01NK+z8IAABQhg5C5ImfAO/MpzWPdNJb/oaJey0H0RtCGkt3fP2D9n+kPfKex9TDIl2F+OOSnFaZt/ywifksb2E3hDSYriKIrrwDO3cRiIwe3w6R5T9Vj6F3l+KPSXL69VoOmpjHcnTsSG6SnJAd+SBtpfOv0hH5yMsQXX2nmkA6C/DHIomnx7LPxDzlJ9AbQhpHTxlwTxnIRzdj5zJiupBEkPetgMjjt6qzjc78c19iJNNXj2W3iXnKj6A3hDSO7hIQg826X/+Q9j0J0qteGD26FRTxNHZzDIcingb58HMQe34+iIu+ce5riZ5y/DFI6kLmsewwcW/5AeyGkAayMx+iK/V+/pUC4tLvAbdnqwv+A3Mh8uRtEHu5E+RD60AJH1U/UUu8j9Ejr0DkyZ+C2DdHXd/oyFc/z+ulwkG+W3UfiKd8D3ZDSAPZkQ/SlgB2nhsXhZ0AHqhXH7d4y9WjxF2F8WRYBNxfD+LS70HsuQdA3rcClKGDAIqM3WxdoITfgdiLC9TP73bk0aMq8qIyb/krJuYt34bdENIolgN3l4J8bAt2nhsX+dAGtVBc8HGLeg3cFf917SoE3l0N4uJvQ2z9n0DevRSUk3sA5Aj2ZaCihI9AbMNf1ALiKtTB2CP1JvOUv2RinvKXsRtCGsSusfWPEez8Ni6xjQ61OEz0ujxlasHpzFf1VYC48AaIbvgzyPtXgiIcxb4kNOS3Xwbxke+o8XSX4o9BUkeWP2fiHsuz+A0hDWFnIUSfuh07p12SyLJbzp0EOxU9Zepz/874DKW3Xl1D2eKH0ePbAeQo9iVOL5II0itu4L7KxOJKppae8g0m7i1bPXY0N0mOa0ceSFv1vv5xHHhvQ/w02CRdt7tU/a5FRx5wbzmID98IsWf/CvKB1aCwE9iXPG3I77wK4qIbgHfkAveOrY3oYFySKDJv+SoT85Qvx24IaQA9per5V0dfxc5j4yK/+Wz8mb2GcegqUouJqwDEvlkQXf07kA+sBogMY1++9kSGILr2j+rszJ3EIk0aTuYpW2xinrIl2A0hDaC7BMTgXN3v/4httJ+dKUxXXNRHXQUgBuep6yZvvQgwKmGHQlNiWwLqse3uIvyxSaLIPOXdJu4pC2E3hDSAnfkQXWmA9Y/Hb1UfN017jMrUhNqRB7yrCMRHvgPS9mBKP+KS9j8FvKdKnZFhj09y2hW8ZQ+amKesE7shpAHsyIfYlh7snDUuCjsZ3/9Rghyv+Kuvnfkg9s2G2LN/hdETO7HDownyO6+A2Nug7WNDUpcyT/kfTcxT9ifshpB6twy4u0T351/Jh56J7/8o00HM4o7NSrxlEFv9OxhNwW+oyMe2qoWbikiaWXqbiXvKfobfEFLXdhWDGJwHis4XidX9H9O4/jEZPfFDCL1lEHv6TpCPbcUOV1KR33kFuL+GHmelkYK79FsmwVN2I3ZDSJ3rKoDoU7/EzlGXRN3/ofNfwWOFxFMKsXV3gxI+gh22pCG/+ax6ffR2VlrIPKWzTYK7uEZ9p5skL2JHLkhb/dj5aVwUdgJ479j6hw5iNq7xQtKRC2LfLJB2LkqZs7ikbX3AO/N0EGNSa0c8pcUm5i4xj33jgSTfp7tUXf945xXs3DQu6v6PAvx4Tdb4npLIsh+CcuI17DAmhdi6dnWzIXZsSQ0tVQR36UzTiLP4Ku4ui+A3iNSlXcUgDjTp//yrl+zAnQZOWh15wH2VIO1egh3KxIkOgzjYpn6xEDuupDa6y8JDrqKvmnhH4ReYu+wEeoNIfdqRB9GnfoWdki5JZNmt576UZ1TjBzrGnvu74c/bkt98Rj03y12KH1cy+bpLD515MPNfTKes+f/MPWUH0BtE6lNnHsQ2d2Pno3FReHz/R1cxfrwS1V0K3JkLkSd+DAo7jh3ahIiuu5seZaWozF222WQyfcDU3m76IPOUbsFuEKlH1XOfdL//IxV/7TpyQHzkOwAG/hyvMvIW8J7q1Cjs5Ltk7rInTGMwd9kT2A0idairCMSBJgPs/3Aae/3jYjpzIbLsZt2fPzYeseceSM2+SXOZu7TjXAHpKrVhN4jUoZ35EFnxC+wcdEkiy36Yugu2zly1DyQRO8xTQhl+S/08blcJfizJpMncpb87W0CErpJfYjeI1KHOXJA26/z8K35SPYsplR+TOMwQ2/Bn7FBPmdjau2gtJMUU3CXfOVtAuLu0bex7DyTJPaXqekJXsf73fxx+Lr7/Qwcx06wv1CPjpf3LscM9JeTDz6snBGDHkUyaQldJ9XkFpLiAu0tGsRtF6siuIhD7GwGiel//GNv/oYOYaamrAPhAEyiRM9ghnzxyRP2SYaoX+nTRXRILdxXPOK+A5H+Ru0vD6A0j9WNHrgHWPxT1+x/xs6VSXmcOxDbasYM+JWIvPpQehT4NZO6S0yMu82fOFpAjLvPHubv0DeyGkTrSmQuxzT7svDMu5/Z/FOHHazrsKgLeWw8KP4Ud+kkjH1qfPoU+xWWekp0722dcbjqPD3B3yQbshpE6sqtI/+sfY98/d+sgXtOlMxek7QPYoZ80inAUuL9W/T4KdgzJhGSe0qWm98LdJQPYDSN14tn9H0PYeWdcpJed6fdYpCMfxMduxg795FEUEJd+j2YhqeED7ysgrKv4bh00jNSDnfkQWf4z7JRzSdT9H2mWkLqKgfdUgzLyNnb4J01s/T3x13l1EEdyygqe4u9eYAZS3ILdMFInOnNAMsD6h7r/I03WP863Mx/kA6uxu2DSSK96gDtz8ONHJqarJP99BSTcVTyDu0sl9MaR49tVBNxTot2/7y4G3lUEo3o//+rwc8BdaTb7GNNpBknnB1xeCGnvEzQDMbjMXXKadxR+4X0F5LTL/EnuLjmE3UByHN0l6kJkV6H6S64jTy0o7iQWlI5ciDx5m+6/kBfb6EjfX7MduYbcmS4feVn9gUIL6YaVeUq2r203ffh9BSS+I329+gU6Und2FoAYagVl+DDIRzaBtNGprgH4a4F35AN35Kj/s6to6n+jqxi4qwjko69i55pLEll2q1pAsfsFQ2cuxFb/HrsLJs3ose1qIuoqxo8hOSVZV8mjFyweJpPJxFwlduwGkhfRkQOxV9zvuykVdhzkA2sg9vzfQXz0u8C7K9XE6ojPUFxF6kF2l/r3XUXAHWaQNrkQUsvkUPgpdf+HK4FiaWSduRBd9Wvsbpg0ysk9wL2WxH7kkKgyd8m9Fy8g7pKbsRtIXkBXkfrmTfidS9+kw2+C/MbTEHt+PkSWfl+doXQWAHeY1YLSWRj/BViiFhZXkfooyFUEsU2d05BGEkd+81n1miZSGFNRZy7E1t6F3Q2TRjlzALivggqIgRU6S7910QIS7iotx24geQEdORBbd/fUblp2AuRDz0BskwsiT/wYxIF5wH2WswlY7G2A6FO/0v2mwfORXu5QCyJ2v2DpzIHYCw9id8OkUYbfAt5dRQXEqHaVjLKuotxxHmGZP8e6SobRG0qe12nFwLuKYfT49uTcxNERUM4cgNHj20E5uRsUfjIp/+50Eln2Q3W9B7tvsHSYQdpmwN3op/fSIywDy7pK3jpxf/EnLlpA1rabPsy6SjZjN5Q8T2cuRB7/Efa9rxsUfgrEQP25I0zSzbEXHd56CbsrJo18dPO5a8COIzlpWVfJkxctHmdnIV1FXu4uAVInOnNBfmMV9r2vG+TDz6u7z7H7Bcux9TB2HLsrJs3Zb7eMrcGRhpK5i++5dAFxFX8fu6Fk3M58EBdeCyBHsO993RDb6Iivf+igfzDsyAVx2c0AoGB3xaSR33hK3UjopgJiRFln8axLFhChsySDd5VI2I0lS9Rn3Vv82Pe9rog8fqt6gCJ232COiVe92N0wJaStgfQu/oa2eOSMveg/LllAjj4w8wruLtmP3+A011UI3F8HwIy3yK0V5/Z/FOL3D4ZdRcA9ZaCc3ofdFVMitv5P6ivj2HEkJy3rKt688FrThy5ZQNR1kOJHsBuc9jrMEHv2fux7XlfIh59T1z/Gjm9JN51miK68A7sbpkxk2Q/ij7B0EEtyUrKuYs+EiofJZDIJXcW3Yzc4rY2/5qic3I19z+uKc/s/dNBHGGOiqxBG39H/MTMXQpEYiKHW9H4BwsCyrqIfTLiAhLsKy7EbnNY6cyCy/OfY97zuiCy7JX1/wTqyIbb2j9hdMGWUMwfP2wOig3iSE7ereJR1FudMuIAMzy/8NHOXHEdveDraVQy8Mw/kQxuw73ldcW7/RwF+H023nfkg9jaAEj6C3Q1TRt6/In2Lv9HtKj509IGZV0y4gJhMJhPrKl519uhlcvrsyAVx8TcBRmPY97yukA+tB+7Ijv+C1UE/TZeuAuCuApDffAa7CxIi9uz98cePOogpOTm7ioKTKh4mk8nE3EV3oTc8HXWYQdoxiH2/6w55/woQB5qAu4uAO82qroLULiiuAuAduSkwHhQQl/zPeXtASCPJXMXfn3QBGekqLOLuIgW78WmlqwDE3gaAyBnsO16fSCIoJ14DaVsfRFfeAWJ/k/pxLUd2/EThFCoonfnAXQUgbQ9iRz1hFOGYeoiiqwA/ruTk7CqOjDiLr5p0ATnumPFP3FV0YOwwP3IatJsh9sJ87PvdOETD6se1NvsgsvynIPY3nju63mGOJ+Ei/H6djK4i4PZs4P5akA+swY5wUpD3r1Q3f3YZrC9IYK6iVye8/+O9cFdRL/YFpI2uQuCeclDOHMC+3w2LEhkC+ehmkDZ3Q3TFr9SC4ioCbjef94GtQvy+vqBFapJ15kJ05R2gDL+JHc6kEVvzv2pBR48xOVkFV+H8KRUPk8lkErqKvo19AWmj3QzRlcb7ypyuiYXVgrI1/shr4fXAfZXAnXlqQrOPfWSrAGmmUqQeSx9vR2TJTSkz6xhDiYbVR42d+fj3GDlpWWdB45QLyJmOgi9xVxHDvojUV00k8tvGO6LbUIxK6jflD78A0mYfRFf/HsSHbwTeXa0WEXu2WlicuWpi7yyE5D52KVL/jjP3bNEQB+ZCbP29IB9+HkAZxY5Q0pEPP6cWaXp8ZThZV9GpsDXr/0y5gJhMpg/wruJnsS8k5XXmQuTR/wZQZOz7Pf0YlUARjoH81gsgbeuH2Np2iCz9PoihVhB7qs8lfEeOmvTPLzJjduTFzVcd+/874v/92CM0VyGIgXoQF38bYuv/BPKhZwBiAnYENCX27P3q9WPfY+SkZa7i5YkUD5PJZDKxzsK71V8PpGY6zCDtXoJ9rxPnI4mghN+G0eM7QN6/EqRtfRDb6IDYhj9DdNVvIPL4rSA++l0QF38LxIdvBHHR9SAOtqk+8m2IPH4rRFfeDrG17RB7YT5Iu5eoX4FkJ7CvbPqIhtVXr8/OQEgjKbgKfp1wARlx5pViX0hK25EHYnAeQCyMfbsTk0UZBRiV1U2fclT9boscUf9/BEh7n4wvnuvgPiMnq8xcBdkJF5Djjhn/xLsK39DBBaWmDjPEXrJh3+sEkXQij/+ICohBZV1Fm9e2mz6ccAExmUwm1lngwL6glNVVCOLAXIg+/VuQtg+AcuI1AIlh3/sEkRDKqT3Au4rjr03r4D4jJyXrLLw7KcXDZDKZhM7CKuwLSmk789Xd1PFfa2KwGaKrfg3S9hCMHt8GIHHsfEAQkyL2/D/UFwiw7y1yKsrMmW9OWgE5PL/wY9xVtE8HF5b6uorURcexN3i6ikAMzoPoqt+AtK0flBM7AWI0QyF0TDQMvH+O+kYa9v1ETlrWVTTxrw9OFMFVsAD7wtJSV2G8oMRnKK54QVl5B0jbgzB6jGYohL6Qtg/Q2oeBZa7Ce5JaPEym+EemdHBxae+FZigDc9VHXtv6YPT4jpTfW0DoFyUyrO48p1d3jWpyH1+NcaD9Sx/lXUV7dHCB5Pm6Cs6boWSfW5RfeTtI2wZg9NhWWpQnpo3Yq27g9iz8+4Kckkl9++q9CK7C+dgXSF5CV6H63YV3zVCa1EdeW3th9Ph2mqEQmqDwk8ADder4w74PyCmpyeOrMUZc+SXYF0hO0vhHic7NUAriBeV2kHYE1Udekoide4gUIPbSApp9GFlX4SjrzJv4t88ny872GZczV+FO9AslE/ACM5RQC0TX/B6k1xaDcnofwKiEnYsIg6GceQO4zxI/dRd7jJNTkbkKNyb97av3wlwFv8O+UDKJjs1Q7PEZirsExIXXQWxdO8h7l4EydJCO5iDGZ1SCyLKbad+H0e0suE3T4mEymUxDLvNXuatQ4K4iIFPQs8eNx0+R9ZSB+PCNEHvmryDvXwnKyFt0ajDxLqTNPcBtWfhjl5yyzFU4xGxZn9e8gJhMJhNzFT6KfcHkNNmZrx5Fbss6+1U5+Y1V2DmL0AmjJ3cBd5eqmwaxxyqZgIX901I84gVkHv4Fk9NuZwHwjnx14Z0g5CiIj3xXna1ij00yIQVXfu20FZCzR5vo4MLJadSZC2KwGUCmt7YIgNi6u+nRVQrIOgt37rVe+ZFpKyAmk8nEOgr+zF2FQKaR9myIrvotdt4idIC0yRUvHgX445JMSNZZ8IdpLR4mk8kUdhR8nXcWRrAvnpxGbVkg7RjEzl0EMvKuR9T1sM58/DFJJmZnAR92FF457QXEZDKZmKvwKfQAkNM00NRFUuXEa9j5i0BEPrRBHQ8defhjkkxY1lm4DKV4mEwmE3cVXosdAHKadOaCGJyrfrJVExSIPn0nRJ+6HeRdj4Jyeq/6qVhCN8j7lqtvXDlz8ccjmRw7CpvRCsjh+YUf452Fu9GDQGqvLQuiT2u3/qGw48C9FuALMtS3esY2NK7/E0h7Hwdl6JBmf5u4NNLWPnXWQcUjZWSuwh3Tvnj+Xrir8OfYgSCnQXs2SDtCmiUo+dAG4E7zub/XmQ/cGd9/Ys9WNzQu/ibEnr0f5DeeBkU4qllbiHcTe/FBtQ/osVVKyVz5P0YtHiaTyTTiMn+GdRYeww4GqaGd+cBdBZquf8RefCj+Vs84bXCYz21o9FVAZOn3IPbiApDffA4UdkKztqUrSvgoRJ/6lVo8aME8pWSuwiPD8ws/jV0/TCaTycQ78/+GHRBSQ505IA7MBUXDLx9Gln7v7PdMLu1530CxZart89dA5LHvg/TaYs3amE7Iex9Xj2a3ZQK9qpt6ss78v2DXjbMMO7Kv5K58pg40MuW0Z0F05R2aJSuFnQDeXake6jjVNnbkAn9wBkTX/EGzdqYDinAcok/fqc7ynDn4Y4/UwHxhyJb3Zey68S54Z34vfmBITbRlgrQ9qFnSkg+tV9c/4o/KpqwjG+R9yzVrZyqjRM6A9KoHxLFZR6J9QepW1pnfjV0v3gd35hdwV76CHRwyyXaqC6dann8Ve3HBeY9KEmintwyU4cOatTMliY6AtNUPYv9stQ8SmQWSRlBmjtxc7HpxQXhnwdM6CBCZTJ05IA40AWi6/nGT+sgkkXY6zCAu/iaAMqpZO1MJ5dTrEHu5A8SBprPrSOhjjdRc5sp/CrtOXBTWmT8LO0BkkrVlQnTVr7VLZOw48J6q+CuiibUz9sxftGsnPwXyvuWgnNwNinhas7+jJYpwDKSdi9SPP7mLqXCkoawzfxZ2nRiPD/CO/LW8swDIFNGWCdK2fs2Smnzomfi5Sgm2054N8r4V2rVzz2PAH7wGeGcBiIEGEB/5NsTW/AGkLT0gH1wLyqm9AJEhfX0OODIM8tsbIfaKGyKP/xjE7ir1NWhbllqwsccWOc3mrzeZTB/ALhLjIjjya/EDRSbFjnzNv/8Re3EBcGtmYu105gP3lGq6/hFdd4/azo78+Bcb43tSrJnqB7e6SoD31IC46BsQWfFziD17P0jb+kE+tAGUEztBGX5TnbloUWDkKCgjb8Po0S0g7VkK0osLIPLkT0EM1KuFwpqpttWZiz+mSDSFjrw67PowIXhnwdPYwSKToCMHxP4mUGIs+UkvTmTJ94DbshNrp90M4sM3arf+MSqBuPB6tWhc6O935J875uP8wmLLUv9vZx5wT7k6cxlsA3HJTRBdeQfE1v8JYs//HWIvd4C0xQ/SzkUgv74M5P1PgbxvBcj7loO890mQ9z4B8t4nQNr1KEibeyD24gKIrbsHok/9CiJLvw9isAW4rwK4I/fdf9uZq7YNexyR+Hbkr8auCxNGsOdW8c58IA2uLROiT/1Km6QMAAo/qSY+Z25i7bRmQmyDhusfZw4Ad5eobyhNtY0duep6g8Os7uy2ZalrENYxM1RtmfHv0Wef99/FHftvrJnqfzd2zIvDnHgMyZRWsOdWYdeFScE6857CDhqZoFat1z/Wq8mvI8F22rXd/yG//piarLH7gySnIOvIW4FdDyZN2JlbzjvzFOzgkVO0Iw94Zz6MHtumWWKWXrSqv6gTamdufP3jTc3aGRtb/8DuE5KctHlK2J5bMPgcBgAAED1JREFUhl0PpgTryH8CP4DklHSYQeybo+3+jyU3nTuob6ras+PrH7I2jRyVQFx4XeLtJEkEWWfe49h1YMqMdOQU8468UewgklPQqvH6Bzuhvlaa8PpHBsQ2/Fm7dg4dUN+wSmT9gyQx7MgbHXHkFmHXgYTgHXn96IEkJ68tE6StvZolZvnQs+ppuom2056l8frHMlr/IA0p68hbhJ3/E2bYkX0l78wfwQ4mOQnjr6WOHt+uWWJW938kuP7hzAPu1nb9I7rublr/IA1onjBiM/8ndv5PCqwj7178gJIT1mEGsX8OKDFBs8QcWfq9xH/Z27NBXPQNDfd/yPH9H7T+QRrMjrz7sfN+0hhyXvMp3pl3CD2o5MS0ZUJkxc+1ScoQ3//RXaHui0iknZqvfxxUz4yi9Q/SQLLOvMMj9rx/xc77SYV15N+EHVhyglozNF7/GNv/kZdYO+2ZIO99Qrt2vv5Y/NsYCbaTJKdR1pH7A+x8n3Q23Wy+jHXkv8Q684HUsR25wDrzQD62RbPEHHvRCsw6M/F2eko0Xv+4B5g1A79PSHKiduRt3HSz+TLsfK8Jgj23inXmKehBJi+uwwy8bxaAhudfiUtvAmbPSqyd9iwQH/6Gpvs/+MLrEm8nSU6beYrgzK3GzvOawjryFuEHmryo1gyIrPiFNkkZAICfANZdCcyZk2A7Z0J0w72aNVMZOgisqzg+I9NBv5DkpUyF13YvxZDV/FWhM28IPdjkhbVlQGyLX7PELL/5LDBHNrDOvMTaac8Ead+TmrVTen0ZMFsmfn+Q5ITMYyPOnKuw8/u0IDjyfsE68oHUm3nAnLkwemyrZok59uICdf0jkXY6c4F1lYAydEizdkbX3Q1sQYLtJMlpM/d/sfP6tKEuqOc9jx908l3azcB7ZwFEtdv/IS75HjBrZmLttGUBX3iDdusfiqyuf9iy8PuEJC+h4Mx79UD7lz6KndenlWFHbi7ryI2yjjwgdaI1A6Ir79AmKYO6/4P5KoA5zIm1c8FMiK3Xev2jSF2nwe4TkhxfecSWU4ydz1EQOvLu10EHkGNaMyG6+k7107Aa7O6WDm0AZs8G1pGbcDslDfd/SHsei8+SEmwnSWqs4Mx9EDuPo3HKeuU/Cx25u7A7gTxPZy4wdwmIi74BsQ1/AXnf8qStNcRessbXFRJpXw6wruJpWv/QQX+Q5EUUOvJeP/Ng5r9g53FUmDOngXXkKtidQY6ZC8yRoz7/XzBTfRPJXQI8XlCkfcunPEMRl9yk/nuJtM+WBeLC6zXe/3FtfP0Duy9I8mLmKsxpno2dv3WB4Mzz43cIeVGd7y8ok56h8JPq/o8krH9E1/9Jm+IB6vc/aP2D1LuCM7cHO2/rhnDHzM8yZ95B7E4hJ+J4M5Q/X3SGIh9+Lv6rPsF1BZvG6x+vL4uvf2DHmSQvojP3beGhq/8NO2/rCuY0z6ZHWQb1/BmK9QIzlJG3IPb8P+L7PxK6cWj9g0x7w/bc67DztS4RnLkPYncOmagXmKF4yoF5StUCkMi/bc8CruX6x7v2f2DHkSQvoDPXhZ2ndcvRB2ZeIThzN6uPOciU0WGOrykk+O8smAmx9fdoUzzg/P0fZvyYkeR7FJy5O05Zr/xn7Dyta4YdubnMmcuxO4vUodYMkPY+rlkBUfd/ZOBfJ0m+X3HEnlWInZ8NgeA0/0YHHUbqSYcZmKcUFH5KswJybv1DB9dLkucpdJh/i52XDcPCa00fEjpyVmJ3GqkjHWbgPgtIux4FZegAwKiU3OoxKsf3f2TiXytJnqfgzHmqvd30Qey8bCiGHdlXCh05J7A7j9SRzhxgtgxgXUXAB6+F6Lq7QdqzFJQzbyR89Aqtf5B6VHDmHhty5n4FOx8bkrDTfC12B5I61GlWZwoLrlHXLFxFwAfbILr2j/GCsh9gNDapAiLtXUbrH6TuDDtyr8fOw4ZGcOb+FbsTSZ3rzAFmz4zvQ5kJrKsQ+GArRNfeBdLuJWpBucSrv+r6xzX410KSZ82xYedfw7PwWtOHBGfOU/idSRpCZ6664G7LOm+GUgg81ArRNf+rFpTT+wDkd89Q+OC1tP5B6kbBmbNuZ/uMy7Hzb0pwwpb1eebIOcicuUCSk9ZhVnfIPzRTnaV0FgAPtqgFZc9S9Zj5rqL4fhUdtJdMbx25h08vMP87dt5NKcLO3HLmzBXRO5c0vo74GspD8RmKMwe/TSTpzAXmyImEHeYK7HybkoTt5p+idzCZejqogJD6MGw3/xQ7z6Y0giPHj93JJEmSyVZw5Hix82vKc+L+qz7BHLkvY3c2SZJk8sx56egDM6/Azq9pwZBt5peZM+cQfqeTJEkmpuDIfWfYkX0ldl5NK0YcuUXMkRPG7nySJMkp68jltGiORNiefR1z5IyiDwKSJMnJ6sgZFWzmG7HzaFoj2LPvUF/DJEmSNI6Cw3w7dv4kTCYTc5gd2IOBJElyogrOnAex8yYRZ9PN5ssEp3kZ9qAgSZK8lILDPLjwWtOHsPMmcR7D82d8WnCYX8EeHCRJkhdTcJo30Ou6OuWMPes/BEfOHuxBQpIk+V4Fh3kXe9D8Oew8SYzDyEMzr2IO80HswUKSJHlWh/ngyEMzr8LOj8QEYNaMLMGR8w76oCFJknSa3xKsWRnYeZGYBMPW7ALBmXMKf/CQJJmuCg7zcebMNmPnQ2IKCPasKsGZM4I9iEiSTD8FZ86pEUdmEXYeJBKA2bPnMIdZZA4zkCRJToeCwzwUtmVasPMfkQTCtuzrmcMsYw8qkiTTQiY4suux8x6RRML2rBsYzURIktRSu5mP2DPnYuc7QgNG7NnNzG7m6IOMJMnU054tUPFIcZg9c5ZgNw+jDzaSJFNGwW4+JdizqrDzGzENCNasasGRfRp70JEkaXwFu/mdEVtmMXZeI6aREVtmsWDPPo49+EiSNLRvMmtGFnY+IxAYtpvzmT37bR0MQpIkDaZgN+8JP5j9dew8RiAiODIzmd38BvZgJEnSOAr27C1Dtplfxs5fhA4482Dml5gjeyP2oCRJ0ghmP0en6hLvYui+az7F7NlL8QcnSZJ6VbBnD564/6pPYOcrQofsbJ9xObNnu7AHKUmS+lOwm//e3m76IHaeInQOc2TfhT1YSZLUiXazFLZl3YadlwgDwezm7zOHOYY+eEmSRFNwZJ8esZnnYecjwoAwq3m24DCfwB7EJEkiaDfvG34oMxc7DxEGRngoe6bgML+KPphJkpw+7eZnTy8w/zt2/iFSgDMPZv6LYM/qZ45sIEkyxbVnu460mz+OnXeIFEOwZf2W2bNlZs8GkiRTTFs2D9uybsHOM0QKw6yZswVb9hH0wU6SZNIUbFl76EBEYloYsWd8jdmynsce9CRJJsOsJcLfZvxf7LxCpBFHH5h5Rdia5cYf/CRJTklb1mjYlt1uMpk+gJ1PiDSF2TO/L9iyzqDfDCRJTsKst0YW0NcDCR0QXjDzasGWtQ7/piBJ8pLash8982Dml7DzBkGcZWf7jMvD9qw/MXpLiyR1alZYsGX+DDtXEMRFEeyZNYIt63X8m4UkybPasl9gC7LN2PmBIC6J8NDV/ybYMnuZPQtIkkRVFmwZ9x1p/zxtDCSMBbNm3CTYMo/q4CYiybRTsGW+Ltgy6rDzAEFMmaEHr/mKYM8cxL6ZSDJ9zFSYLdMVfmDmZ7Hvf4JICmFbxvXMnrkf/+YiydRVsGdtpVkHkZIIf5vxf5k9q5PZMxXsG40kU0pbFg/bMu6hz80SKY+wYGa9YMvcjn7TkWQKKNiyVtN3O4i04pT1yn8WbBn3MXuWiH0DkqQRFWxZJ8O2jNvoO+VE2sIWXGMWbJnLsG9GkjSSgi2zd8h69Vex71+C0AUjtsx5gj1zM/aNSZJ6VrBlrgvbZlZi368EoTuOtH/+44I945eCLesI9o1KknpSsGXuEeyZ3114relD2PcpQeia0wtm/DuzZtqZNTPCbFlAkumqYM08w2yZdw3dd82nsO9LgjAUw9aMPMGa+Tj2TUyS0641c1SwZfqG58+4Evs+JAhDI1gzagVb5kr0m5okNTdTYdasxSMLMouw7zuCSCnYQxlzBFvWevybnCSTr2DLXBa2ZpVj32cEkdKMPDSzSbBmbcC+4UkyGQrWzMfDCzIqsO8rgkgb2ttNHwzbMq9l1qwXsBMASU5FwZa5UrBm1GLfSwSRtowVEsGWsZbZMoEkda4s2DKfEB6iAw8JQleEbTMrBWvGILNmRHSQKEjyrII1Y0SwZnQPW2cWYN8nBEGMg/DQ1TOZLcMqWDOPYycOMu19W7Bm/HXkHxlfw74vCIKYBCfuv+rzgi3z14I1Y5cOEgmZRgrWzC1ha8ZPRv7+tc9g3wcEQSTA8fYZ/yTYMr4lWDNXMVtmDDu5kCmqNZMza8ZjYWtGy872GZdjj3uCIJKMYJ2RIdgy/yJYM19HTzhkSihYM3cy28y7RmzX/Cf2+CYIYho4+sDMK0YWZDQza8ZiZssIYych0lgK1sxhwZoxyB7KmHOg/UsfxR7PBEEgMWS9+quCNeM3gi1jM3ZiIvWtYM14VbBm3jFkm/ll7HFLEISO2HSz6bLwg5kWYUHGfMGasRs7WZH6ULBlviZYZ/5tZEFGydp204exxylBEDrnQPuXPhq2XlMuWDP+rj7jxk9k5HQXjYx/hB+6pmyv9cqPYI9HgiAMyl7rlR85V0zoleAUdq9gzVgQts2spKJBEETSOdD+pY+OLMgoCT+UcbdgzVgrLMgYYdZMII1oRliwZqxlC2beNfJgZvHRB2ZegT2+CIJII04vmPHv4QUZ1/3/7d29axVREAXw1xj8AAttNCqkCCZmszOLTaxSiGApQgpJZ2FAQTGtWDwQFDXZd2eaIGksFEUsFIQIAUVBqwQFjdEEEkJAn8ag790zKEiMxWu0sRI3H/OD8w/sXc7cy2VZE74G5UlT/ll8MXr+kmlIdh2S9n6pZC1Fvz/OOVcqlUqliXLShEqWIXC/aXYfwtUVUJjrOhCuQnjEAp+vKR3wU4ZzblWo5cm2xt1JdhbKtyHZGxP+XnSprtkIL0GyKRO+i8D9MaTd/i9x59yaMNZX2lAfSNujUg+EByH8CJItFF68qzTQ7CuUx6NkwxA+jjxN5/Pdm4peZ+ec+y/qF9u3x5B2m6R9CFSB0iiU3pmymfKyh5dN+IcpzUD5MZTEQnoihrQbV5Id/l2Gc879ZrbcsrGWJ62xQgej8GkTGoLSqAnNmVI0oaXCS/2fDwlaglDdlGYg9ATCN6JQuS7pkZh3JIvaurXodXHOuVWrepW2LA527qkF6qpL59EY6BQkvQShm1B6CqVJKH1s7NhXwFD4I/QNwp8aA4JfQPkBlAQh7Y9KPbVAXZ/zvbvel5s3F/2cnXNu3ZkoJ01W2bcz5h1JLVAXAh+OQsei0kkLdA5KA1Fo2JTvQOmhKT2H0jiUX0L5NYTemvK0Cc+a0DyUPkB4AUKLEKqa0ByEpyD0yoTGTPhZ4x6HRkzoHoRumdBQVL4QA52BpL2opIesQvvrgdoWLrc1+0nCrSW/AHi4DfEaROHOAAAAAElFTkSuQmCC); background-size: 100% 100%;";
			
			function getEmbeddedImgCss(name, img) {
				return "." + name + " { background:url(" + imgToDataUrl(img.get(0)) + "); background-size: 100% 100%; }";
			}
			
			// inject embedded logo css rules and collect all rules
			let internalCss = "";
			for (let i = 0; i < document.styleSheets.length; i++) {
				let styleSheet = document.styleSheets[i];
				if (!styleSheet.cssRules || styleSheet.href) continue;	// target inline css which has rules and null href
				console.log(styleSheet);
				for (let logoCssRule of logoCssRules) styleSheet.insertRule(logoCssRule);
				for (let j = 0; j < styleSheet.cssRules.length; j++) {
					internalCss += styleSheet.cssRules[j].cssText + "\n";
				}
			}
			
			// build htmls from piece divs for zip export
			let htmls = [];
			for (let pieceDiv of pieceDivs) {
				let html = $("<html>");
				let head = $("<head>").appendTo(html);
				let style = $("<style>");
				style.html(internalCss);
				head.append(style);
				html.append($("<body>").append(pieceDiv));
				htmls.push(html);
			}
			
			// zip pieces
			CryptoUtils.piecesToZip(pieces, htmls, function(name, blob) {
				
				// register save click
				downloadLink.click(function() { saveAs(blob, name); });
				printLink.click(function() { alert("print link clicked"); });
				
				// set currently showing piece
				currentPieceDiv = $("<div>").appendTo(previewDiv);
				currentPieceDiv.append(pieceDivs[0]);
				
				// enable print and download links
				printLink.removeAttr("disabled");
				downloadLink.removeAttr("disabled");
			});
		}
	}
	
	function renderConfig(div) {
		
		// placement
		div.css("margin-left", "18px");
		
		// render include public addresses checkbox
		includePublicDiv = $("<div class='config_option'>").appendTo(div);
		includePublicCheckbox = $("<input type='checkbox' id='includePublicCheckbox'>").appendTo(includePublicDiv);
		let includePublicCheckboxLabel = $("<label for='includePublicCheckbox'>").appendTo(includePublicDiv);
		includePublicCheckboxLabel.html(" Include public addresses");
		includePublicCheckbox.click(function() { updatePieces(); });
		includePublicCheckbox.prop('checked', true);
				
		// render split div
		let splitDiv = $("<div class='config_option'>").appendTo(div);
		splitCheckbox = $("<input type='checkbox' id='splitCheckbox'>").appendTo(splitDiv);
		let splitCheckboxLabel = $("<label for='splitCheckbox'>").appendTo(splitDiv);
		splitCheckboxLabel.append(" Split storage into ");
		numPiecesInput = $("<input type='number'>").appendTo(splitDiv);
		splitDiv.append(" pieces where ");
		minPiecesInput = $("<input type='number'>").appendTo(splitDiv);
		splitDiv.append(" pieces are necessary to recover funds");
		
		// set up split config
		numPiecesInput.attr("class", "num_input");
		numPiecesInput.attr("value", 3);
		numPiecesInput.attr("min", 2);
		numPiecesInput.change(function() { updatePieces(); });
		minPiecesInput.attr("class", "num_input");
		minPiecesInput.attr("value", 2);
		minPiecesInput.attr("min", 2);
		minPiecesInput.change(function() { updatePiece(); });
		
		// collect elements of split div for enabling/disabling
		let splitElems = [];
		splitElems.push(splitCheckboxLabel);
		splitElems.push(numPiecesInput);
		splitElems.push(minPiecesInput);
		
		// set initial state of split div
		splitCheckbox.click(function() {
			for (let elem of splitElems) {
				this.checked ? elem.removeAttr("disabled") : elem.attr("disabled", "disabled");
			}
			updatePieces();
		});
		numPiecesInput.attr("disabled", "disabled");
		minPiecesInput.attr("disabled", "disabled");
		splitCheckbox.prop("checked", false);
	}
}
inheritsFrom(SaveController, DivController);

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

/**
 * Renders a piece to a div for HTML export.
 */
let CustomPieceRenderer = {

	defaultConfig: {
		public_qr: true,
		private_qr: true,
		public_text: true,
		private_text: true,
		qr_size: 150,
		qr_version: null,
		qr_error_correction_level: 'H',
		qr_scale: 4,
		qr_padding: 5,		// spacing in pixels
		col_spacing: 12,	// spacing in pixels
		add_table_width: 15	// spacing in pixels
	},
	
	getNumQrs: function(numKeys, numPieces, config) {
		config = Object.assign({}, IndustrialPieceRenderer.defaultConfig, config);
		return numKeys * numPieces * ((config.public_qr ? 1 : 0) + (config.private_qr ? 1 : 0));
	},
	
	getWeight: function(numKeys, numPieces, config) {
		config = Object.assign({}, IndustrialPieceRenderer.defaultConfig, config);
		return IndustrialPieceRenderer.getNumQrs(numKeys, numPieces, config) * Weights.getQrWeight();
	},
	
	/**
	 * Renders pieces.
	 * 
	 * @param pieces are the pieces to render
	 * @param config is the configuration to render
	 * @param onProgress(percent) is invoked as progress is made
	 * @param onDone(err, pieceDivs) is invoked when done
	 */
	renderPieces: function(pieces, config, onProgress, onDone) {
		
		// collect functions to render
		let funcs = [];
		for (let piece of pieces) {
			funcs.push(function(onDone) { CustomPieceRenderer.renderPiece(piece, config, onPieceProgress, onDone); });
		}
		
		// render async
		async.series(funcs, function(err, pieceDivs) {
			if (err) onDone(err);
			else onDone(null, pieceDivs);
		});
		
		// collect progress
		let prevProgress = 0;
		function onPieceProgress(percent) {
			onProgress(prevProgress + percent / pieces.length);
			if (percent === 1) prevProgress += 1 / pieces.length;
		}
	},
		
	/**
	 * Renders the given piece to a new div.
	 * 
	 * @param piece is the piece to render
	 * @param config is the configuration to render
	 * @param onProgress(percent) is invoked as progress is made
	 * @param onDone(err, pieceDiv) is invoked when done
	 */
	renderPiece: function(piece, config, onProgress, onDone) {
		
		// merge configs
		config = Object.assign({}, CustomPieceRenderer.defaultConfig, config);
		
		// div to render piece to
		let pieceDiv = $("<div class='piece_div'>");
		
		// collect functions to render each pair
		let funcs = [];
		for (let i = 0; i < piece.length; i++) {
			let keyDiv = $("<div class='key_div'>").appendTo(pieceDiv);
			if (i === 0) keyDiv.css("border-top", "2px solid green");
			let plugin = CryptoUtils.getCryptoPlugin(piece[i].crypto);
			let leftLabel = "\u25C4 #" + (i + 1) + ": " + 	plugin.getName() + " Public Address";
			let leftValue = piece[i].address;
			let logoClass = "key_div_logo_" + plugin.getTicker().toLowerCase();
			let rightLabel = "Private Key" + (piece[i].isSplit ? " (split)" : piece[i].encryption ? " (encrypted)" : "") + " \u25ba";
			let rightValue = piece[i].privateKey;
			funcs.push(function(onDone) { renderKeyPair(keyDiv, leftLabel, leftValue, logoClass, rightLabel, rightValue,
				function() {
					onKeyPairDone();
					onDone();
				}
			)});
		}
		
		// render pairs in parallel
		async.series(funcs, function() {
			onDone(null, pieceDiv);
		});
		
		let keyPairsDone = 0;
		let lastProgress = 0;
		let notifyFrequency = .01;	// notifies every 1% progress
		function onKeyPairDone() {
			keyPairsDone++;
			let progress = keyPairsDone / piece.length;
			if (progress === 1 || progress - lastProgress >= notifyFrequency) {
				lastProgress = progress;
				onProgress(progress);
			}
		}
		
		// render single pair
		function renderKeyPair(keyDiv, leftLabel, leftValue, logoClass, rightLabel, rightValue, onDone) {
			
			// left qr code
			let keyDivLeft = $("<div class='key_div_left'>").appendTo(keyDiv);
			
			// center left
			let keyDivCenter = $("<div class='key_div_center'>").appendTo(keyDiv);
			let keyDivCenterLeftLabel = $("<div class='key_div_center_left_label'>").appendTo(keyDivCenter);
			keyDivCenterLeftLabel.html(leftLabel);
			let keyDivCenterLeftValue = $("<div class='key_div_center_left_value'>").appendTo(keyDivCenter);
			if (!hasWhitespace(leftValue)) keyDivCenterLeftValue.css("word-break", "break-all");
			keyDivCenterLeftValue.html(leftValue);
			
			// center logo
			let keyDivCenterLogo = $("<div class='key_div_center_logo'>").appendTo(keyDivCenter);
			let logoSpan = $("<div>");
			logoSpan.attr("class", "key_div_logo " + logoClass);
			logoSpan.appendTo(keyDivCenterLogo);
			
			// center right
			let keyDivCenterRightLabel = $("<div class='key_div_center_right_label'>").appendTo(keyDivCenter);
			keyDivCenterRightLabel.html(rightLabel);
			let keyDivCenterRightValue = $("<div class='key_div_center_right_value'>").appendTo(keyDivCenter);
			if (!hasWhitespace(rightValue)) keyDivCenterRightValue.css("word-break", "break-all");
			keyDivCenterRightValue.html(rightValue);
			
			// right qr code
			let keyDivRight = $("<div class='key_div_right'>").appendTo(keyDiv);
			
			// add QR codes to left and right
			CryptoUtils.renderQrCode(leftValue, getQrConfig(config), function(img) {
				img.attr("class", "key_div_qr");
				keyDivLeft.append(img);
				CryptoUtils.renderQrCode(rightValue, getQrConfig(config), function(img) {
					img.attr("class", "key_div_qr");
					keyDivRight.append(img);
					onDone();
				});
			});
			
			// translates from renderer config to QR config
			function getQrConfig(config) {
				let qr_config = {};
				if ("undefined" !== config.qr_size) qr_config.size = config.qr_size;
				if ("undefined" !== config.qr_version) qr_config.version = config.qr_version;
				if ("undefined" !== config.qr_error_correction_level) qr_config.errorCorrectionLevel = config.qr_error_correction_level;
				if ("undefined" !== config.qr_scale) qr_config.scale = config.qr_scale;
				return qr_config;
			}
		}
	}
}

/**
 * Utility functions for the "industrial" pieces renderer.
 */
let IndustrialPieceRenderer = {
		
	// initialize default configuration
	defaultConfig: {
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
	},
	
	/**
	 * Renders pieces.
	 * 
	 * @param pieces are the pieces to render
	 * @param config is the configuration to render
	 * @param onProgress(percent) is invoked as progress is made
	 * @param onDone(pieceDivs) is invoked with the rendered divs on done
	 */
	renderPieces: function(pieces, config, onProgress, onDone) {
		
		// collect functions to render
		let funcs = [];
		for (let piece of pieces) {
			funcs.push(function(onDone) { IndustrialPieceRenderer.renderPiece(piece, config, onPieceProgress, onDone); });
		}
		
		// render async
		async.series(funcs, function(err, pieceDivs) {
			if (err) throw err;
			else onDone(null, pieceDivs);
		});
		
		// collect progress
		let prevProgress = 0;
		function onPieceProgress(percent) {
			onProgress(prevProgress + percent / pieces.length);
			if (percent === 1) prevProgress += 1 / pieces.length;
		}
	},
	
	/**
	 * Renders a piece.
	 * 
	 * @param piece is the piece to render
	 * @param config is the configuration to render
	 * @param onProgress(percent) is invoked as progress is made
	 * @param onDone(pieceDiv) is invoked with the rendered div on done
	 */
	renderPiece: function(piece, config, onProgress, onDone) {
		
		// merge configs
		config = Object.assign({}, IndustrialPieceRenderer.defaultConfig, config);
		
		// compute total number of qr codes to render
		let totalQrs = IndustrialPieceRenderer.getNumQrs(piece.length, 1, config);
		let doneQrs = 0;
		function qrCodeRendered() {
			doneQrs++;
			if (onProgress && (doneQrs % 5 === 0 || doneQrs === totalQrs)) onProgress(doneQrs / totalQrs);
		}
		
		// div to render to
		let div = $("<div>");
		
		// collect callback functions to render each piece pair
		let funcs = [];
		let rowDiv;
		for (let i = 0; i < piece.length; i++) {
			
			// get public/private pair
			let keyPiece = piece[i];
			
			// create pair div
			let pairDiv = $("<div>");
			pairDiv.css("margin", 0);
			pairDiv.css("padding", 0);
			pairDiv.css("border", 0);
			pairDiv.css("flex", 1);
			pairDiv.css("page-break-inside", "avoid");
			
			// prepare function to render pair
			funcs.push(renderPairDivFunc(pairDiv, "==== " + (i + 1) + " ====", keyPiece.address, keyPiece.privateKey, config));
			
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
				let spaceDiv = $("<div>");
				spaceDiv.css("min-width", config.col_spacing + "px");
				spaceDiv.css("margin", 0);
				spaceDiv.css("padding", 0);
				spaceDiv.css("border", 0);
				rowDiv.append(spaceDiv);
			}
		}
		
		// execute callback functions
		async.series(funcs, function(err) {
			onDone(err, div);
		});
		
		/**
		 * Returns a callback function (function with single callback argument) which will render a pair div.
		 */
		function renderPairDivFunc(pairDiv, name, publicKey, privateKey, config) {
			
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
				let numThreads = (config.public_qr ? 1 : 0) + (config.private_qr ? 1 : 0) + (config.public_text || config.private_text ? 1 : 0);	// one for each qr and one for text
				let tracker2 = new ThreadTracker();
				tracker2.onIdle(function() {
					if (tracker2.getNumStopped() === numThreads) callback();
				});
				
				// global text style
				let monoStyle = "font-size:11px; font-family:monospace;";
						
				// configure div
				div.css("margin", 0);
				div.css("padding", 0);
				div.css("border", "none");
				div.css("align-items", "stretch");
				let numQrs = (config.public_qr ? 1 : 0) + (config.private_qr ? 1 : 0);
				div.css("min-width", config.add_table_width + numQrs * (config.qr_size + (config.qr_padding * 2)) + "px");
				div.css("page-break-inside", "avoid");

				// create pair header
				div.append($("<div style='" + monoStyle + " text-align:center; border:1'>").append(name));
				div.append("<br>");
				
				// add qr codes
				if (config.public_qr || config.private_qr) {
					
					// div to hold qr table
					let qrTableDiv = $("<div>");
					qrTableDiv.css("page-break-inside", "avoid");
					qrTableDiv.css("width", "100%");
					
					// qr table
					let qrTable = $("<table border='1' width='100%' style='table-layout:fixed'>");
					qrTableDiv.append(qrTable);
					let qrTr1 = $("<tr>");
					qrTable.append(qrTr1);
					let qrTr2 = $("<tr>");
					qrTable.append(qrTr2);
					
					// render public QR
					if (config.public_qr) {
						tracker2.threadStarted();
						CryptoUtils.renderQrCode(publicKey, getQrConfig(config), function(img) {
							qrCodeRendered();
							qrTr1.append($("<td align='center' style='" + monoStyle + "'>").html("Public"));
							qrTr2.append($("<td align='center' style='margin:0; padding:" + config.qr_padding + "px;'>").append(img));
							tracker2.threadStopped();
							
							// render private QR
							if (config.private_qr) {
								tracker2.threadStarted();
								CryptoUtils.renderQrCode(privateKey, getQrConfig(config), function(img) {
									qrCodeRendered();
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
						CryptoUtils.renderQrCode(privateKey, getQrConfig(config), function(img) {
							qrCodeRendered();
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
					let qr_config = {};
					if ("undefined" !== config.qr_size) qr_config.size = config.qr_size;
					if ("undefined" !== config.qr_version) qr_config.version = config.qr_version;
					if ("undefined" !== config.qr_error_correction_level) qr_config.errorCorrectionLevel = config.qr_error_correction_level;
					if ("undefined" !== config.qr_scale) qr_config.scale = config.qr_scale;
					return qr_config;
				}
			}
		}
	},
	
	getNumQrs: function(numKeys, numPieces, config) {
		config = Object.assign({}, IndustrialPieceRenderer.defaultConfig, config);
		return numKeys * numPieces * ((config.public_qr ? 1 : 0) + (config.private_qr ? 1 : 0));
	},
	
	getWeight: function(numKeys, numPieces, config) {
		config = Object.assign({}, IndustrialPieceRenderer.defaultConfig, config);
		return IndustrialPieceRenderer.getNumQrs(numKeys, numPieces, config) * Weights.getQrWeight();
	}
}

/**
 * FAQ page.
 */
function FaqController(div) {
	DivController.call(this, div);
	this.render = function(callback) {
		UiUtils.pageSetup(div);
		
		// render title
		div.append(UiUtils.getPageHeader("FAQ"));
		
		$("<div class='question'>").html("What is the meaning of life?").appendTo(div);
		$("<div class='answer'>").html("42").appendTo(div);
		$("<div class='question'>").html("What is the meaning of life?").appendTo(div);
		$("<div class='answer'>").html("42").appendTo(div);
		$("<div class='question'>").html("What is the meaning of life?").appendTo(div);
		$("<div class='answer'>").html("42").appendTo(div);
		
		// done rendering
		callback(div);
	}
}
inheritsFrom(FaqController, DivController);

/**
 * Donate page.
 */
function DonateController(div) {
	DivController.call(this, div);
	this.render = function(callback) {
		UiUtils.pageSetup(div);
		
		// render title
		div.append(UiUtils.getPageHeader("Donate"));
		
		$("<div class='question'>").html("*heart*");
		
		// done rendering
		callback(div);
	}
}
inheritsFrom(DonateController, DivController);