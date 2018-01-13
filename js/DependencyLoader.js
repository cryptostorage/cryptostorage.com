// global loader instance
var LOADER = new DependencyLoader();

/**
 * Loads dependencies.
 * 
 * Requires loadjs.js.
 */
function DependencyLoader() {
	
	var loadedImages = [];
	
	/**
	 * Loads the given paths.
	 * 
	 * @param paths is one or more paths to load as a string or string[]
	 * @param onDone(err) is invoked when the paths are loaded or fail
	 */
	this.load = function(paths, onDone) {
		
		// listify paths
		if (!isArray(paths)) {
			assertTrue(isString(paths));
			paths = [paths];
		}
		
		// collect images and scripts that aren't loaded
		var imagesToLoad = [];
		var scriptsToLoad = [];
		for (var i = 0; i < paths.length; i++) {
			var path = paths[i];
			assertDefined(path);
			if (path.endsWith(".png") || path.endsWith(".jpg") || path.endsWith(".gif")) {
				if (!arrayContains(loadedImages, path)) imagesToLoad.push(path);
			} else {
				if (!loadjs.isDefined(path)) {
					scriptsToLoad.push(path);
					loadjs(path, path);
				}
			}
		}
		
		// done if everything loaded
		if (!imagesToLoad.length && !scriptsToLoad.length) {
			if (onDone) onDone();
			return;
		}
		
		// simulate load time
		if (AppUtils.SIMULATED_LOAD_TIME) {
			setTimeout(function() { loadAsync(); }, AppUtils.SIMULATED_LOAD_TIME);
		} else loadAsync();
		
		// executes functions to fetch scripts and images
		function loadAsync() {
			var funcs = [getScriptsFunc(scriptsToLoad), getImagesFunc(imagesToLoad)];
			async.parallel(funcs, function(err, result) {
				if (onDone) onDone(err);
			});
		}
		
		function getScriptsFunc(paths) {
			return function(onDone) {
				if (!paths.length) onDone();
				else {
					loadjs.ready(paths, {
						success: onDone,
						error: function() { onDone(new Error("Failed to load dependencies: " + paths)); }
					});
				}
			}
		}
		
		function getImagesFunc(paths) {
			return function(onDone) {
				getImages(paths, function(err) {
					if (err) onDone(err);
					else {
						loadedImages = loadedImages.concat(paths);
						onDone();
					}
				});
			}
		}
	}
	
	/**
	 * Determines if the given paths are loaded.
	 * 
	 * @param paths is one or more paths to check if loaded
	 */
	this.isLoaded = function(paths) {
		
		// listify paths
		if (!isArray(paths)) {
			assertTrue(isString(paths));
			paths = [paths];
		}
		
		// check if each path is loaded
		for (var i = 0; i < paths.length; i++) {
			if (!arrayContains(loadedImages, paths[i]) && !loadjs.isDefined(paths[i])) return false;
		}
		
		// all paths loaded
		return true;
	}
}