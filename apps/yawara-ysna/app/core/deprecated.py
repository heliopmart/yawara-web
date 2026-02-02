import warnings
import functools

def deprecated(func):
    """Marks a function as deprecated. It will result in a warning being emitted when the function is used."""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        warnings.warn(
            f"The function {func.__name__} is deprecated and will be removed in the future.",
            category=DeprecationWarning,
            stacklevel=2
        )
        return func(*args, **kwargs)
    return wrapper