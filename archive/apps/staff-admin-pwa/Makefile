.PHONY: help setup dev build preview test lint format clean docker-up docker-down docker-ssl-up docker-ssl-down

help:
	@echo "Staff Admin PWA - Available Commands:"
	@echo ""
	@echo "  make setup          Install dependencies and generate icons"
	@echo "  make dev            Start development server"
	@echo "  make build          Build for production"
	@echo "  make preview        Preview production build"
	@echo "  make test           Run all tests"
	@echo "  make lint           Lint code"
	@echo "  make format         Format code"
	@echo "  make clean          Clean build artifacts"
	@echo "  make docker-up      Start Docker (HTTP)"
	@echo "  make docker-down    Stop Docker"
	@echo "  make docker-ssl-up  Start Docker (HTTPS)"
	@echo ""

setup:
	@echo "Installing dependencies..."
	pnpm install
	@echo "Generating PWA icons..."
	pnpm generate:icons
	@echo "✓ Setup complete"

dev:
	pnpm dev

build:
	@echo "Building for production..."
	pnpm build

preview:
	pnpm preview

test:
	pnpm test

test-e2e:
	pnpm test:e2e

lint:
	pnpm lint

format:
	pnpm format

typecheck:
	pnpm typecheck

clean:
	rm -rf dist node_modules/.vite

docker-up: build
	@echo "Starting Docker container (HTTP on port 8080)..."
	docker compose up --build -d
	@echo "✓ App running at http://localhost:8080"

docker-down:
	docker compose down

docker-ssl-up: build
	@echo "Starting Docker container (HTTPS on port 8443)..."
	@echo "Make sure you've run 'bash scripts/mkcert.sh' first"
	docker compose -f docker-compose.ssl.yml up --build -d
	@echo "✓ App running at https://admin.local:8443"

docker-ssl-down:
	docker compose -f docker-compose.ssl.yml down

ready: lint typecheck test build
	@echo "✓ Ready for deployment"
