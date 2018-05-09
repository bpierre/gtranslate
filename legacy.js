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
