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
		if (state.mix) return state.mix.length === 1 ? state.mix[0].plugin.getLogo() : this.getMixLogo();
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
	},
	
	// --- relative weights of key generation derived from experimentation and used for representative progress bar ---
	
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
		return 15;
	},
	
	getLogoWeight: function() {
		return 15;
	}
}

/**
 * Encapsulates the creation of a page.
 * 
 * @param div is the div to render the page to
 * @param appController is the application controller for context
 * @param title is the title of the page
 * @param icon is the icon of the page (optional)
 */
function Page(div, appController, title, icon) {
	assertInitialized(appController, "Application controller must be initialized");
	assertInitialized(div, "Page div must be initialized");
	assertInitialized(title, "Page title must be initialized");
	
	// page container setup
	div.empty();
	div.attr("class", "page_container");
	
	let pageDiv = $("<div class='page'>").appendTo(div);
	
	// page header div
	let headerDiv = $("<div class='page_header_div'>").appendTo(pageDiv);
	
	// page header icon and title
	let headerTitleDiv = $("<div class='page_header_title_div'>").appendTo(headerDiv);
	if (icon) {
		let iconDiv = $("<div class='page_header_icon_div'>").appendTo(headerTitleDiv);
		icon.attr("class", "page_header_icon");
		iconDiv.append(icon);
	}
	headerTitleDiv.append(title);
	
	// page content
	let contentDiv = $("<div>").appendTo(pageDiv);
	
	// footer		
	let footerDiv = $("<div class='footer'>").appendTo(div);
	let homeLink = UiUtils.getLink("#", "Home");
	homeLink.click(function() { appController.showHome(); });
	let faqLink = UiUtils.getLink("#faq", "FAQ");
	faqLink.click(function() { appController.showFaq(); });
	let gitHubLink = $("<a target='_blank' href='https://github.com/cryptostorage/cryptostorage.com'>");
	gitHubLink.html("GitHub");
	let donateLink = UiUtils.getLink("#donate", "Donate");
	donateLink.click(function() { appController.showDonate(); });
	footerDiv.append(homeLink);
	footerDiv.append("&nbsp;&nbsp;|&nbsp;&nbsp;");
	footerDiv.append(faqLink);
	footerDiv.append("&nbsp;&nbsp;|&nbsp;&nbsp;");
	footerDiv.append(gitHubLink);
	footerDiv.append("&nbsp;&nbsp;|&nbsp;&nbsp;");
	footerDiv.append(donateLink);
	
	this.getContentDiv = function() {
		return contentDiv;
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
 * Main application flow to generate and import keys.
 */
function FlowController(flowDiv, appController) {
	DivController.call(this, flowDiv);
	
	const TRANSITION_DURATION = 200;	// time to transition pages
	
	let state;	// main application state
	let that = this;
	let pathTracker = new PathTracker(onPageChange, onPagesRemoved);
	let transitioning = false;
	let leftArrowDiv;									// container for left arrow
	let leftArrow;										// left navigation arrow
	let leftArrowDisabled;								// left navigation arrow when navigation disabled
	let rightArrowDiv;									// container for right arrow
	let rightArrow;										// right navigation arrow
	let rightArrowDisabled;								// right navigation arrow when navigation disabled
	
	// --------------------------------- PUBLIC ---------------------------------
	
	this.render = function(onDone) {
		
		// initialize state
		initState();
		
		// add navigation bar
		let navDiv = $("<div class='nav_div'>").appendTo(flowDiv);
		leftArrowDiv = $("<div class='left_arrow_div'>").appendTo(navDiv);
		leftArrowDiv.hide();
		leftArrow = $("<img class='nav_arrow left_arrow' src='img/closed_arrow.png'>").appendTo(leftArrowDiv);
		leftArrow.click(function() { pathTracker.prev(); });
		leftArrowDisabled = $("<img class='nav_arrow_disabled left_arrow' src='img/closed_arrow_grey.png'>");
		rightArrowDiv = $("<div class='right_arrow_div'>").appendTo(navDiv);
		rightArrowDiv.hide();
		rightArrow = $("<img class='nav_arrow right_arrow' src='img/closed_arrow.png'>").appendTo(rightArrowDiv);
		rightArrow.click(function() { pathTracker.next(); });
		rightArrowDisabled = $("<img class='nav_arrow_disabled right_arrow' src='img/closed_arrow_grey.png'>");
		
		// start at home page
		set(new PageControllerHome($("<div>"), appController, onSelectCreate, onSelectImport), onDone);
	}
	
	this.clearNexts = function() {
		pathTracker.clearNexts();
	}
	
	this.getState = function() {
		return state;
	}
	
	// --------------------------------- PRIVATE ---------------------------------
	
	function initState() {
		state = {};
		state.plugins = CryptoUtils.getCryptoPlugins();
		state.flowController = that;
	}
	
	function set(renderer, onDone) {
		transitioning = false;
		renderer.render(function(div) {
			pathTracker.clear();
			pathTracker.next(renderer);
			if (onDone) onDone();
		});
	}
	
	function next(renderer, onDone) {
		if (transitioning) return;	// cannot add page if transitioning
		transitioning = true;
		renderer.render(function(div) {
			pathTracker.next(renderer);
			if (onDone) onDone();
		});
	}
	
	function append(renderer, onDone) {
		if (transitioning) return;	// cannot add page if transitioning
		transitioning = true;
		renderer.render(function(div) {
			pathTracker.append(renderer);
			if (onDone) onDone();
		});
	}
	
	function onPagesRemoved(renderers) {
		for (let renderer of renderers) {
			renderer.getDiv().remove();
			if (renderer.decommission) renderer.decommission();
		}
		updateArrows();
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
			flowDiv.append(renderer.getDiv());
		}
		
		// handle non-first page change
		else if (lastIdx !== curIdx) {
			
			// get last and soon-to-be current div
			let lastDiv = pathTracker.getItems()[lastIdx].getDiv();
			let curDiv = pathTracker.getItems()[curIdx].getDiv();
			
			// set up page to be rendered
			curDiv.hide();
			flowDiv.append(curDiv);
			
			// animate next
			if (lastIdx < curIdx) {
				lastDiv.css("opacity", 1);
				curDiv.css("opacity", 0);
				lastDiv.animate({left:'-15%', opacity:0}, TRANSITION_DURATION, function() { lastDiv.hide(); });
				curDiv.animate({left:'15%'}, 0, function() { curDiv.show(); });
				curDiv.animate({left:'0px', opacity:1}, TRANSITION_DURATION, function() { transitioning = false; renderer.onShow(); });
			}
			
			// animate previous
			else {
				lastDiv.css("opacity", 1);
				curDiv.css("opacity", 0);
				lastDiv.animate({left:'15%', opacity:0}, TRANSITION_DURATION, function() { lastDiv.hide(); });
				curDiv.animate({left:'-15%'}, 0, function() { curDiv.show(); });
				curDiv.animate({left:'0px', opacity:1}, TRANSITION_DURATION, function() { transitioning = false; renderer.onShow(); });
			}
		}
		
		updateArrows();
	}
	
	function updateArrows() {
		pathTracker.hasPrev() ? leftArrowDiv.show() : leftArrowDiv.hide();
		pathTracker.hasNext() ? rightArrowDiv.show() : rightArrowDiv.hide();
	}

	// ------------------------------ CREATE NEW --------------------------------
	
	function onSelectCreate() {
		if (DEBUG) console.log("onSelectCreate()");
		initState();
		state.mix = [];	// fill out mix to create as we go
		next(new PageControllerSelectCrypto($("<div>"), appController, onSelectCryptoCreate));
	}
	
	function onSelectCryptoCreate(selection) {
		if (DEBUG) console.log("onSelectCrypto(" + selection + ")");
		if (selection === "MIX") {
			next(new PageControllerNumKeysMix($("<div>"), appController, onMixNumKeysInput))
		} else {
			state.mix = [{plugin: CryptoUtils.getCryptoPlugin(selection)}];
			next(new PageControllerNumKeysSingle($("<div>"), appController, onNumKeysInput));
		}
	}
	
	function onMixNumKeysInput() {
		if (DEBUG) console.log("onMixNumKeysInput()");
		next(new PageControllerPasswordSelection($("<div>"), appController, onPasswordSelection))
	}
	
	function onNumKeysInput(numKeys) {
		if (DEBUG) console.log("onNumKeysInput(" + numKeys + ")");
		assertInt(numKeys);
		state.mix[0].numKeys = numKeys;
		next(new PageControllerPasswordSelection($("<div>"), appController, onPasswordSelection))
	}
	
	function onPasswordSelection(passwordEnabled) {
		if (DEBUG) console.log("onPasswordSelection(" + passwordEnabled + ")");
		state.passwordEnabled = passwordEnabled;
		if (passwordEnabled) next(new PageControllerPasswordInput($("<div>"), appController, onPasswordInput));
		else {
			for (let elem of state.mix) elem.encryption = null;
			next(new PageControllerSplitSelection($("<div>"), appController, onSplitSelection));
		}
	}
	
	function onPasswordInput() {
		if (DEBUG) console.log("onPasswordInput()");
		next(new PageControllerSplitSelection($("<div>"), appController, onSplitSelection));
	}
	
	function onSplitSelection(splitEnabled) {
		if (DEBUG) console.log("onSplitSelection(" + splitEnabled + ")");
		state.splitEnabled = splitEnabled;
		if (splitEnabled) next(new PageControllerSplitInput($("<div>"), appController, onSplitInput));
		else {
			state.numPieces = 1;
			delete state.minPieces;
			next(new PageControllerGenerateKeys($("<div>"), appController, onKeysGenerated));
		}
	}
	
	function onSplitInput(numPieces, minPieces) {
		if (DEBUG) console.log("onSplitInput(" + numPieces + ", " + minPieces + ")");
		assertInt(numPieces);
		assertInt(minPieces);
		state.numPieces = numPieces;
		state.minPieces = minPieces;
		next(new PageControllerGenerateKeys($("<div>"), appController, onKeysGenerated));
	}
	
	function onKeysGenerated(keys, pieces, pieceDivs) {
		if (DEBUG) console.log("onKeysGenerated(" + keys.length + ")");
		assertTrue(keys.length > 0);
		assertEquals(state.numPieces, pieces.length);
		state.keys = keys;
		state.pieces = pieces;
		state.pieceDivs = pieceDivs;
		append(new PageControllerExport($("<div>"), appController));
	}
	
	// ------------------------------ RESTORE --------------------------------
	
	function onSelectImport() {
		if (DEBUG) console.log("onSelectImport()");
		initState();
		next(new PageControllerImportFiles($("<div>"), appController, onKeysImported, onSelectImportText));
	}
	
	function onSelectImportText() {
		if (DEBUG) console.log("onSelectImportText()");
		delete state.pieceDivs;
		next(new PageControllerSelectCrypto($("<div>"), appController, onSelectCryptoImport));
	}
	
	function onSelectCryptoImport(tickerSymbol) {
		if (DEBUG) console.log("onSelectCryptoImport(" + tickerSymbol + ")");
		for (let plugin of state.plugins) {
			if (plugin.getTicker() === tickerSymbol) state.plugin = plugin;
		}
		if (!state.plugin) throw new Error("plugin not found with ticker symbol: " + tickerSymbol);
		next(new PageControllerImportText($("<div>"), appController, onKeysImported));
	}
	
	function onKeysImported(keys, pieces, pieceDivs) {
		if (DEBUG) console.log("onKeysImported(" + keys.length + " keys)");
		assertTrue(keys.length >= 1);
		state.keys = keys;
		state.pieces = pieces;
		state.pieceDivs = pieceDivs;
		if (keys[0].getWif() && keys[0].isEncrypted()) next(new PageControllerDecryptKeys($("<div>"), appController, onKeysImported));
		else {
			append(new PageControllerExport($("<div>"), appController));
		}
	}
}
inheritsFrom(FlowController, DivController);

/**
 * Render home page.
 */
function PageControllerHome(div, appController, onSelectCreate, onSelectImport) {
	DivController.call(this, div);
	this.render = function(callback) {
		let page = new Page(div, appController, "Welcome to cryptostorage.com");
		
		let contentDiv = page.getContentDiv();
		contentDiv.append(getCheckmarkDiv("Generate public/private keys for multiple cryptocurrencies."));
		contentDiv.append(getCheckmarkDiv("Private keys can be password protected and split into pieces."));
		contentDiv.append(getCheckmarkDiv("Export to digital and printable formats which can be easily recovered."));
		contentDiv.append(getCheckmarkDiv("100% open source and free to use.  No registration or trusted third parties."));
		contentDiv.append("<br>");
		
		contentDiv.append("Select an option to get started.")
		contentDiv.append("<br><br>");
		
		// render create button
		if (window.crypto) {
			let btnCreate = UiUtils.getNextButton("Generate new keys").appendTo(contentDiv);
			btnCreate.click(function() { onSelectCreate(); });
		} else {
			let btnCreate = UiUtils.getNextButton("Generate new keys (your browser does not support window.crypto)").appendTo(contentDiv);
			btnCreate.attr("disabled", "disabled");
		}
		
		// render import button
		let btnExisting = UiUtils.getNextButton("Import existing keys");
		btnExisting.click(function() { onSelectImport(); });
		contentDiv.append(btnExisting);
		
//		// render create crypto-cash button
//		var btnCreateCash = UiUtils.getNextButton("Create crypto-cash (coming soon)");
//		contentDiv.append(btnCreateCash);
		
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
inheritsFrom(PageControllerHome, DivController);

/**
 * Render crypto selection.
 */
function PageControllerSelectCrypto(div, appController, onCryptoSelection) {
	DivController.call(this, div);
	let state = appController.getMainState();
	this.render = function(callback) {
		
		// page setup
		let title = state.mix ? "Select currencies to generate keys for." : "Select a currency to import.";
		let page = new Page(div, appController, title);
		let contentDiv = page.getContentDiv();
		
		// render mix and match button if creating new storage
		if (state.mix) {
			let btn = UiUtils.getNextButton("Select multiple currencies", UiUtils.getMixLogo()).appendTo(contentDiv);
			btn.click(function() { onCryptoSelection("MIX"); });
		}
		
		// render crypto buttons
		for (let plugin of state.plugins) {
			let btn = UiUtils.getNextButton(plugin.getName(), plugin.getLogo()).appendTo(contentDiv);
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
inheritsFrom(PageControllerSelectCrypto, DivController);

/**
 * Render mixed num keys input.
 * 
 * Modifies state.mix and invokes onMixNumKeysInput() on input.
 */
function PageControllerNumKeysMix(div, appController, onMixNumKeysInput) {
	DivController.call(this, div);
	let errorDiv = $("<div>");
	let numKeysInputs;
	let state = appController.getMainState();
	
	this.render = function(callback) {
		
		// page setup
		let page = new Page(div, appController, "Enter the number of keys to generate.", UiUtils.getCryptoLogo(state));
		let contentDiv = page.getContentDiv();
		
		// render num key inputs
		numKeysInputs = [];
		for (let plugin of state.plugins) {
			let numKeysDiv = $("<div class='crypto_num_keys_div'>").appendTo(contentDiv);
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
		
		// add error contentDiv
		errorDiv.attr("class", "error_msg");
		setErrorMessage("");
		contentDiv.append(errorDiv);
		
		// next button
		let btnNext = UiUtils.getNextButton("Next").appendTo(contentDiv);
		
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
						if (numKeysInt > 0) loader.load(state.plugins[i].getDependencies());	// start loading dependencies
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
inheritsFrom(PageControllerNumKeysMix, DivController);

/**
 * Render number of keys.
 * 
 * Invokes onNumKeysInput(numKeys) when done.
 */
function PageControllerNumKeysSingle(div, appController, onNumKeysInput) {
	DivController.call(this, div);
	var errorDiv = $("<div>");
	let state = appController.getMainState();
	
	this.render = function(callback) {
		
		// page setup
		let page = new Page(div, appController, "Enter the number of keys to generate.", UiUtils.getCryptoLogo(state));
		let contentDiv = page.getContentDiv();
		
		// num key keys input
		let numKeysInput = $("<input>");
		numKeysInput.attr("class", "num_input");
		numKeysInput.attr("type", "number");
		numKeysInput.attr("min", 1);
		numKeysInput.attr("value", 10);
		contentDiv.append(numKeysInput);
		contentDiv.append("<br><br>");
		numKeysInput.keypress(function() { state.flowController.clearNexts(); });
		
		// error message
		errorDiv.attr("class", "error_msg");
		setErrorMessage("");
		contentDiv.append(errorDiv);
		
		// next button
		let btnNext = UiUtils.getNextButton("Next").appendTo(contentDiv);
		
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
inheritsFrom(PageControllerNumKeysSingle, DivController);

/**
 * Render password selection page.
 */
function PageControllerPasswordSelection(div, appController, onPasswordSelection) {
	DivController.call(this, div);
	let state = appController.getMainState();
	
	this.render = function(callback) {
		
		// page setup
		let page = new Page(div, appController, "Do you want to password protect your private keys?", UiUtils.getCryptoLogo(state));
		let contentDiv = page.getContentDiv();
		
		var btnYes = UiUtils.getNextButton("Yes (recommended)");
		btnYes.click(function() { onPasswordSelection(true); });
		contentDiv.append(btnYes);
		var btnNo = UiUtils.getNextButton("No");
		btnNo.click(function() { onPasswordSelection(false); });
		contentDiv.append(btnNo);
		
		// done rendering
		callback(div);
	}
}
inheritsFrom(PageControllerPasswordSelection, DivController);

/**
 * Render password input page.
 * 
 * @param div is the div to render to
 * @param state is updated with the new password configuration
 */
function PageControllerPasswordInput(div, appController, onPasswordInput) {
	DivController.call(this, div);
	var passwordInput;	// for later focus on show
	var errorDiv = $("<div>");
	let advancedOpen;
	let state = appController.getMainState();
	
	this.render = function(callback) {
		
		// page setup
		let page = new Page(div, appController, "Enter a password to protect your private keys.", UiUtils.getCryptoLogo(state));
		let contentDiv = page.getContentDiv();
		
		contentDiv.append("The password must be at least 6 characters long.");
		contentDiv.append("<br><br>");
		
		// render error contentDiv
		contentDiv.append(errorDiv);
		errorDiv.attr("class", "error_msg");
		errorDiv.hide();
		contentDiv.append(errorDiv);
		
		// render password input
		contentDiv.append("Password: ");
		passwordInput = $("<input type='text'>");
		passwordInput.attr("class", "text_input");
		contentDiv.append(passwordInput);
		contentDiv.append("<br><br>");
		passwordInput.keypress(function() { state.flowController.clearNexts(); });
		
		// render advanced link
		let advancedLink = $("<div class='mock_link'>").appendTo(contentDiv);
		advancedLink.click(function() { toggleAdvanced(); });
		function toggleAdvanced() {
			advancedOpen = !advancedOpen;
			advancedLink.text(advancedOpen ? "\u25be Options" : "\u25b8 Options");
			advancedOpen ? advancedDiv.show() : advancedDiv.hide();
		}
		
		// render each encryption selection contentDiv
		let advancedDiv = $("<div>").appendTo(contentDiv);
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
		
		// only render advanced contentDiv if options exist
		if (!options) advancedLink.hide();
		
		// render next button
		contentDiv.append("<br>");
		var btnNext = UiUtils.getNextButton("Next").appendTo(contentDiv);
		btnNext.click(function() {
			let password = passwordInput.val();
			let err;
			if (password === "") err = "Password cannot be empty";
			else if (password.length < 6) err = "Password must be at least 6 characters";
			else {
				setErrorMessage("");
				for (let i = 0; i < state.mix.length; i++) {
					state.mix[i].password = passwordInput.val();
					state.mix[i].encryption = encryptionSelectors[i] ? encryptionSelectors[i].getSelection() : state.mix[i].plugin.getEncryptionSchemes()[0];
				}
				onPasswordInput();
			}
			if (err) {
				setErrorMessage(err);
				passwordInput.focus();
			}
		});
		
		// register pasword enter key
		passwordInput.keyup(function(e) {
			let code = e.which;
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
inheritsFrom(PageControllerPasswordInput, DivController);

/**
 * Render split selection page.
 */
function PageControllerSplitSelection(div, appController, onSplitSelection) {
	DivController.call(this, div);
	let state = appController.getMainState();
	
	this.render = function(callback) {
		
		// page setup
		let page = new Page(div, appController, "Do you want to split your private keys into separate pieces?", UiUtils.getCryptoLogo(state));
		let contentDiv = page.getContentDiv();
		
		contentDiv.append("The pieces must be recombined to recover all private keys.");
		contentDiv.append("<br><br>");
		
		var btnYes = UiUtils.getNextButton("Yes").appendTo(contentDiv);
		btnYes.click(function() { onSplitSelection(true); });
		var btnNo = UiUtils.getNextButton("No").appendTo(contentDiv);
		btnNo.click(function() { onSplitSelection(false); });
		
		// done rendering
		callback(div);
	}
}
inheritsFrom(PageControllerSplitSelection, DivController);

/**
 * Number of pieces input page.
 */
function PageControllerSplitInput(div, appController, onPiecesInput) {
	DivController.call(this, div);
	let errorDiv = $("<div>");
	let state = appController.getMainState();
	
	this.render = function(callback) {
		
		// page setup
		let page = new Page(div, appController, "Enter the number of pieces to split your storage into.", UiUtils.getCryptoLogo(state));
		let contentDiv = page.getContentDiv();
		
		contentDiv.append("Number of pieces: ");
		var numPiecesInput = $("<input type='number'>");
		numPiecesInput.attr("class", "num_input");
		numPiecesInput.attr("value", 3);
		numPiecesInput.attr("min", 2);
		contentDiv.append(numPiecesInput);
		contentDiv.append("<br><br>");
		numPiecesInput.keypress(function() { state.flowController.clearNexts(); });
		
		contentDiv.append("Number of pieces necessary to restore private keys: ");
		var minPiecesInput = $("<input type='number'>");
		minPiecesInput.attr("min", 2);
		minPiecesInput.attr("class", "num_input");
		minPiecesInput.attr("value", 2);
		contentDiv.append(minPiecesInput);
		contentDiv.append("<br><br>");
		minPiecesInput.keypress(function() { state.flowController.clearNexts(); });
		
		// error message
		errorDiv.empty();
		errorDiv.attr("class", "error_msg");
		setErrorMessage("");
		contentDiv.append(errorDiv);
		
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
		contentDiv.append(btnNext);
		
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
inheritsFrom(PageControllerSplitInput, DivController);

/**
 * Summarize and generate keys, piece, and piece divs.
 * 
 * @param div is the div to render to
 * @param appController is application context
 * @param onKeysGenerated(keys, pieces, pieceDivs) is invoked after generation
 */
function PageControllerGenerateKeys(div, appController, onKeysGenerated) {
	DivController.call(this, div);
	
	let decommissioned = false;
	let state = appController.getMainState();
	let progressDiv;
	let progressBar;
	
	this.decommission = function() {
		console.log("PageControllerGenerateKeys.decommission()");
		decommissioned = true;
	}
	
	this.render = function(callback) {
		
		// page setup
		let page = new Page(div, appController, "Ready to generate your keys?", UiUtils.getCryptoLogo(state));
		let contentDiv = page.getContentDiv();
		
		// render summary
		contentDiv.append("<b>Summary:</b><br><br>");
		for (let elem of state.mix) {
			contentDiv.append(elem.numKeys + " " + elem.plugin.getName() + " keys" + (elem.encryption ? " encrypted with " + elem.encryption : " unencrypted") + "<br>");
		}
		if (state.numPieces > 1) {
			contentDiv.append("Split private keys into " + state.numPieces + " pieces with a minimum of " + state.minPieces + " to restore")
		} else {
			contentDiv.append("Private keys will not be split")
		}
		contentDiv.append("<br><br>");
		
		// render generate button
		var btnGenerate = UiUtils.getNextButton("Generate keys");
		btnGenerate.click(function() {
			btnGenerate.attr("disabled", "disabled");
			state.flowController.clearNexts();
			generateKeys(function(keys, pieces, pieceDivs) {
				btnGenerate.removeAttr("disabled");
				if (!decommissioned) onKeysGenerated(keys, pieces, pieceDivs);
			});
		});
		contentDiv.append(btnGenerate);
		
		// add progress bar
		progressDiv = $("<div>").appendTo(contentDiv);
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
				totalWeight += elem.numKeys * UiUtils.getCreateKeyWeight();
				if (elem.encryption) totalWeight += elem.numKeys * (UiUtils.getEncryptWeight(elem.encryption) + (VERIFY_ENCRYPTION ? UiUtils.getDecryptWeight(elem.encryption) : 0));
			}
			let piecesRendererWeight = PieceRenderer.getPieceWeight(numKeys, state.numPieces, null);
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
			setProgress(progressWeight, totalWeight, "Generating keys");
			async.series(funcs, function(err, keys) {
				if (decommissioned) {
					onKeysGenerated();
					return;
				}
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
						if (decommissioned) {
							onKeysGenerated();
							return;
						}
						if (err) throw err;
						
						// convert keys to pieces
						let pieces = CryptoUtils.keysToPieces(encryptedKeys, state.numPieces, state.minPieces);
						
						// validate pieces can recreate originals
						let keysFromPieces = CryptoUtils.piecesToKeys(pieces);
						assertEquals(encryptedKeys.length, keysFromPieces.length);
						for (let i = 0; i < encryptedKeys.length; i++) {
							assertTrue(encryptedKeys[i].equals(keysFromPieces[i]));
						}
						
						// verify encryption
						if (VERIFY_ENCRYPTION) {
							
							// collect decryption functions
							funcs = [];
							for (let i = 0; i < encryptedKeys.length; i++) {
								funcs.push(decryptFunc(encryptedKeys[i].copy(), passwords[i]));
							}
							
							// decrypt keys
							setProgress(progressWeight, totalWeight, "Verifying encryption");
							async.series(funcs, function(err, decryptedKeys) {
								if (decommissioned) {
									onKeysGenerated();
									return;
								}
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
								});
							});
						}
						
						// don't verify encryption
						else {
							
							// render pieces to divs
							setProgress(progressWeight, totalWeight, "Rendering");
							renderPieceDivs(pieces, function(err, pieceDivs) {
								if (err) throw err;
								assertEquals(pieces.length, pieceDivs.length);
								setProgress(1, 1, "Complete");
								onKeysGenerated(encryptedKeys, pieces, pieceDivs);
							});
						}
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
					if (decommissioned) {
						callback();
						return;
					}
					setTimeout(function() {
						let key = plugin.newKey();
						progressWeight += UiUtils.getCreateKeyWeight();
						setProgress(progressWeight, totalWeight);
						callback(null, key);
					}, 0);	// let UI breath
				}
			}
			
			function encryptFunc(key, scheme, password) {
				return function(callback) {
					if (decommissioned) {
						callback();
						return;
					}
					key.encrypt(scheme, password, function(err, key) {
						progressWeight += UiUtils.getEncryptWeight(scheme);
						setProgress(progressWeight, totalWeight);
						setTimeout(function() { callback(err, key); }, 0);	// let UI breath
					});
				}
			}
			
			function decryptFunc(key, password) {
				return function(callback) {
					if (decommissioned) {
						callback();
						return;
					}
					let scheme = key.getEncryptionScheme();
					key.decrypt(password, function(err, key) {
						progressWeight += UiUtils.getDecryptWeight(scheme);
						setProgress(progressWeight, totalWeight);
						setTimeout(function() { callback(err, key); }, 0);	// let UI breath
					});
				}
			}
			
			function renderPieceDivs(pieces, onDone) {
				PieceRenderer.renderPieces(null, pieces, null, function(percent) {
					setProgress(progressWeight + (percent * piecesRendererWeight), totalWeight);
				}, onDone);
			}
		});
	}
}
inheritsFrom(PageControllerGenerateKeys, DivController);

/**
 * Render page to import private components from text.
 */
function PageControllerImportText(div, appController, onKeysImported) {
	DivController.call(this, div);
	let state = appController.getMainState();
	let errorDiv = $("<div>");
	let lastInputs = [];
	let textarea;
	
	this.render = function(callback) {
		
		// page setup
		let page = new Page(div, appController, "Enter " + state.plugin.getName() + " private key or pieces:", state.plugin.getLogo());
		let contentDiv = page.getContentDiv();
		
		// render error contentDiv
		errorDiv.empty();
		errorDiv.attr("class", "error_msg");
		setErrorMessage("");
		contentDiv.append(errorDiv);
		
		// render textarea input
		textarea = $("<textarea>");
		contentDiv.append(textarea);
		textarea.on('input', function() {
			
			// load dependencies
			let dependencies = new Set(COMMON_DEPENDENCIES);
			for (let dependency of state.plugin.getDependencies()) dependencies.add(dependency);
			loader.load(Array.from(dependencies), function() {
				
				// only continue if new inputs
				let inputs = getTokens(textarea.val());
				if (arraysEqual(inputs, lastInputs)) return;
				lastInputs = inputs;
				
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
inheritsFrom(PageControllerImportText, DivController);

/**
 * Render page to decrypt keys.
 * 
 * @param div is the div to render to
 * @param state.keys are the keys to decrypt
 * @param onKeysDecrypted(keys, pieces, pieceDivs) when done
 */
function PageControllerDecryptKeys(div, appController, onKeysDecrypted) {
	DivController.call(this, div);
	let state = appController.getMainState();
	let keys = state.keys;
	let passwordInput;
	let progressDiv
	let progressBar;
	let decommissioned = false;
	
	this.decommission = function() {
		if (DEBUG) console.log("PageControllerDecryptKeys.decommission()");
		decommissioned = true;
	}
	
	this.render = function(callback) {
		
		// page setup
		let name = UiUtils.getCryptoName(state);
		name = name === "mixed" ? " " : " " + name + " ";
		var title = "Imported " + keys.length + name + " keys which are password protected.  Enter the password to decrypt them.";
		let page = new Page(div, appController, title, UiUtils.getCryptoLogo(state));
		let contentDiv = page.getContentDiv();
		
		// add error contentDiv
		contentDiv.append(errorDiv);
		errorDiv.attr("class", "error_msg");
		errorDiv.hide();
		contentDiv.append(errorDiv);
		
		// add password input
		contentDiv.append("Password: ");
		passwordInput = $("<input type='text'>");
		passwordInput.attr("class", "text_input");

		contentDiv.append(passwordInput);
		contentDiv.append("<br><br>");
		
		// add decrypt button
		let btnDecrypt = UiUtils.getButton("Decrypt").appendTo(contentDiv);
		btnDecrypt.click(function() {
			setErrorMessage("");
			btnDecrypt.attr("disabled", "disabled");
			state.flowController.clearNexts();
			decrypt(function(err, pieces, pieceDivs) {
				if (err) {
					setErrorMessage(err.message);
					passwordInput.focus();
					btnDecrypt.removeAttr("disabled");
					progressDiv.hide();
				} else {
					if (!decommissioned) onKeysDecrypted(keys, pieces, pieceDivs);
				}
			});
		});
		
		// add progress bar
		progressDiv = $("<div>").appendTo(contentDiv);
		progressDiv.hide();
		progressBar = UiUtils.getProgressBar(progressDiv.get(0));
		
		// done rendering
		callback(div);
		
		function decrypt(onDone) {
			
			// get passwords
			var password = passwordInput.val();
			if (password === "") {
				onDone(new Error("Password must not be blank"));
				return;
			}
			
			// compute total weight for progress bar
			let totalWeight = 0;
			for (let key of keys) {
				totalWeight += UiUtils.getDecryptWeight(key.getEncryptionScheme());
			}
			let piecesRendererWeight = PieceRenderer.getPieceWeight(keys.length, 1, null);
			totalWeight += piecesRendererWeight;
			
			// decrypt keys
			let funcs = [];
			for (let key of keys) funcs.push(decryptFunc(key, password));
			let progressWeight = 0;
			setProgress(progressWeight, totalWeight, "Decrypting");
			async.series(funcs, function(err, result) {
				if (decommissioned) {
					onDone();
					return;
				}
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
					if (decommissioned) {
						callback();
						return;
					}
					let scheme = key.getEncryptionScheme();
					key.decrypt(password, function(err, key) {
						if (err) callback(err);
						else {
							progressWeight += UiUtils.getDecryptWeight(scheme);
							setProgress(progressWeight, totalWeight);
							setTimeout(function() { callback(err, key); }, 0);	// let UI breath
						}
					});
				}
			}
			
			function renderPieceDivs(pieces, onDone) {
				PieceRenderer.renderPieces(null, pieces, null, function(percent) {
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
inheritsFrom(PageControllerDecryptKeys, DivController);

/**
 * Render import files page.
 * 
 * @param div is the div to render to
 * @param onKeysImported is invoked when keys are extracted from uploaded files
 * @param onSelectImportText is invoked if the user prefers to import a private key from text
 */
function PageControllerImportFiles(div, appController, onKeysImported, onSelectImportText) {
	DivController.call(this, div);
	
	this.render = function(callback) {
		
		// page setup
		let page = new Page(div, appController, "Import zip or json files created from this site.");
		let contentDiv = page.getContentDiv();
		
		// add error contentDiv
		contentDiv.append(errorDiv);
		
		// add upload button
		var input = $("<input type='file' multiple>").appendTo(contentDiv);
		input.change(function() { onFilesImported($(this).get(0).files); });
		contentDiv.append("<br><br>");
		
		// add file list contentDiv
		contentDiv.append(fileList);
		
		// add button to import from text
		contentDiv.append("<br><br>");
		var btnImportText = UiUtils.getNextButton("Import private key from text instead").appendTo(contentDiv);
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
		callback(div);
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
		for (let pieceKey of pieces[0].keys) cryptos.add(pieceKey.ticker);
		
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
inheritsFrom(PageControllerImportFiles, DivController);

/**
 * Page to view and save pieces.
 * 
 * @param div is the div to render to
 * @param state is the current application state to render
 */
function PageControllerExport(div, appController) {
	DivController.call(this, div);
	
	let state = appController.getMainState();
	assertTrue(state.keys.length > 0);
	
	// config elements
	let hidePublicCheckbox;
	
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
		
		// page setup
		let name = UiUtils.getCryptoName(state);
		name = name === "mixed" ? "" : name;
		let header = state.mix ? "Your keys are ready to save." : "Your keys have been imported.";
		let page = new Page(div, appController, header);
		let contentDiv = page.getContentDiv();
		
		// center page contents
		contentDiv.attr("style", "display:flex; flex-direction:column; align-items:center;");
		
		// put page contents in container to share width
		let container = $("<div class='save_container'>").appendTo(contentDiv);
		contentDiv = container;
		
		// add save header
		let exportHeader = $("<div class='export_header'>").appendTo(contentDiv);
		let exportHeaderLeft = $("<div class='export_header_left'>").appendTo(exportHeader);
		let exportHeaderRight = $("<div class='export_header_right'>").appendTo(exportHeader);
		
		// add config link (closed by default)
		let configLink = $("<div class='mock_link'>").appendTo(exportHeaderLeft);
		let configDiv = $("<div>").appendTo(contentDiv);
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

		// add config contentDiv
		renderConfig(configDiv);
		
		// add preview contentDiv
		contentDiv.append("<br>");
		previewDiv = $("<div class='preview_div'>").appendTo(contentDiv);
		updatePieces(state.pieces, state.pieceDivs, function(err) {
			if (err) throw err;
		});
		
		// rendering of page is complete even if pieces are still rendering
		if (onDone) onDone(div);
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
		
		// set up preview
		previewDiv.empty();
		
		// add progress bar
		progressDiv = $("<div>").appendTo(previewDiv);
		progressDiv.hide();
		progressBar = UiUtils.getProgressBar(progressDiv.get(0));
		
		// add preview header and current piece div
		let previewHeader = $("<div class='preview_header'>").appendTo(previewDiv);
		currentPieceDiv = $("<div class='current_piece_div'>").appendTo(previewDiv);
		
		// get pieces
		let alreadyRendered = isInitialized(pieces) && isInitialized(pieceDivs);
		pieces = pieces ? pieces : CryptoUtils.keysToPieces(state.keys, state.numPieces, state.minPieces);
		
		// set up piece divs and attach first to preview
		if (!pieceDivs) {
			pieceDivs = [];
			for (let i = 0; i < pieces.length; i++) pieceDivs.push($("<div>"));
		}
		currentPieceDiv.append(pieceDivs[0]);
		
		// add piece selector to preview header
		if (pieces.length > 1) {
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
		
		// handle already rendered pieces
		if (alreadyRendered) {
			piecesUpdated(pieces, pieceDivs, function() { if (onDone) onDone(null, pieces, pieceDivs); });
			return;
		}
		
		// render pieces
		PieceRenderer.renderPieces(pieceDivs, pieces, getConfig(), function(percent) {
			setProgress(percent);
		}, function(err) {
			progressDiv.hide();
			if (err) {
				if (onDone) onDone(err);
			} else {
				piecesUpdated(pieces, pieceDivs, function() { if (onDone) onDone(null, pieces, pieceDivs); });
			}
		});
		
		function setProgress(percent, label) {
			progressDiv.show();
			progressBar.set(percent);
			if (label) progressBar.setText(label);
		}
		
		// update print and download links
		function piecesUpdated(pieces, pieceDivs, onDone) {
			assertTrue(pieces.length > 0 && pieceDivs.length > 0);
			
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
				html.append($("<body>").append(pieceDiv.clone()));
				htmls.push(html);
			}
			
			// zip pieces
			CryptoUtils.piecesToZip(pieces, htmls, function(name, blob) {
				
				// register save click
				downloadLink.click(function() { saveAs(blob, name); });
				printLink.click(function() { printDiv(previewDiv, internalCss, "cryptostorage.com"); });
				
				// enable print and download links
				printLink.removeAttr("disabled");
				downloadLink.removeAttr("disabled");
				
				// done
				if (onDone) onDone();
			});
		}
	}
	
	function renderConfig(div) {
		
		// placement
		div.attr("class", "export_options_div");
		
		// render include public addresses checkbox
		hidePublicDiv = $("<div class='export_option'>").appendTo(div);
		hidePublicCheckbox = $("<input type='checkbox' id='hidePublicCheckbox'>").appendTo(hidePublicDiv);
		let hidePublicCheckboxLabel = $("<label for='hidePublicCheckbox'>").appendTo(hidePublicDiv);
		hidePublicCheckboxLabel.html(" Hide public addresses in HTML export");
		hidePublicCheckbox.click(function() {
			if (getHidePublic()) hidePrivateCheckbox.attr("disabled", "disabled");
			else hidePrivateCheckbox.removeAttr("disabled");
			updatePieces();
		});
		hidePublicCheckbox.prop('checked', false);
		
		// render include private key checkbox
		hidePrivateDiv = $("<div class='export_option'>").appendTo(div);
		hidePrivateCheckbox = $("<input type='checkbox' id='hidePrivateCheckbox'>").appendTo(hidePrivateDiv);
		let hidePrivateCheckboxLabel = $("<label for='hidePrivateCheckbox'>").appendTo(hidePrivateDiv);
		hidePrivateCheckboxLabel.html(" Hide private keys in HTML export");
		hidePrivateCheckbox.click(function() {
			if (getHidePrivate()) hidePublicCheckbox.attr("disabled", "disabled");
			else hidePublicCheckbox.removeAttr("disabled");
			updatePieces();
		});
		hidePrivateCheckbox.prop('checked', false);
		
		// render include cryptostorage logo
		hideCryptostorageLogosDiv = $("<div class='export_option'>").appendTo(div);
		hideCryptostorageLogosCheckbox = $("<input type='checkbox' id='hideCryptostorageLogosCheckbox'>").appendTo(hideCryptostorageLogosDiv);
		let hideCryptostorageLogosCheckboxLabel = $("<label for='hideCryptostorageLogosCheckbox'>").appendTo(hideCryptostorageLogosDiv);
		hideCryptostorageLogosCheckboxLabel.html(" Hide cryptostorage logos in HTML export");
		hideCryptostorageLogosCheckbox.click(function() { updatePieces(); });
		hideCryptostorageLogosCheckbox.prop('checked', false);
		
		// render include currency logos
		hideCurrencyLogosDiv = $("<div class='export_option'>").appendTo(div);
		hideCurrencyLogosCheckbox = $("<input type='checkbox' id='hideCurrencyLogosCheckbox'>").appendTo(hideCurrencyLogosDiv);
		let hideCurrencyLogosCheckboxLabel = $("<label for='hideCurrencyLogosCheckbox'>").appendTo(hideCurrencyLogosDiv);
		hideCurrencyLogosCheckboxLabel.html(" Hide currency logos in HTML export");
		hideCurrencyLogosCheckbox.click(function() { updatePieces(); });
		hideCurrencyLogosCheckbox.prop('checked', false);
	}
	
	function getConfig() {
		let config = {};
		config.hidePublic = getHidePublic();
		config.hidePrivate = getHidePrivate();
		config.hideCryptostorageLogos = getHideCryptostorageLogos();
		config.hideCurrencyLogos = getHideCurrencyLogos();
		return config;
	}
	
	function getHidePublic() {
		return hidePublicCheckbox.prop('checked');
	}
	
	function getHidePrivate() {
		return hidePrivateCheckbox.prop('checked');
	}
	
	function getHideCurrencyLogos() {
		return hideCurrencyLogosCheckbox.prop('checked');
	}
	
	function getHideCryptostorageLogos() {
		return hideCryptostorageLogosCheckbox.prop('checked');
	}
}
inheritsFrom(PageControllerExport, DivController);

/**
 * FAQ page.
 */
function PageControllerFaq(div, appController) {
	DivController.call(this, div);
	this.render = function(onDone) {
		
		// page setup
		let page = new Page(div, appController, "FAQ");
		
		let contentDiv = page.getContentDiv();
		$("<div class='question'>").html("What is cryptostorage.com?").appendTo(contentDiv);
		$("<div class='answer'>").html("Cryptostorage.com is an open source application to generate public/private key pairs for multiple cryptocurrencies.  This site runs only in your device's browser.").appendTo(contentDiv);
		$("<div class='question'>").html("How should I use cryptostorage.com to generate secure storage for my cryptocurrencies?").appendTo(contentDiv);
		$("<div class='answer'>").html("<ol><li>Download the source code and its signature file to a flash drive.</li><li>Verify the source code has not been tampered with: TODO</li><li>Test before using by sending a small transaction and verifying that funds can be recovered from the private key.</li></ol>").appendTo(contentDiv);
		$("<div class='question'>").html("How can I trust this service?").appendTo(contentDiv);
		$("<div class='answer'>").html("Cryptostorage.com is 100% open source and verifiable.  Downloading and verifying the source code will ensure the source code matches what is what is publically auditable.  See \"How do I generate secure storage using cryptostorage.com?\" for instructions to download and verify the source code.").appendTo(contentDiv);
		$("<div class='question'>").html("Do I need internet access to recover my private keys?").appendTo(contentDiv);
		$("<div class='answer'>").html("No.  The source code is everything you need to recover the private keys.  Users should save a copy of this site for future use so there is no dependence on third parties to access this software.  Further, the source code for this site is hosted on GitHub.com. (TODO)").appendTo(contentDiv);
		$("<div class='question'>").html("Can I send funds from private keys using cryptostorage.com?").appendTo(contentDiv);
		$("<div class='answer'>").html("Not currently.  Cryptostorage.com is a public/private key generation and recovery service.  It is expected that users will import private keys into the wallet software of their choice after keys have been recovered using crypstorage.com.  Support to send funds from cryptostorage.com may be considered in the future depending on interest and ease of implementation.").appendTo(contentDiv);
		$("<div class='question'>").html("What formats can I export to?").appendTo(contentDiv);
		$("<div class='answer'>").html("TODO").appendTo(contentDiv);
		
		// done rendering
		if (onDone) onDone(div);
	}
}
inheritsFrom(PageControllerFaq, DivController);

/**
 * Donate page.
 */
function PageControllerDonate(div, appController) {
	DivController.call(this, div);
	this.render = function(onDone) {
		
		// page setup
		let page = new Page(div, appController, "Donate");
		
		// done rendering
		if (onDone) onDone(div);
	}
}
inheritsFrom(PageControllerDonate, DivController);