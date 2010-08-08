Components.utils.import("resource://gtranslate/common.js");

function test_common_mozPrefs() {
   do_check_true(GT.mozPrefs instanceof Ci.nsIPrefService);
}

function test_common_langConf() {
   do_check_neq(GT.langConf, undefined);
   do_check_neq(GT.langConf.availableLangs_from, undefined);
   do_check_neq(GT.langConf.availableLangs_to, undefined);
   do_check_neq(GT.langConf.langDict, undefined);
}

function test_common_prefs() {
   do_check_true(GT.prefs instanceof Ci.nsIPrefBranch);
   do_check_eq(GT.prefs.getCharPref("from"), "auto");

   var getDefaultTo = GT.getDefaultTo;
   GT.getDefaultTo = function() { return "en"; };
   do_check_eq(GT.prefs.getCharPref("to"), "en");
   GT.getDefaultTo = getDefaultTo;

   do_check_true(GT.prefs.getBoolPref("detectpagelang"));
}
