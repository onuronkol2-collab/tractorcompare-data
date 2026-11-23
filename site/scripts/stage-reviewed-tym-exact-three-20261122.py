#!/usr/bin/env python3
"""Stage only three independent, Commons-own-work TYM photos for human review.

This script cannot publish images, edit Supabase, touch the public photo
resolver, or bypass HTTP 429. It reuses the existing strict JPEG + SHA-256
verification library and targets three distinct real published UUIDs.
"""
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

base = Path(__file__).with_name("stage-reviewed-commons-20261122.py")
spec = spec_from_file_location("tractorvs_strict_commons_jpeg", base)
if spec is None or spec.loader is None:
    raise RuntimeError("Verified Commons image stage code is missing")
stage = module_from_spec(spec)
spec.loader.exec_module(stage)

stage.SOURCES = (
    (
        "tym-t2026-2500l-marcelx42-2023",
        "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/88/TYM_2500L_Agritechnica_2023_%28DSC05265%29.jpg/1920px-TYM_2500L_Agritechnica_2023_%28DSC05265%29.jpg",
        "MarcelX42", "CC BY-SA 4.0",
        "https://commons.wikimedia.org/wiki/File:TYM_2500L_Agritechnica_2023_%28DSC05265%29.jpg",
    ),
    (
        "tym-t4058-6225c-marcelx42-2023",
        "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ea/TYM_6225C_Agritechnica_2023_%28DSC03508%29.jpg/1920px-TYM_6225C_Agritechnica_2023_%28DSC03508%29.jpg",
        "MarcelX42", "CC BY-SA 4.0",
        "https://commons.wikimedia.org/wiki/File:TYM_6225C_Agritechnica_2023_%28DSC03508%29.jpg",
    ),
    (
        "tym-t5075-t78-marcelx42-2023",
        "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5b/TYM_T78_Agritechnica_2023_%28DSC03605%29.jpg/1920px-TYM_T78_Agritechnica_2023_%28DSC03605%29.jpg",
        "MarcelX42", "CC BY-SA 4.0",
        "https://commons.wikimedia.org/wiki/File:TYM_T78_Agritechnica_2023_%28DSC03605%29.jpg",
    ),
)

if __name__ == "__main__":
    stage.main()
