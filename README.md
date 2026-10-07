# ahmedhomrani.github.io

Personal portfolio of Ahmed Homrani, full stack Java developer in Tunis.
Live at https://ahmedhomrani.tn/ (custom domain via the `CNAME` file; DNS at OVH) in four languages:
[English](https://ahmedhomrani.tn/) ·
[Français](https://ahmedhomrani.tn/fr/) ·
[Español](https://ahmedhomrani.tn/es/) ·
[Português](https://ahmedhomrani.tn/pt/)

Each project is a planet. The hero shows them orbiting the sun, and scrolling flies you past each one.

## How it works

Static HTML, CSS and JavaScript. Each language is a real page (`/`, `/fr/`, `/es/`, `/pt/`) with all its text in the HTML, so search engines and AI crawlers index every language without running JavaScript.

The pages are generated from one template:

```
src/template.html     page structure (Jinja2)
src/i18n/en.json      English text   (also fr.json, es.json, pt.json)
src/build.py          project data that is not translated, JSON-LD, sitemap
```

## Edit content

1. Change the text in `src/i18n/<lang>.json` (do it in all four files).
2. Run the build:

   ```bash
   pip install jinja2
   python3 src/build.py
   ```

3. Commit the generated `index.html`, `fr/`, `es/`, `pt/` and `sitemap.xml`, then push.

Never edit the generated `index.html` files by hand: the next build overwrites them.

## Add a project (a new planet)

1. Add an entry to `PROJECTS` in `src/build.py`: `id`, `color`, `surface` (`ice`, `rock`, `pearl`, `gas`, `crater`, `storm`, `sand`), `ring`, `stack`, optional `img` and `links`. Add a line to `ORBITS` as well.
2. Add the same `id` under `projects.items` in all four JSON files.
3. Build. The script refuses to build if a language is missing a project.

## Other files

| Path | What it is |
| --- | --- |
| `assets/cv/` | CV PDFs, one per language. Each page links its own. |
| `robots.txt`, `sitemap.xml` | Crawl rules (AI crawlers explicitly allowed), sitemap with hreflang alternates. |
| `llms.txt`, `llms-full.txt` | Summary and full profile for AI assistants ([llmstxt.org](https://llmstxt.org)). |
| `assets/img/og-<lang>.png` | Share images per language. |
| `404.html` | Not-found page with links to all four languages. |
| `.nojekyll` | Serve files as-is (needed for `.well-known/`). |

## Deploy

Push to the default branch of `ahmedhomrani/ahmedhomrani.github.io`.
In **Settings > Pages**, Source is **Deploy from a branch**, folder `/ (root)`.

## After deploying

1. Google Search Console: add `https://ahmedhomrani.tn/`, submit `sitemap.xml`, then check **International targeting** reports no hreflang errors.
2. Bing Webmaster Tools: import from Search Console.
3. Put the portfolio URL in your LinkedIn and GitHub "Website" fields.

## Contact form and WhatsApp

- The form posts to [FormSubmit](https://formsubmit.co) (free, no backend). Messages arrive at `CONTACT_EMAIL` in `src/build.py`.
- First use: send one test message from the live site, then click **Activate** in the email FormSubmit sends you. Until then the form shows an error and suggests emailing directly.
- To hide your address from the page source, replace `CONTACT_EMAIL` with the random alias FormSubmit gives you after activation, then rebuild.
- WhatsApp: `WHATSAPP` in `src/build.py`. The pre-filled text is `contact.whatsapp_text` in each language file.
