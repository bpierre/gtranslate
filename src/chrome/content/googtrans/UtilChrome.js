const Cc = Components.classes;
const Ci = Components.interfaces;

if ("undefined" === UtilChrome) {

    var UtilChrome = {
        // getElementById shortcut
        gid: function(id) {
            return document.getElementById(id);
        },

        // debug
        log: function(msg) {
            if (!!window.dump) {
                window.dump("[GoogleTranslate] " + msg + "\n");
            }
            Cc["@mozilla.org/consoleservice;1"].getService(
                Ci.nsIConsoleService).logStringMessage(msg);
        },

    };
}
