/* global require,exports,console */
'use strict'

const request = require('sdk/request').Request

function translationResult(str, onError) {
  let newstr = '['
  let insideQuote = false
  str = str.replace(/\\(?=[^u])/g, '\\')

  // Fix the Google Translate JSON
  // start at 1, take into acount opening brace
  for (let i = 1, q = 0, len = str.length, prev; i < len; i++) {
    prev = str[i - 1]
    if (str[i] === '"' && prev !== '\\') {
      q++
    }
    insideQuote = q % 2 !== 0
    if (!insideQuote && str[i] === ',' && (prev === ',' || prev === '[' )) {
      newstr += '""'
    }
    newstr += str[i]
  }

  let result = [null, null, null]
  let parseError = false
  try {
    result = JSON.parse(newstr)
  } catch (e) {
    if (onError) {
      onError(newstr)
    }
    parseError = true
  }

  const translation = parseError ? 'Google Translate Service Error' : (
    result[0] && result[0].map(chunk => chunk[0]).join(' ')
  ) || null

  const alternatives = (
    result[1] && result[1].map(chunk => (
      chunk[0] + ':\n ' + chunk[2].map(chunk => (
        chunk[0] + ': ' + Array(
          (10 - chunk[0].length) > 0 ? 10 - chunk[0].length : 0
        ).join(' ') + '\t' + chunk[1].join(', ')
      )).join('\n ')
    )).join('\n\n')
  ) || null

  const dict = (
    result[12] && result[12].map(chunk => (
      chunk[0] + ' \n ' + chunk[1].map(chunky => (
        chunky[0] + ' \n  "' +  chunky[2] + '"'
      )).join(' \n ')
    )).join('\n\n')
  ) || null

  const syno = (
    result[11] && result[11].map(chunk => (
      chunk[0] + ' \n ' + chunk[1].map(chunky => (
        chunky[0].join(', ')
      )).join(' \n ')
    )).join('\n\n')
  ) || null

  return {
    detectedSource: result[2],
    translation: translation ? translation.trim() : null,
    alternatives: alternatives ? alternatives.trim() : null,
    dictionary: dict ? dict.trim() : null,
    synonyms: syno ? syno.trim() : null,
  }
}

function apiUrl(from, to, text) {
  const protocol = 'http://'
  const host = 'translate.google.com'
  const path = `/translate_a/single?client=t&ie=UTF-8&oe=UTF-8` +
               `&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&dt=at` +
               `&q=${encodeURIComponent(text)}&sl=${from}&tl=${to}&hl=${to}`
  return `${protocol}${host}${path}`
}

function pageUrl(from, to, text) {
  const protocol = 'https://'
  const host = 'translate.google.com'
  return `${protocol}${host}/#${from}/${to}/${encodeURIComponent(text)}`
}

function wholePageUrl(from, to, url) {
  const base = 'https://translate.google.com'
  return `${base}/translate?sl=${from}&hl=${to}&u=${encodeURIComponent(url)}`
}

exports.translate = function translate(from, to, text, cb) {
  const url = apiUrl(from, to, text)
  const onComplete = res => {
    const translation = translationResult(res.text, () => {
      console.log(`[gtranslate] parse error with ${url}`)
    })
    return cb(translation)
  }
  const req = request({ url, onComplete })
  req.get()
}

exports.translateUrl = pageUrl
exports.translatePageUrl = wholePageUrl
