from typing import Callable, Any
from logger import logger

def safe_execute(fn: Callable, error_message: str, fallback_value: Any = None) -> Any:
    """
    Safely executes a function and catches any exceptions.
    Logs the error message and returns a fallback value upon failure.
    """
    try:
        return fn()
    except Exception as e:
        logger.error(f"{error_message} {str(e)}")
        return fallback_value
