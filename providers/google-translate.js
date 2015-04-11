const Request = require('sdk/request').Request

function translationResult(str) {

  // Clean empty entries in the result
  const cleanedStr = str.replace(/,[\s*,]+/gm, ',')

  const result = JSON.parse(cleanedStr)

  const translation = (
    result[0] && result[0].map(chunk => chunk[0]).join(' ')
  ) || null

  return {
    detectedSource: result[1],
    translation: translation? translation.trim() : null,
  }
}

function url(from, to, text) {
  const protocol = 'http://'
  const host = 'translate.google.com'
  const path = `/translate_a/single?client=t&ie=UTF-8&oe=UTF-8` +
               `&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&dt=at` +
               `&q=${encodeURIComponent(text)}&sl=${from}&tl=${to}&hl=${to}`
  return `${protocol}${host}${path}`
}

exports.translate = function translate(from, to, text, cb) {
  const req = Request({
    url: url(from, to, text),
    onComplete: res => cb(translationResult(res.text))
  })
  req.get()
}
