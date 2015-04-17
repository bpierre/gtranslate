'use strict'

self.on('context', node => {
  const name = node.nodeName.toLowerCase()
  const text = window.getSelection().toString().trim()
  if (text) {
    self.postMessage({ type: 'selection', value: text })
    return true
  }
  if (name === 'a') {
    const text = node.textContent || node.title
    if (text) self.postMessage({ type: 'selection', value: text })
    return !!text
  }
  if (name === 'img') {
    const text = node.alt || node.title
    if (text) self.postMessage({ type: 'selection', value: text })
    return !!text
  }
  return false
})

self.on('click', (node, data) => {
  if (data.startsWith('from:')) {
    self.postMessage({ type: 'from', value: data.slice('from:'.length) })
    return
  }
  if (data.startsWith('to:')) {
    self.postMessage({ type: 'to', value: data.slice('to:'.length) })
    return
  }
  if (data === 'invert') {
    self.postMessage({ type: 'invert' })
    return
  }
})
