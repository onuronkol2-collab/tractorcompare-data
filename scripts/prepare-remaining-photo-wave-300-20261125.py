# Evidence only, not publication approval. Verify decoded originals and generate review sheets.
from pathlib import Path
import json,hashlib
from PIL import Image,ImageOps,ImageDraw
root=Path("bulk-photo-wave-evidence")
report=json.loads((root/"report.json").read_text())
out=root/"derivatives";out.mkdir(exist_ok=True)
thumbs=[]
for row in report["entries"]:
    if not row.get("file"):continue
    try:
        src=root/"originals"/row["file"];b=src.read_bytes()
        assert len(b)==row["originalBytes"] and hashlib.sha256(b).hexdigest()==row["originalSha256"] and hashlib.sha1(b).hexdigest()==row["verifiedSha1"]
        im=Image.open(src);fmt=im.format
        assert fmt in ("JPEG","MPO")
        frames=getattr(im,"n_frames",1);assert 1<=frames<=8
        for i in range(frames):im.seek(i);im.load()
        im.seek(0);im.load();assert im.size==(row["width"],row["height"])
        im=ImageOps.exif_transpose(im).convert("RGB")
        assert im.width>=480 and im.height>=300
        row["decodedFormat"]=fmt;row["decodedFrames"]=frames;row["selectedFrame"]=0
        row["derivatives"]=[]
        for w in (480,960,1920):
            if im.width<w:continue
            h=round(im.height*w/im.width)
            name=Path(row["file"]).stem+"-"+str(w)+".jpg";p=out/name
            im.resize((w,h),Image.Resampling.LANCZOS).save(p,format="JPEG",quality=85,optimize=True,progressive=True)
            data=p.read_bytes()
            with Image.open(p) as check:check.load();assert check.size==(w,h)
            row["derivatives"].append(dict(file=name,width=w,height=h,bytes=len(data),sha256=hashlib.sha256(data).hexdigest()))
        t=ImageOps.contain(im,(330,225));thumbs.append((row["file"],row["title"],t.copy()))
        row["decoded"]=True
    except Exception as e:row["decodeError"]=str(e);row["decoded"]=False
for k in range(0,len(thumbs),12):
    batch=thumbs[k:k+12];sheet=Image.new("RGB",(1080,((len(batch)+2)//3)*285),"white");d=ImageDraw.Draw(sheet)
    for i,(name,title,t) in enumerate(batch):
        x=(i%3)*360;y=(i//3)*285;sheet.paste(t,(x+(360-t.width)//2,y+4));d.text((x+8,y+236),name,fill="black");d.text((x+8,y+253),title[:50],fill="black")
    sheet.save(root/("contact-"+str(k//12+1)+".jpg"),quality=88)
report["decodedOriginals"]=sum(bool(r.get("decoded")) for r in report["entries"])
report["derivativeCount"]=sum(len(r.get("derivatives",[])) for r in report["entries"] if r.get("decoded"))
(root/"report.json").write_text(json.dumps(report,indent=2,ensure_ascii=False))
print("BULK_PHOTO_DECODE "+json.dumps({"decoded":report["decodedOriginals"],"derivatives":report["derivativeCount"],"publicationCount":0}))
