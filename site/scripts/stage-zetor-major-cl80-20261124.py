import hashlib,json,pathlib,subprocess
base=pathlib.Path("review-input")
original=base/"candidate-5.jpg"
source={"brand":"Zetor","model":"MAJOR","tractorId":"755e44bc-8043-4d41-9e08-f40e818ac00b","fileId":"zetor-major-cl80-jj7777","path":"6/6a/ZETOR_MAJOR.jpg","photographer":"JJ7777","license":"CC BY-SA 4.0","width":4969,"height":3313,"sourcePage":"https://commons.wikimedia.org/wiki/File:ZETOR_MAJOR.jpg","originalUrl":"https://upload.wikimedia.org/wikipedia/commons/6/6a/ZETOR_MAJOR.jpg","originalSha256":"36aadf37489ec747954a277831487cd200ee5ae4ac18138cd9e541220cf9b53b","originalBytes":6320573,"modelEvidence":"Independent visual review of original candidate-5.jpg: Zetor and MAJOR CL 80 hood markings legible when enlarged. Public inventory confirms exact CL 80 Europe UUID. Not MAJOR HS 80.","modelSources":["https://www.zetor.com/zetor-major-technical-parameters"],"scope":"Model illustration only; year and equipment not verified.","sourceCredit":"Own work, JJ7777","licenseUrl":"https://creativecommons.org/licenses/by-sa/4.0/","changes":"Proportional resizing and JPEG compression; derivatives distributed under CC BY-SA 4.0.","sourceArtifact":"https://github.com/onuronkol2-collab/tractorcompare-data/actions/runs/45422737022/artifacts/14934029449"}
report=json.loads((base/"report.json").read_text())
row=next(e for e in report["entries"] if e.get("file")=="candidate-5.jpg")
info=row["metadata"]
assert row["title"]=="File:ZETOR MAJOR.jpg" and row["sourcePage"]==source["sourcePage"]
assert row["targets"]==[source["tractorId"]] and row["sha256"]==source["originalSha256"]
assert info["width"]==source["width"] and info["height"]==source["height"]
assert info["extmetadata"]["LicenseShortName"]["value"]==source["license"]
assert info["extmetadata"]["LicenseUrl"]["value"].rstrip("/") == source["licenseUrl"].rstrip("/")
assert "JJ7777" in info["extmetadata"]["Artist"]["value"] and "Own work" in info["extmetadata"]["Credit"]["value"]
b=original.read_bytes()
assert len(b)==source["originalBytes"] and hashlib.sha256(b).hexdigest()==source["originalSha256"]
assert hashlib.sha1(b).hexdigest()==info["sha1"]
assert subprocess.check_output(["identify","-format","%m %w %h",str(original)],text=True)=="JPEG 4969 3313"
out=pathlib.Path("site/public/images/tractors")
out.mkdir(parents=True,exist_ok=True)
source["derivatives"]=[]
for width in (480,960,1920):
 target=out/(source["fileId"]+"-"+str(width)+".jpg")
 assert not target.exists(), "Do not overwrite existing asset"
 subprocess.run(["convert",str(original),"-auto-orient","-resize",str(width)+"x>","-strip","-quality","86",str(target)],check=True)
 fmt,w,h=subprocess.check_output(["identify","-format","%m %w %h",str(target)],text=True).split()
 assert fmt=="JPEG" and int(w)==width and abs(int(h)-source["height"]*width/source["width"])<2
 data=target.read_bytes()
 assert data[:2]==b'\xff\xd8' and data[-2:]==b'\xff\xd9'
 source["derivatives"].append(dict(file=target.name,width=int(w),height=int(h),sha256=hashlib.sha256(data).hexdigest(),bytes=len(data)))
pathlib.Path("site/docs/photo-evidence-zetor-major-cl80-20261124.json").write_text(json.dumps([source],indent=2)+"\n")
print("STAGED_ZETOR_MAJOR_CL80 "+json.dumps(source["derivatives"]))
