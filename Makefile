PORT ?= 8765
REPO ?= Rasalas/audio-tag
SITE_FILES = index.html styles.css app.js id3.js formats.js LICENSE

.PHONY: dev check release pages-setup help

help: ## list targets
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F ':.*## ' '{ printf "  %-10s %s\n", $$1, $$2 }'

dev: ## serve on http://127.0.0.1:$(PORT), open the browser, reload on every save
	npx -y live-server --port=$(PORT) --host=127.0.0.1 --ignore=.fixtures,.github,.git

check: ## syntax-check the modules
	node --check app.js && node --check id3.js && node --check formats.js

pages-setup: ## one-time: Pages via Actions and allow v* tags to deploy (needs gh)
	gh api -X POST repos/$(REPO)/pages -f build_type=workflow >/dev/null 2>&1 || true
	echo '{"deployment_branch_policy":{"protected_branches":false,"custom_branch_policies":true}}' | gh api -X PUT repos/$(REPO)/environments/github-pages --input - >/dev/null
	gh api -X POST repos/$(REPO)/environments/github-pages/deployment-branch-policies -f name='v*' -f type=tag >/dev/null 2>&1 || true
	gh api -X POST repos/$(REPO)/environments/github-pages/deployment-branch-policies -f name='main' -f type=branch >/dev/null 2>&1 || true
	@echo "Pages will deploy from v* tags."

release: ## make release VERSION=1.2.0  -> bump APP_VERSION, commit, tag v1.2.0, push (Pages deploys from the tag)
	@test -n "$(VERSION)" || { echo "usage: make release VERSION=x.y.z"; exit 1; }
	@git diff --quiet || { echo "commit or stash your changes first"; exit 1; }
	perl -pi -e "s/APP_VERSION = '[^']*'/APP_VERSION = '$(VERSION)'/" app.js
	git add app.js
	git diff --cached --quiet || git commit -m "Release v$(VERSION)"
	git tag -a "v$(VERSION)" -m "v$(VERSION)"
	git push && git push origin "v$(VERSION)"
