Components.utils.import("resource://gtranslate/GoogleTranslate.js");

function test_lang() {
    do_check_eq(typeof(GoogleTranslate.langConf), "object");
    do_check_eq(typeof(GoogleTranslate.langConf.availableLangs_from), "string");
    do_check_eq(typeof(GoogleTranslate.langConf.availableLangs_to), "string");
    do_check_eq(typeof(GoogleTranslate.langConf.langDict), "object");
}

function test_init() {

    let gTranslatePrefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch("googTrans.");

    // Change getDefaultTo to always get "en"
    let _getDefaultTo = GoogleTranslate.getDefaultTo;
    GoogleTranslate.getDefaultTo = function() { return "en"; };
    gTranslatePrefs.deleteBranch("");
    GoogleTranslate.init();

    do_check_true(GoogleTranslate._console instanceof Ci.nsIConsoleService);
    do_check_true(GoogleTranslate.mozPrefs instanceof Ci.nsIPrefService);
    do_check_true(GoogleTranslate.prefs instanceof Ci.nsIPrefBranch);
    do_check_eq(GoogleTranslate.prefs.getCharPref("from"), "auto");
    do_check_eq(GoogleTranslate.prefs.getCharPref("to"), "en");

    // Reinit GoogleTranslate with initial getDefaultTo
    GoogleTranslate.getDefaultTo = _getDefaultTo;
    gTranslatePrefs.deleteBranch("");
    GoogleTranslate.init();
}

function test_setLangPair() {
    let from = GoogleTranslate.prefs.getCharPref("from");
    let to = GoogleTranslate.prefs.getCharPref("to");

    GoogleTranslate.setLangPair("fr", "en");

    do_check_eq(GoogleTranslate.prefs.getCharPref("from"), "fr");
    do_check_eq(GoogleTranslate.prefs.getCharPref("to"), "en");

    GoogleTranslate.prefs.setCharPref("from", from);
    GoogleTranslate.prefs.setCharPref("to", to);
}

function test_getLangPair() {
    let from = GoogleTranslate.prefs.getCharPref("from");
    let to = GoogleTranslate.prefs.getCharPref("to");

    GoogleTranslate.prefs.setCharPref("from", "fr");
    GoogleTranslate.prefs.setCharPref("to", "en");

    let pair = GoogleTranslate.getLangPair();

    do_check_eq(pair[0], "fr");
    do_check_eq(pair[1], "en");

    GoogleTranslate.prefs.setCharPref("from", from);
    GoogleTranslate.prefs.setCharPref("to", to);
}

function test_getGoogleUrl() {
    let langFrom = "en", langTo = "fr", text = "project", url;
    url = GoogleTranslate.getGoogleUrl("api", langFrom, langTo, text);
    do_check_eq(url,
                "https://ajax.googleapis.com/ajax/services/language/translate" +
                "?v=1.0&format=text&langpair=en%7Cfr&q=project");
    url = GoogleTranslate.getGoogleUrl("page", langFrom, langTo, text);
    do_check_eq(url,
                "http://translate.google.com/#en%7Cfr%7Cproject");
    url = GoogleTranslate.getGoogleUrl("dict", langFrom, langTo, text);
    do_check_eq(url,
                "http://www.google.com/dictionary?langpair=en%7Cfr&q=project");
}
