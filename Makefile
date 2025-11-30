SHELL := /bin/bash

.PHONY: deps install bootstrap quickstart dev build start admin lint typecheck test test-unit test-e2e test-rls format release deploy-netlify preview-netlify next-bg next-down local-up local-down local-status ready ship

deps:
	pnpm install --frozen-lockfile

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

preview-netlify:
	pnpm run deploy:netlify

deploy-netlify:
	pnpm run deploy:netlify --prod

ship: release

next-bg:
./apps/pwa/staff-admin/scripts/mac/next_bg.sh

next-down:
./apps/pwa/staff-admin/scripts/mac/next_down.sh

local-up:
	$(MAKE) next-bg

local-down:
	-$(MAKE) next-down

local-status:
	@echo "Ports in use:" && (lsof -iTCP:3100 -sTCP:LISTEN -Pn || true) && (lsof -iTCP:443 -sTCP:LISTEN -Pn || true)

ready:
	pnpm run check:deploy
