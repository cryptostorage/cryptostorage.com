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
	
	this.encrypt = function(passphrase, schemes, onProgress, onDone) {
		throw new Error("Not implemented");
	}
	
	this.getEncryptWeight = function(schemes) {
		throw new Error("Not implemented");
	}
	
	this.isEncrypted = function() {
		throw new Error("Not implemented");
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
		var split;
		for (var i = 0; i < keypairs.length; i++) {
			if (!split) split = keypairs[i].isSplit();
			else if (split !== keypairs[i].isSplit()) throw new Error("keypair[" + i + "] has an inconsistent split state");
		}
		return split;
	}
	
	this.getPieceNum = function() {
		assertTrue(keypairs.length > 0);
		var pieceNum;
		for (var i = 0; i < keypairs.length; i++) {
			if (!pieceNum) pieceNum = keypairs[i].getShareNum();
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
		if (keypairs) {
			assertTrue(keypairs.length > 0);
			for (var i = 0; i < keypairs.length; i++) {
				assertObject(keypairs[i], CryptoKeypair);
			}
		}
		else if (json) fromJson(json);
		else if (splitPieces) combine(splitPieces);
		else if (piece) fromPiece(piece);
		else throw new Error("All arguments null");
	}
	
	function fromJson() {
		throw new Error("Not implemented");
	}
	
	function combine() {
		throw new Error("Not implemented");
	}
	
	function fromPiece() {
		throw new Error("Not implemented");
	}
}