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
		config = objectAssign({}, PieceRenderer.defaultConfig, config);
		
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
		config = objectAssign({}, PieceRenderer.defaultConfig, config);

		// setup pages and collect functions to render keys
		var pageDiv;
		var funcs = [];
		var temp;
		for (var i = 0; i < piece.keys.length; i++) {
			
			// render new page
			if (i % config.pairsPerPage === 0) {
				if (i > 0) pieceDiv.append($("<div class='piece_page_spacer'>"));
				pageDiv = $("<div class='piece_page_div'>").appendTo(pieceDiv);
				if (piece.pieceNum || config.showLogos) {
					var headerDiv = $("<div class='piece_page_header_div'>").appendTo(pageDiv);
					headerDiv.append($("<div class='piece_page_header_left'>"));
					if (config.showLogos) headerDiv.append($("<img class='piece_page_header_logo' src='img/cryptostorage_export.png'>"));
					var pieceNumDiv = $("<div class='piece_page_header_right'>").appendTo(headerDiv);
					if (piece.pieceNum) pieceNumDiv.append("Piece " + piece.pieceNum);
				}
			}
			
			// collect functions to render key pair
			var placeholderDiv = $("<div class='key_div'>").appendTo(pageDiv);
			var plugin = AppUtils.getCryptoPlugin(piece.keys[i].ticker);
			var title = "#" + (i + 1);
			var leftLabel = "\u25C4 Public Address";
			var leftValue = config.showPublic ? piece.keys[i].address : null;
			var logo = plugin.getLogo();
			logo.attr("width", "100%");
			logo.attr("height", "100%");
			var logoLabel = plugin.getName();
			var rightLabel = "Private Key" + (piece.pieceNum ? " (split)" : piece.keys[i].encryption ? " (encrypted)" : " (unencrypted)") + " \u25ba";
			var rightValue = config.showPrivate ? piece.keys[i].wif : null;
			funcs.push(renderKeyPairFunc(placeholderDiv, title, leftLabel, leftValue, logo, logoLabel, rightLabel, rightValue, config));
			
			function renderKeyPairFunc(placeholderDiv, title, leftLabel, leftValue, logo, logoLabel, rightLabel, rightValue, config) {
				return function(onDone) {
					if (isCancelled) return;
					renderKeyPair(null, title, leftLabel, leftValue, logo, logoLabel, rightLabel, rightValue, config, function(keyDiv) {
						placeholderDiv.replaceWith(keyDiv);
						onKeyPairDone();
						onDone();
					});
				}
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
			
			// make keys copyable
			new Clipboard(".copyable", {
				text: function(trigger) {
					return $(trigger).html();
				}
			});
			
			// copied tooltip
			pieceDiv.find(".copyable").each(function(i, copyable) {
				var placement = $(this).hasClass("key_div_left_value") ? "top" : "bottom";
				tippy(copyable, {
					arrow : true,
					html : $("<div>Copied!</div>").get(0),
					interactive : true,
					placement : placement,
					theme : 'translucent',
					trigger : "click",
					distance : 10,
					arrowTransform: 'scaleX(1.25) scaleY(1.5) translateY(1px)',
					onShow : function() {
						setTimeout(function() {
							copyable._tippy.hide();
						}, 1500)
					}
				});
			});
			
			// done
			onDone(null, pieceDiv);
		});
		
		/**
		 * Renders a single key pair.
		 */
		function renderKeyPair(div, title, leftLabel, leftValue, logo, logoLabel, rightLabel, rightValue, config, onDone) {
			if (isCancelled) return;
			
			// div setup
			if (!div) div = $("<div>");
			div.addClass("key_div");
			
			// left qr code
			var keyDivLeft = $("<div class='key_div_left'>").appendTo(div);
			
			// title
			var keyDivCenter = $("<div class='key_div_center'>").appendTo(div);
			var titleDiv = $("<div class='key_div_center_title'>").appendTo(keyDivCenter);
			titleDiv.html(title);
			
			// left label and value
			var keyDivLeftLabel = $("<div class='key_div_left_label'>").appendTo(keyDivCenter);
			keyDivLeftLabel.html(leftLabel);
			var keyDivLeftValue = $("<div class='key_div_left_value'>").appendTo(keyDivCenter);
			if (leftValue && !hasWhitespace(leftValue)) keyDivLeftValue.css("word-break", "break-all");
			if (config.showPublic) {
				if (leftValue) {
					keyDivLeftValue.html(leftValue);
					keyDivLeftValue.addClass("copyable");
				} else {
					keyDivLeftValue.html("(decrypt to view)");
				}
			} else {
				keyDivLeftValue.html("(not shown)");
			}
			
			// center currency
			var keyDivCurrency = $("<div class='key_div_currency'>").appendTo(keyDivCenter);
			if (config.showLogos) {
				var keyDivCurrencyLogo = $("<div class='key_div_currency_logo'>").appendTo(keyDivCurrency);
				keyDivCurrencyLogo.append(logo);
			}
			var keyDivCurrencyLabel = $("<div class='key_div_currency_label'>").appendTo(keyDivCurrency);
			keyDivCurrencyLabel.html("&nbsp;" + logoLabel);
			
			// right label and value
			var keyDivRightLabel = $("<div class='key_div_right_label'>").appendTo(keyDivCenter);
			keyDivRightLabel.html(rightLabel);
			var keyDivRightValue = $("<div class='key_div_right_value'>").appendTo(keyDivCenter);
			if (rightValue && !hasWhitespace(rightValue)) keyDivRightValue.css("word-break", "break-all");
			if (rightValue) {
				keyDivRightValue.html(rightValue);
				keyDivRightValue.addClass("copyable");
			} else {
				keyDivRightValue.html("(not shown)");
			}
			
			// collapse spacing for long keys
			if (leftValue && leftValue.length > 71) {
				keyDivCurrency.css("margin-top", "-15px");
			}
			if (rightValue && rightValue.length > 150) {
				keyDivCurrency.css("margin-top", "-10px");
				keyDivRightLabel.css("margin-top", "-15px");
			}
			
			// right qr code
			var keyDivRight = $("<div class='key_div_right'>").appendTo(div);
			
			// add qr codes
			if (leftValue) {
				AppUtils.renderQrCode(leftValue, getQrConfig(config), function(img) {
					if (isCancelled) return;
					img.attr("class", "key_div_qr");
					keyDivLeft.append(img);
					addPrivateQr();
				});
			} else {
				var omitted = $("<div class='key_div_qr_omitted flex_horizontal'>").appendTo(keyDivLeft);
				omitted.append($("<img src='img/restricted.png' class='key_div_qr_omitted_img'>"));
				addPrivateQr();
			}
			function addPrivateQr() {
				if (rightValue) {
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
	}
}

// default configuration
PieceRenderer.defaultConfig = {
		pairsPerPage: 7,
		showPublic: true,
		showPrivate: true,
		showLogos: true,
		qrSize: 90,
		qrVersion: null,
		qrErrorCorrectionLevel: 'H',
		qrScale: 4,
		qrPadding: 5		// spacing in pixels
};

// compute render weight
PieceRenderer.getWeight = function(numKeys, numPieces, config) {
	
	// merge configs
	config = objectAssign({}, PieceRenderer.defaultConfig, config);
	
	// get number of qr codes
	var numQrs = numKeys * numPieces * 2;
	
	// get number of logos
	var numLogos = config.showLogos ? numKeys * numPieces : 0;
	
	// return total weight
	return numQrs * getWeightQr() + numLogos * getWeightLogo();
	
	function getWeightQr() { return 15; }
	function getWeightLogo() { return 0; }
}