/**
 * UI utilities.
 */
var UiUtils = {
	
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
	
	/**
	 * Opens storage in a new tab.
	 * 
	 * @param browserTabName is the name of the tab
	 * @param config is the storage configuration
	 * 				config.splitPieces are imported split pieces
	 * 				config.keyGenConfig is a configuration to generate new storage
	 * 				config.keys are keys to generate pieces from
	 * 				config.pieces are pieces to export and generate pieceDivs from
	 * 				config.pieceDivs are pre-generated piece divs ready for display
	 * 				config.confirmExit specifies if the window should confirm exit
	 * 				config.showRegenerate specifies if the regenerate button should be shown
	 * 				config.showNotices specifies if notices should be shown
	 */
	openStorage: function(browserTabName, config) {
		
		// deep copy config
		config = objectAssign({}, config);
		
		// default config
		if (!isInitialized(config.showNotices)) config.showNotices = true;
		
		// open tab
		newWindow(null, browserTabName, AppUtils.getExportJs(), AppUtils.getExportCss(), getInternalStyleSheetText(), function(window) {
			config.environmentInfo = AppUtils.getCachedEnvironment();
		  window.exportToBody(window, config);
			window.focus();
		});
	},
	
	/**
	 * Returns the maximum width for UI tooltips.
	 */
	getInfoTooltipsMaxWidth: function() {
		return "500px";
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
	var introDiv;
	var introController;
	var contentDiv;
	var homeLoader;
	var formLoader;
	var importLoader;
	var faqLoader;
	var donateLoader;
	var currentPage;
	
	this.render = function(onDone) {
		
		// header
		div.empty();
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
		var gitHubLink = $("<a target='_blank' class='link_div' href='https://github.com/cryptostorage/cryptostorage.com'>GitHub</a>");
		var faqLink = getLinkDiv("FAQ");
		var donateLink = getLinkDiv("Donate");
		linksDiv.append(homeLink);
		linksDiv.append(gitHubLink);
		linksDiv.append(faqLink);
		linksDiv.append(donateLink);
		homeLink.click(function() {
			window.location.href = "#home";
			that.showHome();
		});
		faqLink.click(function() {
			window.location.href = "#faq";
			that.showFaq();
		});
		donateLink.click(function() {
			window.location.href = "#donate";
			that.showDonate();
		});
		
		function getLinkDiv(label) {
			var div = $("<div class='link_div'>");
			div.html(label);
			return div;
		}
		
		// slider has to be attached to the DOM and shown to work, so it's a special case and not part of HomeController
		introDiv = $("<div class='intro_div'>").hide();
		introDiv.appendTo(headerDiv);
		introController = new IntroController(introDiv, onSelectGenerate, onSelectImport);
		
		// main content
		contentDiv = $("<div class='app_content'>").appendTo(div);
		
		// initialize controllers
		homeLoader = new LoadController(new HomeController($("<div>")));
		formLoader = new LoadController(new FormController($("<div>")));
		importLoader = new LoadController(new ImportController($("<div>")));
		faqLoader = new LoadController(new FaqController($("<div>")), {enableScroll: true});
		donateLoader = new LoadController(new DonateController($("<div>")), {enableScroll: true});
		
		// map pages to show functions
		var showFuncs = {
				"home": that.showHome,
				"new": that.showForm,
				"import": that.showImport,
				"faq": that.showFaq,
				"donate": that.showDonate
		}
		
		// get fragment identifier
		var href = window.location.href;
		var lastIdx = href.lastIndexOf("#");
		var fragmentId = lastIdx === -1 ? null : href.substring(lastIdx + 1);
		
		// determine page
		var page = fragmentId === null ? "home" : fragmentId;
		if (page.startsWith("faq")) page = "faq";
		else if (!showFuncs[page]) page = "home";
		
		// show first page
		showFuncs[page](function() {
			
			// load notice dependencies and start polling
			LOADER.load(AppUtils.getNoticeDependencies(), function(err) {
				if (err) throw err;
				AppUtils.pollEnvironment(AppUtils.getEnvironmentSync());
				
				// load all dependencies in the background
				var dependencies = toUniqueArray(AppUtils.getHomeDependencies().concat(AppUtils.getAppDependencies()).concat(AppUtils.getFaqDependencies()));
				LOADER.load(dependencies, function(err) {
					if (err) throw err;
					
					// done initializing application
					if (onDone) onDone();
				});
			});
		}, page !== fragmentId ? fragmentId : null);
	}
	
	this.showHome = function(onDone) {
		if (AppUtils.DEV_MODE) console.log("showHome()");
		currentPage = "home";
		homeLoader.render(function() {
			if (currentPage !== "home") return;
			introDiv.show();
			introController.render(function() {
				if (onDone) onDone();
			});
		}, function() {
			setContentDiv(homeLoader.getDiv());
			formLoader.getRenderer().startOver();
			importLoader.getRenderer().startOver();
		});
	}
	
	this.showForm = function(onDone) {
		if (AppUtils.DEV_MODE) console.log("showForm()");
		currentPage = "form";
		formLoader.render(onDone, function() {
			introDiv.hide();
			setContentDiv(formLoader.getDiv());
			importLoader.getRenderer().startOver();
		});
	}
	
	this.showFaq = function(onDone, fragmentId) {
		if (AppUtils.DEV_MODE) console.log("showFaq()");
		currentPage = "faq";
		faqLoader.render(function() {
			setImmediate(function() {
				if (fragmentId) {
					window.location.hash = "";	// makes location.hash work on all browsers
					window.location.hash = "#" + fragmentId;
				}
				if (onDone) onDone();
			});
		}, function() {
			introDiv.hide();
			setContentDiv(faqLoader.getDiv());
			formLoader.getRenderer().startOver();
			importLoader.getRenderer().startOver();
		});
	}
	
	this.showDonate = function(onDone) {
		if (AppUtils.DEV_MODE) console.log("showDonate()");
		currentPage = "donate";
		donateLoader.render(onDone, function() {
			introDiv.hide();
			setContentDiv(donateLoader.getDiv());
			formLoader.getRenderer().startOver();
			importLoader.getRenderer().startOver();
		});
	}
	
	this.showImport = function(onDone) {
		if (AppUtils.DEV_MODE) console.log("showImport()");
		currentPage = "import";
		importLoader.render(onDone, function() {
			introDiv.hide();
			setContentDiv(importLoader.getDiv());
			formLoader.getRenderer().startOver();
		});
	}
	
	// ---------------------------------- PRIVATE -------------------------------
	
	function setContentDiv(div) {
		contentDiv.prepend(div);
		while (contentDiv.children().length > 1) contentDiv.children().last().detach();
	}
	
	function onSelectGenerate() {
		window.location.href = "#new";
		that.showForm();
	}
	
	function onSelectImport() {
		window.location.href = "#import";
		that.showImport();
	}
}
inheritsFrom(AppController, DivController);

/**
 * Intro with slider and call to action.
 */
function IntroController(div, onSelectGenerate, onSelectImport) {
	DivController.call(this, div);
	var that = this;
	this.render = function(onDone) {
		div.empty();
		
		// load mix img
		var mixImg = new Image();
		mixImg.onload = function() {
			
			// div setup
			div.empty();
			div.attr("class", "intro_div");
			
			// intro slider
			sliderDiv = $("<div class='slider_div'>").appendTo(div);
			getSlide($(mixImg), "Create cold storage for multiple cryptocurrencies.").appendTo(sliderDiv);
			getSlide($("<img src='img/printer.png'>"), "Print paper wallets for long term storage.").appendTo(sliderDiv);
			getSlide($("<img src='img/security.png'>"), "Runs only in your browser so funds are never entrusted to a third party.").appendTo(sliderDiv);
			getSlide($("<img src='img/microscope.png'>"), "100% open source and free to use.  No account necessary.").appendTo(sliderDiv);
			getSlide($("<img src='img/keys.png'>"), "Passphrase protect and split private keys for maximum security.").appendTo(sliderDiv);
			getSlide($("<img src='img/checklist.png'>"), "Generate keys securely with automated environment checks.").appendTo(sliderDiv);
			
			function getSlide(img, text) {
				var slide = $("<div class='slide'>");
				var slideContent = $("<div class='slide_content'>").appendTo(slide);
				if (img) {
					var imgDiv = $("<div>").appendTo(slideContent);
					img.attr("class", "slide_img");
					img.appendTo(imgDiv);
				}
				var labelDiv = $("<div class='slide_label'>").appendTo(slideContent);
				labelDiv.html(text);
				return slide;
			}
			
			// call to action is overlaid
			var ctaDiv = $("<div class='cta_div'>").appendTo(div);
			
			// button to generate keys
			var btnGenerate = $("<div class='light_green_btn'>").appendTo(ctaDiv);
			btnGenerate.append("Generate New Keys");
			btnGenerate.click(function() { onSelectGenerate(); });
			
			// button to import keys
			var btnImport = $("<div class='btn_import'>").appendTo(ctaDiv);
			btnImport.append("or Import Existing Keys");
			btnImport.click(function() { onSelectImport(); });
			
			// initialize slider
			sliderDiv.on("init", function() { if (onDone) onDone(); });
			sliderDiv.slick({autoplay:true, arrows:false, dots:true, pauseOnHover:false, autoplaySpeed:AppUtils.SLIDER_RATE});
		}
		mixImg.src = "img/mix.png";
	}
}
inheritsFrom(IntroController, DivController);

/**
 * Home page content.
 * 
 * @param div is the div to render to
 */
function HomeController(div) {
	DivController.call(this, div);
	var moreLink = false;
	this.render = function(onDone) {
		
		// load home dependencies
		LOADER.load(AppUtils.getHomeDependencies(), function() {
			
			// div setup
			div.empty();
			div.attr("class", "content_div flex_vertical");
			
			// notice container
			var noticeContainer = $("<div class='notice_container'>").appendTo(div);
			
			// home content
			var pageDiv = $("<div class='page_div home_div flex_vertical'>").appendTo(div);
			
			// supported currencies
			pageDiv.append($("<div class='home_label'>Supports these tokens</div>"));
			var plugins = AppUtils.getCryptoPlugins();
			pageDiv.append(getCurrencyRow(plugins.slice(0, 3), true, onCurrencyClicked));
			var moreDiv = null;
			for (var i = 3; i < plugins.length; i += 4) {
				var row = getCurrencyRow(plugins.slice(i, i + 4), false, onCurrencyClicked);
				if (i >= 7 && !moreDiv) {
					moreDiv = $("<div>").appendTo(pageDiv);
					moreDiv.hide();
				}
				if (moreDiv) moreDiv.append(row);
				else pageDiv.append(row);
			}
			if (moreDiv) {
				var moreLabel = $("<div class='home_more_label'>").appendTo(pageDiv);
				moreLabel.append("and " + (plugins.length - 7) + " more...");
				moreLabel.click(function() {
					moreLabel.hide();
					moreDiv.show();
				});
			}
			
			// don't show more link
			if (!moreLink) {
				moreLabel.hide();
				moreDiv.show();
			}
			
			// sample page section
			pageDiv.append("<div style='height: 70px'>");
			pageDiv.append("<div class='home_label'>Export to printable and digital formats for long term storage</div>");
			pageDiv.append("<div class='home_description'>Save keys to a file which can be stored securely on a flash drive, or print to paper to easily create paper wallets.</div>")
			pageDiv.append($("<img width=750px src='img/print_sample.png'>"));
			
			// check environment section
			pageDiv.append("<div style='height: 10px'>");
			pageDiv.append("<div class='home_label'>Generate keys securely with automated environment checks</div>");
			pageDiv.append("<div class='home_description'>Following a few simple recommendations can improve the security of your cryptocurrency.  Automatic environment checks encourage keys to be generated in a secure environment.</div>")
			pageDiv.append($("<img width=785px src='img/notice_bars.png'>"));
			
			// split and passphrase section
			pageDiv.append("<div style='height: 70px'>");
			pageDiv.append("<div class='home_label'>Passphrase protect and split private keys for maximum security</div>");
			pageDiv.append("<div class='home_description'>Split storage into multiple pieces which can be stored independently.  Set how many pieces are needed to recover the keys.  Store one in your safe, one in a bank vault, or one with a trusted family member.</div>")
			pageDiv.append($("<img style='width:785px; margin-bottom:15px;' src='img/passphrase_input.png'>"));
			pageDiv.append($("<img style='width:600px;' src='img/split_input.png'>"));
			
			// cryptography section
			pageDiv.append("<div style='height:70px'>");
			var hFlex = $("<div class='flex_horizontal'>").appendTo(pageDiv);
			hFlex.append("<img style='height:175px; margin-right:20px;' src='img/key.png'>");
			var vFlex = $("<div class='flex_vertical'>").appendTo(hFlex);
			vFlex.append("<div class='home_label'>Strong cryptography</div>");
			vFlex.append("<div class='home_description'>Uses the latest window.crypto API available in browsers, which gives access to a cryptographically secure random number generator. This allows generation of random values as seeds for your keys.</div>");
			
			// download section
			pageDiv.append("<div style='height: 70px'>");
			pageDiv.append("<div class='home_label'>Download our 100% free and open-source software and run it offline</div>");
			pageDiv.append("<div class='home_description'>Feel confident in the software you’re using. Inspect the source code and know that your money is secure. CryptoStorage is open source, so the community can maintain it indefinitely.</div>")
			var licenseDiv = $("<div class='flex_horizontal'>").appendTo(pageDiv);
			var mitImg = $().appendTo(licenseDiv);
			licenseDiv.append("<a href='./LICENSE.txt'><img src='img/mit.png' class='license_img'></a>");
			licenseDiv.append("<a href='https://github.com/cryptostorage/cryptostorage.com'><img src='img/github.png' class='license_img'></a>");
			pageDiv.append("<div style='height: 20px;'>");
			var downloadBtn = $("<a class='light_green_btn' href='https://github.com/cryptostorage/cryptostorage.com/archive/master.zip'>").appendTo(pageDiv);
			downloadBtn.append("Download Now (zip)");
			
			// footer
			var footerDiv = $("<div class='home_footer_div flex_horizontal'>").appendTo(div);
			footerDiv.append($("<div class='home_footer_version flex_horizontal'></div>"));
			var descriptionDiv = $("<div class='home_footer_description flex_vertical'>").appendTo(footerDiv);
			descriptionDiv.append("<div><a href='./LICENSE.txt'>MIT licensed.</a></div>JavaScript copyrights included in the source. No warranty.");
			var versionDiv = $("<div class='home_footer_version flex_horizontal flex_justify_end'>").appendTo(footerDiv);
			versionDiv.append("<a href='./versions.txt' target='_blank'>version 0.0.1 alpha</a>");
			
			// done rendering
			if (onDone) onDone(div);
			
			// render notice bar
			new NoticeController($("<div>").appendTo(noticeContainer), {showOnFail: true, showOnWarn: false, showOnPass: false}).render();
		});
		
		// track environment failure to disable clicking currency
		var environmentFailure = false;
		AppUtils.addEnvironmentListener(function() {
			environmentFailure = AppUtils.hasEnvironmentState("fail");
		});
		
		function onCurrencyClicked(plugin) {
			if (!environmentFailure) UiUtils.openStorage(plugin.getName() + " Storage", {keyGenConfig: getKeyGenConfig(plugin), confirmExit: true, showRegenerate: true}); 
		}
		
		function getKeyGenConfig(plugin) {
			var config = {};
			config.passphraseEnabled = false;
			config.splitEnabled = false;
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
		
		// load dependencies
		LOADER.load(AppUtils.getFaqDependencies(), function(err) {
			if (err) throw err;
			
			// div setup
			div.empty();
			div.attr("class", "content_div flex_vertical");
			var pageDiv = $("<div class='page_div'>").appendTo(div);
			
			// title
			var titleDiv = $("<div class='title'>").appendTo(pageDiv);
			titleDiv.html("Frequently Asked Questions");
			
			// build questions and ansewrs
			var questionsAnswers = [
				{
					id: "faq_what_is_cryptostorage",
					getQuestion: function() { return "What is cryptostorage.com?"; },
					getAnswer: function() { return "Cryptostorage.com is an open source application to generate public/private key pairs for multiple cryptocurrencies.  This site runs only in your device's browser."; }
				}, {
					id: "faq_key_pair",
					getQuestion: function() { return "What is a public/private key pair?" },
					getAnswer: function() { return "A public/private key pair is a public address and a private key.  For example:<br>" +
						"<img class='sample_key_pair_img' src='img/key_pair.png'><br><br>" +
						"The public address is used to receive funds.  It can be shared with anyone.<br><br>" + 
						"The private key authorizes funds sent to its public address to be moved.  Anyone with the private key can access the funds, so it's critical to keep private keys safe and private."; }
				}, {
					id: "faq_safe_keys",
					getQuestion: function() { return "How does cryptostorage.com help me keep my private keys safe and private?"; },
					getAnswer: function() { return "First, this application generates keys only in your device's browser.  Keys are never shared with a third party, including us, the site owners.<br><br>" + 
						"Second, this application lets you passphrase protect all generated private keys.  The passphrase is required to decrypt the private keys in order to access funds.<br><br>" + 
						"Third, this application lets you split private keys into separate pieces which must be recombined in order to recover the private keys.  For example, a Bitcoin private key can be split into 3 pieces where 2 pieces are required to recover the private key.  These pieces can be geographically separated to prevent access at any one point.<br><br>" +
						"Fourth, this application lets you save the generated keys to a digital file and printed paper for safe long term storage.<br><br>" +
						"Fifth, cryptostorage.com automatically recommends ways to improve the security of the environment the application is running in."; }
				}, {
					id: "faq_recommendations",
					getQuestion: function() { return "What environment recommendations does cryptostorage.com make?"; },
					getAnswer: function() {
						var answerDiv = $("<div>");
						answerDiv.append("In order of importance:<br>");
						var recommendationsList = $("<ol>").appendTo(answerDiv);
						recommendationsList.append("<li>Download, verify, and run the source code offline, not from the cryptostorage.com domain.</li>");
						recommendationsList.append("<li>Run the source code on a device that is disconnected from the internet and will ideally never be connected to the internet again.</li>");
						recommendationsList.append("<li>Run the source code in an open source browser like Firefox or Chromium.</li>");
						recommendationsList.append("<li>Run the source code on an open source operating system like Tails, Ubuntu, or Raspbian for the Raspberry Pi.</li>");
						return answerDiv;
					}
				}, {
					id: "faq_generate_keys",
					getQuestion: function() { return "How can I generate keys as securely as possible using cryptostorage.com?"; },
					getAnswer: function() {
						var answerDiv = $("<div>");
						var generateList = $("<ol>").appendTo(answerDiv);
						generateList.append("<li>Download and verify cryptostorage.com-<i>[version]</i>.zip.  See \"<a href='#faq6'>How can I download and verify the source code?</a>\"</li>");
						var generateTransfer = $("<li>Transfer cryptostorage.com-<i>[version]</i>.zip to a secure, air-gapped computer using a flash drive.</li>").appendTo(generateList);
						var generateTransferList = $("<ul>").appendTo(generateTransfer);
						generateTransferList.append("<li>The computer should be disconnected from the internet and ideally will never connect to the internet again</li>");
						generateTransferList.append("<li>An open-source operating system is recommended like Tails, Ubuntu, or Raspbian for the Raspberry Pi</li>");
						generateList.append("<li>Unzip cryptostorage.com-<i>[version]</i>.zip</li>");
						var generateBrowser = $("<li>Open index.html in the unzipped folder in a browser.</li>").appendTo(generateList);
						var generateBrowserList = $("<ul>").appendTo(generateBrowser);
						generateBrowserList.append("<li>An open-source browser is recommended like Firefox or Chromium</li>");
						var generateChecks = $("<li>Confirm that all environment checks pass.</li>").appendTo(generateList)
						var generateChecksList = $("<ol>").appendTo(generateChecks);
						generateChecksList.append("<li>Go to Generate New Keys from the homepage</li>");
						generateChecksList.append("<li>The notice bar at the top should indicate that all checks pass:<br><img style='width:100%;' src='img/notice_bar_pass.png'></div></li>");
						var generateKeys = $("<li>Fill out the form and click Generate Keys.</li>").appendTo(generateList);
						var generateKeysList = $("<ul>").appendTo(generateKeys);
						generateKeysList.append("<li>Protecting your keys with a passphrase is <b>strongly recommended</b>.");
						generateKeysList.append("<li>Optionally split your keys for maximum security.</li>");
						generateList.append("<li>Save the generated keys to a flash drive or printed paper for safe keeping.<br><br>" +
								"The keys can be imported at any time by relaunching the application in a secure environment.</li>");
						return answerDiv;
					}
				}, {
					id: "faq_download_verify",
					getQuestion: function() { return "How can I download and verify the source code?"; },
					getAnswer: function() {
						var answerDiv = $("<div>");
						answerDiv.append("Downloading and verifying the source code will ensure you have a legitimate copy of the application that has been publicly reviewed and has not been modified by an attacker.<br><br>");
						answerDiv.append("<b>Verifying the source code is highly recommended but not required to use this site.<b><br><br>");
						answerDiv.append("The source code can be verified in two ways.");
						var verifyList = $("<ol>").appendTo(answerDiv);
						var verify1 = $("<li>Verify the source code has been signed by woodser's PGP key.</li>").appendTo(verifyList);
						var verify1List = $("<ol>").appendTo(verify1);
						verify1List.append("<li>Install <a target='_blank' href='https://www.openpgp.org/'>PGP software</a> on your device.</li>");
						verify1List.append("<li>Download woodser’s public PGP key, \"woodser.asc\", from the <a target='_blank' href='https://github.com/cryptostorage/cryptostorage.com'>root of the GitHub source repository</a>.</li>");
						verify1List.append("<li>Import woodser's PGP key:<br><div class='terminal_cmd'>gpg --import woodser.asc<div></li>");
						verify1List.append("<li>Download cryptostorage-<i>[version]</i>.zip, cryptostorage-<i>[version]</i>.sig, and woodser-pgp-fingerprint.txt from the <a target='blank' href='https://github.com/cryptostorage/cryptostorage.com/releases'>latest release on GitHub</a>.")
						verify1List.append("<li>Verify the signature of the source code zip file<br><div class='terminal_cmd'>gpg --verify cryptostorage-<i>[version]</i>.sig cryptostorage-<i>[version]</i>.zip</div><br>" +
								"You should see output similar to this.  The RSA keys must match.<br>" +
								"<div class='terminal_cmd'>gpg: Signature made Fri Jan 12 09:22:37 2018 EST<br>gpg:                using RSA key 52FD7C01877CA968C97118D055A10DD48ADEE5EF<br>gpg: Good signature from \"woodser <woodser@users.noreply.github.com>\"</div><br>" +
								"The RSA key will also match the contents of the downloaded woodser-pgp-fingerprint.txt.<br><br>" +
								"Note: You will probably also see a warning that the key is not certified with a trusted signature.  This is expected unless you told PGP to trust woodser’s pgp key, which is not necessary.</li>");
						var verify2 = $("<li>Verify the source code has the correct checksum.</li>").appendTo(verifyList);
						var verify2List = $("<ol>").appendTo(verify2);
						verify2List.append("<li>Download cryptostorage-<i>[version]</i>.zip and checksum.txt from the <a target='_blank' href='https://github.com/cryptostorage/cryptostorage.com/releases'>latest release on GitHub</a>.</li>");
						verify2List.append("<li>Determine the SHA256 hash of the zip file.  Instructions depend on your operating system.<br><br>" +
								"Linux: <div class='terminal_cmd'>sha256sum cryptostorage-<i>[version]</i>.zip</div><br>" + 
								"Mac: <div class='terminal_cmd'>openssl sha -sha256 cryptostorage-<i>[version]</i></div><br>" + 
								"Windows: <div class='terminal_cmd'>certUtil -hashfile cryptostorage-<i>[version]</i>.zip SHA256</div></li>");
						verify2List.append("<li>Verify that the checksum matches the contents of the downloaded checksum.txt.</li>");
						return answerDiv;
					}
				}, {
					id: "faq_trust",
					getQuestion: function() { return "How can I trust this service?"; },
					getAnswer: function() { return "Cryptostorage.com is 100% open-source and verifiable.  Downloading and verifying the source code ensures you have a copy that has been publically reviewed."; }
				}, {
					id: "faq_trusted_third_party",
					getQuestion: function() { return "Are my funds ever entrusted to a third party?"; },
					getAnswer: function() { return "No.  The public/private key pairs are generated only in your devices browser so they are never shared with a third party by design."; }
				}, {
					id: "faq_split_keys",
					getQuestion: function() { return "What does it mean to split private keys?"; },
					getAnswer: function() { return "A private key can be split into separate pieces where some of the pieces are required to reconstitute the original private key.<br><br>" +
						"For example, a private key can be split into 3 pieces and 2 of the pieces can be required to recover the original private key.<br><br>" +
						"This is useful for geographically separating pieces of private keys so funds cannot be accessed without physically recombining the pieces."; }
				}, {
					id: "faq_online_to_recover",
					getQuestion: function() { return "Do I need to be online to recover private keys?"; },
					getAnswer: function() { return "No.  The application's source code has everything needed to import and recover the private keys.  A copy of this site can be saved for future use so it doesn't need to be downloaded from GitHub."; }
				}, {
					id: "faq_send_funds",
					getQuestion: function() { return "Can I send funds using cryptostorage.com?"; },
					getAnswer: function() { return "Not currently. Cryptostorage.com is a public/private key generation and recovery service. It is expected that users will import private keys into the wallet of their choice after keys have been recovered using crypstorage.com."; }
				}
			];
			
			// collect question answer controllers
			var qaControllers = [];
			for (var i = 0; i < questionsAnswers.length; i++) {
				var questionAnswer = questionsAnswers[i];
				assertInitialized(questionAnswer.id);
				qaControllers.push(new QuestionAnswerController($("<div>").appendTo(pageDiv), questionAnswer.getQuestion(), questionAnswer.getAnswer(), questionAnswer.id));
			}
			
			// render questions and answers
			var funcs = [];
			for (var i = 0; i < qaControllers.length; i++) funcs.push(renderQA(qaControllers[i]));
			function renderQA(qaController) { 
				return function(onDone) {
					qaController.render(function() {
						if (onDone) onDone();
					});
				}
			}
			async.series(funcs, function(err) {
				if (err) throw err;
				
				// open referenced faq
				openHash();
				$(window).on('hashchange', function() { openHash(); });
				function openHash() {
					for (var i = 0; i < qaControllers.length; i++) {
						if ("#" + qaControllers[i].getDiv().attr("id") === window.location.hash) {
							qaControllers[i].showAnswer(true);
						}
					}
				}
				
				// done rendering
				if (onDone) onDone(div);
			});
		});
	}
	
	/**
	 * Controls a single question/answer.
	 */
	function QuestionAnswerController(div, question, answer, id) {
		DivController.call(this, div);
		var arrowDiv;
		var answerDiv;
		this.render = function(onDone) {
			
			// div setup
			div.empty();
			div.addClass("question_answer_div flex_horizontal flex_justify_start flex_align_start");
			if (id) div.attr("id", id);
			
			// arrow div
			arrowDiv = $("<div class='faq_arrow_div'>").appendTo(div);
			arrowDiv.append("▶");
			arrowDiv.click(function() { toggle(); });
			
			// question and answer
			var qaDiv = $("<div class='flex_vertical flex_align_start flex_justify_start'>").appendTo(div);
			
			// question div
			var questionDiv = $("<div class='question'>").appendTo(qaDiv);
			questionDiv.append(question);
			questionDiv.click(function() {
				if (history.pushState) history.pushState(null, null, "#" + id);
				else location.hash = "#" + id;
			});
			
			questionDiv.click(function() { toggle(); });
			
			// answer div
			answerDiv = $("<div class='answer'>").appendTo(qaDiv);
			answerDiv.hide();
			answerDiv.append(answer);
			
			// done rendering
			if (onDone) onDone(div);
		},
		
		this.showAnswer = function(bool) {
			if (bool) {
				answerDiv.show();
				arrowDiv.html("▼");
			} else {
				answerDiv.hide();
				arrowDiv.html("▶");
			}
		}
		
		function toggle() {
			answerDiv.toggle();
			arrowDiv.html(answerDiv.is(":visible") ? "▼" : "▶");
		}
	}
	inheritsFrom(QuestionAnswerController, DivController);
}
inheritsFrom(FaqController, DivController);

/**
 * Donate page.
 */
function DonateController(div, appController) {
	DivController.call(this, div);
	
	this.render = function(onDone) {
		
		// load dependencies
		LOADER.load(AppUtils.getAppDependencies(), function(err) {
			if (err) throw err;
			
			// div setup
			div.empty();
			div.attr("class", "content_div flex_vertical");
			var pageDiv = $("<div class='page_div'>").appendTo(div);

			// build donate section
			var titleDiv = $("<div class='title'>").appendTo(pageDiv);
			titleDiv.html("Donate");
			var donations = [];
			var plugins = AppUtils.getCryptoPlugins();
			for (var i = 0; i < plugins.length; i++) {
				var plugin = plugins[i];
				donations.push({
					logo: plugin.getLogo(),
					label: plugin.getName(),
					address: plugin.getDonationAddress()
				});
			}
			renderCredits(donations, function(donationsDiv) {
				pageDiv.append(donationsDiv);
				
				// build credits section
				pageDiv.append("<br><br>");
				titleDiv = $("<div class='title'>").appendTo(pageDiv);
				titleDiv.html("Special Thanks To");
				var credits = [];
				credits.push({
					logo: AppUtils.getCryptoPlugin("ETH").getLogo(),
					label: "UI design - github.com/gregdracoulis",
					labelUrl: "https://github.com/gregdracoulis",
					address: "0x5735bb7cec965e58d03dddd167d1f27321878c51"
				});
				credits.push({
					logo: AppUtils.getCryptoPlugin("BTC").getLogo(),
					label: "bitaddress.org",
					labelUrl: "https://bitaddress.org",
					address: "1NiNja1bUmhSoTXozBRBEtR8LeF9TGbZBN"
				});
				credits.push({
					logo: AppUtils.getCryptoPlugin("XMR").getLogo(),
					label: "moneroaddress.org",
					labelUrl: "https://moneroaddress.org",
					address: "4AfUP827TeRZ1cck3tZThgZbRCEwBrpcJTkA1LCiyFVuMH4b5y59bKMZHGb9y58K3gSjWDCBsB4RkGsGDhsmMG5R2qmbLeW"
				});
				credits.push({
					label: "BitPay",
					labelUrl: "https://bitpay.com",
					image: $("<img src='img/bitpay.png'>")
				});
				
				renderCredits(credits, function(donationsDiv) {
					pageDiv.append(donationsDiv);
					
					// make addresses copyable
					new Clipboard(".copyable", {
						text: function(trigger) {
							return $(trigger).html();
						}
					});
					
					// copied tooltips
					div.find(".copyable").each(function(i, copyable) {
						tippy(copyable, {
							arrow : true,
							html : $("<div>Copied!</div>").get(0),
							interactive : true,
							placement : "top",
							theme : 'translucent',
							trigger : "click",
							distance : 5,
							arrowTransform: 'scaleX(1.25) scaleY(1.5) translateY(1px)',
							onShow : function() {
								setTimeout(function() {
									copyable._tippy.hide();
								}, 2000)
							}
						});
					});
					
					// done rendering
					if (onDone) onDone(div);
				});
			});
		});
		
		/**
		 * Renders the given credits.
		 * 
		 * @param credits are credits to render
		 * @param onDone(div) is invoked when done
		 */
		function renderCredits(credits, onDone) {
			
			// div to render to
			var creditsDiv = $("<div>");
			
			// collect functions to render values
			var left = true;
			var funcs = [];
			for (var i = 0; i < credits.length; i++) {
				var credit = credits[i];
				var creditDiv = $("<div>").appendTo(creditsDiv); 
				if (left) {
					funcs.push(renderLeftFunc(creditDiv, credit));
				} else {
					funcs.push(renderRightFunc(creditDiv, credit));
				}
				left = !left;
			}
			
			function renderLeftFunc(creditDiv, credit) {
				return function(onDone) { renderLeft(creditDiv, credit, onDone); }
			}
			
			function renderRightFunc(creditDiv, credit) {
				return function(onDone) { renderRight(creditDiv, credit, onDone); }
			}
			
			// render addresses in parallel
			async.parallel(funcs, function(err, results) {
				if (err) throw err;
				onDone(creditsDiv);
			});
		}
		
		function renderLeft(div, credit, onDone) {
			div.attr("class", "credit_left");
			var imgDiv = $("<div>").appendTo(div);
			var labelAddressDiv = $("<div class='credit_label_address'>").appendTo(div);
			var logoLabelDiv = $("<div class='credit_left_logo_label'>").appendTo(labelAddressDiv);
			if (credit.logo) {
				var logo = $("<img src='" + credit.logo.get(0).src + "'>").appendTo(logoLabelDiv);
				logo.attr("class", "credit_logo");
			}
			var labelDiv = $("<div class='credit_label'>").appendTo(logoLabelDiv);
			if (credit.labelUrl) {
				labelDiv.append($("<a target='_blank' href='" + credit.labelUrl + "'>" + credit.label + "</a>"));
			} else {
				labelDiv.append(credit.label);
			}
			if (credit.address) {
				var addressDiv = $("<div class='credit_left_address copyable'>").appendTo(labelAddressDiv);
				addressDiv.append(credit.address);
			}
			if (credit.image) {
				credit.image.attr("class", "credit_right_img");
				imgDiv.append(credit.image);
				onDone();
			} else {
				AppUtils.renderQrCode(credit.address, null, function(img) {
					img.attr("class", "credit_left_img");
					imgDiv.append(img);
					onDone();
				});
			}
		}
		
		function renderRight(div, credit, onDone) {
			div.attr("class", "credit_right");
			var labelAddressDiv = $("<div class='credit_label_address'>").appendTo(div);
			var logoLabelDiv = $("<div class='credit_right_logo_label'>").appendTo(labelAddressDiv);
			if (credit.logo) {
				var logo = $("<img src='" + credit.logo.get(0).src + "'>").appendTo(logoLabelDiv);
				logo.attr("class", "credit_logo");
			}
			var labelDiv = $("<div class='credit_label'>").appendTo(logoLabelDiv);
			if (credit.labelUrl) {
				labelDiv.append($("<a target='_blank' href='" + credit.labelUrl + "'>" + credit.label + "</a>"));
			} else {
				labelDiv.append(credit.label);
			}
			if (credit.address) {
				var addressDiv = $("<div class='credit_right_address copyable'>").appendTo(labelAddressDiv);
				addressDiv.append(credit.address);
			}
			var imgDiv = $("<div>").appendTo(div);
			if (credit.image) {
				credit.image.attr("class", "credit_right_img");
				imgDiv.append(credit.image);
				onDone();
			} else {
				AppUtils.renderQrCode(credit.address, null, function(img) {
					img.attr("class", "credit_right_img");
					imgDiv.append(img);
					onDone();
				});
			}
		}
	}
}
inheritsFrom(DonateController, DivController);

/**
 * Form page.
 */
function FormController(div) {
	DivController.call(this, div);
	
	var that = this;
	var currencyInputsDiv;
	var currencyInputs;			// tracks each currency input
	var passphraseCheckbox;
	var passphraseInputDiv;
	var passphraseInput;
	var bip38CheckboxDiv;
	var bip38Checkbox;
	var showPassphraseCheckbox;
	var splitCheckbox;
	var splitInputDiv;
	var numPiecesInput;
	var minPiecesInput;
	var	btnGenerate;
	var formErrors = {};
	var plugins = AppUtils.getCryptoPlugins();
	
	this.render = function(onDone) {
		div.empty();
		div.attr("class", "content_div flex_vertical");
		
		// load dependencies
		LOADER.load(AppUtils.getAppDependencies(), function(err) {
			if (err) throw err;
			
			// notice div
			var noticeDiv = $("<div>").appendTo(div);
			new NoticeController(noticeDiv).render();
			
			// page div
			var pageDiv = $("<div class='page_div'>").appendTo(div);
			
			// top links
//			var formLinks = $("<div class='form_links_div'>").appendTo(pageDiv);
//			var oneOfEachLink = $("<div class='form_link'>").appendTo(formLinks);
//			oneOfEachLink.html("One of each");
//			oneOfEachLink.click(function() { onOneOfEach(); });
			
			// currency inputs
			currencyInputs = [];
			var currencyDiv = $("<div class='form_section_div'>").appendTo(pageDiv);
			currencyInputsDiv = $("<div class='currency_inputs_div'>").appendTo(currencyDiv);
			
			// link to add currency
			var addCurrencyDiv = $("<div class='add_currency_div'>").appendTo(currencyDiv);
			var addCurrencySpan = $("<span class='add_currency_span'>").appendTo(addCurrencyDiv);
			addCurrencySpan.html("+ Add another currency");
			addCurrencySpan.click(function() {
				addCurrency();
			});
			
			// passphrase checkbox
			var passphraseDiv = $("<div class='form_section_div'>").appendTo(pageDiv);
			var passphraseCheckboxDiv = $("<div class='flex_horizontal flex_justify_start'>").appendTo(passphraseDiv);
			passphraseCheckbox = $("<input type='checkbox' id='passphrase_checkbox'>").appendTo(passphraseCheckboxDiv);
			var passphraseCheckboxLabel = $("<label for='passphrase_checkbox'>").appendTo(passphraseCheckboxDiv);
			passphraseCheckboxLabel.html("Do you want to protect your private keys with a passphrase?");
			passphraseCheckbox.click(function() {
				if (passphraseCheckbox.prop('checked')) {
					passphraseInputDiv.show();
					passphraseInput.focus();
				} else {
					passphraseInput.get(0)._tippy.hide(0);
					passphraseInput.val("");
					bip38Checkbox.prop('checked', false);
					passphraseInputDiv.hide();
					setPassphraseError(false);
				}
			});
			
			// passphrase input
			passphraseInputDiv = $("<div class='passphrase_input_div'>").appendTo(passphraseDiv);
			var passphraseWarnDiv = $("<div class='passphrase_warn_div'>").appendTo(passphraseInputDiv);
			passphraseWarnDiv.append("This passphrase is required to access funds later on.  <b>Don’t lose it.</b>");
			passphraseInputDiv.append("Passphrase");
			passphraseInput = $("<input type='password' class='passphrase_input'>").appendTo(passphraseInputDiv);
			passphraseInput.on("input", function(e) { setPassphraseError(false); });
			
			// password error tooltip
			tippy(passphraseInput.get(0), {
				arrow: true,
				html: $("<div>Passphrase must be at least 7 characters</div>").get(0),
				interactive: false,
				placement: 'bottom',
				theme: 'error',
				trigger: "manual",
				multiple: 'false',
				maxWidth: UiUtils.getInfoTooltipsMaxWidth(),
				distance: 20,
				arrowTransform: 'scaleX(1.25) scaleY(2.5) translateX(250) translateY(-2px)',
				offset: '-220, 0'
			});
			
			// passphrase config
			var passphraseConfigDiv = $("<div class='passphrase_config_div'>").appendTo(passphraseInputDiv);
			bip38CheckboxDiv = $("<div class='bip38_checkbox_div'>").appendTo(passphraseConfigDiv);
			bip38Checkbox = $("<input type='checkbox' id='bip38_checkbox'>").appendTo(bip38CheckboxDiv);
			var bip38CheckboxLabel = $("<label for='bip38_checkbox'>").appendTo(bip38CheckboxDiv);
			bip38CheckboxLabel.html("Use BIP38 for Bitcoin and Bitcoin Cash");
			var showPassphraseCheckboxDiv = $("<div class='show_passphrase_checkbox_div'>").appendTo(passphraseConfigDiv);
			showPassphraseCheckbox = $("<input type='checkbox' id='show_passphrase'>").appendTo(showPassphraseCheckboxDiv);
			var showPassphraseCheckboxLabel = $("<label for='show_passphrase'>").appendTo(showPassphraseCheckboxDiv);
			showPassphraseCheckboxLabel.html("Show passphrase");
			showPassphraseCheckbox.click(function() {
				if (showPassphraseCheckbox.prop('checked')) {
					passphraseInput.attr("type", "text");
				} else {
					passphraseInput.attr("type", "password");
				}
			});
			
			// bip38 tooltip
			var bip38Info = $("<img src='img/information.png' class='information_img'>").appendTo(bip38CheckboxDiv);
			var bip38Tooltip = $("<div>");
			bip38Tooltip.append("<a target='_blank' href='https://github.com/bitcoin/bips/blob/master/bip-0038.mediawiki'>BIP38</a> is a method to encrypt Bitcoin private keys with a passphrase.<br><br>");
			bip38Tooltip.append("BIP38 takes longer to encrypt and decrypt private keys than <a target='_blank' href='https://github.com/brix/crypto-js'>CryptoJS</a> (the default), which makes it more difficult crack with brute force.");
			tippy(bip38Info.get(0), {
				arrow: true,
				html: bip38Tooltip.get(0),
				interactive: true,
				placement: 'bottom',
				theme: 'translucent',
				trigger: "mouseenter",
				multiple: 'false',
				maxWidth: UiUtils.getInfoTooltipsMaxWidth(),
				distance: 20,
				arrowTransform: 'scaleX(1.25) scaleY(2.5) translateY(2px)',
				offset: '0, 0'
			});
			
			// split checkbox
			var splitDiv = $("<div class='form_section_div'>").appendTo(pageDiv);
			var splitCheckboxDiv = $("<div class='flex_horizontal flex_justify_start'>").appendTo(splitDiv);
			splitCheckbox = $("<input type='checkbox' id='split_checkbox'>").appendTo(splitCheckboxDiv);
			var splitCheckboxLabel = $("<label for='split_checkbox'>").appendTo(splitCheckboxDiv);
			splitCheckboxLabel.html("Do you want to split your storage into separate pieces?");
			splitCheckbox.click(function() {
				if (splitCheckbox.prop('checked')) {
					splitInputDiv.show();
					validateSplit(true);
				} else {
					splitInputDiv.hide();
					validateSplit(false);
				}
			});
			
			// split checkbox tooltip
			var splitInfo = $("<img src='img/information.png' class='information_img'>").appendTo(splitCheckboxDiv);
			var splitTooltip = $("<div>");
			splitTooltip.append("Splits the generated keys into separate pieces using <a target='_blank' href='https://en.wikipedia.org/wiki/Shamir%27s_Secret_Sharing'>Shamir's Secret Sharing</a>.  The pieces must be recombined in order to recover all private keys.<br><br>");
			splitTooltip.append("For example, 20 key pairs can be split into 3 pieces. Each piece will contain 20 key  pairs, but 2 of the 3 pieces are necessary to recover the private keys.<br><br>");
			splitTooltip.append("This is useful for geographically splitting your cold storage so the funds cannot be accessed until the pieces are physically recombined.");
			tippy(splitInfo.get(0), {
				arrow: true,
				html: splitTooltip.get(0),
				interactive: true,
				placement: 'bottom',
				theme: 'translucent',
				trigger: "mouseenter",
				multiple: 'false',
				maxWidth: UiUtils.getInfoTooltipsMaxWidth(),
				distance: 20,
				arrowTransform: 'scaleX(1.25) scaleY(2.5) translateY(2px)',
				offset: '-180, 0'
			});
			
			// split input
			splitInputDiv = $("<div class='split_input_div'>").appendTo(splitDiv);
			var splitQr = $("<img class='split_qr' src='img/qr_code.png'>").appendTo(splitInputDiv);
			var splitLines3 = $("<img class='split_lines_3' src='img/split_lines_3.png'>").appendTo(splitInputDiv);
			var splitNumDiv = $("<div class='split_num_div'>").appendTo(splitInputDiv);
			var splitNumLabelTop = $("<div class='split_num_label_top'>").appendTo(splitNumDiv);
			splitNumLabelTop.html("Split Each Key Into");
			numPiecesInput = $("<input type='tel' value='3' min='2'>").appendTo(splitNumDiv);
			var splitNumLabelBottom = $("<div class='split_num_label_bottom'>").appendTo(splitNumDiv);
			splitNumLabelBottom.html("Pieces");
			var splitLines2 = $("<img class='split_lines_2' src='img/split_lines_2.png'>").appendTo(splitInputDiv);
			var splitMinDiv = $("<div class='split_min_div'>").appendTo(splitInputDiv);
			var splitMinLabelTop = $("<div class='split_min_label_top'>").appendTo(splitMinDiv);
			splitMinLabelTop.html("Require");
			minPiecesInput = $("<input type='tel' value='2' min='2'>").appendTo(splitMinDiv);
			var splitMinLabelBottom = $("<div class='split_min_label_bottom'>").appendTo(splitMinDiv);
			splitMinLabelBottom.html("To Recover");	
			numPiecesInput.on("input", function(e) { validateSplit(false); });
			numPiecesInput.on("focusout", function(e) { validateSplit(true); });
			minPiecesInput.on("input", function(e) { validateSplit(false); });
			minPiecesInput.on("focusout", function(e) { validateSplit(true); });
			
			// apply default configuration
			passphraseCheckbox.prop('checked', false);
			passphraseInputDiv.hide();
			showPassphraseCheckbox.prop('checked', false);
			splitCheckbox.prop('checked', false);
			splitInputDiv.hide();
			
			// add generate button
			var generateDiv = $("<div class='form_generate_div'>").appendTo(pageDiv);
			btnGenerate = $("<div class='dark_green_btn'>").appendTo(generateDiv);
			btnGenerate.append("Generate Keys");
			
			// start over
			var startOverLink = $("<div class='form_start_over'>").appendTo(pageDiv);
			startOverLink.html("or start over")
			startOverLink.click(function() { that.startOver(); });
			
			// disable generate button if environment failure
			AppUtils.addEnvironmentListener(function() {
				formErrors.environment = AppUtils.hasEnvironmentState("fail");
				updateGenerateButton();
			});
			
			// add first currency
			addCurrency();
			
			// done rendering
			onDone(div);
		});
	}
	
	this.startOver = function() {
		
		// ignore if not initialized
		if (!currencyInputs) return;
		
		// reset currencies
		for (var i = 0; i < currencyInputs.length; i++) {
			currencyInputs[i].getDiv().remove();
		}
		currencyInputs = [];
		addCurrency();
		
		// reset passphrase
		passphraseCheckbox.prop('checked', false);
		passphraseInputDiv.hide();
		showPassphraseCheckbox.prop('checked', false);
		passphraseInput.val("");
		bip38Checkbox.prop('checked', false);
		
		// reset split
		splitCheckbox.prop('checked', false);
		splitInputDiv.hide();
		numPiecesInput.val(3);
		minPiecesInput.val(2);
		
		// update form
		validateForm();
	}
	
	// handle when generate button clicked
	function onGenerate(onDone) {
		validateForm(true);
		if (!hasFormErrors()) UiUtils.openStorage("Export Storage", {keyGenConfig: getConfig(), confirmExit: true});
		if (onDone) onDone();
	}
	
	// get current form configuration
	function getConfig() {
		var config = {};
		config.passphraseEnabled = passphraseCheckbox.prop('checked');
		config.passphrase = passphraseInput.val();
		config.splitEnabled = splitCheckbox.prop('checked');
		config.numPieces = config.splitEnabled ? parseFloat(numPiecesInput.val()) : 1;
		config.minPieces = config.splitEnabled ? parseFloat(minPiecesInput.val()) : null;
		config.verifyEncryption = AppUtils.VERIFY_ENCRYPTION;
		config.currencies = [];
		for (var i = 0; i < currencyInputs.length; i++) {
			var currencyInput = currencyInputs[i];
			config.currencies.push({
				ticker: currencyInput.getSelectedPlugin().getTicker(),
				numKeys: currencyInput.getNumKeys(),
				encryption: config.passphraseEnabled ? getEncryptionScheme(currencyInput) : null
			});
		}
		verifyConfig(config);
		return config;
		
		function getEncryptionScheme(currencyInput) {
			if (currencyInput.getSelectedPlugin().getTicker() === "BTC" && bip38Checkbox.prop('checked')) return AppUtils.EncryptionScheme.BIP38;
			if (currencyInput.getSelectedPlugin().getTicker() === "BCH" && bip38Checkbox.prop('checked')) return AppUtils.EncryptionScheme.BIP38;
			return AppUtils.EncryptionScheme.CRYPTOJS;
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
	
	// -------------------------------- PRIVATE ---------------------------------
	
	function addCurrency(defaultTicker) {
		
		// create input
		var currencyInput = new CurrencyInput($("<div>"), currencyInputs.length, plugins, defaultTicker, updateBip38Checkbox, function() {
			removeCurrency(currencyInput);
		}, function(isValid) {
			validateCurrencyInputs();
			updateGenerateButton();
		});
		
		// update currency inputs and add to page
		currencyInputs.push(currencyInput);
		currencyInputs[0].setTrashEnabled(currencyInputs.length !== 1);
		currencyInput.getDiv().appendTo(currencyInputsDiv);
		updateBip38Checkbox();
	}
	
	function removeCurrency(currencyInput) {
		var idx = currencyInputs.indexOf(currencyInput);
		if (idx < 0) throw new Error("Could not find currency input");
		currencyInputs.splice(idx, 1);
		currencyInputs[0].setTrashEnabled(currencyInputs.length !== 1);
		currencyInput.getDiv().remove();
		validateCurrencyInputs();
	}
	
	function onOneOfEach() {
		
		// remove existing currencies
		for (var i = 0; i < currencyInputs.length; i++) {
			currencyInputs[i].getDiv().remove();
		}
		currencyInputs = [];
		
		// add one input per currency
		for (var i = 0; i < plugins.length; i++) {
			addCurrency(plugins[i].getTicker());
		}
		validateCurrencyInputs();
		updateBip38Checkbox();
	}
	
	function updateBip38Checkbox() {
		
		// determine if BTC is selected
		var btcFound = false;
		for (var i = 0; i < currencyInputs.length; i++) {
			var currencyInput = currencyInputs[i];
			if (!currencyInput.getSelectedPlugin()) continue;
			if (currencyInput.getSelectedPlugin().getTicker() === "BTC") {
				btcFound = true;
				break;
			}
		}
		
		// determine if BCH is selected
		var bchFound = false;
		for (var i = 0; i < currencyInputs.length; i++) {
			var currencyInput = currencyInputs[i];
			if (!currencyInput.getSelectedPlugin()) continue;
			if (currencyInput.getSelectedPlugin().getTicker() === "BCH") {
				bchFound = true;
				break;
			}
		}
		
		// show or hide bip38 checkbox
		btcFound || bchFound ? bip38CheckboxDiv.show() : bip38CheckboxDiv.hide();
	}
	
	function updateGenerateButton() {
		setGenerateEnabled(!hasFormErrors());
	}
	
	function hasFormErrors() {
		return formErrors.environment || formErrors.currencyInputs || formErrors.passphrase || formErrors.split;
	}
	
	function validateForm(validateCurrencySelection) {
		validateCurrencyInputs(validateCurrencySelection);
		validatePassphrase();
		validateSplit(true);
	}
	
	function validateCurrencyInputs(validateCurrencySelection) {
		var err = null;
		for (var i = 0; i < currencyInputs.length; i++) {
			if (validateCurrencySelection) currencyInputs[i].validate();
			if (!currencyInputs[i].isValid()) err = true;
		}
		formErrors.currencyInputs = err;
		updateGenerateButton();
	}
	
	function validatePassphrase() {
		
		// handle passphrase not checked
		if (!passphraseCheckbox.is(":checked")) {
			formErrors.passphrase = false;
			passphraseInput.removeClass("form_input_error_div");
		}
		
		// handle passphrase checked
		else {
			var passphrase = passphraseInput.val();
			setPassphraseError(!passphrase || passphrase.length < AppUtils.MIN_PASSWORD_LENGTH);
		}

		updateGenerateButton();
	}
	
	function setPassphraseError(bool) {
		if (bool) {
			formErrors.passphrase = true;
			passphraseInput.addClass("form_input_error_div");
			passphraseInput.focus();
			setImmediate(function() { passphraseInput.get(0)._tippy.show(); });	// initial click causes tooltip to hide, so wait momentarily
		} else {
			passphraseInput.removeClass("form_input_error_div");
			formErrors.passphrase = false;
			passphraseInput.get(0)._tippy.hide();
		}
		updateGenerateButton();
	}
	
	function validateSplit(strictBlankAndRange) {
		
		// handle split not checked
		if (!splitCheckbox.is(":checked")) {
			formErrors.split = false;
			numPiecesInput.removeClass("form_input_error_div");
			minPiecesInput.removeClass("form_input_error_div");
		}
		
		// handle if split checked
		else {
			formErrors.split = false;
			
			// validate num pieces
			var numPiecesError = false;
			var numPieces = Number(numPiecesInput.val());
			if (strictBlankAndRange) {
				if (!numPiecesInput.val() || !isInt(numPieces) || numPieces < 2) {
					numPiecesError = true;
					formErrors.split = true;
					numPiecesInput.addClass("form_input_error_div");
				} else {
					numPiecesInput.removeClass("form_input_error_div");
				}
			} else {
				if (!numPiecesInput.val() || isInt(numPieces)) {
					numPiecesInput.removeClass("form_input_error_div");
				} else {
					numPiecesError = true;
					formErrors.split = true;
					numPiecesInput.addClass("form_input_error_div");
				}
			}
			
			// validate min pieces
			var minPieces = Number(minPiecesInput.val());
			if (strictBlankAndRange) {
				if (!minPiecesInput.val() || !isInt(minPieces) || minPieces < 2 || (!numPiecesError && minPieces > numPieces)) {
					formErrors.split = true;
					minPiecesInput.addClass("form_input_error_div");
				} else {
					minPiecesInput.removeClass("form_input_error_div");
				}
			} else {
				if (!minPiecesInput.val() || isInt(minPieces)) {
					minPiecesInput.removeClass("form_input_error_div");
				} else {
					formErrors.split = true;
					minPiecesInput.addClass("form_input_error_div");
				}
			}
		}
		
		updateGenerateButton();
	}
	
	function setGenerateEnabled(generateEnabled) {
		btnGenerate.unbind("click");
		if (generateEnabled) {
			btnGenerate.removeClass("dark_green_btn_disabled");
			btnGenerate.click(function() { onGenerate(); });
		} else {
			btnGenerate.addClass("dark_green_btn_disabled");
		}
	}
	
	/**
	 * Encapsulate a currency input.
	 * 
	 * @param div is the div to render to
	 * @param idx is the index of this input relative to the other inputs to accomodate ddslick's id requirement
	 * @param defaultTicker is the ticker of the initial selected currency
	 * @param onCurrencyChanged(ticker) is invoked when the user changes the currency selection
	 * @param onDelete is invoked when the user delets this input
	 * @param onValidChange(bool) is invoked when the validity state changes
	 */
	function CurrencyInput(div, idx, plugins, defaultTicker, onCurrencyChanged, onDelete, onValidChange) {
		assertInitialized(div);
		assertInitialized(plugins);
		
		var that = this;
		var selectedPlugin;
		var numKeysInput;
		var selector;
		var selectorData;
		var trashDiv;
		var trashImg;
		var initializing = true;
		var valid = true;
		var validCurrency = true;
		var validNumKeys = true;
		
		this.getDiv = function() {
			return div;
		},
		
		this.getSelectedPlugin = function() {
			return selectedPlugin;
		},
		
		this.setSelectedCurrency = function(ticker) {
						
			// reset dropdown
			if (ticker === null || ticker === undefined) {
				selector.ddslick("destroy");
				selector = $("#currency_selector_" + idx, div);	// ddslick requires id reference
				selector.ddslick({
					data: selectorData,
					background: "white",
					imagePosition: "left",
					selectText: "Select a Currency...",
					defeaultSelectedIndex: null,
					onSelected: function(selection) {
						selectedPlugin = plugins[selection.selectedIndex];
						validateCurrency();
					}
				});
				selectedPlugin = null;
				selector = $("#currency_selector_" + idx, div);	// ddslick requires id reference
			}
			
			// set to currency
			else {
				var name = AppUtils.getCryptoPlugin(ticker).getName();
				for (var i = 0; i < selectorData.length; i++) {
					if (selectorData[i].text === name) {
						selector.ddslick('select', {index: i});
						selectedPlugin = plugins[i];
						validateCurrency();
						break;
					}
				}
			}
		},
		
		this.getNumKeys = function() {
			var num = Number(numKeysInput.val());
			if (isInt(num)) return num;
			return null;
		},
		
		this.setTrashEnabled = function(enabled) {
			trashDiv.unbind("click");
			if (enabled) {
				trashDiv.click(function() { onDelete(); });
				trashImg.removeClass("trash_div_disabled");
			} else {
				trashImg.addClass("trash_div_disabled");
			}
		},
		
		/**
		 * Indicates if any validation errors are visible on this currency input.
		 * 
		 * @returns true if any validation errors are visible, false otherwise
		 */
		this.isValid = function() {
			return valid;
		},
		
		/**
		 * Validates the currency input.
		 * 
		 * @returns true if this currency input has validation errors visible on the UI, false otherwise
		 */
		this.validate = function() {
			validateCurrency();
			validateNumKeys(false);
			return that.isValid();
		}
		
		// ---------------------- PRIVATE ------------------------
		
		function validateCurrency() {
			if (selectedPlugin) {
				validCurrency = true;
				$(".dd-select", selector).removeClass("form_input_error_div");
			} else {
				validCurrency = false;
				$(".dd-select", selector).addClass("form_input_error_div");
			}
			
			// update valid state
			updateValidity();
			return validCurrency;
		}
		
		function validateNumKeys(ignoreBlank) {
			
			// check for blank box
			if (ignoreBlank && !numKeysInput.val()) {
				numKeysInput.removeClass("form_input_error_div");
				validNumKeys = true;
			}
			
			// validate num keys
			var numKeys = that.getNumKeys();
			if (isInt(numKeys) && numKeys >= 1) {
				numKeysInput.removeClass("form_input_error_div");
				validNumKeys = true;
			} else {
				numKeysInput.addClass("form_input_error_div");
				validNumKeys = false;
			}
			
			// update valid state
			updateValidity();
			return validNumKeys;
		}
		
		function updateValidity() {
			if (validCurrency && validNumKeys !== valid) {
				valid = validCurrency && validNumKeys;
				onValidChange(valid);
			} else {
				valid = validCurrency && validNumKeys;
			}
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
			that.setSelectedCurrency(null);	// initializes selector
			if (defaultTicker) that.setSelectedCurrency(defaultTicker);
			
			// create right div
			var rightDiv = $("<div class='currency_input_right_div'>").appendTo(div);
			rightDiv.append("Key pairs to generate&nbsp;&nbsp;");
			numKeysInput = $("<input type='tel' value='1' min='1'>").appendTo(rightDiv);
			numKeysInput.on("input", function(e) { validateNumKeys(true); });
			numKeysInput.on("focusout", function(e) { validateNumKeys(false); });
			rightDiv.append("&nbsp;&nbsp;");
			trashDiv = $("<div class='trash_div'>").appendTo(rightDiv);
			trashDiv.click(function() { onDelete(); });
			trashImg = $("<img class='trash_img' src='img/trash.png'>").appendTo(trashDiv);
			
			// no longer initializing
			initializing = false;
		}
	}
}
inheritsFrom(FormController, DivController);

/**
 * Import page.
 */
function ImportController(div) {
	DivController.call(this, div);
	
	var tabController;
	var importFileController;
	var importTextController;
	
	this.render = function(onDone) {
		
		// load dependencies
		LOADER.load(AppUtils.getAppDependencies(), function(err) {
			if (err) throw err;
			
			// div setup
			div.empty();
			div.attr("class", "content_div flex_vertical");
			
			// notice div
			var noticeDiv = $("<div>").appendTo(div);
			new NoticeController(noticeDiv).render();
			
			// set up page div
			var pageDiv = $("<div class='page_div import_page'>").appendTo(div);
			$("<div class='import_filler'>").appendTo(pageDiv);
			var importDiv = $("<div class='import_div'>").appendTo(pageDiv);
			
			// render import file and text divs
			var importFileDiv = $("<div>");
			var importTextDiv = $("<div>");
			importFileController = new ImportFileController(importFileDiv);
			importFileController.render(function() {
				importTextController = new ImportTextController(importTextDiv, AppUtils.getCryptoPlugins());
				importTextController.render(function() {
					tabController = new TwoTabController(importDiv, "Import From File", importFileDiv, "Import From Text", importTextDiv);
					tabController.render(function() {
						if (onDone) onDone(div);
					});
				});
			});
		});
	}
	
	this.startOver = function() {
		if (tabController) tabController.selectTab(0);
		if (importFileController) importFileController.startOver();
		if (importTextController) importTextController.startOver();
	}
}
inheritsFrom(ImportController, DivController);

/**
 * Controller to import from file.
 * 
 * @param div is the div to render to
 */
function ImportFileController(div) {
	DivController.call(this, div);
	
	var that = this;
	var importInputDiv;						// all import input
	var warningDiv;
	var warningMsg;
	var fileInputDiv;							// drag and drop and imported pieces
	var decryptionDiv;						// password input and decryption
	var importedNamedPieces = [];	// [{name: 'btc.json', value: {...}}, ...]
	var importedPiecesDiv;				// shows imported items
	var controlsDiv;							// div for all control links
	var importedStorageDiv;				// inline storage
	var lastKeys;
	var decryptionController;
	
	this.render = function(onDone) {
		
		// div setup
		div.empty();
		div.addClass("import_content_div");
		
		// div to collect all import input
		importInputDiv = $("<div class='import_input_div'>").appendTo(div);
		
		// warning div
		warningDiv = $("<div class='import_warning_div'>").appendTo(importInputDiv);
		warningDiv.hide();
		
		// all file importing
		fileInputDiv = $("<div>").appendTo(importInputDiv);
		
		// decryption div
		decryptionDiv = $("<div>").appendTo(importInputDiv);
		decryptionDiv.hide();
		
		// drag and drop div
		var dragDropDiv = $("<div class='import_drag_drop'>").appendTo(fileInputDiv);
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
		importedPiecesDiv = $("<div class='import_imported_pieces'>").appendTo(fileInputDiv);
		importedPiecesDiv.hide();
		
		// controls
		controlsDiv = $("<div class='import_controls'>").appendTo(importInputDiv);
		controlsDiv.hide();
		resetControls();
		
		// div for inline storage
		importedStorageDiv = $("<div class='imported_storage_div'>").appendTo(div);
		importedStorageDiv.hide();
		
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
			img.addClass("import_warning_div_icon");
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
				AppUtils.validatePiece(namedPiece.piece, true);
				if (!isPieceImported(namedPiece.name)) importedNamedPieces.push(namedPiece);
			} catch (err) {
				if (AppUtils.DEV_MODE) console.log(err);
				that.setWarning("Invalid piece '" + namedPiece.name + "': " + err.message);
			}
		}
		updatePieces(onDone);
	}
	
	this.startOver = function() {
		that.setWarning("");
		importedStorageDiv.hide();
		importInputDiv.show();
		fileInputDiv.show();
		decryptionDiv.hide();
		importedPiecesDiv.hide();
		controlsDiv.hide();
		removePieces();
		if (decryptionController) decryptionController.cancel();
	}
	
	// ------------------------ PRIVATE ------------------
	
	function resetControls() {
		controlsDiv.empty();
		addControl("start over", that.startOver);
	}
	
	function addControl(text, onClick) {
		var linkDiv = $("<div class='import_control_link_div'>").appendTo(controlsDiv);
		var link = $("<div class='import_control_link'>").appendTo(linkDiv);
		link.append(text);
		link.click(function() { onClick(); });
	}
	
	function onKeysImported(pieces, keys) {
		resetControls();
		that.setWarning("");
		keys = listify(keys);
		assertTrue(keys.length > 0);
		if (keys[0].hasPrivateKey() && keys[0].isEncrypted()) {
			
			// create decryption controller and register callbacks
			decryptionController = new DecryptionController(decryptionDiv, keys, function(warning) {
				that.setWarning(warning);
			}, function(decryptedKeys, decryptedPieces, decryptedPieceDivs) {
				showStorage(pieces, decryptedKeys, decryptedPieces, decryptedPieceDivs);
			});
			
			// render decryption controller
			decryptionController.render(function() {
				
				// replace file input div with decryption
				fileInputDiv.hide();
				decryptionDiv.show();
				controlsDiv.show();
				decryptionController.focus();
				
				// add control to view encrypted keys
				addControl("view encrypted keys", function() {
					UiUtils.openStorage("Encrypted Keys", {splitPieces: pieces.length > 1 ? pieces : null, keys: keys});
				});
			});
		} else {
			showStorage(pieces, keys);
		}
	}
	
	function showStorage(importedPieces, keys, pieces, pieceDivs) {
		resetControls();
		importInputDiv.hide();
		importedStorageDiv.empty();
		importedStorageDiv.show();
		
		// import success message
		var successDiv = $("<div class='import_success_div flex_vertical'>").appendTo(importedStorageDiv);
		var successTitle = $("<div class='import_success_title flex_horizontal'>").appendTo(successDiv);
		successTitle.append($("<img class='import_success_checkmark' src='img/checkmark.png'>"));
		successTitle.append("Imported Successfully");
		var successLinks = $("<div class='flex_horizontal import_success_links'>").appendTo(successDiv);
		if (importedPieces.length > 1) successLinks.append("<div class='import_success_checkmark'>");	// filler to center control links under title text
		var startOver = $("<div class='import_control_link'>").appendTo(successLinks);
		startOver.append("start over");
		startOver.click(function() { that.startOver(); });
		if (importedPieces.length > 1) {
			var viewSplit = $("<div class='import_control_link'>").appendTo(successLinks);
			viewSplit.append("view split pieces");
			viewSplit.click(function() { UiUtils.openStorage("Imported Pieces", {pieces: importedPieces}); });
		}
		
		// inline storage
		var storageDiv = $("<div>").appendTo(importedStorageDiv);
		new ExportController(storageDiv, window, {
			keys: keys,
			pieces: pieces,
			pieceDivs: pieceDivs
		}).render();
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
			else that.setWarning("File is not a zip or json file");
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
				AppUtils.zipToPieces(data, function(namedPieces) {
					onNamedPieces(null, namedPieces);
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
		tickers = toUniqueArray(tickers);
		
		// add control to view pieces
		addControl("view imported pieces", function() {
			UiUtils.openStorage("Imported Storage", {pieces: pieces});
		});
		
		// attempt to get keys
		var keys;
		try {
			var keys = AppUtils.piecesToKeys(pieces);
		} catch (err) {
			if (AppUtils.DEV_MODE) console.log(err);
			var img = err.message.indexOf("additional piece") > -1 ? $("<img src='img/files.png'>") : null;
			that.setWarning(err.message, img);
		}
		
		// import keys
		if (keys && keys.length && keysDifferent(lastKeys, keys)) onKeysImported(pieces, keys);
		lastKeys = keys;
		
		// done rendering
		if (onDone) onDone();
		
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
			var importedPieceDiv = $("<div class='import_file_imported_piece'>").appendTo(importedPiecesDiv);
			var icon = $("<img src='img/file.png' class='import_imported_icon'>").appendTo(importedPieceDiv);
			importedPieceDiv.append(namedPiece.name);
			var trash = $("<img src='img/trash.png' class='import_imported_trash'>").appendTo(importedPieceDiv);
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
inheritsFrom(ImportFileController, DivController);

/**
 * Controller to import from text.
 * 
 * @param div is the div to render to
 */
function ImportTextController(div, plugins) {
	DivController.call(this, div);
	assertTrue(plugins.length > 0);
	
	var MAX_PIECE_LENGTH = 58;	// max length of piece strings to render
	
	var that = this;
	var importInputDiv;					// all import input
	var warningDiv;
	var textInputDiv;						// all text input
	var decryptionDiv;					// decryption div
	var selector;
	var selectorDisabler;
	var selectedPlugin;
	var textArea;
	var importedPieces = [];		// string[]
	var importedPiecesDiv;			// div for imported pieces
	var controlsDiv;
	var lastKeys;
	var decryptionController;
	var importedStorageDiv;			// inline storage
	var selectDefault = false;	// dropdown selection is assigned a defaultd
	
	this.render = function(onDone) {
		
		// div setup
		div.empty();
		div.addClass("import_content_div");
		
		// div to collect all import input
		importInputDiv = $("<div class='import_input_div'>").appendTo(div);
		
		// warning div
		warningDiv = $("<div class='import_warning_div'>").appendTo(importInputDiv);
		warningDiv.hide();
		
		// all text importing
		textInputDiv = $("<div>").appendTo(importInputDiv);
		
		// decryption div
		decryptionDiv = $("<div>").appendTo(importInputDiv);
		decryptionDiv.hide();
		
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
		var selectorContainer = $("<div class='import_selector_container'>").appendTo(textInputDiv);
		selector = $("<div id='import_selector'>").appendTo(selectorContainer);
		selectorDisabler = $("<div class='import_selector_disabler'>").appendTo(selectorContainer);
		
		// text area
		textArea = $("<textarea class='import_textarea'>").appendTo(textInputDiv);
		textArea.attr("placeholder", "Enter a private key or split pieces of a private key");
		
		// submit button
		var submit = $("<div class='import_button'>").appendTo(textInputDiv);
		submit.html("Submit");
		submit.click(function() { submitPieces(); });
		
		// imported pieces
		importedPiecesDiv = $("<div class='import_imported_pieces'>").appendTo(textInputDiv);
		importedPiecesDiv.hide();
		
		// controls
		controlsDiv = $("<div class='import_controls'>").appendTo(importInputDiv);
		controlsDiv.hide();
		resetControls();
		
		// div for inline storage
		importedStorageDiv = $("<div class='imported_storage_div'>").appendTo(div);
		importedStorageDiv.hide();
		
		// initialize
		that.startOver();
		
		// done rendering
		if (onDone) onDone(div);
	}
	
	function resetControls() {
		controlsDiv.empty();
		addControl("start over", that.startOver);
	}
	
	function addControl(text, onClick) {
		var linkDiv = $("<div class='import_control_link_div'>").appendTo(controlsDiv);
		var link = $("<div class='import_control_link'>").appendTo(linkDiv);
		link.append(text);
		link.click(function() { onClick(); });
	}
	
	this.startOver = function() {
		setWarning("");
		textArea.val("");
		importedStorageDiv.hide();
		importInputDiv.show();
		textInputDiv.show();
		decryptionDiv.hide();
		importedPiecesDiv.hide();
		controlsDiv.hide();
		removePieces();
		setSelectorEnabled(true);
		setSelectedCurrency(null);
		if (decryptionController) decryptionController.cancel();
	}
	
	function setSelectorEnabled(bool) {
		if (bool) {
			$("*", selector).removeClass("disabled_text");
			selectorDisabler.hide();
		} else {
			$("*", selector).addClass("disabled_text");
			selectorDisabler.show();
		}
	}
	
	function setSelectedCurrency(ticker) {
		
		// reset dropdown
		if (ticker === null) {
			selector.ddslick("destroy");
			selector = $("#import_selector", div);	// ddslick requires id reference
			selector.ddslick({
				data: selectorData,
				background: "white",
				imagePosition: "left",
				selectText: "Select a Currency...",
				width:'100%',
				defeaultSelectedIndex: null,
				onSelected: function(selection) {
					selectedPlugin = plugins[selection.selectedIndex];
				}
			});
			selectedPlugin: null,
			selector = $("#import_selector", div);	// ddslick requires id reference
		}
		
		// set to currency
		else {
			var name = AppUtils.getCryptoPlugin(ticker).getName();
			for (var i = 0; i < selectorData.length; i++) {
				if (selectorData[i].text === name) {
					selector.ddslick('select', {index: i});
					selectedPlugin = plugins[i];
					break;
				}
			}
		}
	}
	
	function onKeysImported(keys) {
		keys = listify(keys);
		assertTrue(keys.length > 0);
		if (keys[0].isEncrypted()) {
			
			// create decryption controller and register callbacks
			decryptionController = new DecryptionController(decryptionDiv, keys, function(warning) {
				setWarning(warning);
			}, function(decryptedKeys, pieces, pieceDivs) {
				onKeysDecrypted(decryptedKeys, pieces, pieceDivs);
			});
			
			// render decryption controller
			decryptionController.render(function() {
				
				// replace text input div with decryption
				textInputDiv.hide();
				decryptionDiv.show();
				controlsDiv.show();
				decryptionController.focus();
				
				// add control to view encrypted keys
				addControl("view encrypted key", function() {
					UiUtils.openStorage("Encrypted Key", {keys: keys});
				});
			});
		} else {
			onKeysDecrypted(keys);
		}
	}
	
	function onKeysDecrypted(keys, pieces, pieceDivs) {
		resetControls();
		importInputDiv.hide();
		importedStorageDiv.empty();
		importedStorageDiv.show();
		
		// import success message
		var successDiv = $("<div class='import_success_div flex_vertical'>").appendTo(importedStorageDiv);
		var successTitle = $("<div class='import_success_title flex_horizontal'>").appendTo(successDiv);
		successTitle.append($("<img class='import_success_checkmark' src='img/checkmark.png'>"));
		successTitle.append("Imported Successfully");
		var successLinks = $("<div class='flex_horizontal import_success_links'>").appendTo(successDiv);
		var startOver = $("<div class='import_control_link'>").appendTo(successLinks);
		startOver.append("start over");
		startOver.click(function() { that.startOver(); });
		
		// inline storage
		var storageDiv = $("<div>").appendTo(importedStorageDiv);
		new ExportController(storageDiv, window, {
			keys: keys,
			pieces: pieces,
			pieceDivs: pieceDivs
		}).render();
	}
	
	function setWarning(str, img) {
		warningDiv.empty();
		if (str) {
			if (!img) img = $("<img src='img/warning.png'>");
			warningDiv.append(img);
			img.addClass("import_warning_div_icon");
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
		
		// check for unselected currency
		if (!selectedPlugin) {
			setWarning("No currency selected");
			return;
		}
		
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
		
		// add pieces
		updatePieces(contentLines);
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
					if (arrayContains(importedPieces, piece)) {
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
							if (AppUtils.isPossibleSplitPiece(piece)) importedPieces.push(piece);
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
					if (err.message.indexOf("additional piece") > -1) setWarning(err.message, $("<img src='img/files.png'>"));
					else if (err.message.indexOf("Unrecognized private key") > -1) setWarning("Pieces do not combine to make valid private key");
					else setWarning(err.message);
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
			var importedPieceDiv = $("<div class='import_text_imported_piece'>").appendTo(importedPiecesDiv);
			var icon = $("<img src='img/file.png' class='import_imported_icon'>").appendTo(importedPieceDiv);
			importedPieceDiv.append(AppUtils.getShortenedString(piece, MAX_PIECE_LENGTH));
			var trash = $("<img src='img/trash.png' class='import_imported_trash'>").appendTo(importedPieceDiv);
			trash.click(function() { removePiece(piece); });
			return importedPieceDiv;
		}
	}
}
inheritsFrom(ImportTextController, DivController);

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
	var canceller = {};
	
	this.render = function(onDone) {
		
		// set up div
		div.empty();
		div.addClass("import_decryption_div");
		
		// label
		labelDiv = $("<div class='import_decrypt_label'>").appendTo(div);
		
		// passphrase input
		inputDiv = $("<div>").appendTo(div);
		passphraseInput = $("<input type='password' class='import_passphrase_input'>").appendTo(inputDiv)
		submitButton = $("<div class='import_button'>").appendTo(inputDiv);
		submitButton.html("Submit");
		submitButton.click(function() { onSubmit(); });
		
		// progress bar
		progressDiv = $("<div class='import_progress_div'>").appendTo(div);
		
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
	
	this.cancel = function() {
		canceller.isCancelled = true;
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
		var decryptWeight = AppUtils.getWeightDecryptKeys(encryptedKeys);
		var renderWeight = PieceRenderer.getWeight(encryptedKeys.length, 1, null);
		var totalWeight = decryptWeight + renderWeight;
		
		// switch content div to progress bar
		inputDiv.hide();
		progressDiv.show();
		progressDiv.empty();
		progressBar = UiUtils.getProgressBar(progressDiv);
		
		// let UI breath
		setImmediate(function() {
			
			// decrypt keys async
			var copies = [];
			for (var i = 0; i < encryptedKeys.length; i++) copies.push(encryptedKeys[i].copy());
			AppUtils.decryptKeys(copies, passphrase, canceller, function(percent, label) {
				setProgress(percent * decryptWeight / totalWeight, label);
			}, function(err, decryptedKeys) {
				if (canceller && canceller.isCancelled) return;
				
				// if error, switch back to input div
				if (err) {
					onWarning(err.message);
					init();
					return;
				}
				
				// convert keys to pieces
				var pieces = AppUtils.keysToPieces(decryptedKeys);
				
				// render pieces
				new PieceRenderer(pieces, null, null).render(function(percentDone) {
					setProgress((decryptWeight + percentDone * renderWeight) / totalWeight, "Rendering...");
				}, function(err, pieceDivs) {
					if (err) throw err;
					onKeysDecrypted(decryptedKeys, pieces, pieceDivs);
				});
			});
		});
	}
	
	function setProgress(percent, label) {
		assertTrue(percent >= 0 && percent <= 1);
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
	
	var that = this;
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
		
		// set up tabs
		tabsDiv = $("<div class='import_tabs_div'>").appendTo(div);
		tab1 = $("<div class='import_tab_div'>").appendTo(tabsDiv);
		tab1.html(tabName1);
		tab1.click(function() { that.selectTab(0); });
		tab2 = $("<div class='import_tab_div'>").appendTo(tabsDiv);
		tab2.html(tabName2);
		tab2.click(function() { that.selectTab(1); });
		
		// add content div
		contentDiv = $("<div>").appendTo(div);
		
		// start on first tab by default
		that.selectTab(defaultTabIdx ? defaultTabIdx : 0);
		
		// done rendering
		if (onDone) onDone(div);
	}
	
	this.getTabsDiv = function() {
		return tabsDiv;
	}
	
	this.selectTab = function(idx) {
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
			throw new Error("Tab index must be 0 or 1 but was " + idx);
		}
	}
}
inheritsFrom(TwoTabController, DivController);

/**
 * Export page.
 * 
 * At least one of keyGenConfig, keys, pieces, and pieceDivs are required in the config.
 * 
 * @param div is the div to render to
 * @param window is a reference to the window for printing
 * @param config specifies export page behavior
 * 				config.splitPieces are imported split pieces
 * 				config.keyGenConfig is a configuration to generate new storage
 * 				config.keys are keys to generate pieces from
 * 				config.pieces are pieces to export and generate pieceDivs from
 * 				config.pieceDivs are pre-generated piece divs ready for display
 * 				config.confirmExit specifies if the window should confirm exit
 * 				config.showRegenerate specifies if the regenerate button should be shown
 * 				config.showNotices specifies if notices should be shown
 */
function ExportController(div, window, config) {
	DivController.call(this, div);
	
	// global variables
	var saved = false;
	var progressDiv;
	var progressBar;
	var progressLabel;
	var saveButton;
	var printButton;
	var savePublicButton;
	var showPublicCheckbox;
	var showPrivateCheckbox;
	var showLogosCheckbox;
	var paginator;
	var piecesDiv;
	var piecesLabel;
	var controlsEnabled;
	var printEnabled;
	var lastRenderer;
	var regenerateDiv;
	var publicAvailable;
	var privateAvailable;
	var quickGenerate = isQuickGenerate();	// only show notice bar and key pair when completely done if quick generate
	
	// confirm exit if storage not saved or printed
	if (config.confirmExit) {
		window.addEventListener("beforeunload", function (e) {
		  var confirmationMessage = "Close storage?";
		  (e || window.event).returnValue = confirmationMessage;	// Gecko + IE
		  return confirmationMessage;     												// Webkit, Safari, Chrome             
		});
	}
	
	this.render = function(onDone) {
		div.empty();
		div.addClass("export_div");
		
		// export header
		var exportHeader = $("<div class='export_header'>").appendTo(div);
		
		// export buttons
		var exportButtons = $("<div class='export_buttons'>").appendTo(exportHeader);
		saveButton = $("<div class='export_button'>").appendTo(exportButtons);
		saveButton.html("Save All");
		printButton = $("<div class='export_button'>").appendTo(exportButtons);
		printButton.html("Print All");
		savePublicButton = $("<div class='export_button'>").appendTo(exportButtons);
		savePublicButton.html("Save Public Addresses");
		
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
		showLogosCheckboxLabel.html("Show logos");
		
		// apply default checkbox state
		publicAvailable = (!config.keys && !config.pieces) || isPublicAvailable(config.keys, config.pieces);
		privateAvailable = (!config.keys && !config.pieces) || isPrivateAvailable(config.keys, config.pieces);
		if (publicAvailable) {
			showPublicCheckbox.prop('checked', true);
		} else {
			showPublicCheckbox.prop('checked', false);
			showPublicCheckbox.attr("disabled", "disabled");
		}
		if (privateAvailable) {
			showPrivateCheckbox.prop('checked', true);
		} else {
			showPrivateCheckbox.prop('checked', false);
			showPrivateCheckbox.attr("disabled", "disabled");
		}
		showLogosCheckbox.prop('checked', true);
		
		// sort pieces and pieceDivs by piece number
		sortPieces();
		
		// piece selection
		var paginatorSource = getPaginatorSource(config.keyGenConfig, config.pieces);
		if (paginatorSource) {
			paginator = $("<div id='paginator'>").appendTo(exportHeader);
			$("#paginator", exportHeader).pagination({
				dataSource: paginatorSource,
				pageSize: 1,
				callback: function(data, pagination) {
					if (config.pieceDivs) setVisiblePiece(config.pieceDivs, pagination.pageNumber - 1);
				}
			});
			piecesLabel = $("<div class='export_piece_selection_label'>").appendTo(exportHeader);
			piecesLabel.html("Piece");
		}
		
		// view split pieces
		if (config.splitPieces) {
			var viewImported = $("<div class='import_control_link'>").appendTo(exportHeader);
			viewImported.html("view split pieces");
			viewImported.click(function() {
				UiUtils.openStorage("Imported Pieces", {pieces: config.splitPieces});
			});
		}
		
		// controls disabled until ready
		setControlsEnabled(false);
		setPrintEnabled(false);
		
		// internal renderer for export content
		function ExportContentController(div) {
			DivController.call(this, div);
			this.render = function(onDone) {
				
				// load export dependencies
				LOADER.load(AppUtils.getExportDependencies(), function(err) {
					if (err) throw err;

					// notices
					if (config.showNotices) {
						
						// poll environment info on loop
						AppUtils.pollEnvironment(AppUtils.getCachedEnvironment());
						
						// notice div
						var noticeDivContainer = $("<div class='notice_container'>").appendTo(div);
						var noticeDiv = $("<div>").appendTo(noticeDivContainer);
						new NoticeController(noticeDiv).render(function() { renderAux(); });
					} else {
						renderAux();
					}
					
					function renderAux() {
						
						// progress bar
						progressDiv = $("<div class='export_progress_div'>").appendTo(div);
						progressDiv.hide();
						progressBar = UiUtils.getProgressBar(progressDiv);
						progressLabel = $("<div class='export_progress_label'>").appendTo(progressDiv);
						
						// currently showing piece
						piecesDiv = $("<div class='export_pieces_div'>").appendTo(div);
						
						// register events
						showPublicCheckbox.click(function() { update(); });
						showPrivateCheckbox.click(function() { update(); });
						showLogosCheckbox.click(function() { update(); });
						
						// done rendering if not quick generate
						if (onDone && !quickGenerate) onDone(div);
						
						// build ui based on keyGenConfig, pieces, and pieceDivs
						update(config.pieceDivs, function() {
							
							// regenerate button
							if (config.showRegenerate) {
								regenerateDiv = $("<div class='export_regenerate_div'>").appendTo(div);
								btnRegenerate = $("<div class='dark_green_btn'>").appendTo(regenerateDiv);
								btnRegenerate.append("Regenerate");
								var refreshImg = $("<img src='img/refresh.png' class='refresh_img rotate2'>").appendTo(btnRegenerate);
								btnRegenerate.click(function() {
									if (confirm("Discard key pair and create a new one?")) {
										
										// rotate refresh icon
										refreshImg.data("deg", refreshImg.data("deg") ? refreshImg.data("deg") + 180 : 180);
										refreshImg.css({
												"-webkit-transform": "rotate(" + refreshImg.data("deg") + "deg)",
								        "-moz-transform": "rotate(" + refreshImg.data("deg") + "deg)",
								        "transform": "rotate(" + refreshImg.data("deg") + "deg)"
										})
										saved = false;
										config.keys = undefined;
										config.pieces = undefined;
										config.pieceDivs = undefined;
										update();
									}
								});
							}
							
							// done rendering if quick generate 
							if (onDone && quickGenerate) onDone(div);
						});
					}
				});
			}
		}
		inheritsFrom(ExportContentController, DivController);
		
		// load export content controller
		new LoadController(new ExportContentController($("<div class='export_content_div flex_vertical'>").appendTo(div))).render(function() {
			if (onDone) onDone(div);
		});
	}
	
	// --------------------------------- PRIVATE --------------------------------
	
	function sortPieces() {
		if (!config.pieces) return;
		
		// bind pieces and pieceDivs
		var elems = [];
		for (var i = 0; i < config.pieces.length; i++) {
			elems.push({
				piece: config.pieces[i],
				pieceDiv: config.pieceDivs ? config.pieceDivs[i] : null
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
		config.pieces = [];
		if (config.pieceDivs) config.pieceDivs = [];
		for (var i = 0; i < elems.length; i++) {
			var elem = elems[i];
			config.pieces.push(elem.piece);
			if (config.pieceDivs) config.pieceDivs.push(elem.pieceDiv);
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
	
	// TODO: show -> include
	function getExportConfig() {
		return {
			showPublic: showPublicCheckbox.prop('checked'),
			showPrivate: showPrivateCheckbox.prop('checked'),
			showLogos: showLogosCheckbox.prop('checked')
		};
	}
	
	function printAll() {
		if (!printEnabled) return;
		if (getExportConfig().showPrivate || confirm("Funds CANNOT be recovered from this printed document because the private keys are not included.\n\nContinue?")) {
			saved = true;
			window.print();
		}
	}
	
	function saveAll(pieces) {
		assertInitialized(pieces);
		assertTrue(pieces.length > 0);
		if (getExportConfig().showPrivate || confirm("Funds CANNOT be recovered from this saved file because the private keys are not included.\n\nContinue?")) {
			
			// transform pieces according to export config
			var transformedPieces = [];
			var config = getExportConfig();
			for (var i = 0; i < pieces.length; i++) {
				transformedPieces.push(AppUtils.transformPiece(pieces[i], config));
			}
			
			saved = true;
			var name = "cryptostorage_" + AppUtils.getCommonTicker(pieces[0]).toLowerCase() + "_" + AppUtils.getTimestamp();
			if (pieces.length === 1) {
				var jsonStr = AppUtils.pieceToJson(transformedPieces[0]);
				saveAs(new Blob([jsonStr]), name + ".json");
			} else {
				AppUtils.piecesToZip(transformedPieces, function(blob) {
					saveAs(blob, name + ".zip");
				});
			}
		}
	}
	
	function savePublicAddresses() {
		assertInitialized(config.pieces);
		assertTrue(config.pieces.length > 0);
		var publicAddressesStr = AppUtils.pieceToAddresses(config.pieces[0]);
		saveAs(new Blob([publicAddressesStr]), "cryptostorage_" + AppUtils.getCommonTicker(config.pieces[0]).toLowerCase() + "_public_addresses.txt");
	}
	
	/**
	 * Enables or disables export controls.
	 * 
	 * Does not affect the print button which is controlled separately.
	 */
	function setControlsEnabled(enabled) {
		controlsEnabled = enabled;
		saveButton.unbind("click");
		savePublicButton.unbind("click");
		updateHeaderCheckboxes();
		if (paginator) paginator.pagination(enabled ? "enable" : "disable");
		if (enabled) {
			if (piecesLabel) piecesLabel.removeClass("disabled");
			showLogosCheckbox.removeAttr("disabled");
			saveButton.addClass("export_button");
			saveButton.removeClass("export_button_disabled");
			saveButton.click(function() { saveAll(config.pieces); });
			if (publicAvailable) {
				savePublicButton.addClass("export_button");
				savePublicButton.removeClass("export_button_disabled");
				savePublicButton.click(function() { savePublicAddresses(); });
			} else {
				savePublicButton.addClass("export_button_disabled");
				savePublicButton.removeClass("export_button");
			}
		} else {
			if (piecesLabel) piecesLabel.addClass("disabled");
			saveButton.addClass("export_button_disabled");
			saveButton.removeClass("export_button");
			savePublicButton.addClass("export_button_disabled");
			savePublicButton.removeClass("export_button");
			showPublicCheckbox.attr("disabled", "disabled");
			showPrivateCheckbox.attr("disabled", "disabled");
			showLogosCheckbox.attr("disabled", "disabled");
		}
	}
	
	function setPrintEnabled(bool) {
		printButton.unbind("click");
		printEnabled = bool;
		if (bool) {
			printButton.addClass("export_button");
			printButton.removeClass("export_button_disabled");
			printButton.click(function() { printAll(); });
		} else {
			printButton.addClass("export_button_disabled");
			printButton.removeClass("export_button");
		}
	}
	
	function updateHeaderCheckboxes() {
		if (controlsEnabled) {
			if (showPrivateCheckbox.prop('checked')) {
				if (publicAvailable) showPublicCheckbox.removeAttr('disabled');
			} else {
				showPublicCheckbox.attr('disabled', 'disabled')
			}
			if (showPublicCheckbox.prop('checked')) {
				if (privateAvailable) showPrivateCheckbox.removeAttr('disabled');
			} else {
				showPrivateCheckbox.attr('disabled', 'disabled');
			}
			showLogosCheckbox.removeAttr('disabled');
		} else {
			showPublicCheckbox.attr('disabled');
			showPrivateCheckbox.attr('disabled');
			showLogosCheckbox.attr('disabled');
		}
	}
	
	function isPublicAvailable(keys, pieces) {
		if (keys) {
			return isInitialized(keys[0].getAddress());
		} else if (pieces) {
			return isInitialized(pieces[0].keys[0].address);
		} else throw new Error("Neither keys nor pieces provided");
	}
	
	function isPrivateAvailable(keys, pieces) {
		if (keys) {
			return isInitialized(keys[0].getWif());
		} else if (pieces) {
			return isInitialized(pieces[0].keys[0].wif);
		} else throw new Error("Neither keys nor pieces provided");
	}
	
	function update(_pieceDivs, onDone) {
		updateHeaderCheckboxes();
		config.pieceDivs = _pieceDivs;
		
		// add piece divs if given
		if (config.pieceDivs) {
			assertInitialized(config.pieces);
			setVisiblePiece(config.pieceDivs, paginator ? paginator.pagination('getSelectedPageNum') - 1 : 0);
			setPieceDivs(config.pieceDivs);
			makePieceDivsCopyable(config.pieceDivs);
			setPrintEnabled(true);
			setControlsEnabled(true);
			if (onDone) onDone();
		}
		
		// else render from config.pieces
		else {
			config.pieceDivs = [];
			
			// render pieces if given
			if (config.pieces) {
				for (var i = 0; i < config.pieces.length; i++) config.pieceDivs.push($("<div>"));
				setVisiblePiece(config.pieceDivs, paginator ? paginator.pagination('getSelectedPageNum') - 1 : 0);
				setPieceDivs(config.pieceDivs);
				setPrintEnabled(false);
				setControlsEnabled(true);
				if (lastRenderer) lastRenderer.cancel();
				lastRenderer = new PieceRenderer(config.pieces, config.pieceDivs, getExportConfig());
				lastRenderer.render(null, function(err, pieceDivs) {
					makePieceDivsCopyable(pieceDivs);
					setPrintEnabled(true);
					if (onDone) onDone();
				});
			}
			
			// generate pieces from keys if given
			else if (config.keys) {
				config.pieces = AppUtils.keysToPieces(config.keys);
				update(null, onDone);
			}
			
			// otherwise generate keys from config
			else {
				assertInitialized(config.keyGenConfig);
				if (!quickGenerate) setControlsEnabled(false);
				AppUtils.generateKeys(config.keyGenConfig, function(percent, label) {
					progressBar.set(percent);
					progressBar.setText(Math.round(percent * 100)  + "%");
					progressLabel.html(label);
					if (!quickGenerate) progressDiv.show();
				}, function(err, _keys, _pieces, _pieceDivs) {
					progressDiv.hide();
					if (err) throw err;
					config.keys = _keys;
					config.pieces = _pieces;
					config.pieceDivs = _pieceDivs;
					update(config.pieceDivs, onDone);
				}, true);
			}
		}
		
		// make piece divs copyable which is lost when rendered pieces transfered to new tab
		function makePieceDivsCopyable(pieceDivs) {
			for (var i = 0; i < pieceDivs.length; i++) {
				PieceRenderer.makeCopyable(pieceDivs[i]);
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
		for (var i = 0; i < config.pieces.length; i++) {
			if (i === pieceIdx) pieceDivs[i].removeClass("hidden");
			else pieceDivs[i].addClass("hidden");
		}
	}
	
	/**
	 * Determines if the renderer's config will be generated "quickly".
	 */
	function isQuickGenerate() {
		var keyGenConfig = config.keyGenConfig;
		if (!keyGenConfig) return false;
		var numPairs = 0;
		for (var i = 0; i < keyGenConfig.currencies.length; i++) {
			if (keyGenConfig.currencies[i].encryption === AppUtils.EncryptionScheme.BIP38) return false;	// BIP38 is slow
			numPairs += keyGenConfig.currencies[i].numKeys;
		}
		numPairs *= keyGenConfig.splitEnabled ? keyGenConfig.numPieces : 1;
		return numPairs <= 2;
	}
}
inheritsFrom(ExportController, DivController);

/**
 * Controls the notices div.
 * 
 * @param div is the div to render to
 * @param config is the configuration:
 * 	{
 * 		showOnPass: bool,	// show if everything passes
 * 		showOnFail: bool,	// show if there are any failures
 * 		showOnWarn: bool,	// show if there are any warnings
 * 	}
 */
function NoticeController(div, config) {
	DivController.call(this, div);
	
	var lastChecks;
	var tippies;
	
	this.render = function(onDone) {
		
		// merge configs
		config = objectAssign({}, getDefaultConfig(), config);
		
		// listen for environment
		var first = true;
		AppUtils.addEnvironmentListener(function(info) {
			setEnvironmentInfo(info);
			
			// done rendering
			if (first) {
				first = false;
				setImmediate(function() {	// fix issue where notice bar doesn't render full width
					if (onDone) onDone(div);
				});
			}
		});
	}
	
	function getDefaultConfig() {
		return {
			showOnFail: true,
			showOnWarn: true,
			showOnPass: true
		};
	}
	
	function setEnvironmentInfo(info) {
		
		// check if info cached
		if (lastChecks && objectsEqual(lastChecks, info.checks)) return;
		
		// div setup
		div.empty();
		div.removeClass();
		div.addClass("notice_bar");
		div.addClass("flex_horizontal");
		if (AppUtils.hasEnvironmentState("fail")) { div.addClass("notice_fail"); config.showOnFail ? div.show() : div.hide(); }
		else if (AppUtils.hasEnvironmentState("warn")) { div.addClass("notice_warn"); config.showOnWarn ? div.show() : div.hide(); }
		else if (config.showOnPass) { div.addClass("notice_pass"); div.show(); }
		else div.hide();
		
		// reset cache
		lastChecks = info.checks;
		
		// track tippy divs to fix bug where more than one becomes visible
		if (tippies) for (var i = 0; i < tippies.length; i++) tippies[i].get(0)._tippy.hide();
		tippies = [];
		
		// compute width of icon divs based on max number of icons
		var numNoticesLeft = 0;
		var numNoticesRight = 0;
		for (var i = 0; i < info.checks.length; i++) {
			if (info.checks[i].state === "pass") numNoticesRight++;
			else numNoticesLeft++;
		}
		var maxNotices = Math.max(numNoticesLeft, numNoticesRight);
		var width = maxNotices * (40 + 16);	// icon width + padding
		
		// build notice
		div.empty();
		renderLeft($("<div>").appendTo(div), info);
		renderCenter($("<div>").appendTo(div), info);
		renderRight($("<div>").appendTo(div), info);
		
		// render notice left
		function renderLeft(div, info) {
			div.addClass("notice_bar_left flex_horizontal flex_justify_start");
			div.css("min-width", width);
			div.css("max-width", width);
			for (var i = 0; i < info.checks.length; i++) {
				if (info.checks[i].state === "pass") continue;
				renderNoticeIcon($("<div>").appendTo(div), info, info.checks[i]);
			}
		}
		
		// render notice center
		function renderCenter(div, info) {
			div.addClass("notice_bar_center flex_horizontal");
			renderCheckDescription(div, info, getFirstNonPassCheck(info));
		}
		
		// render notice right
		function renderRight(div, info) {
			div.addClass("notice_bar_right flex_horizontal flex_justify_end");
			div.css("min-width", width);
			div.css("max-width", width);
			for (var i = 0; i < info.checks.length; i++) {
				if (info.checks[i].state !== "pass") continue;
				renderNoticeIcon($("<div>").appendTo(div), info, info.checks[i]);
			}
		}
		
		// gets the first non-pass check
		function getFirstNonPassCheck(info) {
			for (var i = 0; i < info.checks.length; i++) {
				if (info.checks[i].state !== "pass") return info.checks[i];
			}
			return null;
		}
		
		// render single check icon
		function renderNoticeIcon(div, info, check) {
			tippies.push(div);
			
			div.addClass("flex_vertical notice_icon_div");
			div.append(getIcon(check));
			div.append(getStateIcon(check.state));
			
			// tooltip
			var description = $("<div>");
			renderCheckDescription(description, info, check);
			tippy(div.get(0), {
				arrow: true,
				html: description.get(0),
				interactive: true,
				placement: 'bottom',
				theme: 'translucent',
				trigger: "mouseenter",
				multiple: 'false',
				distance: 20,
				arrowTransform: 'scaleX(1.25) scaleY(2.5) translateY(2px)',
				onShow: function() {
					for (var i = 0; i < tippies.length; i++) {
						if (tippies[i] !== div) tippies[i].get(0)._tippy.hide();	// manually hide other tippy divs
					}
				}
			});
			
			// gets the check icon
			function getIcon(check) {
				
				// interpret environment code and state
				switch (check.code) {
					case AppUtils.EnvironmentCode.RUNTIME_ERROR:
						return $("<img class='notice_icon' src='img/skull.png'>");
					case AppUtils.EnvironmentCode.INTERNET:
						return $("<img class='notice_icon' src='img/internet.png'>");
					case AppUtils.EnvironmentCode.IS_LOCAL:
						return $("<img class='notice_icon' src='img/download.png'>");
					case AppUtils.EnvironmentCode.BROWSER:
						return getBrowserIcon(info);
					case AppUtils.EnvironmentCode.OPERATING_SYSTEM:
						return getOperatingSystemIcon(info);
					case AppUtils.EnvironmentCode.DEV_MODE:
						return $("<img class='notice_icon' style='width:35px; height:35px;' src='img/construction.png'>");
					default:
						throw new Error("Unrecognized environment code: " + check.code);
				}
			}
			
			function getBrowserIcon(info) {
				var name = info.browser.name;
				if (strContains(name, "Firefox")) return $("<img class='notice_icon' src='img/firefox.png'>");
				else if (strContains(name, "Chrome")) return $("<img class='notice_icon' src='img/chrome.png'>");
				else if (strContains(name, "Chromium")) return $("<img class='notice_icon' src='img/chrome.png'>");
				else if (strContains(name, "Safari")) return $("<img class='notice_icon' src='img/safari.png'>");
				else if (strContains(name, "IE") || strContains(name, "Internet Explorer")) return $("<img class='notice_icon' style='width:35px; height:35px;' src='img/internet_explorer.png'>");
				else return $("<img class='notice_icon' src='img/browser.png'>");
			}
			
			function getOperatingSystemIcon(info) {
				var name = info.os.name;
				if (arrayContains(OperatingSystems.LINUX, name)) return $("<img class='notice_icon' src='img/linux.png'>");
				else if (arrayContains(OperatingSystems.OSX, name)) return $("<img class='notice_icon' src='img/osx.png'>");
				else if (strContains(name, "iOS")) return $("<img class='notice_icon' src='img/ios.png'>");
				else if (arrayContains(OperatingSystems.WINDOWS, name)) return $("<img class='notice_icon' src='img/windows.png'>");
				else if (strContains(name, "Android")) return $("<img class='notice_icon' src='img/android.png'>");
				return $("<img class='notice_icon' src='img/computer.png'>");
			}
			
			function getStateIcon(state) {
				if (state === "pass") return $("<img class='notice_state_icon' src='img/circle_checkmark.png'>");
				if (state === "fail") return $("<img class='notice_state_icon' src='img/circle_exclamation.png'>");
				if (state === "warn") return $("<img class='notice_state_icon' src='img/circle_exclamation.png'>");
				throw new Error("Unrecognized state: " + state);
			}
		}
		
		// render single check description
		function renderCheckDescription(div, info, check) {
			
			// all checks pass
			if (!check) {
				var content = $("<div>").appendTo(div);
				content.append("<div class='notice_bar_center_major flex_horizontal'>All security checks pass</div>");
				return;
			}
			
			// interpret environment code and state
			switch (check.code) {
				case AppUtils.EnvironmentCode.BROWSER:
					if (check.state === "pass") div.append("Browser is open source (" + info.browser.name + ")");
					else {
						var content = $("<div>").appendTo(div);
						if (check.state === "fail") content.append("<div class='notice_bar_center_major'>Browser is not supported (" + info.browser.name + " " + info.browser.version + ")</div>");
						else content.append("<div class='notice_bar_center_major'>Browser is not open source (" + info.browser.name + ")</div>");
						content.append("<div class='notice_bar_center_minor'>Recommended browsers: <a target='_blank' href='https://www.mozilla.org/en-US/firefox/'>Firefox</a> or <a target='_blank' href='https://www.chromium.org/getting-involved/download-chromium'>Chromium</a>");
					}
					break;
				case AppUtils.EnvironmentCode.RUNTIME_ERROR:
					if (check.state === "fail") div.append("Unexpected error: " + info.runtimeError);
					break;
				case AppUtils.EnvironmentCode.INTERNET:
					if (check.state === "pass") div.append("No internet connection");
					else if (check.state === "warn") {
						var content = $("<div>").appendTo(div);
						content.append("<div class='notice_bar_center_major'>Internet connection is active</div>");
						content.append("<div class='notice_bar_center_minor'>Disconnect from the internet for better security</div>");
					} else if (check.state === "fail") {
						var content = $("<div>").appendTo(div);
						content.append("<div class='notice_bar_center_major'>Connect to the internet</div>");
						content.append("<div class='notice_bar_center_minor'>Internet is required because the application is not running locally.  <a href='https://github.com/cryptostorage/cryptostorage.com/archive/master.zip'>Download from GitHub</a></div>");
					}
					break;
				case AppUtils.EnvironmentCode.IS_LOCAL:
					if (check.state === "pass") div.append("<div class='notice_bar_center_major'>Application is running locally</div>");
					else {
						var content = $("<div>").appendTo(div);
						content.append("<div class='notice_bar_center_major'>Application is not running locally</div>");
						content.append("<div class='notice_bar_center_minor'><a href='https://github.com/cryptostorage/cryptostorage.com/archive/master.zip'>Download from GitHub</a></div>");
					}
					break;
				case AppUtils.EnvironmentCode.OPERATING_SYSTEM:
					if (check.state === "pass") div.append("Operating system is open source (" + info.os.name + ")");
					else {
						var content = $("<div>").appendTo(div);
						content.append("<div class='notice_bar_center_major'>Operating system is not open source (" + info.os.name + ")</div>");
						content.append("<div class='notice_bar_center_minor'>Recommended operating systems: <a target='_blank' href='https://tails.boum.org'>Tails</a>, <a target='_blank' href='https://www.ubuntu.com/download/desktop'>Ubuntu</a>, or <a target='_blank' href='https://www.raspberrypi.org'>Raspbian for the Raspberry Pi</a>");
					}
					break;
				case AppUtils.EnvironmentCode.DEV_MODE:
					if (check.state === "warn") div.append("Application is under development.  Not ready for use");
					break;
				default:
					throw new Error("Unrecognized environment code: " + check.code);
			}
		}
	}
}
inheritsFrom(NoticeController, DivController);

/**
 * Invokes the renderer and presents a loading wheel until it's done.
 * 
 * Requires that the div be hidden while rendering.
 * 
 * Works by wrapping the renderer's div with the loader's div until done.
 * 
 * Call getDiv() to get the best representation of current state (wrapper or renderer's div).
 * 
 * @param renderer renders the content to a div which is hidden by a loading wheel until done
 * @param config allows load rendering customization
 * 				config.enableScroll	specifies if the scroll bar should show during loading (UI tweak)
 */
function LoadController(renderer, config) {
	DivController.call(this, renderer.getDiv());
	var isLoading = false;
	var wrapper;
	
	/**
	 * Renders the loader.
	 * 
	 * @param onRenderDone(div) is invoked when the renderer's div is rendered
	 * @param onLoaderDone(div) is invoked when load wheel is rendered
	 */
	this.render = function(onRenderDone, onLoaderDone) {
		
		// ignore if loading
		if (isLoading) {
			if (onLoaderDone) onLoaderDone(wrapper);
			return;
		}
		
		// check if already rendered
		if (renderer.getDiv().children().length) {
			if (onLoaderDone) onLoaderDone(renderer.getDiv());
			if (onRenderDone) onRenderDone(renderer.getDiv());
			return;
		}
		
		// load loading gif
		isLoading = true;
		var loadingImg = new Image();
		loadingImg.onload = function() {
			$(loadingImg).addClass("loading");
			
			// wrap renderer's div
			renderer.getDiv().wrap("<div class='flex_vertical'>");	// wrap div with loading
			wrapper = renderer.getDiv().parent();
			wrapper.prepend(loadingImg);
			if (config && config.enableScroll) wrapper.css("margin-bottom", "1200px");
			
			// load is done
			if (onLoaderDone) onLoaderDone(wrapper);
			
			// don't show div while rendering
			renderer.getDiv().hide();
				
			// render content
			renderer.render(function() {
				wrapper.replaceWith(renderer.getDiv());
				wrapper = null;
				isLoading = false;
				renderer.getDiv().show();
				if (onRenderDone) onRenderDone(renderer.getDiv());
			});
		};
		loadingImg.src = "img/loading.gif";
	}
	
	this.getDiv = function() {
		return wrapper ? wrapper : renderer.getDiv();
	}
	
	this.getRenderer = function() {
		return renderer;
	}
}
inheritsFrom(LoadController, DivController);