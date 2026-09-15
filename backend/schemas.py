from pydantic import BaseModel
from typing import Optional

class URLCreate(BaseModel):
    original_url: str
    custom_alias: Optional[str] = None

class URLResponse(BaseModel):
    original_url: str
    short_code: str
    clicks: int

    class Config:
        from_attributes = True