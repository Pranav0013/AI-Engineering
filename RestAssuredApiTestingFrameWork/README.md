# Rest Assured API Testing Framework

Python pytest framework using Playwright APIRequestContext with a fluent, Rest Assured style interface.

## Highlights

- Fluent `given().when().then()` API testing syntax.
- Playwright `APIRequestContext` for HTTP execution.
- pytest fixtures for setup and teardown.
- Reusable request specs, response validators, logging, and configuration.
- Data-driven payloads using JSON.
- Test-case documentation in `test_data/test_cases.md` and `test_data/test_cases.csv`.

## Structure

```text
RestAssuredApiTestingFrameWork/
├── framework/
│   ├── config.py
│   ├── fluent_api.py
│   ├── logger.py
│   ├── request_spec.py
│   └── response_validator.py
├── test_data/
│   ├── api_test_data.json
│   ├── test_cases.csv
│   └── test_cases.md
├── tests/
│   ├── conftest.py
│   ├── test_invalid_api_flows.py
│   └── test_valid_api_flows.py
├── pyproject.toml
└── pytest.ini
```

## Run

```bash
poetry install
poetry run pytest
```

## HTML Report

```bash
poetry run pytest --html=reports/api-report.html --self-contained-html
```
