/**
 * Enumerates dependencies for each currency.
 */
const Dependencies = {
	ANY: ["lib/jquery-csv.js", "lib/aes.js", "lib/secrets.js", "lib/qrcode.js", "lib/jszip.js", "lib/FileSaver.js"],
	BTC: ["lib/bitaddress.js"],
	ETH: ["lib/bitaddress.js"],
	LTC: ["lib/bitaddress.js"],
	XMR: ["lib/bitaddress.js"]
}


//<script src="lib/jquery-csv.js"></script>
//<script src="lib/bitaddress.js"></script>
//<script src="lib/moneroaddress.js"></script>
//<script src="lib/litecore.js"></script>
//<script src="lib/keythereum.js"></script>
//<script src="lib/aes.js"></script>
//<script src="lib/secrets.js"></script>
//<script src="lib/qrcode.js"></script>
//<script src="lib/jszip.js"></script>
//<script src="lib/FileSaver.js"></script>

/**
 * Loads dependencies and tracks the state of what's loaded.
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
		
		for (let path of paths) {
			if (!loadjs.isDefined(path)) {
				loadjs(path, path);
			}
		}
		
		loadjs.ready(paths, {
			success: callback,
			error: callback
		});
	}
}