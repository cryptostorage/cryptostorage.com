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
 * Render main page panel.
 */
function ContentController(contentDiv) {
	
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
			pathTracker.next(renderer);
		});
	};
	
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
		
		// handle non-first page
		else {
			renderer.getDiv().css("display", "none");	// so div swipes into view
			pageDiv.append(renderer.getDiv());
			
			// swipe right
			if (lastIdx < curIdx) {
				pathTracker.getItems()[lastIdx].getDiv().toggle("slide", {direction: "left"}, 400);
				pathTracker.getItems()[curIdx].getDiv().toggle("slide", {direction: "right", complete:function() { transitioning = false; renderer.onShow(); }}, 400);
			}
			
			// swipe left
			else {
				pathTracker.getItems()[lastIdx].getDiv().toggle("slide", {direction: "right"}, 400);
				pathTracker.getItems()[curIdx].getDiv().toggle("slide", {direction: "left", complete:function() { transitioning = false; renderer.onShow(); }}, 400);
			}
		}
		
		// update arrows	
		pathTracker.hasPrev() ? leftArrow.show() : leftArrow.hide();
		pathTracker.hasNext() ? rightArrow.show() : rightArrow.hide();
	}
}
inheritsFrom(ContentController, DivController);

/**
 * Render home page.
 */
function HomeController(div, onSelectCreate, onSelectImport) {
	DivController.call(this, div);
	this.render = function(callback) {
		UiUtils.pageSetup(div);

		// render title
		div.append(UiUtils.getPageHeader("Welcome to cryptostorage.com."));
		
		div.append(getCheckmarkDiv("Generate secure storage for Bitcoin, Bitcoin Cash, Litecoin, Ethereum, and Monero."));
		div.append(getCheckmarkDiv("Protect your private keys with password encryption."));
		div.append(getCheckmarkDiv("Optionally split your private keys into separate pieces for additional security."));
		div.append(getCheckmarkDiv("Export to printable QR codes, CSV, JSON, and TXT for long term storage and easy recovery."));
		div.append(getCheckmarkDiv("100% open source, client-side, and free to use.  No account or trusted third parties."));
		div.append("<br>");
		
		div.append("Select an option to get started.")
		
		// render create button
		var btnCreate = UiUtils.getNextButton("Generate new storage");
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

function CurrencySelectionController(div, state, onCurrencySelection) {
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
		
		// render currency buttons
		for (let currency of state.currencies) {
			let btn = UiUtils.getNextButton(currency.getName() + " (" + currency.getTickerSymbol() + ")", currency.getLogo()).appendTo(div);
			btn.click(function() { onCurrencySelection(currency.getTickerSymbol()); });
		}
		
		// done rendering
		callback(div);
	}
}
inheritsFrom(CurrencySelectionController, DivController);

/**
 * Render number of key pairs.
 */
function NumPairsController(div, state, onNumPairsInput) {
	DivController.call(this, div);
	
	this.render = function(callback) {
		UiUtils.pageSetup(div);
		
		// render title
		div.append(UiUtils.getPageHeader("How many public/private keys do you want to create?", state.currency.getLogo()));
		
		// num wallets input
		var numPairsInput = $("<input>");
		numPairsInput.attr("class", "num_input");
		numPairsInput.attr("type", "number");
		numPairsInput.attr("min", 1);
		numPairsInput.attr("value", 10);
		div.append(numPairsInput);
		
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
			var numPairs = parseFloat(numPairsInput.val());
			try {
				validateNumPairs(numPairs);
				errorDiv.html();
				errorDiv.hide();
				onNumPairsInput(numPairs);
			} catch (err) {
				errorDiv.html(err.message);
				errorDiv.show();
			}
		});
		
		// done rendering
		callback(div);
	}
	
	// validates number of pairs is integer >= 1
	function validateNumPairs(numPairs) {
		if (isInt(numPairs)) {
			if (numPairs < 1) throw new Error("Number of public/private key pairs must be at least 1");
		} else throw new Error("Number of public/private key pairs must be an integer greater than 0");
	}
}
inheritsFrom(NumPairsController, DivController);

/**
 * Render password selection page.
 */
function PasswordSelectionController(div, state, onPasswordSelection) {
	DivController.call(this, div);
	this.render = function(callback) {
		UiUtils.pageSetup(div);
		
		// render title
		div.append(UiUtils.getPageHeader("Do you want to password protect your private keys?", state.currency.getLogo()));
		
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
function PasswordInputController(div, state, onPasswordInput) {
	DivController.call(this, div);
	var passwordInput;	// for later focus on show
	var schemes = state.currency.getEncryptionSchemes();
	
	this.render = function(callback) {
		UiUtils.pageSetup(div);

		// render title
		div.append(UiUtils.getPageHeader("Enter a password to protect your private keys", state.currency.getLogo()));
		
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
		
		// render advanced
		var advancedDiv = $("<div>").appendTo(div);
		advancedDiv.append("Advanced (todo)<br>");
		advancedDiv.append("Password encryption algorithm:<br><br>");
		var form = $("<form>");
		for (let scheme of schemes) {
			var input = $("<input type='radio' name='schemes' value='" + scheme + "'" + (scheme === schemes[0] ? " checked" : "") + ">");
			form.append(input);
			form.append(scheme);
			form.append("<br>")
		}
		advancedDiv.append(form);
		if (schemes.length === 1) advancedDiv.hide();
		
		var btnNext = UiUtils.getNextButton("Next");
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
		div.append(btnNext);
		callback(div);
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
inheritsFrom(PasswordInputController, DivController);

/**
 * Render split selection page.
 */
function SplitSelectionController(div, state, onSplitSelection) {
	DivController.call(this, div);
	this.render = function(callback) {
		UiUtils.pageSetup(div);
		
		// render title
		div.append(UiUtils.getPageHeader("Do you want to split your private keys into separate pieces?", state.currency.getLogo()));
		
		div.append("The pieces must be recombined to recover the private keys.");
		
		var btnYes = UiUtils.getNextButton("Yes");
		btnYes.click(function() { onSplitSelection(true); });
		div.append(btnYes);
		var btnNo = UiUtils.getNextButton("No");
		btnNo.click(function() { onSplitSelection(false); });
		div.append(btnNo);
		
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
	this.render = function(callback) {
		UiUtils.pageSetup(div);

		// render title
		div.append(UiUtils.getPageHeader("How many pieces do you want to split your private keys into?", state.currency.getLogo()));
		
		div.append("Number of pieces: ");
		var numPiecesInput = $("<input type='number'>");
		numPiecesInput.attr("class", "num_input");
		numPiecesInput.attr("value", 3);
		div.append(numPiecesInput);
		div.append("<br><br>");
		
		div.append("Number of pieces necessary to restore private keys: ");
		var minPiecesInput = $("<input type='number'>");
		minPiecesInput.attr("class", "num_input");
		minPiecesInput.attr("value", 2);
		div.append(minPiecesInput);
		div.append("<br><br>");
		
		// error message
		var errorDiv = $("<div>");
		errorDiv.attr("class", "error_msg");
		errorDiv.hide();
		div.append(errorDiv);
		
		var btnNext = UiUtils.getNextButton("Next");
		btnNext.click(function() {
			var numPieces = parseFloat(numPiecesInput.val());
			var minPieces = parseFloat(minPiecesInput.val());
			try {
				validatePiecesInput(numPieces, minPieces);
				errorDiv.html();
				errorDiv.hide();
				onPiecesInput(numPieces, minPieces);
			} catch (err) {
				errorDiv.html(err.message);
				errorDiv.show();
			}
		});
		div.append(btnNext);
		
		// done rendering
		callback(div);
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
 * Render summary of generation configuration.
 */
function WalletsSummaryController(div, state, onGenerateWallets) {
	DivController.call(this, div);
	this.render = function(callback) {
		UiUtils.pageSetup(div);
		
		// render title
		div.append(UiUtils.getPageHeader("Ready to generate your " + state.currency.getName() + " storage?", state.currency.getLogo()));
		
		div.append("<b>Summary:</b><br><br>");
		div.append("Currency: " + state.currency.getName() + " (" + state.currency.getTickerSymbol() + ")").append("<br>");
		div.append("Number of key pairs to create: " + state.numWallets).append("<br>");
		div.append("Password protection: " + (state.passwordEnabled ? "Yes" : "No") + (state.passwordEnabled ? " (" + state.encryptionScheme + ")" : "")).append("<br>");
		div.append("Split private keys: " + (state.splitEnabled ? "Yes" : "No") + (state.splitEnabled ? " (" + state.minPieces + " of " + state.numPieces + " pieces necessary to restore)" : "")).append("<br>");
		
		var btnGenerate = UiUtils.getNextButton("Generate cold storage");
		btnGenerate.click(function() { onGenerateWallets(); });
		div.append(btnGenerate);
		callback(div);
	}
}
inheritsFrom(WalletsSummaryController, DivController);

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
		for (var i = 0; i < piece.keys.length; i++) {
			
			// get public/private pair
			var walletPiece = piece.keys[i];
			
			// create pair div
			var pairDiv = $("<div>");
			pairDiv.css("margin", 0);
			pairDiv.css("padding", 0);
			pairDiv.css("border", 0);
			pairDiv.css("flex", 1);
			pairDiv.css("page-break-inside", "avoid");
			
			// prepare function to render pair
			callbackFunctions.push(prepareCallbackFunctionRenderPairDiv(pairDiv, "==== " + (i + 1) + " ====", walletPiece.publicKey, walletPiece.privateKey, config));
			
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
		executeCallbackFunctionsInSequence(callbackFunctions, callback);
		
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
 * @param plugin is the currency plugin for wallet generation
 * @param onImportUnsplitWallets(wallet) is invoked with the imported wallet
 */
function ImportTextController(div, state, onUnsplitWalletsImported) {
	DivController.call(this, div);
	
	this.render = function(callback) {
		UiUtils.pageSetup(div);
		
		// render title
		div.append(UiUtils.getPageHeader("Enter " + state.currency.getName() + " private key or pieces:", state.currency.getLogo()));
		
		// render error div
		var errorDiv = $("<div>");
		errorDiv.attr("class", "error_msg");
		errorDiv.hide();
		div.append(errorDiv);
		
		// render textarea input
		var textarea = $("<textarea>");
		div.append(textarea);
		textarea.keyup(function() {
			
			// only continue if new characters added
			let count = countNonWhitespaceCharacters(textarea.val());
			if (lastCount === count) return;
			lastCount = count;
			
			try {
				if (textarea.val() === "") {
					errorDiv.html();
					errorDiv.hide();
				} else {
					var wallet = parseWallet(state.currency, textarea.val());
					errorDiv.html();
					errorDiv.hide();
					if (wallet) onUnsplitWalletsImported([wallet]);
				}
			} catch (err) {
				console.log(err);
				errorDiv.html(err.message);
				errorDiv.show();
			}
		});
		
		// done rendering
		callback(div);
	}
	
	var lastCount = 0;
}
inheritsFrom(ImportTextController, DivController);

/**
 * Render page to password decrypt wallets.
 * 
 * @param div is the div to render to
 * @param wallets are the wallet to decrypt
 * @param onWalletDecrypt(wallet) is invoked when the wallet is decrypted
 */
function DecryptWalletsController(div, state, onWalletsDecrypted) {
	DivController.call(this, div);
	var wallets = state.wallets;
	var passwordInput;	// for later focus
	
	this.render = function(callback) {
		UiUtils.pageSetup(div);
		
		// render title
		var title = "Imported " + wallets.length + " key pairs.  Your private keys are password protected with " + wallets[0].getEncryptionScheme() + ".  Enter the password to decrypt them.";
		div.append(UiUtils.getPageHeader(title, state.currency.getLogo()));
		
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
			} else setErrorMessage("");
			
			var decryptFuncs = [];
			for (let wallet of wallets) decryptFuncs.push(getDecryptCallbackFunction(wallet, password));
			executeCallbackFunctionsInSequence(decryptFuncs, function(wallets) {
				onWalletsDecrypted(wallets);
			});
			
			function getDecryptCallbackFunction(wallet, password) {
				return function(onWalletDecrypted) {
					wallet.decrypt(password, function(resp) {
						if (resp.constructor.name === 'Wallet') {
							btnDecrypt.attr("disabled", "disabled");
							setErrorMessage("");
							onWalletDecrypted(resp);
						} else if (resp.constructor.name === 'Error') {
							setErrorMessage(resp.message);
							passwordInput.focus();
						} else {
							throw new Error("Unrecognized decryption response: " + (resp.constructor.name));
						}
					});
				}
			}
		});
		div.append(btnDecrypt);
		
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
inheritsFrom(DecryptWalletsController, DivController);

/**
 * Render import files page.
 * 
 * @param div is the div to render to
 * @param onUnsplitWalletsImported is invoked with unsplit wallets when upload files reconstitute wallets
 * @param onSelectImportText is invoked if the user prefers to import a private key from text
 */
function ImportFilesController(div, onUnsplitWalletsImported, onSelectImportText) {
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
							var unsplitWallets = getUnsplitWallets(importedPieces);
							if (unsplitWallets.length > 0) onUnsplitWalletsImported(unsplitWallets);
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
				var namedPiece = {name: file.name, piece: piece};
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
	
	function getUnsplitWallets(namedPieces) {
		
		// validate consistent currencies, number of keys, and split state
		var currency;
		var numKeys;
		var isSplit;
		for (let namedPiece of namedPieces) {
			if (!currency) currency = namedPiece.piece.currency;
			else if (currency !== namedPiece.piece.currency) throw new Error("File '" + namedPiece.name + "' is for " + namedPiece.piece.currency + " which is different from other " + currency + " pieces");
			if (!numKeys) numKeys = namedPiece.piece.keys.length;
			else if (numKeys !== namedPiece.piece.keys.length) throw new Error("File '" + namedPiece.name + "' has " + namedPiece.piece.keys.length + " keys which is different from other pieces with " + numKeys + " keys");
			if (isUndefined(isSplit)) isSplit = namedPiece.piece.isSplit;
			else if (isSplit !== namedPiece.piece.isSplit) throw new Error("File '" + namedPiece.name + "' is " + (namedPiece.piece.isSplit ? "" : " not ") + " split unlike other pieces");
		}
		
		var unsplitWallets = [];
		
		// must have at least one piece
		if (namedPieces.length === 0) throw new Error("At least one named piece is necessary");
		
		// handle more than one piece
		else if (namedPieces.length > 1) {			
			
			// attempt to reconstitue wallets
			for (let i = 0; i < numKeys; i++) {
				let privateKeyPieces = [];
				for (let pieceIdx = 0; pieceIdx < namedPieces.length; pieceIdx++) {
					privateKeyPieces.push(namedPieces[pieceIdx].piece.keys[i].privateKey);
				}
				unsplitWallets.push(new Wallet(getCurrencyPlugin(currency), {privateKeyPieces: privateKeyPieces}).reconstitute());
			}
		}
		
		// handle one piece
		else if (!namedPieces[0].piece.isSplit){
			for (let i = 0; i < namedPieces[0].piece.keys.length; i++) {
				unsplitWallets.push(new Wallet(getCurrencyPlugin(currency), {privateKey: namedPieces[0].piece.keys[i].privateKey}));
			}
		}
		
		// return unsplit wallets
		return unsplitWallets;
	}
	
	function setErrorMessage(str) {
		errorDiv.html(str);
		str === "" ? errorDiv.hide() : errorDiv.show();
	}
	
	function addPiece(name, piece) {
		
		// don't re-add same piece
		var found = false;
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
		div.append(UiUtils.getPageHeader("Download your " + state.currency.getName() + " storage.", state.currency.getLogo()));
		
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
		executeCallbackFunctionsInSequence(renderFuncs, function() {
			
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