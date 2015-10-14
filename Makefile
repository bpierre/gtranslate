# Create an env.mk file to change the firefox-bin path.
# If nothing is specified, the default is "nightly"
ifneq ($(wildcard env.mk),)
include env.mk
endif
FIREFOX_BIN?=nightly

all: build

build:
	# cfx is needed for Fx 37 (jpm xpi compatibility starts with Fx 38)
	# jpm xpi
	cfx xpi

run:
	jpm run -b $(FIREFOX_BIN) --debug --prefs ./dev/devprefs.json

lint:
	./node_modules/.bin/eslint .

description:
	@node scripts/description.js

.PHONY: all build run description
