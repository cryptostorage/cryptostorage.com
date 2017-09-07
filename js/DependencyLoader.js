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
		paths = isArray(paths) ? paths : [paths];
		
		// only load paths that aren't previously defined
		for (let path of paths) {
			if (!loadjs.isDefined(path)) {
				loadjs(path, path);
			}
		}
		
		// invokes callback when ready
		loadjs.ready(paths, {
			success: callback,
			error: callback
		});
	}
}