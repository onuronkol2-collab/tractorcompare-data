#!/usr/bin/env python3
"""Offline candidate triage. Never grants rights, identifies a model, downloads or publishes.
Input: JSON array of candidate records; image paths relative to --image-root.
Requires Pillow; optional OpenCV for sharpness estimate. Private input/output only.
"""
import argparse, hashlib, io, json, warnings
from pathlib import Path
from PIL import Image, ImageOps

Image.MAX_IMAGE_PIXELS = 40_000_000
MAX_BYTES = 35 * 1024 * 1024
MAX_PIXELS = 40_000_000
ALLOWED_FORMATS = {'JPEG','PNG','WEBP','TIFF','AVIF'}


def inspect(root, relative):
    p = (root / relative).resolve(strict=True)
    if not p.is_relative_to(root) or not p.is_file():
        raise ValueError('invalid local image path')
    if p.stat().st_size > MAX_BYTES:
        raise ValueError('file exceeds byte cap')
    with p.open("rb") as f: raw = f.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES: raise ValueError("file exceeds byte cap")
    with warnings.catch_warnings():
        warnings.simplefilter('error', Image.DecompressionBombWarning)
        with Image.open(io.BytesIO(raw)) as im:
            if im.format not in ALLOWED_FORMATS or getattr(im, 'n_frames', 1) != 1:
                raise ValueError('unsupported or animated image')
            if im.width * im.height > MAX_PIXELS:
                raise ValueError('pixel cap exceeded')
            fmt = im.format
            im.verify()
        with Image.open(io.BytesIO(raw)) as im:
            im.load()
            rgb = ImageOps.exif_transpose(im).convert('RGB')
    w,h = rgb.size
    gray = rgb.convert('L').resize((9,8), Image.Resampling.LANCZOS)
    px = list(gray.getdata())
    bits = ''.join('1' if px[y*9+x] > px[y*9+x+1] else '0' for y in range(8) for x in range(8))
    sharpness = None
    try:
        import cv2
        import numpy as np
        sample = rgb.copy()
        sample.thumbnail((960,960), Image.Resampling.LANCZOS)
        sharpness = round(float(cv2.Laplacian(np.asarray(sample.convert('L')),cv2.CV_64F).var()),2)
    except ImportError:
        pass
    return {'sha256': hashlib.sha256(raw).hexdigest(), 'dhash64': f'{int(bits,2):016x}', 'format':fmt,'width':w,'height':h,'bytes':len(raw),'sharpness_heuristic':sharpness}


def assess(record, root):
    # Rights/identity are evidence pointers, not assertions made by this script.
    flags=[]
    for key in ('tractor_id','source_page_url','source_image_url','rights_evidence_ref','identity_evidence_ref'):
        if not record.get(key): flags.append('missing_'+key)
    if record.get('rights_conflict'): flags.append('rights_conflict')
    if record.get('previous_rejection') and not record.get('new_evidence_ref'): flags.append('prior_rejection_preserved')
    if record.get('angle') not in ('front','side','front_three_quarter'): flags.append('angle_unconfirmed_or_excluded')
    if record.get('watermark') is not False: flags.append('watermark_absent_not_confirmed')
    try:
        meta=inspect(root,record['local_path'])
        w,h=meta['width'],meta['height']
        if w<640 or h<360: flags.append('low_resolution_manual_review')
        elif w<1200: flags.append('standard_resolution_manual_review')
        if meta['sharpness_heuristic'] is not None and meta['sharpness_heuristic']<60: flags.append('possible_blur_manual_review')
    except Exception as exc:
        meta={}; flags.append('decode_or_path_error:'+type(exc).__name__)
    tier=0 if record.get('model_status')=='published' and record.get('has_approved_photo') is False else 1 if record.get('model_status')=='draft' and record.get('has_approved_photo') is False else 2
    return {'tractor_id':record.get('tractor_id'),'source_page_url':record.get('source_page_url'),'priority':tier,'metrics':meta,'flags':flags,'status':'review_required','publishable':False}


def main():
    p=argparse.ArgumentParser(); p.add_argument('input',type=Path); p.add_argument('output',type=Path); p.add_argument('--image-root',type=Path,required=True); a=p.parse_args()
    root=a.image_root.resolve(strict=True); data=json.loads(a.input.read_text(encoding='utf-8'))
    if not isinstance(data,list): raise ValueError('expected JSON list')
    results=[assess(r,root) for r in data]
    groups={}
    for r in results:
        sha=r['metrics'].get('sha256')
        if sha: groups.setdefault(sha,[]).append(r)
    for group in groups.values():
        if len(group)>1:
            for r in group:r['flags'].append('exact_duplicate_review')
    # dHash is a review signal only; do not merge IDs or assume same model.
    results.sort(key=lambda r:(r['priority'],len(r['flags']),-(r['metrics'].get('width',0))))
    a.output.write_text(json.dumps({'publication_authorized':False,'records':results},ensure_ascii=False,indent=2),encoding='utf-8')

if __name__=='__main__':main()
