from __future__ import annotations

import re
from collections.abc import Callable
from typing import Any

from playwright.sync_api import APIResponse


class ResponseValidationError(AssertionError):
    pass


class ResponseValidator:
    def __init__(self, response: APIResponse) -> None:
        self.response = response

    def status_code(self, expected_status: int) -> ResponseValidator:
        actual_status = self.response.status
        if actual_status != expected_status:
            raise ResponseValidationError(
                f"Expected status {expected_status}, received {actual_status}"
            )
        return self

    def status_code_in(self, expected_statuses: set[int]) -> ResponseValidator:
        actual_status = self.response.status
        if actual_status not in expected_statuses:
            raise ResponseValidationError(
                f"Expected status in {sorted(expected_statuses)}, received {actual_status}"
            )
        return self

    def header(self, name: str, expected_value: str) -> ResponseValidator:
        actual_value = self.response.headers.get(name.lower())
        if actual_value != expected_value:
            raise ResponseValidationError(
                f"Expected header {name}={expected_value}, received {actual_value}"
            )
        return self

    def header_contains(self, name: str, expected_fragment: str) -> ResponseValidator:
        actual_value = self.response.headers.get(name.lower(), "")
        if expected_fragment not in actual_value:
            raise ResponseValidationError(
                f"Expected header {name} to contain {expected_fragment}, received {actual_value}"
            )
        return self

    def json_path(self, key: str, expected_value: Any) -> ResponseValidator:
        payload = self.json()
        actual_value = self._read_path(payload, key)
        if actual_value != expected_value:
            raise ResponseValidationError(
                f"Expected JSON path {key}={expected_value}, received {actual_value}"
            )
        return self

    def json_path_matches(self, key: str, matcher: Callable[[Any], bool]) -> ResponseValidator:
        payload = self.json()
        actual_value = self._read_path(payload, key)
        if not matcher(actual_value):
            raise ResponseValidationError(f"JSON path {key} did not satisfy matcher")
        return self

    def body_contains(self, expected_fragment: str) -> ResponseValidator:
        body = self.response.text()
        if expected_fragment not in body:
            raise ResponseValidationError(f"Expected body to contain {expected_fragment}")
        return self

    def body_matches(self, pattern: str) -> ResponseValidator:
        body = self.response.text()
        if not re.search(pattern, body):
            raise ResponseValidationError(f"Expected body to match pattern {pattern}")
        return self

    def json(self) -> Any:
        try:
            return self.response.json()
        except Exception as exc:
            raise ResponseValidationError("Response body is not valid JSON") from exc

    def extract(self) -> APIResponse:
        return self.response

    @staticmethod
    def _read_path(payload: Any, path: str) -> Any:
        current = payload
        for part in path.split("."):
            if isinstance(current, list):
                current = current[int(part)]
                continue
            if not isinstance(current, dict) or part not in current:
                raise ResponseValidationError(f"JSON path {path} was not found")
            current = current[part]
        return current
