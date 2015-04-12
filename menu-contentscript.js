'use strict'

self.on('context', node => {
  const name = node.nodeName.toLowerCase()
  const text = window.getSelection().toString().trim()
  if (text) {
    self.postMessage(text)
    return true
  }
  if (name === 'a') {
    const text = node.textContent || node.title
    if (text) self.postMessage(text)
    return !!text
  }
  if (name === 'img') {
    const text = node.alt || node.title
    if (text) self.postMessage(text)
    return !!text
  }
  return false
})
