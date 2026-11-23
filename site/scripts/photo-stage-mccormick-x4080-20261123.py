#!/usr/bin/env python3
"""One exact Commons source; review-only photo preparation, never publication.

Reuses the project's bounded JPEG/SHA staging code and never writes to the
site/public catalogue. No proxy switching, media scraping or HTTP 429 retries.
"""
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

module_path = Path(__file__).with_name("stage-reviewed-commons-20261122.py")
spec = spec_from_file_location("tractorvs_reviewed_commons_single", module_path)
if spec is None or spec.loader is None:
    raise RuntimeError("Existing reviewed Commons staging implementation missing")
staging = module_from_spec(spec)
spec.loader.exec_module(staging)

staging.EXPECTED_BATCH_COUNT = 1
staging.SOURCES = (
    (
        "mccormick-x4-080-mbone-agritechnica-2023",
        "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/33/McCormick_X4.080%2C_Agritechnica_2023%2C_Hanover_%28P1140946%29.jpg/1920px-McCormick_X4.080%2C_Agritechnica_2023%2C_Hanover_%28P1140946%29.jpg",
        "MB-one", "CC BY-SA 4.0",
        "https://commons.wikimedia.org/wiki/File:McCormick_X4.080%2C_Agritechnica_2023%2C_Hanover_%28P1140946%29.jpg",
    ),
)
if __name__ == "__main__":
    staging.main()
