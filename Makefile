#
#
#

ifeq ($(TOPSRCDIR),)
  export TOPSRCDIR = $(shell pwd)
endif

.PHONY: test clean

build: 
	zip -r gesture-translate.xpi src
test:
	$(MAKE) -k -C test/unit
	$(MAKE) -k -C test/online

clean:
	$(MAKE) -C test/unit clean

help:
	@echo Targets:
	@echo build
	@echo test
	@echo clean
