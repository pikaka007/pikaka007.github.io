"""Check local HTML links, page fragments and static resources after rendering."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, unquote
import json
from check import SITE, require, snapshot

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.links = set(), []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        require(attrs.get("data-mml-node") != "merror" and tag != "mjx-merror", "公式渲染器报告语法错误")
        if "id" in attrs:
            self.ids.add(attrs["id"])
        for key in ("src","href"):
            if attrs.get(key):
                self.links.append(attrs[key])

def verify():
    root = SITE/"public"
    pages = {}
    for p in root.rglob("*.html"):
        links = Links()
        links.feed(p.read_text("utf-8"))
        pages[p] = links
    for page, links in pages.items():
        for ref in links.links:
            base = "https://local.invalid/"+page.relative_to(root).as_posix()
            url = urlsplit(urljoin(base,ref))
            if url.hostname != "local.invalid":
                continue
            path = root/unquote(url.path.lstrip("/"))
            if path.is_dir():
                path = path/"index.html"
            elif not path.is_file():
                path = Path(str(path)+".html")
            require(path.is_file(),f"{page.name} 缺少目标 {ref}")
            if url.fragment and path in pages:
                require(unquote(url.fragment) in pages[path].ids, f"{page.name} 锚点不存在 {ref}")
    files = snapshot()
    index = json.loads((root/"static/contentIndex.json").read_text("utf-8"))
    require(set(index) == {n[:-3] for n in files if n.endswith(".md")},"搜索索引范围异常")
    print(f"Verified local links, anchors and assets across {len(pages)} rendered pages")
if __name__ == "__main__":
    verify()
