.PHONY: help install dev build preview clean lint format type-check test test-watch test-coverage ci

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	npm install

dev: ## Start development server
	npm run dev

build: ## Build for production
	npm run build

preview: ## Preview production build locally
	npm run preview

lint: ## Lint code with Biome
	npm run lint

format: ## Format code with Biome
	npm run format

check: ## Run Biome check (lint + format)
	npm run check

type-check: ## Run TypeScript type checking
	npm run type-check
test: ## Run tests
	npm run test

test-watch: ## Run tests in watch mode
	npm run test:watch

test-coverage: ## Run tests with coverage
	npm run test:coverage

clean: ## Clean build artifacts and cache
	rm -rf dist/
	rm -rf node_modules/.cache/
	rm -rf coverage/
	npm cache clean --force

upgrade: ## Upgrade dependencies
	npm update
	npm audit fix
hooks-install: ## Install git hooks
	npx husky install

hooks-add: ## Add pre-commit hook
	npx husky add .husky/pre-commit "npx lint-staged"

ci: type-check lint test build ## Run all CI checks locally

setup: install hooks-install ## Setup project for development

all: setup ci ## Install, setup hooks, and run all checks
