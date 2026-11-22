#!/usr/bin/env python3
"""Fail-closed, nonpublishing four-photo Commons JPEG preparation for two TYM UUIDs.

Reuses the repository's proven anti-429 JPEG decoding, fixed 480/960/1920
outputs and source/derivative SHA-256 ledger. No production writes.
"""
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

path = Path(__file__).with_name("stage-reviewed-commons-20261122.py")
spec = spec_from_file_location("tractorvs_verified_commons_jpeg", path)
if spec is None or spec.loader is None:
    raise RuntimeError("Strict Commons source-stage implementation not available")
core = module_from_spec(spec)
spec.loader.exec_module(core)

core.SOURCES = (
    ("tym-t2025p-t25-front-marcelx42-2025",
     "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0b/TYM_T25_Agritechnica_2025_%28DSC04615%29.jpg/1920px-TYM_T25_Agritechnica_2025_%28DSC04615%29.jpg",
     "MarcelX42", "CC BY-SA 4.0",
     "https://commons.wikimedia.org/wiki/File:TYM_T25_Agritechnica_2025_%28DSC04615%29.jpg"),
    ("tym-t2025p-t25-rear-marcelx42-2025",
     "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d7/TYM_T25_Agritechnica_2025_%28DSC04675%29.jpg/1920px-TYM_T25_Agritechnica_2025_%28DSC04675%29.jpg",
     "MarcelX42", "CC BY-SA 4.0",
     "https://commons.wikimedia.org/wiki/File:TYM_T25_Agritechnica_2025_%28DSC04675%29.jpg"),
    ("tym-t6115-t115-front-marcelx42-2025",
     "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/01/TYM_T115_Agritechnica_2025_%28DSC04612%29.jpg/1920px-TYM_T115_Agritechnica_2025_%28DSC04612%29.jpg",
     "MarcelX42", "CC BY-SA 4.0",
     "https://commons.wikimedia.org/wiki/File:TYM_T115_Agritechnica_2025_%28DSC04612%29.jpg"),
    ("tym-t6115-t115-rear-marcelx42-2025",
     "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ca/TYM_T115_Agritechnica_2025_%28DSC04663%29.jpg/1920px-TYM_T115_Agritechnica_2025_%28DSC04663%29.jpg",
     "MarcelX42", "CC BY-SA 4.0",
     "https://commons.wikimedia.org/wiki/File:TYM_T115_Agritechnica_2025_%28DSC04663%29.jpg"),
)

# Explicitly opt in to four exact source files; core default remains three.
core.EXPECTED_BATCH_COUNT = 4

if __name__ == "__main__":
    core.main()
