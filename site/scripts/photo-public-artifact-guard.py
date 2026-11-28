#!/usr/bin/env python3
"""Fail closed on unexpected entries in the public research report directory.
This is a filename/type/size boundary, not a semantic privacy review of JSON.
Private records and binaries must never be written here.
"""
import json
import stat
import sys
from pathlib import Path

ALLOWED = frozenset({
    'archived-tractor-models.json', 'archived-image-candidates.json',
    'published-model-inventory.json', 'public-image-candidates.json',
    'report.json', 'summary.csv', 'published-photo-coverage.json',
    'openverse-independent-provider-review.json', 'coverage.json',
    'merged-public-leads.json', 'commons-collector.json', 'independent-archives.json',
})
MAX_FILE = 32 * 1024 * 1024
MAX_TOTAL = 96 * 1024 * 1024

def guard(root):
    root = Path(root)
    if root.is_symlink() or not root.is_dir():
        raise ValueError('missing or unsafe public report directory')
    entries = sorted(root.iterdir())
    if not entries:
        raise ValueError('empty public report directory')
    total = 0
    for p in entries:
        info = p.lstat()
        if p.name not in ALLOWED or not stat.S_ISREG(info.st_mode) or info.st_nlink != 1:
            raise ValueError('unexpected or unsafe public report member')
        if not 0 < info.st_size <= MAX_FILE:
            raise ValueError('public report member size limit')
        total += info.st_size
        if total > MAX_TOTAL:
            raise ValueError('public report total size limit')
        if p.suffix == '.json':
            with p.open('r', encoding='utf-8') as f:
                data = json.load(f)
            if not isinstance(data, (dict, list)):
                raise ValueError('invalid public report structure')
    return len(entries)

if __name__ == '__main__':
    print('Public report files checked:', guard(sys.argv[1]))
