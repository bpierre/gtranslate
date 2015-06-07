const Ci = Components.interfaces;
const Cc = Components.classes;

const prefs = Cc["@mozilla.org/preferences-service;1"]
                 .getService(Ci.nsIPrefService)
                 .QueryInterface(Ci.nsIPrefBranch);
 
const focus = Cc["@mozilla.org/focus-manager;1"]
                 .getService(Ci.nsIFocusManager);
                                 
let handleContentContextMenu = function (event) {
  let defaultPrevented = event.defaultPrevented;
  if (!prefs.getBoolPref("dom.event.contextmenu.enabled")) {
    let plugin = null;
    try {
      plugin = event.target.QueryInterface(Ci.nsIObjectLoadingContent);
    } catch (e) {}
    if (plugin && plugin.displayedType == Ci.nsIObjectLoadingContent.TYPE_PLUGIN) {
      // Don't open a context menu for plugins.
      return;
    }

    defaultPrevented = false;
  }

  if (defaultPrevented)
    return;
    
  let selection = '';
  let node = event.target;
  let name = node.nodeName.toLowerCase();
  
  let focusedWindow = {};
  let focusedElement = focus.getFocusedElementForWindow(content, true, focusedWindow);
  focusedWindow = focusedWindow.value;
    
  let text = focusedWindow.getSelection().toString();
  if (/\S/.test(text)) {
    selection = text;
  }
  else if (focusedElement instanceof Ci.nsIDOMNSEditableElement) {
    // Don't get the selection for password fields. See bug 565717.
    if (focusedElement instanceof Ci.nsIDOMHTMLTextAreaElement ||
        (focusedElement instanceof Ci.nsIDOMHTMLInputElement &&
         focusedElement.mozIsTextField(true))) {
      selection = focusedElement.editor.selection.toString();
    }
  }
  else if (name === 'a') {
    selection = node.textContent || node.title || '';
  }
  else if (name === 'img') {
    selection = node.alt || node.title || '';
  }
  
  selection = selection.trim();
  if (selection != '') {
    sendSyncMessage("gTranslate:selection", { selection });
  }
}

addEventListener("contextmenu", handleContentContextMenu, false);

function disableListener()  {
	removeEventListener("contextmenu", handleContentContextMenu, false);
	removeMessageListener("gTranslate:disable", disableListener);
}

addMessageListener("gTranslate:disable", disableListener);