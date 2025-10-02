.PHONY: help install install-dev fmt lint typecheck test test-cov test-fast clean build pre-commit ci all

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install the package in development mode
	pip install -e .

install-dev: ## Install the package with development dependencies
	pip install -e ".[dev]"
fmt: ## Format code with ruff
	ruff format .
	ruff check . --fix

lint: ## Lint code with ruff
	ruff check .
	ruff format --check .
typecheck: ## Type check with mypy
	mypy .
test: ## Run tests
	pytest

test-cov: ## Run tests with coverage
	pytest --cov=backend --cov-report=html --cov-report=term

test-fast: ## Run tests in parallel
	pytest -n auto
pre-commit: ## Run pre-commit on all files
	pre-commit run --all-files

pre-commit-install: ## Install pre-commit hooks
	pre-commit install

clean: ## Clean build artifacts and cache
	rm -rf build/
	rm -rf dist/
	rm -rf *.egg-info/
	rm -rf .pytest_cache/
	rm -rf .mypy_cache/
	rm -rf .ruff_cache/
	rm -rf htmlcov/
	find . -type d -name __pycache__ -delete
	find . -type f -name "*.pyc" -delete

build: clean ## Build package
	python -m build

ci: lint typecheck test ## Run all CI checks

all: install-dev pre-commit-install ci ## Setup everything and run all checks