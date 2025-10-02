
"""Tests for main module."""

import pytest

from backend.main import hello_world, get_version, main


class TestMainFunctions:
    """Test main module functions."""

    def test_hello_world_without_name(self) -> None:
        """Test hello_world function without name parameter."""
        result = hello_world()
        assert isinstance(result, str)
        assert "backend" in result
        assert result == "Hello from backend!"

    def test_hello_world_with_name(self) -> None:
        """Test hello_world function with name parameter."""
        name = "Alice"
        result = hello_world(name)
        assert isinstance(result, str)
        assert name in result
        assert "backend" in result
        expected = f"Hello, {name}, from backend!"
        assert result == expected

    def test_hello_world_with_empty_name(self) -> None:
        """Test hello_world function with empty name."""
        result = hello_world("")
        # Empty string is falsy, so it should use the default message
        assert result == "Hello from backend!"

    def test_get_version(self) -> None:
        """Test get_version function."""
        version = get_version()
        assert isinstance(version, str)
        assert version == "0.1.0"

    def test_main_function_success(self) -> None:
        """Test main function returns success code."""
        result = main()
        assert result == 0


@pytest.mark.parametrize("name,expected_contains", [
    ("Bob", "Bob"),
    ("Charlie", "Charlie"),
    (None, "Hello from backend!"),
])
def test_hello_world_parametrized(name: str, expected_contains: str) -> None:
    """Test hello_world function with various inputs."""
    result = hello_world(name)
    assert expected_contains in result
