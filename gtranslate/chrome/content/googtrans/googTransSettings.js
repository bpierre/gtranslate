var googTransPrefs = Components.classes["@mozilla.org/preferences-service;1"].
                            getService(Components.interfaces.nsIPrefService).getBranch("googTrans.");
							
var googTransSettings = {
    
    loadLangList_from: function() {
        var element = document.getElementById('lp_menupopup_from');
        while (element.firstChild) {
          element.removeChild(element.firstChild);
        }
        
        fLangs = langConf.availableLangs_from.split(",");
		
        for (f in fLangs) {
            if (fLangs[f]!='|') {
                mi = document.createElement('menuitem');
                mi.setAttribute("label", document.getElementById("googtrans-strings").getString(langConf.langDict[fLangs[f]]+".label"));
                mi.setAttribute("value", fLangs[f]);
				
                document.getElementById('lp_menupopup_from').appendChild(mi);
            }
        }
    },
	
    loadLangList_to: function() {
        var element = document.getElementById('lp_menupopup_to');
        while (element.firstChild) {
          element.removeChild(element.firstChild);
        }
		
        tLangs = langConf.availableLangs_to.split(",");
		
        for (t in tLangs) {
            if (tLangs[t]!=document.getElementById('langpair_from').value) {
                mi = document.createElement('menuitem');
                mi.setAttribute("label", document.getElementById("googtrans-strings").getString(langConf.langDict[tLangs[t]]+".label"));
                mi.setAttribute("value", tLangs[t]);
				
                document.getElementById('lp_menupopup_to').appendChild(mi);
            }
        }
    },
	
	onLoad: function() {
        if (!googTransPrefs.prefHasUserValue("langpair")) googTransPrefs.setCharPref("langpair","de|en");
        langpairPref = googTransPrefs.getCharPref("langpair").split('|');
        
        this.loadLangList_from();
        this.langpair_from = document.getElementById("langpair_from");
        this.langpair_from.value = langpairPref[0];
        
        this.loadLangList_to();
        this.langpair_to = document.getElementById("langpair_to");
        this.langpair_to.value = langpairPref[1];
        
	    if (!googTransPrefs.prefHasUserValue("detectpagelang")) googTransPrefs.setBoolPref("detectpagelang",true);
 	    this.detectpagelang = document.getElementById("detectpagelang");
	    this.detectpagelang.checked = googTransPrefs.getBoolPref("detectpagelang");
		
	    if (!googTransPrefs.prefHasUserValue("detectlocale")) googTransPrefs.setBoolPref("detectlocale",true);
 	    this.detectlocale = document.getElementById("detectlocale");
	    this.detectlocale.checked = googTransPrefs.getBoolPref("detectlocale");
        
	},
	
	onAccept: function() {
        this.langpair_from = document.getElementById("langpair_from").value;
        this.langpair_to = document.getElementById("langpair_to").value;
        
        googTransPrefs.setCharPref("langpair",this.langpair_from+"|"+this.langpair_to)
        
        this.detectpagelang = document.getElementById("detectpagelang").checked;
        googTransPrefs.setBoolPref("detectpagelang",this.detectpagelang)
        
        this.detectlocale = document.getElementById("detectlocale").checked;
        googTransPrefs.setBoolPref("detectlocale",this.detectlocale)
        
        Components.classes["@mozilla.org/preferences-service;1"].
            getService(Components.interfaces.nsIPrefService).savePrefFile(null);
	},
	
	onCancel: function() {}
}