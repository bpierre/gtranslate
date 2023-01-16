/* -*- coding: utf-8 -*- */
/* global browser, translate, translateUrl, translatePageUrl, LABEL_TRANSLATE_ERROR, _ */

const sp = browser.storage.sync;

const translatePageId = 'gtranslate_page';
const translateMenuId = 'gtranslate_selection';
const separator2Id = 'gtranslate_separator2';
const resultId = 'gtranslate_result';
const copyToClipboardId = 'gtranslate_clipboard';

var translation = ''; // holds the translation currently visible in context menu
var translationLines = 0; //holds the number of lines of the translation, equals the number of content menu subitems.

// Replace params in a string à la Python str.format()
const format = (origStr, ...args) => Array.from(args).reduce(
  (str, arg, i) => str.replace(new RegExp(`\\{${i}\\}`, 'g'), arg), origStr
);

// Open a new tab near to the active tab
function openTab(url, currentTab) {
    browser.tabs.create({url: url,
			 active: true,
			 openerTabId: currentTab.id,
			 index: currentTab.index + 1});
};

// Get the To language from the preferences
async function currentTo(langToPref) {
    let {langTo=langToPref} = await sp.get("langTo");
    const locale = browser.i18n.getUILanguage();
    if (langTo === 'auto' && !locale.startsWith('zh'))
	langTo = locale.replace(/-[a-zA-Z]+$/, '');
    return langTo;
};

async function translatePage(info, tab) {
    const {langFrom} = await sp.get("langFrom");
    const langTo = await currentTo();
    openTab(translatePageUrl(langFrom, langTo, tab.url), tab);
}

async function translateSelectionNewTab(info, tab) {
    const {langFrom} = await sp.get("langFrom");
    const langTo = await currentTo();
    openTab(translateUrl(langFrom, langTo, info.selectionText || info.linkText), tab);
}

async function translatePageItem() {
    const {langFrom} = await sp.get("langFrom");
    const langTo = await currentTo();
    const label = format(_('translate_page'), langFrom, langTo);
    return {
	id: translatePageId,
	title: label,
	icons: {'16': 'graphics/menuitem.svg'},
	contexts: ['page'],
	onclick: translatePage
    };
}

function copyToClipboardItem() {     
    return {
	id: copyToClipboardId,
	title: _('copy_to_clipboard'),
	parentId: translateMenuId,
	onclick: copyTranslationToClipboard
    };
}

function copyTranslationToClipboard(info) {
    browser.tabs.executeScript({
	code: 'copyToClipboard("' + translation + '");'
    });
}

async function init() {
    if ((await sp.get("fullPage")).fullPage)
	browser.menus.create(await translatePageItem());

    browser.menus.create({
	id: translateMenuId,
	title: _('translate'),
	icons: {'16': 'graphics/menuitem.svg'},
	contexts: ['selection', 'link']
    });

    browser.menus.create({
	id: resultId,
	title: _('fetch_translation'),
	parentId: translateMenuId,
	onclick: translateSelectionNewTab
    });

    browser.menus.create({
	type: 'separator',
	parentId: translateMenuId
    });
    
    browser.menus.create(copyToClipboardItem());
}

init();

var lastMenuInstanceId = 0;
var nextMenuInstanceId = 1;

function writeMenus(translatedText) {
    var chunks = splita(translatedText, 81);
    translationLines = chunks.length;
    for (var i = 0; i < chunks.length; i++) {
	if(i == 0) {
	    browser.menus.update(resultId, {title: chunks[i]});
	} else {
	    browser.menus.create({
		id: resultId + i,
		parentId: translateMenuId,
		title: chunks[i],
		contexts: ["selection"]
	    });
	}
    }
    browser.menus.remove(copyToClipboardId);
    browser.menus.create({
	type: 'separator',
	parentId: translateMenuId,
	id: separator2Id
    });
    browser.menus.create(copyToClipboardItem());
}

function splitter(str, l){
    var strs = [];
    while(str.length > l){
        var pos = str.substring(0, l).lastIndexOf(' ');
        pos = pos <= 0 ? l : pos;
        strs.push(str.substring(0, pos));
        var i = str.indexOf(' ', pos)+1;
        if(i < pos || i > pos+l)
            i = pos;
        str = str.substring(i);
    }
    strs.push(str);
    return strs;
}

function splita(str, l) {
    var lines = str.split("\n");
    var strs = [];
    for(var i = 0; i < lines.length; i++) {
	var arr = splitter(lines[i], l);
	strs.push(...arr);
    }
    return strs;
}

browser.menus.onShown.addListener(async (info, tab) => {
    const menuInstanceId = lastMenuInstanceId = nextMenuInstanceId++;
    
    if (info.menuIds.includes(resultId)) {
	if (info.contexts.includes('link') && !info.contexts.includes('selection')) {
	    browser.menus.update(translateMenuId, {title: _('translate').replace('%s', info.linkText)});
	    browser.menus.refresh();
	}
	const {langFrom, extraInfo, dictionaryPref} = await sp.get(["langFrom", "extraInfo", "dictionaryPref"]);
	const langTo = await currentTo();
	const res = await translate(langFrom, langTo, info.selectionText || info.linkText);
	
	if (menuInstanceId !== lastMenuInstanceId)
	    return; // Menu was closed in the meantime
	
	if (extraInfo && (res.translation || res.alternatives || res.synonyms)) {
	    switch (dictionaryPref) {
	    case 'A':
		if(res.alternatives) {
		    translation = res.translation + '\n' + res.alternatives;
		} else if (res.dictionary) {
		    translation = res.translation + '\n' + res.dictionary;
		} else if (res.synonyms) {
		    translation = res.translation + '\n' + res.synonyms;
		}
		break;
	    case 'D':
		if(res.dictionary) {
		    translation = res.translation + '\n' + res.dictionary;
		} else if (res.alternatives) {
		    translation = res.translation + '\n' + res.alternatives;
		} else if (res.synonyms) {
		    translation = res.translation + '\n' + res.synonyms;
		}
		break;
	    case 'S':
		if(res.synonyms) {
		    translation = res.translation + '\n' + res.synonyms;
		} else if (res.dictionary) {
		    translation = res.translation + '\n' + res.dictionary;
		} else if (res.alternatives) {
		    translation = res.translation + '\n' + res.alternatives;
		}
		break;
	    }
	    writeMenus(translation);	
	}
	else {
	    translation = res.translation;
	    browser.menus.update(resultId, {title: translation});	    
	}
	
	if (translation === LABEL_TRANSLATE_ERROR)
	    browser.menus.remove(copyToClipboardId);
	browser.menus.refresh();
    }
});

browser.menus.onHidden.addListener(() => {
    lastMenuInstanceId = 0;
    
    browser.menus.update(translateMenuId, {title: _('translate')});
    browser.menus.update(resultId, {title: _('fetch_translation')});
    if (translation === LABEL_TRANSLATE_ERROR)	 
	browser.menus.create(copyToClipboardItem());
    translation = '';
    
    for (var i = 1; i < translationLines; i++) {
	browser.menus.remove(resultId + i);
    }
    browser.menus.remove(separator2Id);
});

browser.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === 'sync') {
	const fullPage = changes.fullPage;
	if (!fullPage.oldValue && fullPage.newValue)
	    browser.menus.create(await translatePageItem());
	else if (fullPage.oldValue && !fullPage.newValue)
	    browser.menus.remove(translatePageId);
	else if (fullPage.oldValue && fullPage.newValue) {
	    const from = changes.langFrom.newValue;
	    const to = await currentTo(changes.langTo.newValue);
	    browser.menus.update(translatePageId, {
		title: format(_('translate_page'), from, to)
	    });
	}
    }
});
