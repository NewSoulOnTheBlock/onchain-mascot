# &lt;mascot&gt; — onchain digital pet (scaffold)

Static, zero-backend SPA. Vercel-ready. All references to a specific character are
left as `<MASCOT>` so you can drop in your own.

## Run locally

```
cd onchain-mascot
python -m http.server 5173
# open http://localhost:5173/
```

(or any static server — `npx serve`, `vercel dev`, etc.)

## Configure before launch

Edit `js/config.js`:

- `MASCOT.name` — display name
- `MASCOT.birthUtc` — fixed birth ISO date
- `MASCOT.lifespanYears` — default 10
- `MASCOT.wallet` — base58 mascot pubkey (receives action SOL)
- `MASCOT.tokenMint` — optional, for docs
- `RPC_URL` — replace public endpoint with Helius/QuickNode/etc.

## Assets to provide

- `assets/bgm.mp3` — original or licensed background loop. **Do not** ship
  copyrighted tracks (e.g. Pokémon OST). The HTML references this file but
  it is intentionally not included.
- (optional) replace the text sprite (`◉_◉`) in `index.html` with an `<img>`
  tag pointing at your own mascot art.

## Deploy

```
npx vercel
```

## What's in here

| File | Purpose |
|------|---------|
| `index.html` | arcade cabinet UI, stats, actions, clocks, trollbox, music |
| `docs.html` | docs page |
| `css/styles.css` | aurora-gradient mega clock, CRT scanlines, neon |
| `js/config.js` | all tunables |
| `js/clocks.js` | mega/human/mascot clocks (10× speed) |
| `js/wallet.js` | Phantom/Solflare connect + autoconnect |
| `js/actions.js` | feed/hug/play/talk → SOL transfer + memo (1×/wallet/UTC day) |
| `js/stats.js` | decay loop, floor 20, cap 100 |
| `js/rpc.js` | reads memos from mascot wallet → recomputes stat baseline |
| `js/cost.js` | day-indexed cost in SOL (CoinGecko) |
| `js/trollbox.js` | Gun.js P2P chat |
| `js/music.js` | bgm toggle, autoplay-on-first-click |

## Not yet implemented (v2)

Daily ritual cron worker (logs, self-portrait, IPFS, X post), sleep/dream,
reflection w/ personality traits, relationship tracker. See `plan.md` in
the session workspace.

## License / IP

Use only assets and music you own or have licensed. Don't impersonate
trademarked characters.
