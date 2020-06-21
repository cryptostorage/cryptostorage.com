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
		
	// UI constants
	FIREFOX_LINK: "<a target='_blank' href='https://www.mozilla.org/en-US/firefox/'>Firefox</a>",
	CHROMIUM_LINK: "<a target='_blank' href='https://www.chromium.org/getting-involved/download-chromium'>Chromium</a>",
	TAILS_LINK: "<a target='_blank' href='https://tails.boum.org'>Tails</a>",
	DEBIAN_LINK: " <a target='_blank' href='https://www.debian.org/'>Debian</a>",
	RASPBIAN_LINK: "<a target='_blank' href='https://www.raspberrypi.org'>Raspbian for the Raspberry Pi</a>",
	SHAMIR_LINK: "<a target='_blank' href='https://en.wikipedia.org/wiki/Shamir%27s_Secret_Sharing'>Shamir's Secret Sharing</a>",
	INFO_TOOLTIP_MAX_WIDTH: "700px",
	NOTICE_TOOLTIP_MAX_WIDTH: "700px",
  
	/**
	 * Gets a description for dividing into parts.
	 * 
	 * @param faqNewTab whether or not to open faq hyperlink in new tab
	 */
  getDivideDescription: function(faqNewTab) {
    return "<p>This tool uses " + UiUtils.SHAMIR_LINK + " to divide <a " + (faqNewTab ? "target='_blank' " : "") + "href='index.html#faq_keypair'>private keys</a> into parts that can be stored at different physical locations such as a safe, a lockbox, or with a trusted friend or family member.  The private keys cannot be accessed from the parts until a sufficient number of parts are combined.</p>" +
    "<p>For example, Alice wants to save Bitcoin Cash for her 6 grandchildren.  She generates 6 keypairs, one for each grandchild, and divides the 6 keypairs into 3 parts where 2 parts are required to recover the private keys.  She keeps one part, puts one in a bank, and gives one to a trusted family member.  Funds may not be accessed from the 6 keypairs until 2 of the 3 parts are combined.</p>" +
    "<p><a " + (faqNewTab ? "target='_blank' " : "") + "href='index.html#faq_divide'>How are keypairs divided?</a></p>";
	},
	
	/**
	 * Renders a progress bar to the given div.
	 * 
	 * @param div is the div to render to
	 * @param color is the progress bar color (optional)
	 * @returns a progress bar instance
	 */
	getProgressBar: function(div, color) {
		return new ProgressBar.Line(div.get(0), {
			strokeWidth: 2.5,
			color: color ? color : 'rgb(132, 201, 223)',
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
	 * Returns a rendered div with instructions to sweep the given ticker.
	 */
	getSweepInstructionsDiv: function(ticker) {
		assertInitialized(ticker);
		var div = $("<div>");
		div.addClass("keypair_div keypair_div_spaced flex_horizontal flex_align_center");
		
		// instructions
		var instructionsDiv = $("<div class='cryptocash_instructions'>").appendTo(div);
		instructionsDiv.append("<b>To claim funds:</b>");
		var instructionsList = $("<ol>").appendTo(instructionsDiv);
		if (ticker === "BCH" || ticker === "BTC") {
			instructionsList.append("<li><b>Download</b> wallet software of your choice (e.g. Bitcoin.com wallet).</li>");
			instructionsList.append("<li><b>Sweep</b> the private key on the reverse side using your wallet.<br>Bitcoin.com wallet: Scan QR code > Sweep paper wallet > Sweep</li>");
			instructionsList.append("<li><b>All done.</b> Funds are now claimed and accessible in your wallet.</li>");
		} else {
			instructionsList.append("<li><b>Download</b> wallet software of your choice (e.g. Jaxx).</li>");
			instructionsList.append("<li><b>Sweep</b> the private key on the reverse side using your wallet.<br>Jaxx: Menu > Tools > Transfer paper wallet > follow on-screen instructions</li>");
			instructionsList.append("<li><b>All done.</b> Funds are now claimed and accessible in your wallet.</li>");
		}
		
		// branding
		var brandingDiv = $("<div class='cryptocash_branding flex_vertical flex_align_center'>").appendTo(div);
		brandingDiv.append("<span><i>Generated by</i></span>");
		brandingDiv.append($("<img class='cryptocash_branding_logo' src='img/cryptostorage_export.png'>"));
		brandingDiv.append("<span style='font-size: 15px;'>https://cryptostorage.com</span>");
		return div;
	},
	
	/**
	 * Gets a copy of the given pieces which are sorted and assigns a piece number if not given.
	 * 
	 * @param pieces are the pieces to copy and prepare for export
	 */
	getPiecesForExport: function(pieces) {
		
		// copy pieces
		var copies = [];
		for (var i = 0; i < pieces.length; i++) {
			copies.push(pieces[i].copy());
		}
		
		// assign piece numbers
		for (var i = 0; i < copies.length; i++) {
			if (copies[i].isDivided() && !copies[i].getPartNum()) {
				copies[i].setPartNum(getNextAvailablepartNum(copies));
			}
		}
		
		// sort
		copies.sort(function(piece1, piece2) {
			var num1 = piece1.getPartNum();
			var num2 = piece2.getPartNum();
			assertNumber(num1);
			assertNumber(num2);
			return num1 - num2;
		});
		
		return(copies);
		
		function getNextAvailablepartNum(pieces) {
			var partNum = 1;
			while (true) {
				var found = false;
				for (var i = 0; i < pieces.length; i++) {
					if (pieces[i].getPartNum() === partNum) {
						found = true;
						break;
					} 
				}
				if (!found) return partNum;
				partNum++;
			}
		}
	},
	
	/**
	 * Opens the editor as a dynamically generated window.
	 * 
	 * @param browserTabName is the name of the tab
	 * @param config specifies editor configuration
	 * 				config.genConfig is configuration to generate keypairs
	 * 				config.pieces are pre-generated pieces
	 * 				config.pieceDivs are pre-rendered pieces to display
	 * 				config.sourcePieces are source pieces that the given piece was generated from
	 * 				config.showNotices specifies whether or not to show the notice bar
	 */
	openEditorDynamic: function(browserTabName, config) {
		
		// open window
		var content = {
		  title: browserTabName,
		  dependencyPaths: AppUtils.getInitialEditorDependencies(),
		  internalCss: getInternalStyleSheetText(),
		  metas: {name: "viewport", content: "width=900px, user-scalable=no"},
		}
		newWindow(content, function(err, window) {
			
			// check for error
			if (err) {
				AppUtils.setOpenWindowError(true);
				return;
			}
			
			// initialize tab
			config = Object.assign({}, config);
			config.environmentInfo = AppUtils.getCachedEnvironment();
		  window.initEditor(window, config);
			window.focus();
		});
	},
	
	/**
	 * Opens the editor as a static html window.

	 * @param tickers is a csv of tickers to initially generate
	 */
	openEditorStatic: function(tickers) {
		var tickerParam = "";
		if (tickers) {
			tickers = listify(tickers);
			if (tickers.length) tickerParam = "?" + AppUtils.TICKERS_PARAM + "=" + tickers.join(",").toLowerCase()
		}
		
		// open window and check for errors
		if (window) {
			var w = window.open("generate.html" + tickerParam);
			if (!w) AppUtils.setOpenWindowError(true);
		} else {
			AppUtils.setOpenWindowError(true);
		}
	},
	
	// default QR configuration
	DefaultQrConfig: {
		version: null,
		errorCorrectionLevel: 'Q',
		margin: 0,
		scale: null
	},
	
	/**
	 * Renders a QR code to an image.
	 * 
	 * @param text is the text to codify
	 * @param config specifies configuration options
	 * @param callback will be called with the image node after creation
	 */
	renderQrCode: function(text, config, callback) {
		
		// merge configs
		config = Object.assign({}, UiUtils.DefaultQrConfig, config);

		// generate QR code
		var segments = [{data: text, mode: 'byte'}];	// manually specify mode
		qrcodelib.toDataURL(segments, config, function(err, url) {
			if (err) throw err;
			var img = $("<img>");
			if (config.size) img.css("width", config.size + "px");
			if (config.size) img.css("height", config.size + "px");
			img[0].onload = function() {
				img[0].onload = null;	// prevent re-loading
				callback(img);
			}
			img[0].src = url;
		});
	},
	
	/**
	 * Makes all divs within the given divs and with class 'copyable' copyable (clipboard and tooltip).
	 * 
	 * @param divs is a div or divs to find copyable classes within
	 */
	makeCopyable: function(divs) {
	  divs = listify(divs);
	  assertTrue(divs.length > 0);
	  for (var i = 0; i < divs.length; i++) {
	    var div = divs[i];
	    
	    // find copyable divs as NodeList
	    var copyables = div.get(0).querySelectorAll(".copyable");
	    
	    // copy to clipboard on click
	    new Clipboard(copyables, {
	      text: function(trigger) {
	        return $(trigger).html();
	      }
	    });
	    
	    // add styling and tooltips
	    for (var i = 0; i < copyables.length; i++) addTooltip(copyables[i]);	      
	    function addTooltip(copyable) {
	      $(copyable).addClass("copyable_init");
	      tippy(copyable, {
	        arrow : true,
	        html : $("<div>Copied!</div>").get(0),
	        interactive : true,
	        placement : "top",
	        theme : 'translucent',
	        trigger : "click",
	        distance : 10,
	        arrowTransform: 'scaleX(1.25) scaleY(1.5) translateY(1px)',
	        onShow : function() {
	          setTimeout(function() {
	            copyable._tippy.hide();
	          }, 2500)
	        }
	      });
	    }
	  }
	},
	
	/**
	 * Returns an absolutely positioned div attached to the body for attaching rendering scratchpads
	 * to in order to measure heights.
	 * 
	 * The returned div should not be rendered to or moved, only attached to.
	 * 
	 * @returns the visible parent to attach rendering scratchpads to
	 */
	getDefaultScratchpadParent: function() {
	  if (UiUtils.SCRATCHPAD_PARENT) return UiUtils.SCRATCHPAD_PARENT;
	  UiUtils.SCRATCHPAD_PARENT = $("<div style='position:absolute; top:0; left:0; z-index:-1'>").appendTo("body");
	  return UiUtils.SCRATCHPAD_PARENT;
	}
}

/**
 * Base class to render and control a div.
 */
function DivController(div) {
	this.div = div;
}
DivController.prototype.getDiv = function() { return this.div; }
DivController.prototype.render = function(onDone) { throw new Error("Subclass must implement"); }
DivController.prototype.show = function() { this.div.show(); }
DivController.prototype.hide = function() { this.div.hide(); }
DivController.prototype.setVisible = function(bool) { assertBoolean(bool); bool ? this.div.show() : this.div.hide(); }
DivController.prototype.isVisible = function() { return this.div.is(":visible"); }

/**
 * Displays an overlay atop a div.
 * 
 * @param div is the div to overlay
 * @param config specifies overlay configuraiton
 * 				config.contentDiv is centered on the overlay to achieve a popup if given
 * 				config.fullScreen specifies if the overlay is full screen (default false)
 *				config.backgroundColor specifies the opacity of the overlay div
 *				config.hideOnExternalClick specifies if the overlay should be hidden on external click (default false)
 */
function OverlayController(div, config) {
	DivController.call(this, div);
	assertDefined(div);
	
	// default config
	config = Object.assign({
		fullScreen: false,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		hideOnExternalClick: false
		
	}, config);
	
	// instance variables
	var that = this;
	var overlayDiv;
	var originalOverflow = div.css("overflow") ? div.css("overflow") : "auto";
	var originalPosition = div.css("position") ? div.css("position") : "static";
	var hideListeners = [];
	var showListeners = [];
	
	this.render = function(onDone) {
		
		// full div overlay
		overlayDiv = $("<div class='overlay_div flex_horizontal flex_align_center flex_justify_center'>");
		if (config.fullScreen) overlayDiv.css("position", "fixed");
		else div.css("position", "relative");
		overlayDiv.css("background-color", config.backgroundColor);
		overlayDiv.appendTo(div);
		if (config.contentDiv) overlayDiv.append(config.contentDiv);
		overlayDiv.click(function(e) {
			if (e.target !== this) return;
			if (config.hideOnExternalClick) that.hide();
		});
		
		// show overlay
		that.show();
		
		// done rendering
		if (onDone) onDone();
	}
	
	this.onHide = function(listener) {
		assertFunction(listener);
		hideListeners.push(listener);
	}
	
	this.onShow = function(listener) {
		assertFunction(listener);
		showListeners.push(listener);
	}
	
	this.hide = function() {
		div.css("overflow", originalOverflow);
		div.css("position", originalPosition);
		overlayDiv.hide();
		invoke(hideListeners);
	}
	
	this.show = function() {
		overlayDiv.show();
		div.css("overflow", "hidden");
		invoke(showListeners);
	}
	
	this.destroy = function() {
		if (overlayDiv) overlayDiv.remove();
		div.css("overflow", originalOverflow);
		div.css("position", originalPosition);
	}
}
inheritsFrom(OverlayController, DivController);

/**
 * Controls a checkbox or radio input.
 * 
 * @param div is the div to render to
 * @param type specifies 'checkbox' or 'radio'
 * @param label is the input label
 * @param tooltip is a tooltip to display with the input (optional)
 * @param name is the name attribute to include with the input for radio grouping
 */
function InputLabelController(div, type, label, tooltip, name) {
	
	DivController.call(this, div);
	type = type ? type : "checkbox";
	assertTrue(type === "checkbox" || type === "radio", "Type must be checkbox || radio but was " + type);
	
	var that = this;
	var input;
	var infoImg;
	var lastChecked;
	var checkedListeners = [];
	var enabledListeners = [];
	
	this.render = function(onDone) {

		// div setup
		div.empty();
		div.addClass("flex_horizontal flex_align_center");
		
		// build div
		var id = uuidv4();
		input = $("<input type='" + type + "' id='" + id + "'>").appendTo(div);
		if (name) input.attr("name", name);
		var inputLabel = $("<label class='input_label user_select_none' for='" + id + "'>").appendTo(div);
		inputLabel.html(label);
		
		// info tooltip
		if (tooltip) {
			infoImg = $("<img src='img/information_white.png' class='info_tooltip_img'>").appendTo(div);
			var tooltipDiv = $("<div>");
			tooltipDiv.append(tooltip);
			tippy(infoImg.get(0), {
				arrow: true,
				html: tooltipDiv.get(0),
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
		}
		
		// register click listener
		input.click(function(e) { invoke(checkedListeners, e, that.isChecked()); });
		
		// done
		if (onDone) onDone(div);
		return that;
	}
	
	this.getInput = function() {
		return input;
	}
	
	/**
	 * Registers a listener for when input is checked.
	 * 
	 * @param listener(event, isChecked) is invoked when input is checked
	 */
	this.onChecked = function(listener) {
		assertFunction(listener);
		checkedListeners.push(listener);
	}
	
	this.setChecked = function(bool) {
		assertBoolean(bool);
		if (bool === that.isChecked()) return;
		input.prop("checked", bool);
		invoke(checkedListeners);
	}
	
	this.isChecked = function() {
		return input.prop("checked");
	}
	
	this.onEnabled = function(listener) {
		assertFunction(listener);
		enabledListeners.push(listener);
	}
	
	this.setEnabled = function(bool) {
		assertBoolean(bool);
		if (bool === that.isEnabled()) return;
		if (bool) {
			input.removeAttr("disabled");
//			if (infoImg) {
//				infoImg.removeClass("info_tooltip_img_disabled");
//				infoImg.get(0)._tippy.enable();
//			}
		} else {
			input.attr("disabled", "disabled");
//			if (infoImg) {
//				infoImg.addClass("info_tooltip_img_disabled");
//				infoImg.get(0)._tippy.disable();
//			}
		}
		invoke(enabledListeners);
	}
	
	this.isEnabled = function() {
		return !isInitialized(input.attr("disabled"));
	}
	
	this.setVisible = function(bool) {
		bool ? div.show() : div.hide();
	}
}

/**
 * Controls a single checkbox.
 * 
 * @param div is the div to render to
 * @param label is the checkbox label
 * @param tooltip is the tooltip text (optional)
 */
function CheckboxController(div, label, tooltip) {
	InputLabelController.call(this, div, "checkbox", label, tooltip);
}
inheritsFrom(CheckboxController, InputLabelController);

/**
 * Controls a single radio input.
 * 
 * @parm div is the div to render to
 * @param name specifies the radio group name
 * @param label is the radio label
 * @param tooltip is the tooltip text (optional)
 */
function RadioController(div, name, label, tooltip) {
	InputLabelController.call(this, div, "radio", label, tooltip, name);
}
inheritsFrom(RadioController, InputLabelController);

/**
 * Controls a dropdown selector.
 * 
 * @param div is the div to render to
 * @param ddslickConfig is config to pass to ddslick
 * @param defaultText is the default dropdown selection, selects index 0 if not given
 */
function DropdownController(div, ddslickConfig, defaultText) {
	DivController.call(this, div);
	
	var that = this;
	var selectorContainer;
	var selector;
	var selectorId;
	var selectorDisabler;
	var onSelectedFn;
	var currentIndex;

	this.render = function(onDone) {
		
		// verify config
		assertObject(ddslickConfig);
		assertArray(ddslickConfig.data);
		assertTrue(ddslickConfig.data.length > 0);
		for (var i = 0; i < ddslickConfig.data.length; i++) {
			assertInitialized(ddslickConfig.data[i].text);
		}
		
		// customize config
		var defaultConfig = {
				background: "white",
				imagePosition: "left",
				width:'100%',
		}
		ddslickConfig = Object.assign(defaultConfig, ddslickConfig);
		ddslickConfig.onSelected = function(selection) {
			currentIndex = selection.selectedIndex;
			if (onSelectedFn) onSelectedFn(currentIndex);
		}
		if (defaultText) {
			ddslickConfig.selectText = defaultText;
			ddslickConfig.defaultSelectedIndex = null;
		}
		
		// div setup
		div.empty();
		selectorContainer = $("<div class='ddslick_container'>").appendTo(div);
		
		// initialize selector
		selectorId = uuidv4();
		selector = $("<div id='" + selectorId + "' class='ddslick_selector'>").appendTo(selectorContainer);
		
		// initialize disabler		
		selectorDisabler = $("<div class='ddslick_disabler'>").appendTo(selectorContainer);
		
		// initial state
		that.reset();
		
		// done
		if (onDone) onDone(div);
		return that;
	}
	
	this.reset = function() {
		selector.ddslick("destroy");
		selector = $("#" + selectorId, div);	// ddslick requires id reference
		selector.ddslick(ddslickConfig);
		selector = $("#" + selectorId, div);	// ddslick requires reference to be reassigned
		if (defaultText) currentIndex = -1;
		else that.setSelectedIndex(0);
		that.setEnabled(true);
	}
	
	this.getSelectedText = function() {
		return ddslickConfig.data[currentIndex].text;
	}
	
	this.getSelectedIndex = function() {
		return currentIndex;
	}
	
	this.setSelectedIndex = function(index) {
		assertNumber(index);
		assertTrue(index >= 0);
		assertTrue(index < ddslickConfig.data.length);
		selector.ddslick("select", {index: index});
		currentIndex = index;
	}
	
	this.getSelectorData = function() {
		return ddslickConfig.data;
	}
	
	this.setEnabled = function(bool) {
		if (bool) {
			$("*", selector).removeClass("disabled_text");
			selectorDisabler.hide();
		} else {
			$("*", selector).addClass("disabled_text");
			selectorDisabler.show();
		}
	}
	
	this.onSelected = function(_onSelectedFn) {
		onSelectedFn = _onSelectedFn;
	}
}
inheritsFrom(DropdownController, DivController);

/**
 * Controls a paginator.
 * 
 * @param div is the div to render to
 * @param labels are the clickable labels in the paginator
 * @param config is custom config for pagination.js
 */
function PaginatorController(div, labels, config) {
	DivController.call(div, this);
	
	var uuid;
	var paginator;
	var clickListeners;
	
	this.render = function(onDone) {
		
		// init
		div.empty();
		uuid = uuidv4();
		div.attr("id", uuid);
		div.addClass("flex_horizontal");
		clickListeners = [];
		assertArray(labels);
		assertTrue(labels.length > 0);
		for (var i = 0; i < labels.length; i++) assertDefined(labels[i]);
		
		// build pagination config with defaults
		config = Object.assign({
			showPrevious: false,
			showNext: false,
			pageSize: 1,
			dataSource: labels,
			callback: function(data, pagination) { invoke(clickListeners, pagination.pageNumber - 1, data); }
		}, config);
		
		// initialize paginator
		div.pagination(config);
		
		// done
		if (onDone) onDone(div);
	}
	
	this.setEnabled = function(bool) {
		assertBoolean(bool);
		if (bool) div.pagination("enable");
		else div.pagination("disable");
	}
	
	/**
	 * Registers a callback function that is notified when a label is clicked.
	 * 
	 * @param lister(label, labelIndex) is invoked when the user clicks a label
	 */
	this.onClick = function(listener) {
		assertFunction(listener);
		clickListeners.push(listener);
	}
}
inheritsFrom(PaginatorController, DivController);

/**
 * Controls the entire application.
 * 
 * @param div is the div to render the application to
 * @param hash is an initial window hash (e.g. #faq)
 */
function AppController(div, hash) {
  
  // redirect to index.html#hash
  if (hash) {
    window.location.href = "index.html" + hash;
    return;
  }
	
	var that = this;
	var showFuncs;
	var introDiv;
	var introController;
	var contentDiv;
	var homeLoader;
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
		$('html,body').scrollTop(0);
	}
	
	this.render = function(onDone) {
		
		// header
		div.empty();
		var headerDiv = $("<div class='app_header'>").appendTo(div);
		
		// header logo
		var headerTopDiv = $("<div class='app_header_top'>").appendTo(headerDiv);
		var logo = $("<a href='#home' title='Go Home'><img class='app_header_logo_img' src='img/cryptostorage_white.png' alt='CryptoStorage logo white'></a>").appendTo(headerTopDiv);
		
		// header links
		var linksDiv = $("<div class='app_header_links_div'>").appendTo(headerTopDiv);
		var homeLink = $("<a class='link_div' href='index.html#home' title='Go Home'>Home</a>");
		var gitHubLink = $("<a target='_blank' class='link_div' href='https://github.com/cryptostorage/cryptostorage.com' title='View source code'>GitHub</a>");
		var faqLink = $("<a class='link_div' href='index.html#faq' title='Go to FAQ'>FAQ</a>");
		var donateLink = $("<a class='link_div' href='index.html#donate' title='Go to Donate'>Donate</a>");
		linksDiv.append(homeLink);
		linksDiv.append(gitHubLink);
		linksDiv.append(faqLink);
		linksDiv.append(donateLink);
		
		// validate version
		AppUtils.getVersionNumbers(AppUtils.VERSION);
		
		// slider has to be attached to the DOM and shown to work, so it's a special case and not part of HomeController
		introDiv = $("<div class='intro_div'>").hide();
		introDiv.appendTo(headerDiv);
		introController = new IntroController(introDiv);
		
		// main content
		contentDiv = $("<div class='app_content'>").appendTo(div);
		
		// initialize controllers
		homeLoader = new LoadController(new HomeController($("<div>")));
		importLoader = new LoadController(new ImportController($("<div>")));
		faqLoader = new LoadController(new FaqController($("<div>")), {enableScroll: true});
		donateLoader = new LoadController(new DonateController($("<div>")), {enableScroll: true});
		
		// map pages to show functions
		showFuncs = {
				"home": that.showHome,
				"import": that.showImport,
				"faq": that.showFaq,
				"donate": that.showDonate
		}
		
		// navigate on browser navigation
		if (getIEVersion()) {
	    $(window).on("hashchange", function(e) {
	      navigate(window.location.hash);
	    });
		} else {
	    $(window).on('popstate', function(e) {
	      navigate(window.location.hash);
	    });
		}
		
		// navigate to first page
		navigate(hash ? hash : window.location.hash, function() {
			
			// load notice dependencies and start polling
			LOADER.load(AppUtils.getNoticeDependencies(), function(err) {
				if (err) throw err;
				AppUtils.pollEnvironment(AppUtils.getEnvironmentSync());
				
				// load remaining app dependencies in the background
				LOADER.load(AppUtils.getAppDependencies(), function(err) {
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
			importLoader.getRenderer().startOver();
		});
	}
	
	this.showDonate = function(onDone) {
		if (AppUtils.DEV_MODE) console.log("showDonate()");
		currentPage = "donate";
		donateLoader.render(onDone, function() {
			introDiv.hide();
			setContentDiv(donateLoader.getDiv());
			importLoader.getRenderer().startOver();
		});
	}
	
	this.showImport = function(onDone) {
		if (AppUtils.DEV_MODE) console.log("showImport()");
		currentPage = "import";
		importLoader.render(onDone, function() {
			introDiv.hide();
			setContentDiv(importLoader.getDiv());
		});
	}
	
	// ---------------------------------- PRIVATE -------------------------------
	
	function setContentDiv(div) {
		contentDiv.prepend(div);
		while (contentDiv.children().length > 1) contentDiv.children().last().detach();
	}
}
inheritsFrom(AppController, DivController);

/**
 * Intro with slider and call to action.
 */
function IntroController(div) {
	DivController.call(this, div);
	var that = this;
	this.render = function(onDone) {
		div.empty();
		
		// load mix img
		var mixImg = new Image();
		mixImg.alt='Cryptocurrency';
		mixImg.onload = function() {
			
			// div setup
			div.empty();
			div.attr("class", "intro_div");
			
			// intro slider
			sliderDiv = $("<div class='slider_div'>").appendTo(div);
			getSlide($(mixImg), "Generate offline storage for major cryptocurrencies.").appendTo(sliderDiv);
	    getSlide($("<img src='img/microscope.png' alt='Microscope'>"), "100% open source and free to use.  No account necessary.").appendTo(sliderDiv);
	    getSlide($("<img src='img/security.png' alt='Security'>"), "Runs only in your browser so funds are never entrusted to a third party.").appendTo(sliderDiv);
			getSlide($("<img src='img/printer.png' alt='Printer'>"), "Print paper wallets or save keys to a file for long-term storage.").appendTo(sliderDiv);
			getSlide($("<img src='img/keys.png' alt='Keys'>"), "Passphrase-protect and divide private keys for maximum security.").appendTo(sliderDiv);
			getSlide($("<img src='img/checklist.png' alt='Checklist'>"), "Generate keys securely with automatic environment checks.").appendTo(sliderDiv);
			
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
			var btnGenerate = $("<a class='light_green_btn' target='_blank' href='generate.html'>").appendTo(ctaDiv);
			btnGenerate.append("Generate New Keys");
			
			// button to import keys
			var btnImport = $("<a class='btn_import' href='index.html#import'>").appendTo(ctaDiv);
			btnImport.append("or Import Existing Keys");
			
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
	var moreLink = false;
	this.render = function(onDone) {
		
		// load home dependencies
		LOADER.load(AppUtils.getHomeDependencies(), function() {
			
			// div setup
			div.empty();
			div.attr("class", "content_div flex_vertical flex_align_center");
			
			// notice container
			var noticeContainer = $("<div class='notice_container'>").appendTo(div);
			
			// home content
			var pageDiv = $("<div class='page_div home_div flex_vertical flex_align_center'>").appendTo(div);
			
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
			pageDiv.append($("<img width=750px src='img/print_sample.png'>"));
			
			// divide and passphrase section
			pageDiv.append("<div style='height: 10px'>");
			pageDiv.append("<div class='home_label'>Encrypt and divide private keys for maximum security</div>");
			pageDiv.append("<div class='home_description'>Encrypt private keys with a passphrase or divide them into parts so funds are not accessible at any one location.  Set how many parts are needed to recover the keys.  Store one in your safe, one in a bank vault, or one with a trusted family member.</div>")
			pageDiv.append("<img style='width:625px; margin-top:5px;' src='img/passphrase_divide.png' alt='Encrypt and divide keypairs'>");
			
			// check environment section
			pageDiv.append("<div style='height: 70px'>");
			pageDiv.append("<div class='home_label'>Generate keys securely with automatic environment checks</div>");
			pageDiv.append("<div class='home_description'>Following a few simple recommendations can improve the security of your cryptocurrency.  Automatic environment checks encourage keys to be generated in a secure environment.</div>")
			pageDiv.append($("<img width=785px src='img/notice_bars.png' alt='Security checks'>"));
			
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
			licenseDiv.append("<a target='_blank' href='" + AppUtils.GITHUB_URL + "'><img src='img/github.png' class='license_img'></a>");
			licenseDiv.append("<a target='_blank' href='" + AppUtils.REDDIT_URL + "'><img src='img/reddit.png' class='license_img'></a>");
			pageDiv.append("<div style='height: 20px;'>");
			var downloadBtn = $("<a class='light_green_btn' href='" + AppUtils.GITHUB_DOWNLOAD_URL + "'>").appendTo(pageDiv);
			downloadBtn.append("Download Now (zip)");
			
			// footer div
			var footerDiv = $("<div class='footer flex_vertical flex_align_center'>").appendTo(div);
			var footerTopicsDiv = $("<div class='flex_horizontal flex_justify_space_between width_100'>").appendTo(footerDiv);
			
			// footer topics and subtopics
			var footerTopicGenerate = $("<div class='footer_topic_div flex_vertical'>");
			$("<a target='_blank' href='generate.html' class='footer_topic'>Generate Keypairs</a>").appendTo(footerTopicGenerate);
			$("<a target='_blank' href='generate.html?" + AppUtils.TICKERS_PARAM + "=btc' class='footer_subtopic'>Bitcoin</a>").appendTo(footerTopicGenerate);
			$("<a target='_blank' href='generate.html?" + AppUtils.TICKERS_PARAM + "=bch' class='footer_subtopic'>Bitcoin Cash</a>").appendTo(footerTopicGenerate);
			$("<a target='_blank' href='generate.html?" + AppUtils.TICKERS_PARAM + "=eth' class='footer_subtopic'>Ethereum</a>").appendTo(footerTopicGenerate);
			$("<a target='_blank' href='generate.html?" + AppUtils.TICKERS_PARAM + "=xmr' class='footer_subtopic'>Monero</a>").appendTo(footerTopicGenerate);
			var footerTopicImport = $("<div class='footer_topic_div flex_vertical'>");
      $("<a href='#import' class='footer_topic'>Import Keypairs</a>").appendTo(footerTopicImport);
			var footerTopicGitHub = $("<div class='footer_topic_div flex_vertical'>");
			$("<a target='_blank' href='" + AppUtils.GITHUB_URL + "' class='footer_topic'>GitHub</a>").appendTo(footerTopicGitHub);
			var footerTopicDownload = $("<div class='footer_topic_div flex_vertical'>");
			$("<a target='_blank' href='" + AppUtils.GITHUB_DOWNLOAD_URL + "' class='footer_topic'>Download Now</a>").appendTo(footerTopicDownload);
			var footerTopicReleaseNotes = $("<div class='footer_topic_div'>");
			$("<a target='_blank' href='versions.txt' class='footer_topic flex_vertical'>Release Notes</a>").appendTo(footerTopicReleaseNotes);
			var footerTopicDonate = $("<div class='footer_topic_div flex_vertical'>");
			$("<a href='#donate' class='footer_topic'>Donate</a>").appendTo(footerTopicDonate);
			var footerTopicFaq = $("<div class='footer_topic_div flex_vertical'>");
			$("<a href='#faq' class='footer_topic'>FAQ</a>").appendTo(footerTopicFaq);
			var footerTopicIssueTracker = $("<div class='footer_topic_div flex_vertical'>");
			$("<a target='_blank' href='" + AppUtils.GITHUB_ISSUES_URL + "' class='footer_topic'>Issue Tracker</a>").appendTo(footerTopicIssueTracker);
			
			// footer layout
			var footerCol1 = $("<div class='flex_vertical flex_1'>").appendTo(footerTopicsDiv);
			footerCol1.append(footerTopicGenerate);
	    footerCol1.append(footerTopicFaq);
			var footerCol2 = $("<div class='flex_vertical flex_1'>").appendTo(footerTopicsDiv);
			footerCol2.append(footerTopicImport);
	    footerCol2.append(footerTopicDownload);
			footerCol2.append(footerTopicGitHub);
			var footerCol3 = $("<div class='flex_vertical flex_1'>").appendTo(footerTopicsDiv);
	    footerCol3.append(footerTopicReleaseNotes);
			footerCol3.append(footerTopicDonate);
			footerCol3.append(footerTopicIssueTracker);
			
			// footer license
			var footerLicenseDiv = $("<div class='footer_license'>").appendTo(footerDiv);
			footerLicenseDiv.append("<a href='./LICENSE.txt' class='footer_license'>MIT licensed.</a>  No warranty expressed or implied.");
			
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
			if (AppUtils.DEV_MODE || !environmentFailure) UiUtils.openEditorStatic(plugin.getTicker()); 
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
			div.attr("class", "content_div flex_vertical flex_align_center");
			var pageDiv = $("<div class='page_div'>").appendTo(div);
			
			// title
			var titleDiv = $("<div class='page_title'>").appendTo(pageDiv);
			titleDiv.html("Frequently Asked Questions");
			
			// build questions and ansewrs
			var questionsAnswers = [
				{
					id: "faq_what_is_cryptostorage",
					getQuestion: function() { return "What is CryptoStorage?"; },
					getAnswer: function() { return "<p>CryptoStorage is an open source tool to generate offline storage for multiple cryptocurrencies.  This tool generates <a href='#faq_keypair'>keypairs</a> in your device's browser which can store cryptocurrency without exposing private keys to an internet-connected device.  Generated keypairs can be easily printed and saved to digital files for long-term storage.</p>" +
						"<p>This tool is security-focused.  Funds are never entrusted to a third party.  Private keys can be passphrase-protected and <a href='#faq_divide'>divided into parts</a> which can be geographically separated so funds are not accessible at any one location.  <a href='#faq_recommendations'>Recommendations</a> are automatically provided to improve the security of the tool's environment.</p>";
					}
				}, {
					id: "faq_keypair",
					getQuestion: function() { return "What is a cryptocurrency keypair?" },
					getAnswer: function() { return "<p>A cryptocurrency keypair is like an account to send and receive cryptocurrency.  It has a <b>public address</b> and a <b>private key</b>.  For example, this is a Bitcoin keypair:</p>" +
					  "<p><img class='sample_key_pair_img' src='img/key_pair.png'></p>" +
					  "<p>Funds may be received to the public address and spent using the private key.</p>" +
					  "<p>The public address may be publicly shared in order to receive cryptocurrency.</p>" +
					  "<p>The private key <span style='color:red; font-weight:bold;'>must remain private</span> as it authorizes all received funds to be spent.</p>"; }
				}, {
					id: "faq_safe_keys",
					getQuestion: function() { return "How does CryptoStorage help keep my cryptocurrency safe and secure?"; },
					getAnswer: function() { return "<p>First, this tool generates keys only in your device's browser.  Keys can be generated offline and are never shared with a third party by design.</p>" + 
						"<p>Second, private keys can be protected with a passphrase.  The passphrase is required to decrypt the private keys in order to access funds.</p>" + 
						"<p>Third, private keys can be <a href='#faq_divide_meaning'>divided into parts</a> which must be combined to access funds.  For example, a Bitcoin keypair can be divided into 3 parts where 2 parts must be combined to recover the private key.  These parts can be geographically separated to prevent access at any one location.</p>" +
						"<p>Fourth, keys can printed and saved to digital files for long-term storage.</p>" +
						"<p>Finally, this tool <a href='#faq_recommendations'>automatically detects and recommends</a> ways to improve the security of its environment.</p>"; }
				}, {
          id: "faq_divide_meaning",
          getQuestion: function() { return "What does it mean to divide private keys?"; },
          getAnswer: function() { return UiUtils.getDivideDescription(false); }
        }, {
					id: "faq_recommendations",
					getQuestion: function() { return "What security recommendations does CryptoStorage make?"; },
					getAnswer: function() {
						var answerDiv = $("<div>");
						answerDiv.append("<p>In order of importance:</p>");
						var recommendationsList = $("<ol>").appendTo(answerDiv);
						recommendationsList.append("<li><a href='#faq_download_verify'>Download and verify</a> then run the source code offline, not from the cryptostorage.com domain.</li>");
						recommendationsList.append("<li>Run this tool on a device that is disconnected from the internet.  For maximum security, the device should not connect to the internet after generating cryptocurrency storage.</li>");
						recommendationsList.append("<li>Run this tool in an open source browser like " + UiUtils.FIREFOX_LINK + " or " + UiUtils.CHROMIUM_LINK + ".</li>");
						recommendationsList.append("<li>Run this tool on an open source operating system like " + UiUtils.TAILS_LINK + ", " + UiUtils.DEBIAN_LINK + ", or " + UiUtils.RASPBIAN_LINK + ".</li>");
						return answerDiv;
					}
				}, {
					id: "faq_generate_keys",
					getQuestion: function() { return "How can I generate keypairs as securely as possible using CryptoStorage?"; },
					getAnswer: function() {
						var answerDiv = $("<div>");
						var generateList = $("<ol>").appendTo(answerDiv);
						generateList.append("<li><a href='#faq_download_verify'>Download and verify cryptostorage-<i>[version]</i>.zip</a>.</li>");
						var generateTransfer = $("<li><p>Transfer cryptostorage-<i>[version]</i>.zip to a secure computer using a flash drive.</p></li>").appendTo(generateList);
						var generateTransferList = $("<ul>").appendTo(generateTransfer);
						generateTransferList.append("<li>The computer should be disconnected from the internet.  For maximum security, the device should not connect to the internet after generating cryptocurrency storage.</li>");
						generateTransferList.append("<li>An open source operating system is recommended like " + UiUtils.TAILS_LINK + ", " + UiUtils.DEBIAN_LINK + ", or " + UiUtils.RASPBIAN_LINK + ".</li>");
						generateList.append("<li>Unzip cryptostorage-<i>[version]</i>.zip</li>");
						var generateBrowser = $("<li><p>Open index.html in the unzipped folder in a browser.</p></li>").appendTo(generateList);
						var generateBrowserList = $("<ul>").appendTo(generateBrowser);
						generateBrowserList.append("<li>An open source browser is recommended like " + UiUtils.FIREFOX_LINK + " or " + UiUtils.CHROMIUM_LINK + ".</li>");
						var generateChecks = $("<li><p>Confirm that all environment checks pass.</p></li>").appendTo(generateList)
						var generateChecksList = $("<ol>").appendTo(generateChecks);
						generateChecksList.append("<li><p>Go to Generate New Keys from the homepage.</p></li>");
						generateChecksList.append("<li><p>The notice bar at the top should indicate that all security checks pass:</p>" +
								"<img style='width:100%;' src='img/notice_bar_pass.png'></img></li>");
						var generateKeys = $("<li><p>Fill out the form and click the Generate button.</p></li>").appendTo(generateList);
						var generateKeysList = $("<ul>").appendTo(generateKeys);
						generateKeysList.append("<li><p>Protecting your keypairs with a passphrase is <i>highly recommended</i>.  Otherwise anyone in possession of the unencrypted private keys can access the funds.</p>");
						generateKeysList.append("<li><p>Optionally divide your keypairs for maximum security.</p></li>");
						generateList.append("<li><p>Save the generated keypairs to flash drives and/or print to paper.  Geographic redundancy is <i>highly recommended</i> so there are backup copies at other locations if one location is lost due to fire, theft, etc.</p></li>");
            generateList.append("<li><p>The keypairs can be imported at any time by relaunching this tool in a secure environment.</p></li>");
            answerDiv.append("<p><br><div class='flex_horizontal flex_align_start'><img class='faq_caution_img' src='img/caution_solid.png'><span style='color:red'>Do not lose the generated keypairs or the passphrase or all funds will be lost.</span></div></p>");
            answerDiv.append("<p><div class='flex_horizontal flex_align_start'><img class='faq_caution_img' src='img/caution_solid.png'>Many printers retain a copy of printed documents which cannot be deleted easily but can be accessed with the proper tools.  For maximum security, the printer or other hardware which may retain your sensitive data should be destroyed.</div></p>");
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
								"<p>Mac: <div class='terminal_cmd'>openssl sha256 cryptostorage-<i>[version]</i>.zip</div></p>" + 
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
					getAnswer: function() { return "<p>Don't trust.  Verify.</p>" + 
					  "<p>CryptoStorage is 100% open source which means anyone can review the source code.</p>" +
						"<p><a href='#faq_download_verify'>Downloading and verifying</a> the source code ensures you have a copy that has been publicly reviewed and has not been modified by an attacker.</p>"; }
				}, {
					id: "faq_trusted_third_party",
					getQuestion: function() { return "Are my funds ever entrusted to a third party?"; },
					getAnswer: function() { return "<p>No.  The public/private keypairs are generated only in your devices browser so they are never shared with a third party by design.</p>"; }
				}, {
          id: "faq_interoperable",
          getQuestion: function() { return "Does CryptoStorage work with other wallet software?"; },
          getAnswer: function() {
            var answerDiv = $("<div>");
            answerDiv.append("<p>All unencrypted keys generated with CryptoStorage will work with other wallet software and vice versa.</p>" +
                "<p>However, there is currently no standardized way of encrypting and dividing cryptocurrency keypairs across all networks.  As a result, this tool applies its own configurations to <a href='#faq_encrypt'>encrypt</a> and <a href='#faq_divide'>divide</a> keypairs which will not work with other tools unless they use the same configurations.<br><br>" +
                "<b>A copy of this tool should be saved to recover keys in the future if encrypting or dividing keypairs.</b></p>");
            return answerDiv;
          }
        }, {
          id: "faq_encrypt",
          getQuestion: function() { return "How are keypairs encrypted?"; },
          getAnswer: function() {
            var answerDiv = $("<div>");
            answerDiv.append("<p>Keypairs are encrypted using <a target='_blank' href='https://github.com/brix/crypto-js'>CryptoJS</a> with PBKDF2, 10000 iterations, SHA512, and a version number for future extensibility unless <a target='_blank' href='https://github.com/bitcoin/bips/blob/master/bip-0038.mediawiki'>BIP38</a> is supported and enabled.</p>");
            return answerDiv;
          }
        }, {
          id: "faq_divide",
          getQuestion: function() { return "How are keypairs divided?"; },
          getAnswer: function() { return "<p>Each private key within a <a href='#faq_keypair'>keypair</a> is divided using " + UiUtils.SHAMIR_LINK + " then base58 encoded with the minimum number of parts to recover the original private key and a version number for future extensibility.</p>"; }
        }, {
					id: "faq_online_to_recover",
					getQuestion: function() { return "Do I need to be online to recover private keys?"; },
					getAnswer: function() { return "<p>No.  This tool's source code has everything needed to import and recover the private keys.  A copy of this tool can be saved for future use so it doesn't need to be re-downloaded from GitHub.</p>"; }
				}, {
					id: "faq_send_funds",
					getQuestion: function() { return "Can I send funds using CryptoStorage?"; },
					getAnswer: function() { return "<p>Not currently.  It is expected that users will send funds using wallet software of their choice after private keys have been recovered using this tool.</p>"; }
				}, {
					id: "faq_contact",
					getQuestion: function() { return "I still need help.  Who can I contact?"; },
					getAnswer: function() { return "<p>For bug reports and feature requests, please submit an issue to <a href='https://github.com/cryptostorage/cryptostorage.com/issues'>https://github.com/cryptostorage/cryptostorage.com/issues</a>.</p>" +
						"<p>For community discussion, please join the conversation on Reddit at <a href='https://reddit.com/r/cryptostorage'>https://reddit.com/r/cryptostorage</a>.</p>" +
						"<p>For email support, please email <a href='mailto:support@cryptostorage.com'>support@cryptostorage.com</a>.</p>" +
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
			div.attr("class", "content_div flex_vertical flex_align_center");
			var pageDiv = $("<div class='page_div'>").appendTo(div);

			// build donate section
			var titleDiv = $("<div class='page_title'>").appendTo(pageDiv);
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
				titleDiv = $("<div class='page_title'>").appendTo(pageDiv);
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
					title: "BitcoinJS",
					subtitle: $("<a target='_blank' href='https://github.com/bitcoinjs'>https://github.com/bitcoinjs</a>"),
					image: $("<img src='img/bitcoinjs.png'>")
				});
				credits.push({
					title: "EthereumJS",
					subtitle: $("<a target='_blank' href='https://github.com/ethereumjs'>https://github.com/ethereumjs</a>"),
					image: $("<img src='img/ethereumjs.png'>")
				});
				
				renderCredits(credits, function(donationsDiv) {
					pageDiv.append(donationsDiv);
					
					// make addresses copyable
					UiUtils.makeCopyable(div);
					
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
			div.attr("class", "donate_div flex_horizontal flex_align_center");

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
			else UiUtils.renderQrCode(credit.address, null, setImage);
			function setImage(img) {
				img.addClass("donate_img_left");
				div.prepend(img);
				if (onDone) onDone();
			}
		}
		
		function renderRight(div, credit, onDone) {
			div.attr("class", "donate_div flex_horizontal flex_align_center");
			
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
			else UiUtils.renderQrCode(credit.address, null, setImage);
			function setImage(img) {
				img.addClass("donate_img_right");
				div.append(img);
				if (onDone) onDone();
			}
		}
		
		function getIconNameDiv(plugin) {
			var iconNameDiv = $("<div class='donate_icon_name flex_horizontal flex_align_center flex_justify_start'>");
			iconNameDiv.append($("<img class='donate_icon' src='" + plugin.getLogo().get(0).src + "'>"));
			iconNameDiv.append(plugin.getName());
			return iconNameDiv;
		}
	}
}
inheritsFrom(DonateController, DivController);

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
		LOADER.load(AppUtils.getImportExportDependencies(), function(err) {
			if (err) throw err;
			
			// div setup
			div.empty();
			div.attr("class", "content_div flex_vertical flex_align_center");
			
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
 * @param printErrors specifies if errors should be printed to the console on invalid input (default true)
 */
function ImportFileController(div, printErrors) {
	DivController.call(this, div);
	printErrors = isDefined(printErrors) ? printErrors : true;
	
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
	var lastUnspliPiece;
	var decryptionController;
	
	this.render = function(onDone) {
		
		// div setup
		div.empty();
		div.addClass("import_content_div");
		
		// div to collect all import input
		importInputDiv = $("<div class='import_input_div'>").appendTo(div);
		
		// warning div
		warningDiv = $("<div class='import_warning_div flex_horizontal flex_align_center flex_justify_center'>").appendTo(importInputDiv);
		warningDiv.hide();
		
		// all file importing
		fileInputDiv = $("<div>").appendTo(importInputDiv);
		
		// decryption div
		decryptionDiv = $("<div>").appendTo(importInputDiv);
		decryptionDiv.hide();
		
		// drag and drop div
		var dragDropDiv = $("<div class='import_drag_drop flex_horizontal flex_align_center flex_justify_center'>").appendTo(fileInputDiv);
		var dragDropImg = $("<img class='drag_drop_img' src='img/drag_and_drop.png'>").appendTo(dragDropDiv);
		var dragDropText = $("<div class='drag_drop_text flex_vertical flex_align_center flex_justify_center'>").appendTo(dragDropDiv);
		var dragDropLabel = $("<div class='drag_drop_label'>").appendTo(dragDropText);
		dragDropLabel.append("Drag and Drop Files To Import");
		var dragDropBrowse = $("<div class='drag_drop_browse'>").appendTo(dragDropText);
		dragDropBrowse.append("or click to browse");
		
		// register browse link with hidden input
		inputFiles = $("<input type='file' multiple accept='.json,.csv,.txt,.zip'>").appendTo(dragDropDiv);
		inputFiles.change(function() { that.addFiles($(this).get(0).files); });
		inputFiles.hide();
		dragDropBrowse.click(function() {
			inputFiles.click();
		});
		
		// setup drag and drop
		setupDragAndDrop(dragDropDiv, that.addFiles);
		
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
		return warningMsg;
	}
	
	this.startOver = function() {
		setWarning("");
		inputFiles.val("");
		importedStorageDiv.hide();
		importInputDiv.show();
		fileInputDiv.show();
		decryptionDiv.hide();
		importedPiecesDiv.hide();
		controlsDiv.hide();
		removePieces();
		if (decryptionController) decryptionController.destroy();
		decryptionController = null;
	}
	
	this.addFiles = function(files, onDone) {
		
		// collect functions to read files
		var funcs = [];
		for (var i = 0; i < files.length; i++) funcs.push(readFileFunc(files[i]));
		function readFileFunc(file) {
			return function(onDone) {
				AppUtils.fileToNamedPieces(file, function(err, namedPieces) {
					if (isZipFile(file)) {
						if (err) throw err;
						if (namedPieces.length === 0) setWarning(file.name + " does not contain valid pieces");
					} else if (isJsonFile(file) || isCsvFile(file) || isTxtFile(file)) {
						if (err) setWarning(file.name + " is not a valid piece");
						else assertTrue(namedPieces.length === 1);
					} else {
						setWarning(file.name + " is not a json, csv, txt, or zip file");
					}
					onDone(null, namedPieces);
				});
			};
		}
		
		// read files
		async.parallel(funcs, function(err, results) {
			if (err) throw err;
			
			// collect named pieces from all files
			var namedPieces = [];
			for (var i = 0; i < results.length; i++) {
				if (results[i]) namedPieces = namedPieces.concat(results[i]);
			}
			
			// add all named pieces
			if (namedPieces.length) addNamedPieces(namedPieces);
			if (onDone) onDone();
		});
	}
	
	this.getNamedPieces = function() {
		return importedNamedPieces;
	}
	
	// ------------------------ PRIVATE ------------------
	
	function resetControls() {
		controlsDiv.empty();
		addControl("start over", that.startOver);
	}
	
	function addControl(text, onClick) {
		var linkDiv = $("<div class='import_control_link_div flex_horizontal flex_align_center flex_justify_center'>").appendTo(controlsDiv);
		var link = $("<div class='import_control_link'>").appendTo(linkDiv);
		link.append(text);
		link.click(function() { onClick(); });
	}
	
	function setWarning(str, img) {
		warningMsg = str;
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
	
	function onUndividedPieceImported(importedPieces, piece) {
		assertObject(piece, CryptoPiece);
		resetControls();
		setWarning("");
		
		// encrypted piece
		if (piece.isEncrypted()) {
			
			// create decryption controller
			decryptionController = new DecryptionController(decryptionDiv, piece);
			decryptionController.render(function() {
				
				// replace file input div with decryption
				fileInputDiv.hide();
				decryptionDiv.show();
				controlsDiv.show();
				decryptionController.focus();
				
				// add control to view encrypted keys
				addControl("view encrypted keys", function() {
					UiUtils.openEditorDynamic("Encrypted keys", {pieces: [piece], sourcePieces: importedPieces});
				});
			});
			
			// register decryption controller callbacks
			decryptionController.onWarning(function(warning) { setWarning(warning); });
			decryptionController.onDecrypted(function(piece, pieceRenderer) {
				showInlineStorage(importedPieces, piece, pieceRenderer);
			});
		}
		
		// unencrypted piece
		else {
			showInlineStorage(importedPieces, piece);
		}
	}
	
	function showInlineStorage(importedPieces, piece, pieceRenderer) {
		resetControls();
		importInputDiv.hide();
		importedStorageDiv.empty();
		importedStorageDiv.show();
		
		// import success message
		var successDiv = $("<div class='import_success_div flex_vertical flex_align_center'>").appendTo(importedStorageDiv);
		var successTitle = $("<div class='import_success_title flex_horizontal flex_align_center'>").appendTo(successDiv);
		successTitle.append($("<img class='import_success_checkmark' src='img/checkmark.png'>"));
		successTitle.append("Imported Successfully");
		var successLinks = $("<div class='import_success_links flex_horizontal flex_align_center flex_justify_center'>").appendTo(successDiv);
		if (importedPieces.length > 1) successLinks.append("<div class='import_success_checkmark'>");	// filler to center control links under title text
		var startOver = $("<div class='import_control_link'>").appendTo(successLinks);
		startOver.append("start over");
		startOver.click(function() { that.startOver(); });
		var editor = $("<div class='import_control_link'>").appendTo(successLinks);
		editor.append("re-export");
		
		// imported pieces div
		var inlinePiecesDiv = $("<div class='import_inline_pieces_div flex_vertical flex_align_center'>").appendTo(importedStorageDiv);
		
		// inline storage
		if (pieceRenderer) {
			pieceRenderer.getDiv().appendTo(inlinePiecesDiv);
		} else {
			pieceRenderer = new StandardPieceRenderer($("<div>").appendTo(inlinePiecesDiv), piece);
			pieceRenderer.render();
		}
		
		// export link opens editor
		editor.click(function() {
			UiUtils.openEditorDynamic("Imported Piece", {pieces: (piece ? [piece] : undefined), pieceDivs: (pieceRenderer ? [pieceRenderer.getDiv()] : undefined), sourcePieces: importedPieces});
		});
	}
	
	function isPieceImported(name) {
		for (var i = 0; i < importedNamedPieces.length; i++) {
			if (importedNamedPieces[i].name === name) return true;
		}
		return false;
	}
	
	function addNamedPieces(namedPieces) {
		var numPartsBefore = importedNamedPieces.length;
		for (var i = 0; i < namedPieces.length; i++) {
			var namedPiece = namedPieces[i];
			assertObject(namedPiece.piece, CryptoPiece);
			if (isPieceImported(namedPiece.name)) setWarning(namedPiece.name + " already imported");
			else importedNamedPieces.push(namedPiece);
		}
		if (numPartsBefore !== importedNamedPieces.length) updatePieces();
	}
	
	function removePieces() {
		importedNamedPieces = [];
		lastUndividedPiece = undefined;
		updatePieces();
	}
	
	function removePiece(name) {
		for (var i = 0; i < importedNamedPieces.length; i++) {
			if (importedNamedPieces[i].name === name) {
				importedNamedPieces.splice(i, 1);
				setWarning("");
				updatePieces();
				return;
			}
		}
		throw new Error("No piece with name '" + name + "' imported");
	}
	
	function updatePieces() {
		
		// update UI
		setWarning("");
		renderImportedPieces(importedNamedPieces);
		resetControls();
		
		// collect all pieces
		var importedPieces = [];
		for (var i = 0; i < importedNamedPieces.length; i++) importedPieces.push(importedNamedPieces[i].piece);
		
		// done if no pieces
		if (importedPieces.length === 0) return;
		
		// add control to view pieces
		addControl("view imported parts", function() {
			UiUtils.openEditorDynamic("Imported Parts", {pieces: UiUtils.getPiecesForExport(importedPieces)});
		});
		
		// handle undivided piece
		if (importedPieces.length === 1 && !importedPieces[0].isDivided()) {
			onUndividedPieceImported(importedPieces, importedPieces[0]);
			return;
		}
		
		// try to combine pieces
		try {
			var piece = new CryptoPiece({dividedPieces: importedPieces});
			onUndividedPieceImported(importedPieces, piece);
		} catch (err) {
			if (err.message.indexOf("additional") > -1) setWarning(err.message, $("<img src='img/files.png'>"));
			else {
				if (printErrors) console.log(err);
				setWarning("Parts are not compatible");
			}
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
	 * @param onFilesAdded(files) is called when files are dropped into the drop zone
	 */
	function setupDragAndDrop(div, onFilesAdded) {
		
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
				onFilesAdded(files);
			}
			
			// use DataTransfer interface to access file(s)
			else {
				onFilesAdded(dt.files);
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
 * @param plugins are plugins to support text import
 * @param printErrors specifies if errors should be printed to the console on invalid input (default true)
 */
function ImportTextController(div, plugins, printErrors) {
	DivController.call(this, div);
	assertTrue(plugins.length > 0);
	printErrors = isDefined(printErrors) ? printErrors : true;
	
	var MAX_PIECE_LENGTH = 58;	// max length of piece strings to render
	
	var that = this;
	var importInputDiv;					// all import input
	var warningDiv;
	var warningMsg;
	var textInputDiv;						// all text input
	var decryptionDiv;					// decryption div
	var cryptoSelector;
	var textArea;
	var importedPieces = [];		// string[]
	var importedPiecesDiv;			// div for imported pieces
	var controlsDiv;
	var decryptionController;
	var importedStorageDiv;			// inline storage
	var selectDefault = false;	// dropdown selection is assigned a default
	
	this.render = function(onDone) {
		
		// div setup
		div.empty();
		div.addClass("import_content_div");
		
		// div to collect all import input
		importInputDiv = $("<div class='import_input_div'>").appendTo(div);
		
		// warning div
		warningDiv = $("<div class='import_warning_div flex_horizontal flex_align_center flex_justify_center'>").appendTo(importInputDiv);
		warningDiv.hide();
		
		// all text importing
		textInputDiv = $("<div>").appendTo(importInputDiv);
		
		// decryption div
		decryptionDiv = $("<div>").appendTo(importInputDiv);
		decryptionDiv.hide();
		
		// crypto selector
		selectorData = [];
		for (var i = 0; i < plugins.length; i++) {
			var plugin = plugins[i];
			selectorData.push({
				text: plugin.getName(),
				imageSrc: plugin.getLogo().get(0).src
			});
		}
		cryptoSelector = new DropdownController($("<div>").appendTo(textInputDiv), {data: selectorData}, "Select a Currency").render();
		
		// text area
		textArea = $("<textarea class='import_textarea'>").appendTo(textInputDiv);
		textArea.attr("placeholder", "Enter private keys, a divided part, CSV, JSON, or TXT");
		
		// submit button
		var submit = $("<div class='import_button flex_horizontal flex_align_center flex_justify_center user_select_none'>").appendTo(textInputDiv);
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
		cryptoSelector.setEnabled(true);
		cryptoSelector.reset();
		if (decryptionController) decryptionController.destroy();
		decryptionController = null;
	}
	
	this.getWarning = function() {
		return warningMsg;
	}
	
	this.getImportedPieces = function() {
		return importedPieces;
	}
	
	this.setSelectedCurrency = function(ticker) {
		for (var i = 0; i < plugins.length; i++) {
			if (plugins[i].getTicker() === ticker) {
				cryptoSelector.setSelectedIndex(i);
				return;
			}
		}
		throw new Error("No plugin for ticker: " + ticker);
	}
	
	this.addText = function(text) {
		
		// init state
		setWarning("");
		
		// check for empty text
		if (text === "") {
			setWarning("No text entered");
			return;
		}
		
		// get piece from input text
		var piece;
		try {
			piece = CryptoPiece.parse(text, getSelectedPlugin());
		} catch (err) {
			if (err.message.indexOf("Plugin required") !== -1) {
				setWarning("No currency selected");
				return;
			}
			throw err;
		}
		
		// check if valid piece input
		if (!piece) {
			setWarning("Input text is not a private key or part");
			return;
		}
		
		// check if piece can be added to imported pieces
		var msg = getCompatibilityError(importedPieces, piece);
		if (msg) {
			setWarning(msg);
			return;
		}
		
		// accept piece into imported pieces
		textArea.val("");
		importedPieces.push(piece);
		processPieces();
		
		function getCompatibilityError(pieces, piece) {
			
			// check if piece already added
			for (var i = 0; i < pieces.length; i++) {
				if (pieces[i].equals(piece)) return "Piece already imported";
			}
			
			// no issues adding private key
			return null;
		}
	}
	
	// -------------------------------- PRIVATE ---------------------------------
	
	function resetControls() {
		controlsDiv.empty();
		addControl("start over", that.startOver);
	}
	
	function addControl(text, onClick) {
		var linkDiv = $("<div class='import_control_link_div flex_horizontal flex_align_center flex_justify_center'>").appendTo(controlsDiv);
		var link = $("<div class='import_control_link'>").appendTo(linkDiv);
		link.append(text);
		link.click(function() { onClick(); });
	}
	
	function getSelectedPlugin() {
		return plugins[cryptoSelector.getSelectedIndex()];
	}
	
	function onUndividedPieceImported(importedPieces, piece) {
		assertObject(piece, CryptoPiece);
		resetControls();
		setWarning("");
		
		// encrypted piece
		if (piece.isEncrypted()) {
			
			// create decryption controller
			decryptionController = new DecryptionController(decryptionDiv, piece);
			decryptionController.render(function() {
				
				// replace text input div with decryption
				textInputDiv.hide();
				decryptionDiv.show();
				controlsDiv.show();
				decryptionController.focus();
				
				// add control to view encrypted keys
				addControl("view encrypted keys", function() {
					UiUtils.openEditorDynamic("Encrypted keys", {pieces: [piece], sourcePieces: importedPieces.length > 1 ? importedPieces : null});
				});
			});
			
			// register decryption controller callbacks
			decryptionController.onWarning(function(warning) { setWarning(warning); });
			decryptionController.onDecrypted(function(piece, pieceRenderer) {
				showInlineStorage(importedPieces, piece, pieceRenderer);
			});
		}
		
		// unencrypted piece
		else {
			showInlineStorage(importedPieces, piece);
		}
	}
	
	function showInlineStorage(importedPieces, piece, pieceRenderer) {
		resetControls();
		importInputDiv.hide();
		importedStorageDiv.empty();
		importedStorageDiv.show();
		
		// import success message
		var successDiv = $("<div class='import_success_div flex_vertical flex_align_center'>").appendTo(importedStorageDiv);
		var successTitle = $("<div class='import_success_title flex_horizontal flex_align_center'>").appendTo(successDiv);
		successTitle.append($("<img class='import_success_checkmark' src='img/checkmark.png'>"));
		successTitle.append("Imported Successfully");
		var successLinks = $("<div class='import_success_links flex_horizontal flex_align_center flex_justify_center'>").appendTo(successDiv);
		if (importedPieces.length > 1) successLinks.append("<div class='import_success_checkmark'>");	// filler to center control links under title text
		var startOver = $("<div class='import_control_link'>").appendTo(successLinks);
		startOver.append("start over");
		startOver.click(function() { that.startOver(); });
		var editor = $("<div class='import_control_link'>").appendTo(successLinks);
		editor.append("re-export");
		
		// imported pieces div
		var inlinePiecesDiv = $("<div class='import_inline_pieces_div flex_vertical flex_align_center'>").appendTo(importedStorageDiv);
		
		// inline storage
		if (pieceRenderer) {
			pieceRenderer.getDiv().appendTo(inlinePiecesDiv);
		} else {
			pieceRenderer = new StandardPieceRenderer($("<div>").appendTo(inlinePiecesDiv), piece);
			pieceRenderer.render();
		}
		
		// export link opens editor
		editor.click(function() {
			UiUtils.openEditorDynamic("Imported Piece", {pieces: (piece ? [piece] : undefined), sourcePieces: importedPieces, pieceDivs: (pieceRenderer ? [pieceRenderer.getDiv()] : undefined)});
		});
	}
	
	function setWarning(str, img) {
		warningDiv.empty();
		warningMsg = str;
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
		processPieces();
	}
	
	function removePiece(piece) {
		for (var i = 0; i < importedPieces.length; i++) {
			if (importedPieces[i].equals(piece)) {
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
		that.addText(textArea.val().trim());
	}
	
	/**
	 * Reads the imported pieces.
	 */
	function processPieces() {
		
		// update UI
		setWarning("");
		renderImportedPieces(importedPieces);
		resetControls();
		
		// done if no pieces
		if (importedPieces.length === 0) return;
		
		// add control to view pieces
		addControl("view imported parts", function() {
			UiUtils.openEditorDynamic("Imported Storage", {pieces: UiUtils.getPiecesForExport(importedPieces)});
		});
		
		// handle undivided piece
		if (importedPieces.length === 1 && !importedPieces[0].isDivided()) {
			onUndividedPieceImported(importedPieces, importedPieces[0]);
			return;
		}
		
		// try to combine pieces
		try {
			var piece = new CryptoPiece({dividedPieces: importedPieces});
			onUndividedPieceImported(importedPieces, piece);
		} catch (err) {
			if (err.message.indexOf("additional") > -1) setWarning(err.message, $("<img src='img/files.png'>"));
			else {
				if (printErrors) console.log(err);
				setWarning("Parts are not compatible");
			}
		}
	}
	
	function renderImportedPieces(pieces) {
		
		// selector enabled iff no pieces
		cryptoSelector.setEnabled(pieces.length === 0 || !getSelectedPlugin());

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
			assertTrue(piece.getKeypairs().length > 0);
			var pieceLabel = piece.getKeypairs().length === 1 ? (piece.getKeypairs()[0].hasPrivateKey() ? piece.getKeypairs()[0].getPrivateWif() : piece.getKeypairs()[0].getPublicAddress()) : "Imported piece" + (piece.getPartNum() ? " " + piece.getPartNum() : "");
			importedPieceDiv.append(AppUtils.getShortenedString(pieceLabel, MAX_PIECE_LENGTH));
			var trash = $("<img src='img/trash.png' class='import_imported_trash'>").appendTo(importedPieceDiv);
			trash.click(function() { removePiece(piece); });
			return importedPieceDiv;
		}
	}
}
inheritsFrom(ImportTextController, DivController);

/**
 * Controls passphrase input and piece decryption on import.
 * 
 * @param div is the div to render to
 * @param encryptedPiece is an encrypted piece to decrypt
 */
function DecryptionController(div, encryptedPiece) {
	DivController.call(this, div);
	var that = this;
	var PROGRESS_COLOR = "rgb(76, 213, 67)";
	
	var labelDiv;
	var inputDiv;
	var passphraseInput;
	var progressDiv;
	var submitButton;
	var onWarningFn;
	var onDecryptedFn;
	var pieceRenderer;
	var _isDestroyed = false;
	
	this.render = function(onDone) {
		assertFalse(_isDestroyed, "DecryptionController is destroyed");
		
		// set up div
		div.empty();
		div.addClass("import_decryption_div");
		
		// label
		labelDiv = $("<div class='import_decrypt_label'>").appendTo(div);
		
		// passphrase input
		inputDiv = $("<div>").appendTo(div);
		passphraseInput = $("<input type='password' class='import_passphrase_input'>").appendTo(inputDiv)
		if (AppUtils.DEV_MODE) passphraseInput.val(AppUtils.DEV_MODE_PASSPHRASE);
		submitButton = $("<div class='import_button flex_horizontal flex_align_center flex_justify_center user_select_none'>").appendTo(inputDiv);
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
		
		// done
		if (onDone) onDone(div);
		return that;
	}
	
	this.focus = function() {
		assertFalse(_isDestroyed, "DecryptionController is destroyed");
		passphraseInput.focus();
	}
	
	this.destroy = function() {
		assertFalse(_isDestroyed, "DecryptionController already destroyed");
		if (pieceRenderer) pieceRenderer.destroy();
		encryptedPiece.destroy();
		_isDestroyed = true;
	}
	
	this.isDestroyed = function() {
		return _isDestroyed;
	}
	
	this.onWarning = function(callbackFn) {
		assertFalse(_isDestroyed, "DecryptionController is destroyed");
		onWarningFn = callbackFn;
	}
	
	/**
	 * Registers a callback function when a piece is decrypted.
	 * 
	 * @param callbackFn(decryptedPiece, pieceRenderer) is invoked when the piece is decrypted
	 */
	this.onDecrypted = function(callbackFn) {
		assertFalse(_isDestroyed, "DecryptionController is destroyed");
		onDecryptedFn = callbackFn;
	}
	
	// --------------------------------- PRIVATE --------------------------------
	
	function init() {
		progressDiv.hide();
		labelDiv.html("Passphrase");
		labelDiv.show();
		inputDiv.show();
		that.focus();
	}
	
	function onSubmit() {
		
		// clear warning
		if (onWarningFn) onWarningFn("");
		
		// get passphrase
		var passphrase = passphraseInput.val();
		passphraseInput.val('');
		
		// validate passphrase
		if (!passphrase || passphrase.trim() === "") {
			onWarningFn("Enter a passphrase to decrypt private keys");
			return;
		}
		
		// compute weights for progress bar
		pieceRenderer = new StandardPieceRenderer(null, encryptedPiece);
		var decryptWeight = encryptedPiece.getDecryptWeight();
		var renderWeight = pieceRenderer.getRenderWeight();
		var totalWeight = decryptWeight + renderWeight;
		
		// switch content div to progress bar
		inputDiv.hide();
		progressDiv.show();
		progressDiv.empty();
		progressBar = UiUtils.getProgressBar(progressDiv, PROGRESS_COLOR);
		
		// let UI breath then encrypt piece
		setImmediate(function() {
		  encryptedPiece.decrypt(passphrase, function(percent, label) {
				if (_isDestroyed) return;
				setProgress(percent * decryptWeight / totalWeight, label);
			}, function(err, decryptedPiece) {
				if (_isDestroyed) return;
				
				// if error, switch back to input div
				if (err) {
					if (onWarningFn) onWarningFn(err.message);
					init();
					return;
				}
				
				// register renderer progress
				pieceRenderer.onProgress(function(percent, label) {
					setProgress((decryptWeight + percent * renderWeight) / totalWeight, "Rendering");
				});
				
				// render piece
				pieceRenderer.render(function(pieceDiv) {
					if (onDecryptedFn) onDecryptedFn(decryptedPiece, pieceRenderer);
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
 * @param config specifies editor configuration
 * 				config.genConfig is configuration to generate keypairs
 * 				config.pieces are pre-generated pieces
 * 				config.pieceDivs are pre-rendered pieces to display
 * 				config.sourcePieces are source pieces that the given piece was generated from
 * 				config.showNotices specifies whether or not to show the notice bar
 *  			config.environmentInfo is initial environment to display
 */
function EditorController(div, config) {
	DivController.call(this, div);
	
	// global variables
	var QUICK_GENERATE_MAX = 300;	// generation is 'quick' up to this weight to avoid flickering
	var that = this;
	var passphraseController
	var divideController;
	var paginatorController;
	var contentController;
	var importedPieces;			// original imported pieces
	var importedPieceDivs;	// piece divs for original imported currentPieces
	var currentPieces;			// current pieces
	var currentPieceDivs;		// piece divs for current pieces
	var pieceGenerator;			// initialized while generating
	var formErrorChangeListeners;
	var setPiecesListeners;
	var generateListeners;
	var generateProgressListeners;
	var lastFormError;
	var readyListeners;
	
	this.render = function(onDone) {
		
		// init
		div.empty();
		div.addClass("editor_div flex_vertical flex_align_center");
		formErrorChangeListeners = [];
		setPiecesListeners = [];
		generateListeners = [];
		generateProgressListeners = [];
		readyListeners = [];
		
		// copy config with defaults
		config = Object.assign({
			showNotices: true
		}, config);
		
		// header
		var headerDiv = $("<div class='editor_header flex_vertical flex_align_center'>").appendTo(div);
		
		// passphrase and divide input div
		var passphraseDivideDiv = $("<div class='editor_passphrase_divide flex_horizontal flex_align_center flex_justify_center'>").appendTo(headerDiv);
		
		// passphrase controller
		passphraseController = new EditorPassphraseController($("<div>").appendTo(passphraseDivideDiv), that);
		passphraseController.render();
		passphraseController.setUsePassphrase(false);
		
		// divide controller
		divideController = new EditorDivideController($("<div>").appendTo(passphraseDivideDiv), that);
		divideController.render();
		divideController.setUseDivided(false);
		
		// view divided pieces
		if (config.sourcePieces && config.sourcePieces.length > 1) {
			var viewDivided = $("<div class='editor_control_link import_control_link'>").appendTo(headerDiv);
			viewDivided.html("view imported parts");
			viewDivided.click(function() {
				UiUtils.openEditorDynamic("Imported Parts", {pieces: UiUtils.getPiecesForExport(config.sourcePieces)});
			});
		}
		
		// paginator controller
		paginatorController = new EditorPaginatorController($("<div>").appendTo(headerDiv), that);
		paginatorController.render();
		paginatorController.onClick(function(index, label) { setVisiblePiece(label); });
		
		// load content controller
		contentController = new EditorContentController($("<div>").appendTo(div), that, config);
		new LoadController(contentController).render(function() {
			
			// announce ready
			invoke(readyListeners);
			
			// register callbacks
			contentController.getActionsController().onGenerate(that.generate);
			contentController.getActionsController().onApply(that.generate);
			contentController.getActionsController().onReset(reset);
			contentController.getActionsController().onCancel(cancel);
			contentController.getActionsController().onSave(save);
			contentController.getActionsController().onPrint(print);
			passphraseController.onFormErrorChange(updateFormError);
			divideController.onFormErrorChange(updateFormError);
			contentController.onFormErrorChange(updateFormError);
			
			// select BCH if in dev mode for convenience
      if (AppUtils.DEV_MODE && !that.getImportedPieces() && !that.getCurrentPieces()) {
        contentController.getCurrenciesController().getCurrencyInputs()[0].setSelectedCurrency("BCH");
      }
			
			// confirm exit if keypairs generated
			window.addEventListener("beforeunload", function (e) {
				if (AppUtils.DEV_MODE || !that.newPiecesGenerated()) return;
				var confirmationMsg = "Discard generated keypairs and close?";
				(e || window.event).returnValue = confirmationMsg;	// Gecko + IE
				return confirmationMsg;   
			});
		});
		
		// done rendering
		if (onDone) onDone(div);
	}
	
	this.getInitConfig = function() {
		return config;
	}
	
	this.onReady = function(listener) {
		assertFunction(listener);
		readyListeners.push(listener);
	}
	
	this.onGenerate = function(listener) {
		assertFunction(listener);
		generateListeners.push(listener);
	}
	
	this.getPassphraseController = function() {
		return passphraseController;
	}
	
	this.getDivideController = function() {
		return divideController;
	}
	
	this.getContentController = function() {
		return contentController;
	}
	
	this.hasFormError = function() {
		if (passphraseController.hasFormError()) return true;
		if (divideController.hasFormError()) return true;
		if (contentController.hasFormError()) return true;
		return false;
	}
	
	this.onFormErrorChange = function(listener) {
		assertFunction(listener);
		formErrorChangeListeners.push(listener);
	}
	
	this.onGenerateProgress = function(listener) {
		assertFunction(listener);
		generateProgressListeners.push(listener);
	}
	
	this.setCurrentPieces = function(_pieces, _pieceDivs) {
		
		// set and notify null pieces
		if (_pieces === undefined && _pieceDivs === undefined) {
			setAndNotify();
			return;
		}
		
		// validate input
		assertArray(_pieces);
		assertTrue(_pieces.length > 0);
		assertObject(_pieces[0], CryptoPiece);
		assertArray(_pieceDivs);
		assertTrue(_pieceDivs.length > 0);
		
		// assign imported pieces if not given
		if (config.pieces && !importedPieces) {
			importedPieces = _pieces;
			importedPieceDivs = _pieceDivs;
		}
		
		// set and notify
		setAndNotify();
		function setAndNotify() {
			currentPieces = _pieces;
			currentPieceDivs = _pieceDivs;
			invoke(setPiecesListeners, currentPieces, currentPieceDivs);
		}
	}
	
	this.onSetCurrentPieces = function(listener) {
		assertFunction(listener);
		setPiecesListeners.push(listener);
	}
	
	this.getCurrentPieces = function() {
		return currentPieces;
	}
	
	this.getCurrentPieceDivs = function() {
		return currentPieceDivs;
	}
	
	this.getImportedPieces = function() {
		return importedPieces;
	}
	
	this.getImportedPieceDivs = function() {
		return importedPieceDivs;
	}
	
	this.isReset = function() {
	  var config = that.getGenerateConfig();
	  if (that.hasFormError()) return false;
	  if (isDefined(config.passphrase)) return false;
    if (isDefined(config.numParts)) return false;
    if (that.newPiecesGenerated()) return false;
    if (config.keypairs) {
      if (config.keypairs.length !== 1) return false;
      if (config.keypairs[0].ticker) return false;
      if (config.keypairs[0].numKeypairs !== 1) return false;
    }     
    return true;
	}
	
	this.newPiecesGenerated = function() {
		return !equals(this.getCurrentPieces(), this.getImportedPieces());
	}
	
	this.setGenerateConfig = function(config) {
		
		// validate config
		PieceGenerator.validateConfig(config);
		
		// set passphrase
		if (config.passphrase) passphraseController.setPassphrase(config.passphrase);
		
		// set divided
		if (config.numParts) divideController.setNumPieces(config.numParts);
		if (config.minParts) {
			divideController.setMinPieces(config.minParts);
			divideController.setUseDivided(true);
		}
		
		// set currencies
		contentController.getCurrenciesController().setConfig(config.keypairs);
	}
	
	this.getGenerateConfig = function() {
		var config = {};
		
		// set passphrase
		if (passphraseController.getUsePassphrase()) {
			config.passphrase = passphraseController.getPassphrase();
		}
		
		// handle imported pieces
		if (that.getImportedPieces()) {
			config.pieces = that.getImportedPieces();
			
			// set encryption schemes
			if (config.passphrase) {
				config.encryptionSchemes = [];
				for (var i = 0; i < config.pieces[0].getKeypairs().length; i++) {
					var keypair = config.pieces[0].getKeypairs()[i];
					if (passphraseController.getBip38Checkbox().isChecked() && arrayContains(keypair.getPlugin().getEncryptionSchemes(), AppUtils.EncryptionScheme.BIP38)) {
						config.encryptionSchemes.push(AppUtils.EncryptionScheme.BIP38);
					} else {
						config.encryptionSchemes.push(keypair.getPlugin().getEncryptionSchemes()[0]);
					}
				}
			}
		}
		
		// handle no imported pieces which uses currency inputs
		else if (contentController.getCurrenciesController()) {
		  
			// set keypairs
			config.keypairs = contentController.getCurrenciesController().getConfig();
			
			// set keypair encryption
			for (var i = 0; i < config.keypairs.length; i++) {
				var keypair = config.keypairs[i];
				if (!keypair.ticker) continue;
				if (passphraseController.getUsePassphrase()) {
					if (passphraseController.getBip38Checkbox().isChecked() && arrayContains(AppUtils.getCryptoPlugin(keypair.ticker).getEncryptionSchemes(), AppUtils.EncryptionScheme.BIP38)) {
						keypair.encryption = AppUtils.EncryptionScheme.BIP38;
					} else {
						keypair.encryption = AppUtils.getCryptoPlugin(keypair.ticker).getEncryptionSchemes()[0]
					}
				} else {
					keypair.encryption = null;
				}
			}
		}		

		// set divide config
		if (divideController.getUseDivided()) {
			config.numParts = divideController.getNumPieces();
			config.minParts = divideController.getMinParts();
		}
		
		// set piece renderer class
		config.pieceRendererClass = StandardPieceRenderer;
		return config;
	}
	
	this.generate = function(onDone) {
		
		// validate no errors
		if (that.hasFormError()) return;
		
		// confirm discard
		if (!AppUtils.DEV_MODE && that.newPiecesGenerated()) {
		  var confirmMsg = that.getImportedPieces() ? "Discard changes to imported keypairs and apply new settings?" : "Discard and generate new keypairs?";
		  if (!confirm(confirmMsg)) return;
		}
		
		// get generation config based on current state
		var genConfig = that.getGenerateConfig();
		
		// copy pieces so originals are unchanged
		if (genConfig.pieces) {
			var copies = [];
			for (var i = 0; i < config.pieces.length; i++) copies.push(config.pieces[i].copy());
			genConfig.pieces = copies;
		}
		
		// create generator and determine if generation is quick
		pieceGenerator = new PieceGenerator(genConfig);
		var isQuick = pieceGenerator.getWeights().totalWeight <= QUICK_GENERATE_MAX;
		
		// announce generating
		invoke(generateListeners, isQuick);
		
		// generate pieces
		pieceGenerator.generatePieces(function(percent, label) {
			if (!isQuick) invoke(generateProgressListeners, percent, label);	// don't announce if quick
		}, function(err, pieces, pieceRenderers) {
			
			// validate
			assertNull(err);
			assertArray(pieces);
			assertTrue(pieces.length > 0);
			assertArray(pieceRenderers);
			assertTrue(pieceRenderers.length > 0);
			
			// set pieces and divs
			var pieceDivs = [];
			for (var i = 0; i < pieceRenderers.length; i++) pieceDivs.push(pieceRenderers[i].getDiv());
			that.setCurrentPieces(pieces, pieceDivs);
			pieceGenerator = null;
			if (onDone) onDone();
		});
	}
	
	// -------------------------------- PRIVATE ---------------------------------
	
	function setVisiblePiece(partNum) {
		window.location.hash = "";
		window.location.hash = "piece_" + partNum;
	}
	
	function updateFormError() {
		var formError = that.hasFormError();
		if (lastFormError !== formError) invoke(formErrorChangeListeners, formError);
		lastFormError = formError;
	}
	
	function save() {
		var saveController = new EditorSaveController($("<div>"), currentPieces);
		var popupController = new OverlayController(div, {contentDiv: saveController.getDiv(), fullScreen: true, hideOnExternalClick: true});
		saveController.onSave(popupController.destroy);
		saveController.onCancel(popupController.destroy);
		saveController.render();
		popupController.render();
	}
		
	function print() {
	  
	  // print controller
	  var printController = new EditorPrintController($("<div>"), currentPieces);
    printController.onPrint(destroyPrint);
    printController.onCancel(destroyPrint);
    printController.render();
    
    // print setup goes in popup overlay
	  var popupController = new OverlayController(div, {contentDiv: printController.getDiv(), fullScreen: true, hideOnExternalClick: true});
    popupController.onHide(destroyPrint);
		popupController.render();
		
		function destroyPrint() {
		  popupController.destroy();
		  printController.destroy();
		}
	}
	
	function reset() {
	  that.setCurrentPieces(importedPieces, importedPieceDivs);
	}
	
	function cancel() {
		if (pieceGenerator) {
			pieceGenerator.destroy(true);
			pieceGenerator = null;
		}
		that.setCurrentPieces(importedPieces, importedPieceDivs);
	}
}
inheritsFrom(EditorController, DivController);

/**
 * Controls the editor content panel.
 * 
 * @param div is the div to render to
 * @param editorController is the governing editor controller
 * @param config specifies rendering config
 * 				config.showNotices specifies if the notices bar should be shown
 */
function EditorContentController(div, editorController, config) {
	DivController.call(this, div);
	
	var that = this;
	var hasError;
	var formErrorChangeListeners;
	var inputChangeListeners;
	var bodyDiv;
	var progressDiv;
	var progressBar;
	var progressLabel;
	var piecesDiv;
	var logoHeader;
	var currenciesDiv;
	var currenciesController;
	var actionsController;
	var pieceRenderers;
	var interoperableDisclaimerDiv;
	var interoperableDisclaimerDismissed;
	
	this.render = function(onDone) {
		
		// init
		div.empty();
		div.addClass("editor_content_div flex_vertical flex_align_center");
		hasError = false;
		formErrorChangeListeners = [];
		inputChangeListeners = [];
		interoperableDisclaimerDismissed = false;
		
		// load dependencies
		LOADER.load(AppUtils.getImportExportDependencies(), function(err) {
			if (err) throw err;
			
			// notices
			if (config.showNotices) {
				
				// poll environment info on loop
				AppUtils.pollEnvironment(AppUtils.getCachedEnvironment() ? AppUtils.getCachedEnvironment() : AppUtils.getEnvironmentSync());
				
				// notice div
				var noticeDivContainer = $("<div class='notice_container'>").appendTo(div);
				var noticeDiv = $("<div>").appendTo(noticeDivContainer);
				new NoticeController(noticeDiv).render(function() { renderAux(); });
			} else {
				renderAux();
			}
			
			function renderAux() {
			  
			  // interoperability disclaimr
			  interoperableDisclaimerDiv = getInteroperableDisclaimerDiv(function() {
			    interoperableDisclaimerDismissed = true;
			    interoperableDisclaimerDiv.hide();
			  });
			  interoperableDisclaimerDiv.hide();
			  interoperableDisclaimerDiv.appendTo(div);
			  
				// editor body div
				bodyDiv = $("<div class='editor_body_div flex_vertical flex_align_center'>").appendTo(div);
				
				// cryptostorage logo
				logoHeader = $("<div class='flex_horizontal flex_align_center flex_justify_center'>").appendTo(bodyDiv);
				$("<a target='_blank' href='index.html#home' title='Go Home'><img class='piece_page_header_logo' src='img/cryptostorage_export.png' alt='CryptoStorage logo'></a>").appendTo(logoHeader);
				
				// progress bar
				progressDiv = $("<div class='editor_progress_div flex_vertical flex_align_center'>").appendTo(bodyDiv);
				progressDiv.hide();
				progressBar = UiUtils.getProgressBar($("<div class='editor_progress_bar_div'>").appendTo(progressDiv));
				progressLabel = $("<div class='editor_progress_label'>").appendTo(progressDiv);
				
				// pieces div
				piecesDiv = $("<div class='pieces_div flex_vertical'>").appendTo(bodyDiv);
				piecesDiv.hide();
				
				// currency inputs controller
				if (!config.pieces) {
					currenciesDiv = $("<div>").appendTo(bodyDiv);
					currenciesController = new EditorCurrenciesController(currenciesDiv, AppUtils.getCryptoPlugins());
					currenciesController.render();
					currenciesController.onFormErrorChange(setFormError);
					currenciesController.onInputChange(function() { invoke(inputChangeListeners); });
				}
				
				// actions controller
				actionsController = new EditorActionsController($("<div>"), editorController);
				actionsController.render();
				placeActionsController();
				
				// register callbacks
				$(window).resize(placeActionsController);
				editorController.onSetCurrentPieces(setCurrentPieces);
				editorController.onGenerateProgress(setGenerateProgress);
				editorController.onReady(function() {
					actionsController.onGenerate(validate);
					actionsController.onReset(reset);
					editorController.getPassphraseController().onUsePassphraseChange(updateInteroperableDisclaimer);
					editorController.getDivideController().onUseDividedChange(updateInteroperableDisclaimer);
				});
				
				// handle pre-existing pieces
				if (config.pieces) {
					
					// re-initialize pieces in this thread so instanceof, etc work in new tab
					var copies = [];
					for (var i = 0; i < config.pieces.length; i++) copies.push(new CryptoPiece({json: config.pieces[i].toJson()}));
					config.pieces = copies;
					
					// add pre-existing piece divs
					if (config.pieceDivs) {
						UiUtils.makeCopyable(config.pieceDivs);	// copy is lost when transferred across tabs
						editorController.setCurrentPieces(config.pieces, config.pieceDivs);
					}
					
					// render piece divs
					else {
						
						// collect piece divs and piece renderers
						var pieceDivs = [];
						var pieceRenderers = [];
						for (var i = 0; i < config.pieces.length; i++) {
							var pieceDiv = $("<div>");
							pieceDivs.push(pieceDiv);
							pieceRenderers.push(new StandardPieceRenderer(pieceDiv, config.pieces[i]));
						}
						
						// set pieces and divs
						editorController.setCurrentPieces(config.pieces, pieceDivs);
						
						// start rendering pieces but don't wait
						var renderFuncs = [];
						for (var i = 0; i < pieceRenderers.length; i++) renderFuncs.push(renderFunc(pieceRenderers[i]));
						async.series(renderFuncs, function(err, pieceRenderers) {
							assertNull(err);
						});
						function renderFunc(pieceRenderer) {
							return function(onDone) {
								pieceRenderer.render(function() { onDone(null, pieceRenderer); });
							}
						}
					}
					
					// done
					if (onDone) onDone(div);
				}
				
				// handle generate config
				else if (config.genConfig) {
					editorController.setGenerateConfig(config.genConfig);
					editorController.generate(function() {
						if (onDone) onDone(div);
					});
				}
				
				// otherwise set blank pieces to initialize
				else {
				  editorController.setCurrentPieces();
				  if (onDone) onDone(div);
				}
			}
		});
	}
	
	this.getCurrenciesController = function() {
		return currenciesController;
	}
	
	this.getActionsController = function() {
		return actionsController;
	}
	
	this.hasFormError = function() {
		return hasError;
	}
	
	this.onFormErrorChange = function(listener) {
		assertFunction(listener);
		formErrorChangeListeners.push(listener);
	}
	
	this.onInputChange = function(listener) {
		assertFunction(listener);
		inputChangeListeners.push(listener);
	}
	
	// -------------------------------- PRIVATE ---------------------------------
	
	function updateInteroperableDisclaimer() {
	  if (interoperableDisclaimerDismissed) return;
	  if (editorController.getPassphraseController().getUsePassphrase() || editorController.getDivideController().getUseDivided()) {
	    interoperableDisclaimerDiv.show();
	  } else {
	    interoperableDisclaimerDiv.hide();
	  }
	}
	
	function getInteroperableDisclaimerDiv(onDismiss) {
	  var div = $("<div class='editor_interoperable_disclaimer flex_vertical flex_align_center width_100'>");
    div.append("Passphrase encryption and keypair division may not be interoperable with other tools");
    var subtitleDiv = $("<div class='editor_interoperable_disclaimer_subtitle'>").appendTo(div);
    $("<a class='styled_link' target='_blank' href='index.html#faq_interoperable'>Learn more</a>").appendTo(subtitleDiv);
    subtitleDiv.append("&nbsp;|&nbsp");
    var dismissLink = $("<span class='styled_link'>Dismiss</a>").appendTo(subtitleDiv);
    dismissLink.click(onDismiss);
    return div;
  }
	
	function reset() {
		if (currenciesController) currenciesController.reset();
	}
	
	function setCurrentPieces(pieces, pieceDivs) {
		piecesDiv.empty()
		progressDiv.hide();
		if (currenciesController) currenciesController.getDiv().show();

		// handle no pieces
		if (!pieceDivs) {
			piecesDiv.hide();
			logoHeader.show();
		}
		
		// add pieces divs
		else {
			piecesDiv.show();
			logoHeader.hide();
			assertTrue(pieceDivs.length > 0);
			for (var i = 0; i < pieceDivs.length; i++) {
				if (pieceDivs.length > 1) {
					assertDefined(pieces[i].getPartNum());
					pieceDivs[i].attr("id", "piece_" + pieces[i].getPartNum());
				}
				piecesDiv.append(pieceDivs[i]);
			}
		}
	}
	
	function setGenerateProgress(percent, label) {
	  
	  // show header
    if (!logoHeader.is(":visible")) logoHeader.show();
    
    // set progress bar
		progressBar.set(percent);
		progressBar.setText(Math.round(percent * 100)  + "%");
		progressLabel.html(label);
		if (!progressDiv.is(":visible")) progressDiv.show();
		
		// hide other elements
		piecesDiv.hide();
		if (currenciesController) currenciesController.getDiv().hide();
	}
	
	function setFormError(_hasError) {
		assertBoolean(_hasError);
		var change = hasError !== _hasError;
		hasError = _hasError;
		if (change) invoke(formErrorChangeListeners, hasError);
	}
	
	function validate() {
		if (currenciesController) currenciesController.validate();
	}
	
	function placeActionsController() {
		if ($(window).width() < 1450) {
			actionsController.getDiv().appendTo(bodyDiv);
			actionsController.getDiv().removeClass("editor_controls_fixed");
		} else {
			actionsController.getDiv().appendTo(div);
			actionsController.getDiv().addClass("editor_controls_fixed");
		}
	}
}
inheritsFrom(EditorContentController, DivController);

/**
 * Controls passphrase input and validation.
 * 
 * @param div is the div to render to
 * @param editorController is a reference to the top-level editor
 */
function EditorPassphraseController(div, editorController) {
	DivController.call(this, div);
	
	var that = this;
	var PLACEHOLDER = "Do NOT lose this";
	var passphraseCheckbox;
	var passphraseInput;
	var passphraseEyeDiv;
	var passphraseVisible;
	var bip38Div;
	var bip38Checkbox;
	var hasError;
	var inputChangeListeners;
	var usePassphraseListeners;
	var formErrorChangeListeners;

	this.render = function(onDone) {
		
		// init
		div.empty();
		div.addClass("editor_passphrase_div flex_horizontal flex_align_center flex_justify_start");
		hasError = false;
		inputChangeListeners = [];
		usePassphraseListeners = [];
    formErrorChangeListeners = [];
		
		// passphrase checkbox
		var passphraseTooltipTxt = "<p>Encrypts generated <a target='_blank' href='index.html#faq_keypair'>keypairs</a> with a passphrase.  The passphrase is required in order to decrypt private keys and access funds.</p>" +
															 "<p>The passphrase must be at least 7 characters.</p>" +
															 "<p><a target='_blank' href='index.html#faq_encrypt'>How are keypairs encrypted?</a></p>";
		passphraseCheckbox = new CheckboxController($("<div>").appendTo(div), "Use Passphrase?", passphraseTooltipTxt);
		passphraseCheckbox.render();
		
		// column for passphrase inputs
		var passphraseInputVertical = $("<div class='editor_passphrase_vertical flex_vertical flex_justify_center'>").appendTo(div);
		
		// passphrase input
		var passphraseInputDiv = $("<div class='flex_horizontal flex_align_center'>").appendTo(passphraseInputVertical);
		passphraseInput = $("<input type='password' class='editor_passphrase_input'>").appendTo(passphraseInputDiv);
		passphraseEyeDiv = $("<div class='editor_passphrase_eye_div flex_horizontal flex_align_center'>").appendTo(passphraseInputDiv);
		
		// bip38 checkbox
		bip38Div = $("<div class='editor_bip38_div'>").appendTo(passphraseInputVertical);
		var bip38Tooltip = "<a target='_blank' href='https://github.com/bitcoin/bips/blob/master/bip-0038.mediawiki'>BIP38</a> is a standard for encrypting cryptocurrency keypairs which is designed to be resilient against brute-force passphrase cracking.<br><br>" +
		 									 "BIP38 requires significantly more time and energy to encrypt and decrypt private keys than the default, <a target='_blank' href='https://github.com/brix/crypto-js'>CryptoJS</a>.";
		bip38Checkbox = new CheckboxController(bip38Div, "Use BIP38 for BTC & BCH", bip38Tooltip);
		bip38Checkbox.render();
		bip38Div.hide();
		
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
		
		// register callbacks
		passphraseInput.on("input", function(e) {
		  if (!$(document.activeElement).is('input')) return;	// fix IE infinite loop caused by setting placeholder in update() which triggers input event
		  setFormError(false);
		  invoke(inputChangeListeners);
		});
		passphraseCheckbox.onChecked(function(e) {
      setFormError(false);
      invoke(usePassphraseListeners);
      invoke(inputChangeListeners);
      if (passphraseCheckbox.isChecked()) passphraseInput.focus();
      else that.setPassphraseVisible(false);
		});
		bip38Checkbox.onChecked(function() { invoke(inputChangeListeners); });
		
		// listen for actions when editor ready
		editorController.onReady(function() {
			editorController.onSetCurrentPieces(update);
			editorController.getContentController().getActionsController().onGenerate(validate);
			editorController.getContentController().getActionsController().onApply(validate);
			editorController.getContentController().getActionsController().onReset(reset);
			editorController.getContentController().onInputChange(update);
			editorController.onGenerate(function(isQuick) {
				if (!isQuick) setEnabled(false);
			});
			update();
		});
		
		// initial state
		reset();
		setEnabled(false);
		
		// done
		if (onDone) onDone(div);
	}
	
	this.hasFormError = function() {
		return hasError;
	}
	
	this.onFormErrorChange = function(listener) {
		assertFunction(listener);
		formErrorChangeListeners.push(listener);
	}
	
	this.onUsePassphraseChange = function(listener) {
		assertFunction(listener);
		usePassphraseListeners.push(listener);
	}
	
	this.getUsePassphrase = function() {
		return passphraseCheckbox.isChecked();
	}
	
	this.setUsePassphrase = function(checked) {
		passphraseCheckbox.setChecked(checked);
	}
	
	this.onInputChange = function(listener) {
	  assertFunction(listener);
	  inputChangeListeners.push(listener);
	}
	
	this.setPassphraseVisible = function(bool) {
		passphraseVisible = bool;
		var visibleImg = passphraseVisible ? $("<img src='img/visible.png'>") : $("<img src='img/visible_false.png'>");
		visibleImg.addClass("editor_passphrase_eye_img");
		if (passphraseEyeDiv.children().length > 0) passphraseEyeDiv.children().replaceWith(visibleImg);
		else passphraseEyeDiv.append(visibleImg);
		passphraseInput.attr("type", passphraseVisible ? "text" : "password");
	}
	
	this.isPassphraseVisible = function() {
		return passphraseVisible;
	}
	
	this.getPassphrase = function() {
		return passphraseInput.val();
	}
	
	this.setPassphrase = function(passphrase) {
		passphraseInput.val(passphrase);
	}
	
	this.setBip38Visible = function(bool) {
		bool ? bip38Div.show() : bip38Div.hide();
	}
	
	this.getBip38Checkbox = function() {
		return bip38Checkbox;
	}
	
	// --------------------------------- PRIVATE --------------------------------
	
	function update() {
		
		// enable passphrase unless divided or encrypted imported piece
		if (!editorController.getImportedPieces() || (editorController.getImportedPieces()[0].isDivided() === false && editorController.getImportedPieces()[0].isEncrypted() === false)) {
			setEnabled(true);
			var bip38Visible = false;
			if (that.getUsePassphrase()) {
			  
			  // passphrase placeholder
			  passphraseInput.attr("placeholder", PLACEHOLDER);
			
				// look for bip38 in imported piece
				if (editorController.getImportedPieces()) {
					for (var i = 0; i < editorController.getImportedPieces()[0].getKeypairs().length; i++) {
						if (arrayContains(editorController.getImportedPieces()[0].getKeypairs()[i].getPlugin().getEncryptionSchemes(), AppUtils.EncryptionScheme.BIP38)) {
							bip38Visible = true;
							break;
						}
					}
				}
				
				// else look for bip38 in crypto inputs
				else if (that.getUsePassphrase()) {
					var currencyInputs = editorController.getContentController().getCurrenciesController().getCurrencyInputs();
					for (var i = 0; i < currencyInputs.length; i++) {
						if (!currencyInputs[i].getSelectedPlugin()) continue;
						if (arrayContains(currencyInputs[i].getSelectedPlugin().getEncryptionSchemes(), AppUtils.EncryptionScheme.BIP38)) {
							bip38Visible = true;
							break;
						}
					}
				}
			} else {
			  passphraseInput.removeAttr("placeholder");
			  passphraseInput.val("");
			}
			
			// set bip38 visibility
			that.setBip38Visible(bip38Visible);
		}
		
		// remove form errors
		if (!hasError) {
			passphraseInput.removeClass("form_input_error_div");
			passphraseInput.get(0)._tippy.hide();
		}
	}
	
	function setEnabled(bool) {
		assertBoolean(bool);
		passphraseCheckbox.setEnabled(bool);
		bip38Checkbox.setEnabled(bool);
		passphraseEyeDiv.unbind("click");
		if (bool && passphraseCheckbox.isChecked()) {
			passphraseInput.removeAttr("disabled");
			passphraseEyeDiv.removeClass("editor_passphrase_eye_div_disabled");
			passphraseEyeDiv.click(function() { that.setPassphraseVisible(!that.isPassphraseVisible()); });
		} else {
			passphraseInput.attr("disabled", "disabled");
			passphraseEyeDiv.addClass("editor_passphrase_eye_div_disabled");
		}
	}
	
	function validate() {
		var err = that.getUsePassphrase() && that.getPassphrase().length < AppUtils.MIN_PASSPHRASE_LENGTH;
		if (err) {
			passphraseInput.addClass("form_input_error_div");
			passphraseInput.focus();
			setImmediate(function() { passphraseInput.get(0)._tippy.show(); });	// initial click causes tooltip to hide, so wait momentarily
		}
		setFormError(err);
	}
	
	function setFormError(_hasError) {
		var change = hasError !== _hasError;
		hasError = _hasError;
		update();
		if (change) invoke(formErrorChangeListeners, hasError);
	}
	
	function reset() {
		passphraseCheckbox.setChecked(false);
		bip38Checkbox.setChecked(false);
		passphraseInput.val("");
		that.setPassphraseVisible(false);
		validate();
		update();
	}
}
inheritsFrom(EditorPassphraseController, DivController);

/**
 * Controls divide input and validation.
 * 
 * @param div is the div to render to
 * @param editorController is the top-level editor controller
 */
function EditorDivideController(div, editorController) {
	DivController.call(this, div);
	
	var that = this;
	var divideCheckbox;
	var divideInput;
	var numPartsInput;
	var numPartsLabelTop;
	var numPartsLabelBottom;
  var numPartsVal;
	var minPartsInput;
	var minPartsLabelTop;
	var minPartsLabelBottom;
	var minPartsVal;
	var hasError;
	var inputChangeListeners;
	var useDivideListeners;
	var formErrorChangeListeners;
	
	this.render = function(onDone) {
		
		// init
		div.empty();
		div.addClass("editor_divide_div flex_horizontal flex_align_center flex_justify_start");
		hasError = false;
		inputChangeListeners = [];
    useDivideListeners = [];
		formErrorChangeListeners = [];
		
		// divide input
		divideCheckbox = new CheckboxController($("<div>").appendTo(div), "Divide Keypairs?", UiUtils.getDivideDescription(true)).render();
		var divideQr = $("<img class='divide_qr' src='img/qr_code.png'>").appendTo(div);
		var divideLines3 = $("<img class='divide_lines_3' src='img/divide_lines_3.png'>").appendTo(div);
		var divideNumDiv = $("<div class='divided_input_div flex_vertical flex_align_center flex_justify_start'>").appendTo(div);
		numPartsLabelTop = $("<div class='divide_config_label divide_config_label_top'>").appendTo(divideNumDiv);
		numPartsLabelTop.html("Divide Into");
		numPartsInput = $("<input class='divide_input' type='tel' min='2'>").appendTo(divideNumDiv);
		numPartsLabelBottom = $("<div class='divide_config_label divide_config_label_bottom'>").appendTo(divideNumDiv);
		numPartsLabelBottom.html("Parts");
		var divideLines2 = $("<img class='divide_lines_2' src='img/divide_lines_2.png'>").appendTo(div);
		var divideMinDiv = $("<div class='divided_input_div flex_vertical flex_align_center flex_justify_start'>").appendTo(div);
		minPartsLabelTop = $("<div class='divide_config_label divide_config_label_top'>").appendTo(divideMinDiv);
		minPartsLabelTop.html("Require");
		minPartsInput = $("<input class='divide_input' type='tel' min='2'>").appendTo(divideMinDiv);
		minPartsLabelBottom = $("<div class='divide_config_label divide_config_label_bottom'>").appendTo(divideMinDiv);
		minPartsLabelBottom.html("To Recover");		
		
		// register inputs
		divideCheckbox.onChecked(function(event, isChecked) {
			setFormError(false);
			if (isChecked) {
			  numPartsInput.focus();
        numPartsInput.val(numPartsVal);
        minPartsInput.val(minPartsVal);
      } else {
        numPartsVal = numPartsInput.val();
        minPartsVal = minPartsInput.val();
        numPartsInput.val("");
        minPartsInput.val("");
      }
	    invoke(useDivideListeners);
	    invoke(inputChangeListeners);
		});
		numPartsInput.on("input", function(e) { validate(true); invoke(inputChangeListeners); });
		numPartsInput.on("focusout", function(e) { validate(false);});
		minPartsInput.on("input", function(e) { validate(true); invoke(inputChangeListeners); });
		minPartsInput.on("focusout", function(e) { validate(false); });
		
		// listen for actions when editor ready
		editorController.onReady(function() {
			editorController.onSetCurrentPieces(update);
			editorController.getContentController().getActionsController().onGenerate(validate);
			editorController.getContentController().getActionsController().onApply(validate);
			editorController.getContentController().getActionsController().onReset(reset);
			editorController.getContentController().onInputChange(update);
			editorController.onGenerate(function(isQuick) {
				if (!isQuick) setEnabled(false);
			});
			update();
		});
		
		// initial state
		reset();
		setEnabled(false);
		
		// done
		if (onDone) onDone(div);
	}
	
	this.hasFormError = function() {
		return hasError;
	}
	
	this.onFormErrorChange = function(listener) {
		assertFunction(listener);
		formErrorChangeListeners.push(listener);
	}
	
	this.hasFormError = function() {
		return hasError;
	}
	
	this.onUseDividedChange = function(listener) {
		assertFunction(listener);
		useDivideListeners.push(listener);
	}
	
	this.getUseDivided = function() {
		return divideCheckbox.isChecked();
	}
	
	this.setUseDivided = function(bool) {
		divideCheckbox.setChecked(bool);
  }
	
	this.onInputChange = function(listener) {
	  assertFunction(listener);
	  inputChangeListeners.push(listener);
	}
	
	this.getNumPieces = function() {
		var numParts = Number(numPartsInput.val());
		if (!isInt(numParts)) return null;
		return numParts;
	}
	
	this.setNumPieces = function(numParts) {
		numPartsInput.val(numParts);
	}
	
	this.getMinParts = function() {
		var minParts = Number(minPartsInput.val());
		if (!isInt(minParts)) return null;
		return minParts;
	}
	
	this.setMinPieces = function(minParts) {
		minPartsInout.val(minParts);
	}
	
	// -------------------------------- PRIVATE ---------------------------------
	
	function setEnabled(bool) {
		divideCheckbox.setEnabled(bool);
		if (!bool || !that.getUseDivided()) {
			numPartsInput.attr("disabled", "disabled");
	    numPartsLabelTop.addClass("disabled");
	    numPartsLabelBottom.addClass("disabled");
			minPartsInput.attr("disabled", "disabled");
			minPartsLabelTop.addClass("disabled");
      minPartsLabelBottom.addClass("disabled");
		} else {
			numPartsInput.removeAttr("disabled");
			numPartsLabelTop.removeClass("disabled");
      numPartsLabelBottom.removeClass("disabled");
			minPartsInput.removeAttr("disabled");
			minPartsLabelTop.removeClass("disabled");
      minPartsLabelBottom.removeClass("disabled");
		}
	}
	
	function update() {
	
	  // remove form errors
    if (!hasError) {
      numPartsInput.removeClass("form_input_error_div");
      minPartsInput.removeClass("form_input_error_div");
    }
		
		// enable if no imported pieces or the imported pieces are undivided
    if (!editorController.getImportedPieces() || editorController.getImportedPieces()[0].isDivided() === false) {
      setEnabled(true);
    } else {
      setEnabled(false);
    }
	}

	function reset() {
		divideCheckbox.setChecked(false);
		numPartsVal = 3;
		minPartsVal = 2;
		validate();
		update();
	}
	
	function setFormError(_hasError) {
		var change = hasError !== _hasError;
		hasError = _hasError;
		update();
		if (change) invoke(formErrorChangeListeners, hasError);
	}
	
	function validate(lenientBlankAndRange) {
		var err = false;
		if (that.getUseDivided()) {
			
			// validate num pieces
			var numParts = Number(numPartsInput.val());
			if (lenientBlankAndRange) {
				if (!numPartsInput.val() || (isInt(numParts) && numParts >= 0)) {
					numPartsInput.removeClass("form_input_error_div");
				} else {
					err = true;
					numPartsInput.addClass("form_input_error_div");
				}
			} else {
				if (numPartsInput.val() && isInt(numParts) && numParts >= 2 && numParts <= AppUtils.MAX_PARTS) {
					numPartsInput.removeClass("form_input_error_div");
				} else {
					err = true;
					numPartsInput.addClass("form_input_error_div");
				}
			}
			
			// validate min pieces
			var minParts = Number(minPartsInput.val());
			if (lenientBlankAndRange) {
				if (!minPartsInput.val() || (isInt(minParts) && minParts >= 0)) {
					minPartsInput.removeClass("form_input_error_div");
				} else {
					err = true;
					minPartsInput.addClass("form_input_error_div");
				}
			} else {
				if (minPartsInput.val() && isInt(minParts) && minParts >= 2 && minParts <= AppUtils.MAX_PARTS && (err || minParts <= numParts)) {
					minPartsInput.removeClass("form_input_error_div");
				} else {
					err = true;
					minPartsInput.addClass("form_input_error_div");
				}
			}
		}
		setFormError(err);
	}
}
inheritsFrom(EditorDivideController, DivController);

/**
 * Controls the editor paginator.
 * 
 * @param div is the div to render to
 * @param editorController is the top-level editor
 */
function EditorPaginatorController(div, editorController) {
	DivController.call(this, div);
	
	var that = this;
	var paginator;
	var pieceLabel;
	var clickListeners;
	
	this.render = function(onDone) {
		div.empty();
		div.addClass("editor_control_link flex_vertical flex_align_center");
		clickListeners = [];
		updatePaginator();
		that.setEnabled(false);
		editorController.onReady(function() { updatePaginator(); });
		editorController.onSetCurrentPieces(function() { updatePaginator(); });
		editorController.onGenerate(function() { that.setEnabled(false); });
		if (onDone) onDone();
	}
	
	this.setEnabled = function(bool) {
		if (!paginator) return;
		paginator.setEnabled(bool);
		if (bool) piecesLabel.removeClass("disabled");
		else piecesLabel.addClass("disabled");
	}
	
	/**
	 * Invokes listener(index, label) when a label is clicked.
	 */
	this.onClick = function(listener) {
		assertFunction(listener);
		clickListeners.push(listener);
	}
	
	// --------------------------------- PRIVATE --------------------------------
	
	function updatePaginator() {
		div.empty();
		paginator = null;
		piecesLabel = null;
		var partNums = getPartNums();
		if (partNums.length > 1) {
			paginator = new PaginatorController($("<div>").appendTo(div), partNums);
			paginator.render();
			paginator.onClick(function(index, label) { invoke(clickListeners, index, label); });
			piecesLabel = $("<div class='editor_part_selection_label'>").appendTo(div);
			piecesLabel.html("Part");
			div.show();
		} else {
			div.hide();
		}
	}
	
	function getPartNums() {
		var partNums = [];
		var currentPieces = editorController.getCurrentPieces();
		var config = editorController.getInitConfig();
		if (currentPieces && currentPieces.length > 1) {
			for (var i = 0; i < currentPieces.length; i++) partNums.push(currentPieces[i].getPartNum());
		} else if (config.pieces && config.pieces.length > 1) {
			for (var i = 0; i < config.pieces.length; i++) partNums.push(config.pieces[i].getPartNum());
		} else if (config.genConfig && isDefined(config.genConfig.numParts) && config.genConfig.numParts > 1) {
			for (var i = 0; i < config.genConfig.numParts; i++) partNums.push(i + 1);
		}
		return partNums;
	}
}
inheritsFrom(EditorPaginatorController, DivController)

/**
 * Manages a single currency input.
 * 
 * @param div is the div to render to
 * @param plugins are crypto plugins to select from
 * @param defaultTicker is the ticker of the initial selected currency
 * @param defaultNumKeys is the number of keys in the initial selected currency
 */
function EditorCurrencyController(div, plugins, defaultTicker, defaultNumKeys) {
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
	var hasError;
	var currencyError;
	var numKeysError;
	var inputChangeListeners;
	var deleteListeners;
	var formErrorChangeListeners;
	
	this.render = function(onDone) {
		
		// init
		div.empty();
		div.attr("class", "currency_input_div flex_horizontal width_100");
		hasError = false;
		currencyError = false;
		numKeysError = false;
		inputChangeListeners = [];
		deleteListeners = [];
		formErrorChangeListeners = [];
		
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
		that.setSelectedCurrency(null);
		
		// create right div
		var rightDiv = $("<div class='currency_input_right_div'>").appendTo(div);
		rightDiv.append("Keypairs to generate&nbsp;&nbsp;");
		numKeysInput = $("<input class='num_keys_input' type='tel' value='1' min='1'>").appendTo(rightDiv);
		numKeysInput.on("input", function(e) {
		  invoke(inputChangeListeners);
		  validateNumKeys(true);
		});
		numKeysInput.on("focusout", function(e) { validateNumKeys(false); });
		rightDiv.append("&nbsp;&nbsp;");
		trashDiv = $("<div class='trash_div'>").appendTo(rightDiv);
		trashDiv.click(function() { invoke(deleteListeners); });
		trashImg = $("<img class='trash_img' src='img/trash.png'>").appendTo(trashDiv);
		
		// set default state
		if (defaultTicker) that.setSelectedCurrency(defaultTicker);
		if (defaultNumKeys) that.setNumKeys(defaultNumKeys);
		
		// done
		if (onDone) onDone(div);
	};
	
	this.onInputChange = function(listener) {
	  assertFunction(listener);
	  inputChangeListeners.push(listener);
	}
	
	this.onDelete = function(listener) {
		assertFunction(listener);
		deleteListeners.push(listener);
	}
	
	this.onFormErrorChange = function(listener) {
		assertFunction(listener);
		formErrorChangeListeners.push(listener);
	}
	
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
					invoke(inputChangeListeners, ticker);
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
					invoke(inputChangeListeners, ticker);
					validateCurrency();
					break;
				}
			}
		}
	};
	
	this.getNumKeys = function() {
		var numKeys = Number(numKeysInput.val());
		return isInt(numKeys) ? numKeys : null;
	};
	
	this.setNumKeys = function(numKeys) {
		assertNumber(numKeys);
		numKeysInput.val(numKeys);
	}
	
	this.setTrashEnabled = function(enabled) {
		trashDiv.unbind("click");
		if (enabled) {
			trashDiv.click(function() { invoke(deleteListeners); });
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
		return hasError;
	};
	
	/**
	 * Validates the currency input.
	 */
	this.validate = function() {
		validateCurrency();
		validateNumKeys(false);
	};
	
	// -------------------------------- PRIVATE ---------------------------------
	
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
			if (numKeys && numKeys >= 1) {
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
		var lastError = hasError;
		hasError = currencyError || numKeysError;
		if (!currencyError && numKeysError !== lastError) invoke(formErrorChangeListeners, hasError);	// notify of form error change
	}
}
inheritsFrom(EditorCurrencyController, DivController);

/**
 * Manages a collection of currency inputs.
 * 
 * @param div is the div to render to
 * @param plugins are crypto plugins to select from
 */
function EditorCurrenciesController(div, plugins) {
	DivController.call(this, div);
	
	// state variables
	var that = this;
	var currencyInputsDiv;
	var currencyInputs;
	var hasError;
	var formErrorChangeListeners;
	var inputChangeListeners;
	
	this.render = function(onDone) {
		
		// init
		div.empty();
		div.css("width", "100%");
		currencyInputs = [];
		hasError = false;
		formErrorChangeListeners = [];
		inputChangeListeners = [];
		
		// one of each link
		if (AppUtils.DEV_MODE) {
			var linksDiv = $("<div style='margin-top:-24px;' class='flex_horizontal flex_justify_end'>").appendTo(div);
			var oneOfEachLink = $("<div class='form_link'>").appendTo(linksDiv);
			oneOfEachLink.html("One of each");
			oneOfEachLink.click(function() {
				that.empty();
				for (var i = 0; i < plugins.length; i++) that.add(plugins[i].getTicker());
				that.validate();
			});
		}
		
		// currency inputs div
		currencyInputsDiv = $("<div class='currency_inputs_div'>").appendTo(div);
		
		// add another currency link
		var addCurrencyDiv = $("<div class='add_currency_div'>").appendTo(div);
		var addCurrencySpan = $("<span class='add_currency_span'>").appendTo(addCurrencyDiv);
		addCurrencySpan.html("+ Add another currency");
		addCurrencySpan.click(function() { that.add(); });
		
		// initial state
		that.reset();
		
		// done
		if (onDone) onDone();
	};
	
	this.getCurrencyInputs = function() {
		return currencyInputs;
	};
	
	this.add = function(ticker, numKepairs) {
		var currencyInput = new EditorCurrencyController($("<div>"), plugins, ticker, numKepairs)
		currencyInput.render();
		currencyInput.onInputChange(function() { invoke(inputChangeListeners); });
		currencyInput.onDelete(function() { remove(currencyInput); });
		currencyInput.onFormErrorChange(updateFormError);
		currencyInput.getDiv().appendTo(currencyInputsDiv);
		currencyInputs.push(currencyInput);
		currencyInputs[0].setTrashEnabled(currencyInputs.length !== 1);
		assertArray(inputChangeListeners);
		invoke(inputChangeListeners, ticker);
	};
	
	this.onFormErrorChange = function(listener) {
		assertFunction(listener);
		formErrorChangeListeners.push(listener);
	}
	
	this.onInputChange = function(listener) {
		assertFunction(listener);
		inputChangeListeners.push(listener);
	}
	
	this.hasFormError = function() {
		return hasError;
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
		updateFormError();
		invoke(inputChangeListeners);
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
				numKeypairs: currencyInputs[i].getNumKeys()
			});
		}
		return config;
	};
	
	/**
	 * Sets the configuration.
	 * 
	 * @param config is an array of currencies to set for the currency inputs in the format [{ticker: "BCH", numKeypairs: 2}, {...}]
	 */
	this.setConfig = function(configKeypairs) {
		assertArray(configKeypairs);
		assertTrue(configKeypairs.length > 0);
		that.empty();
		for (var i = 0; i < configKeypairs.length; i++) {
			that.add(configKeypairs[i].ticker, configKeypairs[i].numKeypairs);
		}
	}
	
	/**
	 * Indicates if any of the given cryptos are selected.
	 */
	this.hasCurrenciesSelected = function(tickers) {
		tickers = listify(tickers);
		assertTrue(tickers.length > 0);
		for (var i = 0; i < currencyInputs.length; i++) {
			for (var j = 0; j < tickers.length; j++) {
				if (currencyInputs[i].getSelectedPlugin() && currencyInputs[i].getSelectedPlugin().getTicker() === tickers[j]) return true;
			}
		}
		return false;
	};
	
	//---------------------- PRIVATE ------------------------
	
	function remove(currencyInput) {
		var idx = currencyInputs.indexOf(currencyInput);
		if (idx < 0) throw new Error("Could not find currency input");
		var hasErrorBeforeRemoved = that.hasFormError();
		currencyInputs.splice(idx, 1);
		currencyInputs[0].setTrashEnabled(currencyInputs.length !== 1);
		currencyInput.getDiv().remove();
		updateFormError();
		invoke(inputChangeListeners);
	}
	
	function updateFormError() {
		var lastError = hasError;
		hasError = false;
		for (var i = 0; i < currencyInputs.length; i++) {
			if (currencyInputs[i].hasFormError()) {
				hasError = true;
				break;
			}
		}
		if (hasError !== lastError) invoke(formErrorChangeListeners, hasError);
	}
}
inheritsFrom(EditorCurrenciesController, DivController);

/**
 * Editor actions controller.
 * 
 * @param div is the div to render to
 * @param editorController is the top-level controller
 */
function EditorActionsController(div, editorController) {
	DivController.call(this, div);
	
	var that = this;
	var btnGenerate;
	var btnApply;
	var btnReset;
	var btnCancel;
	var savePrintDiv;
	var btnSave;
	var btnPrint;
	var lastGenerateConfig;
	var generateListeners;
	var applyLiseners;
	var resetListeners;
	var cancelListeners;
	var saveListeners;
	var printListeners;
	
	this.render = function(onDone) {
		
		// init
		div.empty();
		div.addClass("editor_controls");
		generateListeners = [];
		applyListeners = [];
		resetListeners = [];
		cancelListeners = [];
		saveListeners = [];
		printListeners = [];
		
		// generate button
		btnGenerate = $("<div class='editor_btn_green flex_horizontal flex_justify_center user_select_none'>").appendTo(div);
		
		// apply button
		btnApply = $("<div class='editor_btn_green flex_horizontal flex_justify_center user_select_none'>").appendTo(div)
		btnApply.html("Apply");
		
		// reset button
		btnReset =  $("<div class='editor_btn_red flex_horizontal flex_justify_center user_select_none'>");
		btnReset.append("Reset");
		btnReset.appendTo(div);
		btnReset.click(function() {
	    var confirmMsg = editorController.getImportedPieces() ? "Discard changes to the imported keypairs?" : "Discard the generated keypairs?";
	    if (AppUtils.DEV_MODE || !editorController.newPiecesGenerated() || confirm(confirmMsg)) {
	      invoke(resetListeners);
	    }
		});
		
		// cancel button
		btnCancel =  $("<div class='editor_btn_red flex_horizontal flex_justify_center user_select_none'>");
		btnCancel.append("Cancel");
		btnCancel.click(function() { invoke(cancelListeners); });
		btnCancel.appendTo(div);
		
		// save and print buttons
		savePrintDiv = $("<div class='flex_horizontal width_100'>");
		btnSave = $("<div class='editor_btn_blue flex_horizontal flex_justify_center user_select_none'>").appendTo(savePrintDiv);
		btnSave.append("Save");
		btnSave.click(function() { invoke(saveListeners) });
		$("<div style='width:30px;'>").appendTo(savePrintDiv);
		btnPrint = $("<div class='editor_btn_blue flex_horizontal flex_justify_center user_select_none'>").appendTo(savePrintDiv);
		btnPrint.append("Print");
		btnPrint.click(function() { invoke(printListeners); });
		savePrintDiv.appendTo(div);
		
		// register callbacks
		editorController.onSetCurrentPieces(function() {
		  lastGenerateConfig = getInputGenerateConfig();
		  update();
		});
		editorController.onFormErrorChange(update);
    editorController.getPassphraseController().onInputChange(update);
		editorController.getDivideController().onInputChange(update);
		if (editorController.getContentController().getCurrenciesController()) editorController.getContentController().getCurrenciesController().onInputChange(update);
		editorController.onGenerate(function(isQuick) {
			if (isQuick) return;
			btnCancel.show();
			btnGenerate.hide();
			btnApply.hide();
			btnReset.hide();
			savePrintDiv.hide()
		});
		
		// initial state
		update();
		
		// done rendering
		if (onDone) onDone();
	}
	
	this.onGenerate = function(listener) {
		assertFunction(listener);
		generateListeners.push(listener);
	}
	
	this.onApply = function(listener) {
		assertFunction(listener);
		applyListeners.push(listener);
	}
	
	this.onReset = function(listener) {
		assertFunction(listener);
		resetListeners.push(listener);
	}
	
	this.onCancel = function(listener) {
		assertFunction(listener);
		cancelListeners.push(listener);
	}
	
	this.onSave = function(listener) {
		assertFunction(listener);
		saveListeners.push(listener);
	}
	
	this.onPrint = function(listener) {
		assertFunction(listener);
		printListeners.push(listener);
	}
	
	// ------------------------------ PRIVATE -----------------------------
	
	function update() {
		btnCancel.hide();
		
		// determine if editor is in initial state
    var isReset = editorController.isReset();
	  
		// determine if configuration has changed since last time generate button clicked
    var generateConfigChanged = false;
    var generateConfig = getInputGenerateConfig();
    generateConfigChanged = !equals(generateConfig, lastGenerateConfig);
		
		// show reset button iff user input
		isReset ? btnReset.hide() : btnReset.show();
		
		// handle no imported pieces
		if (!editorController.getImportedPieces()) {
			btnApply.hide();
			btnGenerate.html(editorController.newPiecesGenerated() ? "Regenerate" : "Generate");
			btnGenerate.show();
			btnGenerate.unbind("click");
			btnGenerate.removeClass("editor_btn_green_pulse");
			if (editorController.hasFormError()) {
				btnGenerate.addClass("btn_disabled");
			} else {
				btnGenerate.removeClass("btn_disabled");
        if (generateConfigChanged) btnGenerate.addClass("editor_btn_green_pulse");
				btnGenerate.click(function() { invoke(generateListeners); });
			}
		}
		
		// handle imported pieces
		else {
			btnGenerate.hide();
			
			// apply shown iff passphrase or divided checked
			if (editorController.getPassphraseController().getUsePassphrase() || editorController.getDivideController().getUseDivided()) {
				btnApply.show()
				btnApply.unbind("click");
				btnApply.removeClass("editor_btn_green_pulse");
				if (editorController.hasFormError()) {
					btnApply.addClass("btn_disabled");
				} else {
					btnApply.removeClass("btn_disabled");
	        if (generateConfigChanged) btnApply.addClass("editor_btn_green_pulse");
					btnApply.click(function() { invoke(applyListeners); });
				}
			} else {
				btnApply.hide();
			}
		}
		
		// update save print buttons
		editorController.getCurrentPieces() ? savePrintDiv.show() : savePrintDiv.hide();
	}
	
	// --------------------------------- PRIVATE --------------------------------
	
	 function getInputGenerateConfig() {
	    var config = Object.assign(editorController.getGenerateConfig());
	    delete config.pieces;  // pieces are not part of user form input
	    return config;
	  }
}
inheritsFrom(EditorActionsController, DivController);

/**
 * Save controller.
 * 
 * @param div is the div to render to
 * @param pieces are the pieces to save
 */
function EditorSaveController(div, pieces) {
	DivController.call(this, div);
	
	// validate input
	assertArray(pieces);
	assertTrue(pieces.length > 0);
	assertObject(pieces[0], CryptoPiece);
	
	var that = this;
	var includePublicCheckbox;
	var includePrivateCheckbox;
	var saveAsDropdown;
	var saveBtn;
	var callbackFnSave;
	var callbackFnCancel;
	var saveBlob;
	var saveName;
	
	this.render = function(onDone) {
		
		// div setup
		div.empty();
		div.addClass("editor_popup_div flex_vertical flex_align_center")
		
		// header
		var header = $("<div class='editor_popup_header'>").appendTo(div);
		header.append("Save");
		
		// body
		var body = $("<div class='editor_popup_body'>").appendTo(div);
		
		// save as selector
		var selectorOptions = ["Save as JSON", "Save as CSV", "Save as TXT"];
		var ddslickData = [];
		for (var i = 0; i < selectorOptions.length; i++) ddslickData.push({text: selectorOptions[i]});
		var saveSelectorDiv = $("<div>").appendTo(body);
		var ddslickConfig = {data: ddslickData};
		saveAsDropdown = new DropdownController(saveSelectorDiv, ddslickConfig).render();
		
		// checkboxes
		var checkboxesDiv = $("<div class='editor_export_checkboxes flex_horizontal flex_justify_center'>").appendTo(body);
		includePublicCheckbox = new CheckboxController($("<div class='editor_export_input'>").appendTo(checkboxesDiv), "Save public addresses").render();
		includePrivateCheckbox = new CheckboxController($("<div class='editor_export_input'>").appendTo(checkboxesDiv), "Save private keys").render();
		includePublicCheckbox.setChecked(AppUtils.hasPublicAddresses(pieces));
		includePrivateCheckbox.setChecked(AppUtils.hasPrivateKeys(pieces));
		
		// cancel and save buttons
		var buttonsDiv = $("<div class='flex_horizontal flex_align_center'>").appendTo(body);
		var cancelBtn = $("<div class='editor_export_btn_red flex_horizontal flex_align_center flex_justify_center user_select_none'>").appendTo(buttonsDiv);
		cancelBtn.html("Cancel");
		cancelBtn.click(function() { if (callbackFnCancel) callbackFnCancel(); });
		buttonsDiv.append($("<div style='width:150px;'>"));
		saveBtn = $("<div class='editor_btn_green editor_export_btn_green flex_horizontal flex_align_center flex_justify_center user_select_none'>").appendTo(buttonsDiv);
		saveBtn.html("Save");
		
		// register changes
		includePublicCheckbox.onChecked(function() { update(); });
		includePrivateCheckbox.onChecked(function() { update(); });
		saveAsDropdown.onSelected(function(idx) { update(); });
		
		// initialize
		update();
		
		// done
		if (onDone) onDone(div);
		return that;
	}
	
	this.onSave = function(callbackFn) {
		callbackFnSave = callbackFn;
	}
	
	this.onCancel = function(callbackFn) {
		callbackFnCancel = callbackFn;
	}
	
	// -------------------------------- PRIVATE ---------------------------------
	
	function update(onDone) {
		
		// set checkboxes visibility and enabled
		includePrivateCheckbox.setEnabled(AppUtils.hasPublicAddresses(pieces) && AppUtils.hasPrivateKeys(pieces) && includePublicCheckbox.isChecked());
		includePublicCheckbox.setEnabled(AppUtils.hasPublicAddresses(pieces) && AppUtils.hasPrivateKeys(pieces) && includePrivateCheckbox.isChecked());
		if (!includePublicCheckbox.isEnabled() && !includePrivateCheckbox.isEnabled()) {
      includePublicCheckbox.setVisible(false);
		  includePrivateCheckbox.setVisible(false);
		}
		
		// disable save button
		setSaveEnabled(false);
		
		// transform pieces per configuration
		var transformedPieces = [];
		if (!includePrivateCheckbox.isChecked()) {
			assertTrue(includePublicCheckbox.isChecked());
			transformedPieces.push(pieces[0].copy().removePrivateKeys());
		} else {
			for (var i = 0; i < pieces.length; i++) {
				if (!includePublicCheckbox.isChecked()) {
					assertTrue(includePrivateCheckbox.isChecked());
					transformedPieces.push(pieces[i].copy().removePublicAddresses());
				} else {
					transformedPieces.push(pieces[i]);
				}
			}
		}
		
		// prepare save blob and name
		AppUtils.piecesToBlob(transformedPieces, getSelectedFileType(), function(err, blob, name) {
			assertNull(err);
			saveBlob = blob;
			saveName = name;
			setSaveEnabled(true);
			if (onDone) onDone();
		});
	}
	
	function save() {
		assertInitialized(saveBlob);
		assertInitialized(saveName);
		if (!includePrivateCheckbox.isChecked() && !confirm("Funds CANNOT be recovered from the saved file because the private keys are not included.\n\nContinue?")) return;
		saveAs(saveBlob, saveName);
		if (callbackFnSave) callbackFnSave();
	}
	
	function getSelectedFileType() {
		var selectedText = saveAsDropdown.getSelectedText();
		switch (selectedText) {
			case "Save as JSON": return AppUtils.FileType.JSON;
			case "Save as CSV": return AppUtils.FileType.CSV;
			case "Save as TXT": return AppUtils.FileType.TXT;
			default: throw new Error("Unrecognized save type selection: " + selectedText);
		}
	}
	
	function setSaveEnabled(bool) {
		if (bool) {
			saveBtn.removeClass("btn_disabled");
			saveBtn.unbind("click");
			saveBtn.click(function() { save(); });
		} else {
			saveBtn.addClass("btn_disabled");
		}
	}
}
inheritsFrom(EditorSaveController, DivController);

/**
 * Print controller.
 * 
 * @param div is the div to render to
 * @param are pieces to print
 */
function EditorPrintController(div, pieces) {
	DivController.call(this, div);
	
	// validate input
	assertArray(pieces);
	assertTrue(pieces.length > 0);
	
	var Layout = {
			STANDARD: "Standard Layout",
			GRID: "Grid Layout",
			TEXT: "Text Layout",
			CRYPTOCASH: "CryptoCash Layout"
	}
	
	var that = this;
	var layoutDropdown;
	var includePublicCheckbox;
	var includePrivateCheckbox;
	var includePublicRadio;
	var includePrivateRadio;
	var includeLogosCheckbox;
	var includeQrsCheckbox;
	var includeInstructionsCheckbox
	var printBtn;
	var previewDiv;					// panel for print preview
	var previewLoadDiv;			// covers print preview panel while loading
	var previewGenerator;		// generates preview
	var pieceRenderers;			// rendered pieces ready for print
	var pieceGenerator;			// generates rendered pieces
	var callbackFnPrint;
	var callbackFnCancel;
	
	this.render = function(onDone) {
		
		// div setup
		div.empty();
		div.addClass("editor_popup_div editor_print_div flex_vertical flex_align_center");
		div.css("min-width", "850px");
		
		// header
		var header = $("<div class='editor_popup_header'>").appendTo(div);
		header.append("Print");
		
		// body
		var body = $("<div class='editor_popup_body editor_print_body'>").appendTo(div);
		
		// layout selector
		var data = [];
		for (var prop in Layout) {
			if (Layout.hasOwnProperty(prop.toString())) {
				if (Layout[prop.toString()] === Layout.CRYPTOCASH && !cryptoCashApplies()) continue;	// skip cryptocash if not applicable
				data.push({text: Layout[prop.toString()]});
			}
		}
		layoutDropdown = new DropdownController($("<div>").appendTo(body), {data: data}).render();
		layoutDropdown.onSelected(function() { update(); });
		
		// checkboxes and radio buttons
		var inputsDiv = $("<div class='editor_export_checkboxes flex_horizontal flex_justify_center'>").appendTo(body);
		includePublicCheckbox = new CheckboxController($("<div class='editor_export_input'>").appendTo(inputsDiv), "Show public").render();
		includePrivateCheckbox = new CheckboxController($("<div class='editor_export_input'>").appendTo(inputsDiv), "Show private").render();
		includePublicRadio = new RadioController($("<div class='editor_export_input'>").appendTo(inputsDiv), "include_radios", "Show public").render();
		includePrivateRadio = new RadioController($("<div class='editor_export_input'>").appendTo(inputsDiv), "include_radios", "Show private").render();
		includeLogosCheckbox = new CheckboxController($("<div class='editor_export_input'>").appendTo(inputsDiv), "Show logos").render();
		includeQrsCheckbox = new CheckboxController($("<div class='editor_export_input'>").appendTo(inputsDiv), "Show QRs").render();
		if (cryptoCashApplies()) {
			includeInstructionsCheckbox = new CheckboxController($("<div class='editor_export_input'>").appendTo(inputsDiv), "Print Instructions (Two Sided)").render();
		}
		
		// print preview
		previewDiv = $("<div class='editor_print_preview flex_horizontal flex_align_center flex_justify_center'>").appendTo(body);
		previewLoadDiv = $("<div class='editor_print_load flex_horizontal flex_align_center flex_justify_center'>").appendTo(previewDiv);
		previewLoadDiv.append("<img src='img/loading.gif' class='loading'>");
		
		// initial state
		includePublicCheckbox.setChecked(AppUtils.hasPublicAddresses(pieces));
		includePrivateCheckbox.setChecked(AppUtils.hasPrivateKeys(pieces));
		if (AppUtils.hasPrivateKeys(pieces)) includePrivateRadio.setChecked(true);
		else includePublicRadio.setChecked(true);
		includeLogosCheckbox.setChecked(true);
		includeQrsCheckbox.setChecked(true);
		if (cryptoCashApplies()) includeInstructionsCheckbox.setChecked(true);
		
		// cancel and print buttons
		var buttonsDiv = $("<div class='flex_horizontal flex_align_center'>").appendTo(body);
		var cancelBtn = $("<div class='editor_export_btn_red flex_horizontal flex_align_center flex_justify_center user_select_none'>").appendTo(buttonsDiv);
		cancelBtn.html("Cancel");
		cancelBtn.click(function() { if (callbackFnCancel) callbackFnCancel(); });
		buttonsDiv.append($("<div style='width:150px;'>"));
		printBtn = $("<div class='editor_btn_green editor_export_btn_green flex_horizontal flex_align_center flex_justify_center user_select_none'>").appendTo(buttonsDiv);
		printBtn.html("Print");
		
		// register changes
		includePublicCheckbox.onChecked(function() { update(); });
		includePrivateCheckbox.onChecked(function() { update(); });
		includePublicRadio.onChecked(function() { update(); });
		includePrivateRadio.onChecked(function() { update(); });
		includeLogosCheckbox.onChecked(function() { update(); });
		includeQrsCheckbox.onChecked(function() { update(); });
		if (cryptoCashApplies()) {
			includeInstructionsCheckbox.onChecked(function() { update(); });
		}
		
		// initialize
		update();
		
		// done
		if (onDone) onDone(div);
		return that;
	}
	
	this.onPrint = function(callbackFn) {
		callbackFnPrint = callbackFn;
	}
	
	this.onCancel = function(callbackFn) {
		callbackFnCancel = callbackFn;
	}
	
	this.destroy = function() {
	  if (pieceGenerator) pieceGenerator.destroy();
	  div.remove();
	}
	
	// -------------------------------- PRIVATE ---------------------------------
	
	function setRenderProgress(percent, label) {
		previewLoadDiv.show();
	}
	
	function update(onDone) {
	  
	   // enable/disable checkboxes and radios
	  var hasPublicAndPrivate = AppUtils.hasPublicAddresses(pieces) && AppUtils.hasPrivateKeys(pieces);
    includePrivateCheckbox.setEnabled(hasPublicAndPrivate && includePublicCheckbox.isChecked());
    includePublicCheckbox.setEnabled(hasPublicAndPrivate && includePrivateCheckbox.isChecked());
    includePrivateRadio.setEnabled(hasPublicAndPrivate);
    includePublicRadio.setEnabled(hasPublicAndPrivate);
		
		// configure per layout
		var pieceRendererClass;
		var previewRendererClass
		switch (layoutDropdown.getSelectedText()) {
			case Layout.STANDARD:
				pieceRendererClass = StandardPieceRenderer;
				previewRendererClass = StandardPiecePreviewRenderer;
				includePrivateCheckbox.setVisible(includePublicCheckbox.isEnabled() || includePrivateCheckbox.isEnabled());
				includePublicCheckbox.setVisible(includePublicCheckbox.isEnabled() || includePrivateCheckbox.isEnabled());
				includePrivateRadio.setVisible(false);
				includePublicRadio.setVisible(false);
				includeLogosCheckbox.setVisible(true);
				includeQrsCheckbox.setVisible(false);
				if (includeInstructionsCheckbox) includeInstructionsCheckbox.setVisible(false);
				break;
			case Layout.GRID:
				pieceRendererClass = GridPieceRenderer;
				previewRendererClass = GridPiecePreviewRenderer;
				includePrivateCheckbox.setVisible(false);
				includePublicCheckbox.setVisible(false);
				includePrivateRadio.setVisible(includePublicRadio.isEnabled() || includePrivateRadio.isEnabled());
				includePublicRadio.setVisible(includePublicRadio.isEnabled() || includePrivateRadio.isEnabled());
				includeLogosCheckbox.setVisible(true);
				includeQrsCheckbox.setVisible(true);
				if (includeInstructionsCheckbox) includeInstructionsCheckbox.setVisible(false);
				break;
      case Layout.TEXT:
        pieceRendererClass = TextPieceRenderer;
        previewRendererClass = TextPiecePreviewRenderer;
        includePrivateCheckbox.setVisible(includePublicCheckbox.isEnabled() || includePrivateCheckbox.isEnabled());
        includePublicCheckbox.setVisible(includePublicCheckbox.isEnabled() || includePrivateCheckbox.isEnabled());
        includePrivateRadio.setVisible(false);
        includePublicRadio.setVisible(false);
        includeLogosCheckbox.setVisible(false);
        includeQrsCheckbox.setVisible(false);
        if (includeInstructionsCheckbox) includeInstructionsCheckbox.setVisible(false);
        break;
			case Layout.CRYPTOCASH:
				pieceRendererClass = StandardPieceRenderer;
				previewRendererClass = StandardPiecePreviewRenderer;
				includePrivateCheckbox.setVisible(false);
				includePublicCheckbox.setVisible(false);
				includePrivateRadio.setVisible(false);
				includePublicRadio.setVisible(false);
				includeLogosCheckbox.setVisible(false);
				includeQrsCheckbox.setVisible(false);
				if (includeInstructionsCheckbox) includeInstructionsCheckbox.setVisible(true);
				break;
			default: throw new Error("Unsupported layout: " + layoutDropdown.getSelectedText());
		}
		
		// disable print button
		setPrintEnabled(false);
		
		// get render config
		var renderConfig = getPrintRenderConfig();
		
		// transform pieces per configuration
		var transformedPieces = [];
		if (!renderConfig.showPrivate) {
			transformedPieces.push(pieces[0].copy().removePrivateKeys());
		} else {
			for (var i = 0; i < pieces.length; i++) {
				if (!renderConfig.showPublic) {
					transformedPieces.push(pieces[i].copy().removePublicAddresses());
				} else {
					transformedPieces.push(pieces[i]);
				}
			}
		}
		
		// preserve height if previous preview to reduce height bouncing
    if (previewGenerator) {
      previewDiv.css("height", previewDiv.get(0).offsetHeight);
      previewGenerator.destroy();
    }
		
		// render preview
		previewGenerator = new PieceGenerator({
			pieces: [transformedPieces[0]],
			pieceRendererClass: previewRendererClass,
			pieceRendererConfig: getPrintRenderConfig(true)
		});
		previewGenerator.generatePieces(null, function(err, _pieces, _previewRenderers) {
			assertNull(err);
			assertEquals(1, _previewRenderers.length);
			
			// render pieces
			pieceRenderers = undefined;
			if (pieceGenerator) pieceGenerator.destroy();
			pieceGenerator = new PieceGenerator({
				pieces: transformedPieces,
				pieceRendererClass: pieceRendererClass,
				pieceRendererConfig: renderConfig
			});
			pieceGenerator.generatePieces(setRenderProgress, function(err, _pieces, _pieceRenderers) {
				assertNull(err);
				previewDiv.children().replaceWith(previewLoadDiv);
				previewDiv.append(_previewRenderers[0].getDiv());
				previewDiv.css("height", "auto");
				previewLoadDiv.hide();
				pieceRenderers = _pieceRenderers;
				setPrintEnabled(true);
				if (onDone) onDone();
			});
		});
	}
	
	function getPrintRenderConfig(isPreview) {
		var config = {};
		config.pageBreaks = !isPreview;
		config.copyable = false;
		switch (layoutDropdown.getSelectedText()) {
			case Layout.STANDARD:
				config.showPublic = includePublicCheckbox.isChecked();
				config.showPrivate = includePrivateCheckbox.isChecked();
				config.showLogos = includeLogosCheckbox.isChecked();
				break;
			case Layout.GRID:
				config.showPublic = includePublicRadio.isChecked();
				config.showPrivate = includePrivateRadio.isChecked();
				config.showLogos = includeLogosCheckbox.isChecked();
				config.showQr = includeQrsCheckbox.isChecked();
				break;
      case Layout.TEXT:
        config.showPublic = includePublicCheckbox.isChecked();
        config.showPrivate = includePrivateCheckbox.isChecked();
        break;
			case Layout.CRYPTOCASH:
				config.showPublic = true;
				config.showPrivate = true;
				config.showLogos = true;
				config.infoBack = includeInstructionsCheckbox.isChecked();
				config.cryptoCash = true;
				break;
			default: throw new Error("Unsupported layout: " + layout.geSelectedText());
		}
		return config;
	}
	
	function cryptoCashApplies() {
		if (pieces.length !== 1) return false;
		if (pieces[0].isEncrypted() !== false) return false;
		return true;
	}
	
	function print() {
		assertInitialized(pieceRenderers);
		
		// confirm printing without private keys
		if ((layoutDropdown.getSelectedText() === Layout.STANDARD && !includePrivateCheckbox.isChecked() ||
		    layoutDropdown.getSelectedText() === Layout.TEXT && !includePrivateCheckbox.isChecked() ||
				layoutDropdown.getSelectedText() === Layout.GRID && !includePrivateRadio.isChecked()) && 
				!confirm("Funds CANNOT be recovered from the printed document because the private keys are not shown.\n\nContinue?")) {
			return;
		}

		// build print div
		var piecesDiv = $("<div class='pieces_div'>");
		for (var i = 0; i < pieceRenderers.length; i++) piecesDiv.append(pieceRenderers[i].getDiv());
		
		// open window with pieces
		newWindow({div: piecesDiv, title: "Print Keypairs", dependencyPaths: "css/style.css"}, function(err, window) {
			if (err) {
				AppUtils.setOpenWindowError(true);
				return;
			}
			window.focus();
			window.print();
		});
	}
	
	function setPrintEnabled(bool) {
    printBtn.unbind("click");
		if (bool) {
			printBtn.removeClass("btn_disabled");
			printBtn.click(function() { print(); });
		} else {
			printBtn.addClass("btn_disabled");
		}
	}
}
inheritsFrom(EditorPrintController, DivController);

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
		
		// assign notice color
		if (AppUtils.hasEnvironmentState("fail")) { config.showOnFail ? div.show() : div.hide(); div.addClass("notice_fail"); }
		else if (!AppUtils.hasEnvironmentState("warn")) { config.showOnPass ? div.show() : div.hide(); div.addClass("notice_pass"); }
		else {			
			config.showOnWarn ? div.show() : div.hide();
			
			// collect which states pass
			var offline = getEnvironmentState(info.checks, AppUtils.EnvironmentCode.INTERNET) === "pass";
			var local = getEnvironmentState(info.checks, AppUtils.EnvironmentCode.IS_LOCAL) === "pass";
			var browserOpen = getEnvironmentState(info.checks, AppUtils.EnvironmentCode.BROWSER) === "pass";
			var operatingSystemOpen = getEnvironmentState(info.checks, AppUtils.EnvironmentCode.OPERATING_SYSTEM) === "pass";
			function getEnvironmentState(checks, code) {
				for (var i = 0; i < checks.length; i++) {
					if (checks[i].code === code) return checks[i].state;
				}
			}
			
			// add styling
			if (!offline && !local) div.addClass("notice_warn_orange");
			else if (offline && local) div.addClass(browserOpen ? "notice_warn_light_green" : "notice_warn_light_orange");
			else div.addClass("notice_warn_light_orange");
		}
		
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
			div.addClass("notice_bar_left flex_horizontal flex_align_center flex_justify_start");
			div.css("min-width", width);
			div.css("max-width", width);
			for (var i = 0; i < info.checks.length; i++) {
				if (info.checks[i].state === "pass") continue;
				renderNoticeIcon($("<div>").appendTo(div), info, info.checks[i]);
			}
		}
		
		// render notice center
		function renderCenter(div, info) {
			div.addClass("notice_bar_center flex_horizontal flex_align_center flex_justify_center");
			renderCheckDescription(div, info, getFirstNonPassCheck(info));
		}
		
		// render notice right
		function renderRight(div, info) {
			div.addClass("notice_bar_right flex_horizontal flex_align_center flex_justify_end");
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
			renderCheckDescription(description, info, check, true);
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
		function renderCheckDescription(div, info, check, isTooltip) {
			
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
					if (check.state === "fail") {
						var errDiv = $("<div>");
						
						// title
						var msg = "An unexpected error occurred";
						if (isTooltip || !info.runtimeError.message) msg += ": " + info.runtimeError.toString();	// no additional stacktrace
						errDiv.append(msg);

						// stack trace
						if (!isTooltip && info.runtimeError.stack) {
							
							// submit an issue
              var submitIssue = $("<div style='margin:5px 0 5px 0; font-size:18px;'>Please let us know by <a style='font-size:18px; color:yellow;' target='_blank' href='" + AppUtils.GITHUB_NEW_ISSUE_URL + "'>submitting an issue</a> with the text below and a description of steps to recreate the error.</div>").appendTo(errDiv);
							
							// add stacktrace
							var stacktrace = $("<div class='notice_stacktrace'>").appendTo(errDiv);
							var stacktraceTxt = info.runtimeError.message + "<br>" + info.runtimeError.stack.replace(/\n/g, "<br/>");
							stacktrace.append(stacktraceTxt);
						}
						div.append(errDiv);
					}
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
						content.append("<div class='notice_bar_center_minor'>Recommended operating systems: " + UiUtils.TAILS_LINK + ", " + UiUtils.DEBIAN_LINK + ", or " + UiUtils.RASPBIAN_LINK + "</li>");
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
			renderer.getDiv().wrap("<div class='loading_div flex_vertical flex_align_center'>");	// wrap div with loading
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

/**
 * Renders a piece with standard keypairs.
 * 
 * @param div is the div to render to
 * @param piece is the piece to render
 * @param config specifies render configuration
 *        config.showLogos specifies if crypto logos should be shown
 *        config.showPublic specifies if public addresses should be shown
 *        config.showPrivate specifies if private keys should be shown
 *        config.cryptoCash specifies to space 6 keypairs per page with no cryptostorage logo
 *        config.infoBack specifies if double-sided sweep instructions should be included for crypto cash
 *        config.pageBreaks specifies if piece should be rendered as pages
 *        config.copyable specifies if the public/private values should be copyable
 *        config.scratchpadParent is a visible div to attach render scratchpads to so heights can be measured
 */
function StandardPieceRenderer(div, piece, config) {
	if (!div) div = $("<div>");
	DivController.call(this, div);
	assertObject(piece, CryptoPiece);
	
	// config default and validation
	config = Object.assign({
		showPublic: true,
		showPrivate: true,
		showLogos: true,
		cryptoCash: false,
		infoBack: false,
		pageBreaks: false,
		copyable: true,
		scratchpadParent: UiUtils.getDefaultScratchpadParent()
	}, config);
	if (!config.showPublic) assertTrue(config.showPrivate);
	if (!config.showPrivate) assertTrue(config.showPublic);
	if (config.infoBack) assertFalse(piece.isDivided());
	assertTrue(config.scratchpadParent.is(":visible"));
	
	var keypairRenderers;
	var onProgressFn;
	var _isDestroyed = false;
	
	this.render = function(onDone) {
		assertFalse(_isDestroyed, "StandardPieceRenderer is destroyed");
		
		// div setup
		div.empty();
		div.addClass("piece_div");
		
		// build pages and collect functions to render keypairs
		keypairRenderers = [];
		var keypairsDiv;
		var tickers;
		var pairsPerPage = config.cryptoCash ? 6 : 7;
		var renderFuncs = [];
		for (var i = 0; i < piece.getKeypairs().length; i++) {
			
			// add new page
			if ((!config.pageBreaks && i === 0) || (config.pageBreaks && i % pairsPerPage === 0)) {
				
				// add sweep instructions
				if (config.infoBack && i > 0) {
					div.append($("<div>"));
					tickers = [];
					for (var j = 0; j < pairsPerPage; j++) tickers.push(piece.getKeypairs()[i - (pairsPerPage - j)].getPlugin().getTicker());
					if (config.cryptoCash && config.infoBack) {
						var pageDiv = $("<div class='piece_page_div'>").appendTo(div);
						keypairsDiv = $("<div class='keypairs_div'>").appendTo(pageDiv);
						keypairsDiv.append(getSweepInstructions(tickers));
					}
				}
				
				// add new page
				var pageDiv = $("<div class='piece_page_div'>").appendTo(div);
				if (piece.getPartNum() || (!config.cryptoCash && config.showLogos)) {
					var headerDiv = $("<div class='piece_page_header_div flex_horizontal flex_align_center flex_justify_center'>").appendTo(pageDiv);
					headerDiv.append($("<div class='piece_page_header_left'>"));
					if (!config.cryptoCash && config.showLogos) headerDiv.append($("<a target='_blank' href='index.html#home' title='Go Home'><img class='piece_page_header_logo' src='img/cryptostorage_export.png'></a>"));
					var partNumDiv = $("<div class='piece_page_header_right'>").appendTo(headerDiv);
					if (piece.getPartNum()) partNumDiv.append("Part " + piece.getPartNum());
				}
				keypairsDiv = $("<div class='keypairs_div'>").appendTo(pageDiv);
			}
			
			// collect functions to render keypairs
			var replaceDiv = $("<div>").appendTo(keypairsDiv); // placeholder until rendered
			renderFuncs.push(renderFunc(config.scratchpadParent, replaceDiv, piece, i, config));
		}
		
    /**
     * Callback function to render a keypair.
     * 
     * @param scratchpadParent is a visible div to attach a scratchpad to for rendering so heights can be measured
     * @param replaceDiv is replaced with the rendered div after rendering
     * @param piece contains the keypairs to render
     * @param index is the index of the keypair within the piece to render
     * @param config is keypair render configuration
     */
		function renderFunc(scratchpadParent, replaceDiv, piece, index, config) {
		  return function(onDone) {
        if (_isDestroyed) return;
        if (!config.cryptoCash && (piece.getKeypairs().length > 1 || piece.getPartNum())) config.keypairIdx = index;
        var keypairRenderer = new StandardKeypairRenderer($("<div>").appendTo(scratchpadParent), piece.getKeypairs()[index], config);
        keypairRenderers.push(keypairRenderer);
        keypairRenderer.render(function(div) {
          if (_isDestroyed) return;
          if (config.cryptoCash) div.addClass("keypair_div_spaced");
          if (config.copyable) UiUtils.makeCopyable(div);
          replaceDiv.replaceWith(div);
          doneWeight += StandardKeypairRenderer.getRenderWeight(keypairRenderer.getKeypair().getPlugin().getTicker());
          if (onProgressFn) onProgressFn(doneWeight / totalWeight, "Rendering keypairs");
          onDone(null, keypairRenderer);
        });
		  }
		}
		
		// add final sweep instructions
		if (config.infoBack && config.cryptoCash) {
			var numPairsLastPage = piece.getKeypairs().length % pairsPerPage;
			if (!numPairsLastPage) numPairsLastPage = pairsPerPage;
			tickers = [];
			for (var i = 0; i < numPairsLastPage; i++) tickers.push(piece.getKeypairs()[piece.getKeypairs().length - (numPairsLastPage - i)].getPlugin().getTicker());
			if (config.pageBreaks) {
				var pageDiv = $("<div class='piece_page_div'>").appendTo(div);
				keypairsDiv = $("<div class='keypairs_div'>").appendTo(pageDiv);
			}
			keypairsDiv.append(getSweepInstructions(tickers));
		}
		
		// compute weights
		var doneWeight = 0;
		var totalWeight  = 0;
		for (var i = 0; i < piece.getKeypairs().length; i++) {
			totalWeight += StandardKeypairRenderer.getRenderWeight(piece.getKeypairs()[i].getPlugin().getTicker());
		}

		// render keypairs
		if (onProgressFn) onProgressFn(0, "Rendering keypairs");
		setImmediate(function() {	// let browser breath
			async.series(renderFuncs, function(err, _keypairRenderers) {
				if (_isDestroyed) return;
				assertNull(err);

				// done
				if (onDone) onDone(div);
			});
		});
	}
	
	/**
	 * Destroys the renderer.  Does not destroy the underlying piece.
	 */
	this.destroy = function() {
		assertFalse(_isDestroyed, "StandardPieceRenderer already destroyed");
		if (keypairRenderers) {
			for (var i = 0; i < keypairRenderers.length; i++) keypairRenderers[i].destroy();
		}
		div.remove();
		_isDestroyed = true;
	}
	
	this.isDestroyed = function() {
		return _isDestroyed;
	}
	
	this.getPiece = function() {
		assertFalse(_isDestroyed, "StandardPieceRenderer is destroyed");
		return piece;
	}
	
	this.onProgress = function(callbackFn) {
		assertFalse(_isDestroyed, "StandardPieceRenderer is destroyed");
		onProgressFn = callbackFn;
	}
	
	this.getRenderWeight = function() {
		assertFalse(_isDestroyed, "StandardPieceRenderer is destroyed");
		var weight = 0;
		for (var i = 0; i < piece.getKeypairs().length; i++) weight += StandardKeypairRenderer.getRenderWeight(piece.getKeypairs()[i]);
		return weight;
	}
	
	/**
	 * Render sweep instructions.
	 * 
	 * @param tickers is an array of tickers to get instructions for
	 */
	function getSweepInstructions(tickers) {
		assertArray(tickers);
		assertTrue(tickers.length > 0);
		var instructionDivs = [];
		for (var i = 0; i < tickers.length; i++) instructionDivs.push(UiUtils.getSweepInstructionsDiv(tickers[i]));
		return instructionDivs;
	}
}
inheritsFrom(StandardPieceRenderer, DivController);

/**
 * Relative weight to render a piece generation config.
 */
StandardPieceRenderer.getRenderWeight = function(config) {
	PieceGenerator.validateConfig(config);
	var numParts = config.numParts ? config.numParts : 1;
	var weight = 0;
	
	// compute weight from pre-existing pieces
	if (config.pieces) {
		for (var i = 0; i < config.pieces[0].getKeypairs().length; i++) {
			weight += (StandardKeypairRenderer.getRenderWeight(config.pieces[0].getKeypairs()[i].getPlugin().getTicker()) * numParts);
		}
	}
	
	// compute weight from keypair generation config
	else {
		for (var i = 0; i < config.keypairs.length; i++) {
			weight += config.keypairs[i].numKeypairs * StandardKeypairRenderer.getRenderWeight(config.keypairs[i].ticker) * numParts;
		}
	}
	return weight;
}

/**
 * Renders a preview of what StandardPieceRenderer will render.

 * @param div is the div to render to
 * @param piece is the piece to render
 * @param config specifies render configuration
 *  			config.showLogos specifies if crypto logos should be shown
 * 				config.showPublic specifies if public addresses should be shown
 * 				config.showPrivate specifies if private keys should be shown
 * 				config.cryptoCash specifies to space 6 keypairs per page with no cryptostorage logo
 * 				config.infoBack specifies if double-sided sweep instructions should be included for crypto cash
 */
function StandardPiecePreviewRenderer(div, piece, config) {
	if (!div) div = $("<div>");
	DivController.call(this, div);
	assertObject(piece, CryptoPiece);
	assertTrue(piece.getKeypairs().length >= 1);
	
	var onProgressFn;
	var pieceRenderer;
	var _isDestroyed = false;
	
	this.render = function(onDone) {
		assertFalse(_isDestroyed, "StandardPiecePreviewRenderer is destroyed");
		
		// div setup
    div.addClass("piece_preview_div");
		
		// get preview piece
		var numKeypairs = config.cryptoCash && config.infoBack ? 1 : Math.min(2, piece.getKeypairs().length);
		var previewKeypairs = [];
		for (var i = 0; i < numKeypairs; i++) previewKeypairs.push(piece.getKeypairs()[i]);
		var previewPiece = new CryptoPiece({keypairs: previewKeypairs});
		
		// render preview piece
		pieceRenderer = new StandardPieceRenderer(div, previewPiece, config);
		pieceRenderer.onProgress(onProgressFn);
		pieceRenderer.render(function(div) {
			
			// add preview overlay
			var previewDiv = $("<div class='editor_print_preview_overlay user_select_none'>PREVIEW</div>");
			var keypairsDiv = div.children().first().children().eq(config.showLogos && !config.cryptoCash || piece.isDivided() ? 1 : 0);
			new OverlayController(keypairsDiv, {contentDiv: previewDiv, backgroundColor: "rgb(0, 0, 0, 0)"}).render(function() {
				if (onDone) onDone();
			});
		});
	}
	
	this.onProgress = function(callbackFn) {
		assertFalse(_isDestroyed, "StandardPiecePreviewRenderer is destroyed");
		onProgressFn = callbackFn;
	}
	
	/**
	 * Destroys the renderer.  Does not destroy the underlying piece.
	 */
	this.destroy = function() {
		assertFalse(_isDestroyed, "StandardPiecePreviewRenderer already destroyed");
		if (pieceRenderer) pieceRenderer.destroy();
		_isDestroyed = true;
	}
	
	this.isDestroyed = function() {
		return _isDestroyed;
	}
}
inheritsFrom(StandardPiecePreviewRenderer, DivController);

/**
 * Register preview generation weight.
 */
StandardPiecePreviewRenderer.getRenderWeight = function(config) {
	return 1;
}

/**
 * Renders a single keypair.
 * 
 * @param div is the div to render to
 * @param keypair is the keypair to render
 * @param config specifies render configuration
 * 				config.showLogos specifies if crypto logos should be shown
 * 				config.showPublic specifies if public addresses should be shown
 * 				config.showPrivate specifies if private keys should be shown
 * 				config.keypairIdx is the index of the keypair relative to other keypairs (optional)
 */
function StandardKeypairRenderer(div, keypair, config) {
	DivController.call(this, div);
	assertObject(keypair, CryptoKeypair);
	
	// default config
	config = Object.assign({
		showLogos: true,
		showPublic: true,
		showPrivate: true
	}, config);
	
	var that = this;
	var keypairLeftValue;
	var keypairRightValue;
	var _isDestroyed = false;
	
	this.render = function(onDone) {
		assertFalse(_isDestroyed, "StandardKeypairRenderer is destroyed");
		
		// div setup
		div.empty();
		div.addClass("keypair_div flex_horizontal");
		
		// decode keypair for rendering
		var decoded = StandardKeypairRenderer.decodeKeypair(keypair, config);
		
		// keypair id
		if (isDefined(config.keypairIdx)) {
		  var keypairIdDiv = $("<div class='keypair_id flex_horizontal flex_justify_center width_100'>").appendTo(div);
		  keypairIdDiv.append((keypair.getPartNum() ? keypair.getPartNum() + "." : "") + (config.keypairIdx + 1));
		}
		
		// left div contains everything except right qr
		var leftDiv = $("<div class='keypair_left_div flex_1'>").appendTo(div);
    
    // public qr div
		if (keypair.getPlugin().isPublicApplicable()) {
	    var leftQrDiv = $("<div class='keypair_public_qr_div'>").appendTo(leftDiv);
		}
    
    // private qr div
    var rightQrDiv = $("<div class='keypair_private_qr_div flex_vertical flex_justify_end'>").appendTo(div);
    
    // add qr codes
    if (decoded.leftValueCopyable) {
      UiUtils.renderQrCode(decoded.leftValue, StandardKeypairRenderer.QR_CONFIG, function(img) {
        if (_isDestroyed) return;
        img.attr("class", "keypair_qr");
        leftQrDiv.append(img);
        addPrivateQr();
      });
    } else {
      if (decoded.leftLabel) {
        var omitted = $("<div class='keypair_qr_omitted_div flex_horizontal flex_align_center flex_justify_center'>").appendTo(leftQrDiv);
        omitted.append($("<img src='img/restricted.png' class='keypair_qr_omitted_img'>"));
      }
      addPrivateQr();
    }
    
    function addPrivateQr() {
      if (decoded.rightValueCopyable) {
        UiUtils.renderQrCode(decoded.rightValue, StandardKeypairRenderer.QR_CONFIG, function(img) {
          if (_isDestroyed) return;
          img.attr("class", "keypair_qr");
          rightQrDiv.append(img);
          afterQrs();
        });
      } else {
        var omitted = $("<div class='keypair_qr_omitted_div flex_horizontal flex_align_center flex_justify_center'>").appendTo(rightQrDiv);
        omitted.append($("<img src='img/restricted.png' class='keypair_qr_omitted_img'>"));
        afterQrs();
      }
    }
    
    function afterQrs() {
      
      // public label and value
      if (decoded.leftLabel) {
        var publicDiv = $("<div class='keypair_public_div flex_vertical'>").appendTo(leftDiv);
        var publicLabel = $("<div class='keypair_public_label'>").appendTo(publicDiv);
        publicLabel.append(decoded.leftLabel);
        var publicValue = $("<div class='keypair_public_value'>").appendTo(publicDiv);
        if (decoded.leftValueCopyable) publicValue.addClass("copyable");
        
        // measure height of single line value and public div
        publicValue.html("temporary"); 
        var singleLineValueHeight = publicValue.get(0).offsetHeight;
        var publicDivHeight = publicDiv.get(0).offsetHeight;
        publicValue.html(decoded.leftValue);
      }
    
      // crypto logo and label
      var cryptoDiv = $("<div class='keypair_crypto_div flex_horizontal flex_align_center flex_justify_center'>").appendTo(leftDiv);
      if (!keypair.getPlugin().isPublicApplicable()) cryptoDiv.css("margin-left", 90 + 5 + "px"); // QR size and margin
      if (config.showLogos && decoded.cryptoLogo) {
        decoded.cryptoLogo.attr("width", "100%");
        decoded.cryptoLogo.attr("height", "100%");
        var cryptoLogo = $("<div class='keypair_crypto_logo'>").appendTo(cryptoDiv);
        cryptoLogo.append(decoded.cryptoLogo);
      }
      var cryptoLabel = $("<div class='keypair_crypto_label'>").appendTo(cryptoDiv);
      cryptoLabel.append(decoded.cryptoLabel);
      
      // private label and value
      var privateDiv = $("<div class='keypair_private_div'>").appendTo(leftDiv);
      var privateLabel = $("<div class='keypair_private_label'>").appendTo(privateDiv);
      privateLabel.append(decoded.rightLabel);
      var privateValue = $("<div class='keypair_private_value'>").appendTo(privateDiv);
      privateValue.append(decoded.rightValue);
      if (!hasWhitespace(decoded.rightValue)) {
        privateValue.addClass("flex_horizontal flex_justify_end");
        privateValue.css("word-break", "break-all");
      }
      if (decoded.rightValueCopyable) privateValue.addClass("copyable");
      
      // manually set crypto margin to vertically center
      var freeSpace = 128 - 7 * 2 - (publicDiv ? publicDivHeight : 0) - cryptoDiv.get(0).offsetHeight - privateValue.get(0).offsetHeight;
      if (!isDefined(config.keypairIdx) || config.keypairIdx === 0) freeSpace -= 2; // first keypair has 2px top border
      var marginTop = freeSpace / 2 - (publicValue ? publicValue.get(0).offsetHeight - singleLineValueHeight : 0);
      var marginBottom = freeSpace / 2;
      cryptoDiv.css("margin-top", marginTop + "px");
      cryptoDiv.css("margin-bottom", marginBottom + "px");
      
      // done rendering
      if (onDone) onDone(div);
    }
	}
	
	/**
	 * Destroys the StandardKeypairRenderer.  Does not destroy the underlying keypair.
	 */
	this.destroy = function () {
		assertFalse(_isDestroyed, "StandardKeypairRenderer is already destroyed");
		div.remove();
		_isDestroyed = true;
	}
	
	this.isDestroyed = function() {
		return _isDestroyed;
	}
	
	this.getKeypair = function() {
		assertFalse(_isDestroyed, "StandardKeypairRenderer is destroyed");
		return keypair;
	}
}
inheritsFrom(StandardKeypairRenderer, DivController);

/**
 * Returns the weight to render the given ticker or keypair.
 * 
 * @param tickerOrKeypair can be a ticker or initialized keypair
 * @returns the relative weight to render the keypair
 */
StandardKeypairRenderer.getRenderWeight = function(tickerOrKeypair) {
	assertInitialized(tickerOrKeypair);
	if (isString(tickerOrKeypair)) {
		var plugin = AppUtils.getCryptoPlugin(tickerOrKeypair);
		return 15 * (plugin.isPublicApplicable() ? 2 : 1);
	} else {
		assertObject(tickerOrKeypair, CryptoKeypair);
		return (tickerOrKeypair.hasPublicAddress() ? 15 : 0) + (tickerOrKeypair.hasPrivateKey() ? 15 : 0); 
	}
}

/**
 * Default keypair QR config.
 */
StandardKeypairRenderer.QR_CONFIG = {
		size: 90,
		version: null,
		errorCorrectionLevel: 'H',
		scale: 4,
}

/**
 * Decodes the given keypair for rendering.
 * 
 * @param keypair is the keypair to decode
 * @param config is custom configuration
 * @returns a decoded object with fields which inform rendering
 * 					decoded.leftLabel is the upper left label
 * 					decoded.leftValue is the upper left value
 * 					decoded.leftValueCopyable indicates if the left value is copyable and should be QR
 * 					decoded.cryptoLogo is the center logo to render
 * 					decoded.cryptoLabel is the center label to render
 * 					decoded.rightLabel is the lower right label
 * 					decoded.rightValue is the lower right value
 * 					decoded.rightValueCopyable indicates if the right value is copyable and should be QR
 */
StandardKeypairRenderer.decodeKeypair = function(keypair, config) {
	
	// default render config
	config = Object.assign({
		showPublic: true,
		showPrivate: true,	
		showLogos: true
	}, config);
	
	// decode
	var decoded = {};
	decoded.cryptoLogo = config.showLogos ? keypair.getPlugin().getLogo() : null;
	decoded.cryptoLabel = keypair.getPlugin().getName();
	
	// initialize left values
	if (keypair.isPublicApplicable()) {
		decoded.leftLabel = "\u25C4 Public Address";
		if (keypair.getPublicAddress() && config.showPublic) {
			decoded.leftValueCopyable = true;
			decoded.leftValue = keypair.getPublicAddress();
		} else {
			decoded.leftValueCopyable = false;
			if (keypair.isDivided()) decoded.leftValue = "(combine parts to view)";
			else if (keypair.isEncrypted()) decoded.leftValue = "(decrypt to view)";
			else if (!config.showPublic) decoded.leftValue = "(not shown)";
			else {
				console.log(keypair.toJson());
				console.log(config);
				throw new Error("Unknown public address value");
			}
		}
	} else {
		decoded.leftLabel = null;
		decoded.leftValue = null;
		decoded.leftValueCopyable = false;
	}
	
	// initialize right values
	decoded.rightLabel = keypair.getPlugin().getPrivateLabel();
	decoded.rightLabel += " " + (config.showPrivate && keypair.hasPrivateKey() ? keypair.isDivided() ? "(divided)" : keypair.isEncrypted() ? "(encrypted)" : "(unencrypted)" : "") + " \u25ba";
	decoded.rightValue = keypair.hasPrivateKey() && config.showPrivate ? keypair.getPrivateWif() : "(not shown)";
	decoded.rightValueCopyable = isDefined(keypair.getPrivateWif()) && config.showPrivate;
	return decoded;
}

/**
 * Renders a piece with keypairs in a grid.
 * 
 * @param div is the div to render to
 * @param piece is the piece to render
 * @param config specifies render configuration
 *        config.showPublic specifies if public addresses should be shown
 *        config.showPrivate specifies if private keys should be shown
 *        config.showLogos specifies if crypto logos should be shown
 *        config.showQr specifies if QRs should be shown
 *        config.pageBreaks specifies if piece should be rendered as pages
 *        config.copyable specifies if the public/private values should be copyable
 *        config.scratchpadParent is a visible div to attach render scratchpads to so heights can be measured
 */
function GridPieceRenderer(div, piece, config) {
	if (!div) div = $("<div>");
	DivController.call(this, div);
	
	// config default and validation
	config = Object.assign({
		showPublic: false,
		showPrivate: true,
		showLogos: true,
		pageBreaks: false,
		copyable: true,
		scratchpadParent: UiUtils.getDefaultScratchpadParent()
	}, config);
	assertTrue((config.showPrivate && !config.showPublic) || (!config.showPrivate && config.showPublic));
	assertTrue(config.scratchpadParent.is(":visible"));
	
	var keypairRenderers;
	var onProgressFn;
	var _isDestroyed = false;
	
	this.render = function(onDone) {
		assertFalse(_isDestroyed, "GridPieceRenderer is destroyed");
		
		// div setup
		div.empty();
		div.addClass("piece_div");
		
		// compute weights
    var doneWeight = 0;
    var totalWeight  = 0;
    for (var i = 0; i < piece.getKeypairs().length; i++) {
      totalWeight += GridKeypairRenderer.getRenderWeight(piece.getKeypairs()[i].getPlugin().getTicker(), config);
    }
    
    // collect functions to render keypairs
    var qrLeft = false;
    var renderFuncs = [];
    keypairRenderers = [];
    for (var i = 0; i < piece.getKeypairs().length; i++) {
      if (i % 2 === 0) qrLeft = !qrLeft;
      config.qrLeft = qrLeft; 
      renderFuncs.push(renderFunc(piece, i, config));
    }
    
    // callback function to render keypair
    function renderFunc(piece, index, config) {
      config = Object.assign({}, config);
      return function(onDone) {
        if (_isDestroyed) return;
        if (piece.getKeypairs().length > 1 || piece.getPartNum()) config.keypairIdx = index;
        var keypairRenderer = new GridKeypairRenderer($("<div>").appendTo(config.scratchpadParent), piece.getKeypairs()[index], config);
        keypairRenderers.push(keypairRenderer);
        keypairRenderer.render(function(div) {
          if (_isDestroyed) return;
          doneWeight += GridKeypairRenderer.getRenderWeight(keypairRenderer.getKeypair().getPlugin().getTicker(), config);
          if (onProgressFn) onProgressFn(doneWeight / totalWeight, "Rendering keypairs");
          var height = div.get(0).offsetHeight;
          div.detach();
          if (i % 100 === 0) {  // fix issue where call stack exceeded for large pieces because grid can be synchronous
            setImmediate(function() {
              onDone(null, keypairRenderer, height);
            });
          } else {
            onDone(null, keypairRenderer, height);
          }
        });
      }
    }

    // render keypairs
    if (onProgressFn) onProgressFn(0, "Rendering keypairs");
    setImmediate(function() { // let browser breath
      async.series(renderFuncs, function(err, results) {
        if (_isDestroyed) return;
        assertNull(err);
        
        // build pages
        var keypairsDiv;
        var keypairsRow;
        var tickers;
        var usedHeight = 0;
        
        for (var i = 0; i < piece.getKeypairs().length; i++) {
          
          // determine height used by keypair row
          var rowHeight = 0;
          if (i === 0 || i % 2 === 0) {
            rowHeight = i < piece.getKeypairs().length - 1 ? Math.max(results[i][1], results[i + 1][1]) : results[i][1];
            if (i === 0) rowHeight += 2;  // 2 pixel border not included
            assertTrue(rowHeight > 0);
          }
          
          // add new page
          if (i === 0 || (config.pageBreaks && usedHeight + rowHeight > AppUtils.MAX_PAGE_HEIGHT)) {
            
//            // stretch last row to max height for testing
//            if (i > 0) {
//              var leftOver = AppUtils.MAX_PAGE_HEIGHT - usedHeight;
//              results[i - 1][0].getDiv().css("height", Math.max(results[i - 2][1], results[i - 1][1]) + leftOver + "px");
//            }
            
            usedHeight = 0;
            var pageDiv = $("<div class='piece_page_div'>").appendTo(div);
            if (config.showLogos || piece.getPartNum()) {
              var headerDiv = $("<div class='piece_page_header_div flex_horizontal flex_align_center flex_justify_center'>").appendTo(config.scratchpadParent);
              headerDiv.append($("<div class='piece_page_header_left'>"));
              if (!config.cryptoCash && config.showLogos) headerDiv.append($("<img class='piece_page_header_logo' src='img/cryptostorage_export.png'>"));
              var partNumDiv = $("<div class='piece_page_header_right'>").appendTo(headerDiv);
              if (piece.getPartNum()) partNumDiv.append("Part " + piece.getPartNum());
              usedHeight += headerDiv.get(0).offsetHeight;
              headerDiv.appendTo(pageDiv);
            }
            keypairsDiv = $("<div class='keypairs_div'>").appendTo(pageDiv);
          }
          
          // add new row
          if (i === 0 || i % 2 === 0) {
            usedHeight += rowHeight;
            keypairsRow = $("<div class='grid_keypairs_row flex_horizontal'>").appendTo(keypairsDiv);
          }
          
          // add rendered keyapir
          results[i][0].getDiv().appendTo(keypairsRow);
        }
        
        // add blank placeholder if uneven number of keypairs to preserve formatting
        if (i % 2 !== 0) $("<div style='border-top:none; border-right:none; border-bottom:none;' class='grid_keypair_div'>").appendTo(keypairsRow);
        
        // make keypairs copyable
        if (config.copyable) UiUtils.makeCopyable(div);

        // done
        if (onDone) onDone(div);
      });
    });
	}
	
	/**
	 * Destroys the renderer.  Does not destroy the underlying piece.
	 */
	this.destroy = function() {
		assertFalse(_isDestroyed, "GridPieceRenderer already destroyed");
		if (keypairRenderers) {
			for (var i = 0; i < keypairRenderers.length; i++) keypairRenderers[i].destroy();
		}
		_isDestroyed = true;
	}
	
	this.isDestroyed = function() {
		return _isDestroyed;
	}
	
	this.getPiece = function() {
		assertFalse(_isDestroyed, "GridPieceRenderer is destroyed");
		return piece;
	}
	
	this.onProgress = function(callbackFn) {
		assertFalse(_isDestroyed, "GridPieceRenderer is destroyed");
		onProgressFn = callbackFn;
	}
	
	this.getRenderWeight = function() {
		assertFalse(_isDestroyed, "GridPieceRenderer is destroyed");
		var weight = 0;
		for (var i = 0; i < piece.getKeypairs().length; i++) weight += GridKeypairRenderer.getRenderWeight(piece.getKeypairs()[i], config);
		return weight;
	}
}
inheritsFrom(GridPieceRenderer, DivController);

/**
 * Relative weight to render a piece generation config.
 */
GridPieceRenderer.getRenderWeight = function(config) {
	PieceGenerator.validateConfig(config);
	var numParts = config.numParts ? config.numParts : 1;
	var weight = 0;
	
	// compute weight from pre-existing pieces
	if (config.pieces) {
		for (var i = 0; i < config.pieces[0].getKeypairs().length; i++) {
			weight += (GridKeypairRenderer.getRenderWeight(config.pieces[0].getKeypairs()[i].getPlugin().getTicker(), config) * numParts);
		}
	}
	
	// compute weight from keypair generation config
	else {
		for (var i = 0; i < config.keypairs.length; i++) {
			weight += config.keypairs[i].numKeypairs * GridKeypairRenderer.getRenderWeight(config.keypairs[i].ticker, config) * numParts;
		}
	}
	return weight;
}

/**
 * Renders a preview of what GridPieceRenderer will render.

 * @param div is the div to render to
 * @param piece is the piece to render
 * @param config specifies render configuration
 *  			config.showLogos specifies if crypto logos should be shown
 * 				config.showPublic specifies if public addresses should be shown
 * 				config.showPrivate specifies if private keys should be shown
 */
function GridPiecePreviewRenderer(div, piece, config) {
	if (!div) div = $("<div>");
	DivController.call(this, div);
	assertObject(piece, CryptoPiece);
	
	var onProgressFn;
	var pieceRenderer;
	var _isDestroyed = false;
	
	this.render = function(onDone) {
		assertFalse(_isDestroyed, "GridPiecePreviewRenderer is destroyed");
		
		// div setup
    div.addClass("piece_preview_div");
		
		// get preview piece
		var numKeypairs = Math.min(4, piece.getKeypairs().length);
		var previewKeypairs = [];
		for (var i = 0; i < numKeypairs; i++) previewKeypairs.push(piece.getKeypairs()[i]);
		var previewPiece = new CryptoPiece({keypairs: previewKeypairs});
		
		// render preview piece
		pieceRenderer = new GridPieceRenderer(div, previewPiece, config);
		pieceRenderer.onProgress(onProgressFn);
		pieceRenderer.render(function(div) {
			
			// add preview overlay
			var previewDiv = $("<div class='editor_print_preview_overlay editor_print_preview_overlay_reverse user_select_none'>PREVIEW</div>");
      var keypairsDiv = div.children().first().children().eq(config.showLogos || piece.isDivided() ? 1 : 0);
			new OverlayController(keypairsDiv, {contentDiv: previewDiv, backgroundColor: "rgb(0, 0, 0, 0)"}).render(function() {
				if (onDone) onDone();
			});
		});
	}
	
	this.onProgress = function(callbackFn) {
		assertFalse(_isDestroyed, "GridPiecePreviewRenderer is destroyed");
		onProgressFn = callbackFn;
	}
	
	/**
	 * Destroys the renderer.  Does not destroy the underlying piece.
	 */
	this.destroy = function() {
		assertFalse(_isDestroyed, "GridPiecePreviewRenderer already destroyed");
		if (pieceRenderer) pieceRenderer.destroy();
		_isDestroyed = true;
	}
	
	this.isDestroyed = function() {
		return _isDestroyed;
	}
}
inheritsFrom(GridPiecePreviewRenderer, DivController);

/**
 * Register preview generation weight.
 */
GridPiecePreviewRenderer.getRenderWeight = function(config) {
	return 1;
}

/**
 * Renders a single grid keypair.
 * 
 * @param div is the div to render to
 * @param keypair is the keypair to render
 * @param config specifies render configuration
 * 				config.showLogos specifies if crypto logos should be shown
 * 				config.showPublic specifies if public addresses should be shown
 * 				config.showPrivate specifies if private keys should be shown
 *        config.showQr specifies if the QR code should be shown
 * 				config.qrLeft specifies if the qr code is on the left side else right side (default true)
 *        config.keypairIdx is the index of the keypair relative to other keypairs (optional)
 */
function GridKeypairRenderer(div, keypair, config) {
	DivController.call(this, div);
	assertObject(keypair, CryptoKeypair);
	
	// default config
	config = Object.assign({
		showLogos: true,
		showPublic: false,
		showPrivate: true,
		showQr: true,
		qrLeft: true
	}, config);
	assertTrue((config.showPrivate && !config.showPublic) || (!config.showPrivate && config.showPublic));
	
	// override left/right if QR not shown
	if (!config.showQr) config.qrLeft = false;
	
	var that = this;
	var _isDestroyed = false;
	
	this.render = function(onDone) {
		assertFalse(_isDestroyed, "GridKeypairRenderer is destroyed");
			
		// keypair div setup
		div.empty();
		div.addClass("grid_keypair_div flex_horizontal flex_align_center width_100");
		
		// decode keypair for rendering
		var decoded = GridKeypairRenderer.decodeKeypair(keypair, config);
		
		// keypair id
		var id;
		if (isDefined(config.keypairIdx)) {
			id = $("<div class='grid_keypair_num'>");
			id.html((keypair.getPartNum() ? keypair.getPartNum() + "." : "") + (config.keypairIdx + 1));
			id.css("position", "absolute");
			id.css("top", "5px");
			config.qrLeft ? id.css("right", "5px") : id.css("left", "5px");
		}
		div.append(id);
		
		// keypair title includes logo, name, and id
		var title = $("<div class='grid_keypair_title flex_horizontal flex_align_center'>");
		
		// keypair logo
    if (decoded.cryptoLogo && config.showLogos) {
      decoded.cryptoLogo.attr("width", "100%");
      decoded.cryptoLogo.attr("height", "100%");
      var logo = $("<div class='grid_keypair_crypto_logo'>").appendTo(title);
      logo.append(decoded.cryptoLogo);
    }
		
		// keypair label
		var label = $("<div style='flex-wrap:wrap;' class='flex_horizontal flex_align_end'>").appendTo(title);
		var cryptoName = $("<div style='margin-right:5px' class='keypair_crypto_label'>").appendTo(label);
		cryptoName.append(decoded.cryptoName);
		var valueType = $("<div class='grid_keypair_sublabel'>").appendTo(label);
		valueType.append("(" + decoded.valueType + ")");		
				
		// content includes title and keypair value
		var content = $("<div class='flex_vertical flex_align_center flex_1'>").appendTo(div);
		content.append(title);
		var valueDiv = $("<div class='grid_keypair_value width_100'>").appendTo(content);
		if (!hasWhitespace(decoded.value)) valueDiv.css("word-break", "break-all");
		valueDiv.append(decoded.value);

		// switch to vertical label if horizontal wraps
		if (label.get(0).offsetHeight > 25) {
      cryptoName.css("margin-right", "0");
		  label.removeClass("flex_horizontal flex_align_end");
		  label.addClass("flex_vertical flex_align_center");
		}
		
		// qr code
		if (config.showQr && decoded.valueCopyable) {
			UiUtils.renderQrCode(decoded.value, GridKeypairRenderer.QR_CONFIG, function(img) {
				if (_isDestroyed) return;
				img.attr("class", "keypair_qr");
				config.qrLeft ? div.prepend(img) : div.append(img);	
				
				// done rendering
				if (onDone) onDone(div);
			});
		} else if (onDone) {
			onDone(div);
		}
	}
	
	/**
	 * Destroys the GridKeypairRenderer.  Does not destroy the underlying keypair.
	 */
	this.destroy = function () {
		assertFalse(_isDestroyed, "GridKeypairRenderer is already destroyed");
		div.remove();
		_isDestroyed = true;
	}
	
	this.isDestroyed = function() {
		return _isDestroyed;
	}
	
	this.getKeypair = function() {
		assertFalse(_isDestroyed, "GridKeypairRenderer is destroyed");
		return keypair;
	}
}
inheritsFrom(GridKeypairRenderer, DivController);

/**
 * Returns the weight to render the given ticker or keypair.
 * 
 * @param tickerOrKeypair can be a ticker or initialized keypair
 * @param config is the render config
 * @returns the relative weight to render the keypair
 */
GridKeypairRenderer.getRenderWeight = function(tickerOrKeypair, config) {
	assertInitialized(tickerOrKeypair);
	assertInitialized(config);
	
	// check if QR not shown
	if (!config.showQr) return 1;
	
	// get plugin
	var plugin;
	if (isString(tickerOrKeypair)) {
	  plugin = AppUtils.getCryptoPlugin(tickerOrKeypair);
	} else {
	  assertObject(tickerOrKeypair, CryptoKeypair);
	  plugin = tickerOrKeypair.getPlugin();
	}
	
	// QR is rendered unless showing public and plugin does not have public
	var showQr = !config.showPublic || plugin.isPublicApplicable();
	return showQr ? 10 : 1;
}

/**
 * Default keypair QR config.
 */
GridKeypairRenderer.QR_CONFIG = {
		size: 90,
		version: null,
		errorCorrectionLevel: 'H',
		scale: 4,
}

/**
 * Decodes the given keypair for rendering.
 * 
 * @param keypair is the keypair to decode
 * @param config is custom configuration
 * @returns a decoded object with fields which inform rendering
 * 					decoded.value is the keypair value
 *          decoded.valueType is one of public | unencrypted | encrypted | or divided
 * 					decoded.valueCopyable indicates if the value is copyable and should be QR
 * 					decoded.cryptoLogo is the center logo to render
 *          decoded.cryptoName is the name of the crypto the value is for
 */
GridKeypairRenderer.decodeKeypair = function(keypair, config) {
	
	// default render config
	config = Object.assign({
		showPublic: false,
		showPrivate: true,	
		showLogos: true
	}, config);
	assertTrue((!config.showPublic && config.showPrivate) || (config.showPublic && !config.showPrivate));
	
	// decode
	var decoded = {};
	decoded.cryptoLogo = config.showLogos ? keypair.getPlugin().getLogo() : null;
	decoded.cryptoName = keypair.getPlugin().getName();
	decoded.valueType = config.showPublic ? "public" : (keypair.isDivided() ? "private divided" : (keypair.isEncrypted() ? "private encrypted" : "private"));
	if (config.showPublic) {
		if (keypair.isPublicApplicable()) {
			decoded.value = keypair.getPublicAddress();
			decoded.valueCopyable = true;
		} else {
			decoded.value = "Not applicable";
			decoded.valueCopyable = false;
		}
	} else {
		decoded.value = keypair.getPrivateWif();
		decoded.valueCopyable = true;
	}
	return decoded;
}

/**
 * Renders a piece as text.
 * 
 * @param div is the div to render to
 * @param piece is the piece to render
 * @param config specifies render configuration
 *        config.showPublic specifies if public addresses should be shown
 *        config.showPrivate specifies if private keys should be shown
 */
function TextPieceRenderer(div, piece, config) {
  if (!div) div = $("<div>");
  DivController.call(this, div);
  
  // config default and validation
  config = Object.assign({
    showPublic: true,
    showPrivate: true
  }, config);
  assertTrue(config.showPublic || config.showPrivate);
  
  var onProgressFn;
  var _isDestroyed = false;
  
  this.render = function(onDone) {
    assertFalse(_isDestroyed, "TextPieceRenderer is destroyed");
    if (onProgressFn) onProgressFn(0, "Rendering");
    
    // div setup
    div.empty();
    div.addClass("piece_div");
    
    // build text with break points
    var txt = "";
    for (var i = 0; i < piece.getKeypairs().length; i++) {
      txt += toTextKeypair(piece.getKeypairs()[i], i, config);
      if (i < piece.getKeypairs().length - 1) txt += " | ";
    }
    
    // add text
    var txtDiv = $("<div class='text_piece_text word_break_all'>").appendTo(div);
    txtDiv.append(txt);

    // done
    if (onProgressFn) onProgressFn(1, "Rendering");
    if (onDone) onDone(div);
  }
  
  /**
   * Destroys the renderer.  Does not destroy the underlying piece.
   */
  this.destroy = function() {
    assertFalse(_isDestroyed, "TextPieceRenderer already destroyed");
    _isDestroyed = true;
  }
  
  this.isDestroyed = function() {
    return _isDestroyed;
  }
  
  this.getPiece = function() {
    assertFalse(_isDestroyed, "TextPieceRenderer is destroyed");
    return piece;
  }
  
  this.onProgress = function(callbackFn) {
    assertFalse(_isDestroyed, "TextPieceRenderer is destroyed");
    onProgressFn = callbackFn;
  }
  
  this.getRenderWeight = function() {
    assertFalse(_isDestroyed, "TextPieceRenderer is destroyed");
    return 1;
  }
  
  function toTextKeypair(keypair, index, config) {
    var txt = "";
    if (isDefined(index)) txt += getNoWrapSpan("#" + (keypair.getPartNum() ? keypair.getPartNum() + "." : "") + (index + 1) + ",") + " ";
    txt += getNoWrapSpan(keypair.getPlugin().getTicker() + ",");
    if (isDefined(keypair.getPublicAddress()) && config.showPublic) {
      txt += " " + getNoWrapSpan("public:") + " " + (keypair.isPublicApplicable() ? keypair.getPublicAddress() : getNoWrapSpan("Not") + " " + getNoWrapSpan("applicable"));
      if (isDefined(keypair.getPrivateWif())) txt += ",";
    }
    if (isDefined(keypair.getPrivateWif()) && config.showPrivate) {
      txt += " " + getNoWrapSpan("private:") + " " + getPrivateTxt(keypair);
      txt += keypair.getPartNum() ? ", " + getNoWrapSpan("divided") : (keypair.isEncrypted() ? ", " + getNoWrapSpan("encrypted") : "");
    }
    return txt;
  }
  
  function getNoWrapSpan(txt) {
    return "<span class='nowrap'>" + txt + "</span>";
  }
  
  function getPrivateTxt(keypair) {
    var words = keypair.getPrivateWif().split(" ");
    if (words.length > 1) {
      var span = "";
      for (var i = 0; i < words.length; i++) {
        span += getNoWrapSpan(words[i]);
        if (i < words.length - 1) span += " ";
      }
      return span;
    } else {
      return words[0];
    }
  }
}
inheritsFrom(TextPieceRenderer, DivController);

/**
 * Relative weight to render a piece generation config.
 */
TextPieceRenderer.getRenderWeight = function(config) {
  PieceGenerator.validateConfig(config);
  return 1;
}

/**
 * Renders a preview of what TextPieceRenderer will render.
 *
 * @param div is the div to render to
 * @param piece is the piece to render
 * @param config specifies render configuration
 *        config.showPublic specifies if public addresses should be shown
 *        config.showPrivate specifies if private keys should be shown
 */
function TextPiecePreviewRenderer(div, piece, config) {
  if (!div) div = $("<div>");
  DivController.call(this, div);
  assertObject(piece, CryptoPiece);
  
  var onProgressFn;
  var pieceRenderer;
  var _isDestroyed = false;
  
  this.render = function(onDone) {
    assertFalse(_isDestroyed, "TextPiecePreviewRenderer is destroyed");
    
    // div setup
    div.addClass("piece_preview_div");
    
    // get preview piece
    var numKeypairs = Math.min(30, piece.getKeypairs().length);
    var previewKeypairs = [];
    for (var i = 0; i < numKeypairs; i++) previewKeypairs.push(piece.getKeypairs()[i]);
    var previewPiece = new CryptoPiece({keypairs: previewKeypairs});
    
    // render preview piece
    pieceRenderer = new TextPieceRenderer(div, previewPiece, config);
    pieceRenderer.onProgress(onProgressFn);
    pieceRenderer.render(function(div) {
      div.css("border", "2px solid");
      div.css("padding", "4px");
      
      // add preview overlay
      var previewDiv = $("<div class='editor_print_preview_overlay editor_print_preview_overlay user_select_none'>PREVIEW</div>");
      new OverlayController(div, {contentDiv: previewDiv, backgroundColor: "rgb(0, 0, 0, 0)"}).render(function() {
        if (onDone) onDone();
      });
    });
  }
  
  this.onProgress = function(callbackFn) {
    assertFalse(_isDestroyed, "TextPiecePreviewRenderer is destroyed");
    onProgressFn = callbackFn;
  }
  
  /**
   * Destroys the renderer.  Does not destroy the underlying piece.
   */
  this.destroy = function() {
    assertFalse(_isDestroyed, "TextPiecePreviewRenderer already destroyed");
    if (pieceRenderer) pieceRenderer.destroy();
    _isDestroyed = true;
  }
  
  this.isDestroyed = function() {
    return _isDestroyed;
  }
}
inheritsFrom(TextPiecePreviewRenderer, DivController);

/**
 * Register preview generation weight.
 */
TextPiecePreviewRenderer.getRenderWeight = function(config) {
  PieceGenerator.validateConfig(config);
  return 1;
}