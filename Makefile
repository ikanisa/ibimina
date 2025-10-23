.PHONY: deps build start admin caddy-up caddy-bg caddy-down tunnel-up tunnel-bg tunnel-down

deps:
	./scripts/mac/install_caddy_cloudflared.sh

build:
	pnpm run build

start:
	pnpm run start

admin:
	$(MAKE) build
	$(MAKE) start

caddy-up:
	./scripts/mac/caddy_up.sh

caddy-bg:
	./scripts/mac/caddy_bg.sh

caddy-down:
	./scripts/mac/caddy_down.sh

tunnel-up:
	./scripts/mac/tunnel_up.sh

tunnel-bg:
	./scripts/mac/tunnel_bg.sh

tunnel-down:
	./scripts/mac/tunnel_down.sh
