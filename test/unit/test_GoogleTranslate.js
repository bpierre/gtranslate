Components.utils.import("resource://gtranslate/GoogleTranslate.js");

function test_mozPrefs() {
   do_check_true(GoogleTranslate.mozPrefs instanceof Ci.nsIPrefService);
}

function test_langConf() {
   do_check_eq(typeof(GoogleTranslate.langConf), "object");
   do_check_eq(typeof(GoogleTranslate.langConf.availableLangs_from), "string");
   do_check_eq(typeof(GoogleTranslate.langConf.availableLangs_to), "string");
   do_check_eq(typeof(GoogleTranslate.langConf.langDict), "object");
}

function test_prefs() {
   do_check_true(GoogleTranslate.prefs instanceof Ci.nsIPrefBranch);
   do_check_eq(GoogleTranslate.prefs.getCharPref("from"), "auto");

   var getDefaultTo = GoogleTranslate.getDefaultTo;
   GoogleTranslate.getDefaultTo = function() { return "en"; };
   do_check_eq(GoogleTranslate.prefs.getCharPref("to"), "en");
   GoogleTranslate.getDefaultTo = getDefaultTo;

   do_check_true(GoogleTranslate.prefs.getBoolPref("detectpagelang"));
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
                "http://ajax.googleapis.com/ajax/services/language/translate" +
                "?v=1.0&format=text&langpair=en%7Cfr&q=project");
    url = GoogleTranslate.getGoogleUrl("page", langFrom, langTo, text);
    do_check_eq(url,
                "http://translate.google.com/#en%7Cfr%7Cproject");
    url = GoogleTranslate.getGoogleUrl("dict", langFrom, langTo, text);
    do_check_eq(url,
                "http://www.google.com/dictionary?langpair=en%7Cfr&q=project");
}
