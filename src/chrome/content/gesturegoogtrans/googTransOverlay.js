// Whole-script strict mode syntax
"use strict";

Components.utils.import("resource://gesturegoogtrans/GoogleTranslate.js");

(function() {
    
    // Global vars
    var selection = '';
    var lastSelection = '';
    
    var curDetectedLang = "";
    var curTranslation = '';
    
	// XUL elements
    var elements = {};
    
    // App version check
    var appInfo = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo);
    var versionChecker = Components.classes["@mozilla.org/xpcom/version-comparator;1"].getService(Components.interfaces.nsIVersionComparator);
    
    // Context menu
    var contextMenu;
    
    // On window load
    window.addEventListener("load", function() {
        
        contextMenu = document.getElementById("contentAreaContextMenu") || document.getElementById("mailContext");
        
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
        elements["gtranslate_langpairs"] = {};
        
        // Events
        initEvents();
        
        // Load langpairs list
        loadLangList();

		// Gesture mod
		GestureTranslate.init();
		
		//document.getElementById("key_gtranslateIt").setAttribute("oncommand", "alert('YYYEEESSS')");
        
    }, false);
    
    function initEvents() {
	        
        // Right click
        contextMenu.addEventListener("popupshowing", onGtransPopup, false);
        
        // Init translate
        elements["gtranslate_popup"].addEventListener("popupshowing", initTranslate, false);
        
        // Replace with translation
        elements["gtranslate_replace"].addEventListener("command", replaceText, false);
        
        // Open Google Translate in a new tab
        elements["gtranslate_result"].addEventListener("command", openPage, false);
    }
    
    // On right click event
    function onGtransPopup(event) {
        
        if (event.target !== contextMenu)  {
            return;
        }
        
        elements["gtranslate_replace"].setAttribute('hidden', true);
        elements["gtranslate_result"].setAttribute('disabled', true);
        
        curDetectedLang = "";
        
        var popupnode = document.popupNode;
        
        // Localized string : "Translate..."
        var translateWord = elements["gtranslate_strings"].getString("TranslateWord");
        
        // Get and trim current selection
        selection = GoogleTranslate.trim(getSelection(popupnode));
        
        // Show and update (eventually with a substr) gTranslate menu
        if (selection != '') {
            showMenu();
            elements["gtranslate_main"].setAttribute('label', translateWord + ' "' + selection.replace(/\s+/g," ") + '"');
        
        // Hide gTranslate
        } else {
            hideMenu();
        }
    }
    
    // Connect to Google Translate service
    function initTranslate() {
        
        var langpair = GoogleTranslate.getLangPair();
        var fromLang = (langpair[0] === "auto") ? "" : langpair[0];
        var toLang = langpair[1];
        
        var changelang = elements["gtranslate_strings"].getString("ChangeLanguages");
        
        checkMenuItem(langpair[0], langpair[1]);
        
        elements["gtranslate_langpair_main"].setAttribute('label', changelang + " ( " + langpair.join(' > ') + " )");
        
        if (selection != '') {
		
		  if (GoogleTranslate.getDetectLanguage()) {	
			//detectLangRequest BEGIN
			//added to use another service to always detect language from textToTranslate since this is not working in a reliable way with the free google service 
			if (GoogleTranslate.getLog2Console()) GoogleTranslate.log('initTranslate, detectLangRequest...');
			curDetectedLang="";
			GestureTranslate.detectLangRequest(selection,
			  function(detectedLang) { // on load
				  if (GoogleTranslate.getLog2Console()) GoogleTranslate.log('DetectedLanguage:' + detectedLang);
				  
				  if (!!detectedLang) {
                      curDetectedLang = detectedLang;
                  }
                  
				  if (detectedLang !== "") {
					if (detectedLang == toLang) {
					  //reverse/inverse translation if textToTranslate is already in the same language. detectlanguage must be "active" for this feature!
					  toLang=fromLang;
					  fromLang=detectedLang;
					}
					else  {
					  //translate it from detected language (so that we can give it to google that it can do a better/relible translation)
					  fromLang=detectedLang;
					}
				  }
				  
              },
              function(errorMsg) { // on error
                  if (!errorMsg) {
                    errorMsg = elements["gtranslate_strings"].getString("ConnectionError");
                  }
                  
                  elements["gtranslate_result"].setAttribute('label', errorMsg);
                  elements["gtranslate_result"].setAttribute('tooltiptext', errorMsg);
									StatusBar.updateError(errorMsg);
									GestureTranslate.reset();
				  
				  GestureTranslate.notifyError(errorMsg,5000);
				  
              }
			);
			//detectLangRequest END
		  }
		
			
            var connectgoogle = elements["gtranslate_strings"].getString("ConnectToGoogle");
            var strConnect = elements["gtranslate_strings"].getString("Connecting");
            
            elements["gtranslate_result"].setAttribute('label', connectgoogle);
            elements["gtranslate_result"].setAttribute('tooltiptext', null);
            
			if (GoogleTranslate.getLog2Console()) GoogleTranslate.log('translationRequest ... fromLang=' + fromLang + ' ,toLang=' + toLang + ' ,curDetectedLang=' + curDetectedLang);
			
            GoogleTranslate.translationRequest(fromLang, toLang, selection,
                function(translation, detectedLang) { // on load
                    if (GoogleTranslate.getLog2Console()) GoogleTranslate.log('Translation (' + detectedLang + '):' + translation);
					updateTranslation(translation);
                    
                    if (!!detectedLang) {
                        curDetectedLang = detectedLang;
                    }                
                },
                function(errorMsg) { // on error
                    if (!errorMsg) {
                      errorMsg = elements["gtranslate_strings"].getString("ConnectionError");
                    }
                    
					if (GoogleTranslate.getLog2Console()) GoogleTranslate.log('Error:' + errorMsg);
                    elements["gtranslate_result"].setAttribute('label', errorMsg);
                    elements["gtranslate_result"].setAttribute('tooltiptext', errorMsg);
					
					GestureTranslate.notifyError(errorMsg,5000);
                }
            );
        }
    }
    
    // Update translation popup
    function updateTranslation(result) {
        
        lastSelection = selection;
        
        curTranslation = result;
        
        if (curTranslation == "") {
            var noTrans = elements["gtranslate_strings"].getString("NoTranslation");
            elements["gtranslate_result"].setAttribute('label', noTrans + ' "' + selection.replace(/\s+/g," ") + '"');
            elements["gtranslate_result"].setAttribute('tooltiptext', null);
            
        } else {
            elements["gtranslate_result"].setAttribute('label', curTranslation.replace(/\s+/g," "));
            elements["gtranslate_result"].setAttribute('tooltiptext', curTranslation);
            elements["gtranslate_result"].setAttribute('disabled', false);
            elements["gtranslate_replace"].setAttribute('disabled', false);
        }
        
        selection = '';
    }
    
    // Open Google Translation Page in a new tab
    function openPage(text) {
	  
	  if ((typeof text)!="string") text=lastSelection;
	  
	  openTab(GoogleTranslate.getGoogleUrl("page", GoogleTranslate.getLangPair()[0], GoogleTranslate.getLangPair()[1], text, curDetectedLang));
	}
    
    function openTab(tabUrl) {
      
      // Thunderbird, Seamonkey Mail
      if (contextMenu.id === "mailContext") {
        var uri = Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService).newURI(tabUrl, null, null);
        var httpHandler = Components.classes["@mozilla.org/uriloader/external-helper-app-service;1"]
                          .createInstance(Components.interfaces.nsIExternalProtocolService);
        httpHandler.loadUrl(uri);
        
      } else {
        
        // Firefox 3.6+
        if (versionChecker.compare(appInfo.platformVersion, "1.9.2") >= 0) {
          gBrowser.addTab(tabUrl, {relatedToCurrent: true});
          
        // Firefox < 3.6
        } else {
          gBrowser.addTab(tabUrl);
        }
      }
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
        // Function-level strict mode syntax
		"use strict";
		
        function compareLangLabels(a, b) {
            if (elements["gtranslate_strings"].getString(
                    GoogleTranslate.langConf.langDict[a] + ".label") <
                elements["gtranslate_strings"].getString(
                    GoogleTranslate.langConf.langDict[b] + ".label")) {
                return -1;
            }
            return 1;
        };
        
        var fLangs = GoogleTranslate.langConf.availableLangs_from.split(",")
                        .slice(2).sort(compareLangLabels);
        var tLangs = GoogleTranslate.langConf.availableLangs_to.split(",")
                        .sort(compareLangLabels);
        
        fLangs.unshift("auto", "|");
        
		var f;
		var t;
		
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
                
                m.setAttribute(
                    "label",
                    elements["gtranslate_strings"].getString(
                        GoogleTranslate.langConf.langDict[fLangs[f]] + ".label")
                );
                
                var mp = document.createElement('menupopup');
                m.appendChild(mp);
                
                for (t in tLangs) {
                    if (fLangs[f] != tLangs[t]) {
                    
                        var mi = document.createElement('menuitem');
                        
                        elements["gtranslate_langpairs"][fLangs[f]]["to"][tLangs[t]] = mi;
                        
                        mi.setAttribute(
                            "label",
                            elements["gtranslate_strings"].getString(
                                GoogleTranslate.langConf.langDict[tLangs[t]] + ".label")
                        );
                        mi.setAttribute("type", "radio");
                        
                        mi.addEventListener('command', (function() {
                        
                            var fromLang = fLangs[f];
                            var toLang = tLangs[t];
                            
                            return function() {
                                GoogleTranslate.setLangPair(fromLang, toLang);
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
			var i;
            
            for (var i = 0; i < menupopup.length; i++) {
            
                if (menupopup[i].hasChildNodes()) {
                
                    var children = element.childNodes;
					var j;
                    
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
	// INI - Patch for Gesture Translate by @pablocantero
	var CommonsUtils = {
		isEmpty: function(text){
			return (text == null || text == '');
		},
		isNotEmpty: function(text){
			return !CommonsUtils.isEmpty(text);
		}
	};
	var GestureTranslate = {
		selectedText: 			'',
		lastSelectedText: 		'',
		left1:					false,
		rigth1:					false,
		left2: 					false,
		right2: 				false,
		cuu: 					null,
		lastTimerService: 		null,
		clearStatusBarTimer: 	null,
		init: function(){
			window.onmousemove = GestureTranslate.onmousemove_handler;
			//To set default messages
			StatusBar.reset();
		},
		onmousemove_handler: function(event){
			var popupnode = event.target;
			var selectedTextToCompare = GestureTranslate.getSelection(popupnode);
			//If the selected text not is changed then nothing happens 
			if(GestureTranslate.lastSelectedText == selectedTextToCompare){
				GestureTranslate.reset();
				return;
			}
			//No text selected
			if(CommonsUtils.isEmpty(selectedTextToCompare)){
				GestureTranslate.reset();
				return;
			}
			//Actual selected text != last selected text
			if(CommonsUtils.isNotEmpty(GestureTranslate.selectedText) && GestureTranslate.selectedText != selectedTextToCompare){
				GestureTranslate.reset();
				GestureTranslate.selectedText = selectedTextToCompare;
				return;			
			}
			GestureTranslate.selectedText = selectedTextToCompare;
			if(GestureTranslate.cuu == null){
				GestureTranslate.cuu = event.pageX;
				return;
			}
			//everything's right... let's go, start the count down to zig and zag movements
			GestureTranslate.lastTimerService = GestureTranslate.startCountDown();
			if(GestureTranslate.left1 || GestureTranslate.right1){ //1
				if((GestureTranslate.left1 && GestureTranslate.right2) || (GestureTranslate.right1 && GestureTranslate.left2)){ //2
					if((GestureTranslate.left1 && GestureTranslate.cuu > event.pageX) || (GestureTranslate.right1 && GestureTranslate.cuu < event.pageX)){ //3
						var connectgoogle = elements["gtranslate_strings"].getString("ConnectToGoogle");
						//Shows Connecting to Google... to the user knows that the Add-on is working
						StatusBar.updateInfo(connectgoogle);
						GestureTranslate.lastSelectedText = GestureTranslate.selectedText;
						GestureTranslate.translateIt(GestureTranslate.selectedText);
						GestureTranslate.reset();
						GestureTranslate.startClearStatusBarTimer(5);
						return;
					}
				} else { //2 WAIT
					GestureTranslate.right2 = GestureTranslate.cuu < event.pageX;
					GestureTranslate.left2 = GestureTranslate.cuu > event.pageX;
				}
			} else { //1 WAIT
				GestureTranslate.right1 = GestureTranslate.cuu < event.pageX;
				GestureTranslate.left1 = GestureTranslate.cuu > event.pageX;
			}
		},
		stopClearStatusBarTimer: function(){
			if(GestureTranslate.clearStatusBarTimer != null){
				GestureTranslate.clearStatusBarTimer.cancel();
				GestureTranslate.clearStatusBarTimer = null;
			}
		},
		startClearStatusBarTimer: function(){
			GestureTranslate.stopClearStatusBarTimer();
			var milis = (GoogleTranslate.getTimeOut() * 1000); //Default = 10 Sek.
			var timerService = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
			var event = {  
			   notify: function(timer) {  
					GestureTranslate.lastSelectedText = '';
			     	StatusBar.reset();
				 	timer.cancel();
			  }  
			};
			timerService.initWithCallback(event, milis, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
			GestureTranslate.clearStatusBarTimer = timerService;	
		},
		startCountDown: function(){ //Run Forest, run...
			var timerService = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
			var event = {  
			   notify: function(timer) {  
			     	GestureTranslate.reset();
				 	timer.cancel();
			  }  
			};
			//2000 = 2 seconds
			timerService.initWithCallback(event, 2000, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
			return timerService;		
		},
		reset: function(){
			GestureTranslate.selectedText 	= '';
			GestureTranslate.left1 			= false;
			GestureTranslate.right1 		= false;
			GestureTranslate.left2 			= false;
			GestureTranslate.right2 		= false;
			GestureTranslate.cuu 			= null;
			if(GestureTranslate.lastTimerService != null){
				GestureTranslate.lastTimerService.cancel();
				GestureTranslate.lastTimerService = null;
			}
		},
		translateIt: function(textToTranslate){
		  var langpair = GoogleTranslate.getLangPair();
	      var fromLang = (langpair[0] === "auto") ? "" : langpair[0];
	      var toLang = langpair[1];
				
		  if (GoogleTranslate.getDetectLanguage()) {	
			//detectLangRequest BEGIN, added to use another service to always detect language from textToTranslate since this is not working in a reliable way with the free google service 
			if (GoogleTranslate.getLog2Console()) GoogleTranslate.log('translateIt, detectLangRequest...');
			curDetectedLang="";
			this.detectLangRequest(textToTranslate,
			  function(detectedLang) { // on load
				  if (GoogleTranslate.getLog2Console()) GoogleTranslate.log('DetectedLanguage:' + detectedLang);
				  StatusBar.updateInfo('DetectedLanguage:' + detectedLang);
				  GestureTranslate.reset();
				  
				  if (!!detectedLang) {
                      curDetectedLang = detectedLang;
                  }
                  
				  if (detectedLang !== "") {
					if (detectedLang == toLang) {
					  //reverse/inverse translation if textToTranslate is already in the same language :)
					  toLang=fromLang;
					  fromLang=detectedLang;
					}
					else  {
					  //translate it from detected language (so that we can give it to google that it can do a better/relible tranlation)
					  fromLang=detectedLang;
					}
				  }
				  
              },
              function(errorMsg) { // on error
                  if (!errorMsg) {
                    errorMsg = elements["gtranslate_strings"].getString("ConnectionError");
                  }
                  
				  if (GoogleTranslate.getLog2Console()) GoogleTranslate.log('Error:' + errorMsg);
                  elements["gtranslate_result"].setAttribute('label', errorMsg);
                  elements["gtranslate_result"].setAttribute('tooltiptext', errorMsg);
									StatusBar.updateError(errorMsg);
									GestureTranslate.reset();
				  
				  GestureTranslate.notifyError(errorMsg,5000);
              }
			);
			//detectLangRequest END
		  }	
			
		  GoogleTranslate.translationRequest(fromLang, toLang, textToTranslate,
              function(translation, detectedLang) { // on load
			      if (GoogleTranslate.getLog2Console()) GoogleTranslate.log('Translation (' + detectedLang + '):' + translation);
				  StatusBar.updateInfo(translation, textToTranslate);
				  
				  //additional Notification?
				  if (GoogleTranslate.getDHNotify()) {
				    GestureTranslate.notifyDoorHanger("", translation, textToTranslate);
				  }
				  
				  GestureTranslate.reset();
                  if (!!detectedLang) {
                      curDetectedLang = detectedLang;
                  }
              },
              function(errorMsg) { // on error
                  if (!errorMsg) {
                    errorMsg = elements["gtranslate_strings"].getString("ConnectionError");
                  }
                  
				  if (GoogleTranslate.getLog2Console()) GoogleTranslate.log('Error:' + errorMsg);
                  elements["gtranslate_result"].setAttribute('label', errorMsg);
                  elements["gtranslate_result"].setAttribute('tooltiptext', errorMsg);
									StatusBar.updateError(errorMsg);
									GestureTranslate.reset();
				  
				  GestureTranslate.notifyError(errorMsg,5000);
				  
              }
          );
		},
		
		//detect Language
		detectLangRequest: function(text, onLoadFn, onErrorFn) {
            var url = this.getDetectLanguageUrl(text);
			
			var req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]
                            .createInstance(Ci.nsIXMLHttpRequest);
						
			if (GoogleTranslate.getLog2Console()) GoogleTranslate.log(url);

            req.addEventListener("load", (function() {
               if (req.status !== 200) {
				   if (GoogleTranslate.getLog2Console()) GoogleTranslate.log(req.statusText);
                   onErrorFn(req.statusText);
                   return;
               }
			   
			   if (GoogleTranslate.getLog2Console()) GoogleTranslate.log(req.responseText);
			
			   //example response:
			   //{"data":{"detections":[{"language":"de","isReliable":false,"confidence":0.2477291494632535},{"language":"sk","isReliable":false,"confidence":0.04965243296921549}]}}
			   //{"error":{"code":2,"message":"You are using demo API key. Please sign up and get your free API key at http://detectlanguage.com"}}
               var response = JSON.parse(req.responseText);

               if (!response.data) {
                   var errMsg=req.responseText;
				   if (response.error) {
				     errMsg=response.error.message;
				   }
				   errMsg = "detectlanguage.com - " + errMsg; 
				   if (GoogleTranslate.getLog2Console()) GoogleTranslate.log(errMsg);
				   onErrorFn(errMsg);
                   return;
               }
			   
			   var detectLang = '';
			   try {
			     detectLang=response.data.detections[0].language;
               }
			   catch(e) {
			     //
			   }
               
			   onLoadFn(detectLang);
			   
           }), false);

           req.addEventListener("error", onErrorFn, false);

           //req.open("GET", url, true);
		   req.open("GET", url, false);  //do a sync-call here instead of async, this must be done to be ready before calling google translation service
           req.send(null);
           
        },
		//build Url to use detectlanguage service
        getDetectLanguageUrl: function(text) {
           
		   //var regex = /\s+/gi;
		   //var wordCount = text.replace(regex, ' ').split(' ').length;
		   var totalChars = text.length;
		   if (totalChars>70) text=text.substring(0,70);  //first 70 chars should be enough to detect language relibale, it's not necessary to send the full text
		   
		   var formattedUrl = 'http://ws.detectlanguage.com/0.2/detect?q=' + encodeURIComponent(text);
		   
		   //the API key defaults to "demo", which has only a limited number of requests, please register your API key for free! and put it in the pref
		   formattedUrl = formattedUrl + '&key=' + GoogleTranslate.getDetectLanguageApiKey();
           
		   return formattedUrl;
        },
		
		getSelection: function(popupnode) {
			var nodeLocalName = popupnode.localName.toLowerCase();
			var selection = '';
			// Input or textarea?
			if ((nodeLocalName == "textarea") || (nodeLocalName == "input" && popupnode.type == "text")) {
			    selection = popupnode.value.substring(popupnode.selectionStart, popupnode.selectionEnd);
			    elements["gtranslate_replace"].setAttribute('hidden', false); /*TEMP*/
			} else {
			    selection = document.commandDispatcher.focusedWindow.getSelection().toString();
			}
			return selection;
	    },
		
		notifyError: function(nMessage, nTimeout) {
			//this.notifyAlert('Gesture Translate Error:',nMessage,"Warning");
			this.notifyBox('Gesture Translate Error:',nMessage,"Warning");  //use html5-NotificationBox for errors
		},
		
		//Notifications via Alerts service
		notifyAlert: function(nTitle, nMessage, nTyp, nIcon) {
		  var nTyp = nTyp || "Note";
  
		  var nDefaultIcon="chrome://gesturegoogtrans/skin/icon.png";
		  var nIcon = nIcon || nDefaultIcon;
  
		  if (nIcon==nDefaultIcon) {
			if (nTyp=="Warning") nIcon="chrome://gesturegoogtrans/skin/warning_red_32.png";
			if (nTyp=="Message") nIcon="chrome://gesturegoogtrans/skin/message_32.png";
			if (nTyp=="Note") nIcon="chrome://gesturegoogtrans/skin/note_32.png";
		  }
  
		  var alertService = Components.classes["@mozilla.org/alerts-service;1"].getService(Components.interfaces.nsIAlertsService);
  
		  try {
			alertService.showAlertNotification(nIcon, nTitle, nMessage, false, "", null);
		  }
		  catch(e) {
			// if notification services is not set up on this computer
			alert("ERROR notify:" + e);
		  }  
		},
		
		//Notifications via html5-NotificationBox
		notifyBox: function(nTitle, nMessage, nTyp, nIcon) {
		  var nTyp = nTyp || "Note";
		  
		  var nDefaultIcon="chrome://gesturegoogtrans/skin/icon.png";  //"chrome://browser/skin/Info.png"
		  var nIcon = nIcon || nDefaultIcon;
  
		  if (nIcon==nDefaultIcon) {
			if (nTyp=="Warning") nIcon="chrome://gesturegoogtrans/skin/warning_red_32.png";
			if (nTyp=="Message") nIcon="chrome://gesturegoogtrans/skin/message_32.png";
			if (nTyp=="Note") nIcon="chrome://gesturegoogtrans/skin/note_32.png";
		  }
		  
		  if (nTitle!="") nMessage=nTitle + " " + nMessage;
		  
		  var notificationBox = gBrowser.getNotificationBox();
		  const priority = notificationBox.PRIORITY_WARNING_MEDIUM;  //PRIORITY_INFO_MEDIUM, PRIORITY_WARNING_MEDIUM, PRIORITY_CRITICAL_MEDIUM
		  notificationBox.appendNotification(nMessage, "popup-blocked", nIcon, notificationBox, priority);
		},
		
		//Notifications via PopupNotifications aka Dook-Hanger-PopUps
		notifyDoorHanger: function(nTitle, nMessage, nMessage2, nTimeout) {
		  var nTimeout = nTimeout || (GoogleTranslate.getTimeOut() * 1000);
		  var nMessage2 = nMessage2 || "";
		  
		  var nIcon="chrome://gesturegoogtrans/skin/icon.png";
		  
		  var tMessage=nMessage;
		  if (nTitle!="") tMessage=nTitle + " " + nMessage;
		  
		  //Components.utils.import('resource://gre/modules/PopupNotifications.jsm');
		  
		  var notification =  PopupNotifications.show(
			// browser
			gBrowser.selectedBrowser,
			// popup id
			"gestureTranslate-popup",
			// message
			tMessage,
			// anchor id
			null,
			// main action
			{
				label: "Go gTranslate",
				accessKey: "G",
				callback: function() {
				  openPage(nMessage2);
				}
			},
			// secondary actions
			[
			  {
				label: "1 - Copy Translation To Clipboard",
				accessKey: "1",
				callback: function() {
					GestureTranslate.Copy2ClipBoard(nMessage);
				}
			  },
			  {
				label: "2 - Copy Both To Clipboard",
				accessKey: "2",
				callback: function() {
					GestureTranslate.Copy2ClipBoard(nMessage2 + String.fromCharCode(13) + String.fromCharCode(10) + "--->" + String.fromCharCode(13) + String.fromCharCode(10) + nMessage);
				}
			  }
			],
			// options
			{
				popupIconURL: nIcon
			}
		  );
 
		  setTimeout(function(){
			notification.remove();
		  }, nTimeout); // Time in milliseconds to disappear the door-hanger popup.  
			
		},
		
		//Copy2ClipBoard
		Copy2ClipBoard: function(text) {
		  const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
                                   .getService(Components.interfaces.nsIClipboardHelper);
		  gClipboardHelper.copyString(text);
		}
		
	};
	
	var StatusBar = {
		_update: function(tooltipText, textToTranslate){
			if(textToTranslate == null){
				textToTranslate = tooltipText;
			}
			
			document.getElementById('gestureTranslateStatusbar').label = tooltipText;
			document.getElementById('gestureTranslateStatusbar').tooltipText = tooltipText;		
			document.getElementById('gestureTranslateStatusbar').setAttribute('style', 'border: 1px solid #CCC; color: ' + GoogleTranslate.getFontColor());
			document.getElementById('gestureTranslateStatusbar').onclick = function(){
				//Do nothing
			};
			document.getElementById('gestureTranslateStatusbar').onmouseover = function(){
				GestureTranslate.stopClearStatusBarTimer();
			};
			document.getElementById('gestureTranslateStatusbar').onmouseout = function(){
				GestureTranslate.startClearStatusBarTimer();
			};
			
		},
		
		reset: function(){
			StatusBar._update('', '');
			document.getElementById('gestureTranslateStatusbar').onclick = function(){
				openTab(GoogleTranslate.getGoogleUrl('page', GoogleTranslate.getLangPair()[0], GoogleTranslate.getLangPair()[1], '', curDetectedLang));
			};
		},
		
		updateInfo: function(tooltipText, textToTranslate){
			StatusBar._update(tooltipText, textToTranslate);
			document.getElementById('gestureTranslateStatusbar').onclick = function(){
				openTab(GoogleTranslate.getGoogleUrl('page', GoogleTranslate.getLangPair()[0], GoogleTranslate.getLangPair()[1], textToTranslate, curDetectedLang));
			};
		},
		
		updateError: function(tooltipText, textToTranslate){ //Only change the font-color to red
			StatusBar._update(tooltipText, textToTranslate);
			document.getElementById('gestureTranslateStatusbar').setAttribute('style', 'border: 1px solid #CCC; color: ' + GoogleTranslate.getFontColor());
		}
	};
	// END - Patch for Gesture Translate by @pablocantero
})();