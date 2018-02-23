/* These functions are preserved here from the old addon, in case WebExtensions get an API
   to determine the DOM Node that the contextmenu was activated on.
   This would allow us to display context menu translation of editable field content, link text,
   and image alt text.
*/

// Returns the current selection based on the active node
function getSelectionFromNode(node) {
    const contentWin = node.ownerDocument.defaultView;
    const name = node.nodeName.toLowerCase();
    const text = contentWin.getSelection().toString().trim();
  if (text) {
      return text;
  }
  if (name === 'input' || name === 'textarea') {
    return node.value.substr(
      node.selectionStart,
      node.selectionEnd - node.selectionStart
    ) || null;
  }
  if (name === 'a') {
      return node.textContent || node.title || null;
  }
  if (name === 'img') {
      return (node.alt !== node.src && node.alt) || node.title || null;
  }
    return null;
}

function getPopupNode(win) (
    win.gContextMenuContentData.popupNode || null // this was the XUL API way of doing it
);

// Returns the current selection from a window
function getSelectionFromWin(win) {
    const popupNode = getPopupNode(win);
    return popupNode ? getSelectionFromNode(popupNode) : '';
};

/* The logic for selecting the tooltip text based on the user's preference. 
   Preserved here in case WebExtensions get an API to display a tooltip on a context menu.
   See also https://bugzilla.mozilla.org/show_bug.cgi?id=1332270
*/

function updateResult(translation, dict){
    var result; // was the menuitem displaying the translation
    result.setAttribute('tooltiptext', translation + (dict ? '\n' + dict : ''));
    result.setAttribute('label', translation || _('fetch_translation'));
};

async function showResultsMenu() {
    if (selection === '') {
	selection = getSelectionFromWin(win);
    }
    const fromCode = (await sp.get("langFrom")).langFrom;
    const toCode = await currentTo();
    const dictionaryPref = (await sp.get("dictionaryPref")).dictionaryPref;
    translate(fromCode, toCode, selection, res => {
	switch (dictionaryPref) {
	case 'A':
            if (res.alternatives) {
		updateResult(res.translation, res.alternatives);
            } else if (res.dictionary) {
		updateResult(res.translation, res.dictionary);
            } else {
		updateResult(res.translation, res.synonyms);
            }
            break;
	case 'D':
            if (res.dictionary) {
		updateResult(res.translation, res.dictionary);
            } else if (res.alternatives) {
		updateResult(res.translation, res.alternatives);
            } else {
		updateResult(res.translation, res.synonyms);
            }
            break;
	case 'S':
            if (res.synonyms) {
		updateResult(res.translation, res.synonyms);
            } else if (res.dictionary) {
		updateResult(res.translation, res.dictionary);
            } else {
		updateResult(res.translation, res.alternatives);
            }
            break;
	}
  });
};
