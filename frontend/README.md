# Frontend

React 19 + TypeScript + Vite, styled with Tailwind CSS v4 and the BoardUI
component source. See the repository root `README.md` for how to run the whole
stack.

## Commands

```bash
npm install
npm run dev       # http://localhost:5173, proxies /api to :8080
npm run build     # type-check, then build to dist/
npm run preview   # serve the built output
npm test          # 38 tests (vitest + jsdom)
npm run lint      # oxlint
```

## Environment

| Variable | Default | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | `/api` | Read at build time. `/api` is proxied by Vite in dev and nginx in the container. |
| `VITE_DEV_API_TARGET` | `http://localhost:8080` | Dev-server proxy target only. |

## Layout

```
components/       BoardUI component source (installed, not a dependency)
styles/
  theme.css       BoardUI tokens
  typography.css  the type scale
  app.css         product theme: pine accent, warm neutrals, font stacks
src/
  views/          ClassesView, MyApplicationsView, ManageView
  components/     IdentityGate, ClassCard, ApplicationCard, SeatBar, Freshness, Toolbar
  lib/            api client, polling hook, formatting, student id storage
  i18n/           English and Bangla copy, language provider
```

## Notes

- **No login.** The 17-digit registration number is the identity, sent as
  `X-Student-Id`, and stored in `localStorage` so it survives a refresh.
- **Polling, not sockets.** Seat counts are read every four seconds; a hold's
  own countdown is computed from `expiresAt` on the client, so it flips to
  `EXPIRED` the moment the timer ends rather than at the next poll.
- **Freshness is visible.** The header shows how long ago the last successful
  read happened. After two consecutive failures it switches to a readable
  "can't reach the server" state with a retry, which is how a stopped backend
  is surfaced without a blank page.
- **Both languages are real.** English and Bangla are separate dictionaries
  typed against one shape, so a missing key is a compile error.
