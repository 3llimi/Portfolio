# Portfolio

Source of my personal portfolio — a single-page Next.js site exported as static files and deployed to GitHub Pages.

## Run it

```bash
cd myportfolio
npm install
npm run dev      # http://localhost:3000
npm run build    # static export into myportfolio/dist
npm run lint
```

To check the production build locally: `npm run build && npx serve dist`.

## Deploy

Every push to `main` runs `.github/workflows/nextjs.yml`, which builds `myportfolio` and publishes `myportfolio/dist` to GitHub Pages (repository → Settings → Pages → Source: GitHub Actions). The site is served under `/Portfolio`; `next.config.ts` sets that base path for production builds, so keep `repoName` there in sync with the repository name.

## Layout

```
myportfolio/
├── src/
│   ├── app/                  layout, the page, page-level styles, favicon
│   ├── components/
│   │   ├── livesey/          Doctor Livesey guide (controller, cel player, animations.json, dev preview)
│   │   ├── scroll/           Lenis smooth scrolling + custom scroll rail
│   │   ├── skills/           Skills & Technologies section
│   │   └── ui/               shared visual primitives (backdrop, cards, buttons, wave text)
│   ├── data/                 skills and where each one was used
│   ├── styles/               section styles shared by the page
│   └── types/
├── public/
│   ├── icons/  images/       site assets
│   └── livesey/              Livesey sprite atlases
```

## Development helpers

These only work in `npm run dev`:

- `?livesey-preview` opens a viewer for every Livesey clip, transition and release (1× / ¼× speed, frame stepping).
- `?livesey-speed=0.25` slows the live guide down.
