"""Verify build sources on disk and the exact path set staged for publication."""
import json
import os
import subprocess
import sys
from check import SITE, digest, require

CONTROL = {"source.lock.json","content.lock.json"}
SKIP = {".git","node_modules","public","content","quartz/.quartz-cache","scripts/__pycache__"}

def sources():
    found = {}
    for directory, children, files in os.walk(SITE):
        from pathlib import Path
        parent = Path(directory)
        children[:] = [child for child in children if (parent/child).relative_to(SITE).as_posix() not in SKIP]
        for child in children:
            path = parent/child
            require(path.resolve() == path.absolute(),"禁止目录链接")
        for filename in files:
            path = parent/filename
            name = path.relative_to(SITE).as_posix()
            if name in CONTROL or name == "tsconfig.tsbuildinfo":
                continue
            require(path.resolve() == path.absolute() and path.stat().st_nlink == 1,name+" 链接异常")
            data = path.read_bytes()
            if path.suffix not in {".png",".ico",".woff",".woff2"}:
                data = data.replace(b"\r\n",b"\n")
            found[name] = digest(data)
    return found

def verify(staged=False):
    inventory = json.loads((SITE/"source.lock.json").read_text("utf-8"))
    actual = sources()
    changed = [n for n in sorted(actual.keys() | inventory.keys()) if actual.get(n) != inventory.get(n)]
    require(not changed,"未审核的源码变化: "+", ".join(changed[:6]))
    if staged:
        content = json.loads((SITE/"content.lock.json").read_text("utf-8"))
        allowed = set(inventory) | {"content/"+n for n in content} | CONTROL
        raw = subprocess.check_output(["git","ls-files","--stage","-z"],cwd=SITE)
        tracked = set()
        for item in raw.split(b"\0"):
            if item:
                spec, name = item.decode().split("\t",1)
                mode, _, stage = spec.split()
                require(mode in {"100644","100755"} and stage == "0","拒绝链接或未合并路径")
                tracked.add(name)
        require(tracked == allowed,"暂存文件集合与审核清单不符")
        subprocess.run(["git","diff","--quiet","--"],cwd=SITE,check=True)

if __name__ == "__main__":
    verify("--working" not in sys.argv)
    print("Verified repository inventory.")
