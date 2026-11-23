#!/usr/bin/env python3
"""Stage three Commons-owned TYM F50CHN views without publishing or DB writes.

These three originals picture the EXACT published F50CHN tractor variant, not
the separately listed T3048 F50CN or F50. Source and author rights must be
independently inspected before any model-UUID-scoped publication.
"""
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
source=Path(__file__).with_name("stage-reviewed-commons-20261122.py")
spec=spec_from_file_location("tractorvs_reviewed_media",source)
if spec is None or spec.loader is None: raise RuntimeError("Verified staging library unavailable")
stage=module_from_spec(spec)
spec.loader.exec_module(stage)
stage.SOURCES=(
 ("tym-t3048-f50chn-55-marcelx42-2025",
  "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c2/TYM_F50Chn_Agritechnica_2025_%28DSC04655%29.jpg/1920px-TYM_F50Chn_Agritechnica_2025_%28DSC04655%29.jpg",
  "MarcelX42","CC BY-SA 4.0",
  "https://commons.wikimedia.org/wiki/File:TYM_F50Chn_Agritechnica_2025_%28DSC04655%29.jpg"),
 ("tym-t3048-f50chn-57-marcelx42-2025",
  "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/27/TYM_F50Chn_Agritechnica_2025_%28DSC04657%29.jpg/1920px-TYM_F50Chn_Agritechnica_2025_%28DSC04657%29.jpg",
  "MarcelX42","CC BY-SA 4.0",
  "https://commons.wikimedia.org/wiki/File:TYM_F50Chn_Agritechnica_2025_%28DSC04657%29.jpg"),
 ("tym-t3048-f50chn-73-marcelx42-2025",
  "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/60/TYM_F50Chn_Agritechnica_2025_%28DSC04673%29.jpg/1920px-TYM_F50Chn_Agritechnica_2025_%28DSC04673%29.jpg",
  "MarcelX42","CC BY-SA 4.0",
  "https://commons.wikimedia.org/wiki/File:TYM_F50Chn_Agritechnica_2025_%28DSC04673%29.jpg"),
)
if __name__=="__main__":stage.main()
