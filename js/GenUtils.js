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
	if (arg === false) return true;
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
	assertInitialized(arr);
	assertInitialized(size);
	assertTrue(size >= 1);
	let powerSet = getPowerSet(arr);
	let powerSetOfLength = [];
	for (let i = 0; i < powerSet.length; i++) {
		if (powerSet[i].length === size) {
			powerSetOfLength.push(powerSet[i]);
		}
	}
	return powerSetOfLength;
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
 * Returns combinations of the given array of the given size.
 * 
 * @param arr is the array to get combinations from
 * @param combinationSize specifies the size of each combination
 */
function getCombinations(arr, combinationSize) {
	
	// validate input
	assertInitialized(arr);
	assertInitialized(combinationSize);
	assertTrue(combinationSize >= 1);
	
	// get combinations of array indices of the given size
	let indexCombinations = getPowerSetOfLength(getIndices(arr.length), combinationSize);
	
	// collect combinations from each combination of array indices
	let combinations = [];
	for (let indexCombinationsIdx = 0; indexCombinationsIdx < indexCombinations.length; indexCombinationsIdx++) {
		
		// get combination of array indices
		let indexCombination = indexCombinations[indexCombinationsIdx];
		
		// build combination from array
		let combination = [];
		for (let indexCombinationIdx = 0; indexCombinationIdx < indexCombinations.length; indexCombinationIdx++) {
			combination.push(arr[indexCombinationIdx]);
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
 * Copies properties in the given object to a new object.
 * 
 * @param obj is object to copy properties for
 * @returns a new object with properties copied from the given object
 */
function copyProperties(obj) {
	return JSON.parse(JSON.stringify(obj))
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
 * Indicates if the given string contains whitespace.
 * 
 * @param str is the string to test
 * @returns true if the string contains whitespace, false otherwise
 */
function hasWhitespace(str) {
	return /\s/g.test(str);
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
 * Returns tokens separated by whitespace from the given string.
 * 
 * @param str is the string to get tokens from
 * @returns string[] are the tokens separated by whitespace within the string
 */
function getTokens(str) {
	return str.match(/\S+/g);
}

/**
 * Returns the document's first stylesheet which has no href.
 * 
 * @returns StyleSheet is the internal stylesheet
 */
function getInternalStyleSheet() {
	for (let i = 0; i < document.styleSheets.length; i++) {
		let styleSheet = document.styleSheets[i];
		if (!styleSheet.href) return styleSheet;
	}
	return null;
}

/**
 * Prints the given div in a new window.
 * 
 * @param div is the jquery div to print
 * @param css are css rules to add (optional)
 * @param title is the title of the new window (optional)
 */
function printDiv(div, css, title) {
	let w = window.open();
	w.document.write("<html>" + (title ? "<title>" + title + "</title>" : "") + "<head>" + (css ? "<style>" + css + "</style>" : "") + "</head><body>");
	w.document.write(div.html());
	w.document.write("</body></html>");
	w.print();
	w.close();
}