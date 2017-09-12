/**
 * Indicates if the given argument is defined.
 * 
 * @param arg is the arg to test
 * @returns true if the given arg is defined, false otherwise
 */
function isDefined(arg) {
	return typeof arg !== 'undefined';
}

/**
 * Indicates if the given argument is undefined.
 * 
 * @param arg is the arg to test
 * @returns true if the given arg is undefined, false otherwise
 */
function isUndefined(arg) {
	return typeof arg === 'undefined';
}

/**
 * Indicates if the given arg is initialized.
 * 
 * @param arg is the arg to test
 * @returns true if the given arg is initialized, false otherwise
 */
function isInitialized(arg) {
	if (arg) return true;
	return false;
}

/**
 * Indicates if the given arg is uninitialized.
 * 
 * @param arg is the arg to test
 * @returns true if the given arg is uninitialized, false otherwise
 */
function isUninitialized(arg) {
	if (!arg) return true;
	return false;
}

/**
 * Indicates if the given argument is a number.
 * 
 * @param arg is the argument to test
 * @returns true if the argument is a number, false otherwise
 */
function isNumber(arg) {
	return !isNaN(parseFloat(arg)) && isFinite(arg);
}

/**
 * Indicates if the given argument is an integer.
 * 
 * @param arg is the argument to test
 * @returns true if the given argument is an integer, false otherwise
 */
function isInt(arg) {
	return arg === parseInt(Number(arg)) && !isNaN(arg) && !isNaN(parseInt(arg, 10));
}

/**
 * Indicates if the given argument is an array.
 * 
 * @param arg is the argument to test as being an array
 * @returns true if the argument is an array, false otherwise
 */
function isArray(arg) {
	return Array.isArray(arg);
}

/**
 * Indicates if the given argument is a string.
 * 
 * @param arg is the argument to test as being a string
 * @returns true if the argument is a string, false otherwise
 */
function isString(arg) {
	return typeof arg === 'string';
}

/**
 * Indicates if the given argument is an object and optionally if it has the given constructor name.
 * 
 * @param arg is the argument to test
 * @param constructorName is the argument's constructor name (optional)
 * @returns true if the given argument is an object and optionally has the given constructor name
 */
function isObject(arg, constructorName) {
	if (!arg) return false;
	if (typeof arg !== 'object') return false;
	if (constructorName && arg.constructor.name !== constructorName) return false;
	return true;
}

/**
 * Indicates if the given argument is a hexidemal string.
 * 
 * Credit: https://github.com/roryrjb/is-hex/blob/master/is-hex.js.
 * 
 * @param str is the string to test
 * @returns true if the given string is hexidecimal, false otherwise
 */
const HEX_REG_EXP = /([0-9]|[a-f])/gim
function isHex(arg) {
	if (typeof arg !== 'string') return false;
	return (arg.match(HEX_REG_EXP) || []).length === arg.length;
}

/**
 * Throws an exception with the given message.
 * 
 * @param msg defines the message to throw the exception with (optional)
 */
function fail(msg) {
	throw new Error(msg ? msg : "Failure (no message)");
}

/**
 * Asserts that the given boolean is true.  Throws an exception if not a boolean or false.
 * 
 * @param bool is the boolean to assert true
 * @param msg is the message to throw if bool is false (optional)
 */
function assertTrue(bool, msg) {
	if (typeof bool !== 'boolean') throw new Error("Argument is not a boolean");
	if (!bool) throw new Error(msg ? msg : "Boolean asserted as true but was false");
}

/**
 * Asserts that the given boolean is false.  Throws an exception if not a boolean or true.
 * 
 * @param bool is the boolean to assert false
 * @param msg is the message to throw if bool is true (optional)
 */
function assertFalse(bool, msg) {
	if (typeof bool !== 'boolean') throw new Error("Argument is not a boolean");
	if (bool) throw new Error(msg ? msg : "Boolean asserted as false but was true");
}

/**
 * Asserts that the given argument is null.  Throws an exception if not null.
 * 
 * @param arg is the argument to assert null
 * @param msg is the message to throw if arg is not null (optional)
 */
function assertNull(arg, msg) {
	if (arg !== null) throw new Error(msg ? msg : "Argument asserted as null but was not null: " + arg);
}

/**
 * Asserts that the given argument is not null.  Throws an exception if null.
 * 
 * @param arg is the argument to assert not null
 * @param msg is the message to throw if arg is null (optional)
 */
function assertNotNull(arg, msg) {
	if (arg === null) throw new Error(msg ? msg : "Argument asserted as not null but was null");
}

/**
 * Asserts that the given argument is defined.  Throws an exception if undefined.
 * 
 * @param arg is the argument to assert defined
 * @param msg is the message to throw if arg is undefined (optional)
 */
function assertDefined(arg, msg) {
	if (isUndefined(arg)) throw new Error(msg ? msg : "Argument asserted as defined but was undefined");
}

/**
 * Asserts that the given argument is undefined.  Throws an exception if defined.
 * 
 * @param arg is the argument to assert undefined
 * @param msg is the message to throw if arg is defined (optional)
 */
function assertUndefined(arg, msg) {
	if (isDefined(arg)) throw new Error(msg ? msg : "Argument asserted as undefined but was defined: " + arg);
}

/**
 * Asserts that the given argument is initialized.  Throws an exception if not initialized.
 * 
 * @param arg is the argument to assert as initialized
 * @param msg is the message to throw if arg is not initialized (optional)
 */
function assertInitialized(arg, msg) {
	if (isUninitialized(arg)) throw new Error(msg ? msg : "Argument asserted as initialized but was not initialized");
}

/**
 * Asserts that the given argument is uninitialized.  Throws an exception if initialized.
 * 
 * @param arg is the argument to assert as uninitialized
 * @param msg is the message to throw if arg is initialized (optional)
 */
function assertUninitialized(arg, msg) {
	if (isInitialized(arg)) throw new Error(msg ? msg : "Argument asserted as uninitialized but was initialized");
}

/**
 * Asserts that the given arguments are equal.  Throws an exception if not equal.
 * 
 * @param arg1 is an argument to assert as equal
 * @param arg2 is an argument to assert as equal
 * @param msg is the message to throw if the arguments are not equal
 */
function assertEquals(arg1, arg2, msg) {
	if (isArray(arg1) && isArray(arg2)) return arraysEqual(arg1, arg2);
	if (isObject(arg1) && isObject(arg2)) return mapsEqual(arg1, arg2);
	if (arg1 !== arg2) throw new Error(msg ? msg : "Arguments asserted as equal but are not equal: " + arg1 + " vs " + arg2);
}

/**
 * Asserts that the given arguments are not equal.  Throws an exception if equal.
 * 
 * @param arg1 is an argument to assert as not equal
 * @param arg2 is an argument to assert as not equal
 * @param msg is the message to throw if the arguments are equal
 */
function assertNotEquals(arg1, arg2, msg) {
	if (arg1 === arg2) throw new Error(msg ? msg : "Arguments asserted as not equal but are equal: " + arg1 + " vs " + arg2);
}

/**
 * Asserts that the given argument is a number.
 * 
 * @param arg is the argument to assert as a number
 * @param msg is the message to throw if the argument is not a number
 */
function assertNumber(arg, msg) {
	if (!isNumber(arg)) throw new Error(msg ? msg : "Argument asserted as a number but is not a number");
}

/**
 * Asserts that the given argument is an object with the given name.
 * 
 * @param arg is the argument to test
 * @param name is the name of the expected object
 * @param msg is the message to throw if the argument is not the specified object
 */
function assertObject(arg, name, msg) {
	if (!isObject(arg, name)) {
		throw new Error(msg ? msg : "Argument asserted as object with name '" + name + "' but was not");
	}
}

/**
 * Asserts that the given argument is an integer.
 * 
 * @param arg is the argument to assert as an integer
 * @param msg is the message to throw if the argument is not an integer
 */
function assertInt(arg, msg) {
	if (!isInt(arg)) throw new Error(msg ? msg : "Argument asserted as an integer but is not an integer");
}

/**
 * Sets the child's prototype to the parent's prototype.
 * 
 * @param child is the child class
 * @param parent is the parent class
 */
function inheritsFrom(child, parent) {
	child.prototype = Object.create(parent.prototype);
}

/**
 * Returns the power set of the given array.
 * 
 * @param arr is the array to get the power set of
 * @returns [][] is the power set of the given array
 */
function getPowerSet(arr) {
	var fn = function(n, src, got, all) {
		if (n == 0) {
			if (got.length > 0) {
				all[all.length] = got;
			}
			return;
		}
		for (var j = 0; j < src.length; j++) {
			fn(n - 1, src.slice(j + 1), got.concat([ src[j] ]), all);
		}
		return;
	}
	var all = [];
	all.push([]);
	for (var i = 0; i < arr.length; i++) {
		fn(i, arr, [], all);
	}
	all.push(arr);
	return all;
}

/**
 * Returns the power set of the given array whose elements are the given size.
 * 
 * @param arr is the array to get the power set of
 * @param size is the required size of the elements within the power set
 * returns [][] is the power set of the given array whose elements are the given size 
 */
function getPowerSetOfLength(arr, size) {
	var power_set = getPowerSet(arr);
	var power_set_of_length = [];
	for (var i = 0; i < power_set.length; i++) {
		if (power_set[i].length == size) {
			power_set_of_length.push(power_set[i]);
		}
	}
	return power_set_of_length;
}

/**
 * Returns an array of indices of the given size.
 * 
 * @param size specifies the size to get indices for
 * @returns array of the given size with indices starting at 0
 */
function getIndices(size) {
	var indices = [];
	for (var i = 0; i < size; i++) {
		indices.push(i);
	}
	return indices;
}

/**
 * Indicates if the given array contains the given object.
 * 
 * @param arr is the array that may or may not contain the object
 * @param obj is the object to check for inclusion in the array
 * @returns true if the array contains the object, false otherwise
 */
function contains(arr, obj) {
	assertTrue(isArray(arr));
	for (var i = 0; i < arr.length; i++) {
		if (arr[i] === obj) return true;
	}
	return false;
}

/**
 * Determines if two arrays are equal.
 * 
 * @param arr1 is an array to compare
 * @param arr2 is an array to compare
 * @returns true if the arrays are equal, false otherwise
 */
function arraysEqual(arr1, arr2) {
	if (arr1 === arr2) return true;
	if (arr1 == null && arr2 == null) return true;
	if (arr1 == null || arr2 == null) return false;
	if (typeof arr1 === 'undefined' && typeof arr2 === 'undefined') return true;
	if (typeof arr1 === 'undefined' || typeof arr2 === 'undefined') return false;
	if (!isArray(arr1)) throw new Error("First argument is not an array");
	if (!isArray(arr2)) throw new Error("Second argument is not an array");
	if (arr1.length != arr2.length) return false;
	for (let i = 0; i < arr1.length; ++i) {
		if (arr1[i] !== arr2[i]) return false;
	}
	return true;
}

/**
 * Determines if two maps are equal.
 * 
 * @param map1 is a map to compare
 * @param map2 is a map to compare
 * @returns true if the maps have identical keys and values, false otherwise
 */
function mapsEqual(map1, map2) {
	if (map1.size !== map2.size) return false;
	for (let key of Object.keys(map1)) {
		if (map1[key] !== map2[key]) return false;
	}
	return true;
}

/**
 * Implements str.replaceAt(idx, replacement).
 */
String.prototype.replaceAt=function(idx, replacement) {
	return this.substr(0, idx) + replacement + this.substr(idx + replacement.length);
}

/**
 * Returns a random string of the given length.
 * 
 * @param length is the length of the random string to return
 * @returns the random string of the given length
 */
function getRandomString(length) {
	var str = "";
	while (true) {
		str += Math.random().toString(36).slice(2);
		if (str.length >= length) return str.substring(0, length);
	}
}

/**
 * Returns combinations of the given array of the given size.
 * 
 * @param arr is the array to get combinations from
 * @param combination_size specifies the size of each combination
 */
function getCombinations(arr, combination_size) {
	var combinations = [];
	
	// get combinations of array indices of the given size
	var index_combinations = getPowerSetOfLength(getIndices(arr.length), combination_size);
	
	// collect combinations from each combination of array indices
	for (var index_combinations_idx = 0; index_combinations_idx < index_combinations.length; index_combinations_idx++) {
		
		// get combination of array indices
		var index_combination = index_combinations[index_combinations_idx];
		
		// build combination from array
		var combination = [];
		for (var index_combination_idx = 0; index_combination_idx < index_combination.length; index_combination_idx++) {
			combination.push(arr[index_combination_idx]);
		}
		
		// add to combinations
		combinations.push(combination);
	}
	
	return combinations;
}

/**
 * Gets an 'a' element that is downloadable when clicked.
 * 
 * @param name is the name of the file to download
 * @param contents are the string contents of the file to download
 * @returns 'a' dom element with downloadable file
 */
function getDownloadableA(name, contents) {
	var a = window.document.createElement('a');
	a.href = window.URL.createObjectURL(new Blob([contents], {type: 'text/plain'}));
	a.download = name;
	a.target="_blank";
	a.innerHTML = name;
	return a;
}

/**
 * Returns the given node's outer HTML.
 * 
 * @param node is the node to get outer HTML for
 * @returns the outer HTML of the given node
 */
function getOuterHtml(node) {
	return $('<div>').append($(node).clone()).html();
}

/**
 * Copies variables in the given object to a new object.
 * 
 * @param obj is object to copy variables for
 * @returns a new object with copied variables
 */
function copyVariables(obj) {
	return JSON.parse(JSON.stringify(obj))
}

/**
 * Tracks the number of started and stopped threads.
 * 
 * Allows a function to be notified when there are no active threads.
 */
function ThreadTracker() {
	
	var numStarted = 0;
	var numStopped = 0;
	var idleCallback;
	var thiz = this;

	this.threadStarted = function() {
		numStarted++;
		if (numStarted <= numStopped) throw "Number of started threads must be greater than number of ended threads";
		onChange();
	};
	
	this.threadStopped = function() {
		numStopped++;
		if (numStarted < numStopped) throw "Number of started threads must be greater than or equal to number of ended threads";
		onChange();
	};
	
	this.getNumStarted = function() {
		return numStarted;
	};
	
	this.getNumStopped = function() {
		return numStopped;
	};
	
	this.getNumActive = function() {
		return numStarted - numStopped;
	};
	
	this.onIdle = function(callback) {
		idleCallback = callback;
	};
	
	function onChange() {
		if (thiz.getNumActive() === 0) idleCallback();
	}
}

/**
 * Converts a CSV string to a 2-dimensional array of strings.
 * 
 * @param csv is the CSV string to convert
 * @returns a 2-dimensional array of strings
 */
function csvToArr(csv) {
	return $.csv.toArrays(csv);
}

/**
 * Converts the given array to a CSV string.
 * 
 * @param arr is a 2-dimensional array of strings
 * @returns the CSV string
 */
function arrToCsv(arr) {
	return $.csv.fromObjects(arr, {headers: false});
}

/**
 * Indicates if the given character is whitespace.
 * 
 * @param char is the character to test
 * @returns true if the given character is whitespace, false otherwise
 */
function isWhitespace(char) {
	return /\s/.test(char);
}

/**
 * Counts the number of non-whitespace characters in the given string.
 * 
 * @param str is the string to count the number of non-whitespace characters in
 * @returns int is the number of non-whitespace characters in the given string
 */
function countNonWhitespaceCharacters(str) {
	let count = 0;
	for (let i = 0; i < str.length; i++) {
		if (!isWhitespace(str.charAt(i))) count++;
	}
	return count;
}

/**
 * Enumerates password encryption/decryption schemes.
 */
const EncryptionScheme = {
	BIP38: "BIP38",
	CRYPTOJS: "CryptoJS",
	SJCL: "SJCL"
}

/**
 * Encrypts the given key with the given scheme and password.
 * 
 * Invokes callback(err, encryptedKey) when done.
 */
function encrypt(scheme, key, password, callback) {
	if (!scheme) throw new Error("Scheme must be initialized");
	if (!isObject(key, 'CryptoKey')) throw new Error("Given key must be of class 'CryptoKey' but was " + cryptoKey);
	if (!password) throw new Error("Password must be initialized");
	switch (scheme) {
		case EncryptionScheme.CRYPTOJS:
			let b64 = CryptoJS.AES.encrypt(key.getHex(), password).toString();
			key.setState(Object.assign(key.getPlugin().newKey(b64).getState(), {address: key.getAddress()}));
			callback(null, key);
			break;
		case EncryptionScheme.BIP38:
			ninja.privateKey.BIP38PrivateKeyToEncryptedKeyAsync(key.getHex(), password, true, function(resp) {
				if (resp.message) callback(resp);	// TODO: confirm error handling, isError()
				else {
					key.setState(Object.assign(key.getPlugin().newKey(resp).getState(), {address: key.getAddress()}));
					callback(null, key);
				}
			});
			break;
		default:
			callback(new Error("Encryption scheme '" + scheme + "' not supported"));
	}
}

/**
 * Decrypts the given key with the given password.
 * 
 * Invokes callback(err, decryptedKey) when done.
 */
function decrypt(key, password, callback) {
	if (!isObject(key, 'CryptoKey')) throw new Error("Given key must be of class 'CryptoKey' but was " + cryptoKey);
	if (!password) throw new Error("Password must be initialized");
	assertTrue(key.isEncrypted());
	switch (key.getEncryptionScheme()) {
		case EncryptionScheme.CRYPTOJS:
			let hex;
			try {
				hex = CryptoJS.AES.decrypt(key.getWif(), password).toString(CryptoJS.enc.Utf8);
			} catch (err) { }
			if (!hex) callback(new Error("Incorrect password"));
			else {
				key.setPrivateKey(hex);
				callback(null, key);
			}
			break;
		case EncryptionScheme.BIP38:
			ninja.privateKey.BIP38EncryptedKeyToByteArrayAsync(key.getWif(), password, function(resp) {
				if (resp.message) callback(new Error("Incorrect password"));
				else {
					let wif = new Bitcoin.ECKey(resp).setCompressed(true).getBitcoinWalletImportFormat()
					key.setPrivateKey(wif);
					callback(null, key);
				}
			});
			break;
		default:
			callback(new Error("Encryption scheme '" + key.getEncryptionScheme() + "' not supported"));
	}
}

/**
 * Splits the given string.  First converts the string to hex.
 * 
 * @param str is the string to split
 * @param numPieces is the number of pieces to make
 * @param minPieces is the minimum number of pieces to reconstitute
 * @returns string[] are the pieces
 */
function splitString(str, numPieces, minPieces) {
	return secrets.share(secrets.str2hex(str), numPieces, minPieces);
}

/**
 * Reconstitutes the given pieces.  Assumes the pieces reconstitute hex which is converted to a string.
 * 
 * @param pieces are the pieces to reconstitute
 * @return string is the reconstituted string
 */
function reconstitute(pieces) {
	return secrets.hex2str(secrets.combine(pieces));
}

// specifies default QR configuration
const DEFAULT_QR_CONFIG = {
	size: 250,
	version: null,
	errorCorrectionLevel: 'Q',
	margin: 0,
	scale: null
}

/**
 * Renders a QR code to an image.
 * 
 * @param text is the text to codify
 * @param config specifies configuration options
 * @param callback will be called with the image node after creation
 */
function renderQrCode(text, config, callback) {
	
	// merge configs
	config = Object.assign({}, DEFAULT_QR_CONFIG, config);

	// generate QR code
	var segments = [{data: text, mode: 'byte'}];	// manually specify mode
	qrcodelib.toDataURL(segments, config, function(err, url) {
		if (err) throw err;
		var img = $("<img>");
		img.css("width", config.size + "px");
		img.css("height", config.size + "px");
		img[0].onload = function() {
			callback(img);
		}
		img[0].src = url;
	});
}

/**
 * Attempts to construct a key from the given string.  The string is expected to be a
 * single private key (hex or wif, encrypted or unencrypted) or one or more pieces that
 * reconstitute a single private key (hex or wif, encrypted or unencrypted).
 * 
 * @param plugin in the coin plugin used to parse the string
 * @param str is the string to parse into a key
 * @returns a key parsed from the given string
 * @throws an exception if a private key cannot be parsed from the string
 */
function parseKey(plugin, str) {
	str = str.trim();
	var lines = str.split('\n');
	var components = [];
	for (let line of lines) if (line) components.push(line);
	if (components.length === 0) return null;
	try {
		return components.length === 1 ? plugin.newKey(components[0]) : plugin.combine(components);
	} catch (err) {
		console.log(err);
		return null;
	}
}

/**
 * Converts the given keys to pieces.
 * 
 * @param keys are the keys to convert to pieces
 * @param numPieces are the number of pieces to split the keys into (must be >= 1)
 * @param minPieces are the minimum pieces to reconstitute the keys (optional)
 * @returns exportable pieces
 */
function keysToPieces(keys, numPieces, minPieces) {
	
	// validate input
	assertTrue(keys.length > 0);
	assertTrue(numPieces >= 1);
	if (minPieces) {
		assertTrue(numPieces >= 2);
		assertTrue(minPieces >= 2);
	} else {
		assertTrue(numPieces >= 1);
	}
	
	// initialize pieces
	let pieces = [];
	for (let i = 0; i < numPieces; i++) {
		pieces.push([]);
	}
	
	// add keys to each piece
	for (let key of keys) {
		let keyPieces = numPieces > 1 ? key.getPlugin().split(key, numPieces, minPieces) : [key.getWif()];
		for (let i = 0; i < numPieces; i++) {
			let piece = {};
			piece.crypto = key.getPlugin().getTicker();
			piece.isSplit = numPieces > 1;
			piece.address = key.getAddress();
			piece.privateKey = keyPieces[i];
			piece.encryption = key.getEncryptionScheme();
			pieces[i].push(piece);
		}
	}
	
	return pieces;
}

/**
 * Converts the given pieces to keys.
 * 
 * @param pieces are the pieces to convert to keys
 * @returns keys built from the pieces
 */
function piecesToKeys(pieces) {
	assertTrue(pieces.length > 0);
	let keys = [];
	
	// handle one piece
	if (pieces.length === 1) {
		for (let pieceKey of pieces[0]) {
			try {
				let key = getCryptoPlugin(pieceKey.crypto).newKey(pieceKey.privateKey);
				if (key.isEncrypted() && pieceKey.address) key.setAddress(pieceKey.address);
				keys.push(key);
			} catch (err) {
				return [];
			}
		}
	}
	
	// handle multiple pieces
	else {
		
		// validate pieces contain same number of keys
		let numKeys;
		for (let piece of pieces) {
			if (!numKeys) numKeys = piece.length;
			else if (numKeys !== piece.length) throw new Error("Piece " + (i + 1) + " contains " + piece[i] + " keys unlike previous pieces which contain " + numKeys + " keys");
		}
		
		// validate consistent keys across pieces
		for (let i = 0; i < pieces[0].length; i++) {
			let crypto;
			let isSplit;
			let address;
			let encryption;
			for (let piece of pieces) {
				if (!crypto) crypto = piece.crypto;
				else if (crypto !== piece.crypto) throw new Error("Pieces are for different cryptocurrencies");
				if (!isSplit) isSplit = piece.isSplit;
				else if (isSplit !== piece.isSplit) throw new Error("Pieces have different split states");
				if (!address) address = piece.address;
				else if (address !== piece.address) throw new Error("Pieces have different addresses");
				if (!encryption) encryption = piece.encryption;
				else if (encryption !== piece.encryption) throw new Error("Pieces have different encryption states");
			}
		}
		
		// combine keys across pieces
		for (let i = 0; i < pieces[0].length; i++) {
			let shares = [];
			for (let piece of pieces) shares.push(piece[i].privateKey);
			try {
				let key = getCryptoPlugin(pieces[0][i].crypto).combine(shares);
				if (key.isEncrypted() && pieces[0][i].address) key.setAddress(pieces[0][i].address);
				keys.push(key);
			} catch (err) {
				return [];
			}
		}
	}

	return keys;
}

/**
 * Zips the given pieces.
 * 
 * @param pieces are the pieces to zip
 * @param pieceHtmls are rendered HTML pieces to include in the zips
 * @param callback(name, blob) is invoked when zipping is complete
 */
function piecesToZip(pieces, pieceHtmls, callback) {
	assertTrue(pieces.length > 0, "Pieces cannot be empty");
	
	// get crypto identifier
	let cryptos = [];
	for (let key of pieces[0]) {
		if (!contains(cryptos, key.crypto)) cryptos.push(key.crypto);
	}
	let crypto = cryptos.length === 1 ? cryptos[0].toLowerCase() : "mix";
	
	// prepare zips for each piece
	let zips = [];
	for (let i = 0; i < pieces.length; i++) {
		let name = crypto + (pieces.length > 1 ? "_" + (i + 1) : "");
		let path = "cryptostorage_" + name + "/" + name;
		let zip = new JSZip();
		zip.file(path + ".html", getOuterHtml(pieceHtmls[i]));
		zip.file(path + ".csv", pieceToCsv(pieces[i]));
		zip.file(path + ".txt", pieceToStr(pieces[i]));
		zip.file(path + ".json", pieceToJson(pieces[i]));
		zips.push(zip);
	}
	
	// get callback functions to generate zips
	let funcs = [];
	for (let zip of zips) {
		funcs.push(function(callback) { zip.generateAsync({type:"blob"}).then(function(blob) { callback(null, blob) }); });
	}
	
	// zip in parallel
	async.parallel(funcs, function(err, blobs) {
		if (err) throw err;
		let name = "cryptostorage_" + crypto;
		if (blobs.length === 1) callback(name + ".zip", blobs[0]);
		else {
			
			// zip the zips
			let zip = new JSZip();
			for (let i = 0; i < blobs.length; i++) {
				zip.file(name + "/" + name + "_" + (i + 1) + ".zip", blobs[i]);
			}
			zip.generateAsync({type:"blob"}).then(function(blob) {
				callback(name + ".zip", blob);
			});
		}
	});
}

/**
 * Extracts pieces from a zip blob.
 * 
 * @param blob is the raw zip data
 * @param onPieces(namedPieces) is called when all pieces have been extracted
 */
function zipToPieces(blob, onPieces) {
	
	// load zip asynchronously
	JSZip.loadAsync(blob).then(function(zip) {
		
		// collect callback functions to get pieces
		let funcs = [];
		zip.forEach(function(path, zipObject) {
			if (path.startsWith("_")) return;
			if (path.endsWith(".json")) {
				funcs.push(getPieceCallbackFunction(zipObject));
			} else if (path.endsWith(".zip")) {
				funcs.push(getZipCallbackFunction(zipObject));
			}
		});
		
		// invoke callback functions to get pieces
		async.parallel(funcs, function(err, args) {
			if (err) throw err;
			let pieces = [];
			for (let arg of args) {
				if (isArray(arg)) for (let piece of arg) pieces.push(piece);
				else pieces.push(arg);
			}
			onPieces(pieces);
		});
	});
	
	function getPieceCallbackFunction(zipObject) {
		return function(onPiece) {
			zipObject.async("string").then(function(str) {
				let piece;
				try {
					piece = JSON.parse(str);
					validatePiece(piece);
				} catch (err) {
					//throw err;
					console.log(err);
				}
				onPiece(null, {name: zipObject.name, piece: piece});
			});
		}
	}
	
	function getZipCallbackFunction(zipObject) {
		return function(callback) {
			zipObject.async("blob").then(function(blob) {
				zipToPieces(blob, function(pieces) {
					callback(null, pieces);
				});
			});
		}
	}
}

function pieceToCsv(piece) {
	
	// convert piece to 2D array
	var arr = [];
	for (var i = 0; i < piece.length; i++) {
		arr.push([piece[i].address, piece[i].privateKey]);
	}
	
	// convert array to csv
	return arrToCsv(arr);
}

function pieceToJson(piece) {
	return JSON.stringify(piece);
}

function pieceToStr(piece) {
	var str = "";
	for (var i = 0; i < piece.length; i++) {
		str += "==== " + (i + 1) + " ====\n\n";
		str += "Public:\n" + piece[i].address + "\n\n";
		str += "Private:\n" + piece[i].privateKey + "\n\n";
	}
	return str.trim();
}

function validatePiece(piece) {
	assertTrue(piece.length > 0);
	for (let key of piece) {
		assertDefined(key.crypto, "piece.crypto is not defined");
		assertDefined(key.isSplit, "piece.isSplit is not defined");
		assertDefined(key.privateKey, "piece.privateKey is not defined");
	}
}