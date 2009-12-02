(function() {
	
	/* Main object */
	window.GT = window.GT || {};
	
	/* Mozilla preferences */
	GT.mozPrefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
	
	/* Addon preferences */
	GT.addonPrefs = GT.mozPrefs.getBranch("googTrans.");
	
	/* Browser locale */
	GT.locale = GT.mozPrefs.getBranch("general.").getCharPref("useragent.locale");
	
	/* Google Translate functions */
	GT.fn = {};
	
	/* Get translation from Google Translate API */
	GT.fn.translationRequest = function(langFrom, langTo, text, onLoadFn, onErrorFn) {
		
		// Get formated URL
		var requestUrl = GT.fn.getGoogleUrl("api", langFrom, langTo, text);
		
		// AJAX Request
		var xRequest = new XMLHttpRequest();
		
		// Load event
		xRequest.addEventListener("load", (function() {
			var translatedText = decodeURIComponent( JSON.parse( xRequest.responseText ).responseData.translatedText );
			onLoadFn(translatedText);
		}), false);
		
		// Error event
		xRequest.addEventListener("error", onErrorFn, false);
		
		// Init request
		xRequest.open("GET", requestUrl, true);
		xRequest.send(null);
	};
	
	/* Get a google Translate formated URL (API, Page or Dictionary) */
	GT.fn.getGoogleUrl = function(urlType, langFrom, langTo, text) {
		
		var formattedUrl = '';
		
		switch (urlType) {
			
			// Google Translate API > JSON
			case "api":
			  formattedUrl = 'http://ajax.googleapis.com/ajax/services/language/translate?v=1.0&format=text&langpair=' + langFrom + '%7C' + langTo + '&q=' + encodeURIComponent(text);
			  break;
			
			// Google Translate page
			case "page":
			  formattedUrl = 'http://translate.google.com/#' + langFrom + '%7C' + langTo + '%7C' + encodeURIComponent(text);
			  break;
			
			// Google Translate Dictionary
			case "dict":
			  formattedUrl = 'http://www.google.com/dictionary?langpair=' + langFrom + '%7C' + langTo + '&q=' + encodeURIComponent(text);
			  break;
			
		}
		
		return formattedUrl;
	};
	
	/* Remove the whitespace from the beginning and end of a string (thanks jQuery ;-) ) */
	GT.fn.trim = function(str) {
		return (str || "").replace( /^\s+|\s+$/g, "" );
	};
	
	/* Set a new langpair in preferences */
	GT.fn.setLangPair = function(langFrom, langTo) {
		GT.addonPrefs.setCharPref("langpair", langFrom + "|" + langTo);
		Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).savePrefFile(null);
	};
	
	/* Get langpair in preferences */
	GT.fn.getLangPair = function() {
		return GT.addonPrefs.getCharPref("langpair").split('|');
	};
	
})();
