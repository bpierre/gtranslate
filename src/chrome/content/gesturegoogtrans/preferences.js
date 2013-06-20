// Whole-script strict mode syntax
"use strict";

Components.utils.import("resource://gesturegoogtrans/GoogleTranslate.js");

const Cc = Components.classes;
const Ci = Components.interfaces;

(function() {

  /* Langpair */
  var elts = {
    "langpair_from": document.getElementById("langpair_from"),
    "langpair_to": document.getElementById("langpair_to"),
    "strings": document.getElementById("gesturegoogtrans-strings"),
	"font_color": document.getElementById("font_color"),
	"detectlanguage": document.getElementById("detectlanguage"),
	"detectlanguageapikey": document.getElementById("detectlanguageapikey"),
	"dhnotify": document.getElementById("dhnotify"),
	"timeout": document.getElementById("timeout")
  };
  
  /* Fill "from" menuitem */
  function fillFromLang() {
    
    var menu = document.getElementById('lp_menupopup_from');
    var langs = GoogleTranslate.langConf.availableLangs_from.split(",");
	var i;
    
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
      
    var menu = document.getElementById('lp_menupopup_to');
    var langs = GoogleTranslate.langConf.availableLangs_to.split(",");
    var i;
	
    while (menu.firstChild) {
      menu.removeChild(menu.firstChild);
    }
    
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
 
 function filldetectlanguage(){	
	this.mozPrefs = Cc["@mozilla.org/preferences-service;1"].getService(
        Ci.nsIPrefService);
    let prefs = this.prefs = this.mozPrefs.getBranch("googTrans.");
   	prefs.setBoolPref("detectlanguage", elts.detectlanguage.value);
 };
 
 function filldetectlanguageapikey(){	
	this.mozPrefs = Cc["@mozilla.org/preferences-service;1"].getService(
        Ci.nsIPrefService);
    let prefs = this.prefs = this.mozPrefs.getBranch("googTrans.");
   	prefs.setCharPref("detectlanguageapikey", elts.detectlanguageapikey.value);
 };
 
 function filldhnotify(){	
	this.mozPrefs = Cc["@mozilla.org/preferences-service;1"].getService(
        Ci.nsIPrefService);
    let prefs = this.prefs = this.mozPrefs.getBranch("googTrans.");
   	prefs.setBoolPref("dhnotify", elts.dhnotify.value);
 };
 
 function filltimout(){	
	this.mozPrefs = Cc["@mozilla.org/preferences-service;1"].getService(
        Ci.nsIPrefService);
    let prefs = this.prefs = this.mozPrefs.getBranch("googTrans.");
   	prefs.setIntPref("timeout", elts.timeout.value);
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

      //this.mozPrefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);
	  //let prefs = this.prefs = this.mozPrefs.getBranch("googTrans.");
	  var fontColorSelected = GoogleTranslate.prefs.getCharPref("fontColor");
	  if(fontColorSelected === 'white'){
		elts.font_color.value = 'white';
	  } else {
		elts.font_color.value = 'black';
	  }
	  
	  elts.detectlanguage.addEventListener("command", function() {
          filldetectlanguage();
      }, false)
	  
	  var detectlanguage = GoogleTranslate.prefs.getBoolPref("detectlanguage");
	  elts.detectlanguage=detectlanguage;
	  
	  elts.detectlanguageapikey.addEventListener("command", function() {
          filldetectlanguageapikey();
      }, false);
	  
	  var detectlanguageapikey = GoogleTranslate.prefs.getCharPref("detectlanguageapikey");
	  if (detectlanguageapikey==='') detectlanguageapikey="demo";
	  elts.detectlanguageapikey=detectlanguageapikey;
	  
	  elts.dhnotify.addEventListener("command", function() {
          filldhnotify();
      }, false)
	  
	  var dhnotify = GoogleTranslate.prefs.getBoolPref("dhnotify");
	  elts.dhnotify=dhnotify;
	  
	  elts.timeout.addEventListener("command", function() {
          filltimout();
      }, false)
	  
	  var timeout = GoogleTranslate.prefs.getIntPref("timeout");
	  elts.timeout=timeout;
	  
  };
  
  initPrefs();
})();
