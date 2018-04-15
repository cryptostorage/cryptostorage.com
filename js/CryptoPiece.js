/**
 * Encapsulates a 'piece' which is a collection of keypairs.
 * 
 * Initializes from the first non-null argument.
 * 
 * @param keypairs are keypairs to initialize with
 * @param pieceNum is the pieceNumber to assign to each piece (optional)
 * @param json is exportable json to initialize from
 * @param splitPieces are split pieces to combine and initialize from
 * @param piece is an existing piece to copy from
 */
function CryptoPiece(keypairs, json, splitPieces, piece) {
	
	var that = this;
		
	this.getKeypairs = function() {
		return keypairs;
	}
	
	this.encrypt = function(passphrase, schemes, onProgress, onDone, verifyEncryption) {
		
		// verify input
		try {
			assertInitialized(passphrase);
			assertEquals(keypairs.length, schemes.length);
			assertInitialized(onDone);
		} catch (err) {
			onDone(err);
			return;
		}
		
		// collect originals if verifying encryption
		var originals;
		if (verifyEncryption) {
			originals = [];
			for (var i = 0; i < keypairs.length; i++) {
				originals.push(keypairs[i].copy());
			}
		}
		
		// track weights for progress
		var doneWeight = 0;
		var verifyWeight = verifyEncryption ? CryptoKeypair.getDecryptWeight(schemes) : 0;
		var totalWeight = CryptoKeypair.getEncryptWeight(schemes) + verifyWeight;
		
		// collect encryption functions
		var funcs = [];
		for (var i = 0; i < keypairs.length; i++) {
			funcs.push(encryptFunc(keypairs[i], schemes[i], passphrase));
		}
		
		// encrypt async
		if (onProgress) onProgress(0, "Encrypting");
		async.parallelLimit(funcs, AppUtils.ENCRYPTION_THREADS, function(err, encryptedKeypairs) {
			
			// check for error
			if (err) {
				onDone(err);
				return;
			}
			
			// verify encryption
			if (verifyEncryption) {
				
				// copy encrypted keypairs
				var encryptedCopies = [];
				for (var i = 0; i < encryptedKeypairs.length; i++) {
					encryptedCopies.push(encryptedKeypairs[i].copy());
				}
				
				// decrypt keypairs
				if (onProgress) onProgress(doneWeight / totalWeight, "Verifying encryption");
				AppUtils.decryptKeys(encryptedCopies, passphrase, null, function(percent) {
					if (onProgress) onProgress((doneWeight + percent * verifyWeight) / totalWeight, "Verifying encryption");
				}, function(err, decryptedKeys) {
					try {
						
						// check for error
						if (err) throw err;
						
						// assert originals match decrypted keypairs
						doneWeight += verifyWeight;
						assertEquals(originals.length, decryptedKeys.length);
						for (var j = 0; j < originals.length; j++) {
							assertTrue(originals[j].equals(decryptedKeys[j]));
						}
						
						// done
						onDone(null, that);
					} catch (err) {
						onDone(err);
					}
				})
			}
			
			// don't verify encryption
			else {
				onDone(err, that);
			}
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
		for (var i = 0; i < keypairs.length; i++) {
			if (bool === -1) bool = keypairs[i].isEncrypted();
			else if (bool !== keypairs[i].isEncrypted()) throw new Error("keypairs[" + i + "] encryption is inconsistent");
		}
		return bool;
	}
	
	this.decrypt = function(passphrase, onProgress, onDone) {
		throw new Error("Not implemented");
	}
	
	this.getDecryptWeight = function() {
		throw new Error("Not implemented");
	}
	
	this.split = function(numShares, minShares) {
		
		// collect all split keypairs
		var allSplitKeypairs = [];
		for (var i = 0; i < numShares; i++) allSplitKeypairs.push([]);
		for (var i = 0; i < keypairs.length; i++) {
			var splitKeypairs = keypairs[i].split(numShares, minShares);
			for (var j = 0; j < splitKeypairs.length; j++) {
				allSplitKeypairs[j].push(splitKeypairs[j]);
			}
		}
		
		// build split pieces
		var splitPieces = [];
		for (var i = 0; i < allSplitKeypairs.length; i++) {
			splitPieces.push(new CryptoPiece(allSplitKeypairs[i]));
		}
		return splitPieces;
	}
	
	this.isSplit = function() {
		assertTrue(keypairs.length > 0);
		var split = -1;
		for (var i = 0; i < keypairs.length; i++) {
			if (split === -1) split = keypairs[i].isSplit();
			else if (split !== keypairs[i].isSplit()) throw new Error("keypair[" + i + "] has an inconsistent split state");
		}
		return split;
	}
	
	this.getPieceNum = function() {
		assertTrue(keypairs.length > 0);
		var pieceNum = -1;
		for (var i = 0; i < keypairs.length; i++) {
			if (pieceNum === -1) pieceNum = keypairs[i].getShareNum();
			else if (pieceNum !== keypairs[i].getShareNum()) throw new Error("keypair[" + i + "] has an inconsistent share num");
		}
		return pieceNum;
	}
	
	this.combine = function(shares) {
		throw new Error("Not implemented");
	}
	
	this.getJson = function() {
		var json = {};
		json.pieceNum = that.getPieceNum();
		json.version = AppUtils.VERSION;
		json.keypairs = [];
		for (var i = 0; i < keypairs.length; i++) {
			json.keypairs.push(keypairs[i].getJson());
		}
		return json;
	}
	
	this.copy = function() {
		var keypairCopies = [];
		for (var i = 0; i < keypairs.length; i++) keypairCopies.push(keypairs[i].copy());
		return new CryptoPiece(keypairCopies);
	}
	
	this.equals = function(piece) {
		assertObject(piece, CryptoPiece);
		return objectsEqual(that.getJson(), piece.getJson());
	}
	
	// -------------------------------- PRIVATE ---------------------------------
	
	init();
	function init() {
		if (keypairs) setKeypairs(keypairs);
		else if (json) fromJson(json);
		else if (splitPieces) combine(splitPieces);
		else if (piece) fromPiece(piece);
		else throw new Error("All arguments null");
	}
	
	function setKeypairs(_keypairs) {
		assertTrue(_keypairs.length > 0);
		for (var i = 0; i < _keypairs.length; i++) {
			assertObject(_keypairs[i], CryptoKeypair);
		}
		keypairs = _keypairs;
	}
	
	function fromJson() {
		throw new Error("Not implemented");
	}
	
	function combine(splitPieces) {
		
		// verify consistent num keypairs
		var numKeypairs;
		for (var i = 0; i < splitPieces.length; i++) {
			if (!numKeypairs) numKeypairs = splitPieces[i].getKeypairs().length;
			else if (numKeypairs !== splitPieces[i].getKeypairs().length) throw new Error("splitPieces[" + i + "].getKeypairs() has inconsistent number of keypairs");
		}
		assertTrue(numKeypairs > 0);
		
		// combine keypairs
		var combinedKeypairs = [];
		for (var i = 0; i < numKeypairs; i++) {
			var splitKeypairs = [];
			for (var j = 0; j < splitPieces.length; j++) splitKeypairs.push(splitPieces[j].getKeypairs()[i]);
			combinedKeypairs.push(new CryptoKeypair(null, null, splitKeypairs));
		}
		
		// set keypairs to combined keypairs
		setKeypairs(combinedKeypairs);
	}
	
	function fromPiece() {
		throw new Error("Not implemented");
	}
}