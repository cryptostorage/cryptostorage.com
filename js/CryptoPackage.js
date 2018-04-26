/**
 * Encapsulates a collection of pieces.
 * 
 * @param config specifies the collection configuration
 * 				config.pieces are pre-existing pieces
 * @param onProgress(percent, label) is invoked as the the collection is made
 * @param onDone(err, this) is called when done
 */
function CryptoPackage(config) {
	
	var state;
	
	this.getPieces = function() {
		return state.pieces;
	}
	
	this.split = function(numShares, minShare) {
		assertTrue(state.pieces.length === 1);
		assertFalse(state.pieces[0].isSplit());
		state.pieces = state.pieces[0].split()
	}
	
	this.combine = function() {
		
	}

	// ------------------------------- PRIVATE ----------------------------------
	
	init();
	function init() {
		state = Object.assign({}, config);
	}
}