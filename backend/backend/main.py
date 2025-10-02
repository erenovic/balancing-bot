"""Main module for backend.

This module provides the core functionality for backend.
"""

import sys
from typing import Optional


def hello_world(name: Optional[str] = None) -> str:
    """Return a greeting message.
    
    Args:
        name: Optional name to include in the greeting.
        
    Returns:
        A personalized greeting string.
    """
    if name:
        return f"Hello, {name}, from backend!"
    return "Hello from backend!"


def get_version() -> str:
    """Get the current version of the package.
    
    Returns:
        The version string.
    """
    return "0.1.0"


def main() -> int:
    """Main entry point for the application.
    
    Returns:
        Exit code (0 for success).
    """
    try:
        print(hello_world())
        print(f"Version: {get_version()}")
        return 0
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
