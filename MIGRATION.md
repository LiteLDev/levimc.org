# The project docs moved from docs.levimc.org to levimc.org (2026-11-15)

`https://docs.levimc.org/<Project>/…` is now `https://levimc.org/<Project>/…`. The pages, their paths and their
repositories stayed as they were.

## How it works

GitHub Pages serves a project repository's site (LeviLamina, LegacyScriptEngine, lip, LeviLauncher, BeDD, bedboo)
at `/<Repo>/` below the **organisation site's** custom domain. The organisation site used to be
LiteLDev/liteldev.github.io with the domain docs.levimc.org, and levimc.org was a project site with a domain of its
own. Now this repository *is* the organisation site (renamed from `levimc.org` to `liteldev.github.io`) with the
domain levimc.org, so every project site appears at `levimc.org/<Repo>/` without any change to how it is built.

This repository took over what the old organisation site did: `legacy/` publishes the redirect pages of the retired
docs sites (`/LeviLaunchroid/`, `/preloader-android/`, `/LiteXLoader/`), and `404.html` forwards other forms of
those URLs and wrongly cased project paths (`/levilamina/` → `/LeviLamina/`).

**docs.levimc.org** is proxied by Cloudflare, and a Cloudflare redirect rule answers every request with a **308** to
the same path and query on levimc.org (`https://docs.levimc.org/LeviLamina/x/?q=1` →
`https://levimc.org/LeviLamina/x/?q=1`). Nothing on GitHub serves docs.levimc.org any more: keep the record proxied
and the rule on, or docs.levimc.org answers with GitHub's 404.

Things to know:

* **Project paths win.** A repository with Pages owns `/<repo name>/` on levimc.org. No route of this site may start
  with a repository's name, and no repository named like a route (`blog`, `mods`, `api`, `kit`, `about`, …) may
  turn Pages on. LiteLoader.NET and liteloaderbds-documentation have Pages on and appear at
  `levimc.org/LiteLoader.NET/` and `levimc.org/liteloaderbds-documentation/`.
* **Same origin.** Docs and levimc.org share cookies and localStorage. levimc.org's router leaves the docs paths
  alone (`isAppPath`, `src/components/SiteHeader.tsx`).
* Each project repository points its canonical URLs, sitemap and `linkcheck --site-origin` at `https://levimc.org`.

## What was done

1. Opened a PR in each project repository that changes `https://docs.levimc.org` to `https://levimc.org`:
   `hostname` / `sitemap.hostname` in `docs.config.ts`, `linkcheck --site-origin`, the hourly kit check, and links
   in the docs, READMEs and code.
2. Removed the domain levimc.org from LiteLDev/levimc.org's Pages and docs.levimc.org from LiteLDev/liteldev.github.io's.
3. Renamed LiteLDev/liteldev.github.io → LiteLDev/docs.levimc.org, and LiteLDev/levimc.org → LiteLDev/liteldev.github.io.
4. Set the domain levimc.org on LiteLDev/liteldev.github.io and merged LiteLDev/levimc.org#99 (this change). After the
   certificate was issued, turned on *Enforce HTTPS*.
5. Set the domain docs.levimc.org on LiteLDev/docs.levimc.org and deployed its forwarding page; docs.levimc.org
   was put behind Cloudflare with a 308 redirect rule.
6. Merged the project PRs (the docs rebuild with their new canonical URLs).
7. Deleted LiteLDev/docs.levimc.org (the old organisation repository; its legacy redirects live on in `legacy/`).

## Checks

```sh
for p in "" LeviLamina/ LeviLamina/api/ LegacyScriptEngine/ lip/ LeviLauncher/ BeDD/ bedboo/ mods/ blog/; do
  curl -s -o /dev/null -w "%{http_code} https://levimc.org/$p\n" "https://levimc.org/$p"
done
curl -s https://levimc.org/LeviLaunchroid/api/hook | grep -o 'rel="canonical" href="[^"]*"'
node legacy/build.test.mjs --live   # every legacy redirect target answers 200 without a redirect
curl -sI -A "Mozilla/5.0" "https://docs.levimc.org/LeviLamina/?q=1" | grep -i -E '^(HTTP|location)'   # 308, same path
```

Then, in Google Search Console, submit the docs sitemaps (`https://levimc.org/<Project>/sitemap.xml`; `robots.txt`
lists them too), and use *Change of Address* from the docs.levimc.org property to levimc.org (the Cloudflare rule
answers with permanent redirects).

## Rolling back

1. Turn off the Cloudflare rule and switch the `docs` record back to DNS only.
2. Remove the domain from LiteLDev/liteldev.github.io's Pages, rename the repository back to `levimc.org`, and give
   it the domain levimc.org again.
3. Create a new organisation site, LiteLDev/liteldev.github.io, with the domain docs.levimc.org. It serves the
   project docs at docs.levimc.org/<Project>/ again; publish `legacy/` from it for the old redirects.
4. Revert LiteLDev/levimc.org#99 and the project PRs.
