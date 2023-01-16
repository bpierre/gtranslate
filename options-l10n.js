/**
 * Translates a HTMl page in the web l10n style from the Add-on SDK with
 * WebExtensions strings.
 * Large parts of the logic are very similar to the SDK implmentation.
 * All you have to do to use this in a document is load it.
 *
 * It supports some additional attributes:
 *   - The "translate" attribute is fully respected (see
 *     https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/translate)
 *   - "data-l10n-nocontent" means that the text content of the element
 *     will not be attempted to be translated.
 *
 * @author Martin Giger
 * @license MPL-2.0
 */

function translateElementAttributes(element) {
    const attrList = [ 'title', 'accesskey', 'alt', 'label', 'placeholder', 'abbr', 'content', 'download', 'srcdoc', 'value' ];
    const ariaAttrMap = {
        'aria-label': 'ariaLabel',
        'aria-value-text': 'ariaValueText',
        'aria-moz-hint': 'ariaMozHint'
    };
    const attrSeparator = '.';

    const presentAttributes = element.dataset.l10nAttrs.split(",");

    // Translate allowed attributes.
    for(let attribute of presentAttributes) {
        let data;
        if(attrList.includes(attribute)) {
            data = browser.i18n.getMessage(element.dataset.l10nId + attrSeparator + attribute);
        }
        // Translate ARIA attributes
        else if(attribute in ariaAttrMap) {
            data = browser.i18n.getMessage(element.dataset.l10nId + attrSeparator + ariaAttrMap[attribute]);
        }

        if(data && data != "??") {
            element.setAttribute(attribute, data);
        }
    }
}

const C_TRANSLATE_VALUES = [
    'yes',
    'no'
];
function getTranslateState(element) {
    if(element.hasAttribute("translate") && C_TRANSLATE_VALUES.includes(element.getAttribute("translate"))) {
        return element.getAttribute("translate");
    }
    const closestTranslate = element.closest('[translate]:not([translate="inherit"])');
    if(closestTranslate) {
        return closestTranslate.getAttribute("translate");
    }
    return "yes";
}

function translateElement(element = document) {
    // Set the language attribute of the document.
    if(element === document) {
        document.documentElement.setAttribute("lang", browser.i18n.getUILanguage().replace("_", "-"));
    }
    // Get all children that are marked as being translateable.
    const children = element.querySelectorAll('*[data-l10n-id]:not([translate="no"])');
    for(const child of children) {
        if(getTranslateState(child) !== "no") {
            if(!child.dataset.l10nNocontent) {
                const data = browser.i18n.getMessage(child.dataset.l10nId);
                if(data && data != "??") {
                    child.textContent = data;
                }
            }
            if(child.dataset.l10nAttrs) {
                translateElementAttributes(child);
            }
        }
    }
}

document.addEventListener("DOMContentLoaded", () => translateElement(), {
    capture: false,
    passive: true,
    once: true
});
