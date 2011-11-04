#
#
#

ifeq ($(TOPSRCDIR),)
  export TOPSRCDIR = $(shell pwd)
endif

.PHONY: test clean

xpi:
	mkdir -p $(TOPSRCDIR)/build && \
	cd $(TOPSRCDIR)/src && \
	zip -r $(TOPSRCDIR)/build/gtranslate.xpi chrome chrome.manifest defaults icon.png install.rdf && \
	cd $(TOPSRCDIR)

test:
	$(MAKE) -k -C test/unit
	$(MAKE) -k -C test/online

clean:
	$(MAKE) -C test/unit clean
	rm -rf $(TOPSRCDIR)/build

help:
	@echo Targets:
	@echo test
	@echo clean
