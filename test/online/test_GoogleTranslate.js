Components.utils.import("resource://gtranslate/GoogleTranslate.js");

function test_translationRequest_success() {
    let langFrom = "en", langTo = "fr", text = "project";
    function success(translation) {
        do_check_eq(translation, "projet");
        // just check that we can access "document" in the callback
        do_check_true(typeof(document.createElement) === "function");
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

