var googTransPrefs = Components.classes["@mozilla.org/preferences-service;1"].
                            getService(Components.interfaces.nsIPrefService).getBranch("googTrans.");
                            
var googTransSettings = 
{
	onLoad: function() 
	{
	    if (!googTransPrefs.prefHasUserValue("langpair")) googTransPrefs.setCharPref("langpair","de|en");
 	    this.langpair = document.getElementById("langpair");
	    this.langpair.value = googTransPrefs.getCharPref("langpair");

	    if (!googTransPrefs.prefHasUserValue("detectpagelang")) googTransPrefs.setBoolPref("detectpagelang",true);
 	    this.detectpagelang = document.getElementById("detectpagelang");
	    this.detectpagelang.checked = googTransPrefs.getBoolPref("detectpagelang");

	    if (!googTransPrefs.prefHasUserValue("detectlocale")) googTransPrefs.setBoolPref("detectlocale",true);
 	    this.detectlocale = document.getElementById("detectlocale");
	    this.detectlocale.checked = googTransPrefs.getBoolPref("detectlocale");

	},

	onAccept: function() 
	{
	   this.langpair = document.getElementById("langpair").value;
	   googTransPrefs.setCharPref("langpair",this.langpair)

	   this.detectpagelang = document.getElementById("detectpagelang").checked;
	   googTransPrefs.setBoolPref("detectpagelang",this.detectpagelang)

	   this.detectlocale = document.getElementById("detectlocale").checked;
	   googTransPrefs.setBoolPref("detectlocale",this.detectlocale)

	    Components.classes["@mozilla.org/preferences-service;1"].
        	getService(Components.interfaces.nsIPrefService).savePrefFile(null);
	},

	onCancel: function() {},


}