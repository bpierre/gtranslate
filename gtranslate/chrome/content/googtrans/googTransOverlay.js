(function() {
    
    /* Main object */
    var GT = net.pierrebertet.GT;
    
    // Global vars
    var selection = '';
    var lastSelection = '';
    var pageLang = '';
    
    var curDetectedLang = "";
    var curTranslation = '';
    
    // XUL elements
    var elements = {};
    
    // On window load
    window.addEventListener("load", function() {
        
        // XUL elements
        elements["gtranslate_popup"] = document.getElementById("gtranslate_popup");
        elements["gtranslate_strings"] = document.getElementById("gtranslate_strings");
        elements["gtranslate_separator"] = document.getElementById("gtranslate_separator");
        elements["gtranslate_main"] = document.getElementById("gtranslate_main");
        elements["gtranslate_result"] = document.getElementById("gtranslate_result");
        elements["gtranslate_replace"] = document.getElementById("gtranslate_replace");
        elements["gtranslate_langpair_separator"] = document.getElementById("gtranslate_langpair_separator");
        elements["gtranslate_langpair_main"] = document.getElementById("gtranslate_langpair_main");
        elements["gtranslate_langpair_popup"] = document.getElementById("gtranslate_langpair_popup");
        elements["gtranslate_dict"] = document.getElementById("gtranslate_dict");
        elements["gtranslate_langpairs"] = {};
        
        // Events
        initEvents();
        
        // Load langpairs list
        loadLangList();
        
    }, false);
    
    function initEvents() {
        
        // Right click
        document.getElementById("contentAreaContextMenu").addEventListener("popupshowing", onGtransPopup, false);
        
        // Init translate
        elements["gtranslate_popup"].addEventListener("popupshowing", initTranslate, false);
        
        // Open dictionay
        elements["gtranslate_dict"].addEventListener("command", openDict, false);
        
        // Replace with translation
        elements["gtranslate_replace"].addEventListener("command", replaceText, false);
        
        // Open Google Translate in a new tab
        elements["gtranslate_result"].addEventListener("command", openPage, false);
    }
    
    // On right click event
    function onGtransPopup(event) {
        
        if (event.target.id != 'contentAreaContextMenu')  {
            return;
        }
        
        elements["gtranslate_dict"].setAttribute("disabled", (GT.fn.getLangPair()[0] === "auto"));
        elements["gtranslate_replace"].setAttribute('hidden', true);
        elements["gtranslate_result"].setAttribute('disabled', true);
        
        curDetectedLang = "";
        
        var popupnode = document.popupNode;
        
        // Localized string : "Translate..."
        var translateWord = elements["gtranslate_strings"].getString("TranslateWord");
        
        // Detect lang
        pageLang = detectLang(popupnode);
        
        // Get and trim current selection
        selection = GT.fn.trim(getSelection(popupnode));
        
        // Show and update (eventually with a substr) gTranslate menu
        if (selection != '') {
            showMenu();
            elements["gtranslate_main"].setAttribute('label', translateWord + ' "' + ((selection.length > 23) ? selection.substr(0, 19) + '…' : selection) + '"');
        
        // Hide gTranslate
        } else {
            hideMenu();
        }
    }
    
    // Connect to Google Translate service
    function initTranslate() {
        
        var langpair = GT.fn.getLangPair();
        var fromLang = (langpair[0] == 'auto') ? pageLang : langpair[0];
        var toLang = langpair[1];
        
        var changelang = elements["gtranslate_strings"].getString("ChangeLanguages");
        
        checkMenuItem(langpair[0], langpair[1]);
        
        elements["gtranslate_langpair_main"].setAttribute('label', changelang + " ( " + langpair.join(' > ') + " )");
        
        if (selection != '') {
            
            if (selection != lastSelection) {
                
                var connectgoogle = elements["gtranslate_strings"].getString("ConnectToGoogle");
                var strConnect = elements["gtranslate_strings"].getString("Connecting");
                
                elements["gtranslate_result"].setAttribute('label', connectgoogle);
                
                GT.fn.translationRequest(fromLang, toLang, selection,
                    function(translation, detectedLang) { // on load
                        updateTranslation(translation);
                        
                        if (!!detectedLang) {
                            curDetectedLang = detectedLang;
                        }
                        
                        if (curDetectedLang !== "" || pageLang !== "") {
                            elements["gtranslate_dict"].setAttribute("disabled", false);
                        }
                    },
                    function() { // on error
                        var connecterror = elements["gtranslate_strings"].getString("ConnectionError");
                        elements["gtranslate_result"].setAttribute('label', connecterror);
                    });
                    
            } else {
                updateTranslation(curTranslation);
            }
        }
    }
    
    // Update translation popup
    function updateTranslation(result) {
        
        lastSelection = selection;
        
        curTranslation = result;
        
        if (curTranslation == "") {
            var noTrans = elements["gtranslate_strings"].getString("NoTranslation");
            elements["gtranslate_result"].setAttribute('label', noTrans + ' "' + selection + '"');
            
        } else {
            elements["gtranslate_result"].setAttribute('label', curTranslation);
            elements["gtranslate_result"].setAttribute('disabled', false);
            elements["gtranslate_replace"].setAttribute('disabled', false);
        }
        
        selection = '';
    }
    
    // Open Google Translation Page in a new tab
    function openPage() {
        openNewTabWith(GT.fn.getGoogleUrl("page", GT.fn.getLangPair()[0], GT.fn.getLangPair()[1], lastSelection), null, null, true);
    }
    
    // Open Google Translation Dictionay in a new tab
    function openDict() {
        
        var gFromLang, gToLang;
        
        if (curDetectedLang !== "") {
            gFromLang = curDetectedLang;
            
        } else if (pageLang !== "") {
            gFromLang = pageLang;
            
        } else {
            gFromLang = GT.fn.getLangPair()[0];
        }
        
        if (gFromLang !== "en") {
            gToLang = "en";
            
        } else {
            gToLang = GT.fn.getLangPair()[1];
        }
        
        openNewTabWith(GT.fn.getGoogleUrl("dict", gFromLang, gToLang, lastSelection), null, null, true);
    }
    
    // Show menu
    function showMenu() {
        elements["gtranslate_main"].hidden = false;
        elements["gtranslate_separator"].hidden = false;
    }
    
    // Hide menu
    function hideMenu() {
        elements["gtranslate_main"].hidden = true;
        elements["gtranslate_separator"].hidden = true;
    }
    
    // Generates langlist menu
    function loadLangList() {
        
        var fLangs = GT.langConf.availableLangs_from.split(",");
        var tLangs = GT.langConf.availableLangs_to.split(",");
        
        for (f in fLangs) {
        
            var m;
            
            if (fLangs[f] == '|') {
                m = document.createElement('menuseparator');
                
            } else {
                
                m = document.createElement('menu');
                
                elements["gtranslate_langpairs"][fLangs[f]] = {
                    "from": m,
                    "to": {}
                };
                
                m.setAttribute("label", elements["gtranslate_strings"].getString(GT.langConf.langDict[fLangs[f]] + ".label"));
                
                var mp = document.createElement('menupopup');
                m.appendChild(mp);
                
                for (t in tLangs) {
                    if (fLangs[f] != tLangs[t]) {
                    
                        var mi = document.createElement('menuitem');
                        
                        elements["gtranslate_langpairs"][fLangs[f]]["to"][tLangs[t]] = mi;
                        
                        mi.setAttribute("label", elements["gtranslate_strings"].getString(GT.langConf.langDict[tLangs[t]] + ".label"));
                        mi.setAttribute("type", "radio");
                        
                        mi.addEventListener('command', (function() {
                        
                            var fromLang = fLangs[f];
                            var toLang = tLangs[t];
                            
                            return function() {
                                GT.fn.setLangPair(fromLang, toLang);
                                lastSelection = '';
                            };
                            
                        })(), false);
                        
                        mp.appendChild(mi);
                    }
                }
            }
            
            elements['gtranslate_langpair_popup'].appendChild(m);
        }
    }
    
    // Visually select a lang pair
    function checkMenuItem(fromLang, toLang) {
        
        var element = elements["gtranslate_langpair_popup"];
        
        // Uncheck all...
        if (element.hasChildNodes()) {
            
            var menupopup = element.childNodes;
            
            for (var i = 0; i < menupopup.length; i++) {
            
                if (menupopup[i].hasChildNodes()) {
                
                    var children = element.childNodes;
                    
                    for (var j = 0; j < children.length; j++) {
                        children[j].removeAttribute("checked");
                    }
                }
            }
        }
        
        // Check langpair
        elements["gtranslate_langpairs"][fromLang]["from"].setAttribute("checked", "true");
        elements["gtranslate_langpairs"][fromLang]["to"][toLang].setAttribute("checked", "true");
    }
    
    function detectLang(popupnode) {
        
        // Document lang
        var htmlElt = top.document.getElementById("content").contentDocument.getElementsByTagName('html')[0];
        
        if (!!htmlElt) {
            pageLang = htmlElt.getAttribute('lang');
        }
        
        // Element language
        if (!!popupnode.getAttribute('lang')) {
            pageLang = popupnode.getAttribute('lang');
        }
        
        // Google Translate auto-detection
        if (!pageLang) {
            pageLang = '';
        }
        
        return pageLang.slice(0, 2).toLowerCase(); // slice : "fr-FR" to "fr"
    }
    
    function getSelection(popupnode) {
        
        var nodeLocalName = popupnode.localName.toLowerCase();
        var selection = '';
        
        // Input or textarea ?
        if ((nodeLocalName == "textarea") || (nodeLocalName == "input" && popupnode.type == "text")) {
            
            selection = popupnode.value.substring(popupnode.selectionStart, popupnode.selectionEnd);
            
            elements["gtranslate_replace"].setAttribute('hidden', false); /* TEMP */
           
        // Image ?
        } else if (nodeLocalName == "img") {
            
            // Image title ?
            if (popupnode.title) {
                selection = popupnode.title;
                
            // Image alternative ?
            } else if (popupnode.alt) {
                selection = popupnode.alt;
            }
            
        // Link ?
        } else if (nodeLocalName == "a" && popupnode.hasAttribute("href") && (popupnode.textContent != "" || popupnode.hasAttribute("title"))) {
            
            // Link content ?
            if (popupnode.textContent != "") {
                selection = popupnode.textContent;
                
            // Link title ?
            } else if (popupnode.hasAttribute("title")) {
                selection = popupnode.getAttribute("title");
            }
            
        // Text selection.
        } else {
            selection = document.commandDispatcher.focusedWindow.getSelection().toString();
        }
        
        return selection;
    }
    
    // Replace text in textarea or input[type=text]
    function replaceText() {
        var popupnode = document.popupNode;
        var iStart = popupnode.selectionStart;
        var iEnd = popupnode.selectionEnd;
        
        popupnode.value = popupnode.value.substring(0, iStart) + curTranslation + popupnode.value.substring(iEnd, popupnode.value.length);
        popupnode.setSelectionRange(iStart, iStart + curTranslation.length);
    }
    
})();
