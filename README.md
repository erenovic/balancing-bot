# backend

RL training pipeline using python / pytorch

[![CI](https://github.com/erenovic/backend/workflows/CI/badge.svg)](https://github.com/erenovic/backend/actions)
[![Coverage](https://codecov.io/gh/erenovic/backend/branch/main/graph/badge.svg)](https://codecov.io/gh/erenovic/backend)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
pip install backend
```

### Setup

2. Set up development environment:
```bash
python -m venv .venv
source .venv/bin/activate
make all  # Install dependencies, pre-commit hooks, and run all checks
```

### Development Commands

```bash
make help          # Show all available commands
make install-dev   # Install development dependencies
make fmt           # Format code with ruff
make lint          # Lint code with ruff
make typecheck     # Type check with mypy
make test          # Run tests
make test-cov      # Run tests with coverage
make ci            # Run all CI checks locally
make clean         # Clean build artifacts
```


## Features

- ✅ Modern Python packaging with `pyproject.toml`
- ✅ Code formatting and linting with Ruff
- ✅ Static type checking with mypy
- ✅ Testing with pytest and coverage reporting
- ✅ Pre-commit hooks for code quality
- ✅ GitHub Actions CI/CD

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.