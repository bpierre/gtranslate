FIREFOX_BIN?=nightly

all: build

build:
	jpm xpi

run:
	jpm run -b $(FIREFOX_BIN) --debug --prefs ./devprefs.json

.PHONY: all build run
