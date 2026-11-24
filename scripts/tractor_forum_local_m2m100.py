"""Local-only M2M100 reference generator. No API calls, DB writes or approval.
Input JSON: {"source_locale":"tr","source_hash":"...","segments":[{"id":"title","text":"..."}]}
Use private files outside the repository; segment Markdown into individual prose/table cells.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re

MODEL = "facebook/m2m100_418M"
REVISION = "55c2e61bbf05dfb8d7abccdc3fae6fc8512fd636"
LANGS = {"tr":"tr","en":"en","zh":"zh","hi":"hi","pt-br":"pt","fr":"fr","de":"de","ru":"ru","ja":"ja","es":"es"}
MAX_TOKENS = 384

def validate(data, locales):
    if data.get("source_locale") not in LANGS or not re.fullmatch(r"[0-9a-f]{32}|[0-9a-f]{64}", data.get("source_hash","")):
        raise ValueError("invalid source locale/hash")
    if not locales or len(set(locales)) != len(locales) or any(x not in LANGS or x == data["source_locale"] for x in locales):
        raise ValueError("invalid target locales")
    segments = data.get("segments")
    if not isinstance(segments,list) or not 1 <= len(segments) <= 1000:
        raise ValueError("invalid segment count")
    ids = set()
    for seg in segments:
        if not isinstance(seg,dict) or not isinstance(seg.get("id"),str) or not seg["id"] or seg["id"] in ids:
            raise ValueError("duplicate or invalid segment id")
        if not isinstance(seg.get("text"),str) or not seg["text"].strip() or len(seg["text"]) > 4000:
            raise ValueError("invalid segment text")
        ids.add(seg["id"])
    return segments

def reference(data, locales, tokenizer, model, torch):
    segments = validate(data, locales)
    tokenizer.src_lang = LANGS[data["source_locale"]]
    # Check before inference: no silent source truncation.
    for seg in segments:
        if len(tokenizer.encode(seg["text"], add_special_tokens=True)) > MAX_TOKENS:
            raise ValueError("segment exceeds token budget; split losslessly")
    results = {}
    for locale in locales:
        rows = []
        for offset in range(0,len(segments),4):
            batch = segments[offset:offset+4]
            encoded = tokenizer([s["text"] for s in batch], return_tensors="pt", padding=True, truncation=False)
            with torch.inference_mode():
                output = model.generate(**encoded, forced_bos_token_id=tokenizer.get_lang_id(LANGS[locale]), max_new_tokens=512, num_beams=4, do_sample=False)
            for seg, tokens in zip(batch, output):
                if len(tokens) >= 512 or tokenizer.eos_token_id not in tokens.tolist():
                    raise ValueError("possible incomplete generation")
                translated = tokenizer.decode(tokens,skip_special_tokens=True).strip()
                if not translated:
                    raise ValueError("empty reference")
                rows.append({"id":seg["id"],"source_sha256":hashlib.sha256(seg["text"].encode()).hexdigest(),"reference":translated})
        if len(rows) != len(segments):
            raise ValueError("incomplete reference")
        results[locale] = {"regional_review_required":locale=="pt-br","segments":rows}
    return {"model":MODEL,"revision":REVISION,"source_hash":data["source_hash"],"status":"reference_only_not_approved","locales":results}

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--input",type=Path,required=True)
    p.add_argument("--output",type=Path,required=True)
    p.add_argument("--locales",nargs="+",required=True)
    p.add_argument("--download",action="store_true",help="Explicitly allow downloading pinned model files; no hosted inference.")
    args=p.parse_args()
    data=json.loads(args.input.read_text(encoding="utf-8"))
    validate(data,args.locales)
    # Do not leak private forum data into tracked files or public CI artifacts.
    root=Path(__file__).resolve().parents[1]
    if any(root == f.resolve() or root in f.resolve().parents for f in (args.input,args.output)):
        raise ValueError("use private input/output paths outside repository")
    if args.output.exists():
        raise FileExistsError("output already exists")
    import torch
    from transformers import M2M100ForConditionalGeneration, M2M100Tokenizer
    torch.set_num_threads(min(4,os.cpu_count() or 1))
    opts={"revision":REVISION,"local_files_only":not args.download,"trust_remote_code":False}
    tokenizer=M2M100Tokenizer.from_pretrained(MODEL,**opts)
    model=M2M100ForConditionalGeneration.from_pretrained(MODEL,**opts,weights_only=True).eval()
    result=reference(data,args.locales,tokenizer,model,torch)
    fd=os.open(args.output,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
    with os.fdopen(fd,"w",encoding="utf-8") as f:
        json.dump(result,f,ensure_ascii=False,indent=2)
    print("Reference generated; editorial approval still required.")

if __name__=="__main__":
    main()
