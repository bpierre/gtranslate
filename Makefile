# Create an env.mk file to change the firefox-bin path.
# If nothing is specified, the default is "nightly"
ifneq ($(wildcard env.mk),)
include env.mk
endif
FIREFOX_BIN?=nightly

all: build

build:
	jpm xpi

run:
	jpm run -b $(FIREFOX_BIN) --debug --prefs ./dev/devprefs.json

lint:
	./node_modules/.bin/eslint --ignore-path .gitignore .

description:
	@node scripts/description.js

.PHONY: all build run description
