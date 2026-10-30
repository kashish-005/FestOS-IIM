"""Converts data/*.csv -> data.js (so index.html works by double-click, no server needed).
Run:  python build.py"""
import csv, json, glob, os
out = {}
for f in sorted(glob.glob(os.path.join(os.path.dirname(__file__) or '.', 'data', '*.csv'))):
    with open(f, newline='', encoding='utf-8-sig') as fh:
        out[os.path.basename(f)[:-4]] = [{k.strip(): (v or '').strip() for k, v in r.items()} for r in csv.DictReader(fh)]
open(os.path.join(os.path.dirname(__file__) or '.', 'data.js'), 'w', encoding='utf-8').write('window.DATA=' + json.dumps(out, separators=(',', ':')) + ';')
print({k: len(v) for k, v in out.items()})
