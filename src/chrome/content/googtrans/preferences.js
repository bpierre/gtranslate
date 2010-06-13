(function() {
    
    /* Main object */
    var GT = net.pierrebertet.GT;
    
    /* Langpair */
    var elts = {
        "langpair_from": GT.gid("langpair_from"),
        "langpair_to": GT.gid("langpair_to"),
        "strings": GT.gid("googtrans-strings")
    };
    
    /* Fill "from" menuitem */
    function fillFromLang() {
        
	var menu = GT.gid('lp_menupopup_from');
        var langs = GT.langConf.availableLangs_from.split(",");
        
        for (i in langs) {
            if (langs[i] !== '|') {
                
                var item = document.createElement('menuitem');
                var label = elts.strings.getString(GT.langConf.langDict[ langs[i] ] + ".label");
                
                item.setAttribute("label", label);
                item.setAttribute("value", langs[i]);
                
                menu.appendChild(item);
            }
        }
    };
    
    /* Fill "to" menuitem */
    function fillToLang() {
        
        var menu = GT.gid('lp_menupopup_to');
        var langs = GT.langConf.availableLangs_to.split(",");
        
        emptyElt(menu);
        
        for (i in langs) {
            if (langs[i] !== elts.langpair_from.value) {
                
                var item = document.createElement('menuitem');
                var label = elts.strings.getString(GT.langConf.langDict[ langs[i] ] + ".label");
                
                item.setAttribute("label", label);
                item.setAttribute("value", langs[i]);
                
                menu.appendChild(item);
            }
        }
        
        if (elts.langpair_to.value === elts.langpair_from.value) {
            
            var defaultTo = GT.getDefaultTo();
            
            if (defaultTo !== elts.langpair_from.value) {
                elts.langpair_to.value = defaultTo;
                
            } else {
                elts.langpair_to.value = menu.firstChild.value;
            }
        }
    };
    
    /* Empty an element */
    function emptyElt(elt) {
        while (elt.firstChild) {
          elt.removeChild(elt.firstChild);
        }
    };
    
    /* Init preferences */
    function initPrefs() {
        
        fillFromLang();
        elts.langpair_from.value = GT.prefs.getCharPref("from");
        elts.langpair_from.addEventListener("command", function() {
            fillToLang();
        }, false);
        
        fillToLang();
        elts.langpair_to.value = GT.prefs.getCharPref("to");
    };
    
    
    initPrefs();
})();