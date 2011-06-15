
/*
 * The UtilChrome global object is defined in UtilChrome.js which is
 * loaded from preferences.xul.
 */

Components.utils.import("resource://gesturegoogtrans/GoogleTranslate.js");

const Cc = Components.classes;
const Ci = Components.interfaces;

(function() {

  /* Langpair */
  var elts = {
    "langpair_from": UtilChrome.gid("langpair_from"),
    "langpair_to": UtilChrome.gid("langpair_to"),
    "strings": UtilChrome.gid("gesturegoogtrans-strings"),
	"font_color": UtilChrome.gid("font_color"),
  };
  
  /* Fill "from" menuitem */
  function fillFromLang() {
    
    var menu = UtilChrome.gid('lp_menupopup_from');
    var langs = GoogleTranslate.langConf.availableLangs_from.split(",");
    
    for (i in langs) {
      if (langs[i] !== '|') {
        var item = document.createElement('menuitem');
        var label = elts.strings.getString(
          GoogleTranslate.langConf.langDict[ langs[i] ] + ".label");
        
        item.setAttribute("label", label);
        item.setAttribute("value", langs[i]);
        
        menu.appendChild(item);
      }
    }
  };
  
  /* Fill "to" menuitem */
  function fillToLang() {
      
    var menu = UtilChrome.gid('lp_menupopup_to');
    var langs = GoogleTranslate.langConf.availableLangs_to.split(",");
    
    UtilChrome.emptyElt(menu);
    
    for (i in langs) {
      if (langs[i] !== elts.langpair_from.value) {
        
        var item = document.createElement('menuitem');
        var label = elts.strings.getString(
            GoogleTranslate.langConf.langDict[ langs[i] ] + ".label");
        
        item.setAttribute("label", label);
        item.setAttribute("value", langs[i]);
        
        menu.appendChild(item);
      }
    }
    
    if (elts.langpair_to.value === elts.langpair_from.value) {
      var defaultTo = GoogleTranslate.getDefaultTo();
      
      if (defaultTo !== elts.langpair_from.value) {
          elts.langpair_to.value = defaultTo;
          
      } else {
          elts.langpair_to.value = menu.firstChild.value;
      }
    }
  };

 function fillFontcolor(){	
	this.mozPrefs = Cc["@mozilla.org/preferences-service;1"].getService(
        Ci.nsIPrefService);
    let prefs = this.prefs = this.mozPrefs.getBranch("googTrans.");
   	prefs.setCharPref("fontColor", elts.font_color.value);
 };
  
  /* Init preferences */
  function initPrefs() {
      
      fillFromLang();
      elts.langpair_from.value = GoogleTranslate.prefs.getCharPref("from");
      elts.langpair_from.addEventListener("command", function() {
          fillToLang();
      }, false);
      
      fillToLang();
      elts.langpair_to.value = GoogleTranslate.prefs.getCharPref("to");

      elts.font_color.addEventListener("command", function() {
          fillFontcolor();
      }, false);

      this.mozPrefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);
	  let prefs = this.prefs = this.mozPrefs.getBranch("googTrans.");
	  var fontColorSelected = prefs.getCharPref("fontColor");
	  if(fontColorSelected === 'white'){
		elts.font_color.value = 'white';
	  } else {
		elts.font_color.value = 'black';
	  }
  };
  
  initPrefs();
})();
