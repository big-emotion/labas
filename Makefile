# The local gate: run it before every push.
check:
	./scripts/check-infra-disclosure.sh
	npm run lint
	npm run typecheck
	npm run format:check
	npm test
	npm run build

.PHONY: check
