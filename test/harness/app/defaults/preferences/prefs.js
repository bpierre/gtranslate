pref("toolkit.defaultChromeURI", "chrome://harness/content/main.xul");

// Let the harness dump messages to the console so we can log execution.
pref("browser.dom.window.dump.enabled", true);

// Don't check compatibility, since otherwise XULRunner wouldn't install Weave
// as an extension, since its install.rdf file doesn't specify compatibility
// with this harness application.
pref("extensions.checkCompatibility", false);

// These are helpful for debugging the harness.
// They don't need to be enabled during normal use.
//pref("javascript.options.showInConsole", true);
//pref("extensions.logging.enabled", true);
