/* global browser, fetch */

const $ = document.querySelector.bind(document);

// Utility function to create elements
function elt(name, props, attrs, parent) {
    const elt = document.createElement(name);
    if (props) Object.keys(props).forEach(p => elt[p] = props[p]);
    if (attrs) Object.keys(attrs).forEach(a => elt.setAttribute(a, attrs[a]));
    if (parent) parent.appendChild(elt);
    return elt;
}

async function getLanguages () {
    const url = browser.extension.getURL('data/languages.json');
    const response = await fetch(url);
    return response.json();
};

function cmpLanguages(a, b) {
  if (a === 'auto')
      return -1;
  else if (b === 'auto')
      return 1;
  else
      return a.localeCompare(b);
}

function saveOptions(e) {
    browser.storage.sync.set({
	fullPage: $('#fullpage_checkbox').checked,
	dictionaryPref: $('form').elements['dictionarypref_radiogroup'].value,
	langFrom: $('#fromlang_dropdown').value,
	langTo: $('#tolang_dropdown').value,
	extraInfo: $('#extrainfo_checkbox').checked
    });
    e.preventDefault();
}

async function restoreOptions() {
    const langs = await getLanguages();
    const prefs = await browser.storage.sync.get();
    
    Object.keys(langs)
        .filter(lang => !langs[lang].onlyTo)
	.sort(cmpLanguages)
	.map(lang => {
	    $('#fromlang_dropdown').add(elt('option', {value: lang, text: lang}, null, null));
	});
    Object.keys(langs)
        .filter(lang => !langs[lang].onlyFrom)
	.sort(cmpLanguages)
	.map(lang => {
	    $('#tolang_dropdown').add(elt('option', {value: lang, text: lang}, null, null));
	});
    
    $('#fullpage_checkbox').checked = prefs.fullPage || true;
    $('form').elements['dictionarypref_radiogroup'].value = prefs.dictionaryPref || "A";
    $('#fromlang_dropdown').value = prefs.langFrom || "auto";
    $('#tolang_dropdown').value = prefs.langTo || "auto";
    $('#extrainfo_checkbox').checked = prefs.extraInfo || false;
}

document.addEventListener('DOMContentLoaded', restoreOptions);
$('form').addEventListener('submit', saveOptions);
