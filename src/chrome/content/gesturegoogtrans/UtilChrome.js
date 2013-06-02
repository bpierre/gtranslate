if ("undefined" === typeof(UtilChrome)) {

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
            Components.classes["@mozilla.org/consoleservice;1"]
              .getService(Components.interfaces.nsIConsoleService)
              .logStringMessage(msg);
        },
        
        // remove all the children of an element
        emptyElt: function(elt) {
            while (elt.firstChild) {
              elt.removeChild(elt.firstChild);
            }
        }
    };
}
