Components.utils.import("resource://gtranslate/gtranslate.js");

function test_gtranslate() {
  
  var api_url = GT.fn.getGoogleUrl("api","auto","en","Ceci est un « test »");
  var page_url = GT.fn.getGoogleUrl("page","auto","it","Ceci est un test !");
  var dict_url = GT.fn.getGoogleUrl("dict","fr","en","Ceci est un test.");
  
  do_check_eq(api_url, "http://ajax.googleapis.com/ajax/services/language/translate?v=1.0&format=text&langpair=auto%7Cen&q=Ceci%20est%20un%20%C3%82%C2%AB%C3%82%C2%A0test%C3%82%C2%A0%C3%82%C2%BB");
  do_check_eq(page_url, "http://translate.google.com/#auto%7Cit%7CCeci%20est%20un%20test%C3%82%C2%A0!");
  do_check_eq(dict_url, "http://www.google.com/dictionary?langpair=fr%7Cen&q=Ceci%20est%20un%20test.");
}

function test_prefs() {
  GT.fn.setLangPair("it","fr");
  var cur_langs = GT.fn.getLangPair();
  
  do_check_eq(cur_langs[0], "it");
  do_check_eq(cur_langs[1], "fr");
}
