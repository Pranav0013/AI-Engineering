from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class RequestSpec:
    base_url: str | None = None
    endpoint: str | None = None
    headers: dict[str, str] = field(default_factory=dict)
    query_params: dict[str, Any] = field(default_factory=dict)
    data: Any | None = None
    timeout_ms: int | None = None

    def url(self) -> str:
        if not self.endpoint:
            raise ValueError("Endpoint must be provided before executing a request")

        if self.endpoint.startswith(("http://", "https://")):
            return self.endpoint

        if not self.base_url:
            raise ValueError("Base URL must be provided before executing a relative endpoint")

        return f"{self.base_url.rstrip('/')}/{self.endpoint.lstrip('/')}"
