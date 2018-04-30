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
 * Encapsulates a collection of keypairs.
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
	
	this.hasPublicAddresses = function() {
		var bool;
		for (var i = 0; i < state.keypairs.length; i++) {
			if (!state.keypairs[i].isPublicApplicable()) continue;
			if (isUndefined(bool)) bool = state.keypairs[i].hasPublicAddress();
			else if (bool !== state.keypairs[i].hasPublicAddress()) throw new Error("Inconsistent hasPublicAddress() on keypair[" + i + "]");
		}
		return isDefined(bool) ? bool : false;
	}
	
	this.hasPrivateKeys = function() {
		var bool;
		for (var i = 0; i < state.keypairs.length; i++) {
			if (isUndefined(bool)) bool = state.keypairs[i].hasPrivateKey();
			else if (bool !== state.keypairs[i].hasPrivateKey()) throw new Error("Inconsistent hasPrivateKey() on keypair[" + i + "]");
		}
		return bool;
	}
	
	this.encrypt = function(passphrase, schemes, onProgress, onDone) {
		
		// verify input
		assertFalse(that.isEncrypted());
		assertInitialized(passphrase);
		assertEquals(state.keypairs.length, schemes.length);
		assertInitialized(onDone);
		
		// track weights for progress
		var doneWeight = 0;
		var totalWeight = CryptoKeypair.getEncryptWeight(schemes);
		
		// collect encryption functions
		var funcs = [];
		for (var i = 0; i < state.keypairs.length; i++) {
			funcs.push(encryptFunc(state.keypairs[i], schemes[i], passphrase));
		}
		
		// encrypt async
		if (onProgress) onProgress(0, "Encrypting keypairs");
		setImmediate(function() {	// let browser breath
			async.parallelLimit(funcs, AppUtils.ENCRYPTION_THREADS, function(err, encryptedKeypairs) {
				if (err) onDone(err);
				else onDone(null, that);
			});
		});
		
		function encryptFunc(keypair, scheme, passphrase) {
			return function(onDone) {
				keypair.encrypt(scheme, passphrase, function(percent) {
					if (onProgress) onProgress((doneWeight +  CryptoKeypair.getEncryptWeight(scheme) * percent) / totalWeight, "Encrypting keypairs");
				}, function(err, keypair) {
					if (err) onDone(err);
					else {
						assertTrue(keypair.isEncrypted());
						doneWeight += CryptoKeypair.getEncryptWeight(scheme);
						if (onProgress) onProgress(doneWeight / totalWeight, "Encrypting keypairs");
						setImmediate(function() { onDone(null, keypair); });	// let UI breath
					}
				});
			}
		}
	}
	
	this.isEncrypted = function() {
		var encryption = -1;
		for (var i = 0; i < state.keypairs.length; i++) {
			if (encryption === -1) encryption = state.keypairs[i].isEncrypted();
			else if (encryption !== state.keypairs[i].isEncrypted()) throw new Error("state.keypairs[" + i + "] encryption is inconsistent");
		}
		return encryption;
	}
	
	this.decrypt = function(passphrase, onProgress, onDone) {

		// validate input
		assertTrue(that.isEncrypted());
		assertTrue(state.keypairs.length > 0);
		assertInitialized(passphrase);
		assertInitialized(onDone);
		
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
		setImmediate(function() {	// let browser breath
			async.parallelLimit(funcs, AppUtils.ENCRYPTION_THREADS, function(err, encryptedKeypairs) {
				if (err) onDone(err);
				else {
					assertEquals(doneWeight, totalWeight);
					onDone(null, that);
				}
			});
		});
		
		// decrypts one key
		function decryptFunc(keypair, passphrase) {
			return function(onDone) {
				var scheme = keypair.getEncryptionScheme();
				keypair.decrypt(passphrase, function(percent) {
					if (onProgress) onProgress((doneWeight + CryptoKeypair.getDecryptWeight(scheme) * percent) / totalWeight, "Decrypting");
				}, function(err, encryptedKeypair) {
					if (err) onDone(err);
					else {
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
		return state.keypairs[0].isSplit();
	}
	
	this.getMinPieces = function() {
		assertTrue(state.keypairs.length > 0);
		return state.keypairs[0].getMinShares();
	}
	
	this.getPieceNum = function() {
		assertTrue(state.keypairs.length > 0);
		return state.keypairs[0].getShareNum();
	}
	
	this.setPieceNum = function(pieceNum) {
		for (var i = 0; i < state.keypairs.length; i++) state.keypairs[i].setShareNum(pieceNum);
		return this;
	}
	
	this.removePublicAddresses = function() {
		for (var i = 0; i < state.keypairs.length; i++) state.keypairs[i].removePublicAddress();
		return this;
	}
	
	this.removePrivateKeys = function() {
		for (var i = 0; i < state.keypairs.length; i++) state.keypairs[i].removePrivateKey();
		return this;
	}
	
	this.copy = function() {
		var keypairCopies = [];
		for (var i = 0; i < state.keypairs.length; i++) keypairCopies.push(state.keypairs[i].copy());
		return new CryptoPiece({keypairs: keypairCopies});
	}
	
	this.toString = function(fileType) {
		switch (fileType) {
			case AppUtils.FileType.CSV:
				return that.toCsv();
			case AppUtils.FileType.TXT:
				return that.toTxt();
			case AppUtils.FileType.JSON:
				return that.toJsonStr();
			default:
				assertUndefined(fileType);
				return that.toJsonStr();
		}
	}
	
	this.toJson = function() {
		var json = {};
		json.pieceNum = that.getPieceNum();
		json.version = AppUtils.VERSION;
		json.keypairs = [];
		for (var i = 0; i < state.keypairs.length; i++) json.keypairs.push(state.keypairs[i].toJson());
		return json;
	}
	
	this.toJsonStr = function() {
		return JSON.stringify(that.toJson());
	}
	
	this.toCsv = function() {
		
		// columns to exclude
		var excludes = [CryptoKeypair.CsvHeader.PRIVATE_HEX, CryptoKeypair.CsvHeader.MIN_SHARES];
		
		// collect headers
		var headers = [];
		for (prop in CryptoKeypair.CsvHeader) {
			if (arrayContains(excludes, prop.toString())) continue;
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
	
	this.toTxt = function() {
		var str = "";
		for (var i = 0; i < state.keypairs.length; i++) {
			str += "===== #" + (i + 1) + " " + state.keypairs[i].getPlugin().getName() + " =====\n\n";
			if (state.keypairs[i].getPublicAddress()) str += "Public Address:\n" + state.keypairs[i].getPublicAddress() + "\n\n";
			if (state.keypairs[i].getPrivateWif()) str += state.keypairs[i].getPlugin().getPrivateLabel() + " " + (that.getPieceNum() ? "(split)" : (state.keypairs[i].isEncrypted() ? "(encrypted)" : "(unencrypted)")) + ":\n" + state.keypairs[i].getPrivateWif() + "\n\n";
		}
		return str.trim();
	}
	
	this.equals = function(piece) {
		assertObject(piece, CryptoPiece);
		var state2 = piece.getInternalState();
		if (state.version !== state2.version) return false;
		if (state.pieceNum !== state2.pieceNum) return false;
		if (state.keypairs.length !== state2.keypairs.length) return false;
		for (var i = 0; i < state.keypairs.length; i++) {
			if (!state.keypairs[i].equals(state2.keypairs[i])) return false;
		}
		return true;
	}
	
	this.getInternalState = function() {
		return state;
	}
	
	this.getEncryptWeight = function() {
		assertFalse(this.isEncryped(), "Cannot get encrypt weight if piece is unencrypted");
		throw new Error("Not implemented");
	}
	
	this.getDecryptWeight = function() {
		assertTrue(this.isEncrypted(), "Cannot get decrypt weight if piece is encrypted");
		var schemes = [];
		for (var i = 0; i < state.keypairs.length; i++) schemes.push(state.keypairs[i].getEncryptionScheme());
		return CryptoKeypair.getDecryptWeight(schemes);
	}
	
	// -------------------------------- PRIVATE ---------------------------------
	
	init();
	function init() {
		state = {};
		if (config.keypairs) setKeypairs(config.keypairs);
		else if (config.json) fromJson(config.json);
		else if (config.splitPieces) combine(config.splitPieces);
		else if (config.piece) fromPiece(config.piece);
		else if (config.csv) fromCsv(config.csv);
		else throw new Error("Config missing required fields");
		if (isDefined(config.pieceNum)) that.setPieceNum(config.pieceNum);
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
		if (isString(json)) json = JSON.parse(json);
		assertArray(json.keypairs);
		assertTrue(json.keypairs.length > 0);
		var keypairs = [];
		for (var i = 0; i < json.keypairs.length; i++) keypairs.push(new CryptoKeypair({json: json.keypairs[i]}));
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
						if (value) {
							value = parseInt(value, 10);
							assertTrue(isInt(value));
						}
						keypairConfig.shareNum = value;
						break;
				}
			}
			keypairs.push(new CryptoKeypair(keypairConfig));
		}
		
		// set internal keypairs
		setKeypairs(keypairs);
	}
	
	function combine(splitPieces) {
		
		// verify consistent min pieces and num keypairs
		var minPieces;
		var numKeypairs;
		for (var i = 0; i < splitPieces.length; i++) {
			assertTrue(splitPieces[0].isSplit());
			if (!minPieces) minPieces = splitPieces[i].getMinPieces();
			else if (minPieces !== splitPieces[i].getMinPieces()) throw new Error("config.splitPieces[" + i + "].getMinPieces() has inconsistent min pieces");
			if (!numKeypairs) numKeypairs = splitPieces[i].getKeypairs().length;
			else if (numKeypairs !== splitPieces[i].getKeypairs().length) throw new Error("config.splitPieces[" + i + "].getKeypairs() has inconsistent number of keypairs");
		}
		assertTrue(numKeypairs > 0);
		
		// check if min pieces met
		if (splitPieces.length < minPieces) {
			var additional = minPieces - splitPieces.length;
			throw new Error("Need " + additional + " additional " + (additional === 1 ? "piece" : "pieces") + " to recover private keys");
		}
		
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
 * Returns the single common crypto plugin among the given pieces.
 * 
 * @param pieces is a piece or pieces to get a common plugin from
 * @returns CryptoPlugin if a single common plugin exists, null if multiple plugins are used
 */
CryptoPiece.getCommonPlugin = function(pieces) {
	pieces = listify(pieces);
	assertTrue(pieces.length > 0);
	var plugin;
	for (var i = 0; i < pieces.length; i++) {
		assertObject(pieces[i], CryptoPiece);
		for (var j = 0; j < pieces[i].getKeypairs().length; j++) {
			if (!plugin) plugin = pieces[i].getKeypairs()[j].getPlugin();
			else if (plugin.getTicker() !== pieces[i].getKeypairs()[j].getPlugin().getTicker()) return null;
		}
	}
	return plugin;
}

/**
 * Parses a string to a piece.
 * 
 * @param str is the string to parse to a piece
 * @param plugin is the plugin associated with the keys to parse
 * @returns a CryptoPiece parsed from the string, null if cannot parse
 */
CryptoPiece.parse = function(str, plugin) {
	
	// validate non-empty string
	assertTrue(isString(str));
	assertFalse(str.trim() === "");
	
	// try to parse json
	try { return new CryptoPiece({json: str}); }
	catch (err) { }
	
	// try to parse csv
	try { return new CryptoPiece({csv: str}); }
	catch (err) {}
	
	// try to parse txt
	try { return new CryptoPiece({txt: str}); }
	catch (err) {}
	
	// otherwise must have plugin
	if (!plugin) throw new Error("Plugin required to parse pieces");
	
	// get lines
	var lines = getLines(str);
	for (var i = 0; i < lines.length; i++) lines[i] = lines[i].trim();
	lines.removeVal("");
	
	// build keypairs treating lines as private keys
	var keypairs = [];
	for (var i = 0; i < lines.length; i++) {
		try {
			keypairs.push(new CryptoKeypair({plugin: plugin, privateKey: lines[i]}));
		} catch (err) {
			return null;	// bail if invalid key given
		}
	}
	
	// return piece
	try {
		return new CryptoPiece({keypairs: keypairs});
	} catch (err) {
		return null;
	}
}