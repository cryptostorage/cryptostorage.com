/**
 * Encapsulates a 'piece' which is a collection of keypairs.
 * 
 * @param keypairs are keypairs to initialize with
 * @param json is exportable json to initialize from
 * @param splitPieces are split pieces to combine and initialize from
 */
function CryptoPiece(keypairs, json, splitPieces) {
	
	var keypairs;
	var pieceNum;
	
	this.setKeypairs = function(_keypairs) {
		keypairs = _keypairs;
	}
	
	this.getKeypairs = function() {
		return keypairs;
	}
	
	this.encrypt = function(passphrase, schemes, onProgress, onDone) {
		
	}
	
	this.getEncryptWeight = function(schemes) {
		
	}
	
	this.isEncrypted = function() {
		
	}
	
	this.decrypt = function(passphrase, onProgress, onDone) {
		
	}
	
	this.getDecryptWeight = function() {
		
	}
	
	this.split = function(numShares, minShares) {
		
	}
	
	this.isSplit = function() {
		
	}
	
	this.getPieceNum = function() {
		return pieceNum;
	}
	
	this.combine = function(shares) {
		
	}
	
	this.toJson = function() {
		
	}
	
	this.fromJson = function(json) {
		
	}
	
	// -------------------------------- PRIVATE ---------------------------------
	
}