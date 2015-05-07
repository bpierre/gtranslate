'use strict'

const self = require('sdk/self')
const cm = require('sdk/context-menu')
const sp = require('sdk/simple-prefs')
const ps = require('sdk/preferences/service')
const tabs = require('sdk/tabs')
const { debounce } = require('sdk/lang/functional')
const { translate, translateUrl } = require('./providers/google-translate')
const languages = require('./languages')
const { getMostRecentBrowserWindow } = require('sdk/window/utils')
const addonUnload = require('sdk/system/unload')

// Context Menu
const LABEL_LOADING = 'Fetching translation…'
const LABEL_TRANSLATE = 'Translate “{0}”'
const LABEL_CHANGE_LANGUAGES = 'Change Languages ({0} > {1})'

// Replace params in a string à la Python
const strParams = str => {
  var params = [].slice.call(arguments, 1)
  for (var i = 0; i < params.length; i++) {
    str = str.replace(new RegExp(`\\{${i}\\}`, 'g'), params[i])
  }
  return str
}

// Get the From language from the preferences
const currentFrom = () => {
  const langCode = sp.prefs.lang_from
  const lang = languages[langCode]
  return {
    code: langCode,
    name: (lang && (lang.fromName || lang.name)) || null,
  }
}

// Get the To language from the preferences
const currentTo = () => {
  let langCode = sp.prefs.lang_to
  if (langCode === 'auto') {
    langCode = ps.getLocalized('general.useragent.locale', 'en')
    if (!langCode.startsWith('zh')) {
      langCode = langCode.replace(/-[a-zA-Z]+$/, '')
    }
  }
  const lang = languages[langCode]
  return {
    code: langCode,
    name: (lang && lang.name) || null,
  }
}

// Utility function to create elements
const eltCreator = doc => (name, props, attrs, parent) => {
  const elt = doc.createElement(name)
  if (props) Object.keys(props).forEach(p => elt[p] = props[p])
  if (attrs) Object.keys(attrs).forEach(a => elt.setAttribute(a, attrs[a]))
  if (parent) parent.appendChild(elt)
  return elt
}

const langToItems = (languages, doc) => (
  Object.keys(languages)
    .filter(lang => !languages[lang].onlyFrom)
    .map(lang => {
      const item = doc.createElement('menuitem')
      item.setAttribute('label', languages[lang].name)
      item.setAttribute('data-gtranslate-to', lang)
      return item
    })
)

const langFromMenus = (languages, doc) => {
  const toItemsPopup = doc.createElement('menupopup')
  langToItems(languages, doc).forEach(item => toItemsPopup.appendChild(item))
  return Object.keys(languages)
    .filter(lang => !languages[lang].onlyTo)
    .map(lang => {
      const menu = doc.createElement('menu')
      menu.setAttribute('label', languages[lang].fromName || languages[lang].name)
      menu.setAttribute('data-gtranslate-from', lang)
      menu.appendChild(toItemsPopup.cloneNode(true))
      return menu
    })
}

// Returns the current selection based on the active node
const getSelectionFromNode = node => {
  const contentWin = node.ownerDocument.defaultView
  const name = node.nodeName.toLowerCase()
  const text = contentWin.getSelection().toString().trim()
  if (text) {
    return text
  }
  if (name === 'input' || name === 'textarea') {
    return node.value.substr(
      node.selectionStart,
      node.selectionEnd-node.selectionStart
    ) || null
  }
  if (name === 'a') {
    return node.textContent || node.title || null
  }
  if (name === 'img') {
    return node.alt || node.title || null
  }
  return null
}

// Returns the current selection from a window
const getSelectionFromWin = win => {
  const popupNode = win.gContextMenuContentData.popupNode
  return (popupNode && getSelectionFromNode(popupNode)) || ''
}

// Addon loaded
const start = () => {
  const win = getMostRecentBrowserWindow()
  const doc = win.document
  const cmNode = doc.getElementById('contentAreaContextMenu')
  const elt = eltCreator(doc)

  const translateMenu = elt(
    'menu', { className: 'menu-iconic' },
    { label: LABEL_TRANSLATE, image: self.data.url('menuitem.svg') }
  )
  const translatePopup = elt('menupopup', null, null, translateMenu)
  const result = elt('menuitem', null, null, translatePopup)
  const resultSeparator = elt('menuseparator', null, null, translatePopup)
  const langMenu = elt('menu', null, null, translatePopup)
  const fromPopup = elt('menupopup', null, null, langMenu)
  const fromMenus = langFromMenus(languages, doc)

  fromMenus.forEach(menu => fromPopup.appendChild(menu))

  const updateResult = translation => {
    result.setAttribute('tooltiptext', translation || '')
    result.setAttribute('label', translation || LABEL_LOADING)
  }

  // Update the menu when the preferences are updated
  sp.on('', () => {
    updateLangMenuLabel()
    updateLangMenuChecks()
  })

  // Update the languages menu label (“Change Languages […]”)
  const updateLangMenuLabel = detected => {
    const from = detected? `${languages[detected].name} - detected` : currentFrom().name
    const to = currentTo().name
    langMenu.setAttribute('label', strParams(LABEL_CHANGE_LANGUAGES, from, to))
  }

  const updateLangMenuChecks = () => {

    // Uncheck
    const checkedElts = fromPopup.querySelectorAll('[checked]')
    for (let elt of checkedElts) elt.removeAttribute('checked')

    // Check
    const from = currentFrom().code
    const to = currentTo().code
    const fromMenu = fromPopup.querySelector(`[data-gtranslate-from="${from}"]`)
    const toItem = fromMenu && fromMenu.querySelector(`[data-gtranslate-to="${to}"]`)
    if (fromMenu && toItem) {
      fromMenu.setAttribute('checked', true)
      toItem.setAttribute('checked', true)
    }
  }

  // Show the context menupopup
  const showContextMenu = event => {
    const selection = getSelectionFromWin(win)

    translateMenu.setAttribute('hidden', !selection)
    if (!selection) return

    var selectionLabel = selection;
    if (selectionLabel.length > 15) {
      selectionLabel = selectionLabel.substr(0, 15)+"…";
    }
    translateMenu.setAttribute('label', strParams(LABEL_TRANSLATE, selectionLabel))
    updateResult(null)
    updateLangMenuLabel()
  }

  // Show the results menupopup
  const showResultsMenu = event => {
    const selection = getSelectionFromWin(win)

    translate(currentFrom().code, currentTo().code, selection, res => {
      updateResult(res.translation)
      if (sp.prefs.lang_from === 'auto') {
        updateLangMenuLabel(res.detectedSource)
      }
    })
  }

  // Listen to popupshowing events
  const onPopupshowing = event => {
    if (event.target === cmNode) {
      return showContextMenu(event)
    }
    if (event.target === translatePopup) {
      return showResultsMenu(event)
    }
  }

  // Listen to command events
  const onContextCommand = event => {
    const target = event.target
    const parent = target.parentNode && target.parentNode.parentNode
    const selection = getSelectionFromWin(win)

    // Open the translation page
    if (target === result) {
      tabs.open(translateUrl(currentFrom().code, currentTo().code, selection))
      return
    }

    // Language change
    if (target.hasAttribute('data-gtranslate-to') &&
        parent && parent.hasAttribute('data-gtranslate-from')) {
      sp.prefs.lang_to = target.getAttribute('data-gtranslate-to')
      sp.prefs.lang_from = parent.getAttribute('data-gtranslate-from')
    }
  }

  cmNode.insertBefore(translateMenu, doc.getElementById('inspect-separator'));
  cmNode.addEventListener('popupshowing', onPopupshowing)
  cmNode.addEventListener('command', onContextCommand)

  updateLangMenuChecks()

  // Addon unloaded
  addonUnload.when(() => {
    cmNode.removeEventListener('popupshowing', onPopupshowing)
    cmNode.removeEventListener('command', onContextCommand)
    cmNode.removeChild(translateMenu)
  })
}

start()
