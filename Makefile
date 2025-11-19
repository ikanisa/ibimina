SHELL := /bin/bash

.PHONY: deps install bootstrap quickstart dev build start admin lint typecheck test test-unit test-e2e test-rls format release deploy-vercel preview-vercel caddy-up caddy-bg caddy-down tunnel-up tunnel-bg tunnel-down next-bg next-down local-up local-down local-status ready ship

deps:
./apps/pwa/staff-admin/scripts/mac/install_caddy_cloudflared.sh

install:
	pnpm install --frozen-lockfile

bootstrap: install
	pnpm run gen:types

quickstart:
	pnpm install --frozen-lockfile
	pnpm run lint
	pnpm run typecheck
	pnpm run test
	pnpm run build

dev:
	pnpm run dev

build:
	pnpm run build

start:
	pnpm run start

admin: build
	$(MAKE) start

lint:
	pnpm run lint

typecheck:
	pnpm run typecheck

test:
	pnpm run test

test-unit:
	pnpm run test:unit

test-e2e:
	pnpm run test:e2e

test-rls:
	pnpm run test:rls

format:
pnpm run format

release:
	pnpm run release

preview-vercel:
	pnpm run preview:vercel

deploy-vercel:
	pnpm run deploy:vercel

ship: release

caddy-up:
./apps/pwa/staff-admin/scripts/mac/caddy_up.sh

caddy-bg:
./apps/pwa/staff-admin/scripts/mac/caddy_bg.sh

caddy-down:
./apps/pwa/staff-admin/scripts/mac/caddy_down.sh

tunnel-up:
./apps/pwa/staff-admin/scripts/mac/tunnel_up.sh

tunnel-bg:
./apps/pwa/staff-admin/scripts/mac/tunnel_bg.sh

tunnel-down:
./apps/pwa/staff-admin/scripts/mac/tunnel_down.sh

next-bg:
./apps/pwa/staff-admin/scripts/mac/next_bg.sh

next-down:
./apps/pwa/staff-admin/scripts/mac/next_down.sh

local-up:
	$(MAKE) next-bg
	$(MAKE) caddy-bg

local-down:
	-$(MAKE) caddy-down
	-$(MAKE) next-down

local-status:
	@echo "Ports in use:" && (lsof -iTCP:3100 -sTCP:LISTEN -Pn || true) && (lsof -iTCP:443 -sTCP:LISTEN -Pn || true)

ready:
	pnpm run check:deploy
