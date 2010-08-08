/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is XULRunner Unit Test Harness.
 *
 * The Initial Developer of the Original Code is Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Myk Melez <myk@mozilla.org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

let cmdLine = window.arguments[0].
              QueryInterface(Components.interfaces.nsICommandLine);

let scriptLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].
                   getService(Components.interfaces.mozIJSSubScriptLoader);

let ioService = Components.classes["@mozilla.org/network/io-service;1"].
                getService(Components.interfaces.nsIIOService);

// xpcshell provides this method, which some tests use, so we emulate it.
// We also use it ourselves to load the files specified on our command line.
function load(path) {
  // This throws if the file does not exist.
  let file = cmdLine.resolveFile(path);
  let url = ioService.newFileURI(file);
  scriptLoader.loadSubScript(url.spec);
}

// xpcshell provides this method, which some tests use, so we emulate it.
function print() {
  let args = Array.prototype.slice.call(arguments);
  dump(args.join(" ") + "\n");
}

// xpcshell apparently has an environment hash (although I can't find
// any documentation on it) that we emulate here for the two variables
// that tests/harness/head.js accesses.
let environment = Components.classes["@mozilla.org/process/environment;1"].
                  getService(Components.interfaces.nsIEnvironment);

while (cmdLine.findFlag("f", false) != -1) {
  try {
    // This throws if the param is missing.
    load(cmdLine.handleFlagWithParam("f", false));
  }
  catch(ex) {
    // XXX Force fail a test here to ensure the user knows something failed?
    dump(ex + "\n");

    // Report the error to the Error Console.  Useful for debugging the harness.
    // To see errors in the Error Console, uncomment this line, pass -jsconsole
    // to XULRunner in the Makefile, set javascript.options.showInConsole
    // to true in prefs.js, and comment out the call to goQuitApplication below.
    //Components.utils.reportError(ex);
  }
}

goQuitApplication();
