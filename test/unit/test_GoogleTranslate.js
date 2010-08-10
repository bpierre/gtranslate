Components.utils.import("resource://gtranslate/GoogleTranslate.js");

function test_mozPrefs() {
   do_check_true(GoogleTranslate.mozPrefs instanceof Ci.nsIPrefService);
}

function test_langConf() {
   do_check_neq(GoogleTranslate.langConf, undefined);
   do_check_neq(typeof(GoogleTranslate.langConf.availableLangs_from), "string");
   do_check_neq(typeof(GoogleTranslate.langConf.availableLangs_to), "string");
   do_check_neq(typeof(GoogleTranslate.langConf.langDict), "object");

   do_check_eq(GoogleTranslate.gid("toto"), "titi");
}

function test_prefs() {
   do_check_true(GoogleTranslate.prefs instanceof Ci.nsIPrefBranch);
   dump(GoogleTranslate.prefs.getCharPref("from"));
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

function test_translationRequest_success() {
    let langFrom = "en", langTo = "fr", text = "project";
    function success(translation) {
        do_check_eq(translation, "projet");
        do_test_finished();
    }
    function error(statusText) {
        do_check_true(false);
        do_test_finished();
    }
    GoogleTranslate.translationRequest(langFrom, langTo, text, success, error);
    do_test_pending();
}

function test_translationRequest_error() {
    let langFrom = "foo", langTo = "bar", text = "foo";
    function success(translation) {
        do_check_true(false);
        do_test_finished();
    }
    function error(statusText) {
        do_check_eq(statusText, "invalid translation language pair");
        do_test_finished();
    }
    GoogleTranslate.translationRequest(langFrom, langTo, text, success, error);
    do_test_pending();
}

