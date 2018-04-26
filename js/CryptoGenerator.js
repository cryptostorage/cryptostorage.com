
/**
 * Generates pieces and/or rendered pieces.
 *  
 * @param config specifies generation configuration
 * 				config.genConfig specifies a generation configuration
 * 				config.piecePkg is a pre-existing piece package
 * 				config.pieceRendererClass specifies a to render pieces (optiona)
 */
function CryptoGenerator(config) {
	
	/**
	 * Generates a package and rendered pieces according to the configuration.
	 * 
	 * @param onProgress(percent, label) is invoked as progress is made
	 * @param onDone(err, piecePkg, pieceRenderers) is invoked when done
	 */
	this.generate = function(onProgress, onDone) {
			
		// get weights
		var createWeight = getCreateWeight();
		var encryptWeight = getEncryptWeight();
		var splitWeight = getSplitWeight();
		var renderWeight = getRenderWeight();
		var totalWeight = createWeight + encryptWeight + splitWeight + renderWeight;
		
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
	
	init();
	function init() {
		config = Object.assign({}, config);
		CryptoGenerator.validateGenerateConfig(config);
	}
	
	function getCreateWeight() {
		throw new Error("Not implemented");
	}
	
	function create(onProgress, onDone) {
		throw new Error("Not implemented");
	}
	
	function getEncryptWeight() {
		throw new Error("Not implemented");
	}
	
	function encrypt(pkg, onProgress, onDone) {
		throw new Error("Not implemented");
	}
	
	function getSplitWeight() {
		throw new Error("Not implemented");
	}
	
	function split(pkg, onProgress, onDone) {
		throw new Error("Not implemented");
	}
	
	function getRenderWeight() {
		throw new Error("Not implemented");
	}
	
	function render(pkg, onProgress, onDone) {
		throw new Error("Not implemented");
	}
}

/**
 * Validates piece generation configuration.
 * 
 * @param config is the config to validate
 */
CryptoGenerator.validateGenerateConfig = function(genConfig) {
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
	} else {
		assertUndefined(config.passphrase);
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