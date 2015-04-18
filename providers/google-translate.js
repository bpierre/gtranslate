const Request = require('sdk/request').Request

function translationResult(str) {

  //discard everything after first appearance of ,[[, extract translated text
  const cleanedStr = str.substring(0, str.indexOf(",[[")).match(/(\[\[\["|"\],\[")([^"\\]|\\.)*"/gm);
  
  translation = "";
  for (var i = 0; i < cleanedStr.length; i++) {
    if( i == 0) {
       // remove garbage, because js doesn't have positive lookback regex. Fix \ to \\ for json parse to work, but dont fix \u2323, json parse to fix \n's and \u232's
       translation += JSON.parse(cleanedStr[i].substr(3).replace(/\\(?=[^u])/g, "\\"));
    }
    else {
      if(cleanedStr[i].substr(0,4) == "[[[\"")
        break;
       translation +=  JSON.parse(cleanedStr[i].substr(4).replace(/\\(?=[^u])/g, "\\"));
    }
  }
  lang = str.match(/\[\["([a-zA-Z-]){2,}"\]/g);
  result = "";
  if(lang) {
       result = lang[0].substring(3, lang[0].length-2);
  }
  return {
    detectedSource: result,
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
