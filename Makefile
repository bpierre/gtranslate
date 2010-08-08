#
#
#

ifeq ($(TOPSRCDIR),)
  export TOPSRCDIR = $(shell pwd)
endif

.PHONY: test clean

test:
	$(MAKE) -k -C test/unit

clean:
	$(MAKE) -C test/unit clean

help:
	@echo Targets:
	@echo test
	@echo clean
