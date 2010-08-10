#
#
#

ifeq ($(TOPSRCDIR),)
  export TOPSRCDIR = $(shell pwd)
endif

.PHONY: test clean

test:
	$(MAKE) -k -C test/unit
	$(MAKE) -k -C test/online

clean:
	$(MAKE) -C test/unit clean

help:
	@echo Targets:
	@echo test
	@echo clean
