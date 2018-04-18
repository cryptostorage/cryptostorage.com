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
 * Encapsulates a 'piece' which is a collection of keypairs.
 * 
 * Initializes from the first non-null argument.
 * 
 * @param config specifies initialization configuration
 * 				config.keypairs keypairs are keypairs to initialize with
 * 				config.json is json to initialize from
 * 				config.csv is csv to initialize from
 * 				config.splitPieces are split pieces to combine and initialize from
 * 				config.piece is an existing piece to copy from
 *  			config.pieceNum is the pieceNumber to assign to each piece (optional)
 */
function CryptoPiece(config) {
	
	var that = this;
	var state;
		
	this.getKeypairs = function() {
		return state.keypairs;
	}
	
	this.encrypt = function(passphrase, schemes, onProgress, onDone) {
		
		// verify input
		try {
			assertInitialized(passphrase);
			assertEquals(state.keypairs.length, schemes.length);
			assertInitialized(onDone);
		} catch (err) {
			onDone(err);
			return;
		}
		
		// track weights for progress
		var doneWeight = 0;
		var totalWeight = CryptoKeypair.getEncryptWeight(schemes);
		
		// collect encryption functions
		var funcs = [];
		for (var i = 0; i < state.keypairs.length; i++) {
			funcs.push(encryptFunc(state.keypairs[i], schemes[i], passphrase));
		}
		
		// encrypt async
		if (onProgress) onProgress(0, "Encrypting");
		async.parallelLimit(funcs, AppUtils.ENCRYPTION_THREADS, function(err, encryptedKeypairs) {
			if (err) onDone(err);
			else onDone(null, that);
		});
		
		function encryptFunc(keypair, scheme, passphrase) {
			return function(onDone) {
				keypair.encrypt(scheme, passphrase, function(percent) {
					if (onProgress) onProgress((doneWeight +  CryptoKeypair.getEncryptWeight(scheme) * percent) / totalWeight, "Encrypting");
				}, function(err, keypair) {
					if (err) onDone(err);
					else {
						assertTrue(keypair.isEncrypted());
						doneWeight += CryptoKeypair.getEncryptWeight(scheme);
						if (onProgress) onProgress(doneWeight / totalWeight, "Encrypting");
						setImmediate(function() { onDone(null, keypair); });	// let UI breath
					}
				});
			}
		}
	}
	
	this.isEncrypted = function() {
		var bool = -1;
		for (var i = 0; i < state.keypairs.length; i++) {
			if (bool === -1) bool = state.keypairs[i].isEncrypted();
			else if (bool !== state.keypairs[i].isEncrypted()) throw new Error("state.keypairs[" + i + "] encryption is inconsistent");
		}
		return bool;
	}
	
	this.decrypt = function(passphrase, onProgress, onDone) {

		// validate input
		try {
			assertTrue(state.keypairs.length > 0);
			assertInitialized(passphrase);
			assertInitialized(onDone);
		} catch (err) {
			onDone(err);
			return;
		}
		
		// compute total weight
		var totalWeight = 0;
		for (var i = 0; i < state.keypairs.length; i++) {
			totalWeight += CryptoKeypair.getDecryptWeight(state.keypairs[i].getEncryptionScheme());
		}
		
		// decrypt keys
		var funcs = [];
		for (var i = 0; i < state.keypairs.length; i++) funcs.push(decryptFunc(state.keypairs[i], passphrase));
		var doneWeight = 0;
		if (onProgress) onProgress(0, "Decrypting");
		async.parallelLimit(funcs, AppUtils.ENCRYPTION_THREADS, function(err, encryptedKeypairs) {
			if (err) {
				onDone(err);
				return;
			} else {
				assertEquals(doneWeight, totalWeight);
				onDone(null, that);
			}
		});
		
		// decrypts one key
		function decryptFunc(keypair, passphrase) {
			return function(onDone) {
				var scheme = keypair.getEncryptionScheme();
				keypair.decrypt(passphrase, function(percent) {
					if (onProgress) onProgress((doneWeight + CryptoKeypair.getDecryptWeight(scheme) * percent) / totalWeight, "Decrypting");
				}, function(err, encryptedKeypair) {
					if (err) {
						onDone(err);
						return;
					} else {
						doneWeight += CryptoKeypair.getDecryptWeight(scheme);
						if (onProgress) onProgress(doneWeight / totalWeight, "Decrypting");
						setImmediate(function() { onDone(err, encryptedKeypair); });	// let UI breath
					}
				});
			}
		}
	}
	
	this.split = function(numShares, minShares) {
		
		// collect all split keypairs
		var allSplitKeypairs = [];
		for (var i = 0; i < numShares; i++) allSplitKeypairs.push([]);
		for (var i = 0; i < state.keypairs.length; i++) {
			var splitKeypairs = state.keypairs[i].split(numShares, minShares);
			for (var j = 0; j < splitKeypairs.length; j++) {
				allSplitKeypairs[j].push(splitKeypairs[j]);
			}
		}
		
		// build split pieces
		var splitPieces = [];
		for (var i = 0; i < allSplitKeypairs.length; i++) {
			splitPieces.push(new CryptoPiece({keypairs: allSplitKeypairs[i]}));
		}
		return splitPieces;
	}
	
	this.isSplit = function() {
		assertTrue(state.keypairs.length > 0);
		var split = -1;
		for (var i = 0; i < state.keypairs.length; i++) {
			if (split === -1) split = state.keypairs[i].isSplit();
			else if (split !== state.keypairs[i].isSplit()) throw new Error("keypair[" + i + "] has an inconsistent split state");
		}
		return split;
	}
	
	this.getPieceNum = function() {
		assertTrue(state.keypairs.length > 0);
		var pieceNum = -1;
		for (var i = 0; i < state.keypairs.length; i++) {
			if (pieceNum === -1) pieceNum = state.keypairs[i].getShareNum();
			else if (pieceNum !== state.keypairs[i].getShareNum()) throw new Error("keypair[" + i + "] has an inconsistent share num");
		}
		return pieceNum;
	}
	
	this.toJson = function() {
		var json = {};
		json.pieceNum = that.getPieceNum();
		json.version = AppUtils.VERSION;
		json.keypairs = [];
		for (var i = 0; i < state.keypairs.length; i++) {
			json.keypairs.push(state.keypairs[i].toJson());
		}
		return json;
	}
	
	this.toCsv = function() {
		
		// collect headers
		var headers = [];
		for (prop in CryptoKeypair.CsvHeader) {
			if (CryptoKeypair.CsvHeader.hasOwnProperty(prop)) {
	    	headers.push(CryptoKeypair.CsvHeader[prop.toString()]);
	    }
		}
		
		// collect content
		var csvArr = [headers];
		for (i = 0; i < state.keypairs.length; i++) {
			var keypairValues = [];
			for (var j = 0; j < headers.length; j++) {
				var value = state.keypairs[i].getCsvValue(headers[j]);
				if (value === null) value = "null";
				if (value === undefined) value = "";
				keypairValues.push(value);
			}
			csvArr.push(keypairValues);
		}
		
		// convert array to csv
		return arrToCsv(csvArr);
	}
	
	this.copy = function() {
		var keypairCopies = [];
		for (var i = 0; i < state.keypairs.length; i++) keypairCopies.push(state.keypairs[i].copy());
		return new CryptoPiece({keypairs: keypairCopies});
	}
	
	this.equals = function(piece) {
		assertObject(piece, CryptoPiece);
		return objectsEqual(that.toJson(), piece.toJson());
	}
	
	this.getState = function() {
		return state;
	}
	
	// -------------------------------- PRIVATE ---------------------------------
	
	init();
	function init() {
		state = {};
		if (config.keypairs) setKeypairs(config.keypairs, config.pieceNum);
		else if (config.json) fromJson(config.json);
		else if (config.splitPieces) combine(config.splitPieces);
		else if (config.piece) fromPiece(config.piece);
		else if (config.csv) fromCsv(config.csv);
		else throw new Error("All arguments null");
	}
	
	function setKeypairs(keypairs, pieceNum) {
		assertTrue(keypairs.length > 0);
		for (var i = 0; i < keypairs.length; i++) {
			assertObject(keypairs[i], CryptoKeypair);
			if (isDefined(pieceNum)) keypairs[i].setShareNum(pieceNum);
		}
		state.keypairs = keypairs;
	}
	
	function fromJson(json) {
		assertArray(json.keypairs);
		assertTrue(json.keypairs.length > 0);
		state.pieceNum = json.pieceNum;
		state.version = AppUtils.VERSION;
		var keypairs = [];
		for (var i = 0; i < json.keypairs.length; i++) {
			keypairs.push(new CryptoKeypair({json: json.keypairs[i]}));
		}
		setKeypairs(keypairs);
	}
	
	function fromCsv(csv) {
		assertString(csv);
		assertInitialized(csv);
		
		// convert csv to array
		var csvArr = csvToArr(csv);
		assertTrue(csvArr.length > 0);
		assertTrue(csvArr[0].length > 0);
		
		// build keypairs
		var keypairs = [];
		for (var row = 1; row < csvArr.length; row++) {
			var keypairConfig = {};
			for (var col = 0; col < csvArr[0].length; col++) {
				var value = csvArr[row][col];
				if (value === "") value = undefined;
				if (value === "null") value = null;
				switch (csvArr[0][col]) {
					case CryptoKeypair.CsvHeader.TICKER:
						keypairConfig.plugin = AppUtils.getCryptoPlugin(value);
						break;
					case CryptoKeypair.CsvHeader.PRIVATE_WIF:
					case CryptoKeypair.CsvHeader.PRIVATE_HEX:
						keypairConfig.privateKey = value;
						break;
					case CryptoKeypair.CsvHeader.PUBLIC_ADDRESS:
						keypairConfig.publicAddress = value;
						break;
					case CryptoKeypair.CsvHeader.SHARE_NUM:
						keypairConfig.shareNum = value;
						break;
				}
			}
			keypairs.push(new CryptoKeypair(keypairConfig));
		}
		
		// set internal keypars
		setKeypairs(keypairs);
	}
	
	function combine(splitPieces) {
		
		// verify consistent num keypairs
		var numKeypairs;
		for (var i = 0; i < splitPieces.length; i++) {
			if (!numKeypairs) numKeypairs = splitPieces[i].getKeypairs().length;
			else if (numKeypairs !== splitPieces[i].getKeypairs().length) throw new Error("config.splitPieces[" + i + "].getKeypairs() has inconsistent number of keypairs");
		}
		assertTrue(numKeypairs > 0);
		
		// combine keypairs
		var combinedKeypairs = [];
		for (var i = 0; i < numKeypairs; i++) {
			var splitKeypairs = [];
			for (var j = 0; j < splitPieces.length; j++) splitKeypairs.push(splitPieces[j].getKeypairs()[i]);
			combinedKeypairs.push(new CryptoKeypair({splitKeypairs: splitKeypairs}));
		}
		
		// set keypairs to combined keypairs
		setKeypairs(combinedKeypairs);
	}
	
	function fromPiece(piece) {
		var keypairCopies = [];
		for (var i = 0; i < piece.getKeypairs().length; i++) {
			keypairCopies.push(piece.getKeypairs()[i].copy());
		}
		setKeypairs(keypairCopies);
	}
}

/**
 * Utility to generate pieces according to the given configuration.
 * 
 * @param config is the piece generation configuration
 * 				config.keypairs: [{ticker: ..., numKeypairs: ..., encryption: ...}, ...]
 * 	 			config.passphrase: passphrase string
 * 	 			config.numPieces: undefined or number
 * 				config.minPieces: undefined or number
 * 				config.rendererClass: class to render pieces
 * 
 * @param onProgress(percent, label) is invoked as progress is made
 * @param onDone(err, pieces, pieceRenderers) is invoked when done
 */
CryptoPiece.generatePieces = function(config, onProgress, onDone) {
	
	// validate gen config
	CryptoPiece.validateGenerateConfig(config);
	
	// compute weights
	var createWeight = 0;
	var encryptWeight = 0;
	var numKeypairs = 0;
	for (var i = 0; i < config.keypairs.length; i++) {
		var keypair = config.keypairs[i];
		numKeypairs += keypair.numKeypairs;
		createWeight += CryptoKeypair.getCreateWeight(keypair.ticker);
		if (keypair.encryption) encryptWeight += CryptoKeypair.getEncryptWeight(keypair.encryption);
	}
	var renderWeight = config.rendererClass ? config.rendererClass.getRenderWeight(config.keypairs) * (config.numPieces ? config.numPieces : 1) : 0;
	var totalWeight = createWeight + encryptWeight + renderWeight;
	var doneWeight = 0;
	
	// generate keypairs
	if (onProgress) onProgress(0, "Generating keypairs");
	var keypairs = [];
	var schemes = [];
	for (var i = 0; i < config.keypairs.length; i++) {
		var plugin = AppUtils.getCryptoPlugin(config.keypairs[i].ticker);
		for (var j = 0; j < config.keypairs[i].numKeypairs; j++) {
			keypairs.push(new CryptoKeypair({plugin: plugin}));
			doneWeight += (1 / numKeypairs) * createWeight;
			if (onProgress) onProgress(doneWeight / totalWeight, "Generating keypairs");
			schemes.push(config.keypairs[i].encryption);
		}
	}
	
	// initialize piece
	var piece = new CryptoPiece({keypairs: keypairs});
	
	// encrypt
	if (encryptWeight > 0) {
		if (onProgress) onProgress(doneWeight / totalWeight, "Encrypting keypairs");
		piece.encrypt(config.passphrase, schemes, function(percent, label) {
			if (onProgress) onProgress((doneWeight + percent * encryptWeight) / totalWeight, "Encrypting keypairs");
		}, function(err, encryptedPiece) {
			if (err) {
				onDone(err);
				return;
			}
			doneWeight += encryptWeight;
			splitAndRender();
		});
	}
	
	// otherwise split and render
	else {
		splitAndRender();
	}
	
	function splitAndRender() {
		
		// split pieces if applicable
		var pieces = config.numPieces ? piece.split(config.numPieces, config.minPieces) : [piece];
		
		// render each piece
		if (config.rendererClass) {
			
			// collect renderers
			var renderers = [];
			for (var i = 0; i < pieces.length; i++) {
				renderers.push(new config.rendererClass(null, pieces[i], function(percent, label) {
					if (onProgress) onProgress((doneWeight + percent * renderWeight) / totalWeight, label);
				}));
			}
			
			// collect render callback functions
			var renderFuncs = [];
			for (var i = 0; i < renderers.length; i++) {
				renderFuncs.push(renderFunction(renderers[i]));
			}
			function renderFunction(renderer) {
				return function(onDone) {
					renderer.render(function(div) {
						onDone(null, renderer);
					});
				}
			}
			
			// render async
			if (onProgress) onProgress(doneWeight / totalWeight, "Rendering keypairs");
			async.series(renderFuncs, function(err, renderers) {
				if (err) onDone(err);
				else {
					doneWeight += renderWeight;
					assertEquals(doneWeight, totalWeight);
					onDone(null, pieces, renderers);
				}
			});
		} else {
			assertEquals(doneWeight, totalWeight);
			onDone(null, pieces, null);
		}
	}
}

/**
 * Validates piece generation configuration.
 * 
 * @param config is the config to validate
 */
CryptoPiece.validateGenerateConfig = function(config) {
	assertObject(config);
	
	// validate keypairs
	var schemes = [];
	assertArray(config.keypairs);
	assertTrue(config.keypairs.length > 0);
	for (var i = 0; i < config.keypairs.length; i++) {
		assertInitialized(config.keypairs[i].ticker);
		assertNumber(config.keypairs[i].numKeypairs);
		assertTrue(config.keypairs[i].numKeypairs > 0);
		assertTrue(config.keypairs[i].numKeypairs <= AppUtils.MAX_KEYPAIRS);
		schemes.push(config.keypairs[i].encryption);
	}
	
	// validate encryption
	var useEncryption = -1;
	for (var i = 0; i < schemes.length; i++) {
		if (useEncryption === -1) useEncryption = schemes[i] === null ? null : schemes[i] === undefined ? undefined : true;
		else {
			if (isInitialized(schemes[i])) assertTrue(useEncryption);
			else assertEquals(useEncryption, schemes[i]);
		}
	}
	
	// validate passphrase
	if (useEncryption) {
		assertString(config.passphrase);
		assertTrue(config.passphrase.length >= AppUtils.MIN_PASSPHRASE_LENGTH)
	}
	
	// validate split config
	if (isDefined(config.numPieces) || isDefined(config.minPieces)) {
		assertNumber(config.numPieces);
		assertNumber(config.minPieces);
		assertTrue(config.numPieces >= 2);
		assertTrue(config.numPieces <= AppUtils.MAX_SHARES);
		assertTrue(config.minPieces >= 2);
		assertTrue(config.minPieces <= AppUtils.MAX_SHARES);
		assertTrue(config.minPieces <= config.numPieces);
	}
	
	// validate piece renderer
	if (config.rendererClass) {
		assertDefined(config.rendererClass.getRenderWeight);
	}
}