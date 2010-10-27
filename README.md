Gesture Translate
==========

With Gesture Translate you can translate any text in a webpage just by zig and zag mouse movements. The translated text will be showed in the status bar

The selected text is translated via Google Translate API

Gesture Translate is a modification of gTranslate (https://addons.mozilla.org/en-US/firefox/addon/918/) to add gesture capabilities

Get it here: https://addons.mozilla.org/en-US/firefox/addon/239633/

Setting up to run tests
-----------------------

Set the XULRUNNER_BIN environment variable to the location of the XULRunner
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

    The command to declare environment variable on Mac OS X 
	export XULRUNNER_BIN=/Applications/Firefox.app/Contents/MacOS/firefox-bin 
	or add this line above in your ~/.profile
    

    Windows:
      /c/Program\ Files/Mozilla\ Firefox/firefox.exe

Running tests
-------------

* To run all tests, simply run "make test" from the top-level directory (where
  the `src` and `test` directories are).
* To run all unit tests, use:
      make -C test/unit
* To run a specific unit test, use:
      make -C test/unit <test_name>
  i.e. to run test_resource.js, you would type
      make -C test/unit test_resource
* To run all online tests, use:
      make -C test/online
* To run a specific online test, use:
      make -C test/online <test_name>

