import shortuuid
import re

def generate_short_code():
    return shortuuid.uuid()[:6]

def is_valid_alias(alias: str) -> bool:
    # Only letters, numbers, and hyphens, 3-20 characters
    return bool(re.match(r'^[a-zA-Z0-9-]{3,20}$', alias))