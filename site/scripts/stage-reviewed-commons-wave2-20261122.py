#!/usr/bin/env python3
"""Exact-file Commons photo research wave 2; never automatically publish.

Reuse the previously tested 1920px->480/960/1920 JPEG and SHA-256 pipeline
while limiting this operation to three independently source-licensed photos.
Image rights and corresponding model aliases are recorded in
photo-curated-caption-and-alias-candidates-20261122.json.
"""
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

staging_path = Path(__file__).with_name("stage-reviewed-commons-20261122.py")
spec = spec_from_file_location("tractorvs_reviewed_commons_staging", staging_path)
if spec is None or spec.loader is None:
    raise RuntimeError("Pinned Commons staging module not available")
staging = module_from_spec(spec)
spec.loader.exec_module(staging)

staging.SOURCES = (
    ("mccormick-x5-085-mbone-2023",
     "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b2/McCormick%2C_Agritechnica_2023%2C_Hanover_%28P1140949%29.jpg/1920px-McCormick%2C_Agritechnica_2023%2C_Hanover_%28P1140949%29.jpg",
     "MB-one", "CC BY-SA 4.0",
     "https://commons.wikimedia.org/wiki/File:McCormick%2C_Agritechnica_2023%2C_Hanover_%28P1140949%29.jpg"),
    ("tym-t6115-t115-marcelx42-2025",
     "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/01/TYM_T115_Agritechnica_2025_%28DSC04612%29.jpg/1920px-TYM_T115_Agritechnica_2025_%28DSC04612%29.jpg",
     "MarcelX42", "CC BY-SA 4.0",
     "https://commons.wikimedia.org/wiki/File:TYM_T115_Agritechnica_2025_%28DSC04612%29.jpg"),
    ("tym-t2025p-t25-marcelx42-2025",
     "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0b/TYM_T25_Agritechnica_2025_%28DSC04615%29.jpg/1920px-TYM_T25_Agritechnica_2025_%28DSC04615%29.jpg",
     "MarcelX42", "CC BY-SA 4.0",
     "https://commons.wikimedia.org/wiki/File:TYM_T25_Agritechnica_2025_%28DSC04615%29.jpg"),
)
if __name__ == "__main__":
    staging.main()
