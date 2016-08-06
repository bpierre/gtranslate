'use strict'

/* A script to get the languages Google Translate supports in different
 * languages to ease the localizing effort.
 *
 * usage: node get_languages.js LANGUAGE
 */

const https = require('https')
const path = require('path')
const cheerio = require('cheerio')

const getLanguages = (elems) => {
    return elems
        .children()
        .slice(2)
        .map((_, e) => {
            return e.children[0].data
        })
        .get()
}

if (process.argv.length !== 3) {
    const paths = process.argv.
        map(arg => path.basename(arg))
    console.error('usage: ' + paths[0] + ' ' + paths[1] + ' LANGUAGE')
    process.exit(1)
}

const language = process.argv[2]
const options = {
    hostname: 'translate.google.com',
    headers: {
        // Without a proper User-Agent, Google doesn't return valid UTF-8?
        'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:47.0)' +
            'Gecko/20100101 Firefox/47.0',
        'Accept-Language': language,
    },
}
https.get(options, res => {
    let html = ''
    res.on('data', d => {
        html += d
    })

    res.on('end', () => {
        const che = cheerio.load(html)
        // From and to languages differ, get both.
        const from = new Set(getLanguages(che('select#gt-sl')))
        const to = new Set(getLanguages(che('select#gt-tl')))
        const union = new Set(Array.from(from).concat(Array.from(to)))
        console.log(Array.from(union)
            .sort()
            .join(', '))
    })
}).on('error', e => {
    console.error(e)
})
