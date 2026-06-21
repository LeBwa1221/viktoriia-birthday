/*
  app.js — логіка «деплой-консолі»: пайплайн, відлік, деплой-анімація,
  git log, секретний код (auth), ваучери-артефакти, конфеті.
  Читає глобальний CONFIG з config.js. Без зовнішніх залежностей.
*/
(function () {
  "use strict";

  const C = window.CONFIG;
  const $ = (sel) => document.querySelector(sel);
  const params = new URLSearchParams(location.search);
  const forcePreview = params.get("preview") === "1";
  const unlockDate = new Date(C.unlockTime);
  const reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function isUnlocked() {
    return forcePreview || Date.now() >= unlockDate.getTime();
  }

  // ---------- конфеті (емодзі-дощ) ----------
  const confettiCanvas = $("#confetti");
  const cctx = confettiCanvas.getContext("2d");
  let pieces = [];
  const EMOJIS = ["🎉", "🎈", "🥳", "🎂", "☕", "🚀", "✨", "🐛", "🎁"];

  function resizeConfetti() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resizeConfetti);
  resizeConfetti();

  function burstConfetti(amount) {
    amount = amount || 80;
    for (let i = 0; i < amount; i++) {
      pieces.push({
        x: Math.random() * confettiCanvas.width,
        y: -20 - Math.random() * confettiCanvas.height * 0.3,
        vx: (Math.random() - 0.5) * 2,
        vy: 2 + Math.random() * 4,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.2,
        emoji: EMOJIS[(Math.random() * EMOJIS.length) | 0],
        size: 18 + Math.random() * 18,
      });
    }
  }
  function tickConfetti() {
    cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    pieces = pieces.filter((p) => p.y < confettiCanvas.height + 40);
    for (const p of pieces) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.03;
      p.rot += p.vr;
      cctx.save();
      cctx.translate(p.x, p.y);
      cctx.rotate(p.rot);
      cctx.font = p.size + "px serif";
      cctx.textAlign = "center";
      cctx.fillText(p.emoji, 0, 0);
      cctx.restore();
    }
    requestAnimationFrame(tickConfetti);
  }
  tickConfetti();

  // ---------- відлік ----------
  function pad(n) {
    return String(n).padStart(2, "0");
  }
  function updateCountdown() {
    const diff = unlockDate.getTime() - Date.now();
    if (diff <= 0) {
      goLive(true);
      return;
    }
    const s = Math.floor(diff / 1000);
    $("#cd-days").textContent = pad(Math.floor(s / 86400));
    $("#cd-hours").textContent = pad(Math.floor((s % 86400) / 3600));
    $("#cd-minutes").textContent = pad(Math.floor((s % 3600) / 60));
    $("#cd-seconds").textContent = pad(s % 60);
  }

  // ---------- стрімінг логу ----------
  function streamLog() {
    const box = $("#log");
    const lines = C.copy.locked.log;
    lines.forEach((text, i) => {
      const div = document.createElement("div");
      div.className = "log-line";
      div.textContent = text;
      box.appendChild(div);
      if (reduceMotion) {
        div.classList.add("show");
      } else {
        setTimeout(() => div.classList.add("show"), 400 + i * 700);
      }
    });
    const cursor = document.createElement("span");
    cursor.className = "cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.textContent = "█";
    box.appendChild(cursor);
  }

  // ---------- перехід у «прод» ----------
  let countdownTimer = null;
  let live = false;
  function finishDeploy() {
    $("#deploying").hidden = true;
    $("#locked").hidden = true;
    $("#unlocked").hidden = false;
    $("#filename").textContent = C.copy.window.unlockedFile;
    const pill = $("#status-pill");
    pill.textContent = "✅ DEPLOYED";
    pill.hidden = false;
    $("#deploy-success").textContent = C.copy.deploy.done;
    if (!reduceMotion) burstConfetti(160);
  }
  function goLive(animate) {
    if (live) return;
    live = true;
    if (countdownTimer) clearInterval(countdownTimer);

    if (animate && !reduceMotion) {
      $("#locked").hidden = true;
      $("#deploying").hidden = false;
      $("#deploy-msg").textContent = C.copy.deploy.running;
      const bar = $("#deploy-bar");
      // форсуємо reflow, далі CSS-transition тягне ширину до 100%
      void bar.offsetWidth;
      bar.style.width = "100%";
      setTimeout(finishDeploy, 1850);
    } else {
      finishDeploy();
    }
  }

  // ---------- секретний код (auth) ----------
  function normalize(s) {
    return (s || "").replace(/\s+/g, "").replace(/[/\-]/g, ".");
  }
  function checkCode() {
    const val = normalize($("#code-input").value);
    const target = normalize(C.secretCode);
    const msg = $("#gate-msg");
    if (val === target) {
      msg.textContent = C.copy.voucher.right;
      msg.className = "gate-msg ok";
      $("#downloads").hidden = false;
      $("#gate-form").hidden = true;
      burstConfetti(120);
    } else {
      msg.textContent = C.copy.voucher.wrong;
      msg.className = "gate-msg err";
    }
  }

  // ---------- ваучери → PNG (canvas, темна тема) ----------
  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
  function drawVoucher(v) {
    const W = 1000;
    const H = 600;
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const c = cv.getContext("2d");

    // тло
    const g = c.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#15203A");
    g.addColorStop(1, "#0E1726");
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);

    // акцентна пунктирна рамка
    c.strokeStyle = v.accent;
    c.lineWidth = 4;
    c.setLineDash([14, 10]);
    roundRect(c, 48, 48, W - 96, H - 96, 18);
    c.stroke();
    c.setLineDash([]);

    c.textAlign = "center";

    // заголовок
    c.fillStyle = v.accent;
    c.font = "bold 46px 'Cascadia Code', Consolas, ui-monospace, monospace";
    c.fillText(v.title, W / 2, 150);

    // рядки
    c.fillStyle = "#E8EDF7";
    c.font = "26px 'Cascadia Code', Consolas, ui-monospace, monospace";
    let y = 232;
    for (const line of v.lines) {
      c.fillText(line, W / 2, y);
      y += 52;
    }

    // підпис
    c.fillStyle = "#7C8BA8";
    c.font = "20px 'Cascadia Code', Consolas, ui-monospace, monospace";
    c.fillText(v.footer, W / 2, H - 78);

    return cv.toDataURL("image/png");
  }
  function download(dataUrl, filename) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // ---------- розшифрування справжнього сертифіката (WebCrypto) ----------
  function b64ToBytes(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  async function decryptCert(passphrase) {
    const cfg = C.copy.voucher.cert;
    const res = await fetch(cfg.file, { cache: "no-store" });
    if (!res.ok) throw new Error("fetch failed");
    const data = await res.json();
    const baseKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(passphrase),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    const key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: b64ToBytes(data.salt), iterations: data.iter, hash: data.hash },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: b64ToBytes(data.iv) },
      key,
      b64ToBytes(data.ct)
    );
    return new Blob([pt], { type: "application/pdf" });
  }

  // ---------- побудова списків ----------
  function buildStages() {
    const ul = $("#stages");
    for (const s of C.copy.locked.stages) {
      const li = document.createElement("li");
      if (s.status === "pending") li.classList.add("pending");
      const icon = s.status === "ok" ? "✅" : "⏳";
      const arrow = document.createElement("span");
      arrow.className = "st-arrow";
      arrow.textContent = "▸";
      const label = document.createElement("span");
      label.className = "st-label";
      label.textContent = s.label;
      const ic = document.createElement("span");
      ic.className = "st-icon " + s.status;
      ic.textContent = icon;
      const note = document.createElement("span");
      note.className = "st-note";
      note.textContent = s.note;
      li.append(arrow, label, ic, note);
      ul.appendChild(li);
    }
  }
  function buildCommits() {
    const ul = $("#commits");
    for (const cm of C.copy.gitlog.commits) {
      const li = document.createElement("li");
      const hash = document.createElement("span");
      hash.className = "c-hash";
      hash.textContent = cm.hash;
      const msg = document.createElement("span");
      msg.className = "c-msg";
      msg.textContent = cm.msg;
      li.append(hash, msg);
      ul.appendChild(li);
    }
  }
  function buildIssue() {
    const i = C.copy.issue;
    const box = $("#issue");
    const head = document.createElement("div");
    head.className = "issue-head";
    head.append("🐞 ");
    const b = document.createElement("b");
    b.textContent = i.id;
    head.append(b, " — " + i.title + " ");
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = i.status;
    head.append(chip);
    const note = document.createElement("div");
    note.className = "issue-note";
    note.textContent = i.note;
    box.append(head, note);
  }

  // ---------- ініціалізація ----------
  function init() {
    // window chrome
    $("#filename").textContent = C.copy.window.lockedFile;

    // locked
    $("#locked-prompt").textContent = C.copy.locked.prompt;
    $("#lbl-days").textContent = C.copy.locked.countdownLabels.days;
    $("#lbl-hours").textContent = C.copy.locked.countdownLabels.hours;
    $("#lbl-minutes").textContent = C.copy.locked.countdownLabels.minutes;
    $("#lbl-seconds").textContent = C.copy.locked.countdownLabels.seconds;
    buildStages();

    // unlocked text
    $("#u-headline").textContent = C.copy.unlocked.headline;
    $("#u-meta").textContent = C.copy.unlocked.meta;
    $("#confetti-btn").textContent = C.copy.unlocked.confettiBtn;
    $("#gitlog-title").textContent = C.copy.gitlog.title;
    buildCommits();
    buildIssue();
    $("#voucher-prompt").textContent = C.copy.voucher.prompt;
    $("#voucher-title").textContent = C.copy.voucher.title;
    $("#gate-prompt").textContent = C.copy.voucher.gatePrompt;
    $("#code-input").placeholder = C.copy.voucher.placeholder;
    $("#unlock-btn").textContent = C.copy.voucher.unlockBtn;
    $("#dl-funny").textContent = C.copy.voucher.downloadFunny;
    $("#cert-prompt").textContent = C.copy.voucher.cert.prompt;
    $("#cert-input").placeholder = C.copy.voucher.cert.placeholder;
    $("#cert-btn").textContent = C.copy.voucher.cert.btn;
    $("#footer").textContent = C.copy.footer;

    // фото
    const img = $("#photo");
    if (C.person.showPhoto && C.person.photoUrl) {
      img.src = C.person.photoUrl;
      img.alt = C.person.fullNameUA;
      img.onerror = function () {
        img.style.display = "none";
      };
    } else {
      img.style.display = "none";
    }

    // події
    $("#gate-form").addEventListener("submit", function (e) {
      e.preventDefault();
      checkCode();
    });
    $("#confetti-btn").addEventListener("click", function () {
      burstConfetti(120);
    });
    $("#dl-funny").addEventListener("click", function () {
      download(drawVoucher(C.vouchers.funny), "borgova-rozpyska.png");
    });
    $("#cert-form").addEventListener("submit", async function (e) {
      e.preventDefault();
      const cfg = C.copy.voucher.cert;
      const msg = $("#cert-msg");
      const pass = $("#cert-input").value.trim();
      if (!pass) return;
      msg.className = "gate-msg";
      msg.textContent = cfg.working;
      try {
        const blob = await decryptCert(pass);
        const url = URL.createObjectURL(blob);
        download(url, cfg.downloadName);
        setTimeout(function () {
          URL.revokeObjectURL(url);
        }, 5000);
        msg.className = "gate-msg ok";
        msg.textContent = cfg.ok;
        burstConfetti(120);
      } catch (err) {
        msg.className = "gate-msg err";
        msg.textContent = cfg.wrong;
      }
    });

    // стан
    if (isUnlocked()) {
      goLive(false);
    } else {
      updateCountdown();
      streamLog();
      countdownTimer = setInterval(updateCountdown, 1000);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
