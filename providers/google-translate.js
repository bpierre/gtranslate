const Request = require('sdk/request').Request

function translationResult(str) {
  let newstr = '['
  let q = 0
  let insideQuote = false
  str = str.replace(/\\(?=[^u])/g, '\\')
  for (var i = 1, len = str.length; i < len; i++) { //start at 1, take into acount opening brace
    if (str[i] === '"'  && str[i-1] !== '\\') {
      q++
    }
    insideQuote = q % 2 !== 0
    if (!insideQuote && str[i] === ',' && (str[i-1] === ',' || str[i-1] === '[' )) {
      newstr += '""'
    }
    newstr += str[i]
  }

  let result = [null, null, null]
  try {
    result = JSON.parse(newstr)
  } catch(e) {
    // do nothing on parse error
  }

  const translation = (
    result[0] && result[0].map(chunk => chunk[0]).join(' ')
  ) || null

  return {
    detectedSource: result[2],
    translation: translation? translation.trim() : null,
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

exports.translate = function translate(from, to, text, cb) {
  const req = Request({
    url: apiUrl(from, to, text),
    onComplete: res => cb(translationResult(res.text)),
  })
  req.get()
}

exports.translateUrl = pageUrl
