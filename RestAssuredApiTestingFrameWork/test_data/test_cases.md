# API Test Case Matrix

Base URL: `https://jsonplaceholder.typicode.com`

| ID | Type | Priority | Summary | Method | Endpoint | Expected Result |
|---|---|---:|---|---|---|---|
| TC_001 | Positive | High | Retrieve post by valid ID | GET | `/posts/1` | Valid post details are returned |
| TC_002 | Positive | High | Retrieve posts by user ID | GET | `/posts?userId=1` | Filtered posts are returned for user ID 1 |
| TC_003 | Positive | High | Create post with valid payload | POST | `/posts` | Post is created and payload values are echoed |
| TC_004 | Positive | Medium | Update post with valid payload | PUT | `/posts/1` | Post is fully updated |
| TC_005 | Positive | Medium | Patch post title | PATCH | `/posts/1` | Post title is partially updated |
| TC_006 | Positive | Medium | Delete post by valid ID | DELETE | `/posts/1` | Delete request is accepted |
| TC_007 | Negative | High | Retrieve missing post | GET | `/posts/999999` | Not found response is returned |
| TC_008 | Negative | High | Call unsupported route | GET | `/secure-login` | Not found response is returned |
| TC_009 | Negative | Medium | Delete unknown post | DELETE | `/posts/999999` | Demo API accepts delete request for unknown post |
| TC_010 | Negative | Medium | Create post with invalid-looking payload | POST | `/posts` | Demo API echoes submitted payload |
| TC_011 | Framework | High | Validate explicit assertion failure | GET | `/posts/1` | Framework reports a clear status mismatch |

## Detailed Test Cases

### TC_001 - Retrieve Post By Valid ID

| Field | Details |
|---|---|
| Type | Positive |
| Priority | High |
| Method | GET |
| Endpoint | `/posts/1` |
| Precondition | API is available and post ID `1` exists |
| Test Data | `postId=1` |
| Validation Points | `status=200`, `content-type` contains `application/json`, `id=1`, `userId=1` |
| Automated Test | `tests/test_valid_api_flows.py::test_get_post_by_id` |

### TC_002 - Retrieve Posts By User ID

| Field | Details |
|---|---|
| Type | Positive |
| Priority | High |
| Method | GET |
| Endpoint | `/posts?userId=1` |
| Precondition | API is available and user ID `1` has posts |
| Test Data | `userId=1` |
| Validation Points | `status=200`, first item has `userId=1`, response list is not empty |
| Automated Test | `tests/test_valid_api_flows.py::test_get_posts_by_user` |

### TC_003 - Create Post With Valid Payload

| Field | Details |
|---|---|
| Type | Positive |
| Priority | High |
| Method | POST |
| Endpoint | `/posts` |
| Precondition | Valid post payload exists in `api_test_data.json` |
| Test Data | `valid_post` |
| Validation Points | `status=201`, title matches payload, body matches payload, `userId` matches payload |
| Automated Test | `tests/test_valid_api_flows.py::test_create_post` |

### TC_004 - Update Post With Valid Payload

| Field | Details |
|---|---|
| Type | Positive |
| Priority | Medium |
| Method | PUT |
| Endpoint | `/posts/1` |
| Precondition | Post ID `1` exists and valid PUT payload is available |
| Test Data | `valid_put` |
| Validation Points | `status=200`, `id=1`, title matches payload, body matches payload |
| Automated Test | `tests/test_valid_api_flows.py::test_update_post` |

### TC_005 - Patch Post Title

| Field | Details |
|---|---|
| Type | Positive |
| Priority | Medium |
| Method | PATCH |
| Endpoint | `/posts/1` |
| Precondition | Post ID `1` exists and valid PATCH payload is available |
| Test Data | `valid_patch` |
| Validation Points | `status=200`, title matches patched value |
| Automated Test | `tests/test_valid_api_flows.py::test_patch_post` |

### TC_006 - Delete Post By Valid ID

| Field | Details |
|---|---|
| Type | Positive |
| Priority | Medium |
| Method | DELETE |
| Endpoint | `/posts/1` |
| Precondition | Post ID `1` exists |
| Test Data | `postId=1` |
| Validation Points | `status=200` |
| Automated Test | `tests/test_valid_api_flows.py::test_delete_post` |

### TC_007 - Retrieve Missing Post

| Field | Details |
|---|---|
| Type | Negative |
| Priority | High |
| Method | GET |
| Endpoint | `/posts/999999` |
| Precondition | Missing post ID is known |
| Test Data | `postId=999999` |
| Validation Points | `status=404`, body contains empty JSON object |
| Automated Test | `tests/test_invalid_api_flows.py::test_get_missing_post_returns_not_found` |

### TC_008 - Call Unsupported Route

| Field | Details |
|---|---|
| Type | Negative |
| Priority | High |
| Method | GET |
| Endpoint | `/secure-login` |
| Precondition | Unsupported route is known |
| Test Data | `endpoint=/secure-login` |
| Validation Points | `status=404` |
| Automated Test | `tests/test_invalid_api_flows.py::test_unsupported_route_returns_not_found` |

### TC_009 - Delete Unknown Post

| Field | Details |
|---|---|
| Type | Negative |
| Priority | Medium |
| Method | DELETE |
| Endpoint | `/posts/999999` |
| Precondition | Missing post ID is known |
| Test Data | `postId=999999` |
| Validation Points | `status=200` |
| Automated Test | `tests/test_invalid_api_flows.py::test_delete_unknown_post_still_returns_success_for_demo_api` |

### TC_010 - Create Post With Invalid-Looking Payload

| Field | Details |
|---|---|
| Type | Negative |
| Priority | Medium |
| Method | POST |
| Endpoint | `/posts` |
| Precondition | Invalid-looking payload exists in `api_test_data.json` |
| Test Data | `invalid_post` |
| Validation Points | `status=201`, blank title echoed, blank body echoed, null `userId` echoed |
| Automated Test | `tests/test_invalid_api_flows.py::test_invalid_payload_is_echoed_by_demo_api` |

### TC_011 - Validate Explicit Assertion Failure

| Field | Details |
|---|---|
| Type | Framework |
| Priority | High |
| Method | GET |
| Endpoint | `/posts/1` |
| Precondition | Post ID `1` exists and validator is available |
| Test Data | `expectedStatus=201`, `actualStatus=200` |
| Validation Points | `ResponseValidationError` is raised |
| Automated Test | `tests/test_invalid_api_flows.py::test_response_validation_failure_is_explicit` |
