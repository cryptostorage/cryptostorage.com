/**
 * MIT License
 * 
 * Copyright (c) 2018 cryptostorage
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

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
 * Determines if the given argument is a boolean.
 * 
 * @param arg is the argument to test as being a boolean
 * @returns true if the argument is a boolean, false otherwise
 */
function isBoolean(arg) {
	return typeof(arg) == typeof(true);
}

/**
 * Determines if the given argument is a function.
 * 
 * @param arg is the argument to test as being a function
 * @returns true if the argument is a function, false otherwise
 */
function isFunction(arg) {
	return typeof arg === "function";
}

/**
 * Indicates if the given argument is an object and optionally if it has the given constructor name.
 * 
 * @param arg is the argument to test
 * @param obj is an object to test arg instanceof obj (optional)
 * @returns true if the given argument is an object and optionally has the given constructor name
 */
function isObject(arg, obj) {
	if (!arg) return false;
	if (typeof arg !== 'object') return false;
	if (obj && !(arg instanceof obj)) return false;
	return true;
}

/**
 * Determines if all alphabet characters in the given string are upper case.
 * 
 * @param str is the string to test
 * @returns true if the string is upper case, false otherwise
 */
function isUpperCase(str) {
	return str.toUpperCase() === str;
}

/**
 * Determines if all alphabet characters in the given string are lower case.
 * 
 * @param str is the string to test
 * @param true if the string is lower case, false otherwise
 */
function isLowerCase(str) {
	return str.toLowerCase() === str;
}

/**
 * Asserts that the given argument is hex.
 * 
 * @param arg is the argument to assert as hex
 * @param msg is the message to throw if the argument is not hex
 */
function assertHex(str, msg) {
	assertTrue(isHex(str), msg ? msg : "Argument asserted as hex but is not hex");
}

/**
 * Indicates if the given argument is a hexidemal string.
 * 
 * Credit: https://github.com/roryrjb/is-hex/blob/master/is-hex.js.
 * 
 * @param str is the string to test
 * @returns true if the given string is hexidecimal, false otherwise
 */
var HEX_REG_EXP = /([0-9]|[a-f])/gim
function isHex(arg) {
	if (typeof arg !== 'string') return false;
	if (arg.length === 0) return false;
	return (arg.match(HEX_REG_EXP) || []).length === arg.length;
}

/**
 * Determines if the given string is base32.
 */
function isBase32(str) {
	if (typeof str !== 'string') return false;
	assertTrue(str.length > 0, "Cannot determine if empty string is base32");
	return /^[ABCDEFGHIJKLMNOPQRSTUVWXYZ234567]+$/.test(str);
}

/**
 * Asserts that the given argument is base58.
 * 
 * @param arg is the argument to assert as base58
 * @param msg is the message to throw if the argument is not base58
 */
function assertBase58(str, msg) {
	assertTrue(isBase58(str), msg ? msg : "Argument asserted as base58 but is not base58");
}

/**
 * Determines if the given string is base58.
 */
function isBase58(str) {
	if (typeof str !== 'string') return false;
	assertTrue(str.length > 0, "Cannot determine if empty string is base58");
	return /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/.test(str);
}

/**
 * Asserts that the given argument is base64.
 * 
 * @param arg is the argument to assert as base64
 * @param msg is the message to throw if the argument is not base64
 */
function assertBase64(str, msg) {
	assertTrue(isBase64(str), msg ? msg : "Argument asserted as base64 but is not base64");
}

/**
 * Determines if the given string is base64.
 */
function isBase64(str) {
	if (typeof str !== 'string') return false;
	assertTrue(str.length > 0, "Cannot determine if empty string is base64");
	try {
		return btoa(atob(str)) == str;
	} catch (err) {
		return false;
	}
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
	if (isUninitialized(arg)) {
		throw new Error(msg ? msg : "Argument asserted as initialized but was " + arg);
	}
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
	assertTrue(equals(arg1, arg2), msg ? msg : "Arguments asserted as equal but are not equal: " + arg1 + " vs " + arg2);
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
 * Asserts that the given argument is an integer.
 * 
 * @param arg is the argument to assert as an integer
 * @param msg is the message to throw if the argument is not an integer
 */
function assertInt(arg, msg) {
	if (!isInt(arg)) throw new Error(msg ? msg : "Argument asserted as an integer but is not an integer");
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
 * Asserts that the given argument is a boolean.
 * 
 * @param arg is the argument to assert as a boolean
 * @param msg is the message to throw if the argument is not a boolean
 */
function assertBoolean(arg, msg) {
	if (!isBoolean(arg)) throw new Error(msg ? msg : "Argument asserted as a boolean but is not a boolean");
}

/**
 * Asserts that the given argument is a string.
 * 
 * @param arg is the argument to assert as a string
 * @param msg is the message to throw if the argument is not a string
 */
function assertString(arg, msg) {
	if (!isString(arg)) throw new Error(msg ? msg : "Argument asserted as a string but is not a string: " + arg);
}

/**
 * Asserts that the given argument is an array.
 * 
 * @param arg is the argument to assert as an array
 * @param msg is the message to throw if the argument is not an array
 */
function assertArray(arg, msg) {
	if (!isArray(arg)) throw new Error(msg ? msg : "Argument asserted as an array but is not an array");
}

/**
 * Asserts that the given argument is a function.
 * 
 * @param arg is the argument to assert as a function
 * @param msg is the message to throw if the argument is not a function
 */
function assertFunction(arg, msg) {
	if (!isFunction(arg)) throw new Error(msg ? msg : "Argument asserted as a function but is not a function");
}

/**
 * Asserts that the given argument is an object with the given name.
 * 
 * @param arg is the argument to test
 * @param obj is an object to assert arg instanceof obj (optional)
 * @param msg is the message to throw if the argument is not the specified object
 */
function assertObject(arg, obj, msg) {
	assertInitialized(arg, msg);
	if (obj) {
		if (!isObject(arg, obj)) throw new Error(msg ? msg : "Argument asserted as object '" + obj.name + "' but was not");
	} else {
		if (!isObject(arg)) throw new Error(msg ? msg : "Argument asserted as object but was not");
	}
}

/**
 * Sets the child's prototype to the parent's prototype.
 * 
 * @param child is the child class
 * @param parent is the parent class
 */
function inheritsFrom(child, parent) {
	child.prototype = Object.create(parent.prototype);
	child.prototype.constructor = child;
}

/**
 * Invokes functions with arguments.
 * 
 * arguments[0] is assumed to be an array of functions to invoke
 * arguments[1...n] are args to invoke the functions with
 */
function invoke() {
	var fns = arguments[0];
	var args = [];
	for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
	for (var i = 0; i < fns.length; i++) {
		assertFunction(fns[i], "Functions[" + i + "] is not a function");
		fns[i].apply(null, args);
	}
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
	var powerSet = getPowerSet(arr);
	var powerSetOfLength = [];
	for (var i = 0; i < powerSet.length; i++) {
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
 * Returns a new array containing unique elements of the given array.
 * 
 * @param arr is the array to return unique elements from
 * @returns a new array with the given array's unique elements
 */
function toUniqueArray(arr) {
	return arr.filter(function(value, index, self) {
		return self.indexOf(value) === index;
	});
}

/**
 * Copies the given array.
 * 
 * @param arr is the array to copy
 * @returns a copy of the given array
 */
function copyArray(arr) {
	assertArray(arr);
	var copy = [];
	for (var i = 0; i < arr.length; i++) copy.push(arr[i]);
	return copy;
}

/**
 * Returns a copy of the given array where each element is lowercase.
 * 
 * @param arr is the array to convert to lowercase
 * @returns a copy of the given array where each element is lowercase
 */
function toLowerCaseArray(arr) {
	var arr2 = [];
	for (var i = 0; i < arr.length; i++) {
		arr2.push(arr[i].toLowerCase());
	}
	return arr2;
}

/**
 * Listifies the given argument.
 * 
 * @param arrOrElem is an array or an element in the array
 * @returns an array which is the given arg if it's an array or an array with the given arg as an element
 */
function listify(arrOrElem) {
	return isArray(arrOrElem) ? arrOrElem : [arrOrElem];
}

/**
 * Indicates if the given array contains the given object.
 * 
 * @param arr is the array that may or may not contain the object
 * @param obj is the object to check for inclusion in the array
 * @returns true if the array contains the object, false otherwise
 */
function arrayContains(arr, obj) {
	assertTrue(isArray(arr));
	for (var i = 0; i < arr.length; i++) {
		if (equals(arr[i], obj)) return true;
	}
	return false;
}

/**
 * Indicates if the given string contains the given substring.
 * 
 * @param str is the string to search for a substring
 * @param substring is the substring to searchin within the string
 * @returns true if the substring is within the string, false otherwise
 */
function strContains(str, substring) {
	return str.indexOf(substring) > -1;
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
	for (var i = 0; i < arr1.length; ++i) {
		if (!equals(arr1[i], arr2[i])) return false;
	}
	return true;
}

/**
 * Determines if two arguments are deep equal.
 * 
 * @param arg1 is an argument to compare
 * @param arg2 is an argument to compare
 * @returns true if the arguments are deep equals, false otherwise
 */
function equals(arg1, arg2) {
	if (isArray(arg1) && isArray(arg2)) return arraysEqual(arg1, arg2);
	if (isObject(arg1) && isObject(arg2)) return objectsEqual(arg1, arg2);
	return arg1 === arg2;
}

/**
 * Determines if two objects are deep equal.
 * 
 * @param map1 is a map to compare
 * @param map2 is a map to compare
 * @returns true if the maps have identical keys and values, false otherwise
 */
function objectsEqual(map1, map2) {
	var keys1 = Object.keys(map1);
	if (keys1.length !== Object.keys(map2).length) return false;
	for (var i = 0; i < keys1.length; i++) {
		var key = Object.keys(map1)[i];
		if (!equals(map1[key], map2[key])) return false;
	}
	return true;
}

/**
 * Polyfill str.replaceAt(idx, replacement).
 */
String.prototype.replaceAt=function(idx, replacement) {
	return this.substr(0, idx) + replacement + this.substr(idx + replacement.length);
}

/**
 * Polyfill str.startsWith(searchString, position).
 * 
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith#Polyfill
 */
String.prototype.startsWith = function(searchString, position) {
  return this.substr(position || 0, searchString.length) === searchString;
};

/**
 * Polyfill str.endsWith(searchString, position).
 * 
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith#Polyfill
 */
String.prototype.endsWith = function(searchString, position) {
	if (!(position < this.length)) position = this.length;	// works better than >= because it compensates for NaN
	else position |= 0;	// round position
	return this.substr(position - searchString.length, searchString.length) === searchString;
}

/**
 * Removes the given value from the array.
 * 
 * @returns true if the value was found and removed, false otherwise
 */
Array.prototype.removeVal = function(val) {
	var found = false;
  for (var i = 0; i < this.length; i++) {
    if (this[i] == val) {    
      found = true;
      this.splice(i, 1);
      i--;
    }
  }
  return found;;
};

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
	var indexCombinations = getPowerSetOfLength(getIndices(arr.length), combinationSize);
	
	// collect combinations from each combination of array indices
	var combinations = [];
	for (var indexCombinationsIdx = 0; indexCombinationsIdx < indexCombinations.length; indexCombinationsIdx++) {
		
		// get combination of array indices
		var indexCombination = indexCombinations[indexCombinationsIdx];
		
		// build combination from array
		var combination = [];
		for (var indexCombinationIdx = 0; indexCombinationIdx < indexCombination.length; indexCombinationIdx++) {
			combination.push(arr[indexCombination[indexCombinationIdx]]);
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
 * Deletes all properties in the given object.
 * 
 * @param obj is the object to delete properties from
 */
function deleteProperties(obj) {
	var props = [];
	for (var prop in obj) props.push(prop);
	for (i = 0; i < props.length; i++) delete obj[props[i].toString()];
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
 * Indicates if the given character is a newline.
 * 
 * @param char is the character to test
 * @returns true if the given character is a newline, false otherwise
 */
function isNewline(char) {
	return char === '\n' || char === '\r';
}

/**
 * Counts the number of non-whitespace characters in the given string.
 * 
 * @param str is the string to count the number of non-whitespace characters in
 * @returns int is the number of non-whitespace characters in the given string
 */
function countNonWhitespaceCharacters(str) {
	var count = 0;
	for (var i = 0; i < str.length; i++) {
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
function getWhitespaceTokens(str) {
	return str.match(/\S+/g);
}

/**
 * Returns lines separated by newlines from the given string.
 * 
 * @param str is the string to get lines from
 * @param string[] are the lines separated by newlines within the string
 */
function getLines(str) {
	return str.match(/[^\r\n]+/g);
}

/**
 * Returns the document's first stylesheet which has no href.
 * 
 * @returns StyleSheet is the internal stylesheet
 */
function getInternalStyleSheet() {
	for (var i = 0; i < document.styleSheets.length; i++) {
		var styleSheet = document.styleSheets[i];
		if (!styleSheet.href) return styleSheet;
	}
	return null;
}

/**
 * Returns the document's internal stylesheet as text.
 * 
 * @returns str is the document's internal stylesheet
 */
function getInternalStyleSheetText() {
	var internalCss = "";
	var internalStyleSheet = getInternalStyleSheet();
	if (!internalStyleSheet) return null;
	for (var i = 0; i < internalStyleSheet.cssRules.length; i++) {
		internalCss += internalStyleSheet.cssRules[i].cssText + "\n";
	}
	return internalCss;
}

/**
 * Manually builds an HTML document string.
 * 
 * @param content specifies optional document content
 * 				content.div is a pre-existing div to stringify and add to the body
 * 				content.title is the title of the new tab
 * 				content.dependencyPaths specifies paths to js, css, or img paths
 * 				content.internalCss is css to embed in the html document
 * 				content.metas are meta elements with keys/values to include
 * @returns str is the document string
 */
function buildHtmlDocument(content) {
	var str = "<!DOCTYPE HTML>";
	str += "<html><head>";
	
	// add metas
	if (content.metas) {
		var metas = listify(content.metas);
		for (var i = 0; i < metas.length; i++) {
			var meta = metas[i];
			var elem = document.createElement("meta");
			for (var prop in meta) {
				if (meta.hasOwnProperty(prop)) {
					elem.setAttribute(prop.toString(), meta[prop.toString()]);
				}
			}
			str += elem.outerHTML;
		}
	}
	
	// add title and internal css
	str += content.title ? "<title>" + content.title + "</title>" : "";
	str += content.internalCss ? "<style>" + content.internalCss + "</style>" : "";
	
	// add dependency paths
	if (content.dependencyPaths) {
		var dependencyPaths = listify(content.dependencyPaths);
		for (var i = 0; i < dependencyPaths.length; i++) {
			var dependencyPath = dependencyPaths[i];
			if (dependencyPath.endsWith(".js")) str += "<script src='" + dependencyPath + "'></script>";
			else if (dependencyPath.endsWith(".css")) str += "<link rel='stylesheet' type='text/css' href='" + dependencyPath + "'/>";
			else if (dependencyPath.endsWith(".png") || dependencyPath.endsWith(".img"))  str += "<img src='" + dependencyPath + "'>";
			else throw new Error("Unrecognized dependency path extension: " + dependencyPath);			
		}
	}
	str += "</head><body>";
	if (content.div) str += $("<div>").append(content.div.clone()).html();	// add cloned div as string
	str += "</body></html>";
	return str;
}

/**
 * Opens the given div in a new window.
 * 
 * @param content specifies optional window content
 * 				content.div is a pre-existing div to stringify and add to the body
 * 				content.title is the title of the new tab
 * 				content.dependencyPaths specifies paths to js, css, or img paths
 * 				content.internalCss is css to embed in the html document
 * 				content.metas are meta elements with keys/values to include
 * @param onLoad(err, window) is invoked with a reference to the window when available
 */
function newWindow(content, onLoad) {
	var onLoadCalled = false;
	var w = window.open();
	if (!isInitialized(w) || !isInitialized(w.document)) {
		onLoadOnce(new Error("Could not get window reference"));
		return;
	}
	w.opener = null;
	w.document.write(buildHtmlDocument(content));
	w.addEventListener('load', function() {
		onLoadOnce(null, w);
	});
	w.document.close();
	
	// prevents onLoad() from being called multiple times
	function onLoadOnce(err, window) {
		if (onLoadCalled) return;
		onLoadCalled = true;
		if (onLoad) onLoad(err, window);
	}
}

/**
 * Converts the given image to a base64 encoded data url.
 * 
 * @param img is the image to convert
 * @param quality is a number between 0 and 1 specifying the image quality
 */
function imgToDataUrl(img, quality) {
	var canvas = document.createElement('canvas');
  canvas.height = img.naturalHeight;
  canvas.width = img.naturalWidth;
  var context = canvas.getContext('2d');
  context.drawImage(img, 0, 0);
  return canvas.toDataURL(quality);
}

/**
 * Determines if the image at the given URL is accessible.
 * 
 * @param url is the url to an image
 * @param timeout is the maximum time to wait
 * @param onDone(bool) when the image is determined to be accessible or not
 */
function isImageAccessible(url, timeout, onDone) {
	
	// track return so it only executes once
	var returned = false;
	
	// attempt to load favicon
	var img = new Image();
	img.onload = onResponse;
  img.onerror = onResponse;
  img.src = url + "?" + (+new Date()); // trigger image load with cache buster
	
	// nest failure timeouts to give response a chance when browser is under load
	setTimeout(function() {
		setImmediate(function() {
			setImmediate(function() {
				setImmediate(function() {
					if (!returned) {
						returned = true;
						onDone(false);
					}
				});
			});
		});
	}, timeout);
	
  function onResponse(e) {
  	if (returned) return;
  	returned = true;
  	if (typeof e === 'undefined' || e.type === "error") onDone(false);
  	else onDone(true);
  }
}

/**
 * Determines if the given file is a zip file.
 * 
 * @param file is a file
 * @returns true if the given file is a zip file, false otherwise
 */
function isZipFile(file) {
	return file.name.endsWith(".zip") || file.type === 'application/zip';
}

/**
 * Determines if the given file is a json file.
 * 
 * @param file is a file
 * @returns true if the given file is a json file, false otherwise
 */
function isJsonFile(file) {
	return file.name.endsWith(".json") || file.type === 'application/json';
}

/**
 * Determines if the given file is a csv file.
 * 
 * @param file is a file
 * @returns true if the given file is a csv file, false otherwise
 */
function isCsvFile(file) {
	return file.name.endsWith(".csv") || file.type === 'text/csv';
}

/**
 * Determines if the given file is a txt file.
 * 
 * @param file is a file
 * @returns true if the given file is a txt file, false otherwise
 */
function isTxtFile(file) {
	return file.name.endsWith(".txt") || file.type === 'text/plain';
}

/**
 * Fetches the given list of images.
 * 
 * Prerequisite: async.js.
 * 
 * @param paths are the paths to the images to fetch
 * @param onDone(err, images) is called when done
 */
function getImages(paths, onDone) {
	
	// listify paths
	if (!isArray(paths)) {
		assertTrue(isString(paths));
		paths = [paths];
	}
	
	// collect functions to fetch images
	var funcs = [];
	for (var i = 0; i < paths.length; i++) {
		funcs.push(loadFunc(paths[i]));
	}
	
	// fetch in parallel
	async.parallel(funcs, onDone);
	
	// callback function to fetch a single image
	function loadFunc(path) {
		return function(onDone) {
			var img = new Image();
			img.onload = function() { onDone(null, img); }
			img.onerror = function() { onDone(new Error("Cannot load image: " + path)); }
			img.src = path;
		}
	}
}


/**
 * Inits polyfills.
 */
initPolyfills();
function initPolyfills() {
	
	// Polyfill Object.assign()
	// Credit: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
	if (typeof Object.assign != 'function') {
	  // Must be writable: true, enumerable: false, configurable: true
	  Object.defineProperty(Object, "assign", {
	    value: function assign(target, varArgs) { // .length of function is 2
	      'use strict';
	      if (target == null) { // TypeError if undefined or null
	        throw new TypeError('Cannot convert undefined or null to object');
	      }

	      var to = Object(target);

	      for (var index = 1; index < arguments.length; index++) {
	        var nextSource = arguments[index];

	        if (nextSource != null) { // Skip over if undefined or null
	          for (var nextKey in nextSource) {
	            // Avoid bugs when hasOwnProperty is shadowed
	            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
	              to[nextKey] = nextSource[nextKey];
	            }
	          }
	        }
	      }
	      return to;
	    },
	    writable: true,
	    configurable: true
	  });
	}
}

/**
 * Generates a v4 UUID.
 * 
 * Source: https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
 */
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Gets the IE version number.
 * 
 * Credit: https://stackoverflow.com/questions/19999388/check-if-user-is-using-ie-with-jquery/21712356#21712356
 * 
 * @returns the IE version number of null if not IE
 */
function getIEVersion() {
    var ua = window.navigator.userAgent;

    var msie = ua.indexOf('MSIE ');
    if (msie > 0) {
        // IE 10 or older => return version number
        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }

    var trident = ua.indexOf('Trident/');
    if (trident > 0) {
        // IE 11 => return version number
        var rv = ua.indexOf('rv:');
        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }

    var edge = ua.indexOf('Edge/');
    if (edge > 0) {
       // Edge (IE 12+) => return version number
       return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
    }

    // other browser
    return null;
}

/**
 * Gets a parameter value.
 * 
 * Credit: https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
 * 
 * @param name is the name of the parameter to get the value of
 * @param url is a URL to get the parameter from, uses the window's current href if not given
 * @returns the parameter's value
 */
function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"), results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}