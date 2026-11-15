# Moving the project docs from docs.levimc.org to levimc.org

`https://docs.levimc.org/<Project>/…` becomes `https://levimc.org/<Project>/…`, and docs.levimc.org answers every
request with a 301 to the same path on levimc.org. The pages, their paths and their repositories stay as they are.

## How it works

GitHub Pages serves a project repository's site (LeviLamina, LegacyScriptEngine, lip, LeviLauncher, BeDD, bedboo)
at `/<Repo>/` below the **organisation site's** custom domain. Today the organisation site is
LiteLDev/liteldev.github.io with the domain docs.levimc.org, and levimc.org is a project site with a domain of
its own. After the move, this repository *is* the organisation site (renamed to `liteldev.github.io`), with the
domain levimc.org, so every project site appears at `levimc.org/<Repo>/` with no change to its build.

This repository already does what liteldev.github.io did: `legacy/` publishes the redirect pages of the retired
docs sites (`/LeviLaunchroid/`, `/preloader-android/`, `/LiteXLoader/`), and `404.html` forwards other forms of
those URLs and wrongly cased project paths (`/levilamina/` → `/LeviLamina/`).

Things to know:

* **Project paths win.** A repository with Pages owns `/<repo name>/` on levimc.org. No route of this site may start
  with a repository's name, and no repository named like a route (`blog`, `mods`, `api`, `kit`, `about`, …) may
  turn Pages on. LiteLoader.NET and liteloaderbds-documentation have Pages on and will appear at
  `levimc.org/LiteLoader.NET/` and `levimc.org/liteloaderbds-documentation/`; turn their Pages off if that is not
  wanted. lipr.levimc.org has a domain of its own and is not affected.
* **The links in this branch point at levimc.org/<Project>/**, which answers only after the switch: merge it during
  the switch (step 5), not before.
* **Same origin.** Docs and levimc.org now share cookies and localStorage (they already shared the `levimc_*`
  preference cookies). levimc.org's router leaves the docs paths alone (`isAppPath`, `src/components/SiteHeader.tsx`).

## Before the day

1. In the organisation's settings (Pages → Verified domains), make sure **levimc.org is verified**, so no other
   account can claim it while it is unassigned during the switch.
2. In each project repository, open (do not merge) a PR that moves its own references to the new origin:

   | Repository | Files | Change |
   | --- | --- | --- |
   | LeviLamina | `docs/main/docs.config.ts`, `docs/main/package.json`, `.github/workflows/build-docs.yml` | `hostname` and `sitemap.hostname` → `'https://levimc.org'`; the nav entry `'https://docs.levimc.org/LeviLamina/api/'` → `'https://levimc.org/LeviLamina/api/'`; `linkcheck --site-origin https://levimc.org`; the hourly kit check's `curl https://levimc.org/LeviLamina/` |
   | LegacyScriptEngine | `docs.config.ts`, `package.json`, `.github/workflows/build_docs.yml` | same |
   | lip | `docs/docs.config.ts`, `docs/package.json` | same |
   | LeviLauncher | `docs/docs.config.ts`, `docs/package.json`, `.github/workflows/docs.yml` | same |
   | BeDD | `docs/docs.config.ts`, `docs/package.json`, `.github/workflows/docs.yml` | same |
   | bedboo | `docs/docs.config.ts`, `docs/package.json`, `.github/workflows/docs.yml` | same |

   Links in their markdown, READMEs, installers (`*.wxs`) and app code (LeviLauncher's `LIPPage.tsx`, bedboo's
   client) keep working through the 301; update them in the same PRs or later.
3. In Cloudflare (levimc.org zone), prepare a **Redirect Rule** (Rules → Redirect Rules), saved but not deployed:
   * When: Hostname equals `docs.levimc.org`
   * Then: Dynamic redirect, expression `concat("https://levimc.org", http.request.uri.path)`, status **301**,
     preserve query string.
4. Pick a quiet hour and do steps 1–6 below back to back: levimc.org is down from step 1 until GitHub has issued
   the certificate (step 4, usually minutes), the docs from step 2 until step 6.

## On the day

1. **Free levimc.org.** LiteLDev/levimc.org → Settings → Pages → Custom domain: remove `levimc.org`.
2. **Retire the old organisation site.** LiteLDev/liteldev.github.io → Settings → Pages: remove the custom domain
   `docs.levimc.org` and unpublish; then rename the repository (e.g. `docs-root-retired`) and archive it. Its
   content lives on in this repository's `legacy/`.
3. **Make this repository the organisation site.** Rename LiteLDev/levimc.org → `liteldev.github.io`
   (github.com/LiteLDev/levimc.org and git remotes redirect; update local remotes when convenient).
4. **Give it the domain.** Settings → Pages: Source *GitHub Actions*; Custom domain `levimc.org`; wait for the DNS
   check and the certificate, then tick *Enforce HTTPS*. The DNS records stay as they are (apex A/AAAA records to
   GitHub Pages, DNS only).
5. **Deploy.** Merge this branch's PR into `main`: the deploy builds levimc.org with the legacy redirects and the
   new links, and the `sync` job rebuilds the docs sites.
6. **Redirect the old domain.** Cloudflare → DNS: switch the `docs` record to *Proxied*; deploy the redirect rule
   from "Before the day".
7. **Point the docs at their new home.** Merge the project PRs (canonical URLs, sitemaps, `og:url`, hreflang).

## Checks

```sh
# levimc.org and every project's docs answer 200 at their new address
for p in "" LeviLamina/ LeviLamina/api/ LegacyScriptEngine/ lip/ LeviLauncher/ BeDD/ bedboo/ mods/ blog/; do
  curl -s -o /dev/null -w "%{http_code} https://levimc.org/$p\n" "https://levimc.org/$p"
done
# the old domain: one 301 to the same path and query
curl -sI "https://docs.levimc.org/LeviLamina/user_guides/install/?x=1" | grep -i -E '^(HTTP|location)'
# the legacy redirects and the 404 forwarding (in a browser: /levilamina/ lands on /LeviLamina/)
curl -s https://levimc.org/LeviLaunchroid/api/hook | grep -o 'rel="canonical" href="[^"]*"'
node legacy/build.test.mjs --live   # every legacy redirect target answers 200 without a redirect
# the old organisation URL
curl -sI https://liteldev.github.io/LeviLamina/ | grep -i -E '^(HTTP|location)'
```

Then in Google Search Console: add the levimc.org property if it is missing, submit the docs sitemaps
(`https://levimc.org/<Project>/sitemap.xml`, also listed in `robots.txt`), and use *Change of Address* from the
docs.levimc.org property to levimc.org.

## Rolling back

Delete the Cloudflare rule and switch `docs` back to DNS only; remove the domain from this repository's Pages;
rename it back to `levimc.org` and set its domain `levimc.org` again; rename the old repository back to
`liteldev.github.io`, set its domain `docs.levimc.org` and re-run its deploy; revert this PR.
