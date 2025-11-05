#!/usr/bin/env python3
import json, os, pathlib, html

ROOT = pathlib.Path(__file__).parent.resolve()
TEMPLATE = ROOT / "templates" / "project.html"
PROJECTS_JSON = ROOT / "projects.json"
OUT_ROOT = ROOT / "projects"

# Change to your real domain when you deploy:
BASE_URL = "http://localhost:5173"  # or "https://your-domain.com"

def read_file(p: pathlib.Path) -> str:
    return p.read_text(encoding="utf-8")

def write_file(p: pathlib.Path, content: str):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")

def esc(s: str) -> str:
    # minimal HTML escape for safety in text nodes
    return html.escape(s or "")

def generated_thumb(title: str) -> str:
    # Simple deterministic gradient SVG as data URI
    hue = sum(ord(c) for c in title) % 360
    svg = f"""
    <svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675'>
      <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='hsl({hue},70%,55%)'/>
        <stop offset='100%' stop-color='hsl({(hue+70)%360},70%,55%)'/>
      </linearGradient></defs>
      <rect width='100%' height='100%' fill='url(#g)'/>
      <text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle'
        fill='rgba(0,0,0,.3)' font-family='Inter,Arial' font-size='86' font-weight='800'>
        {esc(title)}
      </text>
    </svg>
    """.strip()
    from urllib.parse import quote
    return "data:image/svg+xml," + quote(svg)

def chips(tags) -> str:
    tags = tags or []
    return "".join(f"<span class='tag'>{esc(t)}</span>" for t in tags)

def links_html(p: dict) -> str:
    parts = []
    if p.get("demo"):
        parts.append(f"<a class='btn' href='{p['demo']}' target='_blank' rel='noopener'>↗ Demo</a>")
    if p.get("repo"):
        parts.append(f"<a class='btn' href='{p['repo']}' target='_blank' rel='noopener'></> Code</a>")
    return " ".join(parts)

def to_keywords(p: dict) -> str:
    arr = (p.get("tags") or []) + (p.get("tech") or [])
    return ", ".join(arr)

def render_template(tpl: str, p: dict) -> str:
    # Merge tags + tech for chip row
    tags = (p.get("tags") or []) + (p.get("tech") or [])
    image = p.get("image") or generated_thumb(p.get("title",""))
    slug = p.get("slug")
    canonical = f"{BASE_URL}/projects/{slug}/"

    out = tpl
    replacements = {
        "{{title}}": esc(p.get("title","")),
        "{{description}}": esc(p.get("description","")),
        "{{image}}": image,
        "{{tagsHtml}}": chips(tags),
        "{{linksHtml}}": links_html(p),
        "{{canonical}}": canonical,
        "{{date}}": esc(p.get("date","")),
        "{{keywords}}": esc(to_keywords(p))
    }
    for k, v in replacements.items():
        out = out.replace(k, v)
    return out

def main():
    if not TEMPLATE.exists():
        raise SystemExit(f"❌ Template not found: {TEMPLATE}")
    if not PROJECTS_JSON.exists():
        raise SystemExit(f"❌ projects.json not found: {PROJECTS_JSON}")

    tpl = read_file(TEMPLATE)
    projects = json.loads(read_file(PROJECTS_JSON))

    OUT_ROOT.mkdir(parents=True, exist_ok=True)

    count = 0
    for p in projects:
        slug = p.get("slug")
        title = p.get("title","(untitled)")
        if not slug:
            print(f"⚠️  Skipping (missing slug): {title}")
            continue
        out_dir = OUT_ROOT / slug
        out_file = out_dir / "index.html"
        html_out = render_template(tpl, p)
        write_file(out_file, html_out)
        count += 1
        print(f"✅ {slug}/index.html")

    # Optional sitemap
    urls = [f"{BASE_URL}/"] + [f"{BASE_URL}/projects/{p['slug']}/" for p in projects if p.get('slug')]
    sitemap = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" \
              "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n" + \
              "\n".join(f"  <url><loc>{u}</loc></url>" for u in urls) + \
              "\n</urlset>\n"
    write_file(ROOT / "sitemap.xml", sitemap)

    print(f"\nDone. Generated {count} page(s).")

if __name__ == "__main__":
    main()
