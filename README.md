# 🎂 release-v23.yml — Birthday SPA for Вікторія

A single-page, **no-build** birthday site (vanilla HTML/CSS/JS, zero dependencies) in
Ukrainian, themed as a **CI/CD "deploy console"** — her birthday is a *release to
production*. It stays **locked behind a live countdown** ("deploy ⏳ ETA") until
**2026-06-22 10:00 Kyiv time**, then runs a deploy animation and unlocks the party:
a `git log` of roast-y fun facts, a `CUP-404` issue (the broken cup 😅), and two
downloadable **artifact vouchers** gated by a secret code (her birth date).

## File map

| File | Purpose |
|------|---------|
| `index.html` | Markup (editor-window chrome + locked/unlocked sections) |
| `styles.css` | Dark deploy-console theme (Ukrainian yellow/blue accents, system mono) |
| `app.js` | Countdown, deploy animation, log streaming, auth gate, canvas vouchers, confetti |
| `config.js` | **All editable content** — copy, dates, voucher text, photo toggle |
| `.nojekyll` | Tells GitHub Pages not to run Jekyll |

## Run / test locally

From this folder, start any static server and open it in a browser (a server is better
than `file://` so canvas downloads behave):

```bash
npx serve            # → http://localhost:3000
# or
python -m http.server 8000   # → http://localhost:8000
```

- **Locked state (countdown):** open the site normally.
- **Preview the unlocked party now:** add `?preview=1` →
  `http://localhost:8000/?preview=1`, **or** set a past `unlockTime` in `config.js`
  (there's a commented example line right under the real value).
- **Test the live deploy flip:** set `CONFIG.unlockTime` ~2 minutes in the future and
  watch the countdown hit zero → deploy bar fills → party unlocks (no reload).

## Edit content

Everything lives in **`config.js`**:

- **Real gift details:** replace the placeholder strings in `vouchers.real.lines`.
- **Her photo:** toggle `person.showPhoto` (or change `person.photoUrl`).
- **Secret code:** `CONFIG.secretCode` (currently `15.06.2003`; the input accepts
  `.`, `/`, or `-` separators).
- **Jokes:** `copy.gitlog.commits`, `copy.issue`, `copy.locked.log`, etc.

## Real gift — encrypted bodo certificate 🔐

The real certificate (`Сертифікат bodo.pdf`, a SUP-for-two voucher) is **never deployed
in the clear**. It's AES-256-GCM encrypted into **`sertifikat.enc`** (ciphertext only),
which is the only version that goes public. The browser decrypts it client-side when the
correct **passphrase** is entered.

- The **birthday gate** unlocks the artifacts area (fun only — it's client-side, not real security).
- The **passphrase** decrypts the actual PDF. It is high-entropy and lives **nowhere in the
  repo** — give it to Виктоriia separately (printed on her card / told in person).
- Decryption uses the Web Crypto API, which only runs in a **secure context** — i.e. over
  `https://` (GitHub Pages) or `http://localhost`. It will **not** work from `file://`.

**Re-generate the encrypted file** (e.g. if the PDF changes) — this prints a fresh passphrase:

```bash
node tools/encrypt-cert.mjs
```

> 🔒 `.gitignore` already excludes the raw `*.pdf` and the `tools/` folder, so a normal
> `git add .` will **not** publish the plaintext certificate. Only `sertifikat.enc` ships.
> If you copy the folder around by hand, delete the raw PDF before deploying.

## Deploy to GitHub Pages

1. Create a new GitHub repo and push all files (the included `.nojekyll` disables Jekyll).
2. Repo **Settings → Pages** → Source: branch `main`, folder `/ (root)` → Save.
3. Wait ~1 min for the published URL, then share it.

> ⚠️ Before publishing, make sure `CONFIG.unlockTime` is set to the real
> `2026-06-22T10:00:00+03:00` (not a test value).
