/* eslint-env node */
'use strict';

const https = require('https');
const cheerio = require('cheerio');
const fs = require('fs');

/** Find longest alias for an option.
 * @param {Object} opts Option aliases.
 * @param {String} x Option.
 * @returns {String} Longest option alias.
 */
const findLong = (opts, x) => {
  return opts[x].reduce((prev, curr) => {
      return prev.length > curr.length ? prev : curr;
  }, x);
};

/** Find mutually exclusive arguments.
 * @param {Object} argv Arguments.
 * @param {Object} opts Option aliases.
 * @param {Iterable} a Arguments that can't be used with any in b.
 * @param {Iterable} b
 * @throws If there are mutually exclusive arguments.
 */
const mutex = (argv, opts, a, b) => {
  a.forEach(x => {
    b
      .filter(y => x !== y)
      .forEach(y => {
        if (argv[x] && argv[y]) {
          throw 'Mutually exclusive arguments ' +
		`'${findLong(opts, x)}' and '${findLong(opts, y)}'`;
        }
      });
  });
};

/** Validate command line arguments.
 * @param {Object} argv Arguments.
 * @param {Object} opts Option aliases.
 * @returns {Boolean} True if arguments are valid.
 * @throws If there are invalid arguments.
 */
const validateArgs = (argv, opts) => {
    const pMutex = mutex.bind(null, argv, opts);
    pMutex(['file'], ['list-languages', 'names']);
    pMutex(['language'], ['list-languages']);
    const args = ['list-languages', 'names', 'update'];
    pMutex(args, args);
  if (!argv.names && !argv['list-languages'] && !argv.update)
      throw "'names', 'list-languages' or 'update' option must be given";

    return true;
}

const argv = require('yargs')
  .usage('Usage: $0 OPTIONS...')
  .options({
    'list-languages': {
      type: 'boolean',
      description: 'Get all the languages supported by GT',
    },
    'l': {
      alias: 'language',
      type: 'string',
      description: 'Language ISO code',
      requiresArg: true,
    },
    'n': {
      alias: 'names',
      type: 'boolean',
      description: 'Get language translations for a locale',
    },
    'u': {
      alias: 'update',
      type: 'boolean',
      description: 'Add language translations to languages JSON',
    },
    'f': {
      alias: 'file',
      type: 'string',
      requiresArg: true,
      description: 'Languages JSON file',
    },
  })
  .check(validateArgs)
  .help('h')
  .alias('h', 'help')
  .strict()
      .argv;

/** Get language codes mapped to language names.
 * @param {Cheerio} elems Select tag and its children as Cheerio object. From
 * or to languages.
 * @param {Number} i Slice from the i'th element.
 * @return {Object}
 */
const getLanguages = (elems, i) => {
    const langs = {};
  elems
    .children()
    .slice(i)
    .each((_, e) => {
	langs[e.attribs.value] = e.children[0].data;
    });

    return langs;
};

const getFromLanguages = (che) => {
  // First two options are auto and separator, drop them.
    return getLanguages(che('select#gt-sl'), 2);
};

const getToLanguages = (che) => {
    return getLanguages(che('select#gt-tl'), 0);
};

/** Print supported language ISO codes.
 * @param {Cheerio} che GT page's HTML.
 */
const listLanguages = (che) => {
    const from = new Set(Object.keys(getFromLanguages(che)));
    const to = new Set(Object.keys(getToLanguages(che)));
    const all = new Set(Array.from(from).concat(Array.from(to)));
  console.log(Array.from(all)
    .sort()
	      .join('\n'));
};

/** Print supported language names in a wanted language.
 * @param {Cheerio} che GT page's HTML.
 */
const listNames = (che) => {
    const from = getFromLanguages(che);
    const all = new Set();
    Object.keys(from).forEach(k => all.add(from[k]));
    const to = getToLanguages(che);
    Object.keys(to).forEach(k => all.add(to[k]));

  console.log(Array.from(all)
    .sort()
	      .join('\n'));
};

/** Add language names to the languages JSON file or create it. JSON is printed
 * to stdout.
 * <pre>
 * Format:
 *  {
 *    "language": {               # ISO code.
 *      "rtl": true,              # Right-to-left language. Optional.
 *      "onlyTo": true,           # Optional.
 *      "onlyFrom": true,         # Optional.
 *      "translatedToLanguage": { # ISO code.
 *        "name": "...",
 *        "fromName": "...",      # Optional.
 *        "toName": "...",        # Optional.
 *      },
 *    },
 *    # ...
 *  }
 *  </pre>
 * @param {Cheerio} che GT page's HTML.
 * @param {String} language Language ISO code.
 * @param {String} [file] Languages JSON file.
 */
const updateLanguages = (che, language, file) => {
    const langs = file ? JSON.parse(fs.readFileSync(file, 'utf-8')) : {};

  // Keep auto.
    const from = getLanguages(che('select#gt-sl'), 0);
    delete from.separator;
    const to = getToLanguages(che);

  Object.keys(from)
    .forEach(kFrom => {
      // New language supported or creating languages from scratch.
      if (!(kFrom in langs)) {
          langs[kFrom] = { };
          langs[kFrom][language] = { name: from[kFrom] };
      } else {
        // New language translation.
        if (!(language in langs[kFrom]))
            langs[kFrom][language] = { name: from[kFrom] };
      }
      if (!(kFrom in to))
          langs[kFrom].onlyFrom = true;
      else {
        if (from[kFrom] !== to[kFrom])
            langs[kFrom][language].fromName = from[kFrom];
      }
    });

  Object.keys(to)
    .forEach(kTo => {
      if (!(kTo in langs)) {
          langs[kTo] = { };
          langs[kTo][language] = { name: to[kTo] };
      } else {
        if (!(language in langs[kTo]))
            langs[kTo][language] = { name: to[kTo] };
      }
      if (!(kTo in from))
          langs[kTo].onlyTo = true;
      else {
        if (to[kTo] !== from[kTo])
            langs[kTo][language].toName = to[kTo];
      }
    });

    console.log(JSON.stringify(langs, null, 4));
};

const options = {
  hostname: 'translate.google.com',
  headers: {
    // Without a proper User-Agent, Google doesn't return valid UTF-8?
    'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:47.0)' +
      'Gecko/20100101 Firefox/47.0',
      'Accept-Language': argv.language || 'en',;
  },
};

https.get(options, res => {
    res.setEncoding('UTF-8');

    let html = '';
  res.on('data', d => {
      html += d;
  });

  res.on('end', () => {
      const che = cheerio.load(html);

    if (argv['list-languages']) {
	listLanguages(che);
    } else if (argv.names) {
	listNames(che);
    } else if (argv.update) {
	updateLanguages(che, argv.language, argv.file);
    }
  });
}).on('error', e => {
    console.error(e);
});
