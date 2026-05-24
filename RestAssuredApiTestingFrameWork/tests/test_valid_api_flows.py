from __future__ import annotations

from typing import Any

import pytest

from framework.fluent_api import Given


@pytest.mark.valid
@pytest.mark.smoke
def test_get_post_by_id(api: Given) -> None:
    api.when().get("/posts/1").status_code(200).header_contains(
        "content-type", "application/json"
    ).json_path("id", 1).json_path("userId", 1)


@pytest.mark.valid
def test_get_posts_by_user(api: Given) -> None:
    response = (
        api.query_param("userId", 1)
        .when()
        .get("/posts")
        .status_code(200)
        .json_path_matches("0.userId", lambda value: value == 1)
        .json()
    )
    assert len(response) > 0


@pytest.mark.valid
def test_create_post(api: Given, test_data: dict[str, Any]) -> None:
    payload = test_data["valid_post"]
    api.body(payload).when().post("/posts").status_code(201).json_path(
        "title", payload["title"]
    ).json_path("body", payload["body"]).json_path("userId", payload["userId"])


@pytest.mark.valid
def test_update_post(api: Given, test_data: dict[str, Any]) -> None:
    payload = test_data["valid_put"]
    api.body(payload).when().put("/posts/1").status_code(200).json_path(
        "id", payload["id"]
    ).json_path("title", payload["title"]).json_path("body", payload["body"])


@pytest.mark.valid
def test_patch_post(api: Given, test_data: dict[str, Any]) -> None:
    payload = test_data["valid_patch"]
    api.body(payload).when().patch("/posts/1").status_code(200).json_path(
        "title", payload["title"]
    )


@pytest.mark.valid
def test_delete_post(api: Given) -> None:
    api.when().delete("/posts/1").status_code(200)
