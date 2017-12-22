// global loader instance
var LOADER = new DependencyLoader();

/**
 * Loads dependencies.
 * 
 * Uses loadjs under the covers: https://github.com/muicss/loadjs
 */
function DependencyLoader() {
	
	/**
	 * Loads the given paths.
	 * 
	 * @param paths is one or more paths to load as a string or string[]
	 * @param callback(err) is invoked when the paths are loaded or fail
	 */
	this.load = function(paths, callback) {
		
		// listify paths
		if (!isArray(paths)) {
			assertTrue(isString(paths));
			paths = [paths];
		}
		
		// only load paths that aren't previously defined
		for (var i = 0; i < paths.length; i++) {
			var path = paths[i];
			assertDefined(path);
			if (!loadjs.isDefined(path)) loadjs(path, path);
		}
		
		// invokes callback when all paths loaded
		loadjs.ready(paths, {
			success: callback,
			error: function() { if (callback) callback(new Error("Failed to load dependencies: " + paths)); }
		});
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
			if (!loadjs.isDefined(paths[i])) return false;
		}
		
		// all paths loaded
		return true;
	}
}