// Whole-script strict mode syntax
"use strict";

Components.utils.import("resource://gesturegoogtrans/JSON.js");

let EXPORTED_SYMBOLS = ["GoogleTranslate"];

const Cc = Components.classes;
const Ci = Components.interfaces;

let _availableLangs_from = ["auto,|,af,sq,ar,be,bg,ca,zh-CN,hr,cs,da,nl,en,et,",
                            "tl,fi,fr,gl,de,el,iw,hi,hu,is,id,ga,it,ja,ko,lv,",
                            "lt,mk,ms,mt,no,fa,pl,pt,ro,ru,sr,sk,sl,es,sw,sv,",
                            "th,tr,uk,vi,cy,yi,hy,az,eu,bn,eo,ka,gu,ht,kn,la,ta,te"].join("");
let _availableLangs_to =   ["af,sq,ar,be,bg,ca,zh-CN,zh-TW,hr,cs,da,nl,en,et,",
                            "tl,fi,fr,gl,de,el,iw,hi,hu,is,id,ga,it,ja,ko,lv,",
                            "lt,mk,ms,mt,no,fa,pl,pt,ro,ru,sr,sk,sl,es,sw,sv,",
                            "th,tr,uk,vi,cy,yi,hy,az,eu,bn,eo,ka,gu,ht,kn,la,ta,te"].join("");
let _langDict = {
    "auto": "auto",
    "af": "afrikaans",
    "sq": "albanian",
    "ar": "arabic",
    "be": "belarusian",
    "bg": "bulgarian",
    "ca": "catalan",
    "zh-CN": "chineseS",
    "zh-TW": "chineseT",
    "hr": "croatian",
    "cs": "czech",
    "da": "danish",
    "nl": "dutch",
    "en": "english",
    "et": "estonian",
    "tl": "filipino",
    "fi": "finnish",
    "fr": "french",
    "gl": "galician",
    "de": "german",
    "el": "greek",
    "iw": "hebrew",
    "hi": "hindi",
    "hu": "hungarian",
    "is": "icelandic",
    "id": "indonesian",
    "ga": "irish",
    "it": "italian",
    "ja": "japanese",
    "ko": "korean",
    "lv": "latvian",
    "lt": "lithuanian",
    "mk": "macedonian",
    "ms": "malay",
    "mt": "maltese",
    "no": "norwegian",
    "fa": "persian",
    "pl": "polish",
    "pt": "portuguese",
    "ro": "romanian",
    "ru": "russian",
    "sr": "serbian",
    "sk": "slovak",
    "sl": "slovenian",
    "es": "spanish",
    "sw": "swahili",
    "sv": "swedish",
    "th": "thai",
    "tr": "turkish",
    "uk": "ukrainian",
    "vi": "vietnamese",
    "cy": "welsh",
    "yi": "yiddish",
	"hy": "armenian",
	"az": "azerbaijani",
	"eu": "basque",
	"bn": "bengali",
	"eo": "esperanto",
	"ka": "georgian",
	"gu": "gujarati",
	"ht": "haitianC",
	"kn": "kannada",
	"la": "latin",
	"ta": "tamil",
	"te": "telugu"};
	
if ("undefined" === typeof(GoogleTranslate)) {

    var GoogleTranslate = {

        // languages
        langConf: {
            availableLangs_from: _availableLangs_from,
            availableLangs_to: _availableLangs_to,
            langDict: _langDict
        },

        init: function() {
            this._console = Cc["@mozilla.org/consoleservice;1"].getService(
                Ci.nsIConsoleService);
            this.mozPrefs = Cc["@mozilla.org/preferences-service;1"].getService(
                Ci.nsIPrefService);
            let prefs = this.prefs = this.mozPrefs.getBranch("googTrans.");
            
			// set default preferences
            if (!prefs.prefHasUserValue("from")) {
                prefs.setCharPref("from", "auto");  //must change to an real language to obtain reverse translation. 
            }
            if (!prefs.prefHasUserValue("to")) {
                prefs.setCharPref("to", this.getDefaultTo());
            }
			if (!prefs.prefHasUserValue("fontColor")) {
                prefs.setCharPref("fontColor", "black");
            }
			if (!prefs.prefHasUserValue("dhnotify")) {  //additional Notification as Door-Hanger-Notification
			    prefs.setBoolPref("dhnotify", true);
			}
			if (!prefs.prefHasUserValue("timout")) {
                prefs.setIntPref("timeout", 10);  //Timeout translation text apperance in addon-bar and Door-Hanger-Notification
            }
			if (!prefs.prefHasUserValue("detectlanguage")) {
                prefs.setBoolPref("detectlanguage", true);  //detect language main switch, must be activated to obtain reverse translation too.
            }
			if (!prefs.prefHasUserValue("detectlanguageapikey")) {
				prefs.setCharPref("detectlanguageapikey", "demo");  //register your own apikey from detectlanguage.com for free. (demo is limited)
			}
			if (!prefs.prefHasUserValue("Log2Console")) {
                prefs.setBoolPref("Log2Console", false);  //debug-log to error-console
            }
        },

        // log a message to the Error Console
        log: function(msg) {
            this._console.logStringMessage(msg);
        },
		
		// not implemented yet, test purpose only
		keyPressed: function() {
			if (this.getLog2Console()) this.log('GoogleTranslate.keyPressed');
		},

        // get the default "to" lang
        getDefaultTo: function() {
            var currentLocale = this.mozPrefs.getBranch("general.").getCharPref(
                "useragent.locale");
            if (this.langConf.availableLangs_to.indexOf(currentLocale) !== -1) {
                return currentLocale;
            } else {
                return "en";
            }
        },
		
        translationRequest: function(langFrom, langTo, textToTranslate, onLoadFn, onErrorFn) {
           
		   var url = this.getGoogleUrl("api", langFrom, langTo, textToTranslate);
		   
		   if (this.getLog2Console()) this.log('TextToTranslate:' + textToTranslate);
		   
           var req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]
                            .createInstance(Ci.nsIXMLHttpRequest);
						
		   if (this.getLog2Console()) this.log(url);

           req.addEventListener("load", (function() {
               if (req.status !== 200) {
                   onErrorFn(req.statusText);
                   return;
               }

               //example-response:
			   //{"sentences":[{"trans":"Beer and sausage that I like very much","orig":"Bier und Wurst das mag ich sehr","translit":"","src_translit":""}],"src":"de","server_time":87}
			   var response = JSON.parse(req.responseText);

               if (!response.sentences) {
                   onErrorFn(req.responseText);
                   return;
               }

               var translatedText = '';
               for(var i in response.sentences) {
                   translatedText += response.sentences[i].trans;
               }
               onLoadFn(translatedText, response.src);
           }), false);

           req.addEventListener("error", onErrorFn, false);

           var m;
           if(url.length > 256 && (m = url.match(/^(https?:\/\/[^\?]+)\?(.+)$/))) {
               /* If the whole URL contains too many characters, the server
                * will return a 414 HTTP status code, so request parameters
                * have to be put in the request body in order to avoid that.
                */

               req.open("POST", m[1], true);
               /* XXX: request headers aren't supposed to be set once the
                *      connection is opened, but an exception is thrown if done
                *      before.
                */
               req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
               // NOTE: FF will add the correct charset to the Content-Type header.
               req.send(m[2]);
           } else {
               req.open("GET", url, true);
               req.send(null);
           }
       },

       getGoogleUrl: function(urlType, langFrom, langTo, text, curDetectedLang) {

           var formattedUrl = '';
		   if (this.getLog2Console()) this.log('getGoogleUrl: ' + urlType + ' ' + langFrom + ' -> ' + langTo + ' curDetectedLang=' + curDetectedLang);

           switch (urlType) {
                // Google Translate API > JSON
                case "api":
                    formattedUrl = 'http://translate.google.com/translate_a/t?client=gesturetranslate';
					langFrom="auto";  //ALWAYS use "auto", trusting google doing the right translation (if detectlanguage is "active", langFrom would be very reliable too)
					formattedUrl += '&sl=' + langFrom;
					formattedUrl += '&tl=' + langTo;
					formattedUrl += '&text=' + encodeURIComponent(text);
                    break;
                // Google Translate page
                case "page":
					if (langTo==curDetectedLang) langTo=this.getLangPair()[0]; //reverse/inverse translation
					langFrom="auto";  //ALWAYS use "auto", trusting google doing the right translation
                    formattedUrl = 'http://translate.google.com/#' + langFrom + '%7C' + langTo + '%7C' + encodeURIComponent(text);
                    break;
            }

            return formattedUrl;
        },

        // remove the whitespace from the beginning and end of a string (thanks jQuery ;-)
        trim: function(str) {
            return (str || "").replace(/^\s+|\s+$/g, "");
        },

        // set a new langpair in preferences
        setLangPair: function(langFrom, langTo) {
            this.prefs.setCharPref("from", langFrom);
            this.prefs.setCharPref("to", langTo);
            this.mozPrefs.savePrefFile(null);
        },

        // get langpair from preferences
        getLangPair: function() {
            return [this.prefs.getCharPref("from"), this.prefs.getCharPref("to")];
        },
		
		// INI - Patch for Gesture Translate by @pablocantero
		getFontColor: function() {
			var fontColorSelected = "black";
			if (this.prefs.prefHasUserValue("fontColor")) {
			  fontColorSelected = this.prefs.getCharPref("fontColor");
			}
			return fontColorSelected;
		},
		// END - Patch for Gesture Translate by @pablocantero
		
		getDetectLanguage: function() {
			var detectlanguage=true;
			if (this.prefs.prefHasUserValue("detectlanguage")) {
			  detectlanguage = this.prefs.getBoolPref("detectlanguage");
			}
			return detectlanguage;
		},
		
		getDetectLanguageApiKey: function() {
			var detectlanguageapikey="demo";
			if (this.prefs.prefHasUserValue("detectlanguageapikey")) {
			  detectlanguageapikey = this.prefs.getCharPref("detectlanguageapikey");
			  if (detectlanguageapikey == "") detectlanguageapikey="demo";
			}
			return detectlanguageapikey;
		},
		
		getDHNotify: function() {
			var dhnotify=true;
			if (this.prefs.prefHasUserValue("dhnotify")) {
			  dhnotify = this.prefs.getBoolPref("dhnotify");
			}
			return dhnotify;
		},
		
		getTimeOut: function() {
			var timeout=10;
			if (this.prefs.prefHasUserValue("timeout")) {
			  timeout = this.prefs.getIntPref("timeout");
			}
			timeout=parseInt(timeout,10);
			if (timeout<1) timeout=1;
			if (timeout>120) timeout=120;
			return timeout;
		},
		
		getLog2Console: function() {
			var Log2Console=false;
			if (this.prefs.prefHasUserValue("Log2Console")) {
				Log2Console = this.prefs.getBoolPref("Log2Console");
			}
			return Log2Console;
		}
		
    };

    (function() {
        this.init();
    }).apply(GoogleTranslate);
}

