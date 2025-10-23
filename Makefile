.PHONY: deps build start admin caddy-up caddy-bg caddy-down tunnel-up tunnel-bg tunnel-down

deps:
	./scripts/install.sh

build:
	pnpm run build

start:
	pnpm run start

admin:
	$(MAKE) build
	$(MAKE) start

caddy-up:
	./scripts/caddy-up.sh

caddy-bg:
	./scripts/caddy-bg.sh

caddy-down:
	./scripts/caddy-down.sh

tunnel-up:
	./scripts/tunnel-up.sh

tunnel-bg:
	./scripts/tunnel-bg.sh

tunnel-down:
	./scripts/tunnel-down.sh
