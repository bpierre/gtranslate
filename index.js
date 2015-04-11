const cm = require('sdk/context-menu')
const { onMenuShowing } = require('./onmenushowing')
const { setTimeout } = require('sdk/timers')
const { translate } = require('./providers/google-translate')
const selection = require('sdk/selection')

const FROM = 'auto'
const TO = 'fr'
const LABEL_LOADING = 'Loading…'

let lastSelectedText = ''

const item = cm.Item({
  label: 'Fetching translation…',
  data: 'my-item',
})

const menu = cm.Menu({
  label: 'Translate',
  data: 'my-menu',
  context: cm.SelectionContext(),
  items: [ item ],
  contentScript: `
    self.on('context', () => {
      const text = window.getSelection().toString().trim()
      self.postMessage(text)
      return 'Translate “ ' + text + '”'
    })
  `,
  onMessage(text) {
    lastSelectedText = text
  }
})

function loading(itemNode) {
  itemNode.disabled = true
  itemNode.setAttribute('tooltiptext', '')
  item.label = LABEL_LOADING
}

function loaded(itemNode, result) {
  itemNode.disabled = false
  itemNode.setAttribute('tooltiptext', result)
  item.label = result
}

onMenuShowing(menu, function(menuNode) {
  const itemNode = menuNode.querySelector('[value="my-item"]')
  loading(itemNode)
  translate(FROM, TO, lastSelectedText, res => {
    loaded(itemNode, res.translation)
  })
})
