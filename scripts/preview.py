"""Serve only the static artifact on loopback, with Pages-style clean URLs."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
from functools import partial
root = Path(__file__).resolve().parents[1] / "public"

class Pages(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        original = super().translate_path(path)
        candidate = Path(original + ".html")
        return str(candidate) if not Path(original).exists() and candidate.is_file() else original

    def send_error(self, code, message=None, explain=None):
        if code == 404 and (root / "404.html").is_file():
            body = (root / "404.html").read_bytes()
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(body)
            return
        super().send_error(code, message, explain)
    def list_directory(self, path):
        self.send_error(404)
if __name__ == "__main__":
    print("Personal Tech Lab: http://127.0.0.1:8080", flush=True)
    ThreadingHTTPServer(("127.0.0.1", 8080), partial(Pages, directory=str(root))).serve_forever()

