from dataclasses import dataclass
from datetime import datetime

from .result import *  # noqa: F401,F403


@dataclass
class Account:
    id: int = 0
    platform_id: int = 0
    external_id: str = ""
    handle: str = ""
    access_token: str | None = None
    refresh_token: str | None = None
    token_expires_at: datetime | None = None


@dataclass
class Platform:
    id: int = 0
    key: str = ""
    display_name: str = ""
    is_active: bool = True
