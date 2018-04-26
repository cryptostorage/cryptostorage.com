/**
 * Generates a CryptoPackage and/or rendered PieceRenderers.
 *  
 * @param config specifies package generation configuration
 * 				config.passphrase causes encryption with this field as the passphrase
 *  			config.useBip38 specifies whether or not to use BIP38 when available, otherwise uses first registered encryption scheme
 * 				config.numPieces causes splitting with this field as the number of split pieces
 * 				config.minPieces specifies the minimum number of split pieces necessary to reconstitute private keys
 * 				config.keypairs[{ticker: "BCH", numKeypairs: 7}, ...] specifies the keypair generation configuration
 * 				config.piecePkg is an existing package to start with instead of generating new keypairs
 * 				config.pieceRendererClass specifies a class to render pieces, skips rendering if not given
 */
function PackageGenerator(config) {
	config = Object.assign({}, config);
	PackageGenerator.validateGenerateConfig(config);

	/**
	 * Generates a package and/or piece renderers according to the config.
	 * 
	 * @param onProgress(percent, label) is invoked as progress is made
	 * @param onDone(err, piecePkg, pieceRenderers) is invoked when done
	 */
	this.generatePackage = function(onProgress, onDone) {
		
		// get weights
		var weights = computeWeights(config);
		var createWeight = weights.createWeight;
		var encryptWeight = weights.encryptWeight
		var splitWeight = weights.splitWeight();
		var renderWeight = weights.renderWeight;
		var totalWeight = weights.totalWeight;
		
		// create unencrypted package
		var doneWeight = 0;
		create(function(percent, label) {
			if (onProgress) onProgress((doneWeight + percent * createWeight) / totalWeight, label);
		}, function(err, pkg) {
			assertNull(err);
			doneWeight += createWeight;
			
			// encrypt
			encrypt(pkg, function(percent, label) {
				if (onProgress) onProgress((doneWeight + percent * encryptWeight) / totalWeight, label);
			}, function(err, pkg) {
				assertNull(err);
				doneWeight += encryptWeight;
				
				// split
				split(pkg, function(percent, label) {
					if (onProgress) onProgress((doneWeight + percent * splitWeight) / totalWeight, label);
				}, function(err, pkg) {
					assertNull(err);
					doneWeight += splitWeight;
					
					// render
					render(pkg, function(percent, label) {
						if (onProgress) onProgress((doneWeight + percent * renderWeight) / totalWeight, label);
					}, function(err, pieceRenderers) {
						assertNull(err);
						doneWeight += renderWeight;
						assertEquals(doneWeight, totalWeight);
						if (onDone) onDone(null, pkg, pieceRenderers);
					});
				});
			});
		});
	}
	
	this.cancel = function() {
		throw new Error("Not implemented");
	}
	
	// --------------------------------- PRIVATE --------------------------------
	
	function computeWeights() {
		var weights = {};
		weights.createWeight = 0;
		weights.encryptWeight = 0;
		var numKeypairs = 0;
		for (var i = 0; i < config.keypairs.length; i++) {
			var keypair = config.keypairs[i];
			numKeypairs += keypair.numKeypairs;
			createWeight += CryptoKeypair.getCreateWeight(keypair.ticker) * numKeypairs;
			throw new Error("update to new config schema");
			if (keypair.encryption) encryptWeight += CryptoKeypair.getEncryptWeight(keypair.encryption) * numKeypairs;	// TODO: update to new config schema
		}
		weights.renderWeight = config.pieceRendererClass ? config.pieceRendererClass.getRenderWeight(config) : 0;
		weights.totalWeight = weights.createWeight + weights.encryptWeight + weights.renderWeight;
		return weights;
	}
	
	function create(onProgress, onDone) {
		throw new Error("Not implemented");
	}

	function encrypt(pkg, onProgress, onDone) {
		throw new Error("Not implemented");
	}
	
	function split(pkg, onProgress, onDone) {
		throw new Error("Not implemented");
	}
	
	function render(pkg, onProgress, onDone) {
		throw new Error("Not implemented");
	}
}

/**
 * Validates a package generation config.
 */
PackageGenerator.validateGenerateConfig = function(genConfig) {
	
	if (genConfig.keypairs) {
		assertUndefined(genConfig.piecePkg);
	}
	
	if (genConfig.piecePkg) {
		assertUndefined(genConfig.keypairs);
	}
	
	throw new Error("PackageGenerator.validateGenerateConfig not implemented");
}