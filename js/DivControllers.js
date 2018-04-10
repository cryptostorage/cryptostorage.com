/**
 * MIT License
 * 
 * Copyright (c) 2018 cryptostorage
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * UI utilities.
 */
var UiUtils = {
	
	/**
	 * Renders a progress bar to the given div.
	 * 
	 * @param div is the div to render to
	 * @returns a progress bar instance
	 */
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
	 * Opens the editor in a new tab.
	 * 
	 * @param browserTabName is the name of the tab
	 * @param config is the storage configuration
	 * 				config.splitPieces are imported split pieces
	 * 				config.keys are keys to generate pieces from
	 * 				config.pieces are pieces to export and generate pieceDivs from
	 * 				config.pieceDivs are pre-generated piece divs ready for display
	 */
	openEditorTab: function(browserTabName, config) {
		
		// deep copy config
		config = Object.assign({}, config);
		
		// open tab
		newWindow(null, browserTabName, AppUtils.getInitialExportDependencies(), getInternalStyleSheetText(), function(err, window) {
			
			// check for error
			if (err) {
				AppUtils.setTabError(true);
				return;
			}
			
			// initialize tab
			config.environmentInfo = AppUtils.getCachedEnvironment();
		  window.exportToBody(window, config);
			window.focus();
		});
	},
	
	// UI constants
	FIREFOX_LINK: "<a target='_blank' href='https://www.mozilla.org/en-US/firefox/'>Firefox</a>",
	CHROMIUM_LINK: "<a target='_blank' href='https://www.chromium.org/getting-involved/download-chromium'>Chromium</a>",
	TAILS_LINK: "<a target='_blank' href='https://tails.boum.org'>Tails</a>",
	DEBIAN_LINK: " <a target='_blank' href='https://www.debian.org/'>Debian</a>",
	RASPBIAN_LINK: "<a target='_blank' href='https://www.raspberrypi.org'>Raspbian for the Raspberry Pi</a>",
	INFO_TOOLTIP_MAX_WIDTH: "700px",
	NOTICE_TOOLTIP_MAX_WIDTH: "700px"
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
	var showFuncs;
	var introDiv;
	var introController;
	var contentDiv;
	var homeLoader;
	var formLoader;
	var importLoader;
	var faqLoader;
	var donateLoader;
	var currentPage;
	var lastHash;
	
	/**
	 * Navigates to the page/position identified by the given hash.
	 * 
	 * @param hash identifies the page within the application
	 * @param onDone() is invoked when done
	 */
	function navigate(hash, onDone) {
		if (hash === lastHash) return;
		lastHash = hash;
		if (hash) window.location.hash = hash;
		if (hash.startsWith("#faq")) that.showFaq(onDone);
		else if (hash === "#donate") that.showDonate(onDone);
		else if (hash === "#import") that.showImport(onDone);
		else that.showHome(onDone);
	}
	
	this.render = function(onDone) {
		
		// header
		div.empty();
		var headerDiv = $("<div class='app_header'>").appendTo(div);
		
		// header logo
		var headerTopDiv = $("<div class='app_header_top'>").appendTo(headerDiv);
		var logo = $("<img class='app_header_logo_img' src='img/cryptostorage_white.png'>").appendTo(headerTopDiv);
		logo.click(function() { navigate("#home"); });
		
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
		homeLink.click(function() { navigate("#home"); });
		faqLink.click(function() { navigate("#faq"); });
		donateLink.click(function() { navigate("#donate"); });
		
		function getLinkDiv(label) {
			var div = $("<div class='link_div'>");
			div.html(label);
			return div;
		}
		
		// validate version
		AppUtils.getVersionNumbers(AppUtils.VERSION);
		
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
		showFuncs = {
				"home": that.showHome,
				"new": that.showForm,
				"import": that.showImport,
				"faq": that.showFaq,
				"donate": that.showDonate
		}
		
		// navigate on browser navigation
		$(window).on('popstate', function(e) {
			navigate(window.location.hash);
		});
		
		// navigate to first page
		navigate(window.location.hash, function() {
			
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
		});
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
	
	this.showFaq = function(onDone) {
		if (AppUtils.DEV_MODE) console.log("showFaq()");
		currentPage = "faq";
		faqLoader.render(function() {
			faqLoader.getRenderer().goToQuestion(window.location.hash);
			if (onDone) onDone();
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
		UiUtils.openEditorTab("Export Storage", {confirmExit: true});
	}
	
	function onSelectImport() {
		navigate("#import");
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
			getSlide($(mixImg), "Generate offline wallets for major cryptocurrencies.").appendTo(sliderDiv);
			getSlide($("<img src='img/printer.png'>"), "Print paper wallets or save keys to a file for long-term storage.").appendTo(sliderDiv);
			getSlide($("<img src='img/security.png'>"), "Runs only in your browser so funds are never entrusted to a third party.").appendTo(sliderDiv);
			getSlide($("<img src='img/microscope.png'>"), "100% open source and free to use.  No account necessary.").appendTo(sliderDiv);
			getSlide($("<img src='img/keys.png'>"), "Passphrase-protect and split private keys for maximum security.").appendTo(sliderDiv);
			getSlide($("<img src='img/checklist.png'>"), "Generate keys securely with automatic environment checks.").appendTo(sliderDiv);
			
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
		mixImg.src = "img/cryptocurrency.png";
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
	var moreLink = true;
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
			var numVisible = 15;
			pageDiv.append($("<div class='home_label'>Supports these tokens</div>"));
			var plugins = AppUtils.getCryptoPlugins();
			pageDiv.append(getCurrencyRow(plugins.slice(0, 3), true, onCurrencyClicked));
			var moreDiv = null;
			for (var i = 3; i < plugins.length; i += 4) {
				var row = getCurrencyRow(plugins.slice(i, i + 4), false, onCurrencyClicked);
				if (i >= numVisible && !moreDiv) {
					moreDiv = $("<div>").appendTo(pageDiv);
					moreDiv.hide();
				}
				if (moreDiv) moreDiv.append(row);
				else pageDiv.append(row);
			}
			if (moreDiv) {
				var moreLabel = $("<div class='home_more_label'>").appendTo(pageDiv);
				moreLabel.append("and " + (plugins.length - numVisible) + " more...");
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
			pageDiv.append("<div class='home_label'>Export to printable and digital formats for long-term storage</div>");
			pageDiv.append("<div class='home_description'>Save keys to a file which can be stored on a flash drive, or print to paper to easily create paper wallets.</div>")
			pageDiv.append($("<img width=750px src='img/print_example.png'>"));
			
			// split and passphrase section
			pageDiv.append("<div style='height: 10px'>");
			pageDiv.append("<div class='home_label'>Passphrase-protect and split private keys for maximum security</div>");
			pageDiv.append("<div class='home_description'>Encrypt private keys with a passphrase or split them into pieces so funds are not accessible at any one location.  Set how many pieces are needed to recover the keys.  Store one in your safe, one in a bank vault, or one with a trusted family member.</div>")
			pageDiv.append($("<img style='width:785px; margin-bottom:15px;' src='img/passphrase_input.png'>"));
			pageDiv.append($("<img style='width:600px;' src='img/split_input.png'>"));
			
			// check environment section
			pageDiv.append("<div style='height: 70px'>");
			pageDiv.append("<div class='home_label'>Generate keys securely with automatic environment checks</div>");
			pageDiv.append("<div class='home_description'>Following a few simple recommendations can improve the security of your cryptocurrency.  Automatic environment checks encourage keys to be generated in a secure environment.</div>")
			pageDiv.append($("<img width=785px src='img/notice_bars.png'>"));
			
			// cryptography section
			pageDiv.append("<div style='height:70px'>");
			var hFlex = $("<div class='flex_horizontal'>").appendTo(pageDiv);
			hFlex.append("<img style='height:175px; margin-right:20px;' src='img/key.png'>");
			var vFlex = $("<div class='flex_vertical width_100'>").appendTo(hFlex);
			vFlex.append("<div class='home_label'>Strong cryptography</div>");
			vFlex.append("<div class='home_description'>Uses the latest <a target='_blank' href='https://www.w3.org/TR/WebCryptoAPI/#dfn-GlobalCrypto'>window.crypto API</a> available in browsers which provides access to a cryptographically secure random number generator. This allows generation of random values as seeds for your keys.</div>");
			
			// download section
			pageDiv.append("<div style='height: 70px'>");
			pageDiv.append("<div class='home_label'>Download our 100% free and open source software and run it offline</div>");
			pageDiv.append("<div class='home_description'>Feel confident in the software you’re using. Inspect the source code and know that your money is secure. CryptoStorage is open source, so the community can maintain it indefinitely.</div>")
			var licenseDiv = $("<div class='flex_horizontal'>").appendTo(pageDiv);
			var mitImg = $().appendTo(licenseDiv);
			licenseDiv.append("<a target='_blank' href='./LICENSE.txt'><img src='img/mit.png' class='license_img'></a>");
			licenseDiv.append("<a target='_blank' href='https://github.com/cryptostorage/cryptostorage.com'><img src='img/github.png' class='license_img'></a>");
			licenseDiv.append("<a target='_blank' href='https://reddit.com/r/cryptostorage'><img src='img/reddit.png' class='license_img'></a>");
			pageDiv.append("<div style='height: 20px;'>");
			var downloadBtn = $("<a class='light_green_btn' href='https://github.com/cryptostorage/cryptostorage.com/archive/master.zip'>").appendTo(pageDiv);
			downloadBtn.append("Download Now (zip)");
			
			// footer
			var footerDiv = $("<div class='home_footer_div flex_horizontal'>").appendTo(div);
			footerDiv.append($("<div class='home_footer_version flex_horizontal'></div>"));
			var descriptionDiv = $("<div class='home_footer_description flex_vertical'>").appendTo(footerDiv);
			descriptionDiv.append("<div><a href='./LICENSE.txt'>MIT licensed.</a></div>JavaScript copyrights included in the source. No warranty.");
			var versionDiv = $("<div class='home_footer_version flex_horizontal flex_justify_end'>").appendTo(footerDiv);
			versionDiv.append("<a href='./versions.txt' target='_blank'>version " + AppUtils.VERSION + AppUtils.VERSION_POSTFIX + "</a>");
			
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
			if (!environmentFailure) UiUtils.openEditorTab(plugin.getName() + " Storage", {keyGenConfig: getKeyGenConfig(plugin), confirmExit: true, showRegenerate: true}); 
		}
		
		function getKeyGenConfig(plugin) {
			var config = {};
			config.numPieces = null;
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
	
	var that = this;
	var qaControllers;	// controls all question/answer pairs
	
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
					getQuestion: function() { return "What is CryptoStorage?"; },
					getAnswer: function() { return "<p>CryptoStorage is an open source tool to generate offline storage for multiple cryptocurrencies.  This tool generates <a href='#faq_key_pair'>keypairs</a> in your device's browser which can store cryptocurrency without exposing private keys to an internet-connected device.  Generated keypairs can be easily printed and saved to digital files for long-term storage.</p>" +
						"<p>This tool is security-focused.  Funds are never entrusted to a third party.  Private keys can be passphrase-protected and <a href='#faq_split_keys'>split into pieces</a> which can be geographically separated so funds are not accessible at any one location.  <a href='#faq_recommendations'>Recommendations</a> are automatically provided to improve the security of the tool's environment.</p>";
					}
				}, {
					id: "faq_key_pair",
					getQuestion: function() { return "What is a cryptocurrency keypair?" },
					getAnswer: function() { return "<p>A cryptocurrency keypair is like an account that can send and receive cryptocurrency.  It is comprised of a public address and a private key.  For example, this is a Bitcoin keypair:</p>" +
						"<p><img class='sample_key_pair_img' src='img/key_pair.png'></p>" +
						"<p>The public address is used to receive funds.  It can be publicly shared with anyone.</p>" + 
						"<p>The private key authorizes received funds to be spent.  <span style='color:red'>The private key must remain private or all funds can be lost.</span></p>"; }
				}, {
					id: "faq_safe_keys",
					getQuestion: function() { return "How does CryptoStorage help keep my cryptocurrency safe and secure?"; },
					getAnswer: function() { return "<p>First, this tool generates keys only in your device's browser.  Keys can be generated offline and are never shared with a third party by design.</p>" + 
						"<p>Second, private keys can be protected with a passphrase.  The passphrase is required to decrypt the private keys in order to access funds.</p>" + 
						"<p>Third, private keys can be split into separate pieces which must be combined to access funds.  For example, a Bitcoin keypair can be split into 3 pieces where 2 pieces must be combined to recover the private key.  These pieces can be geographically separated to prevent access at any one location.</p>" +
						"<p>Fourth, keys can printed and saved to digital files for long-term storage.</p>" +
						"<p>Finally, this tool <a href='#faq_recommendations'>automatically detects and recommends</a> ways to improve the security of its environment.</p>"; }
				}, {
					id: "faq_recommendations",
					getQuestion: function() { return "What security recommendations does CryptoStorage make?"; },
					getAnswer: function() {
						var answerDiv = $("<div>");
						answerDiv.append("<p>In order of importance:</p>");
						var recommendationsList = $("<ol>").appendTo(answerDiv);
						recommendationsList.append("<li><a href='#faq_download_verify'>Download and verify</a> then run the source code offline, not from the cryptostorage.com domain.</li>");
						recommendationsList.append("<li>Run this tool on a device that is disconnected from the internet.  For maximum security, the device should never connect to the internet again after generating high-value storage.</li>");
						recommendationsList.append("<li>Run this tool in an open source browser like " + UiUtils.FIREFOX_LINK + " or " + UiUtils.CHROMIUM_LINK + ".</li>");
						recommendationsList.append("<li>Run this tool on an open source operating system like " + UiUtils.TAILS_LINK + ", " + UiUtils.DEBIAN_LINK + ", or " + UiUtils.RASPBIAN_LINK + ".</li>");
						return answerDiv;
					}
				}, {
					id: "faq_generate_keys",
					getQuestion: function() { return "How can I generate keys as securely as possible using CryptoStorage?"; },
					getAnswer: function() {
						var answerDiv = $("<div>");
						var generateList = $("<ol>").appendTo(answerDiv);
						generateList.append("<li><a href='#faq_download_verify'>Download and verify cryptostorage.com-<i>[version]</i>.zip</a>.</li>");
						var generateTransfer = $("<li><p>Transfer cryptostorage.com-<i>[version]</i>.zip to a secure computer using a flash drive.</p></li>").appendTo(generateList);
						var generateTransferList = $("<ul>").appendTo(generateTransfer);
						generateTransferList.append("<li>The computer should be disconnected from the internet.  For maximum security, the device should never connect to the internet again after generating cryptocurrency storage.</li>");
						generateTransferList.append("<li>An open source operating system is recommended like " + UiUtils.TAILS_LINK + ", " + UiUtils.DEBIAN_LINK + ", or " + UiUtils.RASPBIAN_LINK + ".</li>");
						generateList.append("<li>Unzip cryptostorage.com-<i>[version]</i>.zip</li>");
						var generateBrowser = $("<li><p>Open index.html in the unzipped folder in a browser.</p></li>").appendTo(generateList);
						var generateBrowserList = $("<ul>").appendTo(generateBrowser);
						generateBrowserList.append("<li>An open source browser is recommended like " + UiUtils.FIREFOX_LINK + " or " + UiUtils.CHROMIUM_LINK + ".</li>");
						var generateChecks = $("<li><p>Confirm that all environment checks pass.</p></li>").appendTo(generateList)
						var generateChecksList = $("<ol>").appendTo(generateChecks);
						generateChecksList.append("<li><p>Go to Generate New Keys from the homepage.</p></li>");
						generateChecksList.append("<li><p>The notice bar at the top should indicate that all security checks pass:</p>" +
								"<img style='width:100%;' src='img/notice_bar_pass.png'></img></li>");
						var generateKeys = $("<li><p>Fill out the form and click Generate Keys.</p></li>").appendTo(generateList);
						var generateKeysList = $("<ul>").appendTo(generateKeys);
						generateKeysList.append("<li><p>Protecting your keys with a passphrase is <i>highly recommended</i>.  Otherwise anyone in possession of the unencrypted keys can access the funds.</p>");
						generateKeysList.append("<li><p>Optionally split your keys for maximum security.</p></li>");
						generateList.append("<li><p>Save the generated keys to a flash drive or printed paper for safe keeping.  Geographic redundancy is <i>highly recommended</i> so if one location is lost due to fire, flood, theft, etc, there are backup copies at other locations.</p>" +
							"<p>The keys can be imported at any time by relaunching this tool in a secure environment.</p>" +
								"<p><span style='color:red'>Do not lose the generated keys or the password or all funds will be lost.</span></p></li>");
						return answerDiv;
					}
				},{
					id: "faq_why_verify",
					getQuestion: function() { return "Why should I download and verify the source code?"; },
					getAnswer: function() {
						var answerDiv = $("<div>");
						answerDiv.append("<p>Downloading and verifying the source code ensures you have a copy of this tool that has been publicly reviewed and has not been modified by an attacker.</p>");
						answerDiv.append("<p>Verifying the source code is <i>highly recommended</i> but not required to use this tool.</p>");
						return answerDiv;
					}
				}, {
					id: "faq_download_verify",
					getQuestion: function() { return "How can I download and verify the source code?"; },
					getAnswer: function() {
						var answerDiv = $("<div>");
						answerDiv.append("<p>The source code can be verified in two ways.  Either method is sufficient.");
						answerDiv.append($("<p>Method #1: Verify the source code has the correct checksum.</p>"));
						var verify1List = $("<ol>").appendTo(answerDiv);
						verify1List.append("<li><p>Download cryptostorage-<i>[version]</i>.zip and cryptostorage-<i>[version]</i>-checksum.txt from the <a target='_blank' href='https://github.com/cryptostorage/cryptostorage.com/releases'>latest release on GitHub</a>.</p></li>");
						verify1List.append("<li><p>Determine the SHA256 hash of the zip file.  Instructions depend on your operating system.</p>" +
								"</p>Linux: <div class='terminal_cmd'>sha256sum cryptostorage-<i>[version]</i>.zip</div></p>" + 
								"<p>Mac: <div class='terminal_cmd'>openssl sha -sha256 cryptostorage-<i>[version]</i>.zip</div></p>" + 
								"<p>Windows: <div class='terminal_cmd'>certUtil -hashfile cryptostorage-<i>[version]</i>.zip SHA256</div></p></li>");
						verify1List.append("<li>Verify that the checksum matches the contents of the previously downloaded cryptostorage-<i>[version]</i>-checksum.txt.</li>");
						answerDiv.append($("<p>Method #2: Verify the source code has been signed by the developer's PGP key.</p>"));
						var verify2List = $("<ol>").appendTo(answerDiv);
						verify2List.append("<li><p>Install <a target='_blank' href='https://www.openpgp.org/'>PGP software</a> on your device.</p></li>");
						verify2List.append("<li><p>Download the developer’s public PGP key, \"woodser.asc\", from the <a target='_blank' href='https://github.com/cryptostorage/cryptostorage.com'>root of the GitHub source repository</a>.</p></li>");
						verify2List.append("<li><p>Import the PGP key:</p>" +
								"<p><div class='terminal_cmd'>gpg --import woodser.asc</div></p></li>");
						verify2List.append("<li><p>Download cryptostorage-<i>[version]</i>.zip, cryptostorage-<i>[version]</i>.sig, and woodser-pgp-fingerprint.txt from the <a target='blank' href='https://github.com/cryptostorage/cryptostorage.com/releases'>latest release on GitHub</a>.</p></li>")
						verify2List.append("<li><p>Verify the signature of cryptostorage-<i>[version]</i>.zip:</p>" +
								"<p><div class='terminal_cmd'>gpg --verify cryptostorage-<i>[version]</i>.sig cryptostorage-<i>[version]</i>.zip</div></p>" +
								"<p>You should see output with this RSA key:</p>" +
								"<p><div class='terminal_cmd'>gpg: Signature made Fri Jan 12 09:22:37 2018 EST<br>gpg:                using RSA key 52FD7C01877CA968C97118D055A10DD48ADEE5EF<br>gpg: Good signature ...</div></p>" +
								"<p>The RSA key will also match the contents of the previously downloaded woodser-pgp-fingerprint.txt.</p>" +
								"<p>Note: You will probably also see a warning that the key is not certified with a trusted signature.  This is expected unless you told PGP to trust woodser’s PGP key, which is not necessary.</p></li>");
						return answerDiv;
					}
				}, {
					id: "faq_trust",
					getQuestion: function() { return "How can I trust this tool?"; },
					getAnswer: function() { return "<p>Don't trust.  Verify.  CryptoStorage is 100% open source which means anyone can review the source code.</p>" +
						"<p><a href='#faq_download_verify'>Downloading and verifying</a> the source code ensures you have a copy that has been publicly reviewed and has not been modified by an attacker.</p>"; }
				}, {
					id: "faq_trusted_third_party",
					getQuestion: function() { return "Are my funds ever entrusted to a third party?"; },
					getAnswer: function() { return "<p>No.  The public/private keypairs are generated only in your devices browser so they are never shared with a third party by design.</p>"; }
				}, {
					id: "faq_split_keys",
					getQuestion: function() { return "What does it mean to split private keys?"; },
					getAnswer: function() { return "<p>Generated storage can be split into separate pieces where some of the pieces must be combined in order to access funds.</p>" +
						"<p>This is useful for geographically splitting your cryptocurrency storage so that funds cannot be accessed at any one physical location without obtaining and combining multiple pieces.</p>" +
						"<p>For example, 10 keypairs can be split into 3 pieces where 2 pieces must be combined to access funds.  Each piece will contain shares for all 10 keypairs.  No funds can be accessed from any of the pieces until 2 of the 3 pieces are combined.</p>" +
						"<p>In this example, one might choose to keep one piece, put one in a bank, and give one to a trusted family member.</p>"; }
				}, {
					id: "faq_online_to_recover",
					getQuestion: function() { return "Do I need to be online to recover private keys?"; },
					getAnswer: function() { return "<p>No.  This tool's source code has everything needed to import and recover the private keys.  A copy of this tool can be saved for future use so it doesn't need to be re-downloaded from GitHub.</p>"; }
				}, {
					id: "faq_send_funds",
					getQuestion: function() { return "Can I send funds using CryptoStorage?"; },
					getAnswer: function() { return "<p>Not currently.  It is expected that users will send funds using wallet software of their choice after private keys have been recovered using this tool.</p>"; }
				}, {
					id: "faq_interoperable",
					getQuestion: function() { return "Does CryptoStorage work with other wallet software?"; },
					getAnswer: function() {
						var answerDiv = $("<div>");
						answerDiv.append("<p>All unencrypted keys generated with CryptoStorage will work with other wallet software and vice versa.</p>" +
								"<p>However, there is currently no standardized way of encrypting or splitting cryptocurrency keys that works across all key types.  As a result, CryptoStorage uses its own conventions to encrypt and split keys which will not work with other tools unless they use the same conventions.  <b>A copy of this tool should be saved to recover keys in the future if using encryption or splitting.</b></p>");
						return answerDiv;
					}
				}, {
					id: "faq_contact",
					getQuestion: function() { return "I still need help.  Who can I contact?"; },
					getAnswer: function() { return "<p>For bug reports and feature requests, please submit an issue to <a href='https://github.com/cryptostorage/cryptostorage.com/issues'>https://github.com/cryptostorage/cryptostorage.com/issues</a>.</p>" +
						"<p>For community discussion, please join the conversation on Reddit at <a href='https://reddit.com/r/cryptostorage'>https://reddit.com/r/cryptostorage</a>.</p>" +
						"<p>For email support, please email <a href='mailto:support@cryptostorage.com'>support@cryptostorage.com</a>.  Email is answered on a best-effort basis only.</p>" +
						"<p><i>No one can recover lost keys or passwords for you.  Do not lose these or your funds will be lost.</i></p>"
					}
				}
			];
			
			// expand and collapse controls
			var expandCollapseDiv = $("<div class='faq_expand_collapse_div flex_horizontal flex_justify_end'>").appendTo(pageDiv);
			
			// collect question answer controllers
			qaControllers = [];
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
				
				// render expand / collapse div
				var expand = $("<div class='faq_expand_collapse_link'>Expand All</div>").appendTo(expandCollapseDiv);
				expand.click(function() { expandAll(); });
				var collapse = $("<div class='faq_expand_collapse_link' style='margin-left: 15px;'>Collapse All</div>").appendTo(expandCollapseDiv);
				collapse.click(function() { collapseAll(); });
				
				// change internal link behavior
				$("a", pageDiv).each(function(idx, a) {
					a = $(a);
					if (!a.attr("href") || !a.attr("href").startsWith("#faq_")) return;
					a.unbind("click");
					a.click(function(e) {
						e.preventDefault();
						if (a.attr("href") === window.location.hash) that.goToQuestion(a.attr("href"));	// hash will not change so handle locally
						else window.location.hash = a.attr("href");																			// will cause app-level navigation
						return false;
					});
				});
				
				// done rendering
				if (onDone) onDone(div);
			});
		});
	}
	
	this.goToQuestion = function(hash, onDone) {
		
		// find specified question
		var qaController;
		for (var i = 0; i < qaControllers.length; i++) {
			if ("#" + qaControllers[i].getDiv().attr("id") === hash) {
				qaController = qaControllers[i];
				break;
			}
		}
		
		// open and jump to question
		if (qaController) {
			setImmediate(function() {
				qaController.open();
				var top = qaControllers[i].getQuestionDiv().get(0).offsetTop;
				window.scrollTo(0, top);
				if (onDone) onDone();
			})
		}
		
		// hide all questions if target not found
		else {
			for (var i = 0; i < qaControllers.length; i++) qaControllers[i].close();
			if (onDone) onDone();
		}
	}
	
	function expandAll() {
		for (var i = 0; i < qaControllers.length; i++) {
			qaControllers[i].open();
		}
	}
	
	function collapseAll() {
		for (var i = 0; i < qaControllers.length; i++) {
			qaControllers[i].close();
		}
	}
	
	/**
	 * Controls a single question/answer.
	 */
	function QuestionAnswerController(div, question, answer, id) {
		DivController.call(this, div);
		var rightTriangle = "►";
		var downTriangle = "▼";
		var arrowDiv;
		var questionDiv;
		var answerDiv;
		this.render = function(onDone) {
			
			// div setup
			div.empty();
			div.addClass("question_answer_div flex_horizontal flex_justify_start flex_align_start");
			if (id) div.attr("id", id);
			
			// arrow div
			arrowDiv = $("<div class='faq_arrow_div'>").appendTo(div);
			arrowDiv.append(rightTriangle);
			arrowDiv.click(function() { toggle(); });
			
			// question and answer
			var qaDiv = $("<div class='flex_vertical flex_align_start flex_justify_start width_100'>").appendTo(div);
			
			// question div
			questionDiv = $("<a class='question'>").appendTo(qaDiv);
			questionDiv.append(question);
			questionDiv.click(function() {
				toggle();
				if (history.pushState) history.pushState(null, null, "#" + id);
				else window.location.hash = "#" + id;
			});
			
			// answer div
			answerDiv = $("<div class='answer'>").appendTo(qaDiv);
			answerDiv.hide();
			answerDiv.append(answer);
			
			// done rendering
			if (onDone) onDone(div);
		},
		
		this.open = function() {
			answerDiv.show();
			arrowDiv.html(downTriangle);
		},
		
		this.close = function() {
			answerDiv.hide();
			arrowDiv.html(rightTriangle);
		}
		
		this.getQuestionDiv = function() {
			return questionDiv;
		}
		
		this.getAnswerDiv = function() {
			return answerDiv;
		}

		function toggle() {
			answerDiv.toggle();
			arrowDiv.html(answerDiv.is(":visible") ? downTriangle : rightTriangle);
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
				if (!plugin.getDonationAddress()) continue;
				donations.push({
					currencyPlugin: plugin,
					address: plugin.getDonationAddress(),
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
					title: $("<a target='_blank' href='https://github.com/gregdracoulis'>UI design - github.com/gregdracoulis</a>"),
					address: "0xD941B9c22ebF54Af09996e6aad41D08aFD8dd85a",
					currencyPlugin: AppUtils.getCryptoPlugin("ETH") 
				});
				credits.push({
					title: $("<a target='_blank' href='https://bitaddress.org'>bitaddress.org</a>"),
					address: "1NiNja1bUmhSoTXozBRBEtR8LeF9TGbZBN",
					currencyPlugin: AppUtils.getCryptoPlugin("BTC") 
				});
				credits.push({
					title: $("<a target='_blank' href='https://moneroaddress.org'>moneroaddress.org</a>"),
					address: "4AfUP827TeRZ1cck3tZThgZbRCEwBrpcJTkA1LCiyFVuMH4b5y59bKMZHGb9y58K3gSjWDCBsB4RkGsGDhsmMG5R2qmbLeW",
					currencyPlugin: AppUtils.getCryptoPlugin("XMR") 
				});
				credits.push({
					title: "BitPay",
					subtitle: $("<a target='_blank' href='https://bitpay.com'>www.bitpay.com</a>"),
					image: $("<img src='img/bitpay.png'>")
				});
				credits.push({
					title: "EthereumJS",
					subtitle: $("<a target='_blank' href='https://github.com/ethereumjs'>https://github.com/ethereumjs</a>"),
					image: $("<img src='img/ethereumjs.png'>")
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
			
			// render credits
			async.series(funcs, function(err, results) {
				if (err) throw err;
				onDone(creditsDiv);
			});
		}
		
		function renderLeft(div, credit, onDone) {
			div.attr("class", "donate_div flex_horizontal");

			// append the title
			var titleSubtitleDiv = $("<div class='flex_vertical flex_align_start width_100'>").appendTo(div);
			var titleDiv = $("<div class='donate_title'>").appendTo(titleSubtitleDiv);
			if (credit.title) titleDiv.append(credit.title);
			else titleDiv.append(getIconNameDiv(credit.currencyPlugin));
			
			// append the subtitle
			if (credit.subtitle) titleSubtitleDiv.append(credit.subtitle);
			else {
				if (credit.title) titleSubtitleDiv.append(getIconNameDiv(credit.currencyPlugin));
				titleSubtitleDiv.append($("<div class='donate_address copyable'>" + credit.address + "</div>"));
			}
			
			// append the image
			if (credit.image) setImage(credit.image);
			else AppUtils.renderQrCode(credit.address, null, setImage);
			function setImage(img) {
				img.addClass("donate_img_left");
				div.prepend(img);
				if (onDone) onDone();
			}
		}
		
		function renderRight(div, credit, onDone) {
			div.attr("class", "donate_div flex_horizontal");
			
			// append the title
			var titleSubtitleDiv = $("<div class='flex_vertical flex_align_end width_100'>").appendTo(div);
			var titleDiv = $("<div class='donate_title'>").appendTo(titleSubtitleDiv);
			if (credit.title) titleDiv.append(credit.title);
			else titleDiv.append(getIconNameDiv(credit.currencyPlugin));
			
			// append the subtitle
			if (credit.subtitle) titleSubtitleDiv.append(credit.subtitle);
			else {
				if (credit.title) titleSubtitleDiv.append(getIconNameDiv(credit.currencyPlugin));
				titleSubtitleDiv.append($("<div class='donate_address copyable'>" + credit.address + "</div>"));
			}
			
			// append the image
			if (credit.image) setImage(credit.image);
			else AppUtils.renderQrCode(credit.address, null, setImage);
			function setImage(img) {
				img.addClass("donate_img_right");
				div.append(img);
				if (onDone) onDone();
			}
		}
		
		function getIconNameDiv(plugin) {
			var iconNameDiv = $("<div class='donate_icon_name flex_horizontal flex_justify_start'>");
			iconNameDiv.append($("<img class='donate_icon' src='" + plugin.getLogo().get(0).src + "'>"));
			iconNameDiv.append(plugin.getName());
			return iconNameDiv;
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
	var currencyInputsController;
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
			if (AppUtils.DEV_MODE) {
				var formLinks = $("<div class='form_links_div'>").appendTo(pageDiv);
				var oneOfEachLink = $("<div class='form_link'>").appendTo(formLinks);
				oneOfEachLink.html("One of each");
				oneOfEachLink.click(function() { onOneOfEach(); });
			}
			
			// currency inputs
			var currencyDiv = $("<div class='form_section_div'>").appendTo(pageDiv);
			currencyInputsController = new EditorCurrenciesController($("<div>").appendTo(currencyDiv), plugins, function() {
				updateBip38Checkbox();
			}, function(hasError) {
				validateCurrencyInputs();
				updateGenerateButton();
			});
			currencyInputsController.render();
			
			// link to add currency
			var addCurrencyDiv = $("<div class='add_currency_div'>").appendTo(currencyDiv);
			var addCurrencySpan = $("<span class='add_currency_span'>").appendTo(addCurrencyDiv);
			addCurrencySpan.html("+ Add another currency");
			addCurrencySpan.click(function() {
				currencyInputsController.add();
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
					resetPassphrase();
				}
			});
			
			// passphrase input
			passphraseInputDiv = $("<div class='passphrase_input_div flex_vertical flex_justify_start'>").appendTo(passphraseDiv);
			renderInteroperabilityDisclaimer($("<div>").appendTo(passphraseInputDiv), "Passphrase encryption is not interoperable with other tools.");
			var passphraseWarnDiv = $("<div class='passphrase_warn_div'>").appendTo(passphraseInputDiv);
			passphraseWarnDiv.append("This passphrase is required to access funds later on.  <b>Do not lose it.</b>");
			passphraseInputDiv.append($("<div style='width:100%'>Passphrase</div>"));
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
				maxWidth: UiUtils.INFO_TOOLTIP_MAX_WIDTH,
				distance: 20,
				arrowTransform: 'scaleX(1.25) scaleY(2.5) translateX(250) translateY(-2px)',
				offset: '-220, 0'
			});
			
			// passphrase config
			var passphraseConfigDiv = $("<div class='passphrase_config_div flex_horizontal flex_justify_start'>").appendTo(passphraseInputDiv);
			bip38CheckboxDiv = $("<div class='bip38_checkbox_div flex_horizontal'>").appendTo(passphraseConfigDiv);
			bip38Checkbox = $("<input type='checkbox' id='bip38_checkbox'>").appendTo(bip38CheckboxDiv);
			var bip38CheckboxLabel = $("<label for='bip38_checkbox'>").appendTo(bip38CheckboxDiv);
			bip38CheckboxLabel.html("Use BIP38 for Bitcoin and Bitcoin Cash");
			var showPassphraseCheckboxDiv = $("<div class='show_passphrase_checkbox_div flex_horizontal'>").appendTo(passphraseConfigDiv);
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
			bip38Tooltip.append("BIP38 requires significantly more time and energy to encrypt/decrypt private keys than <a target='_blank' href='https://github.com/brix/crypto-js'>CryptoJS</a> (the default encryption scheme), which makes it more secure against brute-force attacks.");
			tippy(bip38Info.get(0), {
				arrow: true,
				html: bip38Tooltip.get(0),
				interactive: true,
				placement: 'bottom',
				theme: 'translucent',
				trigger: "mouseenter",
				multiple: 'false',
				maxWidth: UiUtils.INFO_TOOLTIP_MAX_WIDTH,
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
			splitTooltip.append("Uses <a target='_blank' href='https://en.wikipedia.org/wiki/Shamir%27s_Secret_Sharing'>Shamir's Secret Sharing</a> to split generated storage into separate pieces where some of the pieces must be combined in order to access funds.<br><br>");
			splitTooltip.append("This is useful for geographically splitting your cryptocurrency storage so that funds cannot be accessed at any one physical location without obtaining and combining multiple pieces.<br><br>");
			splitTooltip.append("For example, 10 keypairs can be split into 3 pieces where 2 pieces must be combined to access funds.  Each piece will contain shares for all 10 keypairs.  No funds can be accessed from any of the pieces until 2 of the 3 pieces are combined.");
			tippy(splitInfo.get(0), {
				arrow: true,
				html: splitTooltip.get(0),
				interactive: true,
				placement: 'bottom',
				theme: 'translucent',
				trigger: "mouseenter",
				multiple: 'false',
				maxWidth: UiUtils.INFO_TOOLTIP_MAX_WIDTH,
				distance: 20,
				arrowTransform: 'scaleX(1.25) scaleY(2.5) translateY(2px)',
				offset: '-180, 0'
			});
			
			// split input
			splitInputDiv = $("<div class='split_input_div flex_vertical flex_justify_start'>").appendTo(splitDiv);
			renderInteroperabilityDisclaimer($("<div>").appendTo(splitInputDiv), "Split storage is not interoperable with other tools.");
			var splitConfigDiv = $("<div class='flex_horizontal'>").appendTo(splitInputDiv);
			var splitQr = $("<img class='split_qr' src='img/qr_code.png'>").appendTo(splitConfigDiv);
			var splitLines3 = $("<img class='split_lines_3' src='img/split_lines_3.png'>").appendTo(splitConfigDiv);
			var splitNumDiv = $("<div class='split_num_div flex_vertical flex_justify_start'>").appendTo(splitConfigDiv);
			var splitNumLabelTop = $("<div class='split_num_label_top'>").appendTo(splitNumDiv);
			splitNumLabelTop.html("Split Each Key Into");
			numPiecesInput = $("<input type='tel' value='3' min='2'>").appendTo(splitNumDiv);
			var splitNumLabelBottom = $("<div class='split_num_label_bottom'>").appendTo(splitNumDiv);
			splitNumLabelBottom.html("Pieces");
			var splitLines2 = $("<img class='split_lines_2' src='img/split_lines_2.png'>").appendTo(splitConfigDiv);
			var splitMinDiv = $("<div class='split_min_div flex_vertical flex_justify_start'>").appendTo(splitConfigDiv);
			var splitMinLabelTop = $("<div class='split_min_label_top'>").appendTo(splitMinDiv);
			splitMinLabelTop.html("Require");
			minPiecesInput = $("<input type='tel' value='2' min='2'>").appendTo(splitMinDiv);
			var splitMinLabelBottom = $("<div class='split_min_label_bottom'>").appendTo(splitMinDiv);
			splitMinLabelBottom.html("To Recover");
			numPiecesInput.on("input", function(e) { validateSplit(false); });
			numPiecesInput.on("focusout", function(e) { validateSplit(true); });
			minPiecesInput.on("input", function(e) { validateSplit(false); });
			minPiecesInput.on("focusout", function(e) { validateSplit(true); });
			
			// add generate button
			var generateDiv = $("<div class='form_generate_div flex_horizontal'>").appendTo(pageDiv);
			btnGenerate = $("<div class='dark_green_btn flex_horizontal'>").appendTo(generateDiv);
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
			
			// initialize state
			that.startOver();
			
			// done rendering
			onDone(div);
		});
	}
	
	this.startOver = function() {
		
		// ignore if not initialized
		if (!currencyInputsController) return;
		
		// reset currency inputs
		currencyInputsController.reset();
		
		// reset passphrase
		resetPassphrase();
		
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
		if (!hasFormErrors()) UiUtils.openEditorTab("Export Storage", {keyGenConfig: getKeyGenConfig(), confirmExit: true});
		if (onDone) onDone();
	}
	
	// get current form configuration
	function getKeyGenConfig() {
		var config = {};
		config.passphrase = passphraseCheckbox.prop('checked') ? passphraseInput.val() : null;
		config.numPieces = splitCheckbox.prop('checked') ? parseFloat(numPiecesInput.val()) : 1;
		config.minPieces = splitCheckbox.prop('checked') ? parseFloat(minPiecesInput.val()) : null;
		config.verifyEncryption = AppUtils.VERIFY_ENCRYPTION;
		config.currencies = currencyInputsController.getConfig();
		for (var i = 0; i < config.currencies.length; i++) {
			config.currencies[i].encryption = passphraseCheckbox.prop('checked') ? getEncryptionScheme(currencyInputsController.getCurrencyInputs()[i]) : null;
		}
		verifyConfig(config);
		return config;
		
		function getEncryptionScheme(currencyInput) {
			if (currencyInput.getSelectedPlugin().getTicker() === "BTC" && bip38Checkbox.prop('checked')) return AppUtils.EncryptionScheme.BIP38;
			if (currencyInput.getSelectedPlugin().getTicker() === "BCH" && bip38Checkbox.prop('checked')) return AppUtils.EncryptionScheme.BIP38;
			return currencyInput.getSelectedPlugin().getEncryptionSchemes()[0];
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
	
	function renderInteroperabilityDisclaimer(div, msg) {
		div.empty();
		div.addClass("interoperability_disclaimer flex_horizontal");
		$("<img class='interoperability_caution' src='img/caution_solid.png'>").appendTo(div);
		var msgDiv = $("<div>").appendTo(div);
		msg = "&nbsp;" + msg;
		msgDiv.append(msg);
		div.append("&nbsp;");
		var readMoreLink = $("<a target='_blank' href='#faq_interoperable'>Read more</a>").appendTo(div);
	}
	
	function onOneOfEach() {
		currencyInputsController.empty();
		for (var i = 0; i < plugins.length; i++) {
			currencyInputsController.add(plugins[i].getTicker());
		}
		validateCurrencyInputs();
		updateBip38Checkbox();
	}
	
	function resetPassphrase() {
		passphraseCheckbox.prop('checked', false);
		passphraseInput.get(0)._tippy.hide(0);
		passphraseInput.val("");
		passphraseInput.attr("type", "password");
		showPassphraseCheckbox.prop('checked', false);
		bip38Checkbox.prop('checked', false);
		passphraseInputDiv.hide();
		setPassphraseError(false);
		if (AppUtils.DEV_MODE) passphraseInput.val(AppUtils.DEV_MODE_PASSPHRASE);	// dev mode default passphrase
	}
	
	function updateBip38Checkbox() {
		if (currencyInputsController.hasCurrencySelected("BCH") || currencyInputsController.hasCurrencySelected("BTC")) {
			bip38CheckboxDiv.show();
		} else {
			bip38CheckboxDiv.hide();
		}
	}
	
	function updateGenerateButton() {
		setGenerateEnabled(!hasFormErrors());
	}
	
	function hasFormErrors() {
		return (formErrors.environment && !AppUtils.DEV_MODE) || formErrors.currencyInputs || formErrors.passphrase || formErrors.split;
	}
	
	function validateForm(validateCurrencySelection) {
		validateCurrencyInputs(validateCurrencySelection);
		validatePassphrase();
		validateSplit(true);
	}
	
	function validateCurrencyInputs(validateCurrencySelection) {
		if (validateCurrencySelection) currencyInputsController.validate();
		formErrors.currencyInputs = currencyInputsController.hasFormError();
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
			setPassphraseError(!passphrase || passphrase.length < AppUtils.MIN_PASSPHRASE_LENGTH);
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
				if (!numPiecesInput.val() || !isInt(numPieces) || numPieces < 2 || numPieces > AppUtils.MAX_SHARES) {
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
				if (!minPiecesInput.val() || !isInt(minPieces) || minPieces < 2 || (!numPiecesError && minPieces > numPieces) || minPieces > AppUtils.MAX_SHARES) {
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
	var inputFiles;
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
		warningDiv = $("<div class='import_warning_div flex_horizontal'>").appendTo(importInputDiv);
		warningDiv.hide();
		
		// all file importing
		fileInputDiv = $("<div>").appendTo(importInputDiv);
		
		// decryption div
		decryptionDiv = $("<div>").appendTo(importInputDiv);
		decryptionDiv.hide();
		
		// drag and drop div
		var dragDropDiv = $("<div class='import_drag_drop flex_horizontal'>").appendTo(fileInputDiv);
		var dragDropImg = $("<img class='drag_drop_img' src='img/drag_and_drop.png'>").appendTo(dragDropDiv);
		var dragDropText = $("<div class='drag_drop_text flex_vertical flex_justify_start'>").appendTo(dragDropDiv);
		var dragDropLabel = $("<div class='drag_drop_label'>").appendTo(dragDropText);
		dragDropLabel.append("Drag and Drop Files To Import");
		var dragDropBrowse = $("<div class='drag_drop_browse'>").appendTo(dragDropText);
		dragDropBrowse.append("or click to browse");
		
		// register browse link with hidden input
		inputFiles = $("<input type='file' multiple accept='.json,.csv,.zip'>").appendTo(dragDropDiv);
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
			if (!img) img = $("<img src='img/caution.png'>");
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
				if (!AppUtils.DEV_MODE) console.log(err);
				that.setWarning("Invalid piece '" + namedPiece.name + "': " + err.message);
			}
		}
		updatePieces(onDone);
	}
	
	this.startOver = function() {
		that.setWarning("");
		inputFiles.val("");
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
				showInlineStorage(pieces, decryptedKeys, decryptedPieces, decryptedPieceDivs);
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
					UiUtils.openEditorTab("Encrypted Keys", {keys: keys, splitPieces: pieces.length > 1 ? pieces : null});
				});
			});
		} else {
			showInlineStorage(pieces, keys);
		}
	}
	
	function showInlineStorage(importedPieces, keys, pieces, pieceDivs) {
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
			viewSplit.click(function() { UiUtils.openEditorTab("Imported Pieces", {pieces: importedPieces}); });
		}
		
		// inline storage
		var storageDiv = $("<div>").appendTo(importedStorageDiv);
		new ExportController(storageDiv, window, {
			keys: keys,
			pieces: pieces,
			pieceDivs: pieceDivs,
			isInline: true
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
						if (isCsvFile(file)) that.setWarning("File '" + file.name + "' is not a valid csv piece");
						else if (isZipFile(file)) that.setWarning("Zip '" + file.name + "' does not contain any valid pieces");
						else throw new Error("Unrecognized file type: " + file.type);
					} else {
						onNamedPieces(null, namedPieces);
					}
				});
			}
			if (isJsonFile(file) || isCsvFile(file)) reader.readAsText(file);
			else if (isZipFile(file)) reader.readAsArrayBuffer(file);
			else that.setWarning("File is not a json, csv, or zip file");
		}
		
		function getNamedPiecesFromFile(file, data, onNamedPieces) {
			
			// handle json file
			if (isJsonFile(file)) {
				var piece;
				try {
					piece = JSON.parse(data);
					var namedPiece = {name: file.name, piece: piece};
					onNamedPieces(null, [namedPiece]);
				} catch (err) {
					onNamedPieces(Error("Could not parse JSON content from '" + file.name + "'"));
				}
			}
			
			// handle csv file
			else if (isCsvFile(file)) {
				try {
					piece = AppUtils.csvToPiece(data);
					var namedPiece = {name: file.name, piece: piece};
					onNamedPieces(null, [namedPiece]);
				} catch (err) {
					onNamedPieces(Error("'" + file.name + "' is not a valid piece"));
				}
			}
			
			// handle zip file
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
			UiUtils.openEditorTab("Imported Storage", {pieces: pieces});
		});
		
		// attempt to get keys
		var keys;
		try {
			var keys = AppUtils.piecesToKeys(pieces);
		} catch (err) {
			if (!AppUtils.DEV_MODE) console.log(err);
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
		warningDiv = $("<div class='import_warning_div flex_horizontal'>").appendTo(importInputDiv);
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
		textArea.attr("placeholder", "Enter private keys, split shares, csv, or json");
		
		// submit button
		var submit = $("<div class='import_button'>").appendTo(textInputDiv);
		submit.html("Submit");
		submit.click(function() { onSubmit(); });
		
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
		selectedPlugin = null;
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
	
	function onKeysImported(pieces, keys) {
		resetControls();
		setWarning("");
		keys = listify(keys);
		assertTrue(keys.length > 0);
		if (keys[0].hasPrivateKey() && keys[0].isEncrypted()) {
			
			// create decryption controller and register callbacks
			decryptionController = new DecryptionController(decryptionDiv, keys, function(warning) {
				setWarning(warning);
			}, function(decryptedKeys, decryptedPieces, decryptedPieceDivs) {
				showInlineStorage(pieces, decryptedKeys, decryptedPieces, decryptedPieceDivs);
			});
			
			// render decryption controller
			decryptionController.render(function() {
				
				// replace text input div with decryption
				textInputDiv.hide();
				decryptionDiv.show();
				controlsDiv.show();
				decryptionController.focus();
				
				// add control to view encrypted keys
				addControl("view encrypted keys", function() {
					UiUtils.openEditorTab("Encrypted Keys", {keys: keys, splitPieces: pieces.length > 1 ? pieces : null});
				});
			});
		} else {
			showInlineStorage(pieces, keys);
		}
	}
	
	function showInlineStorage(importedPieces, keys, pieces, pieceDivs) {
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
			viewSplit.click(function() { UiUtils.openEditorTab("Imported Pieces", {pieces: importedPieces}); });
		}
		
		// inline storage
		var storageDiv = $("<div>").appendTo(importedStorageDiv);
		new ExportController(storageDiv, window, {
			keys: keys,
			pieces: pieces,
			pieceDivs: pieceDivs,
			isInline: true
		}).render();
	}
	
	function setWarning(str, img) {
		warningDiv.empty();
		if (str) {
			if (!img) img = $("<img src='img/caution.png'>");
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
		processPieces();
	}
	
	function removePiece(piece) {
		for (var i = 0; i < importedPieces.length; i++) {
			if (equals(importedPieces[i], piece)) {
				importedPieces.splice(i, 1);
				processPieces();
				return;
			}
		}
		throw new Error("No piece imported: " + piece);
	}
	
	/**
	 * Invoked when the submit button clicked.
	 */
	function onSubmit() {
		
		// init state
		setWarning("");
		resetControls();
		
		// get text
		var text = textArea.val().trim();
		
		// check for empty text
		if (text === "") {
			setWarning("No text entered");
			return;
		}
		
		// get pieces from input text
		try {
			var piece = AppUtils.parsePieceFromText(text, selectedPlugin);
		} catch (err) {
			if (err.message.indexOf("Plugin required") !== -1) {
				setWarning("No currency selected");
				return;
			}
			throw err;
		}
		
		// check if valid piece input
		if (!piece) {
			setWarning("Input text is not a private key or piece");
			return;
		}
		
		// check if piece can be added to imported pieces
		var msg = getCompatibilityError(piece, importedPieces);
		if (msg) {
			setWarning(msg);
			return;
		}
		
		// assign pieceNum if not given
		if (!piece.pieceNum) piece.pieceNum = getNextAvailablePieceNum(importedPieces);
		
		// accept piece into imported pieces
		textArea.val("");
		importedPieces.push(piece);
		processPieces();
		
		function getNextAvailablePieceNum(pieces) {
			var pieceNum = 1;
			while (true) {
				var found = false;
				for (var i = 0; i < pieces.length; i++) {
					if (pieces[i].pieceNum === pieceNum) {
						found = true;
						break;
					} 
				}
				if (!found) return pieceNum;
				pieceNum++;
			}
		}
		
		function getCompatibilityError(piece, pieces) {
			
			// check if piece already added
			if (arrayContains(pieces, piece)) return "Piece already imported";
			
			// no issues adding private key
			return null;
		}
	}
	
	/**
	 * Reads the imported pieces.
	 */
	function processPieces() {
		
		// update UI
		setWarning("");
		renderImportedPieces(importedPieces);
		
		// done if no pieces
		if (importedPieces.length === 0) return;
		
		// add control to view pieces
		addControl("view imported pieces", function() {
			UiUtils.openEditorTab("Imported Storage", {pieces: importedPieces});
		});
		
		// check if pieces combine to make private keys
		try {
			var keys = AppUtils.piecesToKeys(importedPieces);
			onKeysImported(importedPieces, keys);
		} catch (err) {
			if (err.message.indexOf("additional piece") > -1) setWarning(err.message, $("<img src='img/files.png'>"));
			else setWarning(err.message);
		}
	}
	
	function renderImportedPieces(pieces) {
		
		// selector enabled iff no pieces
		setSelectorEnabled(pieces.length === 0 || !selectedPlugin);

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
			assertTrue(piece.keys.length > 0);
			var pieceLabel = piece.keys.length === 1 ? (piece.keys[0].wif ? piece.keys[0].wif : piece.keys[0].address) : "Imported piece" + (piece.pieceNum ? " " + piece.pieceNum : "");
			importedPieceDiv.append(AppUtils.getShortenedString(pieceLabel, MAX_PIECE_LENGTH));
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
		if (AppUtils.DEV_MODE) passphraseInput.val(AppUtils.DEV_MODE_PASSPHRASE);
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
		var renderWeight = IndustrialPieceRenderer.getWeight(encryptedKeys.length, 1, null);
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
				new IndustrialPieceRenderer(pieces, null, null).render(function(percentDone) {
					setProgress((decryptWeight + percentDone * renderWeight) / totalWeight, "Rendering");
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
 * Editor controller.
 * 
 * @param div is the div to render to
 * @param config specifies export page behavior
 * 				config.splitPieces are imported split pieces
 * 				config.keys are keys to generate pieces from
 * 				config.pieces are pieces to export and generate pieceDivs from
 * 				config.pieceDivs are pre-generated piece divs ready for display
 */
function EditorController(div, config) {
	DivController.call(this, div);
	
	// global variables
	var that = this;
	var passphraseController
	var splitController;
	var progressDiv;
	var progressBar;
	var progressLabel;
	var piecesDiv;
	var logoHeader;
	var currenciesDiv;
	var currenciesController;
	var actionsController;
	
	this.render = function(onDone) {
		
		// init
		div.empty();
		div.addClass("editor_div, flex_vertical");
		
		// header
		var headerDiv = $("<div class='editor_header flex_vertical'>").appendTo(div);
		
		// passphrase and split input div
		var passphraseSplitDiv = $("<div class='editor_passphrase_split flex_horizontal'>").appendTo(headerDiv);
		
		// passphrase controller
		passphraseController = new EditorPassphraseController($("<div>").appendTo(passphraseSplitDiv), that.update);
		passphraseController.render();
		
		// split controller
		splitController = new EditorSplitController($("<div>").appendTo(passphraseSplitDiv), that.update);
		splitController.render();
		
		// body
		var bodyDiv = $("<div class='editor_body flex_vertical'>").appendTo(div);
		
		// load dependencies
		new LoadController(new EditorDependencyLoader(bodyDiv)).render(function() {

			// cryptostorage logo
			logoHeader = $("<div class='piece_page_header_div'>").appendTo(bodyDiv);
			$("<img class='piece_page_header_logo' src='img/cryptostorage_export.png'>").appendTo(logoHeader);
			
			// progress bar
			progressDiv = $("<div class='export_progress_div'>").appendTo(bodyDiv);
			progressDiv.hide();
			progressBar = UiUtils.getProgressBar(progressDiv);
			progressLabel = $("<div class='export_progress_label'>").appendTo(progressDiv);
			
			// pieces div
			piecesDiv = $("<div class='export_pieces_div'>").appendTo(bodyDiv);
			piecesDiv.hide();
			
			// currency inputs controller
			currenciesDiv = $("<div>").appendTo(bodyDiv);
			currenciesController = new EditorCurrenciesController(currenciesDiv, AppUtils.getCryptoPlugins(), that.update, that.update);
			currenciesController.render();
			
			// actions controller
			actionsController = new EditorActionsController($("<div>").appendTo(div), that);
			actionsController.render();
			
			// initial state
			if (config.keyGenConfig) {
				setKeyGenConfig(config.keyGenConfig);
				that.generate();
			}
			else {
				that.reset();
				if (AppUtils.DEV_MODE) currenciesController.getCurrencyInputs()[0].setSelectedCurrency("BCH");	// dev mode convenience
			}
		});
		
		// done rendering
		if (onDone) onDone(div);
	}
	
	this.validate = function() {
		passphraseController.validate();
		splitController.validate();
		currenciesController.validate();
	}
	
	this.generate = function() {
		console.log("EditorController.generate()");
		that.validate();
		that.update();
		if (that.hasFormError()) return;
		
		// hide body elems
		logoHeader.hide();
		currenciesDiv.hide();
		piecesDiv.hide();
		
		// generate keys
		piecesDiv.empty();
		AppUtils.generateKeys(getKeyGenConfig(), setGenerateProgress, function(err, keys, pieces, pieceDivs) {
			progressDiv.hide();
			currenciesDiv.show();
			for (var i = 0; i < pieceDivs.length; i++) {
				piecesDiv.append(pieceDivs[i]);
			}
			piecesDiv.show();
		}, true);
	}
	
	this.reset = function() {
		piecesDiv.empty();
		piecesDiv.hide();
		passphraseController.reset();
		splitController.reset();
		currenciesController.reset();
	}
	
	this.save = function() {
		console.log("EditorController.save()");
	}
	
	this.print = function() {
		console.log("EditorController.print()");
	}
	
	this.hasFormError = function() {
		if (passphraseController.hasFormError()) return true;
		if (splitController.hasFormError()) return true;
		if (currenciesController.hasFormError()) return true;
		return false;
	}
	
	this.update = function() {
		if (passphraseController) passphraseController.update();
		if (splitController) splitController.update();
		if (actionsController) actionsController.update();
	}
	
	// -------------------------------- PRIVATE ---------------------------------
	
	function setGenerateProgress(percent, label) {
		progressBar.set(percent);
		progressBar.setText(Math.round(percent * 100)  + "%");
		progressLabel.html(label);
		progressDiv.show();
	}
	
	function setKeyGenConfig(keyGenConfig) {		
		
		// set passphrase
		if (keyGenConfig.passphrase) passphraseController.setPassphrase(keyGenConfig.passphrase);
		
		// set split
		if (keyGenConfig.numPieces) splitController.setNumPieces(keyGenConfig.numPieces);
		if (keyGenConfig.minPieces) {
			splitController.setMinPieces(keyGenConfig.minPieces);
			splitController.setUseSplit(true);
		}
		
		// set currencies
		currenciesController.setConfig(keyGenConfig.currencies);
	}
	
	function getKeyGenConfig() {
		assertFalse(that.hasFormError());
		var keyGenConfig = {};
		
		// currencies config
		keyGenConfig.currencies = currenciesController.getConfig();
		
		// encryption config
		if (passphraseController.getUsePassphrase()) {
			keyGenConfig.passphrase = passphraseController.getPassphrase();
			keyGenConfig.verifyEncryption = AppUtils.VERIFY_ENCRYPTION;
		}
		for (var i = 0; i < keyGenConfig.currencies.length; i++) {
			var currency = keyGenConfig.currencies[i];
			currency.encryption = passphraseController.getUsePassphrase() ? AppUtils.getCryptoPlugin(currency.ticker).getEncryptionSchemes()[0] : null;	// TODO: bip38
		}

		// split config
		if (splitController.getUseSplit()) {
			keyGenConfig.numPieces = splitController.getNumPieces();
			keyGenConfig.minPieces = splitController.getMinPieces();
		}

		// validate and return
		validateKeyGenConfig(keyGenConfig);
		return keyGenConfig;
		
		function validateKeyGenConfig(config) {
			assertInitialized(config);
			assertObject(config);
			if (config.passphrase) {
				assertString(config.passphrase, "config.passphrase is not a string");
				assertTrue(config.passphrase.length >= 7, "config.passphrase.length is not >= 7");
				assertDefined(config.verifyEncryption, "config.verifyEncryption is not defined");
			}
			if (config.numPieces || config.minPieces) {
				assertNumber(config.numPieces, "config.numPieces is not a number");
				assertNumber(config.minPieces, "config.minPieces is not a number");
				assertTrue(config.numPieces >= 2, "config.numPieces is not >= 2");
				assertTrue(config.minPieces >= 2, "config.minPieces is not >= 2");
				assertTrue(config.minPieces <= config.numPieces, "config.minPieces is not <= config.numPieces");
			}
			assertInitialized(config.currencies, "config.currencies is not initialized");
			assertTrue(config.currencies.length >= 1, "config.currencies.length is not >= 1");
			for (var i = 0; i < config.currencies.length; i++) {
				var currency = config.currencies[i];
				assertDefined(currency.ticker, "config.currencies[" + i + "].ticker is not defined");
				assertDefined(currency.numKeys, "config.currencies[" + i + "].numKeys is not defined");
				assertDefined(currency.encryption, "config.currencies[" + i + "].encryption is not defined");
				if (config.passphrase) assertInitialized(currency.encryption, "config.currencies[" + i + "].encryption is not initialized");
			}
		}
	}
	
	/**
	 * Controller that only loads editor dependencies.
	 */
	function EditorDependencyLoader(div) {
		DivController.call(this, div);
		this.render = function(onDone) {
			LOADER.load(AppUtils.getAppDependencies(), function(err) {	// TODO: load correct dependencies
				if (err) throw err;
				if (onDone) onDone(div);
			});
		}
	}
	inheritsFrom(EditorDependencyLoader, DivController);
}
inheritsFrom(EditorController, DivController);

/**
 * Controls passphrase input and validation.
 * 
 * @param div is the div to render to
 * @param onChange() is invoked when the state changes
 */
function EditorPassphraseController(div, onChange) {
	DivController.call(this, div);
	
	var that = this;
	var passphraseCheckbox;
	var passphraseInput;
	var formError;

	this.render = function(onDone) {
		
		// div setup
		div.empty();
		div.addClass("flex_horizonal flex_justify_start");
		
		// passphrase input
		passphraseCheckbox = $("<input type='checkbox' id='passphrase_checkbox'>").appendTo(div);
		var passphraseCheckboxLabel = $("<label class='user_select_none' for='passphrase_checkbox'>").appendTo(div);
		passphraseCheckboxLabel.html("Use Passphrase?");
		passphraseInput = $("<input type='password' class='editor_passphrase_input'>").appendTo(div);
		
		// password error tooltip
		tippy(passphraseInput.get(0), {
			arrow: true,
			html: $("<div>Passphrase must be at least 7 characters</div>").get(0),
			interactive: false,
			placement: 'bottom',
			theme: 'error',
			trigger: "manual",
			multiple: 'false',
			maxWidth: UiUtils.INFO_TOOLTIP_MAX_WIDTH,
			distance: 20,
			arrowTransform: 'scaleX(1.25) scaleY(2.5) translateX(110) translateY(-2px)',
			offset: '0, 0'
		});
		
		// register clicks
		passphraseCheckbox.click(function() {
			if (passphraseCheckbox.prop("checked")) passphraseInput.focus();
			else {
				passphraseInput.val("");
				that.validate();
			}
			if (onChange) onChange();
		});
		
		// register text input
		passphraseInput.on("input", function(e) { setPassphraseError(false); });
	}
	
	this.reset = function() {
		passphraseCheckbox.prop("checked", false);
		passphraseInput.val("");
		that.validate();
		that.update();
	}
	
	this.validate = function() {
		setPassphraseError(that.getUsePassphrase() && that.getPassphrase().length < AppUtils.MIN_PASSPHRASE_LENGTH);
	}
	
	this.hasFormError = function() {
		return formError;
	}
	
	this.update = function() {
		that.getUsePassphrase() ? passphraseInput.removeAttr("disabled") : passphraseInput.attr("disabled", "disabled");
	}
	
	this.getUsePassphrase = function() {
		return passphraseCheckbox.prop("checked");
	}
	
	this.setUsePassphrase = function(checked) {
		passphraseCheckbox.prop("checked", checked);
	}
	
	this.getPassphrase = function() {
		return passphraseInput.val();
	}
	
	this.setPassphrase = function(passphrase) {
		passphraseInput.val(passphrase);
	}
	
	// --------------------------------- PRIVATE --------------------------------
	
	function setPassphraseError(bool) {
		var lastError = formError;
		if (bool) {
			formError = true;
			passphraseInput.addClass("form_input_error_div");
			passphraseInput.focus();
			setImmediate(function() { passphraseInput.get(0)._tippy.show(); });	// initial click causes tooltip to hide, so wait momentarily
		} else {
			passphraseInput.removeClass("form_input_error_div");
			formError = false;
			passphraseInput.get(0)._tippy.hide();
		}
		if (formError !== lastError && onChange) onChange();
	}
}
inheritsFrom(EditorPassphraseController, DivController);

/**
 * Controls split input and validation.
 * 
 * @param div is the div to render to
 * @param onChange() is invoked when the state changes
 */
function EditorSplitController(div, onChange) {
	DivController.call(this, div);
	
	var that = this;
	var splitCheckbox;
	var splitInput;
	var formError;
	
	this.render = function(onDone) {
		
		// div setup
		div.empty();
		div.addClass("editor_split_div flex_horizontal flex_justify_start");
		
		// split input
		splitCheckbox = $("<input type='checkbox' id='split_checkbox'>").appendTo(div);
		var splitCheckboxLabel = $("<label class='user_select_none' for='split_checkbox'>").appendTo(div);
		splitCheckboxLabel.html("Split Keys?");
		var splitInfo = $("<img src='img/information_white.png' class='information_img'>").appendTo(div);
		var splitQr = $("<img class='split_qr' src='img/qr_code.png'>").appendTo(div);
		var splitLines3 = $("<img class='split_lines_3' src='img/split_lines_3.png'>").appendTo(div);
		var splitNumDiv = $("<div class='split_input_div flex_vertical flex_justify_start'>").appendTo(div);
		var splitNumLabelTop = $("<div class='split_config_label split_config_label_top'>").appendTo(splitNumDiv);
		splitNumLabelTop.html("Split Into");
		numPiecesInput = $("<input class='split_input' type='tel' min='2'>").appendTo(splitNumDiv);
		var splitNumLabelBottom = $("<div class='split_config_label split_config_label_bottom'>").appendTo(splitNumDiv);
		splitNumLabelBottom.html("Pieces");
		var splitLines2 = $("<img class='split_lines_2' src='img/split_lines_2.png'>").appendTo(div);
		var splitMinDiv = $("<div class='split_input_div flex_vertical flex_justify_start'>").appendTo(div);
		var splitMinLabelTop = $("<div class='split_config_label split_config_label_top'>").appendTo(splitMinDiv);
		splitMinLabelTop.html("Require");
		minPiecesInput = $("<input class='split_input' type='tel' min='2'>").appendTo(splitMinDiv);
		var splitMinLabelBottom = $("<div class='split_config_label split_config_label_bottom'>").appendTo(splitMinDiv);
		splitMinLabelBottom.html("To Recover");		
		
		// split tooltip
		var splitTooltip = $("<div>");
		splitTooltip.append("Uses <a target='_blank' href='https://en.wikipedia.org/wiki/Shamir%27s_Secret_Sharing'>Shamir's Secret Sharing</a> to split generated storage into separate pieces where some of the pieces must be combined in order to access funds.<br><br>");
		splitTooltip.append("This is useful for geographically splitting your cryptocurrency storage so that funds cannot be accessed at any one physical location without obtaining and combining multiple pieces.<br><br>");
		splitTooltip.append("For example, 10 keypairs can be split into 3 pieces where 2 pieces must be combined to access funds.  Each piece will contain shares for all 10 keypairs.  No funds can be accessed from any of the pieces until 2 of the 3 pieces are combined.");
		tippy(splitInfo.get(0), {
			arrow: true,
			html: splitTooltip.get(0),
			interactive: true,
			placement: 'bottom',
			theme: 'translucent',
			trigger: "mouseenter",
			multiple: 'false',
			maxWidth: UiUtils.INFO_TOOLTIP_MAX_WIDTH,
			distance: 20,
			arrowTransform: 'scaleX(1.25) scaleY(2.5) translateY(2px)',
			offset: '-180, 0'
		});
		
		// register inputs
		splitCheckbox.click(function() {
			if (splitCheckbox.prop("checked")) numPiecesInput.focus();
			else that.validate();
			if (onChange) onChange();
		});
		numPiecesInput.on("input", function(e) { that.validate(true); });
		numPiecesInput.on("focusout", function(e) { that.validate(false); });
		minPiecesInput.on("input", function(e) { that.validate(true); });
		minPiecesInput.on("focusout", function(e) { that.validate(false); });
		
		// initial state
		that.reset();
		
		// done
		if (onDone) onDone(div);
	}
	
	this.reset = function() {
		splitCheckbox.prop("checked", false);
		numPiecesInput.val("3");
		minPiecesInput.val("2");
		that.validate();
		that.update();
	}
	
	this.validate = function(lenientBlankAndRange) {
		var lastError = formError;
		formError = false;
		if (that.getUseSplit()) {
			
			// validate num pieces
			var numPieces = Number(numPiecesInput.val());
			if (lenientBlankAndRange) {
				if (!numPiecesInput.val() || isInt(numPieces)) {
					numPiecesInput.removeClass("form_input_error_div");
				} else {
					formError = true;
					numPiecesInput.addClass("form_input_error_div");
				}
			} else {
				if (!numPiecesInput.val() || !isInt(numPieces) || numPieces < 2 || numPieces > AppUtils.MAX_SHARES) {
					formError = true;
					numPiecesInput.addClass("form_input_error_div");
				} else {
					numPiecesInput.removeClass("form_input_error_div");
				}
			}
			
			// validate min pieces
			var minPieces = Number(minPiecesInput.val());
			if (lenientBlankAndRange) {
				if (!minPiecesInput.val() || isInt(minPieces)) {
					minPiecesInput.removeClass("form_input_error_div");
				} else {
					formError = true;
					minPiecesInput.addClass("form_input_error_div");
				}
			} else {
				if (!minPiecesInput.val() || !isInt(minPieces) || minPieces < 2 || (!formError && minPieces > numPieces) || minPieces > AppUtils.MAX_SHARES) {
					formError = true;
					minPiecesInput.addClass("form_input_error_div");
				} else {
					minPiecesInput.removeClass("form_input_error_div");
				}
			}
		} else {
			numPiecesInput.removeClass("form_input_error_div");
			minPiecesInput.removeClass("form_input_error_div");
		}
		if (formError !== lastError && onChange) onChange();	// notify of change
	}
	
	this.hasFormError = function() {
		return formError;
	}
	
	this.update = function() {
		if (that.getUseSplit()) {
			numPiecesInput.removeAttr("disabled");
			minPiecesInput.removeAttr("disabled");
		} else {
			numPiecesInput.attr("disabled", "disabled");
			minPiecesInput.attr("disabled", "disabled");
		}
	}
	
	this.getUseSplit = function() {
		return splitCheckbox.prop("checked");
	}
	
	this.setUseSplit = function(bool) {
		splitCheckbox.prop("checked", bool);
	}
	
	this.getNumPieces = function() {
		var numPieces = Number(numPiecesInput.val());
		if (!isInt(numPieces)) return null;
		return numPieces;
	}
	
	this.setNumPieces = function(numPieces) {
		numPiecesInput.val(numPieces);
	}
	
	this.getMinPieces = function() {
		var minPieces = Number(minPiecesInput.val());
		if (!isInt(minPieces)) return null;
		return minPieces;
	}
	
	this.setMinPieces = function(minPieces) {
		minPiecesInout.val(minPieces);
	}
}
inheritsFrom(EditorSplitController, DivController);

/**
 * Manages a single currency input.
 * 
 * @param div is the div to render to
 * @param plugins are crypto plugins to select from
 * @param defaultTicker is the ticker of the initial selected currency
 * @param onCurrencyChange(ticker) is invoked when the user changes the currency selection
 * @param onDelete is invoked when the user delets this input
 * @param onFormErrorChange(hasError) is invoked when the validity state changes
 */
function EditorCurrencyController(div, plugins, defaultTicker, onCurrencyChange, onDelete, onFormErrorChange) {
	DivController.call(this, div);
	
	assertInitialized(div);
	assertInitialized(plugins);
	
	// state variables
	var that = this;
	var id = uuidv4();	// id to accomodate ddslick's id requirement
	var selectedPlugin;
	var numKeysInput;
	var selector;
	var selectorData;
	var trashDiv;
	var trashImg;
	var initializing = true;
	var formError = false;
	var currencyError = false;
	var numKeysError = false;
	
	this.render = function(onDone) {
		div.empty();
		div.attr("class", "currency_input_div flex_horizontal width_100");
		
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
		selector = $("<div id='currency_selector_" + id + "'>").appendTo(div);
		that.setSelectedCurrency(null);	// initializes selector
		if (defaultTicker) that.setSelectedCurrency(defaultTicker);
		
		// create right div
		var rightDiv = $("<div class='currency_input_right_div'>").appendTo(div);
		rightDiv.append("Keypairs to generate&nbsp;&nbsp;");
		numKeysInput = $("<input class='num_keys_input' type='tel' value='1' min='1'>").appendTo(rightDiv);
		numKeysInput.on("input", function(e) { validateNumKeys(true); });
		numKeysInput.on("focusout", function(e) { validateNumKeys(false); });
		rightDiv.append("&nbsp;&nbsp;");
		trashDiv = $("<div class='trash_div'>").appendTo(rightDiv);
		trashDiv.click(function() { onDelete(); });
		trashImg = $("<img class='trash_img' src='img/trash.png'>").appendTo(trashDiv);
		
		// no longer initializing
		initializing = false;
		if (onDone) onDone(div);
	};
	
	this.getSelectedPlugin = function() {
		return selectedPlugin;
	};
	
	this.setSelectedCurrency = function(ticker) {
					
		// reset dropdown
		if (ticker === null || ticker === undefined) {
			selector.ddslick("destroy");
			selector = $("#currency_selector_" + id, div);	// ddslick requires id reference
			selector.ddslick({
				data: selectorData,
				background: "white",
				imagePosition: "left",
				selectText: "Select a Currency...",
				defeaultSelectedIndex: null,
				onSelected: function(selection) {
					selectedPlugin = plugins[selection.selectedIndex];
					if (!initializing && onCurrencyChange) onCurrencyChange(ticker);
					validateCurrency();
				}
			});
			selectedPlugin = null;
			selector = $("#currency_selector_" + id, div);	// ddslick requires id reference
		}
		
		// set to currency
		else {
			var name = AppUtils.getCryptoPlugin(ticker).getName();
			for (var i = 0; i < selectorData.length; i++) {
				if (selectorData[i].text === name) {
					selector.ddslick('select', {index: i});
					selectedPlugin = plugins[i];
					if (!initializing && onCurrencyChange) onCurrencyChange(ticker);
					validateCurrency();
					break;
				}
			}
		}
	};
	
	this.getNumKeys = function() {
		var num = Number(numKeysInput.val());
		if (isInt(num)) return num;
		return null;
	};
	
	this.setNumKeys = function(numKeys) {
		numKeysInput.val(numKeys);
	}
	
	this.setTrashEnabled = function(enabled) {
		trashDiv.unbind("click");
		if (enabled) {
			trashDiv.click(function() { onDelete(); });
			trashImg.removeClass("trash_div_disabled");
		} else {
			trashImg.addClass("trash_div_disabled");
		}
	};
	
	/**
	 * Indicates if any form errors are visible on this currency input.
	 * 
	 * @returns true if any form errors are visible, false otherwise
	 */
	this.hasFormError = function() {
		return formError;
	};
	
	/**
	 * Validates the currency input.
	 */
	this.validate = function() {
		validateCurrency();
		validateNumKeys(false);
	};
	
	// ---------------------- PRIVATE ------------------------
	
	function validateCurrency() {
		if (selectedPlugin) {
			currencyError = false;
			$(".dd-select", selector).removeClass("form_input_error_div");
		} else {
			currencyError = true;
			$(".dd-select", selector).addClass("form_input_error_div");
		}
		updateFormError();
	}
	
	function validateNumKeys(ignoreBlank) {
		
		// check for blank box
		if (ignoreBlank && !numKeysInput.val()) {
			numKeysInput.removeClass("form_input_error_div");
			numKeysError = false;
		}
		
		// validate num keys
		else {
			var numKeys = that.getNumKeys();
			if (isInt(numKeys) && numKeys >= 1) {
				numKeysInput.removeClass("form_input_error_div");
				numKeysError = false;
			} else {
				numKeysInput.addClass("form_input_error_div");
				numKeysError = true;
			}
		}
		
		// update error state
		updateFormError();
	}
	
	function updateFormError() {
		var lastError = formError;
		formError = currencyError || numKeysError;
		if (!currencyError && numKeysError !== lastError) onFormErrorChange(formError);	// notify of form error change
	}
}
inheritsFrom(EditorCurrencyController, DivController);

/**
 * Manages a collection of currency inputs.
 * 
 * @param div is the div to render to
 * @param plugins are crypto plugins to select from
 * @param onInputsChange() is invoked when one of the inputs change
 * @param onFormErrorChange(hasError) is invoked when the validity state changes
 */
function EditorCurrenciesController(div, plugins, onInputsChange, onFormErrorChange) {
	DivController.call(this, div);
	
	// state variables
	var that = this;
	var currencyInputsDiv;
	var currencyInputs;
	var formError;
	
	this.render = function(onDone) {
		
		// div setup
		div.empty();
		div.css("width", "100%");
		
		// currency inputs div
		currencyInputsDiv = $("<div class='currency_inputs_div'>").appendTo(div);
		
		// add another currency link
		var addCurrencyDiv = $("<div class='add_currency_div'>").appendTo(div);
		var addCurrencySpan = $("<span class='add_currency_span'>").appendTo(addCurrencyDiv);
		addCurrencySpan.html("+ Add another currency");
		addCurrencySpan.click(function() { that.add(); });
		
		// initial state
		var onInputsChangeBkp = onInputsChange;
		onInputsChange = null;	// disable notifications
		currencyInputs = [];
		that.reset();
		onInputsChange = onInputsChangeBkp;
		
		// done
		if (onDone) onDone();
	};
	
	this.getCurrencyInputs = function() {
		return currencyInputs;
	};
	
	this.add = function(ticker) {
		var currencyInput = new EditorCurrencyController($("<div>"), plugins, ticker, onInputsChange, function() {
			remove(currencyInput);
		}, function(hasError) {
			updateFormError();
		});
		currencyInput.render();
		currencyInput.getDiv().appendTo(currencyInputsDiv);
		currencyInputs.push(currencyInput);
		currencyInputs[0].setTrashEnabled(currencyInputs.length !== 1);
		if (onInputsChange) onInputsChange();
	};
	
	this.hasFormError = function() {
		return formError;
	}
	
	this.validate = function() {
		for (var i = 0; i < currencyInputs.length; i++) {
			currencyInputs[i].validate();
		}
		updateFormError();
	};
	
	this.empty = function() {
		if (!currencyInputs.length) return;
		for (var i = 0; i < currencyInputs.length; i++) currencyInputs[i].getDiv().remove();
		currencyInputs = [];
		if (onInputsChange) onInputsChange();
		updateFormError();
	};
	
	this.reset = function() {
		for (var i = 0; i < currencyInputs.length; i++) currencyInputs[i].getDiv().remove();
		currencyInputs = [];
		that.add();
		updateFormError();
	};
	
	this.getConfig = function() {
		var config = [];
		for (var i = 0; i < currencyInputs.length; i++) {
			config.push({
				ticker: currencyInputs[i].getSelectedPlugin() ? currencyInputs[i].getSelectedPlugin().getTicker() : null,
				numKeys: currencyInputs[i].getNumKeys()
			});
		}
		return config;
	};
	
	/**
	 * Sets the configuration.
	 * 
	 * @param config is an array of currencies to set for the currency inputs in the format [{ticker: "BCH", ...}, {...}]
	 */
	this.setConfig = function(configCurrencies) {
		for (var i = 0; i < configCurrencies.length; i++) {
			currencyInputs[i].setSelectedCurrency(configCurrencies[i].ticker);
			currencyInputs[i].setNumKeys(configCurrencies[i].numKeys);
		}
	}
	
	this.hasCurrencySelected = function(ticker) {
		assertInitialized(ticker);
		for (var i = 0; i < currencyInputs.length; i++) {
			if (currencyInputs[i].getSelectedPlugin() && currencyInputs[i].getSelectedPlugin().getTicker() === ticker) return true;
		}
		return false;
	};
	
	//---------------------- PRIVATE ------------------------
	
	function remove(currencyInput) {
		var idx = currencyInputs.indexOf(currencyInput);
		if (idx < 0) throw new Error("Could not find currency input");
		var formErrorBeforeRemoved = that.hasFormError();
		currencyInputs.splice(idx, 1);
		currencyInputs[0].setTrashEnabled(currencyInputs.length !== 1);
		currencyInput.getDiv().remove();
		updateFormError();
		if (onInputsChange) onInputsChange();
	}
	
	function updateFormError() {
		var lastError = formError;
		formError = false;
		for (var i = 0; i < currencyInputs.length; i++) {
			if (currencyInputs[i].hasFormError()) {
				formError = true;
				break;
			}
		}
		if (formError !== lastError && onFormErrorChange) onFormErrorChange(formError);	// notify of form error change
	}
}
inheritsFrom(EditorCurrenciesController, DivController);

/**
 * Editor actions controller.
 */
function EditorActionsController(div, editorController) {
	DivController.call(this, div);
	
	var that = this;
	var btnGenerate;
	var btnReset;
	var btnCancel;
	var savePrintDiv;
	var btnSave;
	var btnPrint;
	
	this.render = function(onDone) {
		
		// div setup
		div.empty();
		div.addClass("editor_floating_controls");
		
		// generate button
		btnGenerate = $("<div class='editor_btn_green flex_horizontal user_select_none'>");
		btnGenerate.append("Generate");
		btnGenerate.hide();
		btnGenerate.appendTo(div);
		
		// reset button
		btnReset =  $("<div class='editor_btn_red flex_horizontal user_select_none'>");
		btnReset.append("Reset");
		btnReset.click(function() { editorController.reset(); });
		btnReset.hide();
		btnReset.appendTo(div);
		
		// save and print buttons
		savePrintDiv = $("<div class='flex_horizontal width_100'>");
		btnSave = $("<div class='editor_btn_blue flex_horizontal user_select_none'>").appendTo(savePrintDiv);
		btnSave.append("Save");
		btnSave.click(function() { editorController.save(); });
		$("<div style='width:30px;'>").appendTo(savePrintDiv);
		btnPrint = $("<div class='editor_btn_blue flex_horizontal user_select_none'>").appendTo(savePrintDiv);
		btnPrint.append("Print");
		btnPrint.click(function() { editorController.print(); });
		savePrintDiv.hide();
		savePrintDiv.appendTo(div);
		
		// initial state
		that.update();
		
		// done rendering
		if (onDone) onDone();
	}
	
	this.update = function() {
		console.log("EditorActionsController.update()");
		
		// generate button
		btnGenerate.show();
		btnGenerate.unbind("click");
		if (editorController.hasFormError()) {
			btnGenerate.addClass("btn_disabled");
		} else {
			btnGenerate.removeClass("btn_disabled");
			btnGenerate.click(function() { editorController.generate(); });
		}
		
		// reset button
		btnReset.show();
	}
}
inheritsFrom(EditorActionsController, DivController);

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
 * 				config.isInline specifies if this is inline imported storage
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
	var moreButton;
	var moreButtonImg;
	var moreDropdownContent;
	var showPublicCheckbox;
	var showPrivateCheckbox;
	var showLogosCheckbox;
	var cryptoCashCheckbox;
	var cryptoCashCheckboxInfoImg;
	var cryptoCashBackCheckboxSpan;
	var cryptoCashBackCheckbox;
	var paginator;
	var piecesDiv;
	var piecesLabel;
	var lastRenderer;
	var regenerateDiv;
	var publicAvailable;
	var privateAvailable;
	var quickGenerate = isQuickGenerate();	// only show notice bar and keypair when completely done if quick generate
	var exportFiles = {};										// cached file blobs and names for saving
	var controlState;												// tracks enable/disable state of control elements
	
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
		div.addClass("export_div flex_vertical");
		
		// export header
		var exportHeader = $("<div class='export_header flex_vertical'>").appendTo(div);
		
		// export controls
		var exportControls = $("<div class='export_controls flex_vertical'>").appendTo(exportHeader);
		
		// export buttons
		var exportButtons = $("<div class='export_buttons flex_horizontal'>").appendTo(exportControls);
		saveButton = $("<div class='export_button'>").appendTo(exportButtons);
		saveButton.html("Save All");
		printButton = $("<div class='export_button'>").appendTo(exportButtons);
		printButton.html("Print All");
		savePublicButton = $("<div class='export_button'>").appendTo(exportButtons);
		savePublicButton.html("Save Public Addresses");
		
		// more dropdown
		var moreDropdown = $("<div class='dropdown'>").appendTo(exportButtons);
		moreButton = $("<div class='export_button dropbtn flex_vertical'>").appendTo(moreDropdown);
		moreButtonImg = $("<img src='img/share.png' class='export_more_img'>");
		moreButton.append(moreButtonImg);
		moreDropdownContent = $("<div id='dropdownContent' class='dropdown-content'>").appendTo(moreDropdown);
		var saveCsvBtn = $("<div class='export_button dropdown_export_button'>").appendTo(moreDropdownContent);
		saveCsvBtn.append("Export to CSV");
		saveCsvBtn.click(function() { saveCsv(); });
		var saveTxtBtn = $("<div class='export_button dropdown_export_button'>").appendTo(moreDropdownContent);
		saveTxtBtn.append("Export to TXT");
		saveTxtBtn.click(function() { saveTxt(); });
		window.onclick = function(event) { // close the dropdown if user clicks outside
		  if (!event.target.matches('.dropbtn') && !event.target.matches('.export_more_img')) {
		  	moreDropdownContent.removeClass('show');
		  }
		}
		
		// sort pieces and pieceDivs by piece number
		sortPieces();
		
		// get paginator source if split pieces
		var paginatorSource = getPaginatorSource(config.keyGenConfig, config.pieces);
		
		// export checkboxes
		var exportCheckboxes = $("<div class='export_checkboxes flex_horizontal'>").appendTo(exportControls);
		var exportCheckbox = getControlCheckbox("Include public addresses");
		exportCheckboxes.append(exportCheckbox[0]);
		showPublicCheckbox = exportCheckbox[1];
		exportCheckbox = getControlCheckbox("Include private keys");
		exportCheckboxes.append(exportCheckbox[0]);
		showPrivateCheckbox = exportCheckbox[1];
		exportCheckbox = getControlCheckbox("Include logos");
		exportCheckboxes.append(exportCheckbox[0]);
		showLogosCheckbox = exportCheckbox[1];
		exportCheckbox = getControlCheckbox("Crypto-cash", "Formats keypairs to be printed and cut out.  Perfect for tipping in real life.");
		exportCheckboxes.append(exportCheckbox[0]);
		cryptoCashCheckbox = exportCheckbox[1];
		cryptoCashCheckboxInfoImg = exportCheckbox[3];
		if (!isCryptoCashEnabled()) exportCheckbox[0].hide();
		exportCheckbox = getControlCheckbox("Instructions on back");
		exportCheckboxes.append(exportCheckbox[0]);
		cryptoCashBackCheckboxSpan = exportCheckbox[0];
		cryptoCashBackCheckbox = exportCheckbox[1];
		if (!isCryptoCashEnabled()) cryptoCashBackCheckboxSpan.hide();
		
		// creates a control checkbox with the given label
		function getControlCheckbox(label, info) {
			var span = $("<span class='export_checkbox_span flex_horizontal'>");
			var uuid = uuidv4();
			var checkbox = $("<input type='checkbox' class='export_checkbox' id='" + uuid + "'>").appendTo(span);
			var checkboxLabel = $("<label class='export_checkbox_label flex_horizontal' for='" + uuid + "'>").appendTo(span);
			checkboxLabel.append(label);
			
			// info tooltip
			var infoImg;
			if (info) {
				infoImg = $("<img src='img/information_white.png' class='information_img'>").appendTo(span);
				var tooltip = $("<div>");
				tooltip.append(info);
				tippy(infoImg.get(0), {
					arrow: true,
					html: tooltip.get(0),
					placement: 'bottom',
					theme: 'translucent',
					trigger: "mouseenter",
					multiple: 'false',
					maxWidth: UiUtils.INFO_TOOLTIP_MAX_WIDTH,
					distance: 20,
					arrowTransform: 'scaleX(1.25) scaleY(2.5) translateY(2px)',
					offset: '0, 0'
				});
			}
			
			return [span, checkbox, label, infoImg];
		}
		
		// determines if crypto-cash option is enabled
		function isCryptoCashEnabled() {
			if (paginatorSource) {
				return false;																													// disable if split
			} else if (config.pieces) {
				if (!isInitialized(config.pieces[0].keys[0].wif)) return false;				// disable if no private key
				return !isInitialized(config.pieces[0].keys[0].encryption);						// enable if unencrypted
			} else if (config.keys) {
				if (!config.keys[0].hasPrivateKey()) return false;										// disable if no private key
				return !config.keys[0].isEncrypted();																	// enable if unencrypted
			} else if (config.keyGenConfig) {
				return !isInitialized(config.keyGenConfig.currencies[0].encryption);	// enable if unencrypted
			} else {
				throw new Error("One of config.pieces, config.keys, or config.keyGenConfig required");
			}
		}
		
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
		cryptoCashCheckbox.prop('checked', false);
		cryptoCashBackCheckbox.prop('checked', true);
		
		// paginator
		if (paginatorSource) {
			paginator = $("<div id='paginator' class='flex_horizontal'>").appendTo(exportControls);
			$("#paginator", exportHeader).pagination({
				dataSource: paginatorSource,
				showPrevious: false,
				showNext: false,
				pageSize: 1,
				callback: function(data, pagination) {
					if (config.pieceDivs) setVisiblePiece(config.pieceDivs, pagination.pageNumber - 1);
				}
			});
			piecesLabel = $("<div class='export_piece_selection_label'>").appendTo(exportControls);
			piecesLabel.html("Piece");
		}
		
		// view split pieces
		if (config.splitPieces) {
			var viewImported = $("<div class='import_control_link'>").appendTo(exportControls);
			viewImported.html("view split pieces");
			viewImported.click(function() {
				UiUtils.openEditorTab("Imported Pieces", {pieces: config.splitPieces});
			});
		}
		
		// controls disabled until ready
		setControlsEnabled(false);
		
		// load export content controller
		new LoadController(new ExportContentController($("<div class='export_content_div flex_vertical'>").appendTo(div))).render(function() {
			if (onDone) onDone(div);
		});
	}
	
	// --------------------------------- PRIVATE --------------------------------
	
	/**
	 * Internal renderer for export content.
	 */
	function ExportContentController(div) {
		DivController.call(this, div);
		this.render = function(onDone) {
			
			// load export dependencies
			LOADER.load(AppUtils.getDynamicExportDependencies(), function(err) {
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
					
					// beta warning
					var betaDiv = $("<div class='beta_warning flex_horizontal'>").appendTo(div);
					betaDiv.append($("<img class='beta_icon' src='img/caution.png'>"));
					betaDiv.append("<span style='text-align:center;'>Beta Version: Do not use with significant amounts until community-reviewed.");
					
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
					cryptoCashCheckbox.click(function() { update(); });
					cryptoCashBackCheckbox.click(function() { update(); });
					
					// done rendering if not quick generate
					if (onDone && !quickGenerate) onDone(div);
					
					// build ui based on keyGenConfig, pieces, and pieceDivs
					update(config.pieceDivs, function() {
						
						// regenerate button
						if (config.showRegenerate) {
							regenerateDiv = $("<div class='export_regenerate_div'>").appendTo(div);
							btnRegenerate = $("<div class='dark_green_btn flex_horizontal'>").appendTo(regenerateDiv);
							btnRegenerate.append("Regenerate");
							var refreshImg = $("<img src='img/refresh.png' class='refresh_img rotate2'>").appendTo(btnRegenerate);
							btnRegenerate.click(function() {
								if (confirm("Discard keypair and create a new one?")) {
									
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
			showLogos: showLogosCheckbox.prop('checked'),
			spaceBetween: cryptoCashCheckbox.prop('checked'),
			infoBack: cryptoCashBackCheckbox.prop('checked')
		};
	}
	
	/**
	 * Caches file content and names for saving.
	 * 
	 * @param pieces are the pieces to transform and save per the configuration
	 * @param onDone() is invoked when ready
	 */
	function prepareExportFiles(pieces, onDone) {
		assertInitialized(pieces);
		assertTrue(pieces.length > 0);
		
		// transform pieces according to export config
		var transformedPieces = [];
		var config = getExportConfig();
		for (var i = 0; i < pieces.length; i++) {
			transformedPieces.push(AppUtils.transformPiece(pieces[i], config));
		}
		
		// generate exports
		var name = "cryptostorage_" + AppUtils.getCommonTicker(pieces[0]).toLowerCase() + "_" + AppUtils.getTimestamp();
		if (pieces.length === 1) {
			exportFiles.saveAllBlob = new Blob([AppUtils.pieceToJson(transformedPieces[0])], {type: "text/plain;charset=utf-8"});
			exportFiles.saveAllName = name + ".json";
			exportFiles.csvBlob = new Blob([AppUtils.pieceToCsv(transformedPieces[0])], {type: "text/plain;charset=utf-8"});
			exportFiles.csvName = name + ".csv";
			exportFiles.txtBlob = new Blob([AppUtils.pieceToTxt(transformedPieces[0])], {type: "text/plain;charset=utf-8"});
			exportFiles.txtName = name + ".txt";
			onDone();
		} else {
			
			// json zip
			AppUtils.piecesToZip(transformedPieces, "json", function(blob) {
				exportFiles.saveAllBlob = blob;
				exportFiles.saveAllName = name + ".zip";
				
				// csv zip
				AppUtils.piecesToZip(transformedPieces, "csv", function(blob) {
					exportFiles.csvBlob = blob;
					exportFiles.csvName = name + "_csv.zip";
					
					// txt zip
					AppUtils.piecesToZip(transformedPieces, "txt", function(blob) {
						exportFiles.txtBlob = blob;
						exportFiles.txtName = name + "_txt.zip";
						onDone();
					});
				});
			});
		}
	}
	
	/**
	 * Save all.
	 */
	function saveAll() {
		if (!controlState.saveAll) return;
		if (getExportConfig().showPrivate || confirm("Funds CANNOT be recovered from this saved file because the private keys are not included.\n\nContinue?")) {
			saved = true;
			saveAs(exportFiles.saveAllBlob, exportFiles.saveAllName);
		}
	}
	
	/**
	 * Print all.
	 */
	function printAll() {
		if (!controlState.printAll) return;
		if (getExportConfig().showPrivate || confirm("Funds CANNOT be recovered from this printed document because the private keys are not included.\n\nContinue?")) {
			saved = true;
			window.print();
		}
	}
	
	/**
	 * Save all public addresses.
	 */
	function savePublicAddresses() {
		if (!controlState.savePublic) return;
		assertInitialized(config.pieces);
		assertTrue(config.pieces.length > 0);
		var publicAddressesStr = AppUtils.pieceToAddresses(config.pieces[0]);
		saveAs(new Blob([publicAddressesStr], {type: "text/plain;charset=utf-8"}), "cryptostorage_" + AppUtils.getCommonTicker(config.pieces[0]).toLowerCase() + "_public_addresses.txt");
	}
	
	/**
	 * Save CSV.
	 */
	function saveCsv() {
		if (!controlState.more) return;
		if (getExportConfig().showPrivate || confirm("Funds CANNOT be recovered from this saved file because the private keys are not included.\n\nContinue?")) {
			saved = true;
			saveAs(exportFiles.csvBlob, exportFiles.csvName);
		}
	}
	
	/**
	 * Save TXT.
	 */
	function saveTxt() {
		if (!controlState.more) return;
		if (getExportConfig().showPrivate || confirm("Funds CANNOT be recovered from this saved file because the private keys are not included.\n\nContinue?")) {
			saved = true;
			saveAs(exportFiles.txtBlob, exportFiles.txtName);
		}
	}
	
	/**
	 * Returns a control state that is completely enabled/disabled depending on the given boolean.
	 * 
	 * @param bool specifies if all states are enabled or disabled
	 */
	function getControlState(bool) {
		return {
			saveAll: bool,
			printAll: bool,
			savePublic: bool,
			more: bool,
			checkboxes: bool,
			paginator: bool
		};
	}
	
	/**
	 * Updates the control elements to be enabled/disabled.
	 * 
	 * @param state can be a boolean or object specifying which elements to enable/disable
	 */
	function setControlsEnabled(state) {
		
		// set all states if boolean
		if (isBoolean(state)) {
			state = getControlState(state);
			controlState = state;			
		}
		
		// otherwise merge states
		else {
			controlState = Object.assign(controlState, state);
		}
		
		// save all button
		if (isInitialized(state.saveAll)) {
			saveButton.unbind("click");
			if (state.saveAll) {
				saveButton.addClass("export_button");
				saveButton.removeClass("export_button_disabled");
				saveButton.click(function() { saveAll(); });
			} else {
				saveButton.addClass("export_button_disabled");
				saveButton.removeClass("export_button");
			}
		}
		
		// print all button
		if (isInitialized(state.printAll)) {
			printButton.unbind("click");
			if (state.printAll) {
				printButton.addClass("export_button");
				printButton.removeClass("export_button_disabled");
				printButton.click(function() { printAll(); });
			} else {
				printButton.addClass("export_button_disabled");
				printButton.removeClass("export_button");
			}
		}
		
		// save public button
		if (isInitialized(state.savePublic)) {
			savePublicButton.unbind("click");
			if (state.savePublic && publicAvailable) {
				savePublicButton.addClass("export_button");
				savePublicButton.removeClass("export_button_disabled");
				savePublicButton.click(function() { savePublicAddresses(); });
			} else {
				savePublicButton.addClass("export_button_disabled");
				savePublicButton.removeClass("export_button");
			}
		}
		
		// more button
		if (isInitialized(state.more)) {
			moreButton.unbind("click");
			if (state.more) {
				moreButton.addClass("export_button dropbtn");
				moreButton.removeClass("export_button_disabled");
				moreButton.click(function(e) { moreDropdownContent.toggleClass("show"); });
				moreButtonImg.removeClass('export_more_img_disabled');
			} else {
				moreButton.addClass("export_button_disabled dropbtn");
				moreButton.removeClass("export_button");
				moreButtonImg.addClass('export_more_img_disabled');
			}
		}
		
		// paginator
		if (isInitialized(state.paginator)) {
			if (paginator) {
				if (state.paginator) {
					paginator.pagination("enable");
					piecesLabel.removeClass("disabled");
				} else {
					paginator.pagination("disable");
					piecesLabel.addClass("disabled");
				}
			}
		}
		
		// checkboxes
		if (isInitialized(state.checkboxes)) {
			if (state.checkboxes) {
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
				cryptoCashCheckbox.removeAttr('disabled');
				cryptoCashCheckboxInfoImg.css("opacity", "1");		// manually set info opacity
				if (cryptoCashCheckbox.prop('checked')) {
					cryptoCashBackCheckboxSpan.show();
				} else {
					cryptoCashBackCheckboxSpan.hide();
				}
			} else {
				showPublicCheckbox.attr('disabled', 'disabled');
				showPrivateCheckbox.attr('disabled', 'disabled');
				showLogosCheckbox.attr('disabled', 'disabled');
				cryptoCashCheckbox.attr('disabled', 'disabled');
				cryptoCashCheckboxInfoImg.css("opacity", ".5");	// manually set info opacity
				cryptoCashBackCheckboxSpan.hide();
			}
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
		setControlsEnabled({checkboxes: controlState.checkboxes});	// update control checkboxes
		config.pieceDivs = _pieceDivs;
		
		// add piece divs if given
		if (config.pieceDivs) {
			assertInitialized(config.pieces);
			//setVisiblePiece(config.pieceDivs, paginator ? paginator.pagination('getSelectedPageNum') - 1 : 0);
			setPieceDivs(config.pieceDivs);
			makePieceDivsCopyable(config.pieceDivs);
			prepareExportFiles(config.pieces, function() {
				setControlsEnabled(true);
				if (onDone) onDone();
			});
		}
		
		// else render from config.pieces
		else {
			config.pieceDivs = [];
			
			// render pieces if given
			if (config.pieces) {
				for (var i = 0; i < config.pieces.length; i++) config.pieceDivs.push($("<div>"));
				//setVisiblePiece(config.pieceDivs, paginator ? paginator.pagination('getSelectedPageNum') - 1 : 0);
				setPieceDivs(config.pieceDivs);
				var state = getControlState(true);
				state.printAll = false;
				state.paginator = false;
				setControlsEnabled(state);
				prepareExportFiles(config.pieces, function() {
					if (lastRenderer) lastRenderer.cancel();
					lastRenderer = new IndustrialPieceRenderer(config.pieces, config.pieceDivs, getExportConfig());
					lastRenderer.render(null, function(err, pieceDivs) {
						update(config.pieceDivs, onDone);
					});
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
				config.keyGenConfig.renderConfig = getExportConfig();	// render configuration
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
				IndustrialPieceRenderer.makeCopyable(pieceDivs[i]);
			}
		}
	}
	
	function setPieceDivs(pieceDivs) {
		piecesDiv.empty();
		for (var i = 0; i < pieceDivs.length; i++) {
			pieceDivs[i].attr("id", "export_piece_" + (i + 1));
			piecesDiv.append(pieceDivs[i]);
		}
	}
	
	/**
	 * Sets the visible piece by adding/removing the hidden class.
	 * 
	 * @param pieceDivs are the piece divs to show/hide
	 * @param pieceIdx is the piece number to show
	 */
	function setVisiblePiece(pieceDivs, pieceIdx) {
		window.location.hash = "";
		window.location.hash = "export_piece_" + (pieceIdx + 1);	
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
		assertNumber(keyGenConfig.numPieces);
		assertTrue(keyGenConfig.numPieces >= 1);
		numPairs *= keyGenConfig.numPieces;
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
		config = Object.assign({}, getDefaultConfig(), config);
		
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
				maxWidth: UiUtils.NOTICE_TOOLTIP_MAX_WIDTH,
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
						content.append("<div class='notice_bar_center_minor'>Recommended browsers: " + UiUtils.FIREFOX_LINK + " or " + UiUtils.CHROMIUM_LINK + "</div>");
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
						content.append("<div class='notice_bar_center_minor'>Internet is required because this tool is not running locally.  <a href='https://github.com/cryptostorage/cryptostorage.com/archive/master.zip'>Download from GitHub</a></div>");
					}
					break;
				case AppUtils.EnvironmentCode.IS_LOCAL:
					if (check.state === "pass") div.append("<div class='notice_bar_center_major'>Tool is running locally</div>");
					else {
						var content = $("<div>").appendTo(div);
						content.append("<div class='notice_bar_center_major'>Tool is not running locally</div>");
						content.append("<div class='notice_bar_center_minor'><a href='https://github.com/cryptostorage/cryptostorage.com/archive/master.zip'>Download from GitHub</a></div>");
					}
					break;
				case AppUtils.EnvironmentCode.OPERATING_SYSTEM:
					if (check.state === "pass") div.append("Operating system is open source (" + info.os.name + ")");
					else {
						var content = $("<div>").appendTo(div);
						content.append("<div class='notice_bar_center_major'>Operating system is not open source (" + info.os.name + ")</div>");
						content.append("<div class='notice_bar_center_minor'>Recommended operating systems: " + UiUtils.TAILS_LINK + ", " + UiUtils.DEBIAN_LINK + ", or " + UiUtils.RASPBIAN_LINK + ".</li>");
					}
					break;
				case AppUtils.EnvironmentCode.DEV_MODE:
					if (check.state === "warn") div.append("Tool is under development and should not be trusted with sigificant amounts");
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