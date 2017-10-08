/**
 * UI utilities.
 */
let UiUtils = {
		
	setupContentDiv: function(div) {
		div.empty();
		div.attr("class", "content_div");
	},

	getCryptoName: function(state) {
		if (state.mix) return state.mix.length > 1 ? "mixed" : state.mix[0].plugin.getName();
		else {
			let name;
			for (let key of state.keys) {
				if (!name) name = key.getPlugin().getName();
				else if (name !== key.getPlugin().getName()) return "mixed";
			}
			return name;
		}
	},
	
	getCryptoLogo: function(state) {
		if (state.mix) return state.mix.length === 1 ? state.mix[0].plugin.getLogo() : this.getMixLogo();
		else {
			let ticker;
			for (let key of state.keys) {
				if (!ticker) ticker = key.getPlugin().getTicker();
				else if (ticker !== key.getPlugin().getTicker()) return this.getMixLogo();
			}
			return CryptoUtils.getCryptoPlugin(ticker).getLogo();
		}
	},
	
	getMixLogo: function() {
		return $("<img src='img/mix.png'>");
	},
	
	getLink: function(href, label) {
		if (!href) href = '';
		let link = $("<a href='" + href + "'>");
		link.html(label);
		return link;
	},
	
	getProgressBar: function(div) {
		return new ProgressBar.Line(div, {
			strokeWidth: 2.5,
			color: 'rgb(96, 178, 198)',	// cryptostorage teal
			duration: 0,
			svgStyle: {width: '100%', height: '100%'},
			text: {
				className: 'progresbar-text',
				style: {
					color: 'black',
		            position: 'absolute',
		            left: '50%',
		            top: '50%',
		            padding: 0,
		            margin: 0,
		            transform: {
		                prefix: true,
		                value: 'translate(-50%, -50%)'
		            }
				}
			}
		});
	},
	
	// --- relative weights of key generation derived from experimentation and used for representative progress bar ---
	
	getCreateKeyWeight: function() { return 63; },
	
	getEncryptWeight: function(scheme) {
		switch (scheme) {
			case CryptoUtils.EncryptionScheme.BIP38:
				return 4187;
			case CryptoUtils.EncryptionScheme.CRYPTOJS:
				return 10;
			default: throw new Error("Unrecognized encryption scheme: " + scheme);
		}
	},
	
	getDecryptWeight: function(scheme) {
		switch (scheme) {
			case CryptoUtils.EncryptionScheme.BIP38:
				return 4581;
			case CryptoUtils.EncryptionScheme.CRYPTOJS:
				return 100;
			default: throw new Error("Unrecognized encryption scheme: " + scheme);
		}
	},
	
	getQrWeight: function() {
		return 15;
	},
	
	getLogoWeight: function() {
		return 15;
	}
}

/**
 * Base class to render and control a div.
 */
function DivController(div) {
	this.div = div;
}
DivController.prototype.getDiv = function() { return this.div; }
DivController.prototype.render = function(onDone) { }	// callback called with rendered div
DivController.prototype.onShow = function() { }
DivController.prototype.onHide = function() { }

/**
 * Home page.
 */
function HomeController(div, onSelectGenerate, onSelectRecover) {
	DivController.call(this, div);
	this.render = function(onDone) {
		UiUtils.setupContentDiv(div);
		
		let btnGenerate = $("<div class='btn btn_generate'>").appendTo(div);
		btnGenerate.append("Generate New Keys");
		btnGenerate.click(function() { onSelectGenerate(); });
		
		let btnRecover = $("<div class='btn btn_recover'>").appendTo(div);
		btnRecover.append("or Recover Existing Keys");
		btnRecover.click(function() { onSelectRecover(); });
		
		if (onDone) onDone();
	}
}
inheritsFrom(HomeController, DivController);

/**
 * Form page.
 */
function FormController(div) {
	DivController.call(this, div);
	this.render = function(onDone) {
		UiUtils.setupContentDiv(div);
		
		let passphraseCheckbox = $("<input type='checkbox' id='passphraseCheckbox'>").appendTo(div);
		let passphraseCheckboxLabel = $("<label for='passphraseCheckbox'>").appendTo(div);
		passphraseCheckboxLabel.html("&nbsp;Do you want to protect your private keys with a passphrase?");
		passphraseCheckbox.click(function() {
			console.log("passphrase checkbox clicked");
		})
		passphraseCheckbox.prop('checked', true);
		
		if (onDone) onDone();
	}
}
inheritsFrom(FormController, DivController);

/**
 * FAQ page.
 */
function FaqController(div) {
	DivController.call(this, div);
	this.render = function(onDone) {
		UiUtils.setupContentDiv(div);
		
		$("<div class='question'>").html("What is cryptostorage.com?").appendTo(div);
		$("<div class='answer'>").html("Cryptostorage.com is an open source application to generate public/private key pairs for multiple cryptocurrencies.  This site runs only in your device's browser.").appendTo(div);
		$("<div class='question'>").html("How should I use cryptostorage.com to generate secure storage for my cryptocurrencies?").appendTo(div);
		$("<div class='answer'>").html("<ol><li>Download the source code and its signature file to a flash drive.</li><li>Verify the source code has not been tampered with: TODO</li><li>Test before using by sending a small transaction and verifying that funds can be recovered from the private key.</li></ol>").appendTo(div);
		$("<div class='question'>").html("How can I trust this service?").appendTo(div);
		$("<div class='answer'>").html("Cryptostorage.com is 100% open source and verifiable.  Downloading and verifying the source code will ensure the source code matches what is what is publically auditable.  See \"How do I generate secure storage using cryptostorage.com?\" for instructions to download and verify the source code.").appendTo(div);
		$("<div class='question'>").html("Do I need internet access to recover my private keys?").appendTo(div);
		$("<div class='answer'>").html("No.  The source code is everything you need to recover the private keys.  Users should save a copy of this site for future use so there is no dependence on third parties to access this software.  Further, the source code for this site is hosted on GitHub.com. (TODO)").appendTo(div);
		$("<div class='question'>").html("Can I send funds from private keys using cryptostorage.com?").appendTo(div);
		$("<div class='answer'>").html("Not currently.  Cryptostorage.com is a public/private key generation and recovery service.  It is expected that users will import private keys into the wallet software of their choice after keys have been recovered using crypstorage.com.  Support to send funds from cryptostorage.com may be considered in the future depending on interest and ease of implementation.").appendTo(div);
		$("<div class='question'>").html("What formats can I export to?").appendTo(div);
		$("<div class='answer'>").html("TODO").appendTo(div);
		
		// done rendering
		if (onDone) onDone(div);
	}
}
inheritsFrom(FaqController, DivController);

/**
 * Donate page.
 */
function DonateController(div, appController) {
	DivController.call(this, div);
	this.render = function(onDone) {
		UiUtils.setupContentDiv(div);
		
		div.append("Donate");
		
		// done rendering
		if (onDone) onDone(div);
	}
}
inheritsFrom(DonateController, DivController);