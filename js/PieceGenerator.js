/**
 * Generates pieces and/or rendered pieces according to a config.
 *  
 * @param config specifies piece generation configuration
 * 				config.passphrase causes encryption with this field as the passphrase
 * 				config.numPieces causes splitting with this field as the number of split pieces
 * 				config.minPieces specifies the minimum number of split pieces necessary to reconstitute private keys
 * 				config.keypairs[{ticker: "BCH", numKeypairs: 7, encryptionScheme: "BIP38"}, ...] specifies the keypair generation configuration
 * 				config.pieces are existing pieces to start with instead of generating new keypairs
 *				config.encryptionSchemes are encryption schemes to encrypt existing pieces if passphrase is set
 * 				config.pieceRendererClass specifies a class to render pieces, skips rendering if not given
 */
function PieceGenerator(config) {
		
	// init
	PieceGenerator.validateConfig(config);
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
		var splitWeight = weights.splitWeight;
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
			encryptIfApplicable(pieces, function(percent, label) {
				if (onProgress) onProgress((doneWeight + percent * encryptWeight) / totalWeight, label);
			}, function(err, pieces) {
				if (isCancelled) return;
				assertNull(err);
				doneWeight += encryptWeight;
				
				// split
				splitIfApplicable(pieces, function(percent, label) {
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
		var weights = {};
		weights.createWeight = 0;
		weights.encryptWeight = 0;
		weights.splitWeight = 0;
		weights.renderWeight = config.pieceRendererClass ? config.pieceRendererClass.getRenderWeight(config) : 0;
		
		// compute weights with key generation
		if (config.keypairs) {
			for (var i = 0; i < config.keypairs.length; i++) {
				var keypair = config.keypairs[i];
				weights.createWeight += CryptoKeypair.getCreateWeight(keypair.ticker) * keypair.numKeypairs;
				if (keypair.encryptionScheme) weights.encryptWeight += CryptoKeypair.getEncryptWeight(keypair.encryptionScheme) * keypair.numKeypairs;
			}
		}
		
		// compute weights with existing pieces
		else if (config.pieces && config.passphrase) {
			for (var i = 0; i < config.pieces[0].getKeypairs().length; i++) {
				weights.encryptWeight += CryptoKeypair.getEncryptWeight(config.encryptionSchemes[i]);
			}
		}
		
		// compute total and return
		weights.totalWeight = weights.createWeight + weights.encryptWeight + weights.splitWeight + weights.renderWeight;
		return weights;
	}
	
	function createIfApplicable(onProgress, onDone) {
		
		// no keypair generation
		if (config.pieces) {
			onDone(null, config.pieces);
			return;
		}
		
		// collect functions to generate keypairs
		var newKeypairFuncs = [];
		for (var i = 0; i < config.keypairs.length; i++) {
			var plugin = AppUtils.getCryptoPlugin(config.keypairs[i].ticker);
			for (var j = 0; j < config.keypairs[i].numKeypairs; j++) {
				newKeypairFuncs.push(newKeypairFunc(plugin));
			}
		}
		
		// callback function to generate a keypair
		var numCreated = 0;
		function newKeypairFunc(plugin) {
			return function(onDone) {
				var keypair = new CryptoKeypair({plugin: plugin});
				numCreated++;
				if (onProgress) onProgress(numCreated / newKeypairFuncs.length, "Generating keypairs");
				setImmediate(function() { onDone(null, keypair) });	// let UI breath
			}
		}
		
		// generate keypairs
		if (onProgress) onProgress(0, "Generating keypairs");
		setImmediate(function() {	// let browser breath
			async.series(newKeypairFuncs, function(err, keypairs) {
				assertNull(err);
				onDone(null, [new CryptoPiece({keypairs: keypairs})]);
			});
		})
	}

	function encryptIfApplicable(pieces, onProgress, onDone) {
		
		// no encryption
		if (!config.passphrase) {
			onDone(null, pieces);
			return;
		}
		
		// get encryption schemes
		assertEquals(1, pieces.length);
		assertFalse(pieces[0].isEncrypted());
		var encryptionSchemes = [];
		if (config.encryptionSchemes) {
			encryptionSchemes = config.encryptionSchemes;
		} else {
			for (var i = 0; i < config.keypairs.length; i++) {
				var plugin = AppUtils.getCryptoPlugin(config.keypairs[i].ticker);
				for (var j = 0; j < config.keypairs[i].numKeypairs; j++) {
					encryptionSchemes.push(config.keypairs[i].encryptionScheme);
				}
			}
		}
		
		// encrypt piece
		pieces[0].encrypt(config.passphrase, encryptionSchemes, onProgress, function(err, encryptedPiece) {
			assertNull(err);
			onDone(err, [encryptedPiece]);
		});
	}
	
	function splitIfApplicable(pieces, onProgress, onDone) {
		
		// no splitting
		if (!isDefined(config.numPieces)) {
			onDone(null, pieces);
			return;
		}
		
		// split
		assertEquals(1, pieces.length);
		assertFalse(pieces[0].isSplit());
		onDone(null, pieces[0].split(config.numPieces, config.minPieces));
	}
	
	function renderIfApplicable(pieces, onProgress, onDone) {
		
		// no rendering
		if (!config.pieceRendererClass) {
			onDone(null, pieces);
			return;
		}
			
		// collect renderers
		var numRendered = 0;
		var renderers = [];
		for (var i = 0; i < pieces.length; i++) {
			var renderer = new config.pieceRendererClass(null, pieces[i]);
			renderer.onProgress(function(percent, label) {
				if (onProgress) onProgress((numRendered + percent) / pieces.length, label);
			});
			renderers.push(renderer);
		}
		
		// collect render callback functions
		var renderFuncs = [];
		for (var i = 0; i < renderers.length; i++) renderFuncs.push(renderFunction(renderers[i]));
		function renderFunction(renderer) {
			return function(onDone) {
				renderer.render(function(div) {
					numRendered++;
					onDone(null, renderer);
				});
			}
		}
		
		// render async
		async.series(renderFuncs, function(err, renderers) {
			assertNull(err);
			assertEquals(pieces.length, renderers.length);
			onDone(null, pieces, renderers);
		});
	}
}

/**
 * Validates a piece generation config.
 * 
 * @param config is the generation configuration to validate
 */
PieceGenerator.validateConfig = function(config) {
	assertObject(config);
	
	// validate passphrase
	if (config.passphrase) {
		assertString(config.passphrase);
		assertTrue(config.passphrase.length >= AppUtils.MIN_PASSPHRASE_LENGTH)
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
	if (config.pieceRendererClass) {
		assertDefined(config.pieceRendererClass.getRenderWeight);
	}
	
	// validate keypair config
	if (config.keypairs) {
		assertUndefined(config.pieces);
		assertArray(config.keypairs);
		assertTrue(config.keypairs.length > 0);
		for (var i = 0; i < config.keypairs.length; i++) {
			assertInitialized(config.keypairs[i].ticker);
			assertNumber(config.keypairs[i].numKeypairs);
			assertTrue(config.keypairs[i].numKeypairs > 0);
			assertTrue(config.keypairs[i].numKeypairs <= AppUtils.MAX_KEYPAIRS);
			if (config.passphrase) {
				var plugin = AppUtils.getCryptoPlugin(config.keypairs[i].ticker);
				assertTrue(arrayContains(plugin.getEncryptionSchemes(), config.keypairs[i].encryptionScheme));
			}
		}
	}
	
	// validate pieces and schemes
	else if (config.pieces) {
		assertUndefined(config.keypairs);
		assertArray(config.pieces);
		assertTrue(config.pieces.length > 0);
		if (config.passphrase) {
			assertEquals(1, config.pieces.length);
			assertFalse(config.pieces[0].isEncrypted());
			assertFalse(config.pieces[0].isSplit());
			assertEquals(config.pieces[0].getKeypairs().length, config.encryptionSchemes.length);
			for (var i = 0; i < config.pieces[0].getKeypairs().length; i++) {
				assertTrue(arrayContains(config.pieces[0].getKeypairs()[i].getPlugin().getEncryptionSchemes(), config.encryptionSchemes[i]));
			}
		}
		if (isDefined(config.numPieces)) {
			assertEquals(1, config.pieces.length);
			assertFalse(config.pieces[0].isSplit());
		}
	}
	
	// missing keypairs config and pieces
	else throw new Error("Must define config.keypairs or config.pieces")
}