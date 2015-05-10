const languages = require('../data/languages.json')

function getLanguagesList(languages) {
  var keys = Object.keys(languages)
  var names = keys
    .filter(function(key) {
      return !languages[key].onlyFrom
    })
    .map(function(key) {
      return languages[key].name
    })
  names[names.length - 1] = 'and ' + names[names.length - 1]
  return names.join(', ')
}

var langList = getLanguagesList(languages)

console.log('With gtranslate you can translate any text in a webpage just by selecting and right-clicking over it. The addon uses the Google Translate service to translate the text.')
console.log()
console.log('gtranslate is not affiliated with Google Inc. in any way.')
console.log()
console.log('Features:')
console.log('<ul>')
console.log('<li>Translates from/to the following languages: ' + langList + '.</li>')
console.log('<li>Auto detect the language.</li>')
console.log('<li>Image descriptions and links can be translated too.</li>')
console.log('</ul>')
