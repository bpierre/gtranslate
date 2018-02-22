/* global browser */

const $ = document.querySelector.bind(document);
const main = browser.extension.getBackgroundPage();
const elt = main.eltCreator(document);

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
	langTo: $('#tolang_dropdown').value
    });
    e.preventDefault();
}

async function restoreOptions() {
    const langs = await main.getLanguages();
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
}

document.addEventListener('DOMContentLoaded', restoreOptions);
$('form').addEventListener('submit', saveOptions);
