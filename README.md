# bedrinth

The package index for LeviLamina, served at <https://pkg.levimc.org>.

It is a static [Next.js](https://nextjs.org) export of the
[lipr](https://github.com/LiteLDev/lipr) index:

- Every package page is prerendered at build time with the README of its
  latest version. Other variants and versions are loaded in the browser.
- Search, tag filters, sorting and pagination run in the browser over the
  index baked into the home page.

## Development

```bash
pnpm install
pnpm dev
```

`pnpm build` writes the site to `out/`.

## Deployment

`.github/workflows/build.yml` builds the site and deploys `out/` to GitHub
Pages on every push to `main`. It also rebuilds every hour, and on a
`lipr-updated` [repository dispatch](https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event),
so the site picks up new packages and versions.
