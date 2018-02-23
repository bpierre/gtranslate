/* global browser, fetch, translate, translateUrl, translatePageUrl, LABEL_TRANSLATE_ERROR, _ */
'use strict';

const sp = browser.storage.sync;

// Replace params in a string à la Python str.format()
const format = (origStr, ...args) => Array.from(args).reduce(
  (str, arg, i) => str.replace(new RegExp(`\\{${i}\\}`, 'g'), arg), origStr
);


// Open a new tab near to the active tab
function openTab(url, currentTab) {
    currentTab = currentTab || browser.tabs.getCurrent();
    browser.tabs.create({url: url,
			 active: true,
			 openerTabId: currentTab.id,
			 index: currentTab.index + 1});
};

// Get the To language from the preferences
async function currentTo() {
    let langCode = (await sp.get("langTo")).langTo;
    const locale = browser.i18n.getUILanguage();
  if (langCode === 'auto') {
    if (!locale.startsWith('zh')) {
	langCode = locale.replace(/-[a-zA-Z]+$/, '');
    }
  }
    return langCode;
};

// Utility function to create elements
function eltCreator(doc) {
    return (name, props, attrs, parent) => {
	const elt = doc.createElement(name);
	if (props) Object.keys(props).forEach(p => elt[p] = props[p]);
	if (attrs) Object.keys(attrs).forEach(a => elt.setAttribute(a, attrs[a]));
	if (parent) parent.appendChild(elt);
	return elt;
    };
}

// Copy text to clipboard.
function copyToClipboard(text, html) {
    function oncopy(event) {
        document.removeEventListener("copy", oncopy, true);
        event.stopImmediatePropagation();
        event.preventDefault();
        event.clipboardData.setData("text/plain", text);
        event.clipboardData.setData("text/html", html);
    }
    document.addEventListener("copy", oncopy, true);
    document.execCommand("copy");
}

// Returns the current selection based on the active node
const getSelectionFromNode = (node) => {
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
};

// Returns the popupNode of a window or null
const getPopupNode = (win) => (
  win.gContextMenuContentData.popupNode || null
);

// Returns the current selection from a window
const getSelectionFromWin = (win) => {
    const popupNode = getPopupNode(win);
    return popupNode ? getSelectionFromNode(popupNode) : '';
};

// Get active tab url
const getCurrentUrl = () => {
    const currentUrl = browser.tabs.getCurrent().url;
    if (currentUrl.startsWith('about:')) return null;
    return currentUrl;
};

// Determines if the page can be translated, by checking if a node is displayed
// in a special viewer or not (image, video, etc.), and its mime type.
// For images, the document should be an instance of window.ImageDocument.
// For other types, we have to check type as the document is an HtmlDocument.
// node: the node from which the contextual menu has been opened
// window: the current browser window
const translatablePage = (node, window) => {
    const doc = node.ownerDocument;
    const contentType = doc.contentType;
    if (!/^https?:/.test(doc.location.protocol)) return false;
    if (doc instanceof window.ImageDocument) return false;
    if (contentType.startsWith('video')) return false;
    if (contentType.startsWith('audio')) return false;
    if (contentType === 'application/ogg') return false;
    return true;
};

// Add a gtranslate menu on a window
const initMenu = (win) => {
    let selection = '';
    const doc = win.document;
    const cmNode = doc.getElementById('contentAreaContextMenu');
    const elt = eltCreator(doc);

  const translateMenu = elt(
    'menu',
    { className: 'menu-iconic', id: 'context-gtranslate' },
    { label: _('translate'), image: browser.extension.getURL('data/menuitem.svg') }
  );
  const translatePage = elt(
    'menuitem',
    { className: 'menuitem-iconic'},
      { label: _('translate_page'), image: browser.extension.getURL('data/menuitem.svg') }
  );
    const translatePopup = elt('menupopup', null, null, translateMenu);

    const result = elt('menuitem', null, null, translatePopup);
    elt('menuseparator', null, null, translatePopup);
  const clipboardItem = elt(
    'menuitem', null, { label: _('copy_to_clipboard') },
    translatePopup
  );


  const updateResult = (translation, dict) => {
      result.setAttribute('tooltiptext', translation + (dict ? '\n' + dict : ''));
      result.setAttribute('label', translation || _('fetch_translation'));
    clipboardItem.setAttribute('hidden', (
      result.label === _('fetch_translation') ||
      result.label === LABEL_TRANSLATE_ERROR
    ));
  };

  // Update the languages menu label (“Translate from {} to {}”)
    async function updateLangMenuLabel(detected) {
	const from = detected ? detected : (await sp.get("langFrom")).langFrom;
	const to = await currentTo();
	translatePage.setAttribute('label', format(
	    _('translate_page'),
	    from,
	    to
	));
    };

  // Show the context menupopup
  async function showContextMenu() {
    if (selection === '') {
	selection = getSelectionFromWin(win);
    }

      translateMenu.setAttribute('hidden', !selection);
    translatePage.setAttribute('hidden', (
      !!selection ||
      !getCurrentUrl() ||
      !translatablePage(getPopupNode(win), win) ||
	    !(await sp.get("fullPage")).fullPage
    ));

    if (selection) {
      translateMenu.setAttribute('label', format(_('translate'),
        selection.length > 15 ? selection.substr(0, 15) + '…' : selection));
	updateResult(null);
    }

      updateLangMenuLabel();
  };

  // Show the results menupopup
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
      if (fromCode === 'auto') {
          updateLangMenuLabel(res.detectedSource);
      }
    });
  };

  // Listen to popupshowing events
    async function onPopupshowing(event) {
    if (event.target === cmNode) {
	return showContextMenu(event);
    }
    if (event.target === translatePopup) {
	return showResultsMenu(event);
    }
  };

   // Listen to popuphiding events
  const onPopuphiding = event => {
    if (event.target === cmNode) {
	selection = ''; // clear old selection
    }
  };

  // Listen to command events
    async function onContextCommand(event) {
	const target = event.target;
	const parent = target.parentNode && target.parentNode.parentNode;
	const from = (await sp.get("langFrom")).langFrom;
	const to = await currentTo();

    // Open the translation page
    if (target === result) {
	openTab(translateUrl(from, to, selection));
	return;;
    }

    // Open the visited translation page
    if (target === translatePage) {
	openTab(translatePageUrl(from, to, getCurrentUrl()));
	return;
    }

    // Language change
    if (target.hasAttribute('data-gtranslate-to') &&
        parent && parent.hasAttribute('data-gtranslate-from')) {
	sp.set({langTo: target.getAttribute('data-gtranslate-to'),
		langFrom: parent.getAttribute('data-gtranslate-from')});
    }
  };

  const onClickCopyToClipboard = () => {
      copyToClipboard(result.label);
  };

    // Update the menu when the preferences are updated
    browser.storage.onChanged.addListener((changes, areaName) => {
      updateLangMenuLabel();
  });

    const inspectorSeparatorElement = doc.getElementById('inspect-separator');
    cmNode.insertBefore(translateMenu, inspectorSeparatorElement);
    cmNode.insertBefore(translatePage, inspectorSeparatorElement);
    cmNode.addEventListener('popupshowing', onPopupshowing);
    cmNode.addEventListener('popuphiding', onPopuphiding);
    cmNode.addEventListener('command', onContextCommand);
    clipboardItem.addEventListener('click', onClickCopyToClipboard);

  return function destroy() {
      cmNode.removeEventListener('popupshowing', onPopupshowing);
      cmNode.removeEventListener('popuphiding', onPopuphiding);
      cmNode.removeEventListener('command', onContextCommand);
      clipboardItem.removeEventListener('click', onClickCopyToClipboard);
      cmNode.removeChild(translateMenu);
      cmNode.removeChild(translatePage);
  };
};

// Init the addon
(function() {
    const destroyFns = [];
    const initWin = sdkWin => {
      const destroy = initMenu(sdkWin);
      if (destroy) destroyFns.push(destroy);
    };
    
    // Init an instance when a new window is opened
    browser.windows.onCreated.addListener(initWin);

    // Init new instances on startup
    browser.windows.getAll().then(windows => windows.forEach(initWin));
})();
