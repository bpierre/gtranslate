let EXPORTED_SYMBOLS = ["GT"];

const Cc = Components.classes;
const Ci = Components.interfaces;

let GT = {

    // Preferences
    mozPrefs: Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService),

    // Languages
    langConf: {
        availableLangs_from: "auto,|,af,sq,ar,be,bg,ca,zh-CN,hr,cs,da,nl,en,et,tl,fi,fr,gl,de,el,iw,hi,hu,is,id,ga,it,ja,ko,lv,lt,mk,ms,mt,no,fa,pl,pt,ro,ru,sr,sk,sl,es,sw,sv,th,tr,uk,vi,cy,yi",
        availableLangs_to: "af,sq,ar,be,bg,ca,zh-CN,zh-TW,hr,cs,da,nl,en,et,tl,fi,fr,gl,de,el,iw,hi,hu,is,id,ga,it,ja,ko,lv,lt,mk,ms,mt,no,fa,pl,pt,ro,ru,sr,sk,sl,es,sw,sv,th,tr,uk,vi,cy,yi",
        langDict: {
            "auto" : "auto",
            "af" : "afrikaans",
            "sq" : "albanian",
            "ar" : "arabic",
            "be" : "belarusian",
            "bg" : "bulgarian",
            "ca" : "catalan",
            "zh-CN" : "chineseS",
            "zh-TW" : "chineseT",
            "hr" : "croatian",
            "cs" : "czech",
            "da" : "danish",
            "nl" : "dutch",
            "en" : "english",
            "et" : "estonian",
            "tl" : "filipino",
            "fi" : "finnish",
            "fr" : "french",
            "gl" : "galician",
            "de" : "german",
            "el" : "greek",
            "iw" : "hebrew",
            "hi" : "hindi",
            "hu" : "hungarian",
            "is" : "icelandic",
            "id" : "indonesian",
            "ga" : "irish",
            "it" : "italian",
            "ja" : "japanese",
            "ko" : "korean",
            "lv" : "latvian",
            "lt" : "lithuanian",
            "mk" : "macedonian",
            "ms" : "malay",
            "mt" : "maltese",
            "no" : "norwegian",
            "fa" : "persian",
            "pl" : "polish",
            "pt" : "portuguese",
            "ro" : "romanian",
            "ru" : "russian",
            "sr" : "serbian",
            "sk" : "slovak",
            "sl" : "slovenian",
            "es" : "spanish",
            "sw" : "swahili",
            "sv" : "swedish",
            "th" : "thai",
            "tr" : "turkish",
            "uk" : "ukrainian",
            "vi" : "vietnamese",
            "cy" : "welsh",
            "yi" : "yiddish"
        }
    },
    
    // Default "to" lang
    getDefaultTo: function() {
        var currentLocale = GT.mozPrefs.getBranch("general.").getCharPref("useragent.locale");
        if (GT.langConf.availableLangs_to.indexOf(currentLocale) !== -1) {
            return currentLocale;
        } else {
            return "en";
        }
    },
    
    // getElementById shortcut
    gid: function(id) {
        return document.getElementById(id);
    },
    
    // debug
    log: function(msg) {
        if (!!window.dump) {
            window.dump("[GT] " + msg + "\n");
        }
        Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService).logStringMessage(msg);
    }
};

GT.prefs = GT.mozPrefs.getBranch("googTrans.");

// set default preferences
if (!GT.prefs.prefHasUserValue("from")) {
    GT.prefs.setCharPref("from", "auto");
}

if (!GT.prefs.prefHasUserValue("to")) {
    GT.prefs.setCharPref("to", GT.getDefaultTo());
}

if (!GT.prefs.prefHasUserValue("detectpagelang")) {
    GT.prefs.setBoolPref("detectpagelang", true);
}

