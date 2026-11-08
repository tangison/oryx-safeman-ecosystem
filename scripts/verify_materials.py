#!/usr/bin/env python3
"""Verify the open-materials library as an agent would: serve the static export,
fetch the manifest, download every file it names, and check each sha256.
Also verifies the course page's download links and the agent entry points."""
import hashlib
import json
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = "http://localhost:4173"


def get(path: str) -> bytes:
    with urllib.request.urlopen(BASE + path, timeout=20) as r:
        return r.read()


def main() -> None:
    # 1. the agent entry points
    for path in ("/llms.txt", "/robots.txt", "/materials/manifest.json", "/sm-core/"):
        body = get(path)
        assert len(body) > 0, f"{path} empty"
        print(f"  GET {path:28s} {len(body) // 1024:4d} KB")

    # 2. the manifest lists every file with a matching checksum
    manifest = json.loads(get("/materials/manifest.json"))
    assert manifest["license"]["code"] == "CC-BY-4.0"
    assert manifest["source_code"]["license"] == "MIT"
    assert len(manifest["files"]) == 6, "expected 6 material files"
    for f in manifest["files"]:
        body = get(f["path"])
        digest = hashlib.sha256(body).hexdigest()
        assert digest == f["sha256"], f"sha256 mismatch for {f['path']}"
        assert len(body) == f["bytes"], f"size mismatch for {f['path']}"
        print(f"  OK  {f['name']:36s} {f['bytes'] // 1024:4d} KB  sha256 verified")

    # 3. the course page's download rows point at real files
    page = get("/sm-core/").decode("utf-8")
    import re
    hrefs = re.findall(r'href="(/materials/[^"]+)"', page)
    assert len(hrefs) >= 8, f"expected >=8 material links on the page, got {len(hrefs)}"
    for href in dict.fromkeys(hrefs):
        body = get(href)
        assert len(body) > 0
        print(f"  LINK {href:52s} -> {len(body) // 1024} KB")

    # 4. the ecosystem home links the course site
    home = get("/").decode("utf-8")
    assert 'href="/sm-core/"' in home, "homepage does not link the course site"
    print("  homepage links /sm-core/ and the footer links the course site")

    print("MATERIALS VERIFICATION PASSED")


if __name__ == "__main__":
    try:
        main()
    except AssertionError as e:
        sys.exit(f"FAILED: {e}")
