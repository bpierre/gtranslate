/* -*- coding: utf-8 -*- */
/* global browser, translate, translateUrl, translatePageUrl, LABEL_TRANSLATE_ERROR, _ */

const sp = browser.storage.sync;

const translatePageId = 'gtranslate_page';
const translateMenuId = 'gtranslate_selection';
const resultId = 'gtranslate_result';
const copyToClipboardId = 'gtranslate_clipboard';

var translation = ''; // holds the translation currently visible in context menu

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
    let langCode = langToPref || (await sp.get("langTo")).langTo;
    const locale = browser.i18n.getUILanguage();
    if (langCode === 'auto') {
	if (!locale.startsWith('zh')) {
	    langCode = locale.replace(/-[a-zA-Z]+$/, '');
	}
    }
    return langCode;
};

async function translatePage(info, tab) {
    const from = (await sp.get("langFrom")).langFrom;
    const to = await currentTo();
    openTab(translatePageUrl(from, to, tab.url), tab);
}

async function translateSelectionNewTab(info, tab) {
    const from = (await sp.get("langFrom")).langFrom;
    const to = await currentTo();
    openTab(translateUrl(from, to, info.selectionText || info.linkText), tab);
}

async function translatePageItem() {
    const from = (await sp.get("langFrom")).langFrom;
    const to = await currentTo();
    const label = format(_('translate_page'), from, to);
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

browser.menus.onShown.addListener(async (info, tab) => {
    if (info.menuIds.includes(resultId)) {
	if (info.contexts.includes('link') && !info.contexts.includes('selection')) {
	    browser.menus.update(translateMenuId, {title: _('translate').replace('%s', info.linkText)});
	    browser.menus.refresh();
	}
	const fromCode = (await sp.get("langFrom")).langFrom;
	const toCode = await currentTo();
	const response = await translate(fromCode, toCode, info.selectionText || info.linkText);
	translation = response.translation;
	browser.menus.update(resultId, {title: translation});
	if (translation === LABEL_TRANSLATE_ERROR)
	    browser.menus.remove(copyToClipboardId);
	browser.menus.refresh();	
    }
});

browser.menus.onHidden.addListener(() => {
    browser.menus.update(translateMenuId, {title: _('translate')});
    browser.menus.update(resultId, {title: _('fetch_translation')});
    if (translation === LABEL_TRANSLATE_ERROR)	 
	browser.menus.create(copyToClipboardItem());
    translation = '';
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
