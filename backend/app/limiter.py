"""
Rate limiting configuration for CodeForge API.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

# Rate limiter instance - 100 requests/minute by default
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
