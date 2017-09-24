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
		
		div.append(getCheckmarkDiv("Generate public/private keys for multiple cryptocurrencies."));
		div.append(getCheckmarkDiv("Private keys can be password protected and split into pieces."));
		div.append(getCheckmarkDiv("Export to digital and printable formats which can be easily recovered."));
		div.append(getCheckmarkDiv("100% open source and free to use.  No registration or trusted third parties."));
		div.append("<br>");
		
		div.append("Select an option to get started.")
		div.append("<br><br>");
		
		// render create button
		if (window.crypto) {
			let btnCreate = UiUtils.getNextButton("Generate new keys").appendTo(div);
			btnCreate.click(function() { onSelectCreate(); });
		} else {
			let btnCreate = UiUtils.getNextButton("Generate new keys (your browser does not support window.crypto)").appendTo(div);
			btnCreate.attr("disabled", "disabled");
		}
		
		// render import button
		let btnExisting = UiUtils.getNextButton("Import existing keys");
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
		if (state.mix) div.append(UiUtils.getPageHeader("Select a currency to generate keys for."));
		else div.append(UiUtils.getPageHeader("Select a currency to import."));
		
		// render mix and match button if creating new storage
		if (state.mix) {
			let btn = UiUtils.getNextButton("Select multiple currencies", UiUtils.getMixLogo()).appendTo(div);
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
		div.append(UiUtils.getPageHeader("Enter the number of keys to generate for each currency.", UiUtils.getMixLogo()));
		
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
			advancedLink.text(advancedOpen ? "\u25be Options" : "\u25b8 Options");
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
		let name = UiUtils.getCryptoName(state);
		let header = name === "mixed" ? "Ready to generate keys for multiple currencies?" : "Ready to generate " + name + " keys?";		
		div.append(UiUtils.getPageHeader(header, UiUtils.getCryptoLogo(state)));
		
		// render summary
		div.append("<b>Summary:</b><br><br>");
		for (let elem of state.mix) {
			div.append(elem.numKeys + " " + elem.plugin.getName() + " keys" + (elem.encryption ? " encrypted with " + elem.encryption : " unencrypted") + "<br>");
		}
		if (state.numPieces > 1) {
			div.append("Split private keys into " + state.numPieces + " pieces with a minimum of " + state.minPieces + " to restore")
		} else {
			div.append("Private keys will not be split")
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
					let pieces = CryptoUtils.keysToPieces(originals, state.numPieces, state.minPieces);
					
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
						let pieces = CryptoUtils.keysToPieces(encryptedKeys, state.numPieces, state.minPieces);
						
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
		let name = UiUtils.getCryptoName(state);
		name = name === "mixed" ? " " : " " + name + " ";
		var title = "Imported " + keys.length + name + " keys which are password protected.  Enter the password to decrypt them.";
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
		let name = UiUtils.getCryptoName(state);
		name = name === "mixed" ? "" : name;
		let header = state.mix ? "Your " + (name ? name : "") + " keys have been generated and are ready to download." : "Your " + (name ? name : "") + " keys have been imported.";
		div.append(UiUtils.getPageHeader(header, UiUtils.getCryptoLogo(state)));
		
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
			configLink.text(configOpen ? "\u25be Options" : "\u25b8 Options");
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
		
		// get pieces
		pieces = pieces ? pieces : CryptoUtils.keysToPieces(state.keys, state.numPieces, state.minPieces);
		
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
//			let previewHeaderLeft = $("<div class='preview_header_left'>").appendTo(previewHeader);
//			let previewHeaderCenter = $("<div class='preview_header_center'>").appendTo(previewHeader);
//			previewHeaderCenter.append("Preview");
//			let previewHeaderRight = $("<div class='preview_header_right'>").appendTo(previewHeader);
//			previewDiv.append("<br><br>");
			
			// add piece pull-down selector
			if (pieceDivs.length > 1) {
				let selector = $("<select class='piece_selector'>").appendTo(previewHeader);
				selector.change(function() {
					currentPieceDiv.empty();
					currentPieceDiv.append(pieceDivs[parseFloat(selector.find(":selected").val())]);
				});
				for (let i = 0; i < pieceDivs.length; i++) {
					let option = $("<option value='" + i + "'>").appendTo(selector);
					option.html("Piece " + (i + 1));
				}
			}
			
			// collect all internal css
			let internalCss = "";
			let internalStyleSheet = getInternalStyleSheet();
			for (let i = 0; i < internalStyleSheet.cssRules.length; i++) {
				internalCss += internalStyleSheet.cssRules[i].cssText + "\n";
			}
			
			// build htmls from piece divs for zip export
			let htmls = [];
			for (let pieceDiv of pieceDivs) {
				let html = $("<html>");
				let head = $("<head>").appendTo(html);
				$("<meta http-equiv='content-type' content='text/html;charset=utf-8'>").appendTo(head);
				let style = $("<style>").appendTo(head);
				style.html(internalCss);
				html.append($("<body>").append(pieceDiv));
				htmls.push(html);
			}
			
			// zip pieces
			CryptoUtils.piecesToZip(pieces, htmls, function(name, blob) {
				
				// register save click
				downloadLink.click(function() { saveAs(blob, name); });
				printLink.click(function() { printDiv(previewDiv, internalCss, "cryptostorage.com"); });
				
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
		div.attr("class", "download_config_div");
		
		// render include public addresses checkbox
		includePublicDiv = $("<div class='download_config_option'>").appendTo(div);
		includePublicCheckbox = $("<input type='checkbox' id='includePublicCheckbox'>").appendTo(includePublicDiv);
		let includePublicCheckboxLabel = $("<label for='includePublicCheckbox'>").appendTo(includePublicDiv);
		includePublicCheckboxLabel.html(" Include public addresses");
		includePublicCheckbox.click(function() { updatePieces(); });
		includePublicCheckbox.prop('checked', true);
	}
	
	function getIncludePublicAddresses() {
		return includePublicCheckbox.prop('checked');
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
		qr_size: 125,
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
		
		// div to render entire piece to
		let pieceDiv = $("<div class='piece_div'>");
		
		// create div per page
		const PAIRS_PER_PAGE = 6;	// TODO: move to configuration

		// setup pages with functions to render key pairs
		let pageDiv;
		let funcs = [];
		for (let i = 0; i < piece.length; i++) {
			
			// render new page
			if (i % PAIRS_PER_PAGE === 0) {
				pageDiv = $("<div class='piece_page_div'>").appendTo(pieceDiv);
				let logoDiv = $("<div class='piece_page_header_div'>").appendTo(pageDiv);
				logoDiv.append($("<img class='piece_page_header_logo' src='" + getLogoData("cryptostorage") + "'>"));
			}
			
			// collect function to render key pair
			let keyDiv = $("<div class='key_div'>").appendTo(pageDiv);
			if (i % PAIRS_PER_PAGE === 0) keyDiv.css("border-top", "2px solid green");
			let plugin = CryptoUtils.getCryptoPlugin(piece[i].crypto);
			let title = "#" + (i + 1);
			let leftLabel = "\u25C4 Public Address";
			let leftValue = piece[i].address;
			let logo = $("<img width=100% height=100% src='" + getLogoData(piece[i].crypto) + "'>");
			let logoLabel = plugin.getName();
			let rightLabel = "Private Key" + (piece[i].isSplit ? " (split)" : piece[i].encryption ? " (encrypted)" : " (unencrypted)") + " \u25ba";
			let rightValue = piece[i].privateKey;
			funcs.push(function(onDone) { renderKeyPair(keyDiv, title, leftLabel, leftValue, logo, logoLabel, rightLabel, rightValue,
				function() {
					onKeyPairDone();
					onDone();
				}
			)});
		}
		
		// render pairs
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
		function renderKeyPair(keyDiv, title, leftLabel, leftValue, logo, logoLabel, rightLabel, rightValue, onDone) {
			
			// left qr code
			let keyDivLeft = $("<div class='key_div_left'>").appendTo(keyDiv);
			
			// center title
			let keyDivCenter = $("<div class='key_div_center'>").appendTo(keyDiv);
			let titleDiv = $("<div class='key_div_center_title'>").appendTo(keyDivCenter);
			titleDiv.html(title);
			
			// center left
			let keyDivCenterLeftLabel = $("<div class='key_div_center_left_label'>").appendTo(keyDivCenter);
			keyDivCenterLeftLabel.html(leftLabel);
			let keyDivCenterLeftValue = $("<div class='key_div_center_left_value'>").appendTo(keyDivCenter);
			if (!hasWhitespace(leftValue)) keyDivCenterLeftValue.css("word-break", "break-all");
			keyDivCenterLeftValue.html(leftValue);
			
			// center logo
			let keyDivCenterLogo = $("<div class='key_div_center_logo'>").appendTo(keyDivCenter);
			let logoDiv = $("<div class='key_div_logo'>").appendTo(keyDivCenterLogo);
			logoDiv.append(logo);
			let logoLabelDiv = $("<div class='key_div_logo_label'>").appendTo(keyDivCenterLogo);
			logoLabelDiv.html("&nbsp;" + logoLabel);
			
			// center right
			let keyDivCenterRightLabel = $("<div class='key_div_center_right_label'>").appendTo(keyDivCenter);
			if (rightValue.length > 150) keyDivCenterRightLabel.css("margin-top", "0");	// extra space for long right labels
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