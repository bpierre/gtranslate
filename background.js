/* coding: utf-8 */
/* global browser, translate, translateUrl, translatePageUrl, LABEL_TRANSLATE_ERROR, _ */

const sp = browser.storage.sync;

const translatePageId = 'gtranslate_page';
const translateMenuId = 'gtranslate_selection';
const translateLinkId = 'gtranslate_link';
const resultId = 'gtranslate_result';
const linkResultId = 'gtranslate_link_result';
const copyToClipboardId = 'gtranslate_clipboard';
const copyLinkToClipboardId = 'gtranslate_link_clipboard';

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

async function getLangMenuLabel() {
    const from = (await sp.get("langFrom")).langFrom;
    const to = await currentTo();
    return format(_('translate_page'), from, to);
}

async function addTranslatePageItem() {
    const langMenuLabel = await getLangMenuLabel();
    browser.menus.create({
	id: translatePageId,
	title: langMenuLabel,
	icons: {'16': 'data/menuitem.svg'},
	contexts: ['page'],
	onclick: translatePage
    });
}

// These functions will be run as injected content scripts
function copyToClipboard(text, html) {
    function oncopy(event) {
        document.removeEventListener("copy", oncopy, true);
        event.stopImmediatePropagation();
        event.preventDefault();
        event.clipboardData.setData("text/plain", text);
        event.clipboardData.setData("text/html", html);
    }
    document.addEventListener("copy", oncopy, true);
    document.execCommand("copy");
}

function getSelection() {
    return document.getSelection().toString().trim();
}

async function init() {
    if ((await sp.get("fullPage")).fullPage)
	addTranslatePageItem();

    browser.menus.create({
	id: translateMenuId,
	title: _('translate'),
	icons: {'16': 'data/menuitem.svg'},
	contexts: ['selection']
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
    
    browser.menus.create({
	id: copyToClipboardId,
	title: _('copy_to_clipboard'),
	parentId: translateMenuId
    });

    browser.menus.create({
	id: translateLinkId,
	title: _('translate').replace('“%s”', 'link text'),
	icons: {'16': 'data/menuitem.svg'},
	contexts: ['link']
    });

    browser.menus.create({
	id: linkResultId,
	title: _('fetch_translation'),
	parentId: translateLinkId
    });

    browser.menus.create({
	type: 'separator',
	parentId: translateLinkId
    });
    
    browser.menus.create({
	id: copyLinkToClipboardId,
	title: _('copy_to_clipboard'),
	parentId: translateLinkId
    });
}

init();

browser.menus.onShown.addListener(async (info, tab) => {
    if (info.menuIds.includes(resultId)) {
	const selection = await browser.tabs.executeScript({
	    code: getSelection.toString() + '\ngetSelection();'
	});
	
	const fromCode = (await sp.get("langFrom")).langFrom;
	const toCode = await currentTo();
	const response = await translate(fromCode, toCode, selection[0]);
	browser.menus.update(resultId, {title: response.translation});
	browser.menus.refresh();	
    }
});

browser.menus.onHidden.addListener(() => {
    browser.menus.update(resultId, {title: _('fetch_translation')});
});

browser.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === 'sync') {
	const fullPage = changes.fullPage;
	if (!fullPage.oldValue && fullPage.newValue)
	    addTranslatePageItem();
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
