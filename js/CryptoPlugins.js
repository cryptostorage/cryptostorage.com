/**
 * Base plugin that specific cryptocurrencies must implement.
 */
function CryptoPlugin() { }

/**
 * Returns the name.
 */
CryptoPlugin.prototype.getName = function() { throw new Error("Subclass must implement"); }

/**
 * Returns the ticker symbol.
 */
CryptoPlugin.prototype.getTicker = function() { throw new Error("Subclass must implement"); }

/**
 * Returns the logo.
 */
CryptoPlugin.prototype.getLogo = function() { throw new Error("Subclass must implement"); }

/**
 * Returns an array of dependency paths for the plugin.
 */
CryptoPlugin.prototype.getDependencies = function() { throw new Error("Subclass must implement"); }

/**
 * Returns the donation address associated with the currency.
 */
CryptoPlugin.prototype.getDonationAddress = function() { throw new Error("Subclass must implement"); }

/**
 * Returns the supported encryption schemes.  All support CryptoJS by default.
 */
CryptoPlugin.prototype.getEncryptionSchemes = function() { return [CryptoUtils.EncryptionScheme.CRYPTOJS]; }

/**
 * Encrypts the given key with the given scheme and passphrase.  Invokes onDone(err, key) when done.
 */
CryptoPlugin.prototype.encrypt = function(scheme, key, passphrase, onDone) {
	CryptoUtils.encryptKey(key, scheme, passphrase, function(err, encryptedKey) {
		if (err) onDone(err);
		else onDone(null, encryptedKey);
	});
}

/**
 * Decrypts the given key with the given passphrase.  Invokes onDone(err, key) when done.
 */
CryptoPlugin.prototype.decrypt = function(key, passphrase, onDone) {
	CryptoUtils.decryptKey(key, passphrase, function(err, decryptedKey) {
		if (err) onDone(err);
		else onDone(null, decryptedKey);
	});
}

/**
 * Returns the given key's private key split into pieces.
 * 
 * @param key is the key to split into pieces
 * @param numPieces is the number of pieces to split the key into
 * @param minPieces is the minimum pieces to reconstitute the key
 * @returns string[] are the split pieces
 */
CryptoPlugin.prototype.split = function(key, numPieces, minPieces) {
	assertTrue(isObject(key, 'CryptoKey'));
	assertTrue(numPieces >= 2);
	assertTrue(minPieces >= 2);

	// split key into shares
	let shares = secrets.share(key.getHex(), numPieces, minPieces).map(ninja.wallets.splitwallet.hexToBytes).map(Bitcoin.Base58.encode);

	// append minimum pieces prefix so insufficient pieces cannot create wrong key (cryptostorage convention)
	let prefix = minPieces + 'c';
	for (let i = 0; i < shares.length; i++) {
		shares[i] = prefix + shares[i];
	}
	return shares;
}

/**
 * Combines the given shares to build a key.
 * 
 * @param shares are shares to combine
 * @return CryptoKey is the key built by combining the shares
 */
CryptoPlugin.prototype.combine = function(shares) {
	assertArray(shares);
	assertTrue(shares.length > 0);
	
	// get minimum shares and shares without 'XXXc' prefix
	let minShares;
	let nonPrefixedShares = [];
	for (let i = 0; i < shares.length; i++) {
		let share = shares[i];
		if (!CryptoUtils.isPossibleSplitPiece(share)) throw Error("Invalid split piece: " + share);
		let min = CryptoUtils.getMinPieces(share);
		if (!min) throw Error("Share is not prefixed with minimum pieces: " + share);
		if (!isInitialized(minShares)) minShares = min;
		else if (min !== minShares) throw Error("Shares have different minimum threshold prefixes: " + min + " vs " + minShares);
		nonPrefixedShares.push(share.substring(share.indexOf('c') + 1));
	}
	
	// ensure sufficient shares are provided
	if (shares.length < minShares) {
		let additional = minShares - shares.length;
		throw Error("Need " + additional + " additional " + (additional === 1 ? "piece" : "pieces") + " to recover private key");
	}
	
	// combine shares and create key
	return this.newKey(secrets.combine(nonPrefixedShares.map(Bitcoin.Base58.decode).map(Crypto.util.bytesToHex).map(ninja.wallets.splitwallet.stripLeadZeros)));
}

/**
 * Returns a new random key.
 */
CryptoPlugin.prototype.newKey = function(str) { throw new Error("Subclass must implement"); }

/**
 * Determines if the given string is a valid address.
 */
CryptoPlugin.prototype.isAddress = function(str) { throw new Error("Subclass must implement"); }

/**
 * Bitcoin plugin.
 */
function BitcoinPlugin() {
	this.getName = function() { return "Bitcoin"; }
	this.getTicker = function() { return "BTC" };
	this.getLogo = function() { return $("<img src='img/bitcoin.png'>"); }
	this.getDependencies = function() { return ["lib/bitaddress.js"]; }
	this.getDonationAddress = function() { return "1EU82y3CS2gUm41DyyRzKvWii8BbiRZDuf"; }
	this.getEncryptionSchemes = function() { return [CryptoUtils.EncryptionScheme.CRYPTOJS, CryptoUtils.EncryptionScheme.BIP38]; }
	this.newKey = function(str) {
		
		// create key if not given
		if (!str) str = new Bitcoin.ECKey().setCompressed(true).getBitcoinHexFormat();
		assertTrue(isString(str), "Argument to parse must be a string: " + str);
		let state = {};
		
		// unencrypted private key
		if (ninja.privateKey.isPrivateKey(str)) {
			let key = new Bitcoin.ECKey(str);
			key.setCompressed(true);
			state.hex = key.getBitcoinHexFormat();
			state.wif = key.getBitcoinWalletImportFormat();
			state.address = key.getBitcoinAddress();
			state.encryption = null;
			return new CryptoKey(this, state);
		}
		
		// wif bip38
		else if (ninja.privateKey.isBIP38Format(str)) {
			state.hex = Crypto.util.bytesToHex(Bitcoin.Base58.decode(str));
			state.wif = str;
			state.encryption = CryptoUtils.EncryptionScheme.BIP38;
			return new CryptoKey(this, state);
		}
		
		// wif cryptojs
		else if (CryptoUtils.isWifCryptoJs(str)) {
			state.hex = CryptoJS.enc.Base64.parse(str).toString(CryptoJS.enc.Hex);
			state.wif = str;
			state.encryption = CryptoUtils.EncryptionScheme.CRYPTOJS;
			return new CryptoKey(this, state);
		}
		
		// encrypted hex
		else if (isHex(str)) {
			
			// bip38
			if (str.length > 80 && str.length < 90) {
				state.hex = str;
				state.wif = Bitcoin.Base58.encode(Crypto.util.hexToBytes(str));
				state.encryption = CryptoUtils.EncryptionScheme.BIP38;
				return new CryptoKey(this, state);
			}
			
			// cryptojs
			else if (str.length > 100) {
				state.hex = str;
				state.wif = CryptoJS.enc.Hex.parse(str).toString(CryptoJS.enc.Base64).toString(CryptoJS.enc.Utf8);
				if (!state.wif.startsWith("U2")) throw new Error("Unrecognized private key: " + str);
				state.encryption = CryptoUtils.EncryptionScheme.CRYPTOJS;
				return new CryptoKey(this, state);
			}
		}
		
		// otherwise key is not recognized
		throw new Error("Unrecognized private key: " + str);		
	}
	this.isAddress = function(str) {
		try {
			Bitcoin.Address.decodeString(str);
			return true;
		} catch (err) {
			return false;
		}
	}
}
inheritsFrom(BitcoinPlugin, CryptoPlugin);

/**
 * Bitcoin cash plugin.
 */
function BitcoinCashPlugin() {
	BitcoinPlugin.call(this);
	this.getName = function() { return "Bitcoin Cash"; }
	this.getTicker = function() { return "BCH" };
	this.getLogo = function() { return $("<img src='img/bitcoin_cash.png'>"); }
	this.getDonationAddress = function() { return "1JWPv43TS2NodUAvnkXbY2nyLcHVGVZbLQ"; }
}
inheritsFrom(BitcoinCashPlugin, BitcoinPlugin);

/**
 * Ethereum plugin.
 */
function EthereumPlugin() {
	this.getName = function() { return "Ethereum"; }
	this.getTicker = function() { return "ETH" };
	this.getLogo = function() { return $("<img src='img/ethereum.png'>"); }
	this.getDependencies = function() { return ["lib/bitaddress.js", "lib/keythereum.js"]; }
	this.getDonationAddress = function() { return "0x154cbabfa4f26a2582bfe18335e652bc57d1bfe0"; }
	this.newKey = function(str) {
		
		// create key if not given
		if (!str) str = keythereum.create().privateKey.toString("hex");
		assertTrue(isString(str), "Argument to parse must be a string: " + str);
		let state = {};
		
		// handle hex
		if (isHex(str)) {
			
			// unencrypted
			if (str.length >= 63 && str.length <= 65) {
				state.hex = str;
				state.wif = str;	// TODO: different wif?
				state.address = keythereum.privateKeyToAddress(state.hex);
				state.encryption = null;
				return new CryptoKey(this, state);
			}
			
			// hex cryptojs
			else if (str.length > 100) {
				state.hex = str;
				state.wif = CryptoJS.enc.Hex.parse(str).toString(CryptoJS.enc.Base64).toString(CryptoJS.enc.Utf8);
				if (!state.wif.startsWith("U2")) throw new Error("Unrecognized private key: " + str);
				state.encryption = CryptoUtils.EncryptionScheme.CRYPTOJS;
				return new CryptoKey(this, state);
			}
		}
		
		// wif cryptojs
		else if (CryptoUtils.isWifCryptoJs(str)) {
			state.hex = CryptoJS.enc.Base64.parse(str).toString(CryptoJS.enc.Hex);
			state.wif = str;
			state.encryption = CryptoUtils.EncryptionScheme.CRYPTOJS;
			return new CryptoKey(this, state);
		}
		
		// otherwise key is not recognized
		throw new Error("Unrecognized private key: " + str);
	}
	this.isAddress = function(str) {
		return isAddress(str);
		
		// Credit: https://ethereum.stackexchange.com/questions/1374/how-can-i-check-if-an-ethereum-address-is-valid
		function isAddress(address) {
			if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
		        // check if it has the basic requirements of an address
		        return false;
		    } else if (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address)) {
		        // If it's all small caps or all all caps, return true
		        return true;
		    } else {
		        // Otherwise check each case
		        return isChecksumAddress(address);
		    }
		}
		function isChecksumAddress(address) {
		    // Check each case
		    address = address.replace('0x','');
		    var addressHash = sha3(address.toLowerCase());
		    for (var i = 0; i < 40; i++ ) {
		        // the nth letter should be uppercase if the nth digit of casemap is 1
		        if ((parseInt(addressHash[i], 16) > 7 && address[i].toUpperCase() !== address[i]) || (parseInt(addressHash[i], 16) <= 7 && address[i].toLowerCase() !== address[i])) {
		            return false;
		        }
		    }
		    return true;
		}
	}
}
inheritsFrom(EthereumPlugin, CryptoPlugin);

/**
 * Ethereum classic plugin.
 */
function EthereumClassicPlugin() {
	EthereumPlugin.call(this);
	this.getName = function() { return "Ethereum Classic"; }
	this.getTicker = function() { return "ETC" };
	this.getLogo = function() { return $("<img src='img/ethereum_classic.png'>"); }
	this.getDonationAddress = function() { return "0xf07d7959456130f9da4abb11a3738ed276ffa706"; }
}
inheritsFrom(EthereumClassicPlugin, EthereumPlugin);

/**
 * OmiseGo plugin.
 */
function OmiseGoPlugin() {
	EthereumPlugin.call(this);
	this.getName = function() { return "OmiseGo"; }
	this.getTicker = function() { return "OMG" };
	this.getLogo = function() { return $("<img src='img/omisego.png'>"); }
	this.getDonationAddress = function() { return "0x258f8cee334707e9fa969b87ae881b283523f426"; }
}
inheritsFrom(OmiseGoPlugin, EthereumPlugin);

/**
 * Litecoin plugin.
 */
function LitecoinPlugin() {
	this.getName = function() { return "Litecoin"; }
	this.getTicker = function() { return "LTC" };
	this.getLogo = function() { return $("<img src='img/litecoin.png'>"); }
	this.getDependencies = function() { return ["lib/bitaddress.js", "lib/litecore.js"]; }
	this.getDonationAddress = function() { return "LSreRDfwXtbWmmpm6ZxR7twYUenf5Lw2Hh"; }
	this.newKey = function(str) {
		
		// create key if not given
		if (!str) str = new litecore.PrivateKey().toString();		
		else assertTrue(isString(str), "Argument to parse must be a string: " + str);
		let state = {};
		
		// unencrypted
		if (str.length >= 52 && litecore.PrivateKey.isValid(str)) {	// TODO: litecore says 'ab' is valid ... ?
			let key = new litecore.PrivateKey(str);
			state.hex = key.toString();
			state.wif = key.toWIF();
			state.address = key.toAddress().toString();
			state.encryption = null;
			return new CryptoKey(this, state);
		}
		
		// hex cryptojs
		else if (isHex(str) && str.length > 100) {
			state.hex = str;
			state.wif = CryptoJS.enc.Hex.parse(str).toString(CryptoJS.enc.Base64).toString(CryptoJS.enc.Utf8);
			if (!state.wif.startsWith("U2")) throw new Error("Unrecognized private key: " + str);
			state.encryption = CryptoUtils.EncryptionScheme.CRYPTOJS;
			return new CryptoKey(this, state);
		}
		
		// wif cryptojs
		else if (CryptoUtils.isWifCryptoJs(str)) {
			state.hex = CryptoJS.enc.Base64.parse(str).toString(CryptoJS.enc.Hex);
			state.wif = str;
			state.encryption = CryptoUtils.EncryptionScheme.CRYPTOJS;
			return new CryptoKey(this, state);
		}
		
		// otherwise key is not recognized
		throw new Error("Unrecognized private key: " + str);
	}
	this.isAddress = function(str) {
		return litecore.Address.isValid(str);
	}
}
inheritsFrom(LitecoinPlugin, CryptoPlugin);

/**
 * Dash plugin.
 */
function DashPlugin() {
	this.getName = function() { return "Dash"; }
	this.getTicker = function() { return "DASH" };
	this.getLogo = function() { return $("<img src='img/dash.png'>"); }
	this.getDependencies = function() { return ["lib/crypto-js.js", "lib/bitaddress.js", "lib/dashcore.js"]; }
	this.getDonationAddress = function() { return "XjgcAdK2sivWs8nTUunbWSy1VwxgqtW3WM"; }
	this.newKey = function(str) {
		
		// create key if not given
		if (!str) str = new dashcore.PrivateKey().toString();		
		else assertTrue(isString(str), "Argument to parse must be a string: " + str);
		let state = {};
		
		// unencrypted
		if (str.length >= 52 && dashcore.PrivateKey.isValid(str)) {	// TODO: dashcore says 'ab' is valid ... ?
			let key = new dashcore.PrivateKey(str);
			state.hex = key.toString();
			state.wif = key.toWIF();
			state.address = key.toAddress().toString();
			state.encryption = null;
			return new CryptoKey(this, state);
		}
		
		// hex cryptojs
		else if (isHex(str) && str.length > 100) {
			state.hex = str;
			state.wif = CryptoJS.enc.Hex.parse(str).toString(CryptoJS.enc.Base64).toString(CryptoJS.enc.Utf8);
			if (!state.wif.startsWith("U2")) throw new Error("Unrecognized private key: " + str);
			state.encryption = CryptoUtils.EncryptionScheme.CRYPTOJS;
			return new CryptoKey(this, state);
		}
		
		// wif cryptojs
		else if (CryptoUtils.isWifCryptoJs(str)) {
			state.hex = CryptoJS.enc.Base64.parse(str).toString(CryptoJS.enc.Hex);
			state.wif = str;
			state.encryption = CryptoUtils.EncryptionScheme.CRYPTOJS;
			return new CryptoKey(this, state);
		}
		
		// otherwise key is not recognized
		throw new Error("Unrecognized private key: " + str);
	}
	this.isAddress = function(str) {
		return dashcore.Address.isValid(str);
	}
}
inheritsFrom(DashPlugin, CryptoPlugin);

/**
 * Monero plugin.
 */
function MoneroPlugin() {
	this.getName = function() { return "Monero"; }
	this.getTicker = function() { return "XMR" };
	this.getLogo = function() { return $("<img src='img/monero.png'>"); }
	this.getDependencies = function() { return ["lib/bitaddress.js", "lib/moneroaddress.js"]; }
	this.getDonationAddress = function() { return "42WH62SCBC7MpNdb1ABgUUeSZaETtX5hujJgjJ8LEimC9m13XyyiwCb47nA17VbwGBiYuU6Jo1fCbET5FNpqv49ySNubKMf"; }
	this.newKey = function(str) {
		
		// create key if not given
		if (!str) str = cnUtil.sc_reduce32(cnUtil.rand_32());
		assertTrue(isString(str), "Argument to parse must be a string: " + str);
		let state = {};
		
		// handle hex
		if (isHex(str)) {
			
			// unencrypted
			if (str.length >= 63 && str.length <= 65) {
				let address = cnUtil.create_address(str);
				if (!cnUtil.valid_keys(address.view.pub, address.view.sec, address.spend.pub, address.spend.sec)) {
					throw new Error("Invalid address keys derived from hex key");
				}
				state.hex = str;
				state.wif = mn_encode(state.hex, 'english');
				state.address = address.public_addr;
				state.encryption = null;
				return new CryptoKey(this, state);
			}
			
			// hex cryptojs
			if (str.length > 100) {
				state.hex = str;
				state.wif = CryptoJS.enc.Hex.parse(str).toString(CryptoJS.enc.Base64).toString(CryptoJS.enc.Utf8);
				if (!state.wif.startsWith("U2")) throw new Error("Unrecognized private key: " + str);
				state.encryption = CryptoUtils.EncryptionScheme.CRYPTOJS;
				return new CryptoKey(this, state);
			}
		}
		
		// wif cryptojs
		if (CryptoUtils.isWifCryptoJs(str)) {
			state.hex = CryptoJS.enc.Base64.parse(str).toString(CryptoJS.enc.Hex);
			state.wif = str;
			state.encryption = CryptoUtils.EncryptionScheme.CRYPTOJS;
			return new CryptoKey(this, state);
		}
		
		// wif unencrypted
		if (str.indexOf(' ') !== -1) {
			state.hex = mn_decode(str);
			state.wif = str;
			state.address = cnUtil.create_address(state.hex).public_addr;
			state.encryption = null;
			return new CryptoKey(this, state);
		}
		
		// otherwise key is not recognized
		throw new Error("Unrecognized private key: " + str);
	}
	this.isAddress = function(str) {
		if (!isString(str)) return false;
		try {
			cnUtil.decode_address(str);
			return true;
		} catch (err) {
			return false;
		}
	}
}
inheritsFrom(MoneroPlugin, CryptoPlugin);