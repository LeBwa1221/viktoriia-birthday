# Design Spec: Birthday SPA for Вікторія Беля

**Created:** 2026-06-21  
**Party date:** 2026-06-22 10:00 Kyiv (EEST, UTC+3)

---

## Goal

A funny, affectionate birthday single-page app in Ukrainian for Вікторія Беля (Strong Junior Software Engineer, Lviv, 3 years at company, turns 23). Hosted on GitHub Pages. Shared with the team on her party day; site is locked until the party moment and then reveals the celebration.

---

## Approach

- **Vanilla HTML/CSS/JS** — no build step, no bundler, no external runtime dependencies. Zero external network requests except optionally one `<img>` for her photo.
- **Config-driven:** `config.js` defines a single global `const CONFIG = {...}` with all editable content (times, copy, voucher lines, person data). Load order in `index.html`: `config.js` before `app.js`.
- **Deploy target:** GitHub Pages (static, branch `main` / root). `.nojekyll` file included to disable Jekyll processing.

---

## Two States

### Locked (now < CONFIG.unlockTime)

- Hero with big live countdown (Дні / Години / Хвилини / Секунди), ticking every second.
- Teaser headline + rotating joke messages cycling every few seconds.
- Voucher section hidden or shown as sealed.
- No party content visible.

### Unlocked (now >= CONFIG.unlockTime, OR `?preview=1` in URL)

- Full party layout: confetti + emoji rain, big birthday headline, her photo (if `CONFIG.person.showPhoto`), fun-facts roast section, voucher gate.
- `burstConfetti()` fires on unlock, on correct secret code, and on a manual "Висни!" button.

**Live transition:** when the countdown reaches zero while the page is open, it switches LOCKED→UNLOCKED without a reload and fires confetti.

**`?preview=1` override:** force-unlocks regardless of current time, for the page owner to test before publish.

---

## Time Handling

`CONFIG.unlockTime` is an ISO string with timezone offset (e.g. `"2026-06-22T10:00:00+03:00"`). Parsed with `new Date(CONFIG.unlockTime)`, compared against `new Date()`. No time logic is hardcoded outside `config.js`.

---

## Secret-Code Voucher Gate

Shown only in unlocked state. Prompts her to enter her birth date.

- **Correct value:** `CONFIG.secretCode` = `"15.06.2003"`.
- **Lenient normalization:** strip spaces; accept `.`, `/`, or `-` as separators — so `15.06.2003`, `15/06/2003`, `15-06-2003` all pass.
- **On correct:** reveal download buttons + success message + burst confetti.
- **On wrong:** playful Ukrainian error message, retry allowed.

---

## Vouchers — Canvas PNG Downloads

Two vouchers, each with its own Download button. Drawn on an offscreen `<canvas>` (1000×600 px), then downloaded via `canvas.toDataURL('image/png')` + temporary `<a download>`.

- Designed with rounded card, festive gradient background, readable fonts, emoji, title, body lines, footer.
- **No photo drawn on canvas** (S3 cross-origin would taint the canvas and break `toDataURL`). Photo is DOM-only.

| Voucher | Key | Contents |
|---------|-----|----------|
| Funny IOU | `CONFIG.vouchers.funny` | New cup (replacing the broken one), SUP trip or dinner for two, one bug-free day, unlimited birthday cake |
| Real gift | `CONFIG.vouchers.real` | **Placeholder** — owner fills `lines[]` with real gift details before publishing |

---

## Personalization Data

| Field | Value |
|-------|-------|
| Name (UA) | Вікторія Беля |
| Role | Strong Junior Software Engineer |
| City | Львів |
| Birth date | 2003-06-15 (turns 23) |
| Years at company | ~3 (hired 2023) |
| English | B2 (91/100) |
| Working hours | 10:00–19:00 |
| Running jokes | Still uses Skype; broke a coffee cup this year |
| Photo URL | S3 bucket (external, degrades gracefully on error) |

---

## File Layout

```
HB/
├── index.html       # Page shell; loads config.js then app.js
├── styles.css       # All styles
├── app.js           # All behavior
├── config.js        # All editable content (THE file to touch)
├── .nojekyll        # GitHub Pages: disables Jekyll
├── README.md        # Local test + deploy instructions (English)
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-06-21-birthday-spa-design.md  ← this file
```
