/**
 * UI utilities.
 */
let UiUtils = {
		
	setupContentDiv: function(div) {
		div.empty();
		div.attr("class", "page_div");
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
	
	getCurrencyRow: function(plugins, isMajor) {
		let row = $("<div class='currency_row'>");
		for (let plugin of plugins) {
			let item = $("<div>").appendTo(row);
			item.attr("class", isMajor ? "currency_row_item_major" : "currency_row_item_minor");
			let img = $("<img src='" + plugin.getLogo().get(0).src + "'>").appendTo(item);
			img.attr("class", isMajor ? "currency_row_logo_major" : "currency_row_logo_minor");
			img.append(plugin.getLogo());
			let label = $("<div>").appendTo(item);
			label.attr("class", isMajor ? "currency_row_label_major" : "currency_row_label_minor");
			label.html(plugin.getName());
		}
		return row;
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
		getSlide($("<img src='img/mix.png'>"), "Generate keys for multiple cryptocurrencies in your browser.").appendTo(sliderDiv);
		getSlide($("<img data-lazy='img/search_file.png'>"), "100% open source and free to use.  No account necessary.").appendTo(sliderDiv);
		getSlide($("<img data-lazy='img/security.png'>"), "Funds are never entrusted to a third party.").appendTo(sliderDiv);
		getSlide($("<img data-lazy='img/password_protected.png'>"), "Private keys can be password protected and split into pieces.").appendTo(sliderDiv);
		getSlide($("<img data-lazy='img/printer.png'>"), "Export to digital and printable formats which can be easily recovered.").appendTo(sliderDiv);
		sliderDiv.slick({autoplay:!DEBUG, arrows:false, dots:true, autoplaySpeed:4000});
		
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
 * Home page.
 */
function HomeController(div) {
	DivController.call(this, div);
	this.render = function(onDone) {
		div.empty();
		div.attr("class", "page_div home_div");
		
		// supported currencies
		div.append("Supports these popular cryptocurrencies");
		let plugins = CryptoUtils.getCryptoPlugins();
		div.append(UiUtils.getCurrencyRow(plugins.slice(0, 3), true));
		for (let i = 3; i < plugins.length; i += 4) {
			div.append(UiUtils.getCurrencyRow(plugins.slice(i, i + 4), false));
		}
		
		if (onDone) onDone(div);
	}
}
inheritsFrom(HomeController, DivController);

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
				numPiecesInput.focus();
			} else {
				splitInputDiv.hide();
			}
		});
		
		// split input
		let splitInputDiv = $("<div class='split_input_div'>").appendTo(splitDiv);
		let splitNumPiecesDiv = $("<div>").appendTo(splitInputDiv);
		splitNumPiecesDiv.append("Split each key into ");
		numPiecesInput = $("<input type='number' value='3'>").appendTo(splitNumPiecesDiv);
		splitNumPiecesDiv.append(" pieces");
		let splitMinPiecesDiv = $("<div>").appendTo(splitInputDiv);
		splitMinPiecesDiv.append("Require ");
		minPiecesInput = $("<input type='number' value='2'>").appendTo(splitMinPiecesDiv);
		splitMinPiecesDiv.append(" to recover");
		
		// apply default configuration
		passphraseCheckbox.prop('checked', true);
		showPassphraseCheckbox.prop('checked', false);
		splitCheckbox.prop('checked', false);
		splitInputDiv.hide();
		
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
		
		// add generate button
		let generateDiv = $("<div class='generate_div'>").appendTo(div);
		let btnGenerate = $("<div class='btn_generate'>").appendTo(generateDiv);
		btnGenerate.append("Generate key pairs");
		btnGenerate.click(function() { generateKeys(function(done, total, label) {
			progressBar.set(done / total);
			if (label) progressBar.setText(label);
			progressDiv.show();
		}, function(keys, pieces, pieceDivs) {
			progressDiv.hide();
			pieceDiv.empty();
			pieceDiv.append(pieceDivs[0]);
		})});
		
		// add progress bar and div
		let progressDiv = $("<div>").appendTo(div);
		progressDiv.hide();
		let progressBar = UiUtils.getProgressBar(progressDiv);
		
		// add div to contain rendered page
		let pieceDiv = $("<div class='preview_piece_div'>").appendTo(div);
		
		// done rendering
		if (onDone) onDone(div);
	}
	
	// -------------------------------- PRIVATE ---------------------------------
	
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
		let currencyInput = new CurrencyInput($("<div>"), CryptoUtils.getCryptoPlugins(), function() {
			console.log("Currency input deleted");
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
	 * @param onDelete is invoked when the user delets this input
	 */
	function CurrencyInput(div, plugins, onDelete) {
		assertInitialized(div);
		assertInitialized(plugins);
		
		let selectedPlugin;
		let numKeysInput;
		
		this.getDiv = function() {
			return div;
		}
		
		this.getSelectedPlugin = function() {
			return selectedPlugin;
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
			let data = [];
			for (let plugin of plugins) {
				data.push({
					text: plugin.getName(),
					imageSrc: plugin.getLogo().get(0).src
				});
			}
			
			// create pull down
			let selector = $("<div>").appendTo(div);
			selector.ddslick({
				data:data,
				background: "white",
				imagePosition: "left",
				selectText: "Select a Currency",
				onSelected: function(data) {
					selectedPlugin = plugins[data.selectedIndex];
					numKeysInput.focus();
				},
			});
			
			// create right div
			let rightDiv = $("<div class='currency_input_right_div'>").appendTo(div);
			rightDiv.append("Number of keys&nbsp;&nbsp;");
			numKeysInput = $("<input type='number'>").appendTo(rightDiv);
			rightDiv.append("&nbsp;&nbsp;");
			let trashDiv = $("<div class='trash_div'>").appendTo(rightDiv);
			trashDiv.click(function() { onDelete(); });
			let trashImg = $("<img class='trash_img' src='img/trash.png'>").appendTo(trashDiv);
		}
	}
	
	/**
	 * Generates keys, pieces, rendered pieces.
	 * 
	 * @param onProgress(done, total, label) is invoked as progress is made
	 * @param onDone(keys, pieces, pieceDivs) is invoked when done
	 */
	function generateKeys(onProgress, onDone) {
		
		// get current configuration
		let config = getConfig();
		console.log(config);

		// load dependencies
		let dependencies = new Set(COMMON_DEPENDENCIES);
		for (let currency of config.currencies) {
			for (let dependency of currency.plugin.getDependencies()) {
				dependencies.add(dependency);
			}
		}
		loader.load(Array.from(dependencies), function() {
			
			// compute total weight for progress bar
			let totalWeight = 0;
			let numKeys = 0;
			for (let currency of config.currencies) {
				numKeys += currency.numKeys;
				totalWeight += currency.numKeys * UiUtils.getCreateKeyWeight();
				if (currency.encryption) totalWeight += currency.numKeys * (UiUtils.getEncryptWeight(currency.encryption) + (VERIFY_ENCRYPTION ? UiUtils.getDecryptWeight(currency.encryption) : 0));
			}
			let piecesRendererWeight = PieceRenderer.getPieceWeight(numKeys, config.numPieces, null);
			totalWeight += piecesRendererWeight;
			
			// collect key creation functions
			let funcs = [];
			for (let currency of config.currencies) {
				for (let i = 0; i < currency.numKeys; i++) {
					funcs.push(newKeyFunc(currency.plugin));
				}
			}
			
			// generate keys
			let progressWeight = 0;
			onProgress(progressWeight, totalWeight, "Generating keys");
			async.series(funcs, function(err, keys) {
				if (decommissioned) {
					onDone();
					return;
				}
				if (err) throw err;
				let originals = keys;
				
				// collect encryption functions
				funcs = [];
				let keyIdx = 0;
				let passphrases = [];
				for (let currency of config.currencies) {
					for (let i = 0; i < currency.numKeys; i++) {
						if (currency.encryption) {
							funcs.push(encryptFunc(originals[keyIdx].copy(), currency.encryption, config.passphrase));
							passphrases.push(config.passphrase);
						}
						keyIdx++;
					}
				}
				
				// no encryption
				if (!funcs.length) {
					
					// convert keys to pieces
					let pieces = CryptoUtils.keysToPieces(originals, config.numPieces, config.minPieces);
					
					// validate pieces can recreate originals
					let keysFromPieces = CryptoUtils.piecesToKeys(pieces);
					assertEquals(originals.length, keysFromPieces.length);
					for (let i = 0; i < originals.length; i++) {
						assertTrue(originals[i].equals(keysFromPieces[i]));
					}
					
					// render pieces to divs
					onProgress(progressWeight, totalWeight, "Rendering");
					renderPieceDivs(pieces, function(err, pieceDivs) {
						if (err) throw err;
						assertEquals(pieces.length, pieceDivs.length);
						onProgress(1, 1, "Complete");
						onDone(keys, pieces, pieceDivs);
					});
				}
				
				// handle encryption
				else {
					
					// encrypt keys
					onProgress(progressWeight, totalWeight, "Encrypting keys");
					async.series(funcs, function(err, encryptedKeys) {
						if (decommissioned) {
							onDone();
							return;
						}
						if (err) throw err;
						
						// convert keys to pieces
						let pieces = CryptoUtils.keysToPieces(encryptedKeys, config.numPieces, config.minPieces);
						
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
								funcs.push(decryptFunc(encryptedKeys[i].copy(), passphrases[i]));
							}
							
							// decrypt keys
							onProgress(progressWeight, totalWeight, "Verifying encryption");
							async.series(funcs, function(err, decryptedKeys) {
								if (decommissioned) {
									onDone();
									return;
								}
								if (err) throw err;
								
								// verify equivalence
								assertEquals(originals.length, decryptedKeys.length);
								for (let i = 0; i < originals.length; i++) {
									assertTrue(originals[i].equals(decryptedKeys[i]));
								}
								
								// render pieces to divs
								onProgress(progressWeight, totalWeight, "Rendering");
								renderPieceDivs(pieces, function(err, pieceDivs) {
									if (err) throw err;
									assertEquals(pieces.length, pieceDivs.length);
									onProgress(1, 1, "Complete");
									onDone(encryptedKeys, pieces, pieceDivs);
								});
							});
						}
						
						// don't verify encryption
						else {
							
							// render pieces to divs
							onProgress(progressWeight, totalWeight, "Rendering");
							renderPieceDivs(pieces, function(err, pieceDivs) {
								if (err) throw err;
								assertEquals(pieces.length, pieceDivs.length);
								onProgress(1, 1, "Complete");
								onDone(encryptedKeys, pieces, pieceDivs);
							});
						}
					});
				}
			});
			
			function newKeyFunc(plugin, callback) {
				return function(callback) {
					if (decommissioned) {
						callback();
						return;
					}
					setTimeout(function() {
						let key = plugin.newKey();
						progressWeight += UiUtils.getCreateKeyWeight();
						onProgress(progressWeight, totalWeight, "Generating keys");
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
						onProgress(progressWeight, totalWeight, "Encrypting");
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
						onProgress(progressWeight, totalWeight, "Decrypting");
						setTimeout(function() { callback(err, key); }, 0);	// let UI breath
					});
				}
			}
			
			function renderPieceDivs(pieces, onDone) {
				PieceRenderer.renderPieces(null, pieces, null, function(percent) {
					onProgress(progressWeight + (percent * piecesRendererWeight), totalWeight, "Rendering");
				}, onDone);
			}
		});
	}
}
inheritsFrom(FormController, DivController);

/**
 * FAQ page.
 */
function FaqController(div) {
	DivController.call(this, div);
	this.render = function(onDone) {
		UiUtils.setupContentDiv(div);
		
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
				//left = !left;
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