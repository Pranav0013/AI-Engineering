from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class ApiConfig:
    base_url: str
    timeout_ms: int
    default_headers: dict[str, str]


def load_config() -> ApiConfig:
    return ApiConfig(
        base_url=os.getenv("API_BASE_URL", "https://jsonplaceholder.typicode.com"),
        timeout_ms=int(os.getenv("API_TIMEOUT_MS", "30000")),
        default_headers={
            "Accept": "application/json",
            "Content-Type": "application/json; charset=UTF-8",
        },
    )
