"""Extract plain text from a PDF given as base64 on stdin. Prints text to stdout.

Run isolated (python3 -I): the input is an untrusted web download. Only the
first 80 pages are read; a manual's spec tables are near the front or back,
and the cap keeps a 600-page catalogue from stalling the run.
"""
import base64
import io
import sys

from pypdf import PdfReader

data = base64.b64decode(sys.stdin.read())
reader = PdfReader(io.BytesIO(data))
pages = list(reader.pages)
selected = pages[:60] + pages[-20:] if len(pages) > 80 else pages
out = []
for page in selected:
    try:
        out.append(page.extract_text() or "")
    except Exception:
        out.append("")
sys.stdout.write("\n".join(out))
