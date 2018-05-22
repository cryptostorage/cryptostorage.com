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
 * Operating systems separate so AppUtils can reference.
 */
var OperatingSystems = {
		LINUX: [
			"Linux", "CentOS", "Debian", "Fedora", "Linux Mint", "Mint", "RedHat", "Red Hat", "SuSE", "Ubuntu", "Xubuntu",
			"PCLinuxOS", "VectorLinux", "Zenwalk", "GNU"
		],
		OSX: ["Mac OS", "Mac OS X", "Macintosh", "Mac"],
		WINDOWS: ["Windows Phone", "Windows 98;", "Windows 98", "Windows", "Windows ", "Windows Phone", "Windows Mobile"],
}

/**
 * Collection of utilities and constants for cryptostorage.com.
 */
var AppUtils = {
		
	// app constants
	VERSION: "0.3.0",
	VERSION_POSTFIX: " beta",
	RUN_MIN_TESTS: false,
	RUN_FULL_TESTS: false,
	DEV_MODE: true,
	DEV_MODE_PASSPHRASE: "abctesting123",
	DELETE_WINDOW_CRYPTO: false,
	VERIFY_ENCRYPTION: false,
	ENCRYPTION_THREADS: 1,
	MIN_PASSPHRASE_LENGTH: 7,
	CRYPTOSTORAGE_URL: "https://cryptostorage.com",
	ONLINE_IMAGE_URL: "https://cryptostorage.com/favicon.ico",
	ENVIRONMENT_REFRESH_RATE: 5000,		// environment refresh rate in milliseconds
	ONLINE_DETECTION_TIMEOUT: 5000,		// timeout to detect if online
	SLIDER_RATE: 4000,								// rate of slider transitions
	NO_INTERNET_CAN_BE_ERROR: false,	// lack of internet can be critical error if running remotely
	SIMULATED_LOAD_TIME: null,				// simulate slow load times in ms, disabled if null
	IGNORE_HASH_CHANGE: false,				// specifies that the browser should ignore hash changes
	NA: "Not applicable",							// "not applicable" constant
	MAX_SHARES: 127,									// maximum number of split shares
	//MAX_KEYPAIRS: 1000,							// limit max keypairs per currency selection
	TICKERS_PARAM: "tickers",					// generate.html?tickers=xmr
	
	// urls
	GITHUB_URL: "https://github.com/cryptostorage/cryptostorage.com",
	GITHUB_DOWNLOAD_URL: "https://github.com/cryptostorage/cryptostorage.com/archive/master.zip",
	GITHUB_ISSUES_URL: "https://github.com/cryptostorage/cryptostorage.com/issues",
	REDDIT_URL: "https://www.reddit.com/r/cryptostorage/",
	
	// encryption v1 constants
	ENCRYPTION_V2_PBKDF_ITER: 10000,
	ENCRYPTION_V2_KEY_SIZE: 256,
	ENCRYPTION_V2_BLOCK_SIZE: 16,
	ENCRYPTION_V2_VERSION: 1,

	/**
	 * Mock environment checks.
	 */
	MOCK_ENVIRONMENT_ENABLED: false,
	MOCK_ENVIRONMENT: {
		browser: {name: "Firefox", version: "42.0", major: 42, isOpenSource: true, isSupported: true, windowCryptoExists: true},
		os: {name: "Linux", version: "10.12", isOpenSource: true},
		isLocal: true,
		isOnline: false,
	},
	
	// classify operating systems and browsers as open or closed source
	OPEN_SOURCE_BROWSERS: [
		"Firefox", "Chromium", "Tizen", "Epiphany", "K-Meleon", "SeaMonkey", "SlimerJS", "Arora", "Breach", "Camino",
		"Electron", "Fennec", "Konqueror", "Midori", "PaleMoon", "Rekonq", "Sunrise", "Waterfox", "Amaya", "Bowser",
		"Camino"
	],
	CLOSED_SOURCE_BROWSERS: [
		"Chrome", "Chrome WebView", "Chrome Mobile", "Safari", "Opera", "Opera Mini", "Samsung Internet for Android",
		"Samsung Internet", "Opera Coast", "Yandex Browser", "UC Browser", "Maxthon", "Puffin", "Sleipnir",
		"Windows Phone", "Internet Explorer", "Microsoft Edge", "IE", "Vivaldi", "Sailfish", "Amazon Silk", "Silk",
		"PhantomJS", "BlackBerry", "WebOS", "Bada", "Android", "iPhone", "iPad", "iPod", "Googlebot", "Adobe AIR", "Avant",
		"Avant Browser", "Flock", "Galeon", "GreenBrowser", "iCab", "Lunascape", "Maxthon", "Nook Browser", "Raven",
		"RockMelt", "SlimBrowser", "SRWare Iron", "Swiftfox", "WebPositive", "Android Browser", "Baidu", "Blazer",
		"Comodo Dragon", "Dolphin", "Edge", "iCab", "IE Mobile", "IEMobile", "Kindle", "WeChat", "Yandex"
	],
	OPEN_SOURCE_OPERATING_SYSTEMS: [].concat(OperatingSystems.LINUX),
	CLOSED_SOURCE_OPERATING_SYSTEMS: [
		"Android", "Chrome OS", "Cygwin", "hpwOS", "Tablet OS", "AIX", "Amiga OS", "Bada", "BeOS", "BlackBerry", "Hurd", "Linpus",
		"Mandriva", "Morph OS", "OpenVMS", "OS/2", "QNX", "RIM Tablet OS", "Sailfish", "Series40", "Solaris", "Symbian", "WebOS",
		"iOS", "FreeBSD", "Gentoo", "Haiku", "Kubuntu", "OpenBSD", "Symbian OS", "webOS", "webOS", "Tizen", "Chromium OS",
		"Contiki", "DragonFly", "Joli", "Mageia", "MeeGo", "Minix", "NetBSD", "Plan9" 
	].concat(OperatingSystems.OSX).concat(OperatingSystems.IOS).concat(OperatingSystems.WINDOWS),
	
	// ------------------------- APPLICATION DEPENDENCIES -----------------------
	
	// returns inital homepage dependencies
	getHomeDependencies: function() {
		var dependencies = [
			"lib/slick.js",
			"css/slick.css",
			"img/cryptostorage_white.png",
			"img/cryptocurrency.png",
			"img/printer.png",
			"img/security.png",
			"img/microscope.png",
			"img/keys.png",
			"img/checklist.png",
			"img/passphrase_input.png",
			"img/split_input.png",
			"img/print_sample.png",
			"img/notice_bars.png",
			"img/key.png",
			"img/mit.png",
			"img/github.png",
		];
		
		// crypto logos
		for (var i = 0; i < AppUtils.getCryptoPlugins().length; i++) {
			dependencies.push(AppUtils.getCryptoPlugins()[i].getLogoPath());
		}
		
		return dependencies;
	},
	
	// returns faq dependencies
	getFaqDependencies: function() {
		return [
			"lib/setImmediate.js",
			"img/key_pair.png",
			"img/notice_bar_pass.png"
		];
	},
	
	// returns donation dependencies
	getDonateDependencies: function() {
		return [
			"lib/tippy.all.js",
			"lib/clipboard.js",
			"lib/qrcode.js",
			"img/loading.gif",
			"img/bitpay.png",
			"img/ethereumjs.png",
		];
	},
	
	// returns app dependencies excluding import and editor
	getAppDependencies: function() {
		var dependencies = ["js/Tests.js"];
		dependencies = dependencies.concat(AppUtils.getHomeDependencies());
		dependencies = dependencies.concat(AppUtils.getFaqDependencies());
		dependencies = dependencies.concat(AppUtils.getDonateDependencies());
		return dependencies;
	},
	
	// returns dependencies for notice bar
	getNoticeDependencies: function() {
		return [
			"lib/setImmediate.js",
			"lib/ua-parser.js",
			"lib/popper.js",
			"lib/tippy.all.js",
			"img/skull.png",
			"img/internet.png",
			"img/browser.png",
			"img/computer.png",
			"img/download.png",
			"img/circle_checkmark.png",
			"img/circle_exclamation.png",
			"img/circle_x.png"
		];
	},
	
	// returns all crypto dependencies
	getPluginDependencies: function() {
		var dependencies = [];
		dependencies.push("lib/crypto-js.js");
		dependencies.push("lib/bitcoinjs-3.3.2.js");
		var plugins = AppUtils.getCryptoPlugins();
		for (var i = 0; i < plugins.length; i++) {
			dependencies = dependencies.concat(plugins[i].getDependencies());
			dependencies.push(plugins[i].getLogoPath());
		}
		return dependencies;
	},
	
	// returns dependencies to initialize editor with loading wheel
	getInitialEditorDependencies: function() {
		return [
			"lib/jquery-3.2.1.js",
			"lib/async.js",
			"lib/loadjs.js",
			"lib/tippy.all.js",
			"js/DependencyLoader.js",
			"js/GenUtils.js",
			"js/AppUtils.js",
			"js/DivControllers.js",
			"js/CryptoPlugins.js",
			"js/InitEditor.js",
			"lib/pagination.js",
			"css/style.css",
			"css/pagination.css",
		];
	},

	// returns dependencies for import and export so both will work when offline after either is accessed
	getImportExportDependencies: function() {
		var dependencies = [
			"css/pagination.css",
			"lib/pagination.js",
			"lib/qrcode.js",
			"lib/jquery-csv.js",
			"lib/jszip.js",
			"lib/FileSaver.js",
			"lib/crypto-js.js",
			"lib/progressbar.js",
			"lib/bitaddress.js",
			"lib/clipboard.js",
			"lib/jquery.ddslick.js",
			"lib/polyfill.js",
			"js/CryptoKeypair.js",
			"js/CryptoPiece.js",
			"js/PieceGenerator.js",
			"lib/setImmediate.js",
			"img/cryptostorage_export.png",
			"img/restricted.png",
			"img/caution_solid.png",
			"img/trash.png",
			"img/visible.png",
			"img/visible_false.png",
			"img/information_white.png",
			"img/caution_solid.png",
			"img/qr_code.png",
			"img/split_lines_2.png",
			"img/split_lines_3.png",
			
			// import images
			"img/file.png",
			"img/files.png",
			"img/caution.png",
			"img/checkmark.png",
			"img/drag_and_drop.png",
			"img/trash.png",
		];
		
		// add dependencies
		dependencies = dependencies.concat(AppUtils.getPluginDependencies());
		dependencies = dependencies.concat(AppUtils.getNoticeDependencies());
		
		// return unique array
		return toUniqueArray(dependencies);
	},
	
	/**
	 * Returns all crypto plugins.
	 */
	getCryptoPlugins: function() {
		if (!AppUtils.plugins) {
			AppUtils.plugins = [];
			AppUtils.plugins.push(new BitcoinCashPlugin());
			AppUtils.plugins.push(new EthereumPlugin());
			AppUtils.plugins.push(new MoneroPlugin());
			AppUtils.plugins.push(new BitcoinJsPlugin("BTC"));
			AppUtils.plugins.push(new BitcoinJsPlugin("LTC"));
			AppUtils.plugins.push(new BitcoinJsPlugin("DOGE"));
			AppUtils.plugins.push(new NeoPlugin());
			AppUtils.plugins.push(new BitcoinJsPlugin("DASH"));
			AppUtils.plugins.push(new BitcoinJsPlugin("XZC"));
			AppUtils.plugins.push(new BitcoinJsPlugin("ZEC"));
			AppUtils.plugins.push(new WavesPlugin());
			AppUtils.plugins.push(new StellarPlugin());
			AppUtils.plugins.push(new RipplePlugin());
			AppUtils.plugins.push(new EthereumClassicPlugin());
			AppUtils.plugins.push(new OmiseGoPlugin());
			AppUtils.plugins.push(new BasicAttentionTokenPlugin());
			AppUtils.plugins.push(new BIP39Plugin());
			AppUtils.plugins.push(new UbiqPlugin());
		}
		return AppUtils.plugins;
	},
	
	/**
	 * Returns the crypto plugin with the given ticker symbol.
	 */
	getCryptoPlugin: function(ticker) {
		assertString(ticker);
		ticker = ticker.trim().toLowerCase();
		var plugins = AppUtils.getCryptoPlugins();
		for (var i = 0; i < plugins.length; i++) {
			var plugin = plugins[i];
			if (plugin.getTicker().toLowerCase() === ticker) return plugin;
		}
		throw new Error("No plugin found for crypto '" + ticker + "'");
	},
		
	/**
	 * Enumerates passphrase encryption/decryption schemes.
	 */
	EncryptionScheme: {
		BIP38: "BIP38",
		V0_CRYPTOJS: "V0_CRYPTOJS",
		V1_CRYPTOJS: "V1_CRYPTOJS",
	},
	
	/**
	 * Gobal file types.
	 */
	FileType: {
		JSON: "JSON",
		CSV: "CSV",
		TXT: "TXT",
		ZIP: "ZIP"
	},
	
	/**
	 * Returns the file extension for the given type.
	 */
	getExtension: function(fileType) {
		assertString(fileType);
		switch (fileType) {
			case AppUtils.FileType.JSON: return ".json";
			case AppUtils.FileType.CSV: return ".csv";
			case AppUtils.FileType.TXT: return ".txt";
			case AppUtils.FileType.ZIP: return ".zip";
			default: throw new Error("Unrecognized file type: " + fileType);
		}
	},
		
	/**
	 * Returns the version numbers from a string of the format NN.NN.NN.
	 * 
	 * @param str is the string to get the version numbers from
	 * 
	 * @returns int[3] with the three version numbers
	 */
	getVersionNumbers: function(str) {
		var dotIdx1 = str.indexOf('.');
		if (dotIdx1 < 0) throw new Error("Version does not have dot separator: " + str);
		var dotIdx2 = str.indexOf('.', dotIdx1 + 1);
		if (dotIdx2 < 0) throw new Error("Version does not have two dot separators: " + str);
		if (str.indexOf('.', dotIdx2 + 1) >= 0) throw new Error("Version has more than 2 dot separators: " + str);
		var nums = [];
		nums.push(Number(str.substring(0, dotIdx1)));
		nums.push(Number(str.substring(dotIdx1 + 1, dotIdx2)));
		nums.push(Number(str.substring(dotIdx2 + 1)));
		for (var i = 0; i < nums.length; i++) {
			assertNumber(nums[i], "Version element " + i + " is not a number");
			assertTrue(nums[i] >= 0, "Version element " + i + " + is negative");
		}
		assertTrue(nums[0] + nums[1] + nums[2] > 0, "Version does not have positive element: " + str);
		return nums;
	},
	
	getCommonTicker: function(piece) {
		assertTrue(piece.keys.length > 0);
		var ticker;
		for (var i = 0; i < piece.keys.length; i++) {
			var pieceKey = piece.keys[i];
			if (!ticker) ticker = pieceKey.ticker;
			else if (ticker !== pieceKey.ticker) return "mix";
		}
		return ticker;
	},
	
	/**
	 * Returns a version of the string up to the given maxLength characters.
	 * 
	 * If the string is longer than maxLength, shortens the string by replacing middle characters with '...'.
	 * 
	 * @param str is the string to shorten
	 * @param maxLength is the maximum length of the string
	 * @return the given str if str.length <= maxLength, shortened version otherwise
	 */
	getShortenedString: function(str, maxLength) {
		assertString(str);
		if (str.length <= maxLength) return str;
		var insert = '...';
		var sideLength = Math.floor((maxLength - insert.length) / 2);
		if (sideLength === 0) throw new Error("Cannot create string of length " + maxLength + " from string '" + str + "'");
		return str.substring(0, sideLength) + insert + str.substring(str.length - sideLength);
	},
	
	/**
	 * Gets a formatted timestamp.
	 */
	getTimestamp: function() {
		var date = new Date();
		var year = date.getFullYear();
		var month = date.getMonth() + 1;
		if (month < 10) month = "0" + month;
		var day = date.getDate();
		if (day < 10) day = "0" + day;
		var hour = date.getHours();
		if (hour < 10) hour = "0" + hour;
		var min = date.getMinutes();
		if (min < 10) min = "0" + min;
//		var sec = date.getSeconds();
//		if (sec < 10) sec = "0" + sec;
		return "" + year + month + day + hour + min;
	},
	
	/**
	 * Returns browser info.
	 * 
	 * Requires lib/ua-parser.js to be loaded.
	 * 
	 * @returns
	 * 	{
	 * 		name: "...",
	 * 		version: "...",
	 * 		major: e.g. 57
	 * 	 	windowCryptoExists: true|false,
	 * 		isOpenSource: true|false,
	 * 	  isSupported: true|false
	 * 	}
	 */
	getBrowserInfo: function() {
		
		// parse browser user agent
		var parser = new UAParser();
		var result = parser.getResult();
		
		// build info and return
		var info = {};
		info.name = result.browser.name;
		if (info.name === "Chrome" && !isChrome()) info.name = "Chromium";	// check for chromium
		info.version = result.browser.version;
		info.major = Number(result.browser.major);
		info.isOpenSource = isOpenSourceBrowser(info.name);
		info.windowCryptoExists = window.crypto ? true : false;
		info.isSupported = isSupportedBrowser(info);
		return info;
		
		// determines if chrome by checking for in-built PDF viewer
		function isChrome() {
			for (var i = 0; i < navigator.plugins.length; i++) {
				if (navigator.plugins[i].name === "Chrome PDF Viewer") return true;
			}
			return false;
		}
		
		// determines if browser is open source
		function isOpenSourceBrowser(browserName) {
			if (arrayContains(AppUtils.OPEN_SOURCE_BROWSERS, browserName)) return true;
			if (arrayContains(AppUtils.CLOSED_SOURCE_BROWSERS, browserName)) return false;
			return null;
		}
		
		// determines if the browser is supported
		function isSupportedBrowser(browserInfo) {
			if (!browserInfo.windowCryptoExists) return false;
			if (browserInfo.name === "IE" && browserInfo.major < 11) return false;
			return true;
		}
	},
	
	/**
	 * Returns operating system info.
	 * 
	 * Requires lib/ua-parser.js to be loaded.
	 * 
	 * @returns
	 * 	{
	 * 		name: "...",
	 * 		version: "...",
	 * 		isOpenSource: true|false
	 * 	}
	 */
	getOsInfo: function() {
		
		// parse browser user agent
		var parser = new UAParser();
		var result = parser.getResult();
		
		// build and return response
		var info = {};
		info.name = result.os.name;
		info.version = result.os.version;
		info.isOpenSource = isOpenSourceOs(info);
		return info;
		
		function isOpenSourceOs(osInfo) {
			if (arrayContains(AppUtils.OPEN_SOURCE_OPERATING_SYSTEMS, osInfo.name)) return true;
			if (arrayContains(AppUtils.CLOSED_SOURCE_OPERATING_SYSTEMS, osInfo.name)) return false;
			return null;
		}
	},

	/**
	 * Determines if this app is running locally or from a remote domain.
	 * 
	 * @returns true if running local, false otherwise
	 */
	isLocal: function() {
		return window.location.href.indexOf("file://") > -1;
	},
	
	/**
	 * Determines if this app has an internet connection.
	 * 
	 * @param isOnline(true|false) is invoked when connectivity is determined
	 * @returns true if this app is online, false otherwise
	 */
	isOnline: function(isOnline) {
		isImageAccessible(AppUtils.ONLINE_IMAGE_URL, AppUtils.ONLINE_DETECTION_TIMEOUT, isOnline);
	},
	
	/**
	 * Gets all environment info that can be determined synchronously.
	 * 
	 * Requires lib/ua-parser.js to be loaded.
	 * 
	 * @returns info that can be acquired synchronously
	 */
	getEnvironmentSync: function() {		
		var info = {};
		info.browser = AppUtils.getBrowserInfo();
		info.os = AppUtils.getOsInfo();
		info.isLocal = AppUtils.isLocal();
		info.runtimeError = AppUtils.RUNTIME_ERROR;
		info.dependencyError = AppUtils.DEPENDENCY_ERROR;
		info.tabError = AppUtils.TAB_ERROR;
		if (AppUtils.MOCK_ENVIRONMENT_ENABLED) info = Object.assign(info, AppUtils.MOCK_ENVIRONMENT);	// merge mock environment
		info.checks = AppUtils.getEnvironmentChecks(info);
		return info;
	},
	
	/**
	 * Gets all environment info.
	 * 
	 * Requires lib/ua-parser.js to be loaded.
	 * 
	 * @param onDone(info) is asynchronously invoked when all info is retrieved
	 */
	getEnvironment: function(onDone) {
		AppUtils.isOnline(function(online) {
			var info = AppUtils.getEnvironmentSync();
			info.isOnline = online;
			if (AppUtils.MOCK_ENVIRONMENT_ENABLED) info = Object.assign(info, AppUtils.MOCK_ENVIRONMENT);	// merge mock environment
			info.checks = AppUtils.getEnvironmentChecks(info);
			if (onDone) onDone(info);
		});
	},
	
	/**
	 * Enumerates environment check codes.
	 */
	EnvironmentCode: {
		BROWSER: "BROWSER",
		OPERATING_SYSTEM: "OPERATING_SYSTEM",
		INTERNET: "INTERNET",
		IS_LOCAL: "IS_LOCAL",
		RUNTIME_ERROR: "RUNTIME_ERROR",
		OPEN_SOURCE: "OPEN_SOURCE",
	},
	
	/**
	 * Interprets the given environment info and returns pass/fail/warn checks.
	 * 
	 * @param info is output from getEnvironmentInfo()
	 * @returns [{state: "pass|fail|warn", code: "..."}, ...]
	 */
	getEnvironmentChecks: function(info) {
		var checks = [];
		
		// check if browser supported
		if (info.browser && !info.browser.isSupported) checks.push({state: "fail", code: AppUtils.EnvironmentCode.BROWSER});
		
		// check if runtime error
		if (info.runtimeError) checks.push({state: "fail", code: AppUtils.EnvironmentCode.RUNTIME_ERROR});
		
		// check if dependency error
		if (info.dependencyError) checks.push({state: "fail", code: AppUtils.EnvironmentCode.INTERNET});
		
		// check if tab error
		if (info.tabError) checks.push({state: "fail", code: AppUtils.EnvironmentCode.BROWSER});
		
		// check if remote and not online
		var internetRequiredError = false;
		if (isInitialized(info.isOnline)) {
			if (!info.isLocal && !info.isOnline && AppUtils.NO_INTERNET_CAN_BE_ERROR) {
				internetRequiredError = true;
				checks.push({state: "fail", code: AppUtils.EnvironmentCode.INTERNET});
			}
		}
		
		// check if online
		if (!internetRequiredError && !info.dependencyError && isInitialized(info.isOnline)) {
			if (!info.isOnline) checks.push({state: "pass", code: AppUtils.EnvironmentCode.INTERNET});
			else checks.push({state: "warn", code: AppUtils.EnvironmentCode.INTERNET});
		}
		
		// check if local
		if (isInitialized(info.isLocal)) {
			if (info.isLocal) checks.push({state: "pass", code: AppUtils.EnvironmentCode.IS_LOCAL});
			else checks.push({state: "warn", code: AppUtils.EnvironmentCode.IS_LOCAL});
		}
		
		// check open source browser
		if (info.browser && info.browser.isSupported) {
			if (info.browser.isOpenSource) checks.push({state: "pass", code: AppUtils.EnvironmentCode.BROWSER});
			else checks.push({state: "warn", code: AppUtils.EnvironmentCode.BROWSER});
		}
		
		// check open source os
		if (isInitialized(info.os)) {
			if (info.os.isOpenSource) checks.push({state: "pass", code: AppUtils.EnvironmentCode.OPERATING_SYSTEM});
			else checks.push({state: "warn", code: AppUtils.EnvironmentCode.OPERATING_SYSTEM});
		}
		
		return checks;
	},
	
	/**
	 * Sets the cached environment info.
	 * 
	 * @param environment is the cached environment info to set
	 */
	setCachedEnvironment: function(environment) {
		AppUtils.environment = environment;
	},
	
	/**
	 * Returns the cached environment info.
	 */
	getCachedEnvironment: function() {
		return AppUtils.environment;
	},
	
	/**
	 * Polls environment info and notifies listeners on loop.
	 * 
	 * Requires lib/ua-parser.js to be loaded.
	 * 
	 * @param initialEnvironmentInfo is initial environment info to notify listeners
	 */
	pollEnvironment: function(initialEnvironmentInfo) {
		
		// notify listeners of initial environment info
		if (initialEnvironmentInfo) setEnvironmentInfo(initialEnvironmentInfo);
		
		// refresh environment info on loop
		refreshEnvironmentInfo();
		function refreshEnvironmentInfo() {
			AppUtils.getEnvironment(function(info) {
				setEnvironmentInfo(info);
			});
			setTimeout(refreshEnvironmentInfo, AppUtils.ENVIRONMENT_REFRESH_RATE);
		}
		
		function setEnvironmentInfo(info) {
			AppUtils.environment = info;
			AppUtils.notifyEnvironmentListeners(info);
		}
	},
	
	/**
	 * Registers an environment listener to be notified when environment info is updated.
	 * 
	 * Synchronously calls the listener with the last known environment info.
	 * 
	 * @param listener(info) will be invoked as environment info is updated
	 */
	addEnvironmentListener: function(listener) {
		assertInitialized(listener);
		if (!AppUtils.environmentListeners) AppUtils.environmentListeners = [];
		AppUtils.environmentListeners.push(listener);
		if (AppUtils.environment) listener(AppUtils.environment);
	},
	
	/**
	 * Notifies all registered environment listeners of updated environment info.
	 * 
	 * @param info is the environment info to notify listeners of
	 */
	notifyEnvironmentListeners: function(info) {
		if (!AppUtils.environmentListeners) return;
		for (var i = 0; i < AppUtils.environmentListeners.length; i++) {
			var listener = AppUtils.environmentListeners[i];
			if (listener) listener(info);
		}
	},
	
	/**
	 * Determines if the given environment info has the given state.
	 * 
	 * @param info is environment info with state
	 * @param state is the state to check the environment info for
	 * @returns true if the environment info has the given state, false otherwise
	 */
	hasEnvironmentState: function(state) {
		for (var i = 0; i < AppUtils.environment.checks.length; i++) {
			if (AppUtils.environment.checks[i].state === state) return true;
		}
		return false;
	},
	
	/**
	 * Set an unexpected runtime error and notifies all listeners of the updated environment.
	 */
	setRuntimeError: function(err) {
		if (!AppUtils.environment) AppUtils.environment = {};
		AppUtils.RUNTIME_ERROR = err;
		AppUtils.environment.runtimeError = err;
		AppUtils.environment.checks = AppUtils.getEnvironmentChecks(AppUtils.environment);
		AppUtils.notifyEnvironmentListeners(AppUtils.environment);
	},
	
	/**
	 * Sets an error if cannot fetch dependencies.
	 * 
	 * @param bool specifies if the dependency error is enabled or disabled
	 */
	setDependencyError: function(bool) {
		if (!AppUtils.environment) AppUtils.environment = {};
		AppUtils.DEPENDENCY_ERROR = bool;
		AppUtils.environment.dependencyError = bool;
		AppUtils.environment.checks = AppUtils.getEnvironmentChecks(AppUtils.environment);
		AppUtils.notifyEnvironmentListeners(AppUtils.environment);
	},
	
	/**
	 * Sets an error if a new tab cannot be opened.
	 */
	setTabError: function(bool) {
		if (!AppUtils.environment) AppUtils.environment = {};
		AppUtils.TAB_ERROR = bool;
		AppUtils.environment.tabError = bool;
		AppUtils.environment.checks = AppUtils.getEnvironmentChecks(AppUtils.environment);
		AppUtils.notifyEnvironmentListeners(AppUtils.environment);
	},
	
		/**
	 * Sets if lack of internet can be a critical error if the site is running remotely.
	 * 
	 * After dependencies are done loading in the export page, internet is no longer required
	 * even if the site is running remotely, so this method stops treating internet disconnection
	 * as critical.
	 * 
	 * @param bool specifies if no internet can be a critical error
	 */
	setNoInternetCanBeError: function(bool) {
		AppUtils.NO_INTERNET_CAN_BE_ERROR = bool;
	},
	
	/**
	 * Determines if the given string is BIP38.
	 * 
	 * @param str is the string to test
	 * @returns true if the string is BIP38 format, false otherwise
	 */
	isBIP38Format: function(str) {
		if (!isString(str)) return false;
		if (!isInitialized(str)) return false;
		return (/^6P[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{56}$/.test(str));
	},
	
	/**
	 * Converts the given string to another base.
	 * 
	 * @param srcBase is the source base to convert from
	 * @param tgtBase is the target base to convert to
	 * @param str is the string to convert
	 */
	toBase: function(srcBase, tgtBase, str) {
		assertNumber(srcBase);
		assertNumber(tgtBase);
		assertInitialized(str);
		if (srcBase === 16) {
			assertTrue(str.length % 2 === 0, "Cannot convert non-even length hex since it cannot be converted back");
			if (tgtBase === 58) {
				return Bitcoin.Base58.encode(Crypto.util.hexToBytes(str));
			} else if (tgtBase === 64) {
				return CryptoJS.enc.Hex.parse(str).toString(CryptoJS.enc.Base64).toString(CryptoJS.enc.Utf8);
			} else throw new Error("Unsupported target base: " + tgtBase);
		} else if (srcBase === 58) {
			if (tgtBase === 16) {
				return Crypto.util.bytesToHex(Bitcoin.Base58.decode(str));
			} else if (tgtBase === 64) {
				return AppUtils.toBase(16, 64, AppUtils.toBase(58, 16, str));
			} else throw new Error("Unsupported target base: " + tgtBase);
		} else if (srcBase === 64) {
			if (tgtBase === 16) {
				return CryptoJS.enc.Base64.parse(str).toString(CryptoJS.enc.Hex);
			} else if (tgtBase === 58) {
				return AppUtils.toBase(16, 58, AppUtils.toBase(64, 16, str));
			} else throw new Error("Unsupported target base: " + tgtBase);
		} else throw new Error("Unsupported source base: " + srcBase);
	},
	
	/**
	 * Converts pieces to a downloadable blob and name.
	 * 
	 * @param pieces are the pieces to convert
	 * @param fileType specifies the file type to save (json, csv, or txt)
	 * @param onDone(err, blob, name) is invoked when done
	 */
	piecesToBlob: function(pieces, fileType, onDone) {
		
		// validate input
		assertArray(pieces);
		assertTrue(pieces.length > 0);
		assertObject(pieces[0], CryptoPiece);
		
		// handle single piece
		if (pieces.length === 1) {
			var commonPlugin = CryptoPiece.getCommonPlugin(pieces[0]);
			var commonTicker = commonPlugin ? commonPlugin.getTicker().toLowerCase() : "mix";
			var name = "cryptostorage_" + commonTicker + "_" + AppUtils.getTimestamp() + AppUtils.getExtension(fileType);
			var blob = new Blob([pieces[0].toString(fileType)], {type: "text/plain;charset=utf-8"});
			if (onDone) onDone(null, blob, name);
		}
		
		// handle multiple pieces
		else {
			
			// get common ticker
			var commonPlugin = CryptoPiece.getCommonPlugin(pieces[0]);
			var ticker = commonPlugin ? commonPlugin.getTicker().toLowerCase() : "mix";
			
			// build names for pieces
			var pieceNames = [];
			for (var i = 0; i < pieces.length; i++) {
				var name = "cryptostorage_" + ticker + (pieces[i].getPieceNum() ? "_piece_" + pieces[i].getPieceNum() : "");
				pieceNames.push(getNextAvailableName(pieceNames, name));
			}

			// prepare zip
			var zip = JSZip();
			for (var i = 0; i < pieces.length; i++) {
				var name = pieceNames[i];
				zip.file(name + AppUtils.getExtension(fileType), pieces[i].toString(fileType));
			}
			
			// create zip
			zip.generateAsync({type:"blob"}).then(function(blob) {
				onDone(null, blob, "cryptostorage_" + ticker + "_" + AppUtils.getTimestamp() + ".zip");
			});
			
			/**
			 * Gets the next available name, adding a postfix to prevent duplicates.
			 * 
			 * @param names is the list of existing names
			 * @param name is the desired name to add
			 * @returns a name which will be postfixed if necessary to prevent duplicates
			 */
			function getNextAvailableName(names, name) {
				if (!arrayContains(names, name)) return name;
				var idx = 2;
				while (true) {
					var postfixedName = name + "_" + idx;
					if (!arrayContains(names, postfixedName)) return postfixedName;
					idx++;
				}
			}
		}
	},
	
	/**
	 * Extracts named pieces from the given file (json, csv, txt, or zip).
	 * 
	 * Throws an error if given invalid non-zip file.  Otherwise returns whatever pieces can be extracted.
	 * 
	 * @param file is the file to get named pieces from
	 * @param onDone(err, namedPieces) is invoked when extraction is done
	 */
	fileToNamedPieces: function(file, onDone) {
		
		// file reader to get data when ready
		var reader = new FileReader();
		reader.onload = function() {
			var data = reader.result;
			
			// read zip
			if (isZipFile(file)) {
				zipToNamedPieces(data, function(err, namedPieces) {
					if (err) onDone(err);
					else onDone(null, namedPieces);
				});
			}	
			
			// read json, csv, or txt
			else {
				var piece;
				try {
					if (isJsonFile(file)) piece = new CryptoPiece({json: data});
					else if (isCsvFile(file)) piece = new CryptoPiece({csv: data});
					else if (isTxtFile(file)) piece = new CryptoPiece({txt: data});
					else throw new Error("Unrecognized file type: " + file.name);
				} catch (err) {
					onDone(err);
					return;
				}
				assertInitialized(piece);
				onDone(null, [{name: file.name, piece: piece}]);
			}
		}
		
		// read file
		if (isJsonFile(file) || isCsvFile(file) || isTxtFile(file)) reader.readAsText(file);
		else if (isZipFile(file)) reader.readAsArrayBuffer(file);
		else onDone(new Error(file.name + " is not a json, csv, txt, or zip file"));
		
		/**
		 * Extracts pieces from a zip blob.
		 * 
		 * @param blob is the raw zip data
		 * @param onDone(err, namedPieces) is called when all pieces have been extracted
		 */
		function zipToNamedPieces(blob, onDone) {
			
			// load zip
			JSZip.loadAsync(blob).then(function(zip) {
				
				// collect callback functions to get pieces
				var funcs = [];
				zip.forEach(function(path, zipObject) {
					if (path.startsWith("_")) return;
					if (path.endsWith(".json") || path.endsWith(".csv") || path.endsWith(".txt")) {
						funcs.push(getPieceCallbackFunction(zipObject));
					} else if (path.endsWith(".zip")) {
						funcs.push(getZipCallbackFunction(zipObject));
					}
				});
				
				// invoke callback functions to get named pieces
				async.parallel(funcs, function(err, results) {
					if (err) {
						onDone(err);
						return;
					}
					var namedPieces = [];
					for (var i = 0; i < results.length; i++) {
						var result = results[i];
						if (result === null) continue;
						else if (isArray(result)) {
							for (var j = 0; j < result.length; j++) namedPieces.push(result[j]);
						}
						else namedPieces.push(result);
					}
					onDone(null, namedPieces);
				});
			});
			
			function getPieceCallbackFunction(zipObject) {
				return function(onDone) {
					zipObject.async("string").then(function(str) {
						var piece = null;
						try {
							if (zipObject.name.endsWith(".json")) piece = new CryptoPiece({json: str});
							else if (zipObject.name.endsWith(".csv")) piece = new CryptoPiece({csv: str});
							else if (zipObject.name.endsWith(".txt")) piece = new CryptoPiece({txt: str});
							else throw new Error("Unrecognized file type: " + zipObject.name);
						} catch (err) {
							console.log(err);	// simply skip this file
						}
						onDone(null, piece ? {name: zipObject.name, piece: piece} : null);
					});
				}
			}
			
			function getZipCallbackFunction(zipObject) {
				return function(onDone) {
					zipObject.async("blob").then(function(blob) {
						zipToNamedPieces(blob, onDone);
					});
				}
			}
		}
	}
}
