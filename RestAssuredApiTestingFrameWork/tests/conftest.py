from __future__ import annotations

import json
from collections.abc import Generator
from pathlib import Path
from typing import Any

import pytest
from playwright.sync_api import APIRequestContext, Playwright, sync_playwright

from framework.config import ApiConfig, load_config
from framework.fluent_api import Given, given


@pytest.fixture(scope="session")
def api_config() -> ApiConfig:
    return load_config()


@pytest.fixture(scope="session")
def test_data() -> dict[str, Any]:
    test_data_path = Path(__file__).resolve().parents[1] / "test_data" / "api_test_data.json"
    with test_data_path.open(encoding="utf-8") as file:
        return json.load(file)


@pytest.fixture(scope="session")
def playwright_instance() -> Generator[Playwright, None, None]:
    with sync_playwright() as playwright:
        yield playwright


@pytest.fixture(scope="session")
def api_request_context(
    playwright_instance: Playwright,
    api_config: ApiConfig,
) -> Generator[APIRequestContext, None, None]:
    context = playwright_instance.request.new_context(
        base_url=api_config.base_url,
        extra_http_headers=api_config.default_headers,
        timeout=api_config.timeout_ms,
    )
    try:
        yield context
    finally:
        context.dispose()


@pytest.fixture()
def api(api_request_context: APIRequestContext, api_config: ApiConfig) -> Given:
    return given(api_request_context, api_config)
