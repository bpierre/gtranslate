const Request = require('sdk/request').Request

function translationResult(str) {

  const source = str.match(/\[\["[a-z]{2,}"\]/g)[0].substr(3).substr(0,2)

  // Clean empty entries in the result
  const cleanedResult = str.match(/(\[\[\["|"\],\[")([^"\\]|\\.)*"/gm)

  let translation = ''

  for (let i = 0, cleanedChunk = ''; i < cleanedResult.length; i++) {
    if (i > 0 && cleanedResult[i].startsWith('[[["')) {
      break
    }

    // Remove garbage, because js doesn't have positive lookback regex.
    // Fix \ to \\ for JSON parse to work, but dont fix \u2323,
    // JSON parse to fix \n's and \u232's

    cleanedChunk = cleanedResult[i].substr(i === 0? 3 : 4).replace(/\\(?=[^u])/g, '\\')

    try {
      translation += JSON.parse(cleanedChunk)
    } catch(e) {
      // do nothing
    }
  }

  return {
    detectedSource: source,
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
