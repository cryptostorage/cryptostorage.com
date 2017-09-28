/**
 * Collection of utilities for cryptostorage.com.
 */
let CryptoUtils = {
	
	/**
	 * Returns all crypto plugins.
	 */
	plugins: null,	// cache plugins
	getCryptoPlugins: function() {
		if (!CryptoUtils.plugins) {
			CryptoUtils.plugins = [];
			CryptoUtils.plugins.push(new BitcoinPlugin());
			CryptoUtils.plugins.push(new EthereumPlugin());
			CryptoUtils.plugins.push(new MoneroPlugin());
			CryptoUtils.plugins.push(new LitecoinPlugin());
			CryptoUtils.plugins.push(new BitcoinCashPlugin());
			CryptoUtils.plugins.push(new EthereumClassicPlugin());
			CryptoUtils.plugins.push(new OmiseGoPlugin());
		}
		return CryptoUtils.plugins;
	},
	
	/**
	 * Returns the crypto plugin with the given ticker symbol.
	 */
	getCryptoPlugin: function(ticker) {
		assertInitialized(ticker);
		for (let plugin of CryptoUtils.getCryptoPlugins()) {
			if (plugin.getTicker() === ticker) return plugin;
		}
		throw new Error("No plugin found for crypto '" + ticker + "'");
	},
		
	/**
	 * Enumerates password encryption/decryption schemes.
	 */
	EncryptionScheme: {
		BIP38: "BIP38",
		CRYPTOJS: "CryptoJS",
		SJCL: "SJCL"
	},
	
	/**
	 * Determines if the given string is a valid CryptoJS WIF private key.
	 */
	isWifCryptoJs: function(str) {
		return str.startsWith("U2") && str.length === 128 && !hasWhitespace(str);
	},
	
	/**
	 * Encrypts the given key with the given scheme and password.
	 * 
	 * Invokes callback(err, encryptedKey) when done.
	 */
	encrypt: function(scheme, key, password, callback) {
		if (!scheme) throw new Error("Scheme must be initialized");
		if (!isObject(key, 'CryptoKey')) throw new Error("Given key must be of class 'CryptoKey' but was " + cryptoKey);
		if (!password) throw new Error("Password must be initialized");
		switch (scheme) {
			case CryptoUtils.EncryptionScheme.CRYPTOJS:
				let b64 = CryptoJS.AES.encrypt(key.getHex(), password).toString();
				key.setState(Object.assign(key.getPlugin().newKey(b64).getState(), {address: key.getAddress()}));
				callback(null, key);
				break;
			case CryptoUtils.EncryptionScheme.BIP38:
				ninja.privateKey.BIP38PrivateKeyToEncryptedKeyAsync(key.getHex(), password, true, function(resp) {
					if (resp.message) callback(resp);	// TODO: confirm error handling, isError()
					else {
						key.setState(Object.assign(key.getPlugin().newKey(resp).getState(), {address: key.getAddress()}));
						callback(null, key);
					}
				});
				break;
			default:
				callback(new Error("Encryption scheme '" + scheme + "' not supported"));
		}
	},

	/**
	 * Decrypts the given key with the given password.
	 * 
	 * Invokes callback(err, decryptedKey) when done.
	 */
	decrypt: function(key, password, callback) {
		if (!isObject(key, 'CryptoKey')) throw new Error("Given key must be of class 'CryptoKey' but was " + cryptoKey);
		if (!password) throw new Error("Password must be initialized");
		assertTrue(key.isEncrypted());
		switch (key.getEncryptionScheme()) {
			case CryptoUtils.EncryptionScheme.CRYPTOJS:
				let hex;
				try {
					hex = CryptoJS.AES.decrypt(key.getWif(), password).toString(CryptoJS.enc.Utf8);
				} catch (err) { }
				if (!hex) callback(new Error("Incorrect password"));
				else {
					try {
						key.setPrivateKey(hex);
						callback(null, key);
					} catch (err) {
						callback(new Error("Incorrect password"));
					}
				}
				break;
			case CryptoUtils.EncryptionScheme.BIP38:
				ninja.privateKey.BIP38EncryptedKeyToByteArrayAsync(key.getWif(), password, function(resp) {
					if (resp.message) callback(new Error("Incorrect password"));
					else {
						let wif = new Bitcoin.ECKey(resp).setCompressed(true).getBitcoinWalletImportFormat()
						key.setPrivateKey(wif);
						callback(null, key);
					}
				});
				break;
			default:
				callback(new Error("Encryption scheme '" + key.getEncryptionScheme() + "' not supported"));
		}
	},

	/**
	 * Splits the given string.  First converts the string to hex.
	 * 
	 * @param str is the string to split
	 * @param numPieces is the number of pieces to make
	 * @param minPieces is the minimum number of pieces to reconstitute
	 * @returns string[] are the pieces
	 */
	splitString: function(str, numPieces, minPieces) {
		return secrets.share(secrets.str2hex(str), numPieces, minPieces);
	},

	/**
	 * Reconstitutes the given pieces.  Assumes the pieces reconstitute hex which is converted to a string.
	 * 
	 * @param pieces are the pieces to reconstitute
	 * @return string is the reconstituted string
	 */
	reconstitute: function(pieces) {
		return secrets.hex2str(secrets.combine(pieces));
	},

	// specifies default QR configuration
	DefaultQrConfig: {
		size: 250,
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
		config = Object.assign({}, CryptoUtils.DefaultQrConfig, config);

		// generate QR code
		var segments = [{data: text, mode: 'byte'}];	// manually specify mode
		qrcodelib.toDataURL(segments, config, function(err, url) {
			if (err) throw err;
			var img = $("<img>");
			img.css("width", config.size + "px");
			img.css("height", config.size + "px");
			img[0].onload = function() {
				callback(img);
			}
			img[0].src = url;
		});
	},

	/**
	 * Attempts to construct a key from the given string.  The string is expected to be a
	 * single private key (hex or wif, encrypted or unencrypted) or one or more pieces that
	 * reconstitute a single private key (hex or wif, encrypted or unencrypted).
	 * 
	 * @param plugin in the coin plugin used to parse the string
	 * @param str is the string to parse into a key
	 * @returns a key parsed from the given string
	 * @throws an exception if a private key cannot be parsed from the string
	 */
	parseKey: function(plugin, str) {
		assertInitialized(str);
		str = str.trim();
		if (!str) return null;
		
		// first try string as key
		try {
			return plugin.newKey(str);
		} catch (err) {

			// try tokenizing and combining
			let tokens = getTokens(str);
			if (tokens.length === 0) return null;
			try {
				return plugin.combine(tokens);
			} catch (err) {
				return null;	// error means key could not be parsed
			}
		}
	},

	/**
	 * Converts the given keys to pieces.
	 * 
	 * @param keys are the keys to convert to pieces
	 * @param numPieces are the number of pieces to split the keys into (must be >= 1)
	 * @param minPieces are the minimum pieces to reconstitute the keys (optional)
	 * @returns exportable pieces
	 */
	keysToPieces: function(keys, numPieces, minPieces) {
		
		// validate input
		assertTrue(keys.length > 0);
		if (!isDefined(numPieces)) numPieces = 1;
		assertTrue(numPieces >= 1);
		if (minPieces) {
			assertTrue(numPieces >= 2);
			assertTrue(minPieces >= 2);
		} else {
			assertTrue(numPieces >= 1);
		}
		
		// initialize pieces
		let pieces = [];
		for (let i = 0; i < numPieces; i++) {
			pieces.push([]);
		}
		
		// add keys to each piece
		for (let key of keys) {
			let keyPieces = numPieces > 1 ? key.getPlugin().split(key, numPieces, minPieces) : [key.getWif()];
			for (let i = 0; i < numPieces; i++) {
				let piece = {};
				piece.crypto = key.getPlugin().getTicker();
				piece.isSplit = numPieces > 1;
				piece.address = key.getAddress();
				piece.privateKey = keyPieces[i];
				piece.encryption = key.getEncryptionScheme();
				pieces[i].push(piece);
			}
		}
		
		return pieces;
	},

	/**
	 * Converts the given pieces to keys.
	 * 
	 * @param pieces are the pieces to convert to keys
	 * @returns keys built from the pieces
	 */
	piecesToKeys: function(pieces) {
		assertTrue(pieces.length > 0);
		let keys = [];
		
		// handle one piece
		if (pieces.length === 1) {
			for (let pieceKey of pieces[0]) {
				try {
					let key = CryptoUtils.getCryptoPlugin(pieceKey.crypto).newKey(pieceKey.privateKey);
					if (key.isEncrypted() && pieceKey.address) key.setAddress(pieceKey.address);
					keys.push(key);
				} catch (err) {
					return [];
				}
			}
		}
		
		// handle multiple pieces
		else {
			
			// validate pieces contain same number of keys
			let numKeys;
			for (let i = 0; i < pieces.length; i++) {
				let piece = pieces[i];
				if (!numKeys) numKeys = piece.length;
				else if (numKeys !== piece.length) throw new Error("Pieces contain different number of keys");
			}
			
			// validate consistent keys across pieces
			for (let i = 0; i < pieces[0].length; i++) {
				let crypto;
				let isSplit;
				let address;
				let encryption;
				for (let piece of pieces) {
					if (!crypto) crypto = piece[i].crypto;
					else if (crypto !== piece[i].crypto) throw new Error("Pieces are for different cryptocurrencies");
					if (!isSplit) isSplit = piece[i].isSplit;
					else if (isSplit !== piece[i].isSplit) throw new Error("Pieces have different split states");
					if (!address) address = piece[i].address;
					else if (address !== piece[i].address) throw new Error("Pieces have different addresses");
					if (!encryption) encryption = piece[i].encryption;
					else if (encryption !== piece[i].encryption) throw new Error("Pieces have different encryption states");
				}
			}
			
			// combine keys across pieces
			for (let i = 0; i < pieces[0].length; i++) {
				let shares = [];
				for (let piece of pieces) shares.push(piece[i].privateKey);
				try {
					let key = CryptoUtils.getCryptoPlugin(pieces[0][i].crypto).combine(shares);
					if (key.isEncrypted() && pieces[0][i].address) key.setAddress(pieces[0][i].address);
					keys.push(key);
				} catch (err) {
					return [];
				}
			}
		}

		return keys;
	},

	/**
	 * Zips the given pieces.
	 * 
	 * @param pieces are the pieces to zip
	 * @param pieceHtmls are rendered HTML pieces to include in the zips
	 * @param callback(name, blob) is invoked when zipping is complete
	 */
	piecesToZip: function(pieces, pieceHtmls, callback) {
		assertTrue(pieces.length > 0, "Pieces cannot be empty");
		
		// get crypto identifier
		let cryptos = [];
		for (let key of pieces[0]) {
			if (!contains(cryptos, key.crypto)) cryptos.push(key.crypto);
		}
		let crypto = cryptos.length === 1 ? cryptos[0].toLowerCase() : "mix";
		
		// prepare zips for each piece
		let zips = [];
		for (let i = 0; i < pieces.length; i++) {
			let name = crypto + (pieces.length > 1 ? "_" + (i + 1) : "");
			let path = "cryptostorage_" + name + "/" + name;
			let zip = new JSZip();
			zip.file(path + ".html", getOuterHtml(pieceHtmls[i]));
			zip.file(path + ".csv", CryptoUtils.pieceToCsv(pieces[i]));
			zip.file(path + ".txt", CryptoUtils.pieceToStr(pieces[i]));
			zip.file(path + ".json", CryptoUtils.pieceToJson(pieces[i]));
			zips.push(zip);
		}
		
		// get callback functions to generate zips
		let funcs = [];
		for (let zip of zips) {
			funcs.push(function(callback) { zip.generateAsync({type:"blob"}).then(function(blob) { callback(null, blob) }); });
		}
		
		// zip in parallel
		async.parallel(funcs, function(err, blobs) {
			if (err) throw err;
			let name = "cryptostorage_" + crypto;
			if (blobs.length === 1) callback(name + ".zip", blobs[0]);
			else {
				
				// zip the zips
				let zip = new JSZip();
				for (let i = 0; i < blobs.length; i++) {
					zip.file(name + "/" + name + "_" + (i + 1) + ".zip", blobs[i]);
				}
				zip.generateAsync({type:"blob"}).then(function(blob) {
					callback(name + ".zip", blob);
				});
			}
		});
	},

	/**
	 * Extracts pieces from a zip blob.
	 * 
	 * @param blob is the raw zip data
	 * @param onPieces(namedPieces) is called when all pieces have been extracted
	 */
	zipToPieces: function(blob, onPieces) {
		
		// load zip asynchronously
		JSZip.loadAsync(blob).then(function(zip) {
			
			// collect callback functions to get pieces
			let funcs = [];
			zip.forEach(function(path, zipObject) {
				if (path.startsWith("_")) return;
				if (path.endsWith(".json")) {
					funcs.push(getPieceCallbackFunction(zipObject));
				} else if (path.endsWith(".zip")) {
					funcs.push(getZipCallbackFunction(zipObject));
				}
			});
			
			// invoke callback functions to get pieces
			async.parallel(funcs, function(err, args) {
				if (err) throw err;
				let pieces = [];
				for (let arg of args) {
					if (isArray(arg)) for (let piece of arg) pieces.push(piece);
					else pieces.push(arg);
				}
				onPieces(pieces);
			});
		});
		
		function getPieceCallbackFunction(zipObject) {
			return function(onPiece) {
				zipObject.async("string").then(function(str) {
					let piece;
					try {
						piece = JSON.parse(str);
						CryptoUtils.validatePiece(piece);
					} catch (err) {
						//throw err;
						console.log(err);
					}
					onPiece(null, {name: zipObject.name, piece: piece});
				});
			}
		}
		
		function getZipCallbackFunction(zipObject) {
			return function(callback) {
				zipObject.async("blob").then(function(blob) {
					CryptoUtils.zipToPieces(blob, function(pieces) {
						callback(null, pieces);
					});
				});
			}
		}
	},

	pieceToCsv: function(piece) {
		
		// convert piece to 2D array
		var arr = [];
		for (var i = 0; i < piece.length; i++) {
			arr.push([piece[i].address, piece[i].privateKey]);
		}
		
		// convert array to csv
		return arrToCsv(arr);
	},

	pieceToJson: function(piece) {
		return JSON.stringify(piece);
	},

	pieceToStr: function(piece) {
		var str = "";
		for (var i = 0; i < piece.length; i++) {
			str += "==== " + (i + 1) + " ====\n\n";
			str += "Public:\n" + piece[i].address + "\n\n";
			str += "Private:\n" + piece[i].privateKey + "\n\n";
		}
		return str.trim();
	},

	validatePiece: function(piece) {
		assertTrue(piece.length > 0);
		for (let key of piece) {
			assertDefined(key.crypto, "piece.crypto is not defined");
			assertDefined(key.isSplit, "piece.isSplit is not defined");
			assertDefined(key.privateKey, "piece.privateKey is not defined");
		}
	}
}