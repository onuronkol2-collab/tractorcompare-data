#!/usr/bin/env python3
"""Private/offline review derivatives. No network, rights approval or publication."""
import argparse, hashlib, io, json, os, re, tempfile, warnings
from pathlib import Path
from PIL import Image, ImageOps
MAX_ORIGINAL_BYTES=35*1024*1024
MAX_ORIGINAL_PIXELS=40_000_000
MAX_CLOUD_BYTES=10*1024*1024
MAX_CLOUD_PIXELS=25_000_000
WIDTHS=(480,960,1920)
Image.MAX_IMAGE_PIXELS=MAX_ORIGINAL_PIXELS

def sha(data): return hashlib.sha256(data).hexdigest()
def prepare(original:Path, expected_sha:str, output:Path):
    if not re.fullmatch(r'[0-9a-f]{64}',expected_sha): raise ValueError('invalid expected SHA256')
    if not original.is_file() or original.stat().st_size>MAX_ORIGINAL_BYTES: raise ValueError('original exceeds cap or missing')
    with original.open('rb') as f: raw=f.read(MAX_ORIGINAL_BYTES+1)
    if len(raw)>MAX_ORIGINAL_BYTES or sha(raw)!=expected_sha: raise ValueError('original integrity failure')
    with warnings.catch_warnings():
        warnings.simplefilter('error',Image.DecompressionBombWarning)
        with Image.open(io.BytesIO(raw)) as im:
            if im.format not in {'JPEG','PNG','WEBP'} or getattr(im,'n_frames',1)!=1 or im.width*im.height>MAX_ORIGINAL_PIXELS: raise ValueError('unsupported image')
            im.verify()
        with Image.open(io.BytesIO(raw)) as im:
            im.load(); rgb=ImageOps.exif_transpose(im).convert('RGB')
    output.mkdir(parents=True,exist_ok=True)
    dest=output/expected_sha
    if dest.exists(): raise FileExistsError('existing staged original; inspect manifest, do not overwrite')
    records=[]
    with tempfile.TemporaryDirectory(prefix='.staging-',dir=output) as tmp:
        root=Path(tmp); staging=root/'payload';staging.mkdir()
        for width in WIDTHS:
            if rgb.width<width: continue # never upscale
            derived=rgb.copy(); derived.thumbnail((width,1920),Image.Resampling.LANCZOS)
            for fmt,ext in [('JPEG','jpg'),('WEBP','webp')]:
                buf=io.BytesIO();derived.save(buf,format=fmt,quality=88 if fmt=='JPEG' else 85)
                data=buf.getvalue()
                if len(data)>MAX_CLOUD_BYTES or derived.width*derived.height>MAX_CLOUD_PIXELS: raise ValueError('derivative exceeds free limits')
                name=f'{derived.width}-{derived.height}.{ext}'
                if any(x['file']==name for x in records): continue
                (staging/name).write_bytes(data)
                records.append({'file':name,'bytes':len(data),'sha256':sha(data),'width':derived.width,'height':derived.height,'format':fmt})
        if not records: raise ValueError('rare small photo needs separate review; no artificial enlargement')
        manifest={'original_sha256':expected_sha,'original_bytes':len(raw),'original_width':rgb.width,'original_height':rgb.height,'derivatives':records,'rights_verified':False,'identity_verified':False,'publishable':False,'note':'Original unchanged; metadata stripped from derivatives. Attribution and original licence must follow every derivative.'}
        (staging/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
        # Reserve the destination with mkdir, so a second process cannot replace it.
        dest.mkdir(exist_ok=False)
        try:
            for item in staging.iterdir():
                if item.name!='manifest.json': os.replace(item,dest/item.name)
            os.replace(staging/'manifest.json',dest/'manifest.json') # completion marker last
        except Exception:
            # No completed manifest => quarantine, never reuse automatically.
            raise
    return manifest

def main():
    p=argparse.ArgumentParser();p.add_argument('original',type=Path);p.add_argument('expected_sha256');p.add_argument('private_output',type=Path);a=p.parse_args()
    print(json.dumps(prepare(a.original,a.expected_sha256,a.private_output),indent=2))
if __name__=='__main__':main()
