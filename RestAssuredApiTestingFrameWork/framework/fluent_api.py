from __future__ import annotations

from typing import Any

from playwright.sync_api import APIRequestContext, Error

from framework.config import ApiConfig
from framework.logger import get_logger
from framework.request_spec import RequestSpec
from framework.response_validator import ResponseValidator


class ApiRequestExecutionError(RuntimeError):
    pass


class Given:
    def __init__(self, request_context: APIRequestContext, config: ApiConfig) -> None:
        self._request_context = request_context
        self._config = config
        self._spec = RequestSpec(
            base_url=config.base_url,
            headers=dict(config.default_headers),
            timeout_ms=config.timeout_ms,
        )

    def base_url(self, value: str) -> Given:
        self._spec.base_url = value
        return self

    def header(self, name: str, value: str) -> Given:
        self._spec.headers[name] = value
        return self

    def headers(self, values: dict[str, str]) -> Given:
        self._spec.headers.update(values)
        return self

    def query_param(self, name: str, value: Any) -> Given:
        self._spec.query_params[name] = value
        return self

    def query_params(self, values: dict[str, Any]) -> Given:
        self._spec.query_params.update(values)
        return self

    def body(self, value: Any) -> Given:
        self._spec.data = value
        return self

    def timeout(self, milliseconds: int) -> Given:
        self._spec.timeout_ms = milliseconds
        return self

    def when(self) -> When:
        return When(self._request_context, self._spec)


class When:
    def __init__(self, request_context: APIRequestContext, spec: RequestSpec) -> None:
        self._request_context = request_context
        self._spec = spec
        self._logger = get_logger(self.__class__.__name__)

    def get(self, endpoint: str) -> Then:
        return self._execute("GET", endpoint)

    def post(self, endpoint: str) -> Then:
        return self._execute("POST", endpoint)

    def put(self, endpoint: str) -> Then:
        return self._execute("PUT", endpoint)

    def patch(self, endpoint: str) -> Then:
        return self._execute("PATCH", endpoint)

    def delete(self, endpoint: str) -> Then:
        return self._execute("DELETE", endpoint)

    def _execute(self, method: str, endpoint: str) -> Then:
        self._spec.endpoint = endpoint
        url = self._spec.url()
        self._logger.info("Executing %s %s", method, url)

        try:
            response = self._request_context.fetch(
                url,
                method=method,
                headers=self._spec.headers,
                params=self._spec.query_params or None,
                data=self._spec.data,
                timeout=self._spec.timeout_ms,
            )
        except Error as exc:
            raise ApiRequestExecutionError(f"Playwright failed to execute {method} {url}") from exc
        except Exception as exc:
            raise ApiRequestExecutionError(f"Unexpected failure executing {method} {url}") from exc

        self._logger.info("Received HTTP %s from %s %s", response.status, method, url)
        return Then(response)


class Then(ResponseValidator):
    pass


def given(request_context: APIRequestContext, config: ApiConfig) -> Given:
    return Given(request_context, config)
