googTransPrefs = Components.classes["@mozilla.org/preferences-service;1"]
                      .getService(Components.interfaces.nsIPrefService)
                      .getBranch("googTrans.");

if (!googTransPrefs.prefHasUserValue("langpair")) googTransPrefs.setCharPref("langpair","auto|en");
if (!googTransPrefs.prefHasUserValue("detectpagelang")) googTransPrefs.setBoolPref("detectpagelang",true);
if (!googTransPrefs.prefHasUserValue("detectlocale")) googTransPrefs.setBoolPref("detectlocale",true);

generalPrefs = Components.classes["@mozilla.org/preferences-service;1"]
		.getService(Components.interfaces.nsIPrefBranch);

var currentLocale = generalPrefs.getCharPref("general.useragent.locale");

window.addEventListener("load",googTransInit,false);

var xrequest = new XMLHttpRequest();
var selection = '';
var trans = '';
var last_selection = '';
var url = '';
var page_lang = '';

function dumpDebug(str) {
    var enableWindowDump = true;//GBB.gbbPrefs.getBoolPref("enableWindowDump");
    if (enableWindowDump)
        window.dump("[GTR] "+str+"\n");
}

function trim(str) {
    var x = str;
    x = x.replace(/^\s*(.*)/, "$1");
    x = x.replace(/(.*?)\s*$/, "$1");
    return x;
}

function googTransInit() {
    // here we localize description on startup :-)
    var googtransLocalizationPrefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.{aff87fa2-a58e-4edd-b852-0a20203c1e17}.");
    var str = Components.classes[ "@mozilla.org/supports-string;1" ].createInstance( Components.interfaces.nsISupportsString );
    str.data = document.getElementById("googtrans-strings").getString("GoogTransDescription");
    googtransLocalizationPrefs.setComplexValue( "description", Components.interfaces.nsISupportsString, str ); 
    document.getElementById("contentAreaContextMenu").addEventListener("popupshowing", ongoogTransPopup, false);
    
    loadLangList();
}

function loadLangList() {   
    fLangs = langConf.availableLangs_from.split(",");
    tLangs = langConf.availableLangs_to.split(",");
       
    for (f in fLangs) {
        if (fLangs[f]=='|') {
            m = document.createElement('menuseparator');        
        }else{
            m = document.createElement('menu');       
            m.setAttribute("label", document.getElementById("googtrans-strings").getString(langConf.langDict[fLangs[f]]+".label"));
            m.setAttribute("id", fLangs[f]);
            
            mp = document.createElement('menupopup');             
            m.appendChild(mp);
            
            for (t in tLangs) {
                if (fLangs[f] != tLangs[t]) {
                    mi = document.createElement('menuitem');
                    
                    mi.setAttribute("label", document.getElementById("googtrans-strings").getString(langConf.langDict[tLangs[t]]+".label"));
                    mi.setAttribute("id", fLangs[f]+"|"+tLangs[t]);
                    mi.setAttribute("type", "radio");
                    mi.setAttribute("name", "lp");
                    mi.addEventListener('command', function(event) { changeLangPair(this.id) }, false );
                    mp.appendChild(mi);
                }
            }
        }        
        document.getElementById('langpair_radiomenu').appendChild(m);
    }  
}

function ongoogTransPopup(event) {	
	if (event.target.id != 'contentAreaContextMenu') return;
	
    document.getElementById("translate_change").setAttribute('hidden', true);
	document.getElementById("translate_menu").setAttribute('disabled', true);           						  	           

    var popupnode = document.popupNode;
	var nodeLocalName = popupnode.localName.toLowerCase();

	// here is one localized alert string 
    var translateword = document.getElementById('googtrans-strings').getString("TranslateWord");

	if (aux = top.document.getElementById("content").contentDocument.getElementsByTagName('html')[0])
	   page_lang = top.document.getElementById("content").contentDocument.getElementsByTagName('html')[0].getAttribute('lang')

 	if (aux = popupnode.getAttribute('lang'))
	   page_lang = aux;

	if ((nodeLocalName == "textarea") || (nodeLocalName == "input" && popupnode.type == "text")) {
      selection = trim(popupnode.value.substring(popupnode.selectionStart, popupnode.selectionEnd));
			document.getElementById("translate_change").setAttribute('hidden', false);           						  	           
			document.getElementById("translate_change").setAttribute('disabled', true);           						  	           	           
	}else if (nodeLocalName == "img") {
        if (popupnode.title)
            selection = popupnode.title;
        else if (popupnode.alt)
            selection = popupnode.alt;
        else
    	   selection = '';
	}else {
        var focusedWindow = document.commandDispatcher.focusedWindow;
        selection = trim(focusedWindow.getSelection().toString());
	}

	if (selection != '') {
		document.getElementById("translate_main").hidden = false;
		document.getElementById("translateSeparator").hidden = false;
    if (selection.length > 23)
		 document.getElementById("translate_main").setAttribute('label',translateword+' "'+selection.substr(0,19) + '..."');
		else
		  document.getElementById("translate_main").setAttribute('label',translateword+ ' "'+selection+' "');
	}else{
		document.getElementById("translate_main").hidden = true;
		document.getElementById("translateSeparator").hidden = true;
	}
}

function openURL() {
	openNewTabWith(encodeURI(url), null, null, true);
}

function changeLangPair(new_langpair) {
    googTransPrefs.setCharPref("langpair",new_langpair) 
    Components.classes["@mozilla.org/preferences-service;1"].
    	getService(Components.interfaces.nsIPrefService).savePrefFile(null); 
    last_selection = '';
}

function checkMenuItem(langpair) {
    var element = document.getElementById('langpair_radiomenu');
    if (element.hasChildNodes()) {
        var menupopup = element.childNodes;
        for (var i = 0; i < menupopup.length; i++) {
            dumpDebug("| "+menupopup[i].getAttribute('id'));
            if (menupopup[i].hasChildNodes()) {
                var children = element.childNodes;
                for (var j = 0; j < children.length; j++) {
                    dumpDebug("|--> "+children[j].getAttribute('id'));
                    children[j].removeAttribute("checked");
                };
            };
        };
    };   
    document.getElementById(langpair).setAttribute("checked", "true");
}

function connect() {
    var langpair = googTransPrefs.getCharPref("langpair");  
    auto_langpair = ''; // The langpair obtained by using language autodetection
    
    var changelang = document.getElementById('googtrans-strings').getString("ChangeLanguages");
    		   
    langpair_v = langpair.split('|');
    if (page_lang == null)
        page_lang = '';
    
    page_lang = page_lang.toLowerCase();
  
    if (googTransPrefs.getBoolPref("detectpagelang")) {
        if (document.getElementById(page_lang+'|'+langpair_v[1])) {
            auto_langpair = page_lang+'|'+langpair_v[1];
            var str_aux = page_lang+'*|'+langpair_v[1];
        }
    }
    
    if (googTransPrefs.getBoolPref("detectlocale")) {
        to_lang = currentLocale.split('-');
        if (document.getElementById(langpair_v[0]+'|'+to_lang[0])) {
            auto_langpair = langpair_v[0]+'|'+to_lang[0];
            var str_aux = langpair_v[0]+'|'+to_lang[0]+'*';
        }
    }

    if ( (googTransPrefs.getBoolPref("detectpagelang")) && (googTransPrefs.getBoolPref("detectlocale")) ) {
        if (document.getElementById(page_lang+'|'+to_lang[0])) {
            auto_langpair = page_lang+'|'+to_lang[0];
            var str_aux = page_lang+'*|'+to_lang[0]+'*';
        }
    }

    if (document.getElementById(auto_langpair)) {
        langpair = auto_langpair;
        document.getElementById("langpair_menu").setAttribute('label',changelang+" ("+str_aux+")");
    }else{
        document.getElementById("langpair_menu").setAttribute('label',changelang+" ("+langpair+")");
    }
    
    checkMenuItem(langpair);

    if (selection != '') {
        if (selection != last_selection) {
            		
            var connectgoogle = document.getElementById('googtrans-strings').getString("ConnectToGoogle");
            document.getElementById("translate_menu").setAttribute('label',connectgoogle);    
            url = 'http://www.google.com/translate_t?text='+selection+'&langpair='+langpair+"&ie=UTF8";
            
            
            var strConnect = document.getElementById('googtrans-strings').getString("Connecting");
            window.status = strConnect+' '+url+'...';
            
            xrequest.onload = parseContent;
            xrequest.onerror = function () {      
                var connecterror = document.getElementById('googtrans-strings').getString("ConnectionError");
                window.status = connecterror; 
                document.getElementById("translate_menu").setAttribute('label',connecterror);
            };
                       
            xrequest.open("GET", url, true);
            xrequest.send(null);
     	}else{
			if (trans == "" || trans == selection) {
                   
                var notrans = document.getElementById('googtrans-strings').getString("NoTranslation");
                document.getElementById("translate_menu").setAttribute('label',notrans+' "'+selection+'"');
			}else {
                document.getElementById("translate_menu").setAttribute('label',trans);
                document.getElementById("translate_menu").setAttribute('oncommand', 'openURL()');
                document.getElementById("translate_menu").setAttribute('disabled', false);           						  	            
                document.getElementById("translate_change").setAttribute('disabled', false);           						  	            
            }
            window.status = '';
        }
    }
}

		
function parseContent() {
    window.status = '';
    last_selection = selection;	
    
    var result = xrequest.responseText;
    
    //var reg = new RegExp('<textarea\\s?[^>]*>([^>]*)<\\/textarea>');
    str = 'result_box\\s?[^>]*>([^>]*)<\\/div>';
    var reg = new RegExp(str);
	
    var str = new String(result);
    trans = str.match(reg)[1];
  
	if ((selection!="" && trans == "") || trans == selection) {  
        var notrans = document.getElementById('googtrans-strings').getString("NoTranslation");
        document.getElementById("translate_menu").setAttribute('label',notrans+' "'+selection+'"');
	}else{
        document.getElementById("translate_menu").setAttribute('label',trans);
        document.getElementById("translate_menu").setAttribute('oncommand', 'openURL()');
        document.getElementById("translate_menu").setAttribute('disabled', false);           						  	            
        document.getElementById("translate_change").setAttribute('disabled', false);           						  	            
	}
	selection = '';
}

function replaceText() {
    popupnode = document.popupNode;
    var iStart = popupnode.selectionStart;
    var iEnd = popupnode.selectionEnd;
    popupnode.value = popupnode.value.substring(0, iStart) + trans + popupnode.value.substring(iEnd, popupnode.value.length);
    popupnode.setSelectionRange(iStart, iStart + trans.length); 
}
