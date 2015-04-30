all: build

build:
	jpm xpi

run:
	jpm run -b nightly --debug --prefs ./devprefs.json

.PHONY: all run
