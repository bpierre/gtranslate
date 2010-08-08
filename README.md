gTranslate
==========

gTranslate is a Firefox addon which translates the selected text via Google Translate API.

Get it here: https://addons.mozilla.org/fr/firefox/addon/918/

Setting up to run tests
-----------------------

Set the `XULRUNNER_BIN` environment variable to the location of the XULRunner
or Firefox 3.0+ executable. Here are some possible values (but your executable
might be elsewhere): 

    Linux:
      /usr/bin/xulrunner
      /usr/bin/firefox
    
      Note: Firefox executables on distributions like Ubuntu that ship Firefox
            as a XULRunner app won't work.  But those distributions all have
            XULRunner installed, so just use the XULRunner executable on them.
    
    Mac OS X:
      /Library/Frameworks/XUL.framework/xulrunner-bin
      /Applications/Firefox.app/Contents/MacOS/firefox-bin
    
    Windows:
      /c/Program\ Files/Mozilla\ Firefox/firefox.exe

Running tests
-------------

* To run all tests, simply run "make test" from the top-level directory (where
  the `src` and `test` directories are).
* To run specific tests, you can use the following command: 
      make -C test/unit <test_name>
  i.e. to run test_resource.js, you would type
      make -C test/unit test_resource

