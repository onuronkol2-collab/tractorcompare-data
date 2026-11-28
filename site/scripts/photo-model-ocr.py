#!/usr/bin/env python3
"""Offline, bounded OCR evidence. Never approves an identity or a license."""
import argparse,csv,hashlib,io,json,re,shutil,subprocess,tempfile,unicodedata,warnings
from pathlib import Path
from PIL import Image,ImageOps,ImageEnhance
MAX_BYTES=35*1024*1024
MAX_PIXELS=40_000_000
Image.MAX_IMAGE_PIXELS=MAX_PIXELS

def normalized(v):
    return re.sub(r'[^a-z0-9]+','',unicodedata.normalize('NFKD',v).casefold())

def recognize(source,expected,brand,model,engine='tesseract'):
    if not re.fullmatch(r'[a-f0-9]{64}',expected):raise ValueError('invalid digest')
    with source.open('rb') as f: raw=f.read(MAX_BYTES+1)
    if len(raw)>MAX_BYTES or hashlib.sha256(raw).hexdigest()!=expected:raise ValueError('original integrity failure')
    exe=shutil.which(engine)
    if exe is None:raise RuntimeError('local OCR engine unavailable')
    with warnings.catch_warnings():
        warnings.simplefilter('error',Image.DecompressionBombWarning)
        with Image.open(io.BytesIO(raw)) as im:
            if im.format not in {'JPEG','PNG','WEBP'} or getattr(im,'n_frames',1)!=1 or im.width*im.height>MAX_PIXELS:raise ValueError('unsupported image')
            im.load(); img=ImageOps.exif_transpose(im).convert('RGB')
    img.thumbnail((2400,2400),Image.Resampling.LANCZOS)
    words=[]
    with tempfile.TemporaryDirectory(prefix='tractorvs-ocr-') as temp:
        for i,(variant,psm) in enumerate([(img,11),(ImageEnhance.Contrast(ImageOps.grayscale(img)).enhance(1.8),11)]):
            p=Path(temp)/f'{i}.png';variant.save(p)
            result=subprocess.run([exe,str(p),'stdout','-l','eng','--psm',str(psm),'tsv'],capture_output=True,timeout=30,check=True,text=True,encoding='utf-8',errors='replace')
            if len(result.stdout)>1_000_000:raise ValueError('OCR output cap')
            for row in csv.DictReader(io.StringIO(result.stdout),delimiter='\t'):
                try: conf=float(row.get('conf','-1'))
                except ValueError:continue
                word=(row.get('text') or '').strip()
                if conf>=50 and word and len(word)<=100 and len(words)<500:words.append({'text':word,'confidence':conf,'pass':i})
    # Concatenating independent OCR passes or arbitrary words can fabricate a match; only exact single tokens are signals.
    tokens={normalized(x['text']) for x in words}; b=normalized(brand); m=normalized(model)
    return {'original_sha256':expected,'brand':brand,'model':model,'words':words,'brand_token_signal':bool(b and b in tokens),'model_token_signal':bool(m and m in tokens),'identity_verified':False,'rights_verified':False,'publishable':False,'note':'OCR evidence only; manual visual/model and rights gate still mandatory. Multi-token models require review.'}

def main():
    p=argparse.ArgumentParser();p.add_argument('original',type=Path);p.add_argument('sha256');p.add_argument('brand');p.add_argument('model');a=p.parse_args()
    print(json.dumps(recognize(a.original,a.sha256,a.brand,a.model),ensure_ascii=False,indent=2))
if __name__=='__main__':main()
