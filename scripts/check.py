"""Validate a complete public content snapshot, including reviewed attachments."""
import datetime as dt
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import struct
import sys
from urllib.parse import unquote, urlsplit

import yaml

SITE = Path(__file__).resolve().parents[1]
CONTENT = SITE / "content"
LOCK = SITE / "content.lock.json"
SECRET = re.compile(
    r"-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:github_pat_|gh[pousr]_|sk-(?:proj-)?|AKIA|AIza)[\w-]{12,}"
    r"|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|\b1[3-9]\d{9}\b"
    r"|(?:(?<![A-Za-z0-9])[A-Z]:[\\/]|/(?:home|Users)/|\\\\[A-Za-z0-9_-]+\\)"
    r"|(?:password|passwd|api[_-]?key|secret|token|密码|密钥)\s*[:=：]\s*\S+"
    r"|Bearer\s+[A-Za-z0-9._-]{12,}", re.I)
TYPES = {"knowledge","troubleshooting","paper","experiment","project","tool","log","reflection","idea","moc"}
class UniqueLoader(yaml.SafeLoader):
    pass

def mapping(loader, node):
    result = {}
    for key, value in node.value:
        name = loader.construct_object(key)
        if name in result:
            raise ValueError("重复 YAML 属性")
        result[name] = loader.construct_object(value)
    return result

UniqueLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, mapping)

def require(ok, message):
    if not ok:
        raise ValueError(message)

def digest(data):
    return hashlib.sha256(data).hexdigest()

def safe_name(name):
    require(isinstance(name, str) and re.fullmatch(r"[\w.-]+(?:/[\w.-]+)*", name)
            and all(not part.startswith(".") for part in name.split("/")), "文件名须使用文字、数字、点、短横线或下划线")

def regular(root, name):
    safe_name(name)
    p = root / name
    require(root.resolve() == root.absolute() and p.resolve() == p.absolute() and p.is_file()
            and p.stat().st_nlink == 1, f"{name} 文件缺失或经过链接")
    return p

def note(data, name):
    parts = data.decode("utf-8").replace("\r\n","\n").split("---\n",2)
    require(len(parts) == 3 and parts[0] == "", f"{name} 缺少 YAML")
    meta = yaml.load(parts[1], Loader=UniqueLoader)
    require(isinstance(meta,dict) and meta.get("type") in TYPES and
            isinstance(meta.get("title"),str) and meta["title"].strip() and
            isinstance(meta.get("status"),str) and type(meta.get("publish")) is bool and
            isinstance(meta.get("tags"),list) and all(isinstance(t,str) for t in meta["tags"]), f"{name} 属性无效")
    for key in ("created","updated"):
        dt.date.fromisoformat(str(meta.get(key)))
    require(str(meta["created"]) <= str(meta["updated"]), f"{name} 更新日期早于创建日期")
    return meta, parts[2]

def scan(data, name):
    require(not SECRET.search(data), f"{name} 含疑似敏感信息，请在本地核查")

def validate(files):
    seen, targets = set(), {}
    for name in files:
        safe_name(name)
        p = PurePosixPath(name)
        key = (p.stem if p.suffix == ".md" else p.name).casefold()
        require(key not in targets, f"{name} 文件名冲突")
        targets[key] = name
    for name, data in files.items():
        p = PurePosixPath(name)
        if p.suffix == ".png":
            require(data.startswith(b"\x89PNG\r\n\x1a\n"), f"{name} 不是 PNG")
            offset = 8
            while offset < len(data):
                size = struct.unpack(">I",data[offset:offset+4])[0]
                kind = data[offset+4:offset+8]
                require(kind in (b"IHDR",b"IDAT",b"IEND",b"PLTE",b"tRNS",b"sRGB",b"gAMA",b"pHYs"),
                        f"{name} 含额外元数据")
                offset += size + 12
                if kind == b"IEND":
                    break
            require(offset == len(data) and kind == b"IEND", f"{name} 图片结构异常")
            continue
        require(p.suffix in (".md",".csv",".txt"), f"{name} 附件格式需要独立审核策略")
        s = data.decode("utf-8")
        scan(s, name)
        if p.suffix != ".md":
            continue
        meta, body = note(data, name)
        require(meta["publish"] is True and meta["title"] not in seen, f"{name} 未开放或标题重复")
        seen.add(meta["title"])
        require(not set(meta) - {"title","created","updated","type","status","publish","tags","root_cause","description","category"},f"{name} 请移除内部审核字段或额外元数据")
        require("category" not in meta or isinstance(meta["category"], str) and re.fullmatch(r"[a-z0-9-]{1,40}", meta["category"]), f"{name} 分类标识无效")
        require(len(re.findall(r"^ *\x60{3}",body,re.M)) % 2 == 0,f"{name} 代码围栏未闭合")
        prose = re.sub(r"\x60{3}.*?\x60{3}|\x60[^\n\x60]*\x60","",body,flags=re.S)
        require(prose.count("$$") % 2 == 0 and len(re.findall(r"(?<!\\)\$",prose.replace("$$",""))) % 2 == 0,f"{name} 数学定界符未闭合")
        require(not re.search(r"<[a-z!/]|%%|^\s*\[[^\]]+\]:|!\[[^\]]*\]\[",prose,re.I|re.M),f"{name} 请使用直接 Markdown 链接并移除 HTML、注释或引用式嵌入")
        for target in re.findall(r"\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]",prose):
            key = PurePosixPath(target).name.removesuffix(".md").casefold()
            require(key in targets and ("/" not in target or targets[key] in (target,target+".md")),f"{name} 双链未在公开清单中解析")
        for embed, target in re.findall(r"(!?)\[[^\]\n]*\]\(([^)\n]+)\)",prose):
            url = urlsplit(unquote(target))
            if url.scheme:
                require(url.scheme == "https" and not embed and not url.username and not url.password,f"{name} 外部嵌入或协议不允许")
            elif url.path:
                dest = os.path.normpath(str(p.parent / url.path)).replace("\\","/")
                require(not url.netloc and dest in files,f"{name} 本地引用未审核或缺失")

def snapshot():
    manifest = json.loads(LOCK.read_text("utf-8"))
    files = {}
    require(CONTENT.is_dir() and CONTENT.resolve() == CONTENT.absolute(), "内容目录异常")
    for path in CONTENT.rglob("*"):
        require(path.resolve() == path.absolute(), "禁止目录链接")
        if path.is_file():
            name = path.relative_to(CONTENT).as_posix()
            data = regular(CONTENT,name).read_bytes()
            require(manifest.get(name) == digest(data),f"{name} 未列入清单或摘要已变更")
            files[name] = data
    require(set(files) == set(manifest),"清单文件缺失")
    validate(files)
    return files

if __name__ == "__main__":
    try:
        print(f"OK: {len(snapshot())} content files")
    except Exception as error:
        sys.exit(f"BLOCKED: {error}")


