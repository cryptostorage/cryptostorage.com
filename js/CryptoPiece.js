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
		for (var i = 0; i < keypairs.length; i++) {
			var splitKeypairs = keypairs[i].split(numShares, minShares);
			for (var j = 0; j < splitKeypairs.length; j++) {
				allSplitKeypairs[j].push(splitKeypairs[j]);
			}
		}
		
		// build split pieces
		var splitPieces = [];
		for (var i = 0; i < allSplitPieces.length; i++) {
			splitPieces.push(new CryptoPiece(allSplitPieces[i]));
		}
		return splitPieces;
	}
	
	this.isSplit = function() {
		throw new Error("Not implemented");
	}
	
	this.getPieceNum = function() {
		throw new Error("Not implemented");
	}
	
	this.combine = function(shares) {
		throw new Error("Not implemented");
	}
	
	this.toJson = function() {
		throw new Error("Not implemented");
	}
	
	this.fromJson = function(json) {
		throw new Error("Not implemented");
	}
	
	this.copy = function() {
		var keypairCopies = [];
		for (var i = 0; i < keypairs.length; i++) keypairCopies.push(keypairs[i].copy());
		return new CryptoPiece(keypairCopies);
	}
	
	this.equals = function(piece) {
		throw new Error("Not implemented");
	}
	
	// -------------------------------- PRIVATE ---------------------------------
	
	init();
	function init() {
		if (keypairs) return;
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