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

function test_getGoogleUrl() {
    let langFrom = "en", langTo = "fr", text = "project", url;
    url = GoogleTranslate.getGoogleUrl("api", langFrom, langTo, text);
    do_check_eq(url,
                "http://ajax.googleapis.com/ajax/services/language/translate" +
                "?v=1.0&format=text&langpair=en%7Cfr&q=project");
}
