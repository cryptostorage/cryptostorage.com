/**
 * UI utilities.
 */
UiUtils = {
	getButton: function(label, isNext, icon) {
		let button = $("<div class='btn'>");
		if (icon) {
			var logoDiv = $("<div class='btn_icon_div'>").appendTo(button);
			icon.attr("class", "btn_icon");
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
		if (DEBUG) console.log("onPageMove(" + lastIdx + ", " + curIdx + ", " + JSON.stringify(renderer) + ")");
		
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
 * Render currenct selection.
 */

function CryptoSelectionController(div, state, onCryptoSelection) {
	DivController.call(this, div);
	this.render = function(callback) {
		UiUtils.pageSetup(div);
		
		// render title
		switch (state.goal) {
		case Goal.CREATE_STORAGE:
			div.append(UiUtils.getPageHeader("Select a currency to store."));
			break;
		case Goal.RESTORE_STORAGE:
			div.append(UiUtils.getPageHeader("Select a currency to import."));
			break;
		default:
			throw new Error("Invalid goal for currency selection: " + state.goal);
		}
		
		// render mix and match button
		let btn = UiUtils.getNextButton("Mix and match").appendTo(div);
		btn.click(function() { onCryptoSelection("MIX"); });
		
		// render crypto buttons
		for (let plugin of state.plugins) {
			let btn = UiUtils.getNextButton(plugin.getName() + " (" + plugin.getTickerSymbol() + ")", plugin.getLogo()).appendTo(div);
			btn.click(function() { onCryptoSelection(plugin.getTickerSymbol()); });
		}
		
		// done rendering
		callback(div);
	}
}
inheritsFrom(CryptoSelectionController, DivController);

/**
 * Render number of keys.
 */
function NumKeysController(div, state, pathTracker, onNumKeysInput) {
	DivController.call(this, div);
	
	this.render = function(callback) {
		UiUtils.pageSetup(div);
		
		// render title
		div.append(UiUtils.getPageHeader("How many " + state.plugin.getName() + " keys do you want to create?", state.plugin.getLogo()));
		
		// num key keys input
		var numKeysInput = $("<input>");
		numKeysInput.attr("class", "num_input");
		numKeysInput.attr("type", "number");
		numKeysInput.attr("min", 1);
		numKeysInput.attr("value", 10);
		div.append(numKeysInput);
		div.append("<br><br>");
		numKeysInput.keypress(function() { pathTracker.clearNexts(); });
		
		// error message
		var errorDiv = $("<div>");
		errorDiv.attr("class", "error_msg");
		errorDiv.hide();
		div.append(errorDiv);
		
		// next button
		var btnNext = UiUtils.getNextButton("Next");
		div.append(btnNext);
		
		// validate num wallets when button clicked
		btnNext.click(function() {
			var numKeys = parseFloat(numKeysInput.val());
			try {
				validateNumKeys(numKeys);
				errorDiv.html();
				errorDiv.hide();
				onNumKeysInput(numKeys);
			} catch (err) {
				errorDiv.html(err.message);
				errorDiv.show();
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
		div.append(UiUtils.getPageHeader("Do you want to password protect your " + state.plugin.getName() + " private keys?", state.plugin.getLogo()));
		
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
 * @param state is the current state of the application
 * @param onPasswordInput(password, scheme) is the callback and its parameters
 */
function PasswordInputController(div, state, pathTracker, onPasswordInput) {
	DivController.call(this, div);
	var passwordInput;	// for later focus on show
	var schemes = state.plugin.getEncryptionSchemes();
	var errorDiv = $("<div>");
	
	this.render = function(callback) {
		UiUtils.pageSetup(div);

		// render title
		div.append(UiUtils.getPageHeader("Enter a password to protect your " + state.plugin.getName() + " private keys.", state.plugin.getLogo()));
		
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
		passwordInput.keypress(function() { pathTracker.clearNexts(); });
		
		// render advanced
		var advancedDiv = $("<div>").appendTo(div);
		advancedDiv.append("Advanced<br><br>");
		advancedDiv.append("Password encryption algorithm:<br>");
		var form = $("<form>");
		for (let scheme of schemes) {
			var input = $("<input type='radio' name='schemes' value='" + scheme + "'" + (scheme === schemes[0] ? " checked" : "") + ">");
			form.append(input);
			form.append(scheme);
			form.append("<br>")
		}
		advancedDiv.append(form);
		advancedDiv.append("<br>");
		if (schemes.length === 1) advancedDiv.hide();
		
		// render next button
		var btnNext = UiUtils.getNextButton("Next").appendTo(div);
		btnNext.click(function() {
			let password = passwordInput.val();
			if (password === "") setErrorMessage("Password cannot be empty")
			else if (password.length < 6) setErrorMessage("Password must be at least 6 characters");
			else {
				setErrorMessage("");
				var scheme = $("input[type='radio']:checked", form).val();
				onPasswordInput(passwordInput.val(), scheme);
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
		
		callback(div);
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
		div.append(UiUtils.getPageHeader("Do you want to split your " + state.plugin.getName() + " private keys into separate pieces?", state.plugin.getLogo()));
		
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
function NumPiecesInputController(div, state, pathTracker, onPiecesInput) {
	DivController.call(this, div);
	var errorDiv = $("<div>");

	this.render = function(callback) {
		UiUtils.pageSetup(div);

		// render title
		div.append(UiUtils.getPageHeader("How many pieces do you want to split your " + state.plugin.getName() + " private keys into?", state.plugin.getLogo()));
		
		div.append("Number of pieces: ");
		var numPiecesInput = $("<input type='number'>");
		numPiecesInput.attr("class", "num_input");
		numPiecesInput.attr("value", 3);
		numPiecesInput.attr("min", 2);
		div.append(numPiecesInput);
		div.append("<br><br>");
		numPiecesInput.keypress(function() { pathTracker.clearNexts(); });
		
		div.append("Number of pieces necessary to restore private keys: ");
		var minPiecesInput = $("<input type='number'>");
		minPiecesInput.attr("min", 2);
		minPiecesInput.attr("class", "num_input");
		minPiecesInput.attr("value", 2);
		div.append(minPiecesInput);
		div.append("<br><br>");
		minPiecesInput.keypress(function() { pathTracker.clearNexts(); });
		
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
 * Controls page to summarize configuration and generate keys.
 * 
 * @param div is the div to render to
 * @param state is the current state of the application
 * @param onKeysGenerated(wallets) is invoked when the keys are generated
 */
function GenerateKeysController(div, state, onKeysGenerated) {
	DivController.call(this, div);
	this.render = function(callback) {
		UiUtils.pageSetup(div);
		
		// render title
		div.append(UiUtils.getPageHeader("Ready to generate your " + state.plugin.getName() + " storage?", state.plugin.getLogo()));
		
		div.append("<b>Summary:</b><br><br>");
		div.append("Currency: " + state.plugin.getName() + " (" + state.plugin.getTickerSymbol() + ")").append("<br>");
		div.append("Number of keys to create: " + state.numKeys).append("<br>");
		div.append("Password protection: " + (state.passwordEnabled ? "Yes" : "No") + (state.passwordEnabled ? " (" + state.encryptionScheme + ")" : "")).append("<br>");
		div.append("Split private keys: " + (state.splitEnabled ? "Yes" : "No") + (state.splitEnabled ? " (" + state.minPieces + " of " + state.numPieces + " pieces necessary to restore)" : ""));
		div.append("<br><br>");
		
		var btnGenerate = UiUtils.getNextButton("Generate " + state.plugin.getName() + " storage");
		btnGenerate.click(function() {
			btnGenerate.attr("disabled", "disabled");
			generateKeys(function(keys) {
				onKeysGenerated(keys);
				btnGenerate.removeAttr("disabled");
			});
		});
		div.append(btnGenerate);
		callback(div);
	}
	
	function generateKeys(onKeysGenerated) {
		
		// generate keys
		var keys = [];
		for (var i = 0; i < state.numKeys; i++) {
			keys.push(state.plugin.newKey());
		}
		
		// copy originals for later validation
		var originalKeys = [];
		for (let key of keys) {
			originalKeys.push(key.copy());
		}
		
		// password encryption
		if (state.passwordEnabled) {
			
			// collect callback functions to encrypt wallets
			var encryptFuncs = [];
			for (let key of keys) {
				encryptFuncs.push(getCallbackFunctionEncrypt(key, state.encryptionScheme, state.password));
			}
			
			// execute callback functions in sequence
			executeInSeries(encryptFuncs, function() {	// TODO: switch to async.series() but causes only first to be encrypted
				
				// keys generated
				onKeysGenerated(keys);
			});
			
			/**
			 * Returns a callback function to encrypt a key.
			 */
			function getCallbackFunctionEncrypt(key, encryptionScheme, password) {
				return function(callback) {
					key.encrypt(encryptionScheme, password, callback);
				}
			}
		}
		
		// no password encryption
		else {
			
			// keys generated
			onKeysGenerated(keys);
		}
	}
}
inheritsFrom(GenerateKeysController, DivController);

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
			callbackFunctions.push(prepareCallbackFunctionRenderPairDiv(pairDiv, "==== " + (i + 1) + " ====", keyPiece.address, keyPiece.privateKey, config));
			
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
		executeInSeries(callbackFunctions, callback);
		
		/**
		 * Returns a callback function (function with single callback argument) which will render a pair div.
		 */
		function prepareCallbackFunctionRenderPairDiv(pairDiv, name, publicKey, privateKey, config) {
			
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
		var title = "Imported " + keys.length + " " + state.plugin.getName() + " keys which are password protected with " + keys[0].getEncryptionScheme() + ".  Enter the password to decrypt them.";
		div.append(UiUtils.getPageHeader(title, state.plugin.getLogo()));
		
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
			
			var decryptFuncs = [];
			for (let key of keys) decryptFuncs.push(getDecryptCallbackFunction(key, password));
			executeInSeries(decryptFuncs, function(keys) {
				onKeysDecrypted(keys);
			});
			
			function getDecryptCallbackFunction(key, password) {
				return function(onKeyDecrypted) {
					key.decrypt(password, function(key, err) {
						if (err) {
							setErrorMessage(err.message);
							passwordInput.focus();
							btnDecrypt.removeAttr("disabled");
						} else {
							setErrorMessage("");
							onKeyDecrypted(key);
						}
					});
				}
			}
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
							let keys = piecesToKeys(pieces);
							if (keys.length > 0) onKeysImported(keys);
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
 * @param pieces are the pieces to download
 */
function DownloadPiecesController(div, state, pieces, onCustomExport) {
	DivController.call(this, div);
	assertTrue(pieces.length > 0);
	
	this.render = function(callback) {
		UiUtils.pageSetup(div);
		
		// render title
		let isSplit = pieces[0].isSplit;
		let encryption = pieces[0].encryption;
		div.append(UiUtils.getPageHeader("Download your " + state.plugin.getName() + " storage.", state.plugin.getLogo()));
		
		// collect functions to render pieces and divs to be rendered to
		var pieceDivs = [];
		var renderFuncs = [];
		for (let piece of pieces) {
			var pieceDiv = $("<div>");
			pieceDivs.push(pieceDiv);
			var renderer = new PieceRenderer(pieceDiv, piece);
			renderFuncs.push(renderer.render);
		}
		
		// render each piece in sequence to minimize resource requirements
		executeInSeries(renderFuncs, function() {	// TODO: switch to async.parallel() but sometimes causes last address to only render public QR code
			
			// wrap piece divs in html containers
			var pieceHtmls = [];
			for (let pieceDiv of pieceDivs) {
				pieceHtmls.push($("<html>").append($("<body>").append(pieceDiv)));
			}
			
			// zip pieces
			piecesToZip(pieces, pieceHtmls, function(name, blob) {
				
				// render zip download
				div.append("<br>");
				var downloadZipsDiv = $("<div>").appendTo(div);
				downloadZipsDiv.attr("class", "download_zips_div");
				var downloadZipDiv = $("<div>").appendTo(downloadZipsDiv);
				downloadZipDiv.attr("class", "download_zip_div");
				var downloadIconDiv = $("<div style='text-align:center'>").appendTo(downloadZipDiv);
				var downloadIcon = $("<img src='img/download.png' class='download_icon'>").appendTo(downloadIconDiv);
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