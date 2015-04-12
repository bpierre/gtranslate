'use strict'

const cm = require('sdk/context-menu')
const { getMostRecentBrowserWindow } = require('sdk/window/utils')
const { uuid } = require('sdk/util/uuid')

function onMenuPopupshowing(menu, cb) {
  const document = getMostRecentBrowserWindow().document
  const cmNode = document.getElementById('contentAreaContextMenu')

  const refId = uuid()
  const refItem = cm.Item({ label: refId, data: refId })
  let menuNode = null

  menu.addItem(refItem)

  function popupshowing(event) {
    if (!event.target || event.target === cmNode) return
    if (menuNode) {
      if (menuNode === event.target) cb(menuNode)
      return
    }
    const refItemNode = cmNode.querySelector(`[value="${refId}"]`)
    if (!refItemNode) return
    cb(menuNode = refItemNode.parentElement)
    refItem.destroy()
  }

  cmNode.addEventListener('popupshowing', popupshowing)
  return function off() {
    cmNode.removeEventListener('popupshowing', popupshowing)
  }
}

exports.onMenuPopupshowing = onMenuPopupshowing
