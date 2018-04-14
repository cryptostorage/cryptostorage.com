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
function CryptoPiece(keypairs, pieceNum, json, splitPieces, piece) {
	
	var keypairs;
	var pieceNum;
	
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
		throw new Error("Not implemented");
	}
	
	this.isSplit = function() {
		throw new Error("Not implemented");
	}
	
	this.getPieceNum = function() {
		return pieceNum;
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
	
	this.copy = function(_piece) {
		var copy = new CryptoPiece(_piece.getKeypairs());
		
	}
	
	this.equals = function(piece) {
		throw new Error("Not implemented");
	}
	
	// -------------------------------- PRIVATE ---------------------------------
	
	init();
	function init() {
		
	}
}