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
			CryptoUtils.plugins.push(new BitcoinCashPlugin());
			CryptoUtils.plugins.push(new LitecoinPlugin());
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
	 * Enumerates passphrase encryption/decryption schemes.
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
		return str.startsWith("U2") && (str.length === 128 || str.length === 108) && !hasWhitespace(str);
	},
	
	/**
	 * Determines if the given string is base58.
	 */
	isBase58: function(str) {
		return /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/.test(str)
	},
	
	/**
	 * Determines if the given string is a possible split piece of a private key (cannot be excluded as one).
	 * 
	 * A piece must be at least 47 characters and base58 encoded.
	 * 
	 * @returns true if the given string meets the minimum requirements to be a split piece
	 */
	isPossibleSplitPiece: function(str) {
		return str.length >= 47 && CryptoUtils.isBase58(str);
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
			let img = $("<img>");
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
	 * Applies the given config to the given keys.
	 * 
	 * config.includePublic specifies if public keys should be included
	 * config.includePrivate specifies if private keys should be included
	 */
	applyKeyConfig: function(keys, config) {
		
		// merge config with default
		config = Object.assign({}, getDefaultConfig(), config);
		function getDefaultConfig() {
			return {
				includePublic: true,
				includePrivate: true
			};
		}
		
		if (!config.includePublic) {
			for (let key of keys) delete key.getState().address;
		}
		
		if (!config.includePrivate) {
			for (let key of keys) {
				delete key.getState().hex;
				delete key.getState().wif;
				delete key.getState().encryption;
			}
		}
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
	 * Attempts to get a key from the given strings.
	 * 
	 * @param plugin is the currency plugin to parse the strings to a key
	 * @param strings is expected to be a private key or pieces
	 * @return CryptoKey if possible, null otherwise
	 */
	getKey: function(plugin, strs) {
		
		// validate input
		assertInitialized(strs);
		assertTrue(strs.length > 0);
		
		// parse single string
		if (strs.length === 1) {
			try {
				return plugin.newKey(strs[0]);
			} catch (err) {
				return null;
			}
		}
		
		// parse multiple strings
		else {
			try {
				return plugin.combine(strs);
			} catch (err) {
				return null;
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
			let piece = {};
			piece.version = "1.0";
			piece.keys = [];
			pieces.push(piece);
		}
		
		// add keys to each piece
		for (let key of keys) {
			if (!key.getWif() && !key.getHex() && numPieces > 1) throw new Error("Cannot split piece without private key");
			let keyPieces = numPieces > 1 ? key.getPlugin().split(key, numPieces, minPieces) : [key.getWif()];
			for (let i = 0; i < numPieces; i++) {
				let pieceKey = {};
				pieceKey.ticker = key.getPlugin().getTicker();
				pieceKey.address = key.getAddress();
				pieceKey.wif = keyPieces[i];
				pieceKey.split = numPieces > 1;
				if (pieceKey.wif) pieceKey.encryption = key.getEncryptionScheme();
				pieces[i].keys.push(pieceKey);
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
			for (let pieceKey of pieces[0].keys) {
				try {
					let state = {};
					state.address = pieceKey.address;
					state.wif = pieceKey.wif;
					state.encryption = pieceKey.encryption;
					let key = new CryptoKey(CryptoUtils.getCryptoPlugin(pieceKey.ticker), state.wif ? state.wif : state);
					if (key.getHex() && key.isEncrypted() && pieceKey.address) key.setAddress(pieceKey.address);	// check that address derived from private keys
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
				if (!numKeys) numKeys = piece.keys.length;
				else if (numKeys !== piece.keys.length) throw new Error("Pieces contain different number of keys");
			}
			
			// validate consistent keys across pieces
			for (let i = 0; i < pieces[0].keys.length; i++) {
				let crypto;
				let split;
				let address;
				let encryption;
				for (let piece of pieces) {
					if (!crypto) crypto = piece.keys[i].ticker;
					else if (crypto !== piece.keys[i].ticker) throw new Error("Pieces are for different cryptocurrencies");
					if (!split) split = piece.keys[i].split;
					else if (split !== piece.keys[i].split) throw new Error("Pieces have different split states");
					if (!address) address = piece.keys[i].address;
					else if (address !== piece.keys[i].address) throw new Error("Pieces have different addresses");
					if (!encryption) encryption = piece.keys[i].encryption;
					else if (encryption !== piece.keys[i].encryption) throw new Error("Pieces have different encryption states");
				}
			}
			
			// combine keys across pieces
			for (let i = 0; i < pieces[0].keys.length; i++) {
				let shares = [];
				for (let piece of pieces) shares.push(piece.keys[i].wif);
				try {
					let key = CryptoUtils.getCryptoPlugin(pieces[0].keys[i].ticker).combine(shares);
					if (key.isEncrypted() && pieces[0].keys[i].address) key.setAddress(pieces[0].keys[i].address);
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
	 * @param callback(name, blob) is invoked when zipping is complete
	 */
	piecesToZip: function(pieces, callback) {
		assertTrue(pieces.length > 0, "Pieces cannot be empty");
		
		// get common ticker
		let ticker = CryptoUtils.getCommonTicker(pieces[0]).toLowerCase();
		
		// prepare zip
		let zip = JSZip();
		for (let i = 0; i < pieces.length; i++) {
			let name = ticker + (pieces.length > 1 ? "_" + (i + 1) : "");
			zip.file(name + ".json", CryptoUtils.pieceToJson(pieces[i]));
		}
		
		// create zip
		zip.generateAsync({type:"blob"}).then(function(blob) {
			callback("cryptostorage_" + ticker + ".zip", blob);
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
		assertTrue(piece.keys.length > 0);
		
		// build csv header
		let csvHeader = [];
		for (let prop in piece.keys[0]) {
	    if (piece.keys[0].hasOwnProperty(prop)) {
	    	csvHeader.push(prop.toString().toUpperCase());
	    }
		}
		
		// build csv
		let csvArr = [];
		csvArr.push(csvHeader);
		for (let key of piece.keys) {
			let csvKey = [];
			for (let prop in key) {
				csvKey.push(isInitialized(key[prop]) ? key[prop] : "");
			}
			csvArr.push(csvKey);
		}
	
		// convert array to csv
		return arrToCsv(csvArr);
	},

	pieceToJson: function(piece) {
		return JSON.stringify(piece);
	},

	pieceToStr: function(piece) {
		let str = "";
		for (let i = 0; i < piece.keys.length; i++) {
			str += "===== #" + (i + 1) + " " + CryptoUtils.getCryptoPlugin(piece.keys[i].ticker).getName() + " =====\n\n";
			if (piece.keys[i].address) str += "Public Address:\n" + piece.keys[i].address + "\n\n";
			if (piece.keys[i].wif) str += "Private Key " + (piece.keys[i].split ? "(split)" : (piece.keys[i].encryption ? "(encrypted)" : "(unencrypted)")) + ":\n" + piece.keys[i].wif + "\n\n";
		}
		return str.trim();
	},
	
	pieceToAddresses: function(piece) {
		let str = "";
		for (let i = 0; i < piece.keys.length; i++) {
			str += "===== #" + (i + 1) + " " + CryptoUtils.getCryptoPlugin(piece.keys[i].ticker).getName() + " =====\n\n";
			if (piece.keys[i].address) str += "Public Address:\n" + piece.keys[i].address + "\n" + piece.keys[i].address + "\n\n";
		}
		return str.trim();
	},

	validatePiece: function(piece) {
		assertTrue(piece.keys.length > 0);
		for (let key of piece.keys) {
			assertDefined(key.ticker, "piece.ticker is not defined");
			assertDefined(key.split, "piece.split is not defined");
			//assertDefined(key.wif, "piece.wif is not defined");
		}
	},
	
	getCommonTicker: function(piece) {
		assertTrue(piece.keys.length > 0);
		let ticker;
		for (let pieceKey of piece.keys) {
			if (!ticker) ticker = pieceKey.ticker;
			else if (ticker !== pieceKey.ticker) return "mix";
		}
		return ticker;
	},
	
	/**
	 * Returns a version of the string up to the given maxLength characters.
	 * 
	 * If the string is longer than maxLength, shortens the string by replacing middle characters with '...'.
	 * 
	 * @param str is the string to shorten
	 * @param maxLength is the maximum length of the string
	 * @return the given str if str.length <= maxLength, shortened version otherwise
	 */
	getShortenedString: function(str, maxLength) {
		assertString(str);
		if (str.length <= maxLength) return str;
		let insert = '...';
		let sideLength = Math.floor((maxLength - insert.length) / 2);
		if (sideLength === 0) throw new Error("Cannot create string of length " + maxLength + " from string '" + str + "'");
		return str.substring(0, sideLength) + insert + str.substring(str.length - sideLength);
	},
	
	/**
	 * Generates keys, pieces, rendered pieces.
	 * 
	 * @param config is the key generation configuration
	 * @param onProgress(percent, label) is invoked as progress is made
	 * @param onDone(keys, pieces, pieceDivs) is invoked when done
	 */
	generateKeys: function(config, onProgress, onDone) {
		
		let decommissioned = false;	// TODO: remove altogether?
		
		// track done and total weight for progress
		let doneWeight = 0;
		let totalWeight = CryptoUtils.getWeightGenerateKeys(config);

		// load dependencies
		let dependencies = new Set();
		for (let currency of config.currencies) {
			for (let dependency of CryptoUtils.getCryptoPlugin(currency.ticker).getDependencies()) {
				dependencies.add(dependency);
			}
		}
		if (onProgress) onProgress(0, "Loading dependencies");
		LOADER.load(Array.from(dependencies), function() {
			
			// collect key creation functions
			let funcs = [];
			for (let currency of config.currencies) {
				for (let i = 0; i < currency.numKeys; i++) {
					funcs.push(newKeyFunc(CryptoUtils.getCryptoPlugin(currency.ticker)));
				}
			}
			
			// generate keys
			if (onProgress) onProgress(doneWeight / totalWeight, "Generating keys");
			async.series(funcs, function(err, keys) {
				if (decommissioned) {
					if (onDone) onDone();
					return;
				}
				if (err) throw err;
				let originals = keys;
				
				// collect encryption schemes
				let encryptionSchemes = [];
				for (let currency of config.currencies) {
					for (let i = 0; i < currency.numKeys; i++) {
						if (currency.encryption) encryptionSchemes.push(currency.encryption);
					}
				}
				
				// encrypt keys
				if (encryptionSchemes.length > 0) {
					assertEquals(keys.length, encryptionSchemes.length);
					
					// compute encryption + verification weight
					let encryptWeight = 0;
					for (let i = 0; i < encryptionSchemes.length; i++) {
						encryptWeight += CryptoUtils.getWeightEncryptKey(encryptionSchemes[i]) + (config.verifyEncryption ? CryptoUtils.getWeightDecryptKey(encryptionSchemes[i]) : 0);
					}
					
					// start encryption
					if (onProgress) onProgress(doneWeight / totalWeight, "Encrypting");
					CryptoUtils.encryptKeys(keys, encryptionSchemes, config.passphrase, config.verifyEncryption, function(percent, label) {
						onProgress((doneWeight + percent * encryptWeight) / totalWeight, label);
					}, function(err, encryptedKeys) {
						doneWeight += encryptWeight;
						generatePieces(encryptedKeys, config);
					});
				}
				
				// no encryption
				else {
					generatePieces(keys, config);
				}
			});
		});
		
		function newKeyFunc(plugin, callback) {
			return function(callback) {
				if (decommissioned) {
					callback();
					return;
				}
				setImmediate(function() {
					let key = plugin.newKey();
					doneWeight += CryptoUtils.getWeightCreateKey();
					if (onProgress) onProgress(doneWeight / totalWeight, "Generating keys");
					callback(null, key);
				});	// let UI breath
			}
		}
		
		function generatePieces(keys, config) {
			
			// convert keys to pieces
			let pieces = CryptoUtils.keysToPieces(keys, config.numPieces, config.minPieces);
			
			// verify pieces recreate keys
			let keysFromPieces = CryptoUtils.piecesToKeys(pieces);
			assertEquals(keys.length, keysFromPieces.length);
			for (let i = 0; i < keys.length; i++) {
				assertTrue(keys[i].equals(keysFromPieces[i]));
			}
			
			// render pieces to divs
			let renderWeight = PieceRenderer.getRenderWeight(keys.length, config.numPieces, null);
			if (onProgress) onProgress(doneWeight / totalWeight, "Rendering");
			PieceRenderer.renderPieces(pieces, null, null, function(percent) {
				if (onProgress) onProgress((doneWeight + percent * renderWeight) / totalWeight, "Rendering");
			}, function(err, pieceDivs) {
				if (err) throw err;
				assertEquals(pieces.length, pieceDivs.length);
				if (onProgress) onProgress(1, "Complete");
				if (onDone) onDone(keys, pieces, pieceDivs);
			});
		}
	},
	
	/**
	 * Encrypts the given keys with the given encryption schemes.
	 * 
	 * @param keys are the keys to encrypt
	 * @param encryptionSchemes are the schemes to encrypt the keys
	 * @param passphrase is the passphrase to encrypt the keys with
	 * @param verifyEncryption specifies if encryption should be verified by decrypting
	 * @param onProgress(percent, label) is invoked as progress is made
	 * @param onDone(err, encryptedKeys) is invoked when encryption is done
	 */
	encryptKeys: function(keys, encryptionSchemes, passphrase, verifyEncryption, onProgress, onDone) {
		assertEquals(keys.length, encryptionSchemes.length);
		assertInitialized(passphrase);
		
		let decommissioned = false;	// TODO: remove altogether?
		
		// collect originals if verifying encryption
		let originals;
		if (verifyEncryption) {
			originals = [];
			for (let key of keys) originals.push(key.copy());
		}
		
		// track weights for progress
		let doneWeight = 0;
		let verifyWeight = 0;
		let totalWeight = 0;
		
		// collect encryption functions and weights
		let funcs = [];
		for (let i = 0; i < keys.length; i++) {
			totalWeight += CryptoUtils.getWeightEncryptKey(encryptionSchemes[i]);
			if (verifyEncryption) verifyWeight += CryptoUtils.getWeightDecryptKey(encryptionSchemes[i]);
			funcs.push(encryptFunc(keys[i], encryptionSchemes[i], passphrase));
		}
		totalWeight += verifyWeight;
		
		// encrypt async
		if (onProgress) onProgress(0, "Encrypting");
		async.parallelLimit(funcs, ENCRYPTION_THREADS, function(err, encryptedKeys) {
			
			// verify encryption
			if (verifyEncryption) {
				
				// copy encrypted keys
				let encryptedCopies = [];
				for (let encryptedKey of encryptedKeys) encryptedCopies.push(encrytpedKey.copy());
				
				// decrypt keys
				if (onProgress) onProgress(doneWeight / totalWeight, "Verifying encryption");
				CryptoUtils.decryptKeys(encryptedCopies, passphrase, function(percent) {
					if (onProgress) onProgress((doneWeight + percent * verifyWeight) / totalWeight);
				}, function(err, decryptedKeys) {
					doneWeight += verifyWeight;
					
					// assert originals match decrypted keys
					assertEquals(originals.length, decryptedKeys.length);
					for (let i = 0; i < originals.length; i++) {
						assertTrue(originals[i].equals(decryptedKeys[i]));
					}
					
					// done
					if (onDone) onDone(err, encryptedKeys);
				})
			}
			
			// don't verify encryption
			else {
				if (onDone) onDone(err, encryptedKeys);
			}
		});
		
		function encryptFunc(key, scheme, passphrase) {
			return function(callback) {
				if (decommissioned) {
					callback();
					return;
				}
				encryptKey(scheme, key, passphrase, function(err, key) {
					doneWeight += CryptoUtils.getWeightEncryptKey(scheme);
					if (onProgress) onProgress(doneWeight / totalWeight, "Encrypting");
					setImmediate(function() { callback(err, key); });	// let UI breath
				});
			}
		}
		
		/**
		 * Encrypts the given key with the given scheme and passphrase.
		 * 
		 * @param scheme is the scheme to encrypt the key
		 * @param key is an unencrypted key to encrypt
		 * @param passphrase is the passphrase to encrypt with
		 * @param onDone(err, encryptedKey) is invoked when done
		 */
		function encryptKey(scheme, key, passphrase, onDone) {
			if (!scheme) throw new Error("Scheme must be initialized");
			if (!isObject(key, 'CryptoKey')) throw new Error("Given key must be of class 'CryptoKey' but was " + cryptoKey);
			if (!passphrase) throw new Error("Passphrase must be initialized");
			switch (scheme) {
				case CryptoUtils.EncryptionScheme.CRYPTOJS:
					let b64 = CryptoJS.AES.encrypt(key.getHex(), passphrase).toString();
					key.setState(Object.assign(key.getPlugin().newKey(b64).getState(), {address: key.getAddress()}));
					onDone(null, key);
					break;
				case CryptoUtils.EncryptionScheme.BIP38:
					let decoded = bitcoinjs.decode(key.getWif());
					let encryptedWif = bitcoinjs.encrypt(decoded.privateKey, true, passphrase);
					key.setState(Object.assign(key.getPlugin().newKey(encryptedWif).getState(), {address: key.getAddress()}));
					onDone(null, key);
					break;
				default:
					onDone(new Error("Encryption scheme '" + scheme + "' not supported"));
			}
		}
	},
	
	/**
	 * Decrypts the given keys.
	 * 
	 * @param keys are the encrypted keys to decrypt
	 * @param phassphrase is the phassphrase to decrypt the keys
	 * @param onProgress(done, total) is called as progress is made
	 * @param onDone(err, decryptedKeys) is called when decryption is complete
	 */
	decryptKeys: function(keys, passphrase, onProgress, onDone) {
		
		let decommissioned = false;	// TODO: remove altogether?
		
		// validate input
		assertInitialized(keys);
		assertTrue(keys.length > 0);
		assertInitialized(passphrase);
		assertInitialized(onDone);
		
		// compute weight
		let totalWeight = 0;
		for (let key of keys) {
			totalWeight += CryptoUtils.getWeightDecryptKey(key.getEncryptionScheme());
		}
		
		// decrypt keys
		let funcs = [];
		for (let key of keys) funcs.push(decryptFunc(key, passphrase));
		let doneWeight = 0;
		if (onProgress) onProgress(doneWeight, totalWeight);
		async.parallelLimit(funcs, ENCRYPTION_THREADS, function(err, result) {
			if (decommissioned) return;
			else if (err) onDone(err);
			else onDone(null, keys);
		});
		
		// decrypts one key
		function decryptFunc(key, passphrase) {
			return function(callback) {
				if (decommissioned) return;
				let scheme = key.getEncryptionScheme();
				decryptKey(key, passphrase, function(err, key) {
					if (err) onDone(err);
					else {
						doneWeight += CryptoUtils.getWeightDecryptKey(scheme);
						if (onProgress) onProgress(doneWeight, totalWeight);
						setImmediate(function() { callback(err, key); });	// let UI breath
					}
				});
			}
		}
		
		/**
		 * Decrypts the given key with the given passphrase.
		 * 
		 * @param key is the key to decrypt
		 * @param passphrase is the passphrase to decrypt the key
		 * @param onDone(err, decryptedKey) is invoked when done
		 */
		function decryptKey(key, passphrase, onDone) {
			if (!isObject(key, 'CryptoKey')) throw new Error("Given key must be of class 'CryptoKey' but was " + cryptoKey);
			if (!passphrase) throw new Error("Passphrase must be initialized");
			assertTrue(key.isEncrypted());
			switch (key.getEncryptionScheme()) {
				case CryptoUtils.EncryptionScheme.CRYPTOJS:
					let hex;
					try {
						hex = CryptoJS.AES.decrypt(key.getWif(), passphrase).toString(CryptoJS.enc.Utf8);
					} catch (err) { }
					if (!hex) onDone(new Error("Incorrect passphrase"));
					else {
						try {
							key.setPrivateKey(hex);
							onDone(null, key);
						} catch (err) {
							onDone(new Error("Incorrect passphrase"));
						}
					}
					break;
				case CryptoUtils.EncryptionScheme.BIP38:
					ninja.privateKey.BIP38EncryptedKeyToByteArrayAsync(key.getWif(), passphrase, function(resp) {
						if (resp.message) onDone(new Error("Incorrect passphrase"));
						else {
							let wif = new Bitcoin.ECKey(resp).setCompressed(true).getBitcoinWalletImportFormat()
							key.setPrivateKey(wif);
							onDone(null, key);
						}
					});
					break;
				default:
					onDone(new Error("Encryption scheme '" + key.getEncryptionScheme() + "' not supported"));
			}
		}
	},
	
	// Relative weights of key generation derived from experimentation and used for representative progress bars
	
	/**
	 * Computes the total weight for the given key generation configuration.
	 * 
	 * @param keyGenConfig is the key generation configuration to get the weight of
	 * @return the weight of the given key genereation configuration
	 */
	getWeightGenerateKeys: function(keyGenConfig) {
		let weight = 0;
		let numKeys = 0;
		for (let currency of keyGenConfig.currencies) {
			numKeys += currency.numKeys;
			weight += currency.numKeys * CryptoUtils.getWeightCreateKey();
			if (currency.encryption) weight += currency.numKeys * (CryptoUtils.getWeightEncryptKey(currency.encryption) + (keyGenConfig.verifyEncryption ? CryptoUtils.getWeightDecryptKey(currency.encryption) : 0));
		}
		return weight + PieceRenderer.getRenderWeight(numKeys, keyGenConfig.numPieces, null);
	},
	
	/**
	 * Returns the weight to encrypt a key with the given scheme.
	 * 
	 * @param scheme is the scheme to encrypt a key with
	 * @returns weight is the weight to encrypt a key with the given scheme
	 */
	getWeightEncryptKey: function(scheme) {
		switch (scheme) {
			case CryptoUtils.EncryptionScheme.BIP38:
				return 4187;
			case CryptoUtils.EncryptionScheme.CRYPTOJS:
				return 10;
			default: throw new Error("Unrecognized encryption scheme: " + scheme);
		}
	},
	
	/**
	 * Returns the weight to decrypt the given keys.
	 * 
	 * @param encryptedKeys are encrypted keys to determine the weight of to decrypt
	 * @returns the weight to decrypt the given keys
	 */
	getWeightDecryptKeys: function(encryptedKeys) {
		let weight = 0;
		for (let key of encryptedKeys) {
			assertTrue(key.isEncrypted());
			weight += CryptoUtils.getWeightDecryptKey(key.getEncryptionScheme());
		}
		return weight;
	},

	/**
	 * Returns the weight to decrypt a key with the given scheme.
	 * 
	 * @param scheme is the scheme to decrypt a key with
	 * @returns weight is the weigh tto decrypt a key with the given scheme
	 */
	getWeightDecryptKey: function(scheme) {
		switch (scheme) {
			case CryptoUtils.EncryptionScheme.BIP38:
				return 4581;
			case CryptoUtils.EncryptionScheme.CRYPTOJS:
				return 100;
			default: throw new Error("Unrecognized encryption scheme: " + scheme);
		}
	},
	
///**
//* Returns the total weight to encrypt keys with the given schemes.
//* 
//* @param schemes is an array of schemes representing keys to encrypt
//* @returns the total weight to encrypt keys with the given schemes
//*/
//getEncryptSchemesWeight: function(schemes) {
//	let weight = 0;
//	for (let scheme of schemes) weight += getWeightEncryptKey(scheme);
//	return weight;
//	
//	function getWeightEncryptKey(scheme) {
//
//	}
//},
	
///**
//* Returns the total weight to decrypt keys with the given schemes.
//* 
//* @param schemes is an array of schemes representing keys to decrypt
//* @returns the total weight to decrypt keys with the given schemes
//*/
//getDecryptSchemesWeight: function(schemes) {
//	let weight = 0;
//	for (let scheme of schemes) weight += getWeightDecryptKey(scheme);
//	return weight;
//},
	
	getWeightCreateKey: function() { return 63; },
}