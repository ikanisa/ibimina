.PHONY: deps build start admin caddy-up caddy-bg caddy-down tunnel-up tunnel-bg tunnel-down next-bg next-down local-up local-down local-status ready

deps:
	./apps/admin/scripts/mac/install_caddy_cloudflared.sh

build:
	pnpm run build

start:
	pnpm run start

admin:
	$(MAKE) build
	$(MAKE) start

caddy-up:
	./apps/admin/scripts/mac/caddy_up.sh

caddy-bg:
	./apps/admin/scripts/mac/caddy_bg.sh

caddy-down:
	./apps/admin/scripts/mac/caddy_down.sh

tunnel-up:
	./apps/admin/scripts/mac/tunnel_up.sh

tunnel-bg:
	./apps/admin/scripts/mac/tunnel_bg.sh

tunnel-down:
	./apps/admin/scripts/mac/tunnel_down.sh

next-bg:
	./apps/admin/scripts/mac/next_bg.sh

next-down:
	./apps/admin/scripts/mac/next_down.sh

local-up:
	$(MAKE) next-bg
	$(MAKE) caddy-bg

local-down:
	-$(MAKE) caddy-down
	-$(MAKE) next-down

local-status:
	@echo "Ports in use:" && (lsof -iTCP:3000 -sTCP:LISTEN -Pn || true) && (lsof -iTCP:443 -sTCP:LISTEN -Pn || true)

ready:
	pnpm run check:deploy
