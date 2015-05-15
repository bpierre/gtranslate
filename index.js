'use strict'

const self = require('sdk/self')
const cm = require('sdk/context-menu')
const sp = require('sdk/simple-prefs')
const ps = require('sdk/preferences/service')
const tabs = require('sdk/tabs')
const { debounce } = require('sdk/lang/functional')
const { translate, translateUrl } = require('./providers/google-translate')
const { getMostRecentBrowserWindow } = require('sdk/window/utils')
const addonUnload = require('sdk/system/unload')
const windows = require('sdk/windows').browserWindows
const { viewFor } = require('sdk/view/core')
const Request = require('sdk/request').Request

// Context Menu
const LABEL_LOADING = 'Fetching translation…'
const LABEL_TRANSLATE = 'Translate “{0}”'
const LABEL_CHANGE_LANGUAGES = 'Change Languages ({0} > {1})'

// Get the available languages
const getLanguages = () => {
  return new Promise((resolve, reject) => {
    Request({
      url: self.data.url('languages.json'),
      onComplete: response => resolve(response.json),
    }).get()
  })
}

// Replace params in a string à la Python str.format()
const format = str => Array.from(arguments).slice(1).reduce(
  (str, arg, i) => str.replace(new RegExp(`\\{${i}\\}`, 'g'), arg), str
)

// Get the From language from the preferences
const currentFrom = languages => {
  const langCode = sp.prefs.lang_from
  const lang = languages[langCode]
  return {
    code: langCode,
    name: (lang && (lang.fromName || lang.name)) || null,
  }
}

// Get the To language from the preferences
const currentTo = languages => {
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

// Add a gtranslate menu on a window
const initMenu = (win, languages) => {

  const doc = win.document
  const cmNode = doc.getElementById('contentAreaContextMenu')
  const elt = eltCreator(doc)

  const translateMenu = elt(
    'menu',
    { className: 'menu-iconic', id: 'context-gtranslate' },
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
    const from = detected? `${languages[detected].name} - detected` : currentFrom(languages).name
    const to = currentTo(languages).name
    langMenu.setAttribute('label', format(LABEL_CHANGE_LANGUAGES, from, to))
  }

  const updateLangMenuChecks = () => {

    // Uncheck
    const checkedElts = fromPopup.querySelectorAll('[checked]')
    for (let elt of checkedElts) elt.removeAttribute('checked')

    // Check
    const from = currentFrom(languages).code
    const to = currentTo(languages).code
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

    translateMenu.setAttribute('label', format(LABEL_TRANSLATE,
      selection.length > 15? selection.substr(0, 15) + '…' : selection
    ))

    updateResult(null)
    updateLangMenuLabel()
  }

  // Show the results menupopup
  const showResultsMenu = event => {
    const selection = getSelectionFromWin(win)

    translate(currentFrom(languages).code, currentTo(languages).code, selection, res => {
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
      const browser = getMostRecentBrowserWindow().gBrowser
      const url = translateUrl(currentFrom(languages).code, currentTo(languages).code, selection)
      const tab = browser.loadOneTab(url, {relatedToCurrent: true})
      browser.selectedTab = tab;
      return
    }

    // Language change
    if (target.hasAttribute('data-gtranslate-to') &&
        parent && parent.hasAttribute('data-gtranslate-from')) {
      sp.prefs.lang_to = target.getAttribute('data-gtranslate-to')
      sp.prefs.lang_from = parent.getAttribute('data-gtranslate-from')
    }
  }

  cmNode.insertBefore(translateMenu, doc.getElementById('inspect-separator'))
  cmNode.addEventListener('popupshowing', onPopupshowing)
  cmNode.addEventListener('command', onContextCommand)

  updateLangMenuChecks()

  return function destroy() {
    cmNode.removeEventListener('popupshowing', onPopupshowing)
    cmNode.removeEventListener('command', onContextCommand)
    cmNode.removeChild(translateMenu)
  }
}

// Init the addon
getLanguages().then(languages => {

  const destroyFns = []
  const initWin = sdkWin => {
    const destroy = initMenu(viewFor(sdkWin), languages)
    if (destroy) destroyFns.push(destroy)
  }

  // Init an instance when a new window is opened
  windows.on('open', initWin)

  // Init new instances on startup
  Array.from(windows).forEach(initWin)

  // When the addon is unloaded, destroy all gtranslate instances
  addonUnload.when(() => destroyFns.forEach(fn => fn()))
})
