/**
 * UI utilities.
 */
var UiUtils = {
		
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
	
	openStorage: function(browserTabName, importedPieces, keyGenConfig, keys, pieces, pieceDivs, confirmExit) {
		
		var dependencies = [
			"lib/jquery-3.2.1.js",
			"lib/jquery-ui.js",
			"lib/loadjs.js",
			"lib/async.js",
			"lib/setImmediate.js",
			"js/BodyExporter.js",
			"js/GenUtils.js",
			"js/DivControllers.js",
			"js/AppConstants.js",
			"js/PieceRenderer.js",
			"js/CryptoUtils.js",
			"js/CryptoPlugins.js",
			"js/CryptoKey.js",
			"js/DependencyLoader.js",
			"lib/jquery-csv.js",
			"lib/qrcode.js",
			"lib/jszip.js",
			"lib/FileSaver.js",
			"lib/crypto-js.js",
			"lib/progressbar.js",
			"lib/pagination.js",
			"lib/bitaddress.js"
		];
		
		// open tab
		newWindow(null, browserTabName, dependencies, ["css/style.css", "css/pagination.css"], getInternalStyleSheetText(), function(window) {
		  window.exportToBody(window, importedPieces, keyGenConfig, keys, pieces, pieceDivs, confirmExit);
			window.focus();
		});
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
 * Controls the entire application.
 * 
 * @param div is the div to render the application to
 */
function AppController(div) {
	
	var that = this;
	var sliderController;
	var sliderDiv;
	var contentDiv;
	var homeController;
	var formController;
	var recoverController;
	var faqController;
	var donateController;
	
	this.render = function(onDone) {
		div.empty();
		
		// header
		var headerDiv = $("<div class='app_header'>").appendTo(div);
		
		// header logo
		var headerTopDiv = $("<div class='app_header_top'>").appendTo(headerDiv);
		var logo = $("<img class='app_header_logo_img' src='img/cryptostorage_white.png'>").appendTo(headerTopDiv);
		logo.click(function() {
			window.location.href = "#home";
			that.showHome();
		});
		
		// header links
		var linksDiv = $("<div class='app_header_links_div'>").appendTo(headerTopDiv);
		var homeLink = getLinkDiv("Home");
		homeLink.click(function() {
			window.location.href = "#home";
			that.showHome();
		});
		var gitHubLink = getLinkDiv("GitHub");
		gitHubLink.click(function() { window.open("https://github.com/cryptostorage/cryptostorage.com", "_blank"); });
		var faqLink = getLinkDiv("FAQ");
		faqLink.click(function() {
			window.location.href = "#faq";
			that.showFaq();
		});
		var donateLink = getLinkDiv("Donate");
		donateLink.click(function() {
			window.location.href = "#donate";
			that.showDonate();
		});
		linksDiv.append(homeLink);
		linksDiv.append(gitHubLink);
		linksDiv.append(faqLink);
		linksDiv.append(donateLink);
		
		function getLinkDiv(label) {
			var div = $("<div class='link_div'>");
			div.html(label);
			return div;
		}
		
		// slider
		sliderDiv = $("<div>").appendTo(headerDiv);
		sliderController = new SliderController(sliderDiv, onSelectGenerate, onSelectRecover);
		
		// main content
		contentDiv = $("<div class='app_content'>").appendTo(div);
		
		// initialize controllers
		homeController = new HomeController($("<div>"));
		formController = new FormController($("<div>"));
		recoverController = new RecoverController($("<div>"));
		faqController = new FaqController($("<div>"));
		donateController = new DonateController($("<div>"));
		recoverController.render();
		faqController.render();
		donateController.render();
		
		// timeout fixes issue on safari where cryptostorage logo doesn't reliably show
		setImmediate(function() {
			
			// render body and start on home
			homeController.render(function() {
				
				// get identifier
				var href = window.location.href;
				var lastIdx = href.lastIndexOf("#");
				var identifier = lastIdx === -1 ? null : href.substring(lastIdx + 1);
				
				// show page based on identifier
				if (identifier === "home") that.showHome();
				else if (identifier === "faq") that.showFaq();
				else if (identifier === "donate") that.showDonate();
				else that.showHome();
				
				// done rendering
				if (onDone) onDone(div);
			});
		});
	}
	
	this.showHome = function() {
		if (DEBUG) console.log("showHome()");
		sliderDiv.show();
		sliderController.render(function() {
			homeController.render(function(div) {
				setContentDiv(div);
			});
		});
	}
	
	this.showForm = function(onDone) {
		if (DEBUG) console.log("showForm()");
		formController.render(function(div) {
			setContentDiv(div);
			sliderDiv.hide();
			if (onDone) onDone();
		});
	}
	
	this.showFaq = function() {
		if (DEBUG) console.log("showFaq()");
		setContentDiv(faqController.getDiv());
		sliderDiv.hide();
	}
	
	this.showDonate = function() {
		if (DEBUG) console.log("showDonate()");
		sliderDiv.hide();
		setContentDiv(donateController.getDiv());
	}
	
	this.showRecover = function() {
		if (DEBUG) console.log("showRecover()");
		sliderDiv.hide();
		recoverController.render();
		setContentDiv(recoverController.getDiv());
	}
	
	// ---------------------------------- PRIVATE -------------------------------
	
	function setContentDiv(div) {
		while (contentDiv.get(0).hasChildNodes()) {
			contentDiv.get(0).removeChild(contentDiv.get(0).lastChild);
		}
		contentDiv.append(div);
	}
	
	function onSelectGenerate() {
		that.showForm();
	}
	
	function onSelectRecover() {
		that.showRecover();
	}
}
inheritsFrom(AppController, DivController);

/**
 * Slider main features.
 */
function SliderController(div, onSelectGenerate, onSelectRecover) {
	DivController.call(this, div);
	this.render = function(onDone) {
		div.empty();
		div.attr("class", "intro_div");
		
		// intro slider
		var sliderContainerDiv = $("<div class='slider_container'>").appendTo(div);
		var sliderDiv = $("<div class='single-item'>").appendTo(sliderContainerDiv);
		getSlide($("<img src='img/mix.png'>"), "Generate secure storage for multiple cryptocurrencies.").appendTo(sliderDiv);
		getSlide($("<img src='img/search_file.png'>"), "100% open source and free to use.  No account necessary.").appendTo(sliderDiv);
		getSlide($("<img src='img/security.png'>"), "Keys are generated in your browser so funds are never entrusted to a third party.").appendTo(sliderDiv);
		getSlide($("<img src='img/printer.png'>"), "Export to digital and printable formats for long term storage.").appendTo(sliderDiv);
		getSlide($("<img src='img/passphrase_protected.png'>"), "Private keys can be passphrase protected and split into pieces.").appendTo(sliderDiv);
		sliderDiv.slick({autoplay:true, arrows:false, dots:true, pauseOnHover:false, autoplaySpeed:3500});
		
		function getSlide(img, text) {
			var slide = $("<div class='slide'>");
			var slideContent = $("<div class='slide_content'>").appendTo(slide);
			if (img) {
				var imgDiv = $("<div>").appendTo(slideContent);
				img.appendTo(imgDiv);
				img.attr("class", "slide_img");
			}
			var labelDiv = $("<div class='slide_label'>").appendTo(slideContent);
			labelDiv.html(text);
			return slide;
		}
		
		// call to action is overlaid
		var ctaDiv = $("<div class='cta_div'>").appendTo(div);
		
		// button to generate keys
		var btnGenerate = $("<div class='btn btn_start_generate'>").appendTo(ctaDiv);
		btnGenerate.append("Generate New Keys");
		btnGenerate.click(function() { onSelectGenerate(); });
		
		// button to recover keys
		var btnRecover = $("<div class='btn btn_recover'>").appendTo(ctaDiv);
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
 */
function HomeController(div) {
	DivController.call(this, div);
	this.render = function(onDone) {
		div.empty();
		div.attr("class", "page_div home_div");
		
		// supported currencies
		div.append("<div class='home_label'>Supports these popular cryptocurrencies</div>");
		var plugins = CryptoUtils.getCryptoPlugins();
		div.append(getCurrencyRow(plugins.slice(0, 3), true, onCurrencyClicked));
		var moreDiv = null;
		for (var i = 3; i < plugins.length; i += 4) {
			var row = getCurrencyRow(plugins.slice(i, i + 4), false, onCurrencyClicked);
			if (i >= 7 && !moreDiv) {
				moreDiv = $("<div>").appendTo(div);
				moreDiv.hide();
			}
			if (moreDiv) moreDiv.append(row);
			else div.append(row);
		}
		
		// add more div
		if (moreDiv) {
			var moreLabel = $("<div class='home_more_label'>").appendTo(div);
			moreLabel.append("and " + (plugins.length - 7) + " more...");
			moreLabel.click(function() {
				moreLabel.hide();
				moreDiv.show();
			});
		}
		
		// sample page
		$("<div style='height:100px'>").appendTo(div);
		div.append("<div class='home_label'>Export to printable and digital format for long term storage</div>");
		$("<div style='height:40px'>").appendTo(div);
		div.append($("<img width=750px src='img/print_sample.png'>"));
		
		function onCurrencyClicked(plugin) {
			UiUtils.openStorage(plugin.getName() + " Storage", null, getKeyGenConfig(plugin), null, null, null, true); 
		}
		
		function getKeyGenConfig(plugin) {
			var config = {};
			config.passphraseChecked = false;
			config.splitChecked = false;
			config.numPieces = 1;
			config.minPieces = null;
			config.currencies = [];
			config.currencies.push({
				ticker: plugin.getTicker(),
				numKeys: 1,
				encryption: null
			});
			return config;
		}
		
		if (onDone) onDone(div);
	}
	
	function getCurrencyRow(plugins, isMajor, onCurrencyClicked) {
		var row = $("<div class='currency_row'>");
		for (var i = 0; i < plugins.length; i++) {
			var plugin = plugins[i];
			var item = $("<div>").appendTo(row);
			item.attr("class", isMajor ? "currency_row_item_major" : "currency_row_item_minor");
			item.click(currencyClickFunc(plugin));
			var img = $("<img src='" + plugin.getLogo().get(0).src + "'>").appendTo(item);
			img.attr("class", isMajor ? "currency_row_logo_major" : "currency_row_logo_minor");
			img.append(plugin.getLogo());
			var label = $("<div>").appendTo(item);
			label.attr("class", isMajor ? "currency_row_label_major" : "currency_row_label_minor");
			label.html(plugin.getName());
		}
		return row;
		
		function currencyClickFunc(plugin) {
			return function() { onCurrencyClicked(plugin); }
		}
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
		
		var titleDiv = $("<div class='title'>").appendTo(div);
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
		LOADER.load(["lib/qrcode.js", "lib/async.js"], function() {
			
			// build donate section
			var titleDiv = $("<div class='title'>").appendTo(div);
			titleDiv.html("Donate");
			var donations = [];
			var plugins = CryptoUtils.getCryptoPlugins();
			for (var i = 0; i < plugins.length; i++) {
				var plugin = plugins[i];
				donations.push({
					logo: plugin.getLogo(),
					label: plugin.getName(),
					value: plugin.getDonationAddress()
				});
			}
			renderDonationAddresses(donations, null, null, function(donationsDiv) {
				div.append(donationsDiv);
				
				// build credits section
				div.append("<br><br>");
				titleDiv = $("<div class='title'>").appendTo(div);
				titleDiv.html("Credits");
				var credits = [];
				credits.push({
					logo: CryptoUtils.getCryptoPlugin("ETH").getLogo(),
					label: "UI designer",
					value: "0x5735bb7cec965e58d03dddd167d1f27321878c51"
				});
				credits.push({
					logo: CryptoUtils.getCryptoPlugin("BTC").getLogo(),
					label: "bitaddress.org",
					value: "1NiNja1bUmhSoTXozBRBEtR8LeF9TGbZBN"
				});
				credits.push({
					logo: CryptoUtils.getCryptoPlugin("XMR").getLogo(),
					label: "moneroaddress.org",
					value: "4AfUP827TeRZ1cck3tZThgZbRCEwBrpcJTkA1LCiyFVuMH4b5y59bKMZHGb9y58K3gSjWDCBsB4RkGsGDhsmMG5R2qmbLeW"
				});
				renderDonationAddresses(credits, null, null, function(donationsDiv) {
					div.append(donationsDiv);
					if (onDone) onDone(div);
				});
			});
		});
		
		/**
		 * Renders the given donations.
		 * 
		 * @param donations are [{logo: <logo>, label: <label>, value: <value>}, ...].
		 * @param config is the config to render (TODO)
		 * @param onProgress(done, total, label) is invoked as progress is made (TODO)
		 * @param onDone(div) is invoked when done
		 */
		function renderDonationAddresses(donations, config, onProgress, onDone) {
			
			// div to render to
			var donationsDiv = $("<div>");
			
			// collect functions to render values
			var left = true;
			var funcs = [];
			for (var i = 0; i < donations.length; i++) {
				var value = donations[i];
				var valueDiv = $("<div>").appendTo(donationsDiv); 
				if (left) {
					funcs.push(renderLeftFunc(valueDiv, value));
				} else {
					funcs.push(renderRightFunc(valueDiv, value));
				}
				left = !left;
			}
			
			function renderLeftFunc(valueDiv, value) {
				return function(onDone) { renderLeft(valueDiv, value, onDone); }
			}
			
			function renderRightFunc(valueDiv, value) {
				return function(onDone) { renderRight(valueDiv, value, onDone); }
			}
			
			// render addresses in parallel
			async.parallel(funcs, function(err, results) {
				if (err) throw err;
				onDone(donationsDiv);
			});
		}
		
		function renderLeft(div, value, onDone) {
			div.attr("class", "donate_left");
			var qrDiv = $("<div>").appendTo(div);
			var labelValueDiv = $("<div class='donate_label_value'>").appendTo(div);
			var logoLabelDiv = $("<div class='donate_left_logo_label'>").appendTo(labelValueDiv);
			var logo = $("<img src='" + value.logo.get(0).src + "'>").appendTo(logoLabelDiv);
			logo.attr("class", "donate_logo");
			var valueLabelDiv = $("<div class='donate_label'>").appendTo(logoLabelDiv);
			valueLabelDiv.append(value.label);
			var valueDiv = $("<div class='donate_left_value'>").appendTo(labelValueDiv);
			valueDiv.append(value.value);
			
			// render qr code
			CryptoUtils.renderQrCode(value.value, null, function(img) {
				img.attr("class", "donate_left_qr");
				qrDiv.append(img);
				onDone();
			});
		}
		
		function renderRight(div, value, onDone) {
			div.attr("class", "donate_right");
			var labelValueDiv = $("<div class='donate_label_value'>").appendTo(div);
			var logoLabelDiv = $("<div class='donate_right_logo_label'>").appendTo(labelValueDiv);
			var logo = $("<img src='" + value.logo.get(0).src + "'>").appendTo(logoLabelDiv);
			logo.attr("class", "donate_logo");
			var valueLabelDiv = $("<div class='donate_label'>").appendTo(logoLabelDiv);
			valueLabelDiv.append(value.label);
			var valueDiv = $("<div class='donate_right_value'>").appendTo(labelValueDiv);
			valueDiv.append(value.value);
			var qrDiv = $("<div>").appendTo(div);
			
			// render qr code
			CryptoUtils.renderQrCode(value.value, null, function(img) {
				img.attr("class", "donate_right_qr");
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
	
	var passphraseCheckbox;
	var btcBip38CheckboxDiv;
	var btcBip38Checkbox;
	var bchBip38CheckboxDiv;
	var bchBip38Checkbox;
	var passphraseInput;
	var splitCheckbox;
	var numPiecesInput;
	var minPiecesInput;
	var currencyInputsDiv;	// container for each currency input
	var currencyInputs;			// tracks each currency input
	
	this.render = function(onDone) {
		
		// initial state
		UiUtils.setupContentDiv(div);
		
		// currency inputs
		currencyInputs = [];
		var currencyDiv = $("<div class='form_section_div'>").appendTo(div);
		currencyInputsDiv = $("<div class='currency_inputs_div'>").appendTo(currencyDiv);
		
		// link to add currency
		var addCurrencyDiv = $("<div class='add_currency_div'>").appendTo(currencyDiv);
		var addCurrencySpan = $("<span class='add_currency_span'>").appendTo(addCurrencyDiv);
		addCurrencySpan.html("+ Add another currency");
		addCurrencySpan.click(function() {
			addCurrency();
		});
		
		// passphrase checkbox
		var passphraseDiv = $("<div class='form_section_div'>").appendTo(div);
		passphraseCheckbox = $("<input type='checkbox' id='passphrase_checkbox'>").appendTo(passphraseDiv);
		var passphraseCheckboxLabel = $("<label for='passphrase_checkbox'>").appendTo(passphraseDiv);
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
		var passphraseInputDiv = $("<div class='passphrase_input_div'>").appendTo(passphraseDiv);
		var passphraseWarnDiv = $("<div class='passphrase_warn_div'>").appendTo(passphraseInputDiv);
		passphraseWarnDiv.append("This passphrase is required to access funds later on.  Don’t lose it!");
		passphraseInputDiv.append("Passphrase");
		passphraseInput = $("<input type='password' class='passphrase_input'>").appendTo(passphraseInputDiv);
		var showPassphraseCheckboxDiv = $("<div class='passphrase_checkbox_div'>").appendTo(passphraseInputDiv);
		var showPassphraseCheckbox = $("<input type='checkbox' id='show_passphrase'>").appendTo(showPassphraseCheckboxDiv);
		var showPassphraseCheckboxLabel = $("<label for='show_passphrase'>").appendTo(showPassphraseCheckboxDiv);
		showPassphraseCheckboxLabel.html("&nbsp;Show passphrase");
		showPassphraseCheckbox.click(function() {
			if (showPassphraseCheckbox.prop('checked')) {
				passphraseInput.attr("type", "text");
			} else {
				passphraseInput.attr("type", "password");
			}
			passphraseInput.focus();
		});
		btcBip38CheckboxDiv = $("<div>").appendTo(passphraseInputDiv);
		btcBip38Checkbox = $("<input type='checkbox' id='btc_bip38_checkbox'>").appendTo(btcBip38CheckboxDiv);
		var btcBip38CheckboxLabel = $("<label for='btc_bip38_checkbox'>").appendTo(btcBip38CheckboxDiv);
		btcBip38CheckboxLabel.html("&nbsp;Use BIP38 encryption for Bitcoin");
		bchBip38CheckboxDiv = $("<div>").appendTo(passphraseInputDiv);
		bchBip38Checkbox = $("<input type='checkbox' id='bch_bip38_checkbox'>").appendTo(bchBip38CheckboxDiv);
		var bchBip38CheckboxLabel = $("<label for='bch_bip38_checkbox'>").appendTo(bchBip38CheckboxDiv);
		bchBip38CheckboxLabel.html("&nbsp;Use BIP38 encryption for Bitcoin Cash");
		
		// split checkbox
		var splitDiv = $("<div class='form_section_div'>").appendTo(div);
		splitCheckbox = $("<input type='checkbox' id='split_checkbox'>").appendTo(splitDiv);
		var splitCheckboxLabel = $("<label for='split_checkbox'>").appendTo(splitDiv);
		splitCheckboxLabel.html("&nbsp;Do you want to split your private keys into separate pieces?");
		splitCheckbox.click(function() {
			if (splitCheckbox.prop('checked')) {
				splitInputDiv.show();
			} else {
				splitInputDiv.hide();
			}
		});
		
		// split input
		var splitInputDiv = $("<div class='split_input_div'>").appendTo(splitDiv);
		var splitQr = $("<img class='split_qr' src='img/qr_code.png'>").appendTo(splitInputDiv);
		var splitLines3 = $("<img class='split_lines_3' src='img/split_lines_3.png'>").appendTo(splitInputDiv);
		var splitNumDiv = $("<div class='split_num_div'>").appendTo(splitInputDiv);
		var splitNumLabelTop = $("<div class='split_num_label_top'>").appendTo(splitNumDiv);
		splitNumLabelTop.html("Split Each Key Into");
		numPiecesInput = $("<input type='number' value='3'>").appendTo(splitNumDiv);
		var splitNumLabelBottom = $("<div class='split_num_label_bottom'>").appendTo(splitNumDiv);
		splitNumLabelBottom.html("Pieces");
		var splitLines2 = $("<img class='split_lines_2' src='img/split_lines_2.png'>").appendTo(splitInputDiv);
		var splitMinDiv = $("<div class='split_min_div'>").appendTo(splitInputDiv);
		var splitMinLabelTop = $("<div class='split_min_label_top'>").appendTo(splitMinDiv);
		splitMinLabelTop.html("Require");
		minPiecesInput = $("<input type='number' value='2'>").appendTo(splitMinDiv);
		var splitMinLabelBottom = $("<div class='split_min_label_bottom'>").appendTo(splitMinDiv);
		splitMinLabelBottom.html("To Recover");		
		
		// apply default configuration
		passphraseCheckbox.prop('checked', false);
		passphraseInputDiv.hide();
		showPassphraseCheckbox.prop('checked', false);
		splitCheckbox.prop('checked', false);
		splitInputDiv.hide();
		
		// add first currency
		addCurrency();
		
		// add generate button
		var generateDiv = $("<div class='generate_div'>").appendTo(div);
		var btnGenerate = $("<div class='btn_generate'>").appendTo(generateDiv);
		btnGenerate.append("Generate keys");
		btnGenerate.click(function() { onGenerate() });
		
		// under development warning
		var warningDiv = $("<div class='red_warning'>").appendTo(div);
		warningDiv.append("Under Development: Not Ready for Use");
		
		// security checks
		var securityDiv = $("<div>").appendTo(div);
		new SecurityCheckController(securityDiv).render();
		
		// done rendering
		if (onDone) onDone(div);
	}
	
	this.setSelectedCurrency = function(plugin) {
		assertTrue(currencyInputs.length === 1);
		currencyInputs[0].setSelectedCurrency(plugin.getName());
	}
	
	// -------------------------------- PRIVATE ---------------------------------
	
	// handle when generate button clicked
	function onGenerate(onDone) {
		UiUtils.openStorage("Export Storage", null, getConfig(), null, null, null, true);
		if (onDone) onDone();
	}
	
	// get current form configuration
	function getConfig() {
		var config = {};
		config.passphraseChecked = passphraseCheckbox.prop('checked');
		config.passphrase = passphraseInput.val();
		config.splitChecked = splitCheckbox.prop('checked');
		config.numPieces = config.splitChecked ? parseFloat(numPiecesInput.val()) : 1;
		config.minPieces = config.splitChecked ? parseFloat(minPiecesInput.val()) : null;
		config.verifyEncryption = VERIFY_ENCRYPTION;
		config.currencies = [];
		for (var i = 0; i < currencyInputs.length; i++) {
			var currencyInput = currencyInputs[i];
			config.currencies.push({
				ticker: currencyInput.getSelectedPlugin().getTicker(),
				numKeys: currencyInput.getNumKeys(),
				encryption: config.passphraseChecked ? getEncryptionScheme(currencyInput) : null
			});
		}
		verifyConfig(config);
		return config;
		
		function getEncryptionScheme(currencyInput) {
			if (currencyInput.getSelectedPlugin().getTicker() === "BTC" && btcBip38Checkbox.prop('checked')) return CryptoUtils.EncryptionScheme.BIP38;
			if (currencyInput.getSelectedPlugin().getTicker() === "BCH" && bchBip38Checkbox.prop('checked')) return CryptoUtils.EncryptionScheme.BIP38;
			return CryptoUtils.EncryptionScheme.CRYPTOJS;
		}
		
		function verifyConfig(config) {
			assertDefined(config.verifyEncryption);
			for (var i = 0; i < config.currencies.length; i++) {
				var currency = config.currencies[i];
				assertDefined(currency.ticker);
				assertDefined(currency.numKeys);
				assertDefined(currency.encryption);
			}
		}
	}
	
	function addCurrency() {
		if (DEBUG) console.log("addCurrency()");
		
		// create input
		var currencyInput = new CurrencyInput($("<div>"), currencyInputs.length, CryptoUtils.getCryptoPlugins(), updateForm, function() {
			removeCurrency(currencyInput);
		});
		
		// add to page and track
		currencyInputs.push(currencyInput);
		currencyInput.getDiv().appendTo(currencyInputsDiv);
		updateForm();
	}
	
	function removeCurrency(currencyInput) {
		var idx = currencyInputs.indexOf(currencyInput);
		if (idx < 0) throw new Error("Could not find currency input");
		currencyInputs.splice(idx, 1);
		currencyInput.getDiv().remove();
		updateForm();
	}
	
	function updateForm() {
		
		// determine if BTC is selected
		var btcFound = false;
		for (var i = 0; i < currencyInputs.length; i++) {
			var currencyInput = currencyInputs[i];
			if (currencyInput.getSelectedPlugin().getTicker() === "BTC") {
				btcFound = true;
				break;
			}
		}
		
		// determine if BCH is selected
		var bchFound = false;
		for (var i = 0; i < currencyInputs.length; i++) {
			var currencyInput = currencyInputs[i];
			if (currencyInput.getSelectedPlugin().getTicker() === "BCH") {
				bchFound = true;
				break;
			}
		}
		
		// show or hide bip38 checkbox options
		btcFound ? btcBip38CheckboxDiv.show() : btcBip38CheckboxDiv.hide();
		bchFound ? bchBip38CheckboxDiv.show() : bchBip38CheckboxDiv.hide();
	}
	
	/**
	 * Encapsulate a currency input.
	 * 
	 * @param div is the div to render to
	 * @param idx is the index of this input relative to the other inputs to accomodate ddslick's id requirement
	 * @param onCurrencyChanged(ticker) is invoked when the user changes the currency selection
	 * @param onDelete is invoked when the user delets this input
	 */
	function CurrencyInput(div, idx, plugins, onCurrencyChanged, onDelete) {
		assertInitialized(div);
		assertInitialized(plugins);
		
		var that = this;
		var selectedPlugin;
		var numKeysInput;
		var selector;
		var selectorData;
		var initializing = true;
		
		this.getDiv = function() {
			return div;
		}
		
		this.getSelectedPlugin = function() {
			return selectedPlugin;
		}
		
		this.setSelectedCurrency = function(name) {
			for (var i = 0; i < selectorData.length; i++) {
				if (selectorData[i].text === name) {
					selector.ddslick('select', {index: i});
					selectedPlugin = plugins[i];
					LOADER.load(selectedPlugin.getDependencies());	// start loading dependencies
					if (!initializing) onCurrencyChanged(selectedPlugin.getTicker());
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
			for (var i = 0; i < plugins.length; i++) {
				var plugin = plugins[i];
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
					LOADER.load(selectedPlugin.getDependencies());	// start loading dependencies
					onCurrencyChanged(selectedPlugin.getTicker());
				},
			});
			selector = $("#currency_selector_" + idx);	// ddslick requires id reference
			that.setSelectedCurrency("Bitcoin");	// default value
			
			// create right div
			var rightDiv = $("<div class='currency_input_right_div'>").appendTo(div);
			rightDiv.append("Number of keys&nbsp;&nbsp;");
			numKeysInput = $("<input type='number'>").appendTo(rightDiv);
			numKeysInput.attr("value", 1);
			rightDiv.append("&nbsp;&nbsp;");
			var trashDiv = $("<div class='trash_div'>").appendTo(rightDiv);
			trashDiv.click(function() { onDelete(); });
			var trashImg = $("<img class='trash_img' src='img/trash.png'>").appendTo(trashDiv);
			
			// no longer initializing
			initializing = false;
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
		
		// all recover content including tabs
		var recoverDiv = $("<div class='recover_div'>").appendTo(div);
		
		// render recover file and text divs
		var recoverFileDiv = $("<div>");
		var recoverTextDiv = $("<div>");
		new RecoverFileController(recoverFileDiv).render(function() {
			new RecoverTextController(recoverTextDiv, CryptoUtils.getCryptoPlugins()).render(function() {
				new TwoTabController(recoverDiv, "Recover From File", recoverFileDiv, "Recover From Text", recoverTextDiv).render(function() {
					if (onDone) onDone(div);
				});
			});
		});
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
	
	var that = this;
	var warningDiv;
	var warningMsg;
	var contentDiv;								// div for all non control links
	var importDiv;								// div for all file import
	var importedNamedPieces = [];	// [{name: 'btc.json', value: {...}}, ...]
	var importedPiecesDiv;				// shows imported item;
	var controlsDiv;							// div for all control links
	var lastKeys;
	
	this.render = function(onDone) {
		
		// div setup
		div.empty();
		div.addClass("recover_content_div");
		
		// warning div
		warningDiv = $("<div class='recover_warning_div'>").appendTo(div);
		warningDiv.hide();
		
		// set up content div
		contentDiv = $("<div>").appendTo(div);
		
		// all file importing
		importDiv = $("<div>").appendTo(contentDiv);
		
		// drag and drop importDiv
		var dragDropDiv = $("<div class='recover_drag_drop'>").appendTo(importDiv);
		var dragDropImg = $("<img class='drag_drop_img' src='img/drag_and_drop.png'>").appendTo(dragDropDiv);
		var dragDropText = $("<div class='drag_drop_text'>").appendTo(dragDropDiv);
		var dragDropLabel = $("<div class='drag_drop_label'>").appendTo(dragDropText);
		dragDropLabel.append("Drag and Drop Files To Import");
		var dragDropBrowse = $("<div class='drag_drop_browse'>").appendTo(dragDropText);
		dragDropBrowse.append("or click to browse");
		
		// register browse link with hidden input
		var inputFiles = $("<input type='file' multiple accept='.json,.zip'>").appendTo(dragDropDiv);
		inputFiles.change(function() { onFilesImported($(this).get(0).files); });
		inputFiles.hide();
		dragDropBrowse.click(function() {
			inputFiles.click();
		});
		
		// setup drag and drop
		setupDragAndDrop(dragDropDiv, onFilesImported);
		
		// imported files
		importedPiecesDiv = $("<div class='recover_imported_pieces'>").appendTo(importDiv);
		importedPiecesDiv.hide();
		
		// controls
		controlsDiv = $("<div class='recover_controls'>").appendTo(div);
		controlsDiv.hide();
		resetControls();
		
		// done rendering
		if (onDone) onDone(div);
	}
	
	this.getWarning = function() {
		return that.warningMsg;
	}
	
	this.setWarning = function(str, img) {
		that.warningMsg = str;
		warningDiv.hide();
		warningDiv.empty();
		if (str) {
			if (!img) img = $("<img src='img/warning.png'>");
			warningDiv.append(img);
			img.addClass("recover_warning_div_icon");
			warningDiv.append(str);
			warningDiv.show();
		} else {
			warningDiv.hide();
		}
	}
	
	this.addNamedPieces = function(namedPieces, onDone) {
		for (var i = 0; i < namedPieces.length; i++) {
			var namedPiece = namedPieces[i];
			try {
				CryptoUtils.validatePiece(namedPiece.piece);
				if (!isPieceImported(namedPiece.name)) importedNamedPieces.push(namedPiece);
			} catch (err) {
				that.setWarning("Invalid piece '" + namedPiece.name + "': " + err.message);
			}
		}
		updatePieces(onDone);
	}
	
	this.startOver = function() {
		that.setWarning("");
		contentDiv.children().detach();
		importedPiecesDiv.hide();
		controlsDiv.hide();
		removePieces();
		contentDiv.append(importDiv);
	}
	
	// ------------------------ PRIVATE ------------------
	
	function resetControls() {
		controlsDiv.empty();
		addControl("start over", that.startOver);
	}
	
	function addControl(text, onClick) {
		var linkDiv = $("<div class='recover_control_link_div'>").appendTo(controlsDiv);
		var link = $("<div class='recover_control_link'>").appendTo(linkDiv);
		link.append(text);
		link.click(function() { onClick(); });
	}
	
	function getImportedPieces() {
		var pieces = [];
		for (var i = 0; i < importedNamedPieces.length; i++) {
			pieces.push(importedNamedPieces[i].piece);
		}
		return pieces;
	}
	
	function onKeysImported(keys) {
		resetControls();
		that.setWarning("");
		keys = listify(keys);
		assertTrue(keys.length > 0);
		if (keys[0].isEncrypted()) {
			
			// create decryption controller and register callbacks
			var decryptionController = new DecryptionController($("<div>"), keys, function(warning) {
				that.setWarning(warning);
			}, function(decryptedKeys, pieces, pieceDivs) {
				onKeysDecrypted(getImportedPieces(), decryptedKeys, pieces, pieceDivs);
			});
			
			// render decryption controller
			decryptionController.render(function(decryptionDiv) {
				
				// replace content div with passphrase input
				contentDiv.children().detach();
				contentDiv.append(decryptionDiv);
				decryptionController.focus();
				
				// add control to view encrypted keys
				addControl("view encrypted keys", function() {
					UiUtils.openStorage("Imported Storage", getImportedPieces(), null, keys, null, null, false);
				});
			});
		} else {
			onKeysDecrypted(getImportedPieces(), keys);
		}
	}
	
	function onKeysDecrypted(importedPieces, keys, pieces, pieceDivs) {
		resetControls();
		contentDiv.children().detach();
		var viewDecrypted = $("<div class='recover_view_button'>").appendTo(contentDiv);
		viewDecrypted.append("View Decrypted Keys");
		viewDecrypted.click(function() {
			UiUtils.openStorage("Imported Storage", importedPieces, null, keys, pieces, pieceDivs, false);
		});
	}
	
	// handle imported files
	function onFilesImported(files) {
		
		// collect functions to read files
		var funcs = [];
		for (var i = 0; i < files.length; i++) {
			funcs.push(readFileFunc(files[i]));
		};
		
		function readFileFunc(file) {
			return function(onDone) { readFile(file, onDone); }
		}
		
		// read files asynchronously
		async.parallel(funcs, function(err, results) {
			if (err) throw err;
			
			// collect named pieces from results
			var namedPieces = [];
			for (var i = 0; i < results.length; i++) {
				if (results[i]) namedPieces = namedPieces.concat(results[i]);
			}
			
			// add all named pieces
			if (namedPieces.length) that.addNamedPieces(namedPieces);
		});
		
		// reads the given file and calls onNamedPieces(err, namedPieces) when done
		function readFile(file, onNamedPieces) {
			var reader = new FileReader();
			reader.onload = function() {
				getNamedPiecesFromFile(file, reader.result, function(err, namedPieces) {
					if (err) {
						that.setWarning(err.message);
						onNamedPieces(null, null);
					}
					else if (namedPieces.length === 0) {
						if (isJsonFile(file)) that.setWarning("File '" + file.name + "' is not a valid json piece");
						else if (isZipFile(file)) that.setWarning("Zip '" + file.name + "' does not contain any valid json pieces");
						else throw new Error("Unrecognized file type: " + file.type);
					} else {
						onNamedPieces(null, namedPieces);
					}
				});
			}
			if (isJsonFile(file)) reader.readAsText(file);
			else if (isZipFile(file)) reader.readAsArrayBuffer(file);
			else that.setWarning("'" + file.name + "' is not a zip or json file");
		}
		
		function getNamedPiecesFromFile(file, data, onNamedPieces) {
			if (isJsonFile(file)) {
				var piece;
				try {
					piece = JSON.parse(data);
				} catch (err) {
					onNamedPieces(Error("Could not parse JSON content from '" + file.name + "'"));
				}
				var namedPiece = {name: file.name, piece: piece};
				onNamedPieces(null, [namedPiece]);
			}
			else if (isZipFile(file)) {
				LOADER.load("lib/jszip.js", function() {
					CryptoUtils.zipToPieces(data, function(namedPieces) {
						onNamedPieces(null, namedPieces);
					});
				});
			}
		}
	}
	
	function isPieceImported(name) {
		for (var i = 0; i < importedNamedPieces.length; i++) {
			if (importedNamedPieces[i].name === name) return true;
		}
		return false;
	}
	
	function removePieces() {
		importedNamedPieces = [];
		lastKeys = undefined;
		updatePieces();
	}
	
	function removePiece(name) {
		for (var i = 0; i < importedNamedPieces.length; i++) {
			if (importedNamedPieces[i].name === name) {
				importedNamedPieces.splice(i, 1);
				that.setWarning("");
				updatePieces();
				return;
			}
		}
		throw new Error("No piece with name '" + name + "' imported");
	}
	
	function updatePieces(onDone) {
		
		// update UI
		renderImportedPieces(importedNamedPieces);
		
		// collect all pieces
		var pieces = [];
		for (var i = 0; i < importedNamedPieces.length; i++) pieces.push(importedNamedPieces[i].piece);
		if (!pieces.length) {
			if (onDone) onDone();
			return;
		}
		
		// collect tickers being imported
		var tickers = [];
		for (var i = 0; i < pieces[0].keys.length; i++) tickers.push(pieces[0].keys[i].ticker);
		tickers = arrUnique(tickers);
		
		// collect dependencies
		var dependencies = APP_DEPENDENCIES.slice();
		for (var i = 0; i < tickers.length; i++) {
			var ticker = tickers[i];
			var plugin = CryptoUtils.getCryptoPlugin(ticker);
			for (var j = 0; j < plugin.getDependencies().length; j++) dependencies.push(plugin.getDependencies()[j]);
		}
		dependencies = arrUnique(dependencies);
		
		// load dependencies
		LOADER.load(dependencies, function() {
			
			// create keys
			try {
				
				// add control to view pieces
				addControl("view imported pieces", function() {
					UiUtils.openStorage("Imported Storage", null, null, null, pieces, null, false);
				});
				
				// attempt to get keys
				var keys = CryptoUtils.piecesToKeys(pieces);
				if (keysDifferent(lastKeys, keys) && keys.length) onKeysImported(keys);
				lastKeys = keys;
			} catch (err) {
				var img = err.message.indexOf("additional piece") > 0 ? $("<img src='img/files.png'>") : null;
				that.setWarning(err.message, img);
			}
			if (onDone) onDone();
		});
		
		function keysDifferent(keys1, keys2) {
			if (!keys1 && keys2) return true;
			if (keys1 && !keys2) return true;
			if (keys1.length !== keys2.length) return true;
			for (var i = 0; i < keys1.length; i++) {
				if (!keys1[i].equals(keys2[i])) return true;
			}
			return false;
		}
	}
	
	function renderImportedPieces(namedPieces) {
		
		// reset state
		resetControls();
		importedPiecesDiv.empty();
		
		// hide imported pieces and controls if no pieces
		if (namedPieces.length === 0) {
			importedPiecesDiv.hide();
			controlsDiv.hide();
			return;
		}
		
		// render imported pieces
		for (var i = 0; i < namedPieces.length; i++) {
			importedPiecesDiv.append(getImportedPieceDiv(namedPieces[i]));
		}
		function getImportedPieceDiv(namedPiece) {
			var importedPieceDiv = $("<div class='recover_file_imported_piece'>").appendTo(importedPiecesDiv);
			var icon = $("<img src='img/file.png' class='recover_imported_icon'>").appendTo(importedPieceDiv);
			importedPieceDiv.append(namedPiece.name);
			var trash = $("<img src='img/trash.png' class='recover_imported_trash'>").appendTo(importedPieceDiv);
			trash.click(function() { removePiece(namedPiece.name); });
			return importedPieceDiv;
		}
		
		// show imported pieces and controls
		importedPiecesDiv.show();
		controlsDiv.show();
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
			var dt = event.dataTransfer;
			
			// use DataTransferItemList interface to access file(s)
			if (dt.items) {
				var files = [];
				for (var i = 0; i < dt.items.length; i++) {
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
	
	var MAX_PIECE_LENGTH = 58;	// max length of piece strings to render
	
	var warningDiv;
	var contentDiv;
	var passphraseInputDiv;
	var selector;
	var selectorDisabler;
	var selectedPlugin;
	var textArea;
	var importedPieces = [];	// string[]
	var importedPiecesDiv;		// div for imported pieces
	var controlsDiv;
	var lastKeys;
	
	this.render = function(onDone) {
		
		// div setup
		div.empty();
		div.addClass("recover_content_div");
		
		// warning div
		warningDiv = $("<div class='recover_warning_div'>").appendTo(div);
		warningDiv.hide();
		
		// set up content div
		contentDiv = $("<div>").appendTo(div);
		
		// all passphrase input
		passphraseInputDiv = $("<div>").appendTo(contentDiv);
		
		// currency selector data
		selectorData = [];
		for (var i = 0; i < plugins.length; i++) {
			var plugin = plugins[i];
			selectorData.push({
				text: plugin.getName(),
				imageSrc: plugin.getLogo().get(0).src
			});
		}
		
		// currency selector
		var selectorContainer = $("<div class='recover_selector_container'>").appendTo(passphraseInputDiv);
		selector = $("<div id='recover_selector'>").appendTo(selectorContainer);
		
		// text area
		textArea = $("<textarea class='recover_textarea'>").appendTo(passphraseInputDiv);
		textArea.attr("placeholder", "Enter a private key or split pieces of a private key");
		
		// submit button
		var submit = $("<div class='recover_button'>").appendTo(passphraseInputDiv);
		submit.html("Submit");
		submit.click(function() { submitPieces(); });
		
		// imported pieces
		importedPiecesDiv = $("<div class='recover_imported_pieces'>").appendTo(passphraseInputDiv);
		importedPiecesDiv.hide();
		
		// controls
		controlsDiv = $("<div class='recover_controls'>").appendTo(div);
		controlsDiv.hide();
		resetControls();
		
		// initialize pull down
		LOADER.load("lib/jquery.ddslick.js", function() {	// ensure loaded before or only return after loaded
			selector.ddslick({
				data:selectorData,
				background: "white",
				imagePosition: "left",
				selectText: "Select a Currency",
				width:'100%',
				defaultSelectedIndex: 0,
				onSelected: function(selection) {
					selectedPlugin = plugins[selection.selectedIndex];
					LOADER.load(selectedPlugin.getDependencies());	// start loading dependencies
				},
			});
			selector = $("#recover_selector");	// ddslick requires id reference
			selectorDisabler = $("<div class='recover_selector_disabler'>").appendTo(selectorContainer);
			startOver();
			
			// done rendering
			if (onDone) onDone(div);
		});
	}
	
	function resetControls() {
		controlsDiv.empty();
		addControl("start over", startOver);
	}
	
	function addControl(text, onClick) {
		var linkDiv = $("<div class='recover_control_link_div'>").appendTo(controlsDiv);
		var link = $("<div class='recover_control_link'>").appendTo(linkDiv);
		link.append(text);
		link.click(function() { onClick(); });
	}
	
	function startOver() {
		setWarning("");
		textArea.val("");
		contentDiv.children().detach();
		importedPiecesDiv.hide();
		controlsDiv.hide();
		contentDiv.append(passphraseInputDiv);
		removePieces();
		setSelectedCurrency("Bitcoin");
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
		if (keys[0].isEncrypted()) {
			
			// create decryption controller and register callbacks
			var decryptionController = new DecryptionController($("<div>"), keys, function(warning) {
				setWarning(warning);
			}, function(decryptedKeys, pieces, pieceDivs) {
				onKeysDecrypted(decryptedKeys, pieces, pieceDivs);
			});
			
			// render decryption controller
			decryptionController.render(function(decryptionDiv) {
				
				// replace content div with passphrase input
				contentDiv.children().detach();
				contentDiv.append(decryptionDiv);
				decryptionController.focus();
				
				// add control to view encrypted keys
				addControl("view encrypted key", function() {
					UiUtils.openStorage("Imported Storage", null, null, keys, null, null, false);
				});
			});
		} else {
			onKeysDecrypted(keys);
		}
	}
	
	function onKeysDecrypted(keys, pieces, pieceDivs) {
		resetControls();
		contentDiv.children().detach();
		var viewDecrypted = $("<div class='recover_view_button'>").appendTo(contentDiv);
		viewDecrypted.append("View Decrypted Key");
		viewDecrypted.click(function() {
			UiUtils.openStorage("Imported Storage", null, null, keys, pieces, pieceDivs, false);
		});
	}
	
	function setSelectedCurrency(name) {
		selector = $("#recover_selector");
		for (var i = 0; i < selectorData.length; i++) {
			if (selectorData[i].text === name) {
				selector.ddslick('select', {index: i});
				selectedPlugin = plugins[i];
				break;
			}
		}
	}
	
	function setWarning(str, img) {
		warningDiv.empty();
		if (str) {
			if (!img) img = $("<img src='img/warning.png'>");
			warningDiv.append(img);
			img.addClass("recover_warning_div_icon");
			warningDiv.append(str);
			warningDiv.show();
		} else {
			warningDiv.hide();
		}
	}
	
	function removePieces() {
		importedPieces = [];
		lastKeys = undefined;
		updatePieces();
	}
	
	function removePiece(piece) {
		for (var i = 0; i < importedPieces.length; i++) {
			if (importedPieces[i] === piece) {
				importedPieces.splice(i, 1);
				updatePieces();
				return;
			}
		}
		throw new Error("No piece imported: " + piece);
	}
	
	function submitPieces() {
		
		resetControls();
		
		// get and clear text
		var val = textArea.val();
		textArea.val("");
		
		// check for empty text
		if (val.trim() === "") {
			setWarning("No text entered");
			return;
		}
		
		// get lines
		var lines = getLines(val);
		
		// get lines with content
		var contentLines = [];
		for (var i = 0; i < lines.length; i++) {
			var line = lines[i];
			if (line.trim() !== "") contentLines.push(line);
		}
		
		// load dependencies
		var dependencies = [];
		for (var i = 0; i < selectedPlugin.getDependencies().length; i++) dependencies.push(selectedPlugin.getDependencies()[i]);
		dependencies = arrUnique(dependencies);
		LOADER.load(dependencies, function() {
			
			// add pieces
			updatePieces(contentLines);
		});
	}
	
	function updatePieces(newPieces) {
		
		// reset warning
		setWarning("");
		
		// interanl warning setter to track if warning is set
		var warningSet = false;
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
		var key;
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
				for (var i = 0; i < newPieces.length; i++) {
					var piece = newPieces[i];
					if (arrContains(importedPieces, piece)) {
						setWarningAux("Piece already added");
						continue;
					}
					if (key) setWarningAux("Private key alread added");
					else {
						try {
							var thisKey = selectedPlugin.newKey(piece);
							if (importedPieces.length > 0) setWarningAux("Cannot add private key to existing pieces");
							else {
								key = thisKey;
								importedPieces.push(piece);
							}
						} catch (err) {
							if (CryptoUtils.isPossibleSplitPiece(piece)) importedPieces.push(piece);
							else setWarningAux("Invalid private key or piece");
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
				if (!warningSet) {
					var img = err.message.indexOf("additional piece") > 0 ? $("<img src='img/files.png'>") : null;
					setWarning(err.message, img);
				}
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
			importedPiecesDiv.hide();
			controlsDiv.hide();
			return;
		}
		
		importedPiecesDiv.show();
		controlsDiv.show();
		for (var i = 0; i < pieces.length; i++) {
			importedPiecesDiv.append(getImportedPieceDiv(pieces[i]));
		}
		
		function getImportedPieceDiv(piece) {
			var importedPieceDiv = $("<div class='recover_text_imported_piece'>").appendTo(importedPiecesDiv);
			var icon = $("<img src='img/file.png' class='recover_imported_icon'>").appendTo(importedPieceDiv);
			importedPieceDiv.append(CryptoUtils.getShortenedString(piece, MAX_PIECE_LENGTH));
			var trash = $("<img src='img/trash.png' class='recover_imported_trash'>").appendTo(importedPieceDiv);
			trash.click(function() { removePiece(piece); });
			return importedPieceDiv;
		}
	}
}
inheritsFrom(RecoverTextController, DivController);

/**
 * Controls passphrase input and key decryption on import.
 * 
 * @param div is the div to render to
 * @param encrypted keys is an array of encrypted CryptoKeys
 * @param onWarning(msg) is called when this controller reports a warning
 * @param onKeysDecrypted(keys, pieces, pieceDivs) is invoked on successful decryption
 */
function DecryptionController(div, encryptedKeys, onWarning, onKeysDecrypted) {
	DivController.call(this, div);
	
	var that = this;
	var labelDiv;
	var inputDiv;
	var passphraseInput;
	var progressDiv;
	var submitButton;
	
	this.render = function(onDone) {
		
		// set up div
		div.empty();
		div.addClass("recover_decryption_div");
		
		// label
		labelDiv = $("<div class='recover_decrypt_label'>").appendTo(div);
		
		// passphrase input
		inputDiv = $("<div>").appendTo(div);
		passphraseInput = $("<input type='password' class='recover_passphrase_input'>").appendTo(inputDiv)
		submitButton = $("<div class='recover_button'>").appendTo(inputDiv);
		submitButton.html("Submit");
		submitButton.click(function() { onSubmit(); });
		
		// progress bar
		progressDiv = $("<div class='recover_progress_div'>").appendTo(div);
		
		// initial state
		init();
		
		// register passphrase enter key
		passphraseInput.keyup(function(e) {
			var code = e.which;
	    if (code == 13) {
	    	e.preventDefault();
	      submitButton.click();
	    }
		});
		
		if (onDone) onDone(div);
	}
	
	this.focus = function() {
		passphraseInput.focus();
	}
	
	function init() {
		progressDiv.hide();
		labelDiv.html("Passphrase");
		labelDiv.show();
		inputDiv.show();
		that.focus();
	}
	
	function onSubmit() {
		
		// clear warning
		onWarning("");
		
		// get passphrase
		var passphrase = passphraseInput.val();
		passphraseInput.val('');
		
		// validate passphrase
		if (!passphrase || passphrase.trim() === "") {
			onWarning("Enter a passphrase to decrypt private keys");
			return;
		}
		
		// compute weights for progress bar
		var decryptWeight = CryptoUtils.getWeightDecryptKeys(encryptedKeys);
		var renderWeight = PieceRenderer.getRenderWeight(encryptedKeys.length, 1, null);
		var totalWeight = decryptWeight + renderWeight;
		
		// switch content div to progress bar
		inputDiv.hide();
		progressDiv.show();
		progressDiv.empty();
		progressBar = UiUtils.getProgressBar(progressDiv);
		setProgress(0, "Decrypting...");
		
		// let UI breath
		setImmediate(function() {
			
			// decrypt keys async
			var copies = [];
			for (var i = 0; i < encryptedKeys.length; i++) copies.push(encryptedKeys[i].copy());
			CryptoUtils.decryptKeys(copies, passphrase, function(done, total) {
				setProgress(done / total * decryptWeight / totalWeight, "Decrypting...");
			}, function(err, decryptedKeys) {
				
				// if error, switch back to input div
				if (err) {
					onWarning(err.message);
					init();
					return;
				}
				
				// convert keys to pieces
				var pieces = CryptoUtils.keysToPieces(decryptedKeys);
				
				// render pieces
				PieceRenderer.renderPieces(pieces, null, null, function(percentDone) {
					setProgress((decryptWeight + percentDone * renderWeight) / totalWeight, "Rendering...");
				}, function(err, pieceDivs) {
					if (err) throw err;
					onKeysDecrypted(decryptedKeys, pieces, pieceDivs);
				});
			});
		});
	}
	
	function setProgress(percent, label) {
		progressBar.set(percent);
		progressBar.setText(Math.round(percent * 100) + "%");
		if (label) labelDiv.html(label);
	}
}
inheritsFrom(DecryptionController, DivController);

/**
 * Manages up to two tabs of content.  Hides tabs if only one content given.
 * 
 * @param div is the div to render all tab content to
 * @param tabName1 is the name of the first tab
 * @param tabContent1 is the content tab of the first tab
 * @param tabName2 is the name of the second tab (optional)
 * @param tabContent2 is the content tab of the second tab (optional)
 * @param defaultTabIdx is the default tab index (optional)
 */
function TwoTabController(div, tabName1, tabContent1, tabName2, tabContent2, defaultTabIdx) {
	DivController.call(this, div);
	
	var tabsDiv;
	var tab1;
	var tab2;
	var contentDiv;
	
	this.render = function(onDone) {
		
		// no tabs if one content div
		if (!tabContent2) {
			div.append(tabContent1);
			return;
		}
		
		// TODO: rename classes
		// set up tabs
		tabsDiv = $("<div class='recover_tabs_div'>").appendTo(div);
		tab1 = $("<div class='recover_tab_div'>").appendTo(tabsDiv);
		tab1.html(tabName1);
		tab1.click(function() { selectTab(0); });
		tab2 = $("<div class='recover_tab_div'>").appendTo(tabsDiv);
		tab2.html(tabName2);
		tab2.click(function() { selectTab(1); });
		
		// add content div
		contentDiv = $("<div>").appendTo(div);
		
		// start on first tab by default
		selectTab(defaultTabIdx ? defaultTabIdx : 0);
		
		// done rendering
		if (onDone) onDone(div);
	}
	
	this.getTabsDiv = function() {
		return tabsDiv;
	}
	
	function selectTab(idx) {
		switch(idx) {
		case 0:
			tab1.addClass("active_tab");
			tab2.removeClass("active_tab");
			contentDiv.children().detach();
			contentDiv.append(tabContent1);
			break;
		case 1:
			tab1.removeClass("active_tab");
			tab2.addClass("active_tab");
			contentDiv.children().detach();
			contentDiv.append(tabContent2);
			break;
		default:
			throw Error("Tab index must be 0 or 1 but was " + idx);
		}
	}
}
inheritsFrom(TwoTabController, DivController);

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
 * @param confirmExit specifies if the window should confirm exit if not saved or printed
 */
function ExportController(div, window, keyGenConfig, keys, pieces, pieceDivs, confirmExit) {
	DivController.call(this, div);
	
	// global variables
	var saved = false;
	var progressDiv;
	var progressBar;
	var printButton;
	var showPublicCheckbox;
	var showPrivateCheckbox;
	var showLogosCheckbox;
	var paginator;
	var piecesDiv;
	var printEnabled;
	
	// confirm exit if storage not saved or printed
	if (confirmExit) {
		window.addEventListener("beforeunload", function (e) {
			if (!saved) {
			  var confirmationMessage = "Your storage has not been saved or printed.";
			  (e || window.event).returnValue = confirmationMessage;	// Gecko + IE
			  return confirmationMessage;     												// Webkit, Safari, Chrome
			}               
		});
	}
	
	this.render = function(onDone) {
		div.empty();
		div.addClass("export_div");
		
		// key generation
		progressDiv = $("<div class='export_progress_div'>").appendTo(div);
		progressDiv.hide();
		progressBar = UiUtils.getProgressBar(progressDiv);
		
		// export header
		var exportHeader = $("<div class='export_header'>").appendTo(div);
		
		// export buttons
		var exportButtons = $("<div class='export_buttons'>").appendTo(exportHeader);
		var saveButton = $("<div class='export_button'>").appendTo(exportButtons);
		saveButton.html("Save All");
		saveButton.click(function() { saveAll(pieces); });
		printButton = $("<div class='export_button'>").appendTo(exportButtons);
		printButton.html("Print All");
		printButton.click(function() { printAll(); });
		var savePublicButton = $("<div class='export_button'>").appendTo(exportButtons);
		savePublicButton.html("Save Public Addresses");
		savePublicButton.click(function() { savePublicAddresses(); });
//		var moreButton = $("<div class='export_button'>").appendTo(exportButtons);
//		moreButton.html("...");
//		moreButton.click(function() { console.log("More button clicked"); });
		
		// export checkboxes
		var exportCheckboxes = $("<div class='export_checkboxes'>").appendTo(exportHeader);
		showPublicCheckbox = $("<input type='checkbox' class='export_checkbox' id='showPublicCheckbox'>").appendTo(exportCheckboxes);
		var showPublicCheckboxLabel = $("<label class='export_checkbox_label' for='showPublicCheckbox'>").appendTo(exportCheckboxes);
		showPublicCheckboxLabel.html("Show public addresses");
		exportCheckboxes.append("&nbsp;&nbsp;&nbsp;");
		showPrivateCheckbox = $("<input type='checkbox' class='export_checkbox' id='showPrivateCheckbox'>").appendTo(exportCheckboxes);
		var showPrivateCheckboxLabel = $("<label class='export_checkbox_label' for='showPrivateCheckbox'>").appendTo(exportCheckboxes);
		showPrivateCheckboxLabel.html("Show private keys");
		exportCheckboxes.append("&nbsp;&nbsp;&nbsp;");
		showLogosCheckbox = $("<input type='checkbox' class='export_checkbox' id='showLogosCheckbox'>").appendTo(exportCheckboxes);
		var showLogosCheckboxLabel = $("<label class='export_checkbox_label' for='showLogosCheckbox'>").appendTo(exportCheckboxes);
		showLogosCheckboxLabel.html("Show currency logos");
		
		// apply default state
		showPublicCheckbox.prop('checked', true);
		showPrivateCheckbox.prop('checked', true);
		showLogosCheckbox.prop('checked', true);
		
		// sort pieces and pieceDivs by piece number
		sortPieces();
		
		// piece selection
		var paginatorSource = getPaginatorSource(keyGenConfig, pieces);
		if (paginatorSource) {
			paginator = $("<div id='paginator'>").appendTo(exportHeader);
			$("#paginator").pagination({
				dataSource: paginatorSource,
				pageSize: 1,
				callback: function(data, pagination) {
					if (pieceDivs) setVisiblePiece(pieceDivs, pagination.pageNumber - 1);
				}
			});
			$("<div class='export_piece_selection_label'>Pieces</div>").appendTo(exportHeader);
		}
		
		// currently showing piece
		piecesDiv = $("<div class='export_pieces_div'>").appendTo(div);
		
		// register events
		showPublicCheckbox.click(function() { update(); });
		showPrivateCheckbox.click(function() { update(); });
		showLogosCheckbox.click(function() { update(); });
		
		// build ui based on keyGenConfig, pieces, and pieceDivs
		update(pieceDivs);

		// done rendering
		if (onDone) onDone(div);
	}
	
	// --------------------------------- PRIVATE --------------------------------
	
	function sortPieces() {
		if (!pieces) return;
		
		// bind pieces and pieceDivs
		var elems = [];
		for (var i = 0; i < pieces.length; i++) {
			elems.push({
				piece: pieces[i],
				pieceDiv: pieceDivs ? pieceDivs[i] : null
			});
		}
		
		// sort elems
		elems.sort(function(elem1, elem2) {
			var num1 = elem1.piece.pieceNum;
			var num2 = elem2.piece.pieceNum;
			assertNumber(num1);
			assertNumber(num2);
			return num1 - num2;
		});
		
		// re-assign global pieces
		pieces = [];
		if (pieceDivs) pieceDivs = [];
		for (var i = 0; i < elems.length; i++) {
			var elem = elems[i];
			pieces.push(elem.piece);
			if (pieceDivs) pieceDivs.push(elem.pieceDiv);
		}
	}
	
	function getPaginatorSource(keyGenConfig, pieces) {
		if (keyGenConfig) {
			if (keyGenConfig.numPieces === 1) return null;
			var pieceNums = [];
			for (var i = 0; i < keyGenConfig.numPieces; i++) pieceNums.push(i + 1);
			return pieceNums;
		}
		if (pieces) {
			assertTrue(pieces.length >= 1);
			if (pieces.length === 1) return null;
			var pieceNums = [];
			for (var i = 0; i < pieces.length; i++) pieceNums.push(pieces[i].pieceNum);
			return pieceNums;
		}
		return null;
	}
	
	function getPieceRendererConfig() {
		return {
			showPublic: showPublicCheckbox.prop('checked'),
			showPrivate: showPrivateCheckbox.prop('checked'),
			showCurrencyLogos: showLogosCheckbox.prop('checked')
		};
	}
	
	function printAll() {
		if (!printEnabled) return;
		saved = true;
		window.print();
	}
	
	function saveAll(pieces) {
		assertInitialized(pieces);
		assertTrue(pieces.length > 0);
		saved = true;
		if (pieces.length === 1) {
			var jsonStr = CryptoUtils.pieceToJson(pieces[0]);
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
		var publicAddressesStr = CryptoUtils.pieceToAddresses(pieces[0]);
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
	
	function update(_pieceDivs, onDone) {
		updateHeader();
		pieceDivs = _pieceDivs;
		
		// add piece divs if given
		if (pieceDivs) {
			assertInitialized(pieces);
			setVisiblePiece(pieceDivs, paginator ? paginator.pagination('getSelectedPageNum') - 1 : 0);
			setPieceDivs(pieceDivs);
			setPrintEnabled(true);
			if (onDone) onDone();
		}
		
		// else render from pieces
		else {
			pieceDivs = [];
			
			// render pieces if given
			if (pieces) {
				for (var i = 0; i < pieces.length; i++) pieceDivs.push($("<div>"));
				setVisiblePiece(pieceDivs, paginator ? paginator.pagination('getSelectedPageNum') - 1 : 0);
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
				CryptoUtils.generateKeys(keyGenConfig, function(percent, label) {
					progressBar.set(percent);
					if (label) progressBar.setText(label);
					progressDiv.show();
				}, function(_keys, _pieces, _pieceDivs) {
					progressDiv.hide();
					keys = _keys;
					pieces = _pieces;
					pieceDivs = _pieceDivs;
					update(pieceDivs, onDone);
				});
			}
		}
	}
	
	function setPieceDivs(pieceDivs) {
		piecesDiv.empty();
		for (var i = 0; i < pieceDivs.length; i++) piecesDiv.append(pieceDivs[i]);
	}
	
	/**
	 * Sets the visible piece by adding/removing the hidden class.
	 * 
	 * @param pieceDivs are the piece divs to show/hide
	 * @param pieceIdx is the piece number to show
	 */
	function setVisiblePiece(pieceDivs, pieceIdx) {
		for (var i = 0; i < pieces.length; i++) {
			if (i === pieceIdx) pieceDivs[i].removeClass("hidden");
			else pieceDivs[i].addClass("hidden");
		}
	}
	
	function updateHeader() {
		showPrivateCheckbox.prop('checked') ? showPublicCheckbox.removeAttr('disabled') : showPublicCheckbox.attr('disabled', 'disabled');
		showPublicCheckbox.prop('checked') ? showPrivateCheckbox.removeAttr('disabled') : showPrivateCheckbox.attr('disabled', 'disabled');
		showLogosCheckbox.removeAttr('disabled');
	}
}
inheritsFrom(ExportController, DivController);

/**
 * Controls security checks.
 * 
 * @param div is the div to render to
 */
function SecurityCheckController(div) {
	DivController.call(this, div);
	
	var LOOP_TIME = 3000;
	
	this.render = function(onDone) {
		div.empty();
		div.addClass("security_checks_div");
		
		// loading
		div.append("Loading...");
		
		// loop security checks
		updateSecurityChecks();
		function updateSecurityChecks() {
			CryptoUtils.getSecurityChecks(function(securityChecks) {
				renderSecurityChecks(securityChecks);
			});
			setTimeout(updateSecurityChecks, LOOP_TIME);
		}
	}
	
	//render updated security checks
	function renderSecurityChecks(securityChecks) {
		div.empty();
		
		// window.crypto
		if (securityChecks.windowCryptoExists) {
			div.append(getSecurityCheckDiv($("<img src='img/checkmark_small.png'>"), "window.crypto exists"));
		} else {
			div.append(getSecurityCheckDiv($("<img src='img/xmark_small.png'>"), "window.crypto does not exist"));
		}
		
		// is on domain
		if (securityChecks.isLocal) {
			div.append(getSecurityCheckDiv($("<img src='img/checkmark_small.png'>"), "running local"));
		} else {
			div.append(getSecurityCheckDiv($("<img src='img/warning_orange.png'>"), "not running locally"));
		}
		
		// is online
		if (securityChecks.isOnline) {
			div.append(getSecurityCheckDiv($("<img src='img/warning_orange.png'>"), "active internet connection"));
		} else {
			div.append(getSecurityCheckDiv($("<img src='img/checkmark_small.png'>"), "no internet connection"));
		}
		
		// open source browser
		if (securityChecks.isOpenSourceBrowser) {
			div.append(getSecurityCheckDiv($("<img src='img/checkmark_small.png'>"), "browser is open source (" + securityChecks.browser + ")"));
		} else {
			div.append(getSecurityCheckDiv($("<img src='img/warning_orange.png'>"), "browser is not open source (" + securityChecks.browser + ")"));
		}
		
		// open source operating system
		if (securityChecks.isOpenSourceOs) {
			div.append(getSecurityCheckDiv($("<img src='img/checkmark_small.png'>"), "operating system is open source (" + securityChecks.os + ")"));
		} else {
			div.append(getSecurityCheckDiv($("<img src='img/warning_orange.png'>"), "operating system is not open source (" + securityChecks.os + ")"));
		}
		
		function getSecurityCheckDiv(img, text) {
			var div = $("<div class='security_check_div'>");
			div.append(img);
			img.css("margin-right", "10px");
			img.css("width", "32px");
			div.append(text);
			return div;
		}
	}
}
inheritsFrom(SecurityCheckController, DivController);
