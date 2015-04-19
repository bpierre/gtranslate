'use strict'

const self = require('sdk/self')
const cm = require('sdk/context-menu')
const sp = require('sdk/simple-prefs')
const ps = require('sdk/preferences/service')
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
const LABEL_LOADING = 'Loading…'
const LABEL_TRANSLATE = 'Translate “{0}”'
const LABEL_CHANGE_FROM = 'Translate from {0}'
const LABEL_CHANGE_TO = 'Translate to {0}'

let lastSelectedText = ''

function currentFrom() {
  const prefFrom = sp.prefs.lang_from
  return prefFrom
}

function currentTo() {
  let prefTo = sp.prefs.lang_to
  if (prefTo === 'auto') {
    prefTo = ps.get('general.useragent.locale', 'en')
    if (!prefTo.startsWith('zh')) {
      prefTo = prefTo.replace(/-[a-zA-Z]+$/, '')
    }
  }
  return prefTo
}

const translationItem = cm.Item({
  label: 'Fetching translation…',
  data: 'translation-item',
})

const langFromItems = languages => (
  Object.keys(languages)
    .filter(lang => !languages[lang].onlyTo)
    .map(lang => cm.Item({
      label: languages[lang].name,
      data: `from:${lang}`,
    }))
)

const langToItems = languages => (
  Object.keys(languages)
   .filter(lang => !languages[lang].onlyFrom)
    .map(lang => cm.Item({
      label: languages[lang].name,
      data: `to:${lang}`,
    }))
)

const menuFrom = cm.Menu({
  label: LABEL_CHANGE_FROM.replace(/\{0\}/, languages[currentFrom()].name),
  items: langFromItems(languages),
})

const menuTo = cm.Menu({
  label: LABEL_CHANGE_TO.replace(/\{0\}/, languages[currentTo()].name),
  items: langToItems(languages),
})

const updateFrom = lang => {
  sp.prefs.lang_from = lang
  menuFrom.label = LABEL_CHANGE_FROM.replace(/\{0\}/, languages[currentFrom()].name)
}

const updateTo = lang => {
  sp.prefs.lang_to = lang
  menuTo.label = LABEL_CHANGE_TO.replace(/\{0\}/, languages[currentTo()].name)
}

const onMenuMessage = msg => {
  if (msg.type === 'selection') {
    lastSelectedText = msg.value.trim()
    menu.label = LABEL_TRANSLATE.replace(/\{0\}/, lastSelectedText)
    return
  }
  if (msg.type === 'from') {
    updateFrom(msg.value)
    return
  }
  if (msg.type === 'to') {
    updateTo(msg.value)
    return
  }
  if (msg.type === 'invert') {
    const from = sp.prefs.lang_from
    const to = sp.prefs.lang_to
    updateTo(from)
    updateFrom(to)
  }
}

const menu = cm.Menu({
  label: 'Translate',
  image: self.data.url('menuitem.svg'),
  data: 'gtranslate-menu',
  items: [
    translationItem,
    cm.Separator(),
    menuFrom,
    menuTo,
    cm.Item({
      label: 'Invert',
      data: 'invert',
    }),
  ],
  contentScriptFile: self.data.url('menu-contentscript.js'),
  onMessage: onMenuMessage,
})

const loading = itemNode => {
  itemNode.disabled = true
  itemNode.setAttribute('tooltiptext', '')
  translationItem.label = LABEL_LOADING
}

const loaded = (itemNode, result) => {
  itemNode.disabled = false
  itemNode.setAttribute('tooltiptext', result)
  translationItem.label = result
}

onMenuPopupshowing(menu, menuNode => {
  const itemNode = menuNode.querySelector('[value="translation-item"]')
  loading(itemNode)
  translate(currentFrom(), currentTo(), lastSelectedText, res => {
    loaded(itemNode, res.translation)
    if (sp.prefs.lang_from === 'auto') {
        menuFrom.label = LABEL_CHANGE_FROM.replace(/\{0\}/, languages[res.detectedSource].name + " - detected")
    }
  })
})
