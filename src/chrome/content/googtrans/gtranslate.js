(function() {

    // Main object
    Components.utils.import("resource://gtranslate/common.js");

    /* Firefox 3.0 : JSON support */
    Components.utils.import("resource://gtranslate/JSON.js", GT);
    
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
            if (xRequest.status !== 200) {
                onErrorFn(xRequest.statusText);
                return;
            }
            
            var response = GT.JSON.parse(xRequest.responseText);
            
            if (!response.responseData || response.responseStatus !== 200) {
                onErrorFn(response.responseDetails);
                return;
            }
            
            var translatedText = response.responseData.translatedText;
            onLoadFn(translatedText, response.responseData.detectedSourceLanguage);
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
        return (str || "").replace(/^\s+|\s+$/g, "");
    };
    
    /* Set a new langpair in preferences */
    GT.fn.setLangPair = function(langFrom, langTo) {
        GT.prefs.setCharPref("from", langFrom);
        GT.prefs.setCharPref("to", langTo);
        GT.mozPrefs.savePrefFile(null);
    };
    
    /* Get langpair from preferences */
    GT.fn.getLangPair = function() {
        return [GT.prefs.getCharPref("from"), GT.prefs.getCharPref("to")];
    };
    
})();
