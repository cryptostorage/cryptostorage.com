var RUN_TESTS = false;
var DEBUG = true;
var DELETE_WINDOW_CRYPTO = false;
var VERIFY_ENCRYPTION = false;
var ENCRYPTION_THREADS = 1;
var CRYPTOSTORAGE_URL = "http://cryptostorage.com";	// TODO: change to https
var ONLINE_IMAGE_URL = CRYPTOSTORAGE_URL + "/favicon.ico";
var APP_DEPENDENCIES = ["lib/async.js", "lib/qrcode.js", "lib/jszip.js", "lib/crypto-js.js", "lib/bitaddress.js", "lib/progressbar.js", "lib/jquery.ddslick.js", "lib/ua-parser.js"];
var ENVIRONMENT_REFRESH_RATE = 3000;	// environment refresh rate in milliseconds

// classify operating systems and browsers as open or closed source
var OPEN_SOURCE_BROWSERS = [
	"Firefox", "Chromium", "Tizen", "Epiphany", "K-Meleon", "SeaMonkey", "SlimerJS", "Arora", "Breach", "Camino",
	"Electron", "Fennec", "Konqueror", "Midori", "PaleMoon", "Rekonq", "Sunrise", "Waterfox", "Amaya", "Bowser",
	"Camino",
];
var CLOSED_SOURCE_BROWSERS = [
	"Chrome", "Chrome WebView", "Chrome Mobile", "Safari", "Opera", "Opera Mini", "Samsung Internet for Android",
	"Samsung Internet", "Opera Coast", "Yandex Browser", "UC Browser", "Maxthon", "Puffin", "Sleipnir",
	"Windows Phone", "Internet Explorer", "Microsoft Edge", "IE", "Vivaldi", "Sailfish", "Amazon Silk", "Silk",
	"PhantomJS", "BlackBerry", "WebOS", "Bada", "Android", "iPhone", "iPad", "iPod", "Googlebot", "Adobe AIR", "Avant",
	"Avant Browser", "Flock", "Galeon", "GreenBrowser", "iCab", "Lunascape", "Maxthon", "Nook Browser", "Raven",
	"RockMelt", "SlimBrowser", "SRWare Iron", "Swiftfox", "WebPositive", "Android Browser", "Baidu", "Blazer",
	"Comodo Dragon", "Dolphin", "Edge", "iCab", "IE Mobile", "IEMobile", "Kindle", "WeChat", "Yandex"
];
var OPEN_SOURCE_OPERATING_SYSTEMS = [
	"Linux", "CentOS", "Debian", "Fedora", "FreeBSD", "Gentoo", "Haiku", "Kubuntu", "Linux Mint", "Mint",
	"OpenBSD", "RedHat", "Red Hat", "SuSE", "Ubuntu", "Xubuntu", "Symbian OS", "webOS", "webOS ", "Tizen",
	"Chromium OS", "Contiki", "DragonFly", "GNU", "Joli", "Mageia", "MeeGo", "Minix", "NetBSD", "PCLinuxOS",
	"Plan9", "VectorLinux", "Zenwalk"
];
var CLOSED_SOURCE_OPERATING_SYSTEMS = [
	"Windows Phone", "Android", "Chrome OS", "Cygwin", "hpwOS", "Tablet OS", "Mac OS", "Mac OS X", "Macintosh", "Mac", "iOS",
	"Windows 98;", "Windows 98", "Windows", "Windows ", "Windows Phone", "Windows Mobile", "AIX", "Amiga OS", "Bada",
	"BeOS", "BlackBerry", "Hurd", "Linpus", "Mandriva", "Morph OS", "OpenVMS", "OS/2", "QNX", "RIM Tablet OS",
	"Sailfish", "Series40", "Solaris", "Symbian", "WebOS"
];

// convert to lowercase
OPEN_SOURCE_BROWSERS = arrToLowerCase(OPEN_SOURCE_BROWSERS);
CLOSED_SOURCE_BROWSERS = arrToLowerCase(CLOSED_SOURCE_BROWSERS);
OPEN_SOURCE_OPERATING_SYSTEMS = arrToLowerCase(OPEN_SOURCE_OPERATING_SYSTEMS);
CLOSED_SOURCE_OPERATING_SYSTEMS = arrToLowerCase(CLOSED_SOURCE_OPERATING_SYSTEMS);