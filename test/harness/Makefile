#
# ***** BEGIN LICENSE BLOCK *****
# Version: MPL 1.1/GPL 2.0/LGPL 2.1
#
# The contents of this file are subject to the Mozilla Public License Version
# 1.1 (the "License"); you may not use this file except in compliance with
# the License. You may obtain a copy of the License at
# http://www.mozilla.org/MPL/
#
# Software distributed under the License is distributed on an "AS IS" basis,
# WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
# for the specific language governing rights and limitations under the
# License.
#
# The Original Code is Weave code.
#
# The Initial Developer of the Original Code is
# Mozilla Corporation
# Portions created by the Initial Developer are Copyright (C) 2008
# the Initial Developer. All Rights Reserved.
#
# Contributor(s):
#   Dan Mills <thunder@mozilla.com> (original author)
#   Myk Melez <myk@mozilla.org>
#
# Alternatively, the contents of this file may be used under the terms of
# either the GNU General Public License Version 2 or later (the "GPL"), or
# the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
# in which case the provisions of the GPL or the LGPL are applicable instead
# of those above. If you wish to allow use of your version of this file only
# under the terms of either the GPL or the LGPL, and not to allow others to
# use your version of this file under the terms of the MPL, indicate your
# decision by deleting the provisions above and replace them with the notice
# and other provisions required by the GPL or the LGPL. If you do not delete
# the provisions above, a recipient may use your version of this file under
# the terms of any one of the MPL, the GPL or the LGPL.
#
# ***** END LICENSE BLOCK *****

xulrunner_bin ?= ${XULRUNNER_BIN}
ifeq ($(xulrunner_bin),)
  $(warning No 'xulrunner_bin' variable given)
  $(warning It should point to the location of a XULRunner/Firefox executable)
  $(warning For example: "make xulrunner_bin=/usr/bin/xulrunner")
  $(warning Or set the XULRUNNER_BIN environment variable to point to it)
  $(error Can't continue.)
endif

harnessdir = ../harness
# profiledir needs to be an absolute path on Mac OS X (FIXME: file bug).
profiledir = $(abspath ../profile)
topsrcdir ?= ${TOPSRCDIR}
native_topsrcdir ?= ${NATIVE_TOPSRCDIR}
sys := $(shell uname -s)
configure_profile ?=

# OS detection

ifeq ($(sys), Darwin)
  os = Darwin
else
ifeq ($(sys), Linux)
  os = Linux
else
ifeq ($(sys), MINGW32_NT-6.0)
  os = WINNT
else
ifeq ($(sys), MINGW32_NT-5.1)
  os = WINNT
else
  $(error Sorry, your os is unknown/unsupported: $(sys))
endif
endif
endif
endif

ifeq ($(topsrcdir),)
topsrcdir = ../..
endif

ifeq ($(native_topsrcdir),)
ifeq ($(os), WINNT)
native_topsrcdir = ..\..
else
native_topsrcdir = ../..
endif
endif

# NO_EM_RESTART prevents XULRunner from restarting when registering components.
# XPCOM_DEBUG_BREAK="warn" prevents XULRunner from showing an alert dialog
# for assertions on Windows.
xulrunner_env = NATIVE_TOPSRCDIR="$(native_topsrcdir)" TOPSRCDIR="$(topsrcdir)" \
                NO_EM_RESTART=1 XPCOM_DEBUG_BREAK="warn"

# The XULRunner test executor.
# Note: the path to application.ini must be absolute on Mac OS X.
xulrunner = $(xulrunner_bin) \
              -app $(abspath $(harnessdir)/app/application.ini) \
              -profile $(profiledir) -no-remote

# The head and tail files to evaluate before and after each test.
#
# Head files are evaluated in the order:
#   harness's head.js
#   test dir's head.js (if present)
#   test dir's head_*.js (if any)
#
# Tail files are evaluated in the order:
#   harness's tail.js.
#   test dir's tail.js (if present)
#   test dir's tail_*.js (if any)
#
# XXX We shouldn't need to resolve these to absolute paths here, as the executor
# runs them through nsICommandLine::resolveFile, which should handle that,
# but for some reason that method isn't resolving relative paths on Mac OS X,
# so we have to resolve them here for that OS.
# FIXME: stop doing this here and in the commands once bug 476326 is fixed.
ifeq ($(os), Darwin)
head := -f $(abspath $(harnessdir)/head.js) $(patsubst %,-f %,$(abspath $(wildcard head.js))) $(patsubst %,-f %,$(abspath $(wildcard head_*.js)))
tail :=  -f $(abspath $(harnessdir)/tail.js) $(patsubst %,-f %,$(abspath $(wildcard tail.js))) $(patsubst %,-f %,$(abspath $(wildcard tail_*.js)))
else
head := -f $(harnessdir)/head.js $(patsubst %,-f %,$(wildcard head.js)) $(patsubst %,-f %,$(wildcard head_*.js))
tail := -f $(harnessdir)/tail.js $(patsubst %,-f %,$(wildcard tail.js)) $(patsubst %,-f %,$(wildcard tail_*.js))
endif

# On Windows and Linux, you have to pass echo the -e option to enable backslash
# escape interpretation.  On Mac, such interpretation is on by default, and if
# you pass that option, it gets echoed to STDOUT.
ifeq ($(os), Darwin)
echo_opts = 
else
echo_opts = -e
endif

tests := $(wildcard test*.js)

all: $(tests:.js=)

# fixme: hiding commands here means they can't be copy-and-pasted to run by hand
$(tests:.js=): $(tests)
	@if [ ! -e "$(profiledir)" ]; then \
	  mkdir $(profiledir); \
	  $(xulrunner) 2> /dev/null 1>&2; \
	  $(configure_profile) \
	  $(xulrunner) 2> /dev/null 1>&2; \
	  sleep 5; \
	fi
	@if [ $(os) = Darwin ]; then \
	  $(xulrunner_env) $(xulrunner) $(head) -f $(abspath $(@).js) $(tail) 2> $(@).log 1>&2; \
	else \
	  $(xulrunner_env) $(xulrunner) $(head) -f $(@).js $(tail) 2> $(@).log 1>&2; \
	fi
	@if [ `grep -c '\*\*\* PASS' $(@).log` = 0 ]; then \
	  echo $(echo_opts) "$(@):\tFAIL"; \
	else \
	  echo $(echo_opts) "$(@):\tPASS"; \
	fi

.PHONY: clean
clean:
	rm -rf $(profiledir)
	rm -f test*.log
