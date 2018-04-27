/**
 * Generates pieces and/or rendered pieces according to a config.
 *  
 * @param config specifies piece generation configuration
 * 				config.passphrase causes encryption with this field as the passphrase
 *  			config.useBip38 specifies whether or not to use BIP38 when available, otherwise uses first registered encryption scheme
 * 				config.numPieces causes splitting with this field as the number of split pieces
 * 				config.minPieces specifies the minimum number of split pieces necessary to reconstitute private keys
 * 				config.keypairs[{ticker: "BCH", numKeypairs: 7}, ...] specifies the keypair generation configuration
 * 				config.pieces are existing pieces to start with instead of generating new keypairs
 * 				config.pieceRendererClass specifies a class to render pieces, skips rendering if not given
 */
function PieceGenerator(config) {
	
	// init
	PieceGenerator.validateGenerateConfig(config);
	config = Object.assign({}, config);
	var isCancelled = false;

	/**
	 * Starts generating pieces and/or piece renderers according to the config.
	 * 
	 * @param onProgress(percent, label) is invoked as progress is made
	 * @param onDone(err, pieces, pieceRenderers) is invoked when done
	 */
	this.generatePieces = function(onProgress, onDone) {
		assertFalse(isCancelled);
		
		// get weights
		var weights = computeWeights(config);
		var createWeight = weights.createWeight;
		var encryptWeight = weights.encryptWeight
		var splitWeight = weights.splitWeight();
		var renderWeight = weights.renderWeight;
		var totalWeight = weights.totalWeight;
		
		// generate keypairs
		var doneWeight = 0;
		createIfApplicable(function(percent, label) {
			if (onProgress) onProgress((doneWeight + percent * createWeight) / totalWeight, label);
		}, function(err, pieces) {
			if (isCancelled) return;
			assertNull(err);
			doneWeight += createWeight;
			
			// encrypt
			encryptIfApplicable(unencryptedPiece, function(percent, label) {
				if (onProgress) onProgress((doneWeight + percent * encryptWeight) / totalWeight, label);
			}, function(err, pieces) {
				if (isCancelled) return;
				assertNull(err);
				doneWeight += encryptWeight;
				
				// split
				splitIfApplicable(piece, function(percent, label) {
					if (onProgress) onProgress((doneWeight + percent * splitWeight) / totalWeight, label);
				}, function(err, pieces) {
					if (isCancelled) return;
					assertNull(err);
					doneWeight += splitWeight;
					
					// render
					renderIfApplicable(pieces, function(percent, label) {
						if (onProgress) onProgress((doneWeight + percent * renderWeight) / totalWeight, label);
					}, function(err, pieces, pieceRenderers) {
						if (isCancelled) return;
						assertNull(err);
						doneWeight += renderWeight;
						assertEquals(doneWeight, totalWeight);
						if (onDone) onDone(null, pieces, pieceRenderers);
					});
				});
			});
		});
	}
	
	/**
	 * Cancels piece generation.
	 */
	this.cancel = function() {
		isCancelled = true;
	}
	
	// --------------------------------- PRIVATE --------------------------------
	
	function computeWeights() {
		throw new Error("computeWeights() not implemented");
		var weights = {};
		weights.createWeight = 0;
		weights.encryptWeight = 0;
		weights.splitWeight = 0;
		weights.renderWeight = 0;
		for (var i = 0; i < config.keypairs.length; i++) {
			var keypair = config.keypairs[i];
			weights.createWeight += CryptoKeypair.getCreateWeight(keypair.ticker) * keypair.numKeypairs;
			throw new Error("update to new config schema");
			if (keypair.encryption) encryptWeight += CryptoKeypair.getEncryptWeight(keypair.encryption) * numKeypairs;	// TODO: update to new config schema
		}
		weights.renderWeight = config.pieceRendererClass ? config.pieceRendererClass.getRenderWeight(config) : 0;
		weights.totalWeight = weights.createWeight + weights.encryptWeight + weights.renderWeight;
		return weights;
	}
	
	function createIfApplicable(onProgress, onDone) {
		throw new Error("Not implemented");
	}

	function encryptIfApplicable(pieces, onProgress, onDone) {
		throw new Error("Not implemented");
	}
	
	function splitIfApplicable(pieces, onProgress, onDone) {
		throw new Error("Not implemented");
	}
	
	function renderIfApplicable(pieces, onProgress, onDone) {
		throw new Error("Not implemented");
	}
}

/**
 * Validates a piece generation config.
 */
PieceGenerator.validateGenerateConfig = function(genConfig) {
	
	throw new Error("PieceGenerator.validateGenerateConfig not implemented");
	
	if (genConfig.keypairs) {
		assertUndefined(genConfig.pieces);
	}
	
	if (genConfig.pieces) {
		assertUndefined(genConfig.keypairs);
	}
}