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
 * Renders pieces to divs.
 * 
 * @param pieces are the pieces to render
 * @param pieceDivs are the divs to render to (optional)
 * @param config is the configuration to render
 */
function PieceRenderer(pieces, pieceDivs, config) {
	
	var isCancelled = false;	// tracks if rendering is cancelled
	
	/**
	 * Renders the pieces.
	 * 
	 * @param onProgress(percent) is invoked as progress is made
	 * @param onDone(err, pieceDivs) is invoked when done
	 */
	this.render = function(onProgress, onDone) {
		
		// merge default config with given confi
		config = Object.assign({}, PieceRenderer.defaultConfig, config);
		
		// initialize divs if they weren't given
		if (pieceDivs) assertEquals(pieceDivs.length, pieces.length);
		else {
			pieceDivs = [];
			for (var i = 0; i < pieces.length; i++) pieceDivs.push($("<div>"));
		}
		
		// collect functions to render
		var funcs = [];
		for (var i = 0; i < pieces.length; i++) {
			funcs.push(renderFunc(pieceDivs[i], pieces[i], config, onPieceProgress, onDone));
		}
		
		function renderFunc(pieceDiv, piece, config, onPieceProgress, onDone) {
			return function(onDone) {
				if (isCancelled) return;
				renderPiece(pieceDiv, piece, config, onPieceProgress, onDone);
			}
		}
		
		// handle progress
		var prevProgress = 0;
		function onPieceProgress(percent) {
			if (onProgress) onProgress(prevProgress + percent / pieces.length);
			if (percent === 1) prevProgress += 1 / pieces.length;
		}
		
		// render async
		async.series(funcs, function(err, pieceDivs) {
			if (isCancelled) return;
			if (err) onDone(err);
			else onDone(null, pieceDivs);
		});
	}
	
	/**
	 * Cancels rendering.
	 */
	this.cancel = function() {
		isCancelled = true;
	}
	
	/**
	 * Renders the given piece to a new div.
	 * 
	 * @param pieceDiv is the div to render to
	 * @param piece is the piece to render
	 * @param config is the configuration to render
	 * @param onProgress(percent) is invoked as progress is made
	 * @param onDone(err, pieceDiv) is invoked when done
	 */
	function renderPiece(pieceDiv, piece, config, onProgress, onDone) {
		assertInitialized(pieceDiv);
		
		// div setup
		pieceDiv.empty();
		pieceDiv.addClass("piece_div");
		
		// merge configs
		config = Object.assign({}, PieceRenderer.defaultConfig, config);
		
		// compute pairs per page
		var pairsPerPage = config.spaceBetween ? 6 : 7;

		// setup pages and collect functions to render keys
		var pageDiv;
		var funcs = [];
		for (var i = 0; i < piece.keys.length; i++) {
			
			// add new page
			if (i % pairsPerPage === 0) {
				if (i > 0) {
					pieceDiv.append($("<div>"));
					if (config.spaceBetween && config.infoBack) pieceDiv.append(getCryptoStorageLogosPage(pairsPerPage));
				}
				pageDiv = $("<div class='piece_page_div'>").appendTo(pieceDiv);
				if (!config.spaceBetween && (piece.pieceNum || config.showLogos)) {
					var headerDiv = $("<div class='piece_page_header_div'>").appendTo(pageDiv);
					headerDiv.append($("<div class='piece_page_header_left'>"));
					if (config.showLogos) headerDiv.append($("<img class='piece_page_header_logo' src='img/cryptostorage_export.png'>"));
					var pieceNumDiv = $("<div class='piece_page_header_right'>").appendTo(headerDiv);
					if (piece.pieceNum) pieceNumDiv.append("Piece " + piece.pieceNum);
				}
			}
			
			// collect function to render keypair
			var placeholderDiv = $("<div class='key_div'>").appendTo(pageDiv);
			if (config.spaceBetween) placeholderDiv.addClass("key_div_spaced");
			funcs.push(renderKeyPairFunc(placeholderDiv, piece, i, config));
		}
		
		// add cryptostoarge logos
		var numPairsLastPage = piece.keys.length % pairsPerPage;
		if (!numPairsLastPage) numPairsLastPage = pairsPerPage;
		if (config.spaceBetween && config.infoBack) pieceDiv.append(getCryptoStorageLogosPage(numPairsLastPage));
		
		// callback function to render keypair
		function renderKeyPairFunc(placeholderDiv, piece, index, config) {
			return function(onDone) {
				if (isCancelled) return;
				renderKeyPair(null, piece, index, config, function(keyDiv) {
					placeholderDiv.replaceWith(keyDiv);
					onKeyPairDone();
					onDone();
				});
			}
		}
		
		// handle progress
		var keyPairsDone = 0;
		var lastProgress = 0;
		var notifyFrequency = .005;	// notifies every .5% progress
		function onKeyPairDone() {
			keyPairsDone++;
			var progress = keyPairsDone / piece.keys.length;
			if (progress === 1 || progress - lastProgress >= notifyFrequency) {
				lastProgress = progress;
				onProgress(progress);
			}
		}
		
		// render pairs
		async.series(funcs, function() {
			if (isCancelled) return;
			onDone(null, pieceDiv);
		});
		
		/**
		 * Renders a single keypair.
		 * 
		 * @param div is the div to render to (optional)
		 * @param piece is the piece containing the keypair to render
		 * @param index is the index of the keypair within the piece
		 * @param config is the render configuration
		 * @param onDone is invoked when rendering is done
		 */
		function renderKeyPair(div, piece, index, config, onDone) {
			if (isCancelled) return;
			
			var pieceKey = piece.keys[index];
			var plugin = AppUtils.getCryptoPlugin(pieceKey.ticker);
			var isSplit = isInitialized(piece.pieceNum);
			var addressApplicable = pieceKey.address !== AppUtils.NA;
			
			// content to render
			var title = piece.keys.length > 1 ? "#" + (index + 1) : "";
			var leftLabel = "\u25C4 Public Address";
			var leftValue = (!pieceKey.address && pieceKey.encryption) ? "(decrypt to view)" : config.showPublic ? pieceKey.address : "(not shown)";
			var leftCopyable = config.showPublic && pieceKey.address && addressApplicable;
			var rightLabel = plugin.getPrivateLabel();
			rightLabel += " " + (pieceKey.wif && config.showPrivate ? (isSplit ? "(split)" : pieceKey.encryption ? "(encrypted)" : "(unencrypted)") : "") + " \u25ba";
			var rightValue = pieceKey.wif && config.showPrivate ? pieceKey.wif : "(not shown)";
			var rightCopyable = pieceKey.wif && config.showPrivate;
			var currencyLogo = plugin.getLogo();
			currencyLogo.attr("width", "100%");
			currencyLogo.attr("height", "100%");
			var currencyLabel = plugin.getName();
			
			// div setup
			if (!div) div = $("<div>");
			div.addClass("key_div");
			if (config.spaceBetween) div.addClass("key_div_spaced");
			
			// left qr code
			var keyDivLeft = $("<div class='key_div_left'>").appendTo(div);
			
			// title
			var keyDivCenter = $("<div class='key_div_center'>").appendTo(div);
			var titleDiv = $("<div class='key_div_center_title'>").appendTo(keyDivCenter);
			if (addressApplicable) titleDiv.css("position", "absolute");
			titleDiv.html(title);
			
			// left label and value
			if (addressApplicable) {
				var keyDivLeftLabel = $("<div class='key_div_left_label'>").appendTo(keyDivCenter);
				keyDivLeftLabel.html(leftLabel);
				var keyDivLeftValue = $("<div class='key_div_left_value'>").appendTo(keyDivCenter);
				if (!hasWhitespace(leftValue)) keyDivLeftValue.css("word-break", "break-all");
				keyDivLeftValue.html(leftValue);
				if (leftCopyable) keyDivLeftValue.addClass("copyable");
			}
			
			// center currency
			var keyDivCurrency = $("<div class='key_div_currency'>").appendTo(keyDivCenter);
			if (config.showLogos) {
				var keyDivCurrencyLogo = $("<div class='key_div_currency_logo'>").appendTo(keyDivCurrency);
				keyDivCurrencyLogo.append(currencyLogo);
			}
			var keyDivCurrencyLabel = $("<div class='key_div_currency_label'>").appendTo(keyDivCurrency);
			keyDivCurrencyLabel.html(currencyLabel);
			
			// right label and value
			var keyDivRightLabel = $("<div class='key_div_right_label'>").appendTo(keyDivCenter);
			keyDivRightLabel.html(rightLabel);
			var keyDivRightValue = $("<div class='key_div_right_value'>").appendTo(keyDivCenter);
			if (!addressApplicable) keyDivRightValue.css("margin-left", "-90px");
			if (!hasWhitespace(rightValue)) keyDivRightValue.css("word-break", "break-all");
			keyDivRightValue.html(rightValue);
			if (rightCopyable) keyDivRightValue.addClass("copyable");
			
			// collapse spacing for long keys
			if (addressApplicable) {
				if (leftValue.length > 71) {
					keyDivCurrency.css("margin-top", "-15px");
				}
				if (rightValue.length > 140) {
					keyDivCurrency.css("margin-top", "-10px");
					keyDivRightLabel.css("margin-top", "-15px");
				}
			}
			
			// right qr code
			var keyDivRight = $("<div class='key_div_right'>").appendTo(div);
			
			// add qr codes
			if (leftCopyable) {
				AppUtils.renderQrCode(leftValue, getQrConfig(config), function(img) {
					if (isCancelled) return;
					img.attr("class", "key_div_qr");
					keyDivLeft.append(img);
					addPrivateQr();
				});
			} else {
				if (addressApplicable) {
					var omitted = $("<div class='key_div_qr_omitted flex_horizontal'>").appendTo(keyDivLeft);
					omitted.append($("<img src='img/restricted.png' class='key_div_qr_omitted_img'>"));
				}
				addPrivateQr();
			}
			function addPrivateQr() {
				if (rightCopyable) {
					AppUtils.renderQrCode(rightValue, getQrConfig(config), function(img) {
						if (isCancelled) return;
						img.attr("class", "key_div_qr");
						keyDivRight.append(img);
						onDone(div);
					});
				} else {
					var omitted = $("<div class='key_div_qr_omitted flex_horizontal'>").appendTo(keyDivRight);
					omitted.append($("<img src='img/restricted.png' class='key_div_qr_omitted_img'>"));
					onDone(div);
				}
			}
			
			// translate from renderer config to QR config
			function getQrConfig(config) {
				var qr_config = {};
				if ("undefined" !== config.qrSize) qr_config.size = config.qrSize;
				if ("undefined" !== config.qrVersion) qr_config.version = config.qrVersion;
				if ("undefined" !== config.qrErrorCorrectionLevel) qr_config.errorCorrectionLevel = config.qrErrorCorrectionLevel;
				if ("undefined" !== config.qrScale) qr_config.scale = config.qrScale;
				return qr_config;
			}
		}
		
		function getCryptoStorageLogosPage(numLogos) {
			assertTrue(config.spaceBetween);
			var pageDiv = $("<div class='piece_page_div'>");
			for (var i = 0; i < numLogos; i++) pageDiv.append(getSweepInstructionsDiv());
			return pageDiv;
			
			function getSweepInstructionsDiv() {
				var div = $("<div>");
				div.addClass("key_div key_div_spaced flex_horizontal");
				
				// instructions
				var instructionsDiv = $("<div class='cryptocash_instructions'>").appendTo(div);
				instructionsDiv.append("<b>To claim funds:</b>");
				var instructionsList = $("<ol>").appendTo(instructionsDiv);
				instructionsList.append("<li><b>Download</b> wallet sofware of your choice (recommendation: Jaxx)</li>");
				instructionsList.append("<li><b>Sweep</b> the private key on the reverse side using your wallet<br>Jaxx: Menu > Tools > Transfer paper wallet > follow on-screen instructions</li>");
				instructionsList.append("<li><b>All done.</b> Funds are now claimed and accessible in your wallet</li>");
				
				// branding
				var brandingDiv = $("<div class='cryptocash_branding flex_vertical'>").appendTo(div);
				brandingDiv.append("<span><i>Generated by</i></span>");
				brandingDiv.append($("<img class='cryptocash_branding_logo' src='img/cryptostorage_export.png'>"));
				brandingDiv.append("<span style='font-size: 15px;'>https://cryptostorage.com</span>");
				return div;
			}
		}
	}
}

// default configuration
PieceRenderer.defaultConfig = {
		showPublic: true,
		showPrivate: true,
		showLogos: true,
		qrSize: 90,
		qrVersion: null,
		qrErrorCorrectionLevel: 'H',
		qrScale: 4,
		qrPadding: 5,		// spacing in pixels
		spaceBetween: false,
		infoBack: true
};

// compute render weight
PieceRenderer.getWeight = function(numKeys, numPieces, config) {
	
	// merge configs
	config = Object.assign({}, PieceRenderer.defaultConfig, config);
	
	// get number of qr codes
	var numQrs = numKeys * numPieces * 2;
	
	// get number of logos
	var numLogos = config.showLogos ? numKeys * numPieces : 0;
	
	// return total weight
	return numQrs * getWeightQr() + numLogos * getWeightLogo();
	
	function getWeightQr() { return 15; }
	function getWeightLogo() { return 0; }
}

/**
 * Makes the given div copyable assuming it is a rendered piece(s).
 */
PieceRenderer.makeCopyable = function(div) {
	
	// copy keys to clipboard
	new Clipboard(".copyable", {
		text: function(trigger) {
			return $(trigger).html();
		}
	});
	
	// copied tooltip
	div.find(".copyable").each(function(i, copyable) {
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
				}, 2000)
			}
		});
	});
}