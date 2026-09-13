"""Dump the FastAPI app's OpenAPI schema to stdout as JSON.

Used by the frontend's `npm run generate-api` step (Orval) to generate a
typed client without needing a running server:

    python -m app.export_openapi > openapi.json
"""

import json

from app.main import app


def main() -> None:
    print(json.dumps(app.openapi()))


if __name__ == "__main__":
    main()
