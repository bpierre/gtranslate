'use strict'

const cm = require('sdk/context-menu')
const sp = require('sdk/simple-prefs')
const { onMenuPopupshowing } = require('./menu-popupshowing')
const { setTimeout } = require('sdk/timers')
const { translate } = require('./providers/google-translate')
const languages = require('./languages')

// Settings
sp.on('checkall', () => {
  const keys = Object.keys(languages)
  const check = !!keys.find(lang => !sp.prefs[`lang_${lang}`])
  keys.forEach(lang => {
    sp.prefs[`lang_${lang}`] = check
  })
})

// Context Menu
const FROM = 'auto'
const TO = 'fr'
const LABEL_LOADING = 'Loading…'
const LABEL_TRANSLATE = 'Translate “{0}”'

let lastSelectedText = ''

const translationItem = cm.Item({
  label: 'Fetching translation…',
  data: 'translation-item',
})

const languagesMenu = cm.Menu({
  label: `Change languages (${FROM} → ${TO})`,
  items: [  ]
})

const menu = cm.Menu({
  label: 'Translate',
  image: 'resource://gtranslate/menuitem.svg',
  data: 'gtranslate-menu',
  items: [ translationItem, cm.Separator(), languagesMenu ],
  contentScriptFile: 'resource://gtranslate/menu-contentscript.js',
  onMessage(text) {
    lastSelectedText = text.trim()
    menu.label = LABEL_TRANSLATE.replace(/\{0\}/, lastSelectedText)
  }
})

function loading(itemNode) {
  itemNode.disabled = true
  itemNode.setAttribute('tooltiptext', '')
  translationItem.label = LABEL_LOADING
}

function loaded(itemNode, result) {
  itemNode.disabled = false
  itemNode.setAttribute('tooltiptext', result)
  translationItem.label = result
}

onMenuPopupshowing(menu, function(menuNode) {
  const itemNode = menuNode.querySelector('[value="translation-item"]')
  loading(itemNode)
  translate(FROM, TO, lastSelectedText, res => {
    loaded(itemNode, res.translation)
  })
})
