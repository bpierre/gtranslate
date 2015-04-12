all:

run:
	jpm run -b nightly --debug --prefs ./devprefs.json

.PHONY: all run
