FIREFOX_BIN?=nightly

all: build

build:
	# cfx is needed for Fx 37 (jpm xpi compatibility starts with Fx 38)
	# jpm xpi
	cfx xpi

run:
	jpm run -b $(FIREFOX_BIN) --debug --prefs ./dev/devprefs.json

description:
	@node scripts/description.js

.PHONY: all build run description
