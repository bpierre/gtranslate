/* global require */
'use strict'

const self = require('sdk/self')
const sp = require('sdk/simple-prefs')
const ps = require('sdk/preferences/service')
const tabs = require('sdk/tabs')
const {
  translate,
  translateUrl,
  translatePageUrl,
} = require('./providers/google-translate')
const { getMostRecentBrowserWindow } = require('sdk/window/utils')
const addonUnload = require('sdk/system/unload')
const windows = require('sdk/windows').browserWindows
const { viewFor } = require('sdk/view/core')
const request = require('sdk/request').Request
const _ = require('sdk/l10n').get

// Context Menu
const LABEL_LOADING = _('fetch_translation')
const LABEL_TRANSLATE = _('translate')
const LABEL_TRANSLATE_PAGE = _('translate_page')
const LABEL_CHANGE_LANGUAGES = _('change_languages')

// Get the available languages
const getLanguages = () => new Promise((resolve) => {
  request({
    url: self.data.url('languages.json'),
    overrideMimeType: 'application/json',
    onComplete: response => resolve(response.json),
  }).get()
})

// Replace params in a string à la Python str.format()
const format = (origStr, ...args) => Array.from(args).reduce(
  (str, arg, i) => str.replace(new RegExp(`\\{${i}\\}`, 'g'), arg), origStr
)

// Get the From language from the preferences
const currentFrom = languages => {
  const langCode = sp.prefs.langFrom
  const locale = ps.getLocalized('general.useragent.locale', 'en')
  const lang = languages[langCode][locale]
  return {
    code: langCode,
    name: (lang && (lang.fromName || lang.name)) || null,
  }
}

// Get the To language from the preferences
const currentTo = languages => {
  let langCode = sp.prefs.langTo
  const locale = ps.getLocalized('general.useragent.locale', 'en')
  if (langCode === 'auto') {
    if (!locale.startsWith('zh')) {
      langCode = locale.replace(/-[a-zA-Z]+$/, '')
    }
  }
  const lang = languages[langCode][locale]
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

const cmpLanguages = (a, b, languages, locale) => {
  if (languages[a][locale].name < languages[b][locale].name)
    return -1
  if (languages[a][locale].name > languages[b][locale].name)
    return 1
  return 0
}

const langToItems = (languages, doc) => {
  const locale = ps.getLocalized('general.useragent.locale', 'en')
  return Object.keys(languages)
    .filter(lang => !languages[lang].onlyFrom)
    .sort((a, b) => {
      return cmpLanguages(a, b, languages, locale)
    })
    .map(lang => {
      const item = doc.createElement('menuitem')
      item.setAttribute('label',
        languages[lang][locale].toName || languages[lang][locale].name)
      item.setAttribute('data-gtranslate-to', lang)
      return item
    })
}

const langFromMenus = (languages, doc) => {
  const toItemsPopup = doc.createElement('menupopup')
  langToItems(languages, doc).forEach(item => toItemsPopup.appendChild(item))
  const locale = ps.getLocalized('general.useragent.locale', 'en')
  return Object.keys(languages)
    .filter(lang => !languages[lang].onlyTo)
    .sort((a, b) => {
      // Detect language is shown first.
      if (a === 'auto')
        return -1
      return cmpLanguages(a, b, languages, locale)
    })
    .map(lang => {
      const menu = doc.createElement('menu')
      menu.setAttribute(
        'label', languages[lang][locale].fromName ||
          languages[lang][locale].name
      )
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
      node.selectionEnd - node.selectionStart
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

// Get active tab url
const getCurrentUrl = () => {
  if (tabs.length === 0) return null
  const currentUrl = tabs.activeTab.url
  if (currentUrl.startsWith('about:')) return null
  return currentUrl
}

// Open a new tab near to the active tab
const openTab = url => {
  const browser = getMostRecentBrowserWindow().gBrowser
  const tab = browser.loadOneTab(url, {relatedToCurrent: true})
  browser.selectedTab = tab
}

// Add a gtranslate menu on a window
const initMenu = (win, languages) => {

  let selection = ''
  const doc = win.document
  const cmNode = doc.getElementById('contentAreaContextMenu')
  const elt = eltCreator(doc)

  const translateMenu = elt(
    'menu',
    { className: 'menu-iconic', id: 'context-gtranslate' },
    { label: LABEL_TRANSLATE, image: self.data.url('menuitem.svg') }
  )
  const translatePage = elt(
    'menuitem', { className: 'menuitem-iconic'},
    { label: LABEL_TRANSLATE_PAGE, image: self.data.url('menuitem.svg') }
  )
  const translatePopup = elt('menupopup', null, null, translateMenu)

  const result = elt('menuitem', null, null, translatePopup)
  elt('menuseparator', null, null, translatePopup)
  const langMenu = elt('menu', null, null, translatePopup)
  const fromPopup = elt('menupopup', null, null, langMenu)
  const fromMenus = langFromMenus(languages, doc)

  fromMenus.forEach(menu => fromPopup.appendChild(menu))

  const updateResult = (translation, dict) => {
    if (dict) {
      result.setAttribute('tooltiptext', translation + '\n' + dict)
    } else {
      result.setAttribute('tooltiptext', translation)
    }
    result.setAttribute('label', translation || LABEL_LOADING)
  }

  // Update the languages menu label (“Change Languages […]”)
  const updateLangMenuLabel = detected => {
    const locale = ps.getLocalized('general.useragent.locale', 'en')
    const from = detected ? languages[detected][locale] : currentFrom(languages)
    const to = currentTo(languages)
    langMenu.setAttribute('label', format(
      LABEL_CHANGE_LANGUAGES,
      from.name + (detected ? _('language_detected') : ''),
      to.name
    ))
    translatePage.setAttribute('label', format(
      LABEL_TRANSLATE_PAGE, from.code, to.code
    ))
  }

  // Update the languages menu selection
  const updateLangMenuChecks = () => {

    // Uncheck
    const checkedElts = fromPopup.querySelectorAll('[checked]')
    for (let checkedElt of checkedElts) checkedElt.removeAttribute('checked')

    // Check
    const from = currentFrom(languages).code
    const to = currentTo(languages).code
    const fromSel = `[data-gtranslate-from="${from}"]`
    const toSel = `[data-gtranslate-to="${to}"]`
    const fromMenu = fromPopup.querySelector(fromSel)
    const toItem = fromMenu && fromMenu.querySelector(toSel)
    if (fromMenu && toItem) {
      fromMenu.setAttribute('checked', true)
      toItem.setAttribute('checked', true)
    }
  }

  // Update the menu when the preferences are updated
  sp.on('', () => {
    updateLangMenuLabel()
    updateLangMenuChecks()
  })

  // Show the context menupopup
  const showContextMenu = () => {
    if (selection === '') {
      selection = getSelectionFromWin(win)
    }
    translateMenu.setAttribute('hidden', !selection)
    translatePage.setAttribute(
      'hidden', selection.length !== 0 || !getCurrentUrl()
    )
    if (!sp.prefs.fullPage) {
      translatePage.setAttribute('hidden', true)
    }

    if (selection) {
      translateMenu.setAttribute('label', format(LABEL_TRANSLATE,
        selection.length > 15 ? selection.substr(0, 15) + '…' : selection
      ))
      updateResult(null)
    }

    updateLangMenuLabel()
  }

  // Show the results menupopup
  const showResultsMenu = () => {
    if (selection === '') {
      selection = getSelectionFromWin(win)
    }
    const fromCode = currentFrom(languages).code
    const toCode = currentTo(languages).code
    translate(fromCode, toCode, selection, res => {
      switch (sp.prefs.dictionaryPref) {
      case 'A':
        if (res.alternatives) {
          updateResult(res.translation, res.alternatives)
        } else if (res.dictionary) {
          updateResult(res.translation, res.dictionary)
        } else {
          updateResult(res.translation, res.synonyms)
        }
        break
      case 'D':
        if (res.dictionary) {
          updateResult(res.translation, res.dictionary)
        } else if (res.alternatives) {
          updateResult(res.translation, res.alternatives)
        } else {
          updateResult(res.translation, res.synonyms)
        }
        break
      case 'S':
        if (res.synonyms) {
          updateResult(res.translation, res.synonyms)
        } else if (res.dictionary) {
          updateResult(res.translation, res.dictionary)
        } else {
          updateResult(res.translation, res.alternatives)
        }
        break
      }
      if (sp.prefs.langFrom === 'auto') {
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

   // Listen to popuphiding events
  const onPopuphiding = event => {
    if (event.target === cmNode) {
      selection = '' // clear old selection
    }
  }

  // Listen to command events
  const onContextCommand = event => {
    const target = event.target
    const parent = target.parentNode && target.parentNode.parentNode
    const from = currentFrom(languages).code
    const to = currentTo(languages).code

    // Open the translation page
    if (target === result) {
      openTab(translateUrl(from, to, selection))
      return
    }

    // Open the visited translation page
    if (target === translatePage) {
      openTab(translatePageUrl(from, to, getCurrentUrl()))
      return
    }

    // Language change
    if (target.hasAttribute('data-gtranslate-to') &&
        parent && parent.hasAttribute('data-gtranslate-from')) {
      sp.prefs.langTo = target.getAttribute('data-gtranslate-to')
      sp.prefs.langFrom = parent.getAttribute('data-gtranslate-from')
    }
  }

  const inspectorSeparatorElement = doc.getElementById('inspect-separator')
  cmNode.insertBefore(translateMenu, inspectorSeparatorElement)
  cmNode.insertBefore(translatePage, inspectorSeparatorElement)
  cmNode.addEventListener('popupshowing', onPopupshowing)
  cmNode.addEventListener('popuphiding', onPopuphiding)
  cmNode.addEventListener('command', onContextCommand)

  updateLangMenuChecks()

  return function destroy() {
    cmNode.removeEventListener('popupshowing', onPopupshowing)
    cmNode.removeEventListener('popuphiding', onPopuphiding)
    cmNode.removeEventListener('command', onContextCommand)
    cmNode.removeChild(translateMenu)
    cmNode.removeChild(translatePage)
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
