-
/*
Copyright (c) 2011 Stefan Thomas

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

//https://raw.github.com/bitcoinjs/bitcoinjs-lib/1a7fc9d063f864058809d06ef4542af40be3558f/src/bitcoin.js
(function(exports) {
    var Bitcoin = exports;
})(
    'object' === typeof module ? module.exports : (window.Bitcoin = {})
);

//https://raw.github.com/bitcoinjs/bitcoinjs-lib/c952aaeb3ee472e3776655b8ea07299ebed702c7/src/base58.js
(function(Bitcoin) {
    Bitcoin.Base58 = {
        alphabet: "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
        validRegex: /^[1-9A-HJ-NP-Za-km-z]+$/,
        base: BigInteger.valueOf(58),

        /**
         * Convert a byte array to a base58-encoded string.
         *
         * Written by Mike Hearn for BitcoinJ.
         *   Copyright (c) 2011 Google Inc.
         *
         * Ported to JavaScript by Stefan Thomas.
         */
        encode: function(input) {
            var bi = BigInteger.fromByteArrayUnsigned(input);
            var chars = [];

            while (bi.compareTo(B58.base) >= 0) {
                var mod = bi.mod(B58.base);
                chars.unshift(B58.alphabet[mod.intValue()]);
                bi = bi.subtract(mod).divide(B58.base);
            }
            chars.unshift(B58.alphabet[bi.intValue()]);

            // Convert leading zeros too.
            for (var i = 0; i < input.length; i++) {
                if (input[i] == 0x00) {
                    chars.unshift(B58.alphabet[0]);
                } else break;
            }

            return chars.join('');
        },

        /**
         * Convert a base58-encoded string to a byte array.
         *
         * Written by Mike Hearn for BitcoinJ.
         *   Copyright (c) 2011 Google Inc.
         *
         * Ported to JavaScript by Stefan Thomas.
         */
        decode: function(input) {
            var bi = BigInteger.valueOf(0);
            var leadingZerosNum = 0;
            for (var i = input.length - 1; i >= 0; i--) {
                var alphaIndex = B58.alphabet.indexOf(input[i]);
                if (alphaIndex < 0) {
                    throw "Invalid character";
                }
                bi = bi.add(BigInteger.valueOf(alphaIndex)
                    .multiply(B58.base.pow(input.length - 1 - i)));

                // This counts leading zero bytes
                if (input[i] == "1") leadingZerosNum++;
                else leadingZerosNum = 0;
            }
            var bytes = bi.toByteArrayUnsigned();

            // Add leading zeros
            while (leadingZerosNum-- > 0) bytes.unshift(0);

            return bytes;
        }
    };

    var B58 = Bitcoin.Base58;
})(
    'undefined' != typeof Bitcoin ? Bitcoin : module.exports
);

//https://raw.github.com/bitcoinjs/bitcoinjs-lib/09e8c6e184d6501a0c2c59d73ca64db5c0d3eb95/src/address.js
Bitcoin.Address = function(bytes) {
    if ("string" == typeof bytes) {
        bytes = Bitcoin.Address.decodeString(bytes);
    }
    this.hash = bytes;
    this.version = Bitcoin.Address.networkVersion;
};

Bitcoin.Address.networkVersion = window.networkVersion; // multiple coin support

/**
 * Serialize this object as a standard Bitcoin address.
 *
 * Returns the address as a base58-encoded string in the standardized format.
 */
Bitcoin.Address.prototype.toString = function() {
    // Get a copy of the hash
    var hash = this.hash.slice(0);

    // Version
    hash.unshift(this.version);
    var checksum = Crypto.SHA256(Crypto.SHA256(hash, {
        asBytes: true
    }), {
        asBytes: true
    });
    var bytes = hash.concat(checksum.slice(0, 4));
    return Bitcoin.Base58.encode(bytes);
};

Bitcoin.Address.prototype.getHashBase64 = function() {
    return Crypto.util.bytesToBase64(this.hash);
};

/**
 * Parse a Bitcoin address contained in a string.
 */
Bitcoin.Address.decodeString = function(string) {
    var bytes = Bitcoin.Base58.decode(string);
    var hash = bytes.slice(0, 21);
    var checksum = Crypto.SHA256(Crypto.SHA256(hash, {
        asBytes: true
    }), {
        asBytes: true
    });

    if (checksum[0] != bytes[21] ||
        checksum[1] != bytes[22] ||
        checksum[2] != bytes[23] ||
        checksum[3] != bytes[24]) {
        throw "Checksum validation failed!";
    }

    var version = hash.shift();

    if (version != 0) {
        throw "Version " + version + " not supported!";
    }

    return hash;
};

//https://raw.github.com/bitcoinjs/bitcoinjs-lib/e90780d3d3b8fc0d027d2bcb38b80479902f223e/src/ecdsa.js
Bitcoin.ECDSA = (function() {
    var ecparams = EllipticCurve.getSECCurveByName("secp256k1");
    var rng = new SecureRandom();

    var P_OVER_FOUR = null;

    function implShamirsTrick(P, k, Q, l) {
        var m = Math.max(k.bitLength(), l.bitLength());
        var Z = P.add2D(Q);
        var R = P.curve.getInfinity();

        for (var i = m - 1; i >= 0; --i) {
            R = R.twice2D();

            R.z = BigInteger.ONE;

            if (k.testBit(i)) {
                if (l.testBit(i)) {
                    R = R.add2D(Z);
                } else {
                    R = R.add2D(P);
                }
            } else {
                if (l.testBit(i)) {
                    R = R.add2D(Q);
                }
            }
        }

        return R;
    };

    var ECDSA = {
        getBigRandom: function(limit) {
            return new BigInteger(limit.bitLength(), rng)
                .mod(limit.subtract(BigInteger.ONE))
                .add(BigInteger.ONE);
        },
        sign: function(hash, priv) {
            var d = priv;
            var n = ecparams.getN();
            var e = BigInteger.fromByteArrayUnsigned(hash);

            do {
                var k = ECDSA.getBigRandom(n);
                var G = ecparams.getG();
                var Q = G.multiply(k);
                var r = Q.getX().toBigInteger().mod(n);
            } while (r.compareTo(BigInteger.ZERO) <= 0);

            var s = k.modInverse(n).multiply(e.add(d.multiply(r))).mod(n);

            return ECDSA.serializeSig(r, s);
        },

        verify: function(hash, sig, pubkey) {
            var r, s;
            if (Bitcoin.Util.isArray(sig)) {
                var obj = ECDSA.parseSig(sig);
                r = obj.r;
                s = obj.s;
            } else if ("object" === typeof sig && sig.r && sig.s) {
                r = sig.r;
                s = sig.s;
            } else {
                throw "Invalid value for signature";
            }

            var Q;
            if (pubkey instanceof ec.PointFp) {
                Q = pubkey;
            } else if (Bitcoin.Util.isArray(pubkey)) {
                Q = EllipticCurve.PointFp.decodeFrom(ecparams.getCurve(), pubkey);
            } else {
                throw "Invalid format for pubkey value, must be byte array or ec.PointFp";
            }
            var e = BigInteger.fromByteArrayUnsigned(hash);

            return ECDSA.verifyRaw(e, r, s, Q);
        },

        verifyRaw: function(e, r, s, Q) {
            var n = ecparams.getN();
            var G = ecparams.getG();

            if (r.compareTo(BigInteger.ONE) < 0 ||
                r.compareTo(n) >= 0)
                return false;

            if (s.compareTo(BigInteger.ONE) < 0 ||
                s.compareTo(n) >= 0)
                return false;

            var c = s.modInverse(n);

            var u1 = e.multiply(c).mod(n);
            var u2 = r.multiply(c).mod(n);

            // TODO(!!!): For some reason Shamir's trick isn't working with
            // signed message verification!? Probably an implementation
            // error!
            //var point = implShamirsTrick(G, u1, Q, u2);
            var point = G.multiply(u1).add(Q.multiply(u2));

            var v = point.getX().toBigInteger().mod(n);

            return v.equals(r);
        },

        /**
         * Serialize a signature into DER format.
         *
         * Takes two BigIntegers representing r and s and returns a byte array.
         */
        serializeSig: function(r, s) {
            var rBa = r.toByteArraySigned();
            var sBa = s.toByteArraySigned();

            var sequence = [];
            sequence.push(0x02); // INTEGER
            sequence.push(rBa.length);
            sequence = sequence.concat(rBa);

            sequence.push(0x02); // INTEGER
            sequence.push(sBa.length);
            sequence = sequence.concat(sBa);

            sequence.unshift(sequence.length);
            sequence.unshift(0x30); // SEQUENCE

            return sequence;
        },

        /**
         * Parses a byte array containing a DER-encoded signature.
         *
         * This function will return an object of the form:
         *
         * {
         *   r: BigInteger,
         *   s: BigInteger
         * }
         */
        parseSig: function(sig) {
            var cursor;
            if (sig[0] != 0x30)
                throw new Error("Signature not a valid DERSequence");

            cursor = 2;
            if (sig[cursor] != 0x02)
                throw new Error("First element in signature must be a DERInteger");;
            var rBa = sig.slice(cursor + 2, cursor + 2 + sig[cursor + 1]);

            cursor += 2 + sig[cursor + 1];
            if (sig[cursor] != 0x02)
                throw new Error("Second element in signature must be a DERInteger");
            var sBa = sig.slice(cursor + 2, cursor + 2 + sig[cursor + 1]);

            cursor += 2 + sig[cursor + 1];

            //if (cursor != sig.length)
            //	throw new Error("Extra bytes in signature");

            var r = BigInteger.fromByteArrayUnsigned(rBa);
            var s = BigInteger.fromByteArrayUnsigned(sBa);

            return {
                r: r,
                s: s
            };
        },

        parseSigCompact: function(sig) {
            if (sig.length !== 65) {
                throw "Signature has the wrong length";
            }

            // Signature is prefixed with a type byte storing three bits of
            // information.
            var i = sig[0] - 27;
            if (i < 0 || i > 7) {
                throw "Invalid signature type";
            }

            var n = ecparams.getN();
            var r = BigInteger.fromByteArrayUnsigned(sig.slice(1, 33)).mod(n);
            var s = BigInteger.fromByteArrayUnsigned(sig.slice(33, 65)).mod(n);

            return {
                r: r,
                s: s,
                i: i
            };
        },

        /**
         * Recover a public key from a signature.
         *
         * See SEC 1: Elliptic Curve Cryptography, section 4.1.6, "Public
         * Key Recovery Operation".
         *
         * http://www.secg.org/download/aid-780/sec1-v2.pdf
         */
        recoverPubKey: function(r, s, hash, i) {
            // The recovery parameter i has two bits.
            i = i & 3;

            // The less significant bit specifies whether the y coordinate
            // of the compressed point is even or not.
            var isYEven = i & 1;

            // The more significant bit specifies whether we should use the
            // first or second candidate key.
            var isSecondKey = i >> 1;

            var n = ecparams.getN();
            var G = ecparams.getG();
            var curve = ecparams.getCurve();
            var p = curve.getQ();
            var a = curve.getA().toBigInteger();
            var b = curve.getB().toBigInteger();

            // We precalculate (p + 1) / 4 where p is if the field order
            if (!P_OVER_FOUR) {
                P_OVER_FOUR = p.add(BigInteger.ONE).divide(BigInteger.valueOf(4));
            }

            // 1.1 Compute x
            var x = isSecondKey ? r.add(n) : r;

            // 1.3 Convert x to point
            var alpha = x.multiply(x).multiply(x).add(a.multiply(x)).add(b).mod(p);
            var beta = alpha.modPow(P_OVER_FOUR, p);

            var xorOdd = beta.isEven() ? (i % 2) : ((i + 1) % 2);
            // If beta is even, but y isn't or vice versa, then convert it,
            // otherwise we're done and y == beta.
            var y = (beta.isEven() ? !isYEven : isYEven) ? beta : p.subtract(beta);

            // 1.4 Check that nR is at infinity
            var R = new EllipticCurve.PointFp(curve,
                curve.fromBigInteger(x),
                curve.fromBigInteger(y));
            R.validate();

            // 1.5 Compute e from M
            var e = BigInteger.fromByteArrayUnsigned(hash);
            var eNeg = BigInteger.ZERO.subtract(e).mod(n);

            // 1.6 Compute Q = r^-1 (sR - eG)
            var rInv = r.modInverse(n);
            var Q = implShamirsTrick(R, s, G, eNeg).multiply(rInv);

            Q.validate();
            if (!ECDSA.verifyRaw(e, r, s, Q)) {
                throw "Pubkey recovery unsuccessful";
            }

            var pubKey = new Bitcoin.ECKey();
            pubKey.pub = Q;
            return pubKey;
        },

        /**
         * Calculate pubkey extraction parameter.
         *
         * When extracting a pubkey from a signature, we have to
         * distinguish four different cases. Rather than putting this
         * burden on the verifier, Bitcoin includes a 2-bit value with the
         * signature.
         *
         * This function simply tries all four cases and returns the value
         * that resulted in a successful pubkey recovery.
         */
        calcPubkeyRecoveryParam: function(address, r, s, hash) {
            for (var i = 0; i < 4; i++) {
                try {
                    var pubkey = Bitcoin.ECDSA.recoverPubKey(r, s, hash, i);
                    if (pubkey.getBitcoinAddress().toString() == address) {
                        return i;
                    }
                } catch (e) {}
            }
            throw "Unable to find valid recovery factor";
        }
    };

    return ECDSA;
})();

//https://raw.github.com/pointbiz/bitcoinjs-lib/9b2f94a028a7bc9bed94e0722563e9ff1d8e8db8/src/eckey.js
Bitcoin.ECKey = (function() {
    var ECDSA = Bitcoin.ECDSA;
    var ecparams = EllipticCurve.getSECCurveByName("secp256k1");
    var rng = new SecureRandom();

    var ECKey = function(input) {
        if (!input) {
            // Generate new key
            var n = ecparams.getN();
            this.priv = ECDSA.getBigRandom(n);
        } else if (input instanceof BigInteger) {
            // Input is a private key value
            this.priv = input;
        } else if (Bitcoin.Util.isArray(input)) {
            // Prepend zero byte to prevent interpretation as negative integer
            this.priv = BigInteger.fromByteArrayUnsigned(input);
        } else if ("string" == typeof input) {
            var bytes = null;
            if (ECKey.isWalletImportFormat(input)) {
                bytes = ECKey.decodeWalletImportFormat(input);
            } else if (ECKey.isCompressedWalletImportFormat(input)) {
                bytes = ECKey.decodeCompressedWalletImportFormat(input);
                this.compressed = true;
            } else if (ECKey.isMiniFormat(input)) {
                bytes = Crypto.SHA256(input, {
                    asBytes: true
                });
            } else if (ECKey.isHexFormat(input)) {
                bytes = Crypto.util.hexToBytes(input);
            } else if (ECKey.isBase64Format(input)) {
                bytes = Crypto.util.base64ToBytes(input);
            }

            if (ECKey.isBase6Format(input)) {
                this.priv = new BigInteger(input, 6);
            } else if (bytes == null || bytes.length != 32) {
                this.priv = null;
            } else {
                // Prepend zero byte to prevent interpretation as negative integer
                this.priv = BigInteger.fromByteArrayUnsigned(bytes);
            }
        }

        this.compressed = (this.compressed == undefined) ? !!ECKey.compressByDefault : this.compressed;
    };

    ECKey.privateKeyPrefix = window.privateKeyPrefix;

    /**
     * Whether public keys should be returned compressed by default.
     */
    ECKey.compressByDefault = false;

    /**
     * Set whether the public key should be returned compressed or not.
     */
    ECKey.prototype.setCompressed = function(v) {
        this.compressed = !!v;
        if (this.pubPoint) this.pubPoint.compressed = this.compressed;
        return this;
    };

    /*
     * Return public key as a byte array in DER encoding
     */
    ECKey.prototype.getPub = function() {
        if (this.compressed) {
            if (this.pubComp) return this.pubComp;
            return this.pubComp = this.getPubPoint().getEncoded(1);
        } else {
            if (this.pubUncomp) return this.pubUncomp;
            return this.pubUncomp = this.getPubPoint().getEncoded(0);
        }
    };

    /**
     * Return public point as ECPoint object.
     */
    ECKey.prototype.getPubPoint = function() {
        if (!this.pubPoint) {
            this.pubPoint = ecparams.getG().multiply(this.priv);
            this.pubPoint.compressed = this.compressed;
        }
        return this.pubPoint;
    };

    ECKey.prototype.getPubKeyHex = function() {
        if (this.compressed) {
            if (this.pubKeyHexComp) return this.pubKeyHexComp;
            return this.pubKeyHexComp = Crypto.util.bytesToHex(this.getPub()).toString().toUpperCase();
        } else {
            if (this.pubKeyHexUncomp) return this.pubKeyHexUncomp;
            return this.pubKeyHexUncomp = Crypto.util.bytesToHex(this.getPub()).toString().toUpperCase();
        }
    };

    /**
     * Get the pubKeyHash for this key.
     *
     * This is calculated as RIPE160(SHA256([encoded pubkey])) and returned as
     * a byte array.
     */
    ECKey.prototype.getPubKeyHash = function() {
        if (this.compressed) {
            if (this.pubKeyHashComp) return this.pubKeyHashComp;
            return this.pubKeyHashComp = Bitcoin.Util.sha256ripe160(this.getPub());
        } else {
            if (this.pubKeyHashUncomp) return this.pubKeyHashUncomp;
            return this.pubKeyHashUncomp = Bitcoin.Util.sha256ripe160(this.getPub());
        }
    };

    ECKey.prototype.getBitcoinAddress = function() {
        var hash = this.getPubKeyHash();
        var addr = new Bitcoin.Address(hash);
        return addr.toString();
    };

    /*
     * Takes a public point as a hex string or byte array
     */
    ECKey.prototype.setPub = function(pub) {
        // byte array
        if (Bitcoin.Util.isArray(pub)) {
            pub = Crypto.util.bytesToHex(pub).toString().toUpperCase();
        }
        var ecPoint = ecparams.getCurve().decodePointHex(pub);
        this.setCompressed(ecPoint.compressed);
        this.pubPoint = ecPoint;
        return this;
    };

    // Sipa Private Key Wallet Import Format
    ECKey.prototype.getBitcoinWalletImportFormat = function() {
        var bytes = this.getBitcoinPrivateKeyByteArray();
        bytes.unshift(ECKey.privateKeyPrefix); // prepend 0x80 byte
        if (this.compressed) bytes.push(0x01); // append 0x01 byte for compressed format
        var checksum = Crypto.SHA256(Crypto.SHA256(bytes, {
            asBytes: true
        }), {
            asBytes: true
        });
        bytes = bytes.concat(checksum.slice(0, 4));
        var privWif = Bitcoin.Base58.encode(bytes);
        return privWif;
    };

    // Private Key Hex Format
    ECKey.prototype.getBitcoinHexFormat = function() {
        return Crypto.util.bytesToHex(this.getBitcoinPrivateKeyByteArray()).toString().toUpperCase();
    };

    // Private Key Base64 Format
    ECKey.prototype.getBitcoinBase64Format = function() {
        return Crypto.util.bytesToBase64(this.getBitcoinPrivateKeyByteArray());
    };

    ECKey.prototype.getBitcoinPrivateKeyByteArray = function() {
        // Get a copy of private key as a byte array
        var bytes = this.priv.toByteArrayUnsigned();
        // zero pad if private key is less than 32 bytes
        while (bytes.length < 32) bytes.unshift(0x00);
        return bytes;
    };

    ECKey.prototype.toString = function(format) {
        format = format || "";
        if (format.toString().toLowerCase() == "base64" || format.toString().toLowerCase() == "b64") {
            return this.getBitcoinBase64Format();
        }
        // Wallet Import Format
        else if (format.toString().toLowerCase() == "wif") {
            return this.getBitcoinWalletImportFormat();
        } else {
            return this.getBitcoinHexFormat();
        }
    };

    ECKey.prototype.sign = function(hash) {
        return ECDSA.sign(hash, this.priv);
    };

    ECKey.prototype.verify = function(hash, sig) {
        return ECDSA.verify(hash, sig, this.getPub());
    };

    /**
     * Parse a wallet import format private key contained in a string.
     */
    ECKey.decodeWalletImportFormat = function(privStr) {
        var bytes = Bitcoin.Base58.decode(privStr);
        var hash = bytes.slice(0, 33);
        var checksum = Crypto.SHA256(Crypto.SHA256(hash, {
            asBytes: true
        }), {
            asBytes: true
        });
        if (checksum[0] != bytes[33] ||
            checksum[1] != bytes[34] ||
            checksum[2] != bytes[35] ||
            checksum[3] != bytes[36]) {
            throw "Checksum validation failed!";
        }
        var version = hash.shift();
        if (version != ECKey.privateKeyPrefix) {
            throw "Version " + version + " not supported!";
        }
        return hash;
    };

    /**
     * Parse a compressed wallet import format private key contained in a string.
     */
    ECKey.decodeCompressedWalletImportFormat = function(privStr) {
        var bytes = Bitcoin.Base58.decode(privStr);
        var hash = bytes.slice(0, 34);
        var checksum = Crypto.SHA256(Crypto.SHA256(hash, {
            asBytes: true
        }), {
            asBytes: true
        });
        if (checksum[0] != bytes[34] ||
            checksum[1] != bytes[35] ||
            checksum[2] != bytes[36] ||
            checksum[3] != bytes[37]) {
            throw "Checksum validation failed!";
        }
        var version = hash.shift();
        if (version != ECKey.privateKeyPrefix) {
            throw "Version " + version + " not supported!";
        }
        hash.pop();
        return hash;
    };

    // 64 characters [0-9A-F]
    ECKey.isHexFormat = function(key) {
        key = key.toString();
        return /^[A-Fa-f0-9]{64}$/.test(key);
    };

    // 51 characters base58, bitcoin always starts with a 5, litecoin and dogecoin with a '6', testnet with a '9'
    ECKey.isWalletImportFormat = function(key) {
        key = key.toString();
        var matcher = new RegExp("^" + window.WIFPrefix + "[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{50}$", "g");
        return (ECKey.privateKeyPrefix == window.privateKeyPrefix) ? (matcher.test(key)) : false;
    };

    // 52 characters base58, bitcoin always starts with L or K, litecoin with a T, dogecoin with a 'Q', testnet with a 'c'
    ECKey.isCompressedWalletImportFormat = function(key) {
        key = key.toString();
        var matcher = new RegExp("^" + window.compressedWIFPrefix + "[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{51}$", "g");
        return (ECKey.privateKeyPrefix == window.privateKeyPrefix) ? (matcher.test(key)) : false;
    };

    // 44 characters
    ECKey.isBase64Format = function(key) {
        key = key.toString();
        return (/^[ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789=+\/]{44}$/.test(key));
    };

    // 99 characters, 1=1, if using dice convert 6 to 0
    ECKey.isBase6Format = function(key) {
        key = key.toString();
        return (/^[012345]{99}$/.test(key));
    };

    // 22, 26 or 30 characters, always starts with an 'S'
    ECKey.isMiniFormat = function(key) {
        key = key.toString();
        var validChars22 = /^S[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{21}$/.test(key);
        var validChars26 = /^S[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{25}$/.test(key);
        var validChars30 = /^S[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{29}$/.test(key);
        var testBytes = Crypto.SHA256(key + "?", {
            asBytes: true
        });

        return ((testBytes[0] === 0x00 || testBytes[0] === 0x01) && (validChars22 || validChars26 || validChars30));
    };

    return ECKey;
})();

//https://raw.github.com/bitcoinjs/bitcoinjs-lib/09e8c6e184d6501a0c2c59d73ca64db5c0d3eb95/src/util.js
// Bitcoin utility functions
Bitcoin.Util = {
    /**
     * Cross-browser compatibility version of Array.isArray.
     */
    isArray: Array.isArray || function(o) {
        return Object.prototype.toString.call(o) === '[object Array]';
    },
    /**
     * Create an array of a certain length filled with a specific value.
     */
    makeFilledArray: function(len, val) {
        var array = [];
        var i = 0;
        while (i < len) {
            array[i++] = val;
        }
        return array;
    },
    /**
     * Turn an integer into a "var_int".
     *
     * "var_int" is a variable length integer used by Bitcoin's binary format.
     *
     * Returns a byte array.
     */
    numToVarInt: function(i) {
        if (i < 0xfd) {
            // unsigned char
            return [i];
        } else if (i <= 1 << 16) {
            // unsigned short (LE)
            return [0xfd, i >>> 8, i & 255];
        } else if (i <= 1 << 32) {
            // unsigned int (LE)
            return [0xfe].concat(Crypto.util.wordsToBytes([i]));
        } else {
            // unsigned long long (LE)
            return [0xff].concat(Crypto.util.wordsToBytes([i >>> 32, i]));
        }
    },
    /**
     * Parse a Bitcoin value byte array, returning a BigInteger.
     */
    valueToBigInt: function(valueBuffer) {
        if (valueBuffer instanceof BigInteger) return valueBuffer;

        // Prepend zero byte to prevent interpretation as negative integer
        return BigInteger.fromByteArrayUnsigned(valueBuffer);
    },
    /**
     * Format a Bitcoin value as a string.
     *
     * Takes a BigInteger or byte-array and returns that amount of Bitcoins in a
     * nice standard formatting.
     *
     * Examples:
     * 12.3555
     * 0.1234
     * 900.99998888
     * 34.00
     */
    formatValue: function(valueBuffer) {
        var value = this.valueToBigInt(valueBuffer).toString();
        var integerPart = value.length > 8 ? value.substr(0, value.length - 8) : '0';
        var decimalPart = value.length > 8 ? value.substr(value.length - 8) : value;
        while (decimalPart.length < 8) decimalPart = "0" + decimalPart;
        decimalPart = decimalPart.replace(/0*$/, '');
        while (decimalPart.length < 2) decimalPart += "0";
        return integerPart + "." + decimalPart;
    },
    /**
     * Parse a floating point string as a Bitcoin value.
     *
     * Keep in mind that parsing user input is messy. You should always display
     * the parsed value back to the user to make sure we understood his input
     * correctly.
     */
    parseValue: function(valueString) {
        // TODO: Detect other number formats (e.g. comma as decimal separator)
        var valueComp = valueString.split('.');
        var integralPart = valueComp[0];
        var fractionalPart = valueComp[1] || "0";
        while (fractionalPart.length < 8) fractionalPart += "0";
        fractionalPart = fractionalPart.replace(/^0+/g, '');
        var value = BigInteger.valueOf(parseInt(integralPart));
        value = value.multiply(BigInteger.valueOf(100000000));
        value = value.add(BigInteger.valueOf(parseInt(fractionalPart)));
        return value;
    },
    /**
     * Calculate RIPEMD160(SHA256(data)).
     *
     * Takes an arbitrary byte array as inputs and returns the hash as a byte
     * array.
     */
    sha256ripe160: function(data) {
        return Crypto.RIPEMD160(Crypto.SHA256(data, {
            asBytes: true
        }), {
            asBytes: true
        });
    },
    // double sha256
    dsha256: function(data) {
        return Crypto.SHA256(Crypto.SHA256(data, {
            asBytes: true
        }), {
            asBytes: true
        });
    }
};

/*
 * Copyright (c) 2010-2011 Intalio Pte, All Rights Reserved
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
// https://github.com/cheongwy/node-scrypt-js
(function() {

    var MAX_VALUE = 2147483647;
    var workerUrl = null;

    //function scrypt(byte[] passwd, byte[] salt, int N, int r, int p, int dkLen)
    /*
     * N = Cpu cost
     * r = Memory cost
     * p = parallelization cost
     *
     */
    window.Crypto_scrypt = function(passwd, salt, N, r, p, dkLen, callback) {
        if (N == 0 || (N & (N - 1)) != 0) throw Error("N must be > 0 and a power of 2");

        if (N > MAX_VALUE / 128 / r) throw Error("Parameter N is too large");
        if (r > MAX_VALUE / 128 / p) throw Error("Parameter r is too large");

        var PBKDF2_opts = {
            iterations: 1,
            hasher: Crypto.SHA256,
            asBytes: true
        };

        var B = Crypto.PBKDF2(passwd, salt, p * 128 * r, PBKDF2_opts);

        try {
            var i = 0;
            var worksDone = 0;
            var makeWorker = function() {
                if (!workerUrl) {
                    var code = '(' + scryptCore.toString() + ')()';
                    var blob;
                    try {
                        blob = new Blob([code], {
                            type: "text/javascript"
                        });
                    } catch (e) {
                        window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
                        blob = new BlobBuilder();
                        blob.append(code);
                        blob = blob.getBlob("text/javascript");
                    }
                    workerUrl = URL.createObjectURL(blob);
                }
                var worker = new Worker(workerUrl);
                worker.onmessage = function(event) {
                    var Bi = event.data[0],
                        Bslice = event.data[1];
                    worksDone++;

                    if (i < p) {
                        worker.postMessage([N, r, p, B, i++]);
                    }

                    var length = Bslice.length,
                        destPos = Bi * 128 * r,
                        srcPos = 0;
                    while (length--) {
                        B[destPos++] = Bslice[srcPos++];
                    }

                    if (worksDone == p) {
                        callback(Crypto.PBKDF2(passwd, B, dkLen, PBKDF2_opts));
                    }
                };
                return worker;
            };
            var workers = [makeWorker(), makeWorker()];
            workers[0].postMessage([N, r, p, B, i++]);
            if (p > 1) {
                workers[1].postMessage([N, r, p, B, i++]);
            }
        } catch (e) {
            window.setTimeout(function() {
                scryptCore();
                callback(Crypto.PBKDF2(passwd, B, dkLen, PBKDF2_opts));
            }, 0);
        }

        // using this function to enclose everything needed to create a worker (but also invokable directly for synchronous use)
        function scryptCore() {
            var XY = [],
                V = [];

            salsa20_8(new Array(32)); // dummy call added to work around problem with BIP38 encoding on Safari 6.05

            if (typeof B === 'undefined') {
                onmessage = function(event) {
                    var data = event.data;
                    var N = data[0],
                        r = data[1],
                        p = data[2],
                        B = data[3],
                        i = data[4];

                    var Bslice = [];
                    arraycopy32(B, i * 128 * r, Bslice, 0, 128 * r);
                    smix(Bslice, 0, r, N, V, XY);

                    postMessage([i, Bslice]);
                };
            } else {
                for (var i = 0; i < p; i++) {
                    smix(B, i * 128 * r, r, N, V, XY);
                }
            }

            function smix(B, Bi, r, N, V, XY) {
                var Xi = 0;
                var Yi = 128 * r;
                var i;

                arraycopy32(B, Bi, XY, Xi, Yi);

                for (i = 0; i < N; i++) {
                    arraycopy32(XY, Xi, V, i * Yi, Yi);
                    blockmix_salsa8(XY, Xi, Yi, r);
                }

                for (i = 0; i < N; i++) {
                    var j = integerify(XY, Xi, r) & (N - 1);
                    blockxor(V, j * Yi, XY, Xi, Yi);
                    blockmix_salsa8(XY, Xi, Yi, r);
                }

                arraycopy32(XY, Xi, B, Bi, Yi);
            }

            function blockmix_salsa8(BY, Bi, Yi, r) {
                var X = [];
                var i;

                arraycopy32(BY, Bi + (2 * r - 1) * 64, X, 0, 64);

                for (i = 0; i < 2 * r; i++) {
                    blockxor(BY, i * 64, X, 0, 64);
                    salsa20_8(X);
                    arraycopy32(X, 0, BY, Yi + (i * 64), 64);
                }

                for (i = 0; i < r; i++) {
                    arraycopy32(BY, Yi + (i * 2) * 64, BY, Bi + (i * 64), 64);
                }

                for (i = 0; i < r; i++) {
                    arraycopy32(BY, Yi + (i * 2 + 1) * 64, BY, Bi + (i + r) * 64, 64);
                }
            }

            function R(a, b) {
                return (a << b) | (a >>> (32 - b));
            }

            function salsa20_8(B) {
                var B32 = new Array(32);
                var x = new Array(32);
                var i;

                for (i = 0; i < 16; i++) {
                    B32[i] = (B[i * 4 + 0] & 0xff) << 0;
                    B32[i] |= (B[i * 4 + 1] & 0xff) << 8;
                    B32[i] |= (B[i * 4 + 2] & 0xff) << 16;
                    B32[i] |= (B[i * 4 + 3] & 0xff) << 24;
                }

                arraycopy(B32, 0, x, 0, 16);

                for (i = 8; i > 0; i -= 2) {
                    x[4] ^= R(x[0] + x[12], 7);
                    x[8] ^= R(x[4] + x[0], 9);
                    x[12] ^= R(x[8] + x[4], 13);
                    x[0] ^= R(x[12] + x[8], 18);
                    x[9] ^= R(x[5] + x[1], 7);
                    x[13] ^= R(x[9] + x[5], 9);
                    x[1] ^= R(x[13] + x[9], 13);
                    x[5] ^= R(x[1] + x[13], 18);
                    x[14] ^= R(x[10] + x[6], 7);
                    x[2] ^= R(x[14] + x[10], 9);
                    x[6] ^= R(x[2] + x[14], 13);
                    x[10] ^= R(x[6] + x[2], 18);
                    x[3] ^= R(x[15] + x[11], 7);
                    x[7] ^= R(x[3] + x[15], 9);
                    x[11] ^= R(x[7] + x[3], 13);
                    x[15] ^= R(x[11] + x[7], 18);
                    x[1] ^= R(x[0] + x[3], 7);
                    x[2] ^= R(x[1] + x[0], 9);
                    x[3] ^= R(x[2] + x[1], 13);
                    x[0] ^= R(x[3] + x[2], 18);
                    x[6] ^= R(x[5] + x[4], 7);
                    x[7] ^= R(x[6] + x[5], 9);
                    x[4] ^= R(x[7] + x[6], 13);
                    x[5] ^= R(x[4] + x[7], 18);
                    x[11] ^= R(x[10] + x[9], 7);
                    x[8] ^= R(x[11] + x[10], 9);
                    x[9] ^= R(x[8] + x[11], 13);
                    x[10] ^= R(x[9] + x[8], 18);
                    x[12] ^= R(x[15] + x[14], 7);
                    x[13] ^= R(x[12] + x[15], 9);
                    x[14] ^= R(x[13] + x[12], 13);
                    x[15] ^= R(x[14] + x[13], 18);
                }

                for (i = 0; i < 16; ++i) B32[i] = x[i] + B32[i];

                for (i = 0; i < 16; i++) {
                    var bi = i * 4;
                    B[bi + 0] = (B32[i] >> 0 & 0xff);
                    B[bi + 1] = (B32[i] >> 8 & 0xff);
                    B[bi + 2] = (B32[i] >> 16 & 0xff);
                    B[bi + 3] = (B32[i] >> 24 & 0xff);
                }
            }

            function blockxor(S, Si, D, Di, len) {
                var i = len >> 6;
                while (i--) {
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];

                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];

                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];

                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];

                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];

                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];

                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];

                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                    D[Di++] ^= S[Si++];
                }
            }

            function integerify(B, bi, r) {
                var n;

                bi += (2 * r - 1) * 64;

                n = (B[bi + 0] & 0xff) << 0;
                n |= (B[bi + 1] & 0xff) << 8;
                n |= (B[bi + 2] & 0xff) << 16;
                n |= (B[bi + 3] & 0xff) << 24;

                return n;
            }

            function arraycopy(src, srcPos, dest, destPos, length) {
                while (length--) {
                    dest[destPos++] = src[srcPos++];
                }
            }

            function arraycopy32(src, srcPos, dest, destPos, length) {
                var i = length >> 5;
                while (i--) {
                    dest[destPos++] = src[srcPos++];
                    dest[destPos++] = src[srcPos++];
                    dest[destPos++] = src[srcPos++];
                    dest[destPos++] = src[srcPos++];
                    dest[destPos++] = src[srcPos++];
                    dest[destPos++] = src[srcPos++];
                    dest[destPos++] = src[srcPos++];
                    dest[destPos++] = src[srcPos++];

                    dest[destPos++] = src[srcPos++];
                    dest[destPos++] = src[srcPos++];
                    dest[destPos++] = src[srcPos++];
                    dest[destPos++] = src[srcPos++];
                    dest[destPos++] = src[srcPos++];
                    dest[destPos++] = src[srcPos++];
                    dest[destPos++] = src[srcPos++];
                    dest[destPos++] = src[srcPos++];

                    dest[destPos++] = src[srcPos++];
                    dest[destPos++] = src[srcPos++];
                    dest[destPos++] = src[srcPos++];
                    dest[destPos++] = src[srcPos++];
                    dest[destPos++] = src[srcPos++];
                    dest[destPos++] = src[srcPos++];
                    dest[destPos++] = src[srcPos++];
                    dest[destPos++] = src[srcPos++];

                    dest[destPos++] = src[srcPos++];
                    dest[destPos++] = src[srcPos++];
                    dest[destPos++] = src[srcPos++];
                    dest[destPos++] = src[srcPos++];
                    dest[destPos++] = src[srcPos++];
                    dest[destPos++] = src[srcPos++];
                    dest[destPos++] = src[srcPos++];
                    dest[destPos++] = src[srcPos++];
                }
            }
        } // scryptCore
    }; // window.Crypto_scrypt
})();

// User Agent Parser added by BitcoinPaperWallet.com for browser detection.
// UAParser.js v0.6.1
// Lightweight JavaScript-based User-Agent string parser
// https://github.com/faisalman/ua-parser-js
//
// Copyright © 2012-2013 Faisalman <fyzlman@gmail.com>
// Dual licensed under GPLv2 & MIT

(function(window, undefined) {

    'use strict';

    //////////////
    // Constants
    /////////////


    var EMPTY = '',
        UNKNOWN = '?',
        FUNC_TYPE = 'function',
        UNDEF_TYPE = 'undefined',
        OBJ_TYPE = 'object',
        MAJOR = 'major',
        MODEL = 'model',
        NAME = 'name',
        TYPE = 'type',
        VENDOR = 'vendor',
        VERSION = 'version',
        ARCHITECTURE = 'architecture',
        CONSOLE = 'console',
        MOBILE = 'mobile',
        TABLET = 'tablet';


    ///////////
    // Helper
    //////////


    var util = {
        has: function(str1, str2) {
            return str2.toLowerCase().indexOf(str1.toLowerCase()) !== -1;
        },
        lowerize: function(str) {
            return str.toLowerCase();
        }
    };


    ///////////////
    // Map helper
    //////////////


    var mapper = {

        rgx: function() {

            // loop through all regexes maps
            for (var result, i = 0, j, k, p, q, matches, match, args = arguments; i < args.length; i += 2) {

                var regex = args[i], // even sequence (0,2,4,..)
                    props = args[i + 1]; // odd sequence (1,3,5,..)

                // construct object barebones
                if (typeof(result) === UNDEF_TYPE) {
                    result = {};
                    for (p in props) {
                        q = props[p];
                        if (typeof(q) === OBJ_TYPE) {
                            result[q[0]] = undefined;
                        } else {
                            result[q] = undefined;
                        }
                    }
                }

                // try matching uastring with regexes
                for (j = k = 0; j < regex.length; j++) {
                    matches = regex[j].exec(this.getUA());
                    if (!!matches) {
                        for (p in props) {
                            match = matches[++k];
                            q = props[p];
                            // check if given property is actually array
                            if (typeof(q) === OBJ_TYPE && q.length > 0) {
                                if (q.length == 2) {
                                    if (typeof(q[1]) == FUNC_TYPE) {
                                        // assign modified match
                                        result[q[0]] = q[1].call(this, match);
                                    } else {
                                        // assign given value, ignore regex match
                                        result[q[0]] = q[1];
                                    }
                                } else if (q.length == 3) {
                                    // check whether function or regex
                                    if (typeof(q[1]) === FUNC_TYPE && !(q[1].exec && q[1].test)) {
                                        // call function (usually string mapper)
                                        result[q[0]] = match ? q[1].call(this, match, q[2]) : undefined;
                                    } else {
                                        // sanitize match using given regex
                                        result[q[0]] = match ? match.replace(q[1], q[2]) : undefined;
                                    }
                                } else if (q.length == 4) {
                                    result[q[0]] = match ? q[3].call(this, match.replace(q[1], q[2])) : undefined;
                                }
                            } else {
                                result[q] = match ? match : undefined;
                            }
                        }
                        break;
                    }
                }

                if (!!matches) break; // break the loop immediately if match found
            }
            return result;
        },

        str: function(str, map) {

            for (var i in map) {
                // check if array
                if (typeof(map[i]) === OBJ_TYPE && map[i].length > 0) {
                    for (var j in map[i]) {
                        if (util.has(map[i][j], str)) {
                            return (i === UNKNOWN) ? undefined : i;
                        }
                    }
                } else if (util.has(map[i], str)) {
                    return (i === UNKNOWN) ? undefined : i;
                }
            }
            return str;
        }
    };


    ///////////////
    // String map
    //////////////


    var maps = {

        browser: {
            oldsafari: {
                major: {
                    '1': ['/8', '/1', '/3'],
                    '2': '/4',
                    '?': '/'
                },
                version: {
                    '1.0': '/8',
                    '1.2': '/1',
                    '1.3': '/3',
                    '2.0': '/412',
                    '2.0.2': '/416',
                    '2.0.3': '/417',
                    '2.0.4': '/419',
                    '?': '/'
                }
            }
        },

        device: {
            sprint: {
                model: {
                    'Evo Shift 4G': '7373KT'
                },
                vendor: {
                    'HTC': 'APA',
                    'Sprint': 'Sprint'
                }
            }
        },

        os: {
            windows: {
                version: {
                    'ME': '4.90',
                    'NT 3.11': 'NT3.51',
                    'NT 4.0': 'NT4.0',
                    '2000': 'NT 5.0',
                    'XP': ['NT 5.1', 'NT 5.2'],
                    'Vista': 'NT 6.0',
                    '7': 'NT 6.1',
                    '8': 'NT 6.2',
                    'RT': 'ARM'
                }
            }
        }
    };


    //////////////
    // Regex map
    /////////////


    var regexes = {

        browser: [
            [

                // Presto based
                /(opera\smini)\/((\d+)?[\w\.-]+)/i, // Opera Mini
                /(opera\s[mobiletab]+).+version\/((\d+)?[\w\.-]+)/i, // Opera Mobi/Tablet
                /(opera).+version\/((\d+)?[\w\.]+)/i, // Opera > 9.80
                /(opera)[\/\s]+((\d+)?[\w\.]+)/i // Opera < 9.80

            ],
            [NAME, VERSION, MAJOR],
            [

                /\s(opr)\/((\d+)?[\w\.]+)/i // Opera Webkit
            ],
            [
                [NAME, 'Opera'], VERSION, MAJOR
            ],
            [

                // Mixed
                /(kindle)\/((\d+)?[\w\.]+)/i, // Kindle
                /(lunascape|maxthon|netfront|jasmine|blazer)[\/\s]?((\d+)?[\w\.]+)*/i,
                // Lunascape/Maxthon/Netfront/Jasmine/Blazer

                // Trident based
                /(avant\s|iemobile|slim|baidu)(?:browser)?[\/\s]?((\d+)?[\w\.]*)/i,
                // Avant/IEMobile/SlimBrowser/Baidu
                /(?:ms|\()(ie)\s((\d+)?[\w\.]+)/i, // Internet Explorer

                // Webkit/KHTML based
                /(rekonq)((?:\/)[\w\.]+)*/i, // Rekonq
                /(chromium|flock|rockmelt|midori|epiphany|silk|skyfire|ovibrowser|bolt)\/((\d+)?[\w\.-]+)/i
                // Chromium/Flock/RockMelt/Midori/Epiphany/Silk/Skyfire/Bolt
            ],
            [NAME, VERSION, MAJOR],
            [

                /(yabrowser)\/((\d+)?[\w\.]+)/i // Yandex
            ],
            [
                [NAME, 'Yandex'], VERSION, MAJOR
            ],
            [

                /(comodo_dragon)\/((\d+)?[\w\.]+)/i // Comodo Dragon
            ],
            [
                [NAME, /_/g, ' '], VERSION, MAJOR
            ],
            [

                /(chrome|omniweb|arora|[tizenoka]{5}\s?browser)\/v?((\d+)?[\w\.]+)/i
                // Chrome/OmniWeb/Arora/Tizen/Nokia
            ],
            [NAME, VERSION, MAJOR],
            [

                /(dolfin)\/((\d+)?[\w\.]+)/i // Dolphin
            ],
            [
                [NAME, 'Dolphin'], VERSION, MAJOR
            ],
            [

                /((?:android.+)crmo|crios)\/((\d+)?[\w\.]+)/i // Chrome for Android/iOS
            ],
            [
                [NAME, 'Chrome'], VERSION, MAJOR
            ],
            [

                /version\/((\d+)?[\w\.]+).+?mobile\/\w+\s(safari)/i // Mobile Safari
            ],
            [VERSION, MAJOR, [NAME, 'Mobile Safari']],
            [

                /version\/((\d+)?[\w\.]+).+?(mobile\s?safari|safari)/i // Safari & Safari Mobile
            ],
            [VERSION, MAJOR, NAME],
            [

                /webkit.+?(mobile\s?safari|safari)((\/[\w\.]+))/i // Safari < 3.0
            ],
            [NAME, [MAJOR, mapper.str, maps.browser.oldsafari.major],
                [VERSION, mapper.str, maps.browser.oldsafari.version]
            ],
            [

                /(konqueror)\/((\d+)?[\w\.]+)/i, // Konqueror
                /(webkit|khtml)\/((\d+)?[\w\.]+)/i
            ],
            [NAME, VERSION, MAJOR],
            [

                // Gecko based
                /(navigator|netscape)\/((\d+)?[\w\.-]+)/i // Netscape
            ],
            [
                [NAME, 'Netscape'], VERSION, MAJOR
            ],
            [
                /(swiftfox)/i, // Swiftfox
                /(iceweasel|camino|chimera|fennec|maemo\sbrowser|minimo|conkeror)[\/\s]?((\d+)?[\w\.\+]+)/i,
                // Iceweasel/Camino/Chimera/Fennec/Maemo/Minimo/Conkeror
                /(firefox|seamonkey|k-meleon|icecat|iceape|firebird|phoenix)\/((\d+)?[\w\.-]+)/i,
                // Firefox/SeaMonkey/K-Meleon/IceCat/IceApe/Firebird/Phoenix
                /(mozilla)\/((\d+)?[\w\.]+).+rv\:.+gecko\/\d+/i, // Mozilla

                // Other
                /(uc\s?browser|polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf)[\/\s]?((\d+)?[\w\.]+)/i,
                // UCBrowser/Polaris/Lynx/Dillo/iCab/Doris/Amaya/w3m/NetSurf
                /(links)\s\(((\d+)?[\w\.]+)/i, // Links
                /(gobrowser)\/?((\d+)?[\w\.]+)*/i, // GoBrowser
                /(ice\s?browser)\/v?((\d+)?[\w\._]+)/i, // ICE Browser
                /(mosaic)[\/\s]((\d+)?[\w\.]+)/i // Mosaic
            ],
            [NAME, VERSION, MAJOR]
        ],

        cpu: [
            [

                /(?:(amd|x(?:(?:86|64)[_-])?|wow|win)64)[;\)]/i // AMD64
            ],
            [
                [ARCHITECTURE, 'amd64']
            ],
            [

                /((?:i[346]|x)86)[;\)]/i // IA32
            ],
            [
                [ARCHITECTURE, 'ia32']
            ],
            [

                // PocketPC mistakenly identified as PowerPC
                /windows\s(ce|mobile);\sppc;/i
            ],
            [
                [ARCHITECTURE, 'arm']
            ],
            [

                /((?:ppc|powerpc)(?:64)?)(?:\smac|;|\))/i // PowerPC
            ],
            [
                [ARCHITECTURE, /ower/, '', util.lowerize]
            ],
            [

                /(sun4\w)[;\)]/i // SPARC
            ],
            [
                [ARCHITECTURE, 'sparc']
            ],
            [

                /(ia64(?=;)|68k(?=\))|arm(?=v\d+;)|(?:irix|mips|sparc)(?:64)?(?=;)|pa-risc)/i
                // IA64, 68K, ARM, IRIX, MIPS, SPARC, PA-RISC
            ],
            [ARCHITECTURE, util.lowerize]
        ],

        device: [
            [

                /\((ipad|playbook);[\w\s\);-]+(rim|apple)/i // iPad/PlayBook
            ],
            [MODEL, VENDOR, [TYPE, TABLET]],
            [

                /(hp).+(touchpad)/i, // HP TouchPad
                /(kindle)\/([\w\.]+)/i, // Kindle
                /\s(nook)[\w\s]+build\/(\w+)/i, // Nook
                /(dell)\s(strea[kpr\s\d]*[\dko])/i // Dell Streak
            ],
            [VENDOR, MODEL, [TYPE, TABLET]],
            [

                /\((ip[honed]+);.+(apple)/i // iPod/iPhone
            ],
            [MODEL, VENDOR, [TYPE, MOBILE]],
            [

                /(blackberry)[\s-]?(\w+)/i, // BlackBerry
                /(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|huawei|meizu|motorola)[\s_-]?([\w-]+)*/i,
                // BenQ/Palm/Sony-Ericsson/Acer/Asus/Dell/Huawei/Meizu/Motorola
                /(hp)\s([\w\s]+\w)/i, // HP iPAQ
                /(asus)-?(\w+)/i // Asus
            ],
            [VENDOR, MODEL, [TYPE, MOBILE]],
            [
                /\((bb10);\s(\w+)/i // BlackBerry 10
            ],
            [
                [VENDOR, 'BlackBerry'], MODEL, [TYPE, MOBILE]
            ],
            [

                /android.+((transfo[prime\s]{4,10}\s\w+|eeepc|slider\s\w+))/i // Asus Tablets
            ],
            [
                [VENDOR, 'Asus'], MODEL, [TYPE, TABLET]
            ],
            [

                /(sony)\s(tablet\s[ps])/i // Sony Tablets
            ],
            [VENDOR, MODEL, [TYPE, TABLET]],
            [

                /(nintendo)\s([wids3u]+)/i // Nintendo
            ],
            [VENDOR, MODEL, [TYPE, CONSOLE]],
            [

                /((playstation)\s[3portablevi]+)/i // Playstation
            ],
            [
                [VENDOR, 'Sony'], MODEL, [TYPE, CONSOLE]
            ],
            [

                /(sprint\s(\w+))/i // Sprint Phones
            ],
            [
                [VENDOR, mapper.str, maps.device.sprint.vendor],
                [MODEL, mapper.str, maps.device.sprint.model],
                [TYPE, MOBILE]
            ],
            [

                /(htc)[;_\s-]+([\w\s]+(?=\))|\w+)*/i, // HTC
                /(zte)-(\w+)*/i, // ZTE
                /(alcatel|geeksphone|huawei|lenovo|nexian|panasonic|(?=;\s)sony)[_\s-]?([\w-]+)*/i
                // Alcatel/GeeksPhone/Huawei/Lenovo/Nexian/Panasonic/Sony
            ],
            [VENDOR, [MODEL, /_/g, ' '],
                [TYPE, MOBILE]
            ],
            [

                /\s((milestone|droid[2x]?))[globa\s]*\sbuild\//i, // Motorola
                /(mot)[\s-]?(\w+)*/i
            ],
            [
                [VENDOR, 'Motorola'], MODEL, [TYPE, MOBILE]
            ],
            [
                /android.+\s((mz60\d|xoom[\s2]{0,2}))\sbuild\//i
            ],
            [
                [VENDOR, 'Motorola'], MODEL, [TYPE, TABLET]
            ],
            [

                /android.+((sch-i[89]0\d|shw-m380s|gt-p\d{4}|gt-n8000|sgh-t8[56]9))/i
            ],
            [
                [VENDOR, 'Samsung'], MODEL, [TYPE, TABLET]
            ],
            [ // Samsung
                /((s[cgp]h-\w+|gt-\w+|galaxy\snexus))/i,
                /(sam[sung]*)[\s-]*(\w+-?[\w-]*)*/i,
                /sec-((sgh\w+))/i
            ],
            [
                [VENDOR, 'Samsung'], MODEL, [TYPE, MOBILE]
            ],
            [
                /(sie)-(\w+)*/i // Siemens
            ],
            [
                [VENDOR, 'Siemens'], MODEL, [TYPE, MOBILE]
            ],
            [

                /(maemo|nokia).*(n900|lumia\s\d+)/i, // Nokia
                /(nokia)[\s_-]?([\w-]+)*/i
            ],
            [
                [VENDOR, 'Nokia'], MODEL, [TYPE, MOBILE]
            ],
            [

                /android\s3\.[\s\w-;]{10}((a\d{3}))/i // Acer
            ],
            [
                [VENDOR, 'Acer'], MODEL, [TYPE, TABLET]
            ],
            [

                /android\s3\.[\s\w-;]{10}(lg?)-([06cv9]{3,4})/i // LG
            ],
            [
                [VENDOR, 'LG'], MODEL, [TYPE, TABLET]
            ],
            [
                /((nexus\s4))/i,
                /(lg)[e;\s-\/]+(\w+)*/i
            ],
            [
                [VENDOR, 'LG'], MODEL, [TYPE, MOBILE]
            ],
            [

                /(mobile|tablet);.+rv\:.+gecko\//i // Unidentifiable
            ],
            [TYPE, VENDOR, MODEL]
        ],

        engine: [
            [

                /(presto)\/([\w\.]+)/i, // Presto
                /(webkit|trident|netfront|netsurf|amaya|lynx|w3m)\/([\w\.]+)/i, // WebKit/Trident/NetFront/NetSurf/Amaya/Lynx/w3m
                /(khtml|tasman|links)[\/\s]\(?([\w\.]+)/i, // KHTML/Tasman/Links
                /(icab)[\/\s]([23]\.[\d\.]+)/i // iCab
            ],
            [NAME, VERSION],
            [

                /rv\:([\w\.]+).*(gecko)/i // Gecko
            ],
            [VERSION, NAME]
        ],

        os: [
            [

                // Windows based
                /(windows)\snt\s6\.2;\s(arm)/i, // Windows RT
                /(windows\sphone(?:\sos)*|windows\smobile|windows)[\s\/]?([ntce\d\.\s]+\w)/i
            ],
            [NAME, [VERSION, mapper.str, maps.os.windows.version]],
            [
                /(win(?=3|9|n)|win\s9x\s)([nt\d\.]+)/i
            ],
            [
                [NAME, 'Windows'],
                [VERSION, mapper.str, maps.os.windows.version]
            ],
            [

                // Mobile/Embedded OS
                /\((bb)(10);/i // BlackBerry 10
            ],
            [
                [NAME, 'BlackBerry'], VERSION
            ],
            [
                /(blackberry)\w*\/?([\w\.]+)*/i, // Blackberry
                /(tizen)\/([\w\.]+)/i, // Tizen
                /(android|webos|palm\os|qnx|bada|rim\stablet\sos|meego)[\/\s-]?([\w\.]+)*/i
                // Android/WebOS/Palm/QNX/Bada/RIM/MeeGo
            ],
            [NAME, VERSION],
            [
                /(symbian\s?os|symbos|s60(?=;))[\/\s-]?([\w\.]+)*/i // Symbian
            ],
            [
                [NAME, 'Symbian'], VERSION
            ],
            [
                /mozilla.+\(mobile;.+gecko.+firefox/i // Firefox OS
            ],
            [
                [NAME, 'Firefox OS'], VERSION
            ],
            [

                // Console
                /(nintendo|playstation)\s([wids3portablevu]+)/i, // Nintendo/Playstation

                // GNU/Linux based
                /(mint)[\/\s\(]?(\w+)*/i, // Mint
                /(joli|[kxln]?ubuntu|debian|[open]*suse|gentoo|arch|slackware|fedora|mandriva|centos|pclinuxos|redhat|zenwalk)[\/\s-]?([\w\.-]+)*/i,
                // Joli/Ubuntu/Debian/SUSE/Gentoo/Arch/Slackware
                // Fedora/Mandriva/CentOS/PCLinuxOS/RedHat/Zenwalk
                /(hurd|linux)\s?([\w\.]+)*/i, // Hurd/Linux
                /(gnu)\s?([\w\.]+)*/i // GNU
            ],
            [NAME, VERSION],
            [

                /(cros)\s[\w]+\s([\w\.]+\w)/i // Chromium OS
            ],
            [
                [NAME, 'Chromium OS'], VERSION
            ],
            [

                // Solaris
                /(sunos)\s?([\w\.]+\d)*/i // Solaris
            ],
            [
                [NAME, 'Solaris'], VERSION
            ],
            [

                // BSD based
                /\s([frentopc-]{0,4}bsd|dragonfly)\s?([\w\.]+)*/i // FreeBSD/NetBSD/OpenBSD/PC-BSD/DragonFly
            ],
            [NAME, VERSION],
            [

                /(ip[honead]+)(?:.*os\s*([\w]+)*\slike\smac|;\sopera)/i // iOS
            ],
            [
                [NAME, 'iOS'],
                [VERSION, /_/g, '.']
            ],
            [

                /(mac\sos\sx)\s?([\w\s\.]+\w)*/i // Mac OS
            ],
            [NAME, [VERSION, /_/g, '.']],
            [

                // Other
                /(haiku)\s(\w+)/i, // Haiku
                /(aix)\s((\d)(?=\.|\)|\s)[\w\.]*)*/i, // AIX
                /(macintosh|mac(?=_powerpc)|plan\s9|minix|beos|os\/2|amigaos|morphos|risc\sos)/i,
                // Plan9/Minix/BeOS/OS2/AmigaOS/MorphOS/RISCOS
                /(unix)\s?([\w\.]+)*/i // UNIX
            ],
            [NAME, VERSION]
        ]
    };


    /////////////////
    // Constructor
    ////////////////


    var UAParser = function(uastring) {

        var ua = uastring || ((window && window.navigator && window.navigator.userAgent) ? window.navigator.userAgent : EMPTY);

        if (!(this instanceof UAParser)) {
            return new UAParser(uastring).getResult();
        }
        this.getBrowser = function() {
            return mapper.rgx.apply(this, regexes.browser);
        };
        this.getCPU = function() {
            return mapper.rgx.apply(this, regexes.cpu);
        };
        this.getDevice = function() {
            return mapper.rgx.apply(this, regexes.device);
        };
        this.getEngine = function() {
            return mapper.rgx.apply(this, regexes.engine);
        };
        this.getOS = function() {
            return mapper.rgx.apply(this, regexes.os);
        };
        this.getResult = function() {
            return {
                ua: this.getUA(),
                browser: this.getBrowser(),
                engine: this.getEngine(),
                os: this.getOS(),
                device: this.getDevice(),
                cpu: this.getCPU()
            };
        };
        this.getUA = function() {
            return ua;
        };
        this.setUA = function(uastring) {
            ua = uastring;
            return this;
        };
        this.setUA(ua);
    };


    ///////////
    // Export
    //////////


    // check js environment
    if (typeof(exports) !== UNDEF_TYPE) {
        // nodejs env
        if (typeof(module) !== UNDEF_TYPE && module.exports) {
            exports = module.exports = UAParser;
        }
        exports.UAParser = UAParser;
    } else {
        // browser env
        window.UAParser = UAParser;
        // requirejs env (optional)
        if (typeof(define) === FUNC_TYPE && define.amd) {
            define(function() {
                return UAParser;
            });
        }
        // jQuery specific (optional)
        if (typeof(window.jQuery) !== UNDEF_TYPE) {
            var $ = window.jQuery;
            var parser = new UAParser();
            $.ua = parser.getResult();
            $.ua.get = function() {
                return parser.getUA();
            };
            $.ua.set = function(uastring) {
                parser.setUA(uastring);
                var result = parser.getResult();
                for (var prop in result) {
                    $.ua[prop] = result[prop];
                }
            };
        }
    }

})(this);