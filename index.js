'use strict'

const self = require('sdk/self')
const cm = require('sdk/context-menu')
const sp = require('sdk/simple-prefs')
const ps = require('sdk/preferences/service')
const { debounce } = require('sdk/lang/functional')
const { translate } = require('./providers/google-translate')
const languages = require('./languages')
const { getMostRecentBrowserWindow } = require('sdk/window/utils')
const addonUnload = require('sdk/system/unload')

// Context Menu
const LABEL_LOADING = 'Loading…'
const LABEL_TRANSLATE = 'Translate “{0}”'

// Settings
sp.on('checkall', () => {
  const keys = Object.keys(languages)
  const check = !!keys.find(lang => !sp.prefs[`lang_${lang}`])
  keys.forEach(lang => { sp.prefs[`lang_${lang}`] = check })
})

// Get the From language from the preferences
const currentFrom = () => {
  const prefFrom = sp.prefs.lang_from
  return prefFrom
}

// Get the To language from the preferences
const currentTo = () => {
  let prefTo = sp.prefs.lang_to
  if (prefTo === 'auto') {
    prefTo = ps.get('general.useragent.locale', 'en')
    if (!prefTo.startsWith('zh')) {
      prefTo = prefTo.replace(/-[a-zA-Z]+$/, '')
    }
  }
  return prefTo
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
      item.setAttribute('gtranslate-to', lang)
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
      menu.setAttribute('label', languages[lang].name)
      menu.setAttribute('gtranslate-from', lang)
      menu.appendChild(toItemsPopup.cloneNode(true))
      return menu
    })
}

// Returns the current selection based on the active node
const getSelection = node => {
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

// Addon loaded
const start = () => {
  const win = getMostRecentBrowserWindow()
  const doc = win.document
  const cmNode = doc.getElementById('contentAreaContextMenu')
  const elt = eltCreator(doc)

  const translateMenu = elt(
    'menu', { className: 'menu-iconic' },
    { label: LABEL_TRANSLATE, image: self.data.url('menuitem.svg') },
    cmNode
  )
  const translatePopup = elt('menupopup', null, null, translateMenu)

  const result = elt('menuitem', null, null, translatePopup)
  const separator = elt('menuseparator', null, null, translatePopup)
  const langMenu = elt('menu', null, null, translatePopup)
  const fromPopup = elt('menupopup', null, null, langMenu)

  langFromMenus(languages, doc).forEach(menu => fromPopup.appendChild(menu))

  const updateResult = translation => {
    result.disabled = !translation
    result.setAttribute('tooltiptext', translation || '')
    result.setAttribute('label', translation || LABEL_LOADING)
  }

  // TODO: update the menu when the preferences are updated
  // sp.on('', () => updateLangItems())

  const updateLangMenu = detected => {
    const from = detected? `${languages[detected].name} (detected)` : languages[currentFrom()].name
    const to = languages[currentTo()].name
    langMenu.setAttribute('label', `${from} > ${to}`)
  }

  updateLangMenu()

  const onContextMenuShowing = event => {
    if (event.currentTarget !== event.target) return

    const selection = getSelection(event.target.triggerNode)
    translateMenu.setAttribute('label', LABEL_TRANSLATE.replace(/\{0\}/, selection))
    updateResult(null)

    translate(currentFrom(), currentTo(), selection, res => {
      updateResult(res.translation)
      if (sp.prefs.lang_from === 'auto') {
        updateLangMenu(res.detectedSource)
      }
    })
  }

  const onContextCommand = event => {
    const target = event.target
    const parent = target.parentNode && target.parentNode.parentNode
    if (target.hasAttribute('gtranslate-to') &&
        parent && parent.hasAttribute('gtranslate-from')) {
      sp.prefs.lang_to = target.getAttribute('gtranslate-to')
      sp.prefs.lang_from = parent.getAttribute('gtranslate-from')
    }
  }

  cmNode.addEventListener('popupshowing', onContextMenuShowing)
  cmNode.addEventListener('command', onContextCommand)

  // Addon unloaded
  addonUnload.when(() => {
    cmNode.removeEventListener('popupshowing', onMenuPopupshowing)
    cmNode.removeEventListener('command', onContextCommand)
  })
}

start()
