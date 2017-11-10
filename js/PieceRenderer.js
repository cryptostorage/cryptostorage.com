/**
 * Renders a piece to a div for HTML export.
 */
let PieceRenderer = {

	defaultConfig: {
		pairsPerPage: 7,
		showPublic: true,
		showPrivate: true,
		showCurrencyLogos: true,
		showCryptostorageLogos: true,
		qrSize: 90,
		qrVersion: null,
		qrErrorCorrectionLevel: 'H',
		qrScale: 4,
		qrPadding: 5,		// spacing in pixels
	},
	
	/**
	 * Returns the total weight to render all keys across all pieces.
	 */
	getRenderWeight: function(numKeys, numPieces, config) {
		
		// merge configs
		config = Object.assign({}, PieceRenderer.defaultConfig, config);
		
		// get number of qr codes
		let numQrs = numKeys * numPieces * 2;
		
		// get number of logos
		let numLogos = config.showCurrencyLogos ? numKeys * numPieces : 0;
		
		// return total weight
		return numQrs * getWeightQr() + numLogos * getWeightLogo();
		
		function getWeightQr() { return 15; }
		function getWeightLogo() { return 15; }
	},
	
	/**
	 * Renders pieces.
	 * 
	 * @param pieces are the pieces to render
	 * @param pieceDivs are the divs to render to (optional)
	 * @param config is the configuration to render
	 * @param onProgress(percent) is invoked as progress is made
	 * @param onDone(err, pieceDivs) is invoked when done
	 */
	renderPieces: function(pieces, pieceDivs, config, onProgress, onDone) {

		// merge default config with given confi
		config = Object.assign({}, PieceRenderer.defaultConfig, config);
		
		// initialize divs if they weren't given
		if (pieceDivs) assertEquals(pieceDivs.length, pieces.length);
		else {
			pieceDivs = [];
			for (let i = 0; i < pieces.length; i++) pieceDivs.push($("<div>"));
		}
		
		// collect functions to render
		let funcs = [];
		for (let i = 0; i < pieces.length; i++) {
			funcs.push(function(onDone) { PieceRenderer.renderPiece(pieceDivs[i], pieces[i], config, onPieceProgress, onDone); });
		}
		
		// handle progress
		let prevProgress = 0;
		function onPieceProgress(percent) {
			if (onProgress) onProgress(prevProgress + percent / pieces.length);
			if (percent === 1) prevProgress += 1 / pieces.length;
		}
		
		// render async
		async.series(funcs, function(err, pieceDivs) {
			if (err) onDone(err);
			else onDone(null, pieceDivs);
		});
	},
		
	/**
	 * Renders the given piece to a new div.
	 * 
	 * @param pieceDiv is the div to render to
	 * @param piece is the piece to render
	 * @param config is the configuration to render
	 * @param onProgress(percent) is invoked as progress is made
	 * @param onDone(err, pieceDiv) is invoked when done
	 */
	renderPiece: function(pieceDiv, piece, config, onProgress, onDone) {
		assertInitialized(pieceDiv);
		
		// div setup
		pieceDiv.empty();
		pieceDiv.addClass("piece_div");
		
		// merge configs
		config = Object.assign({}, PieceRenderer.defaultConfig, config);

		// setup pages and collect functions to render keys
		let pageDiv;
		let funcs = [];
		for (let i = 0; i < piece.keys.length; i++) {
			
			// render new page
			if (i % config.pairsPerPage === 0) {
				if (i > 0) pieceDiv.append($("<div class='piece_page_spacer'>"));
				pageDiv = $("<div class='piece_page_div'>").appendTo(pieceDiv);
				if (piece.pieceNum || config.showCryptostorageLogos) {
					let headerDiv = $("<div class='piece_page_header_div'>").appendTo(pageDiv);
					headerDiv.append($("<div class='piece_page_header_left'>"));
					if (config.showCryptostorageLogos) headerDiv.append($("<img class='piece_page_header_logo' src='" + getImageData("cryptostorage") + "'>"));
					let pieceNumDiv = $("<div class='piece_page_header_right'>").appendTo(headerDiv);
					if (piece.pieceNum) pieceNumDiv.append("Piece " + piece.pieceNum);
				}
			}
			
			// collect functions to render key pair
			let keyDiv = $("<div class='key_div'>").appendTo(pageDiv);
			if (i % config.pairsPerPage === 0) keyDiv.css("border-top", "2px solid green");
			let plugin = CryptoUtils.getCryptoPlugin(piece.keys[i].ticker);
			let title = "#" + (i + 1);
			let leftLabel = "\u25C4 Public Address";
			let leftValue = config.showPublic ? piece.keys[i].address : null;
			let logo = $("<img width=100% height=100% src='" + getImageData(piece.keys[i].ticker) + "'>");
			let logoLabel = plugin.getName();
			let rightLabel = "Private Key" + (piece.keys[i].split ? " (split)" : piece.keys[i].encryption ? " (encrypted)" : " (unencrypted)") + " \u25ba";
			let rightValue = config.showPrivate ? piece.keys[i].wif : null;
			funcs.push(function(onDone) { renderKeyPair(keyDiv, title, leftLabel, leftValue, logo, logoLabel, rightLabel, rightValue, config,
				function() {
					onKeyPairDone();
					onDone();
				}
			)});
		}
		
		// handle progress
		let keyPairsDone = 0;
		let lastProgress = 0;
		let notifyFrequency = .005;	// notifies every .5% progress
		function onKeyPairDone() {
			keyPairsDone++;
			let progress = keyPairsDone / piece.keys.length;
			if (progress === 1 || progress - lastProgress >= notifyFrequency) {
				lastProgress = progress;
				onProgress(progress);
			}
		}
		
		// render pairs
		async.series(funcs, function() {
			onDone(null, pieceDiv);
		});
		
		/**
		 * Renders a single key pair.
		 */
		function renderKeyPair(div, title, leftLabel, leftValue, logo, logoLabel, rightLabel, rightValue, config, onDone) {
			
			// left qr code
			let keyDivLeft = $("<div class='key_div_left'>").appendTo(div);
			
			// title
			let keyDivCenter = $("<div class='key_div_center'>").appendTo(div);
			let titleDiv = $("<div class='key_div_center_title'>").appendTo(keyDivCenter);
			titleDiv.html(title);
			
			// left label and value
			let keyDivLeftLabel = $("<div class='key_div_left_label'>").appendTo(keyDivCenter);
			keyDivLeftLabel.html(leftLabel);
			let keyDivLeftValue = $("<div class='key_div_left_value'>").appendTo(keyDivCenter);
			if (leftValue && !hasWhitespace(leftValue)) keyDivLeftValue.css("word-break", "break-all");
			keyDivLeftValue.html(leftValue ? leftValue : "(omitted)");
			
			// center currency
			let keyDivCurrency = $("<div class='key_div_currency'>").appendTo(keyDivCenter);
			if (config.showCurrencyLogos) {
				let keyDivCurrencyLogo = $("<div class='key_div_currency_logo'>").appendTo(keyDivCurrency);
				keyDivCurrencyLogo.append(logo);
			}
			let keyDivCurrencyLabel = $("<div class='key_div_currency_label'>").appendTo(keyDivCurrency);
			keyDivCurrencyLabel.html("&nbsp;" + logoLabel);
			
			// right label and value
			let keyDivRightLabel = $("<div class='key_div_right_label'>").appendTo(keyDivCenter);
			keyDivRightLabel.html(rightLabel);
			let keyDivRightValue = $("<div class='key_div_right_value'>").appendTo(keyDivCenter);
			if (rightValue && !hasWhitespace(rightValue)) keyDivRightValue.css("word-break", "break-all");
			keyDivRightValue.html(rightValue ? rightValue : "(omitted)");
			
			// collapse spacing for long keys
			if (leftValue && leftValue.length > 71) {
				keyDivCurrency.css("margin-top", "-15px");
			}
			if (rightValue && rightValue.length > 150) {
				keyDivCurrency.css("margin-top", "-12px");
				keyDivRightLabel.css("margin-top", "-15px");
			}
			
			// right qr code
			let keyDivRight = $("<div class='key_div_right'>").appendTo(div);
			
			// add qr codes
			if (leftValue) {
				CryptoUtils.renderQrCode(leftValue, getQrConfig(config), function(img) {
					img.attr("class", "key_div_qr");
					keyDivLeft.append(img);
					addPrivateQr();
				});
			} else {
				keyDivLeft.append($("<img src='" + getImageData("QUESTION_MARK") + "' class='key_div_qr_omitted'>"));
				addPrivateQr();
			}
			function addPrivateQr() {
				if (rightValue) {
					CryptoUtils.renderQrCode(rightValue, getQrConfig(config), function(img) {
						img.attr("class", "key_div_qr");
						keyDivRight.append(img);
						onDone();
					});
				} else {
					keyDivRight.append($("<img src='" + getImageData("QUESTION_MARK") + "' class='key_div_qr_omitted'>"));
					onDone();
				}
			}
			
			// translate from renderer config to QR config
			function getQrConfig(config) {
				let qr_config = {};
				if ("undefined" !== config.qrSize) qr_config.size = config.qrSize;
				if ("undefined" !== config.qrVersion) qr_config.version = config.qrVersion;
				if ("undefined" !== config.qrErrorCorrectionLevel) qr_config.errorCorrectionLevel = config.qrErrorCorrectionLevel;
				if ("undefined" !== config.qrScale) qr_config.scale = config.qrScale;
				return qr_config;
			}
		}
	}
}