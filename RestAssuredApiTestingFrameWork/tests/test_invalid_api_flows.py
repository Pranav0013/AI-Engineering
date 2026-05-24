from __future__ import annotations

from typing import Any

import pytest

from framework.fluent_api import Given
from framework.response_validator import ResponseValidationError


@pytest.mark.invalid
@pytest.mark.smoke
def test_get_missing_post_returns_not_found(api: Given) -> None:
    api.when().get("/posts/999999").status_code(404).body_contains("{}")


@pytest.mark.invalid
def test_unsupported_route_returns_not_found(api: Given) -> None:
    api.when().get("/secure-login").status_code(404)


@pytest.mark.invalid
def test_delete_unknown_post_still_returns_success_for_demo_api(api: Given) -> None:
    api.when().delete("/posts/999999").status_code(200)


@pytest.mark.invalid
def test_invalid_payload_is_echoed_by_demo_api(api: Given, test_data: dict[str, Any]) -> None:
    payload = test_data["invalid_post"]
    api.body(payload).when().post("/posts").status_code(201).json_path(
        "title", payload["title"]
    ).json_path("body", payload["body"]).json_path("userId", payload["userId"])


@pytest.mark.invalid
def test_response_validation_failure_is_explicit(api: Given) -> None:
    with pytest.raises(ResponseValidationError, match="Expected status 201"):
        api.when().get("/posts/1").status_code(201)
