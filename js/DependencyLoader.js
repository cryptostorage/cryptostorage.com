// global loader instance
const LOADER = new DependencyLoader();

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
	 * @param callback is invoked when the paths are loaded
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
			error: function() {
				throw Error("Failed to load dependencies: " + paths);
			}
		});
	}
}