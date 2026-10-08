#!/usr/bin/env python3
"""Build the static, multilingual portfolio.

Usage:  python3 src/build.py
Needs:  pip install jinja2

Text lives in src/i18n/<lang>.json. Things that never get translated
(project ids, colors, stacks, links, images) live in PROJECTS below.
Output: /index.html (English, x-default), /fr/, /es/, /pt/ and sitemap.xml.
"""
import datetime
import json
import pathlib
from urllib.parse import quote

from jinja2 import Environment, FileSystemLoader, StrictUndefined

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
SITE = "https://ahmedhomrani.tn"
CONTACT_EMAIL = "contact.ahmedhomrani@gmail.com"   # where website messages arrive (FormSubmit)
WHATSAPP = "21699340980"                          # international format, no + or spaces
PHONE_DISPLAY = "+216 99 340 980"
LANG_ORDER = ["en", "fr", "es", "pt"]
TODAY = datetime.date.today().isoformat()

# Orbit radius (px), period (s), phase delay (s), static angle for reduced motion (deg)
ORBITS = [(70, 13, -3, 40), (102, 18, -11, 160), (134, 24, -6, 280), (166, 31, -22, 100),
          (198, 39, -30, 220), (230, 48, -9, 340), (262, 58, -47, 10), (294, 70, -15, 130)]

PROJECTS = [
    {"id": "smartdigidocs", "featured": True, "color": "#7fb2ff", "surface": "ice", "ring": True,
     "stack": ["Java", "OSGi", "Eclipse EMF", "Angular", "OAuth2", "SAML", "JWT", "LDAP", "Jenkins", "Azure DevOps", "Docker", "Maven"],
     "links": [{"href": "https://www.smartdigidocs.com/", "label": "visit_product"}],
     "schema": "SoftwareApplication", "url": "https://www.smartdigidocs.com/"},
    {"id": "erp", "featured": True, "color": "#e0683f", "surface": "rock", "ring": False,
     "stack": ["Java", "JEE", "Spring Boot", "Angular", "TypeScript", "PostgreSQL", "Oracle", "Docker", "Kubernetes", "GitLab CI/CD"],
     "links": [{"href": "https://www.apiz-erp.com/", "label": "visit_product"}],
     "schema": "SoftwareApplication", "url": "https://www.apiz-erp.com/"},
    {"id": "health", "featured": True, "color": "#f28cb1", "surface": "gas", "ring": False,
     "stack": ["Java", "Spring Boot", "Spring Security", "Spring Data JPA", "Angular", "Flutter", "Dart", "PostgreSQL", "Kafka"],
     "links": [{"href": "https://tabibi.tn/", "label": "visit_site"}],
     "schema": "WebApplication", "url": "https://tabibi.tn/"},
    {"id": "lei", "color": "#d3bf9f", "surface": "pearl", "ring": True,
     "stack": ["React", "Vite", "CSS", "GitHub Actions", "GitHub Pages"],
     "links": [{"href": "https://ahmedhomrani.tn/the-lei-studio/", "label": "visit_site"}],
     "schema": "WebSite", "url": "https://ahmedhomrani.tn/the-lei-studio/"},
    {"id": "smuppy", "color": "#2fd3a6", "surface": "gas", "ring": False,
     "stack": ["Flutter", "Dart", "Node.js"],
     "img": {"src": "smuppy.webp", "w": 1200, "h": 848},
     "links": [{"href": "https://www.smuppy.com/", "label": "visit_site"}],
     "schema": "MobileApplication", "url": "https://www.smuppy.com/"},
    {"id": "reservi", "color": "#a8774f", "surface": "crater", "ring": False,
     "stack": ["Angular", "Spring Boot", "Java"],
     "img": {"src": "reservi.webp", "w": 1200, "h": 538},
     "links": [{"href": "https://www.reservi.tn", "label": "visit_site"}],
     "schema": "WebApplication", "url": "https://www.reservi.tn"},
    {"id": "hr", "color": "#9a86ff", "surface": "storm", "ring": False,
     "stack": ["Angular", "Spring Boot", "Spring Security", "Java", "MySQL"],
     "img": {"src": "hr-management.webp", "w": 1200, "h": 603},
     "schema": "WebApplication"},
    {"id": "resaposte", "color": "#f4c430", "surface": "sand", "ring": False,
     "stack": ["Angular", "Spring Boot", "Java", "MySQL"],
     "img": {"src": "resaposte.webp", "w": 1200, "h": 572},
     "links": [{"href": "https://github.com/ahmedhomrani/ResaPoste", "label": "view_code"}],
     "schema": "WebApplication", "code": "https://github.com/ahmedhomrani/ResaPoste"},
]
for p, (r, t, d, a) in zip(PROJECTS, ORBITS):
    p.update(r=r, t=t, d=d, a=a)
    p.setdefault("img", None)
    p.setdefault("links", [])
    p.setdefault("featured", False)


def load_langs():
    langs = []
    for code in LANG_ORDER:
        data = json.loads((SRC / "i18n" / f"{code}.json").read_text(encoding="utf-8"))
        missing = [p["id"] for p in PROJECTS if p["id"] not in data["projects"]["items"]]
        if missing:
            raise SystemExit(f"{code}.json is missing projects: {missing}")
        langs.append(data)
    return langs


def jsonld(t):
    person = f"{SITE}/#person"
    page = f"{SITE}{t['path']}"
    items = []
    for i, p in enumerate(PROJECTS, 1):
        it = t["projects"]["items"][p["id"]]
        node = {"@type": p["schema"], "name": it["title"], "description": it["summary"],
                "url": p.get("url", f"{page}#{p['id']}"), "creator": {"@id": person},
                "keywords": ", ".join(p["stack"]), "inLanguage": t["html_lang"]}
        if p["schema"] in ("SoftwareApplication", "WebApplication", "MobileApplication"):
            node["applicationCategory"] = "BusinessApplication"
            node["operatingSystem"] = "Android, iOS" if p["schema"] == "MobileApplication" else "Web"
        if "code" in p:
            node["sameAs"] = p["code"]
        items.append({"@type": "ListItem", "position": i, "item": node})
    graph = {
        "@context": "https://schema.org",
        "@graph": [
            {"@type": "WebSite", "@id": f"{SITE}/#website", "url": f"{SITE}/", "name": "Ahmed Homrani",
             "inLanguage": [l for l in ("en", "fr", "es", "pt-BR")], "publisher": {"@id": person}},
            {"@type": "ProfilePage", "@id": f"{page}#profile", "url": page, "name": t["meta"]["title"],
             "description": t["meta"]["description"], "inLanguage": t["html_lang"],
             "isPartOf": {"@id": f"{SITE}/#website"}, "mainEntity": {"@id": person}, "dateModified": TODAY},
            {"@type": "Person", "@id": person, "name": "Ahmed Homrani", "givenName": "Ahmed", "familyName": "Homrani",
             "url": f"{SITE}/", "image": f"{SITE}/assets/img/ahmed-homrani.webp",
             "email": f"mailto:{CONTACT_EMAIL}", "telephone": PHONE_DISPLAY.replace(" ", ""),
             "jobTitle": [t["schema"]["job_title"], t["schema"]["occupation"]],
             "hasOccupation": {"@type": "Occupation", "name": t["schema"]["occupation"],
                               "occupationLocation": {"@type": "Country", "name": "Tunisia"},
                               "skills": "Java, Spring Boot, Angular, OSGi, PEPPOL, OAuth2, PostgreSQL, Docker, Kubernetes, Flutter"},
             "contactPoint": {"@type": "ContactPoint", "contactType": "professional inquiries", "email": CONTACT_EMAIL,
                              "telephone": PHONE_DISPLAY.replace(" ", ""), "availableLanguage": ["ar", "fr", "en"],
                              "url": f"https://wa.me/{WHATSAPP}"},
             "worksFor": {"@type": "Organization", "name": "Audaxis", "url": "https://www.apiz-erp.com/"},
             "memberOf": {"@type": "Organization", "name": "Organisation Nationale Tunisienne des Jeunes (ONTJ)",
                          "url": "https://jamaity.org/association/organisation-national-tunisienne-des-jeunes/"},
             "alumniOf": [
                 {"@type": "CollegeOrUniversity", "name": "ISI, University of Tunis El Manar"},
                 {"@type": "CollegeOrUniversity", "name": "ISTIC, University of Carthage"}],
             "hasCredential": [
                 {"@type": "EducationalOccupationalCredential", "credentialCategory": "degree",
                  "name": t["schema"]["master"]},
                 {"@type": "EducationalOccupationalCredential", "credentialCategory": "degree",
                  "name": t["schema"]["bachelor"]},
                 {"@type": "EducationalOccupationalCredential", "credentialCategory": "certificate",
                  "name": "IELTS Academic C1"}],
             "address": {"@type": "PostalAddress", "addressLocality": "Tunis", "addressCountry": "TN"},
             "knowsLanguage": ["ar", "en", "fr"],
             "knowsAbout": ["Java", "Spring Boot", "Spring Security", "Angular", "TypeScript", "OSGi", "PEPPOL",
                            "EN 16931", "SEPA", "OAuth2", "SAML", "JWT", "PostgreSQL", "Oracle", "Kafka",
                            "Docker", "Kubernetes", "GitLab CI/CD", "Jenkins", "Azure DevOps", "Flutter", "DevSecOps"],
             "sameAs": ["https://github.com/ahmedhomrani", "https://www.linkedin.com/in/ahmed-homrani"]},
            {"@type": "ItemList", "@id": f"{page}#projects", "name": t["projects"]["head"], "itemListElement": items},
        ],
    }
    return json.dumps(graph, ensure_ascii=False, indent=2)


def sitemap(langs):
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
             '        xmlns:xhtml="http://www.w3.org/1999/xhtml"',
             '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">']
    imgs = ["ahmed-homrani.webp"]
    for t in langs:
        lines.append("  <url>")
        lines.append(f"    <loc>{SITE}{t['path']}</loc>")
        lines.append(f"    <lastmod>{TODAY}</lastmod>")
        for l in langs:
            lines.append(f'    <xhtml:link rel="alternate" hreflang="{l["hreflang"]}" href="{SITE}{l["path"]}"/>')
        lines.append(f'    <xhtml:link rel="alternate" hreflang="x-default" href="{SITE}/"/>')
        for im in imgs:
            lines.append(f"    <image:image><image:loc>{SITE}/assets/img/{im}</image:loc></image:image>")
        lines.append("  </url>")
    lines += ["  <url>", f"    <loc>{SITE}/the-lei-studio/</loc>", f"    <lastmod>{TODAY}</lastmod>", "  </url>",
              "</urlset>", ""]
    (ROOT / "sitemap.xml").write_text("\n".join(lines), encoding="utf-8")


def main():
    langs = load_langs()
    env = Environment(loader=FileSystemLoader(SRC), autoescape=True, undefined=StrictUndefined,
                      trim_blocks=False, lstrip_blocks=False)
    tpl = env.get_template("template.html")
    suggest = {l["lang"]: {"text": l["ui"]["suggest"], "go": l["ui"]["suggest_go"], "path": l["path"]} for l in langs}
    version = TODAY.replace("-", "")
    for t in langs:
        wa_text = t["contact"]["whatsapp_text"].replace("{site}", SITE.replace("https://", "") + t["path"].rstrip("/"))
        html = tpl.render(t=t, langs=langs, projects=PROJECTS, site=SITE, jsonld=jsonld(t), year=TODAY[:4],
                          contact_email=CONTACT_EMAIL, whatsapp=WHATSAPP, phone=PHONE_DISPLAY,
                          wa_href=f"https://wa.me/{WHATSAPP}?text={quote(wa_text)}",
                          version=version, suggest_json=json.dumps(suggest, ensure_ascii=False).replace("</", "<\\/"))
        out = ROOT / t["path"].strip("/") / "index.html" if t["path"] != "/" else ROOT / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(html, encoding="utf-8")
        print("wrote", out.relative_to(ROOT))
    sitemap(langs)
    print("wrote sitemap.xml")


if __name__ == "__main__":
    main()
