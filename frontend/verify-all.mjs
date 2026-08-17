import { chromium } from "playwright-core";

const BASE = "http://localhost:4173";

const ROUTES = [
  "/", "/languages", "/mundos", "/phonics", "/alphabet", "/syllables",
  "/reading", "/phrases", "/songs", "/game", "/music",
  "/stories", "/rhymes", "/math", "/financial", "/parents", "/achievements",
  "/missions", "/world", "/detective", "/whys", "/robots", "/art",
  "/science", "/history", "/human-evolution", "/tech-history", "/lifeskills",
  "/mini-chef", "/circuit-lab", "/computing", "/how-it-works",
  "/thinking", "/learning-strategies", "/city", "/nature-diary",
  "/writing", "/communication", "/traffic-school",
];

// Heuristic scan for raw i18n keys leaking into visible text, e.g.
// "modules.gameTabChess" or "trafficSchool.category_all" showing up
// instead of the translated string.
const I18N_KEY_RE = /\b[a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9]*){1,}\b/g;
async function scanForRawI18nKeys(page) {
  const text = await page.evaluate(() => document.body.innerText);
  const matches = text.match(I18N_KEY_RE) || [];
  // Filter out things that are plausibly not i18n keys (URLs, decimals, etc.)
  const suspicious = matches.filter((m) => /^[a-z]+(\.[a-zA-Z][a-zA-Z0-9]*){1,}$/.test(m) && !/^\d/.test(m));
  return suspicious;
}

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: [
    "--no-sandbox",
    "--use-gl=swiftshader",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--enable-unsafe-swiftshader",
    "--proxy-server=" + (process.env.HTTPS_PROXY || ""),
    "--proxy-bypass-list=localhost,127.0.0.1",
    "--ignore-certificate-errors",
  ],
});
const page = await browser.newPage({ viewport: { width: 420, height: 800 } });
page.setDefaultTimeout(5000);

const results = [];
let currentRoute = "init";
let errorsForRoute = [];

// "Failed to load resource" console errors carry no URL info in this Chromium
// build and are consistently caused by the sandboxed proxy blocking the
// external Google Fonts request on every navigation -- not an app bug.
const IGNORE_RE = /Failed to load resource/;

page.on("console", (msg) => {
  if (msg.type() === "error") {
    const text = msg.text();
    if (IGNORE_RE.test(text)) return;
    errorsForRoute.push(`[console] ${text}`);
  }
});
page.on("pageerror", (err) => {
  errorsForRoute.push(`[pageerror] ${err.message}`);
});

async function checkRoute(path, interact) {
  errorsForRoute = [];
  currentRoute = path;
  let status = "PASS";
  let note = "";
  try {
    await page.goto(BASE + path, { waitUntil: "load", timeout: 20000 });
    await page.waitForTimeout(700);
    if (interact) {
      try {
        await interact();
      } catch (e) {
        errorsForRoute.push(`[interaction] ${e.message}`);
      }
    }
    await page.waitForTimeout(300);
    const info = await page.evaluate(() => ({
      len: document.body.innerText.length,
      hasHeading: !!document.querySelector("h1,h2"),
    }));
    if (info.len <= 50 && !info.hasHeading) {
      status = "FAIL";
      note = `blank/short content (len=${info.len})`;
    }
    const rawKeys = await scanForRawI18nKeys(page);
    if (rawKeys.length) {
      errorsForRoute.push(`[i18n-leak] raw keys visible: ${[...new Set(rawKeys)].join(", ")}`);
    }
  } catch (e) {
    status = "FAIL";
    note = `navigation error: ${e.message}`;
  }
  if (errorsForRoute.length) {
    status = "FAIL";
    note = (note ? note + "; " : "") + errorsForRoute.join(" | ");
  }
  results.push({ path, status, note });
  console.log(`${status.padEnd(4)} ${path}${note ? "  -- " + note : ""}`);
}

// Onboarding flow
await checkRoute("/", async () => {
  await page.locator(".avatar-btn").first().click({ timeout: 5000 });
  await page.locator(".age-btn").nth(2).click({ timeout: 5000 });
  await page.locator(".big-btn").click({ timeout: 5000 });
});

await checkRoute("/languages", async () => {
  const btn = page.locator(".big-btn").first();
  if (await btn.count()) await btn.click({ timeout: 5000 });
});

const interactions = {
  "/world": async () => {
    const globeTab = page.getByText("Globo 3D", { exact: false }).first();
    if (await globeTab.count()) {
      await globeTab.click();
      await page.waitForTimeout(2000);
    }
    const canvas = page.locator("canvas").first();
    if (await canvas.count()) {
      await canvas.click({ timeout: 8000, force: true }).catch(() => {});
    }
    const pin = page.locator("[class*='pin'],[class*='marker']").first();
    if (await pin.count()) await pin.click({ timeout: 2000, force: true }).catch(() => {});
    await page.waitForTimeout(500);
    const speakBtns = page.locator(".country-card button[class*='speak'], .country-card [class*='Speak']");
    // Not asserting count > 0 here (globe click via WebGL canvas isn't
    // reliably hittable in headless swiftshader), but log for visibility.
    const sc = await speakBtns.count().catch(() => 0);
    if (sc > 0 && sc < 2) {
      throw new Error(`World country card shows only ${sc} audio button(s), expected both mother+native language`);
    }
  },
  "/game": async () => {
    const gameTabs = page.locator("[role='tab']");
    const n = await gameTabs.count();
    for (let i = 0; i < n; i++) {
      await gameTabs.nth(i).click().catch(() => {});
      await page.waitForTimeout(300);
      const label = ((await gameTabs.nth(i).textContent()) || "").toLowerCase();

      // Maze: use the D-pad to actually move.
      if (/labirinto|maze/.test(label)) {
        const dpad = page.locator(".maze-dpad button");
        const dn = await dpad.count();
        for (let k = 0; k < Math.min(dn, 3); k++) {
          await dpad.nth(k).click().catch(() => {});
          await page.waitForTimeout(150);
        }
      }

      // Memory: flip a couple of cards.
      if (/mem[oó]ria|memory/.test(label)) {
        const cards = page.locator("[class*='memory-card']");
        const cn = await cards.count();
        for (let k = 0; k < Math.min(cn, 2); k++) {
          await cards.nth(k).click().catch(() => {});
          await page.waitForTimeout(150);
        }
      }

      // Checkers / Chess: choose 1-player mode then attempt a couple of
      // legal-ish moves (select a piece, then a destination square).
      if (/xadrez|chess|damas|checkers/.test(label)) {
        const onePlayer = page.locator("button", { hasText: /1.?j|1.?p|solo/i }).first();
        if (await onePlayer.count()) await onePlayer.click().catch(() => {});
        await page.waitForTimeout(300);
        const squares = page.locator(".chess-board button, .checkers-cell:not([disabled])");
        const sn = await squares.count();
        if (sn > 0) {
          // Tap a piece, then tap a plausible destination a couple rows away.
          await squares.nth(Math.floor(sn * 0.6)).click().catch(() => {});
          await page.waitForTimeout(200);
          await squares.nth(Math.floor(sn * 0.4)).click().catch(() => {});
          await page.waitForTimeout(400);
        }
      }

      // Tic-tac-toe: play a couple of cells.
      if (/galo|tictactoe|tic-tac/.test(label)) {
        const onePlayer = page.locator("button", { hasText: /1.?j|1.?p|solo/i }).first();
        if (await onePlayer.count()) await onePlayer.click().catch(() => {});
        await page.waitForTimeout(200);
        const cells = page.locator(".ttt-cell:not([disabled])");
        const cn = await cells.count();
        for (let k = 0; k < Math.min(cn, 2); k++) {
          await cells.nth(0).click().catch(() => {});
          await page.waitForTimeout(300);
        }
      }

      // Hangman: pick a word (if 1p setup needed), then guess a few letters.
      if (/forca|hangman/.test(label)) {
        const onePlayer = page.locator("button", { hasText: /1.?j|1.?p|solo/i }).first();
        if (await onePlayer.count()) await onePlayer.click().catch(() => {});
        await page.waitForTimeout(200);
        const beginBtn = page.locator("button", { hasText: /come[cç]ar|begin|adivinhar/i }).first();
        if (await beginBtn.count()) await beginBtn.click().catch(() => {});
        await page.waitForTimeout(200);
        const letters = page.locator("button[aria-label]").filter({ hasText: /^[A-Za-zÀ-ÿ]$/ });
        const ln = await letters.count();
        for (let k = 0; k < Math.min(ln, 4); k++) {
          await letters.nth(k).click().catch(() => {});
          await page.waitForTimeout(150);
        }
      }

      // Quiz: answer one question.
      if (/^quiz/.test(label)) {
        const answer = page.locator("[class*='quiz'] button, [class*='option']").first();
        if (await answer.count()) await answer.click().catch(() => {});
      }

      // Word search: tap the first two cells of a straight line to try to
      // find a word (start + end of a run).
      if (/sopa|word.?search/.test(label)) {
        const cells = page.locator(".wordsearch-cell");
        const cn = await cells.count();
        if (cn > 0) {
          await cells.nth(0).click().catch(() => {});
          await page.waitForTimeout(150);
          const cols = await page.locator(".wordsearch-grid").getAttribute("style");
          const match = cols && cols.match(/repeat\((\d+)/);
          const size = match ? parseInt(match[1], 10) : Math.round(Math.sqrt(cn));
          // Attempt a horizontal run from the first cell as a plausible word span.
          await cells.nth(Math.min(size - 1, cn - 1)).click().catch(() => {});
          await page.waitForTimeout(200);
        }
      }

      // Jigsaw: tap two pieces to swap them.
      if (/quebra|jigsaw|puzzle/.test(label)) {
        const pieces = page.locator(".jigsaw-piece");
        const pn = await pieces.count();
        if (pn > 1) {
          await pieces.nth(0).click().catch(() => {});
          await page.waitForTimeout(150);
          await pieces.nth(1).click().catch(() => {});
          await page.waitForTimeout(200);
        }
      }
    }
  },
  "/traffic-school": async () => {
    // Signs tab loads by default with content; switch to the drive
    // simulator and actually drive, including deliberately running a
    // stop sign to confirm the gentle-correction flow.
    const driveTab = page.locator("button", { hasText: /conduzir|drive/i }).first();
    if (await driveTab.count()) await driveTab.click().catch(() => {});
    await page.waitForTimeout(400);
    const dpad = page.locator(".maze-dpad button");
    const dn = await dpad.count();
    // Drive forward repeatedly without stopping at signs/lights to try to
    // trigger a rule violation, then confirm the app doesn't crash and
    // offers a way to continue.
    for (let k = 0; k < 8; k++) {
      if (dn > 0) await dpad.first().click().catch(() => {});
      await page.waitForTimeout(200);
      const dismissViolation = page.locator("button", { hasText: /entendi|ok|continuar/i }).first();
      if (await dismissViolation.count()) {
        await dismissViolation.click().catch(() => {});
        break;
      }
    }
  },
  "/music": async () => {
    const tabs = page.locator("button, [role='tab']");
    const n = await tabs.count();
    for (let i = 0; i < Math.min(n, 4); i++) {
      const t = tabs.nth(i);
      const txt = (await t.textContent()) || "";
      if (/piano|guitarra|xilofone|bateria|instrument/i.test(txt)) {
        await t.click().catch(() => {});
        await page.waitForTimeout(200);
      }
    }
    const note = page.locator("[class*='note'],[class*='key']").first();
    if (await note.count()) await note.click().catch(() => {});
  },
  "/writing": async () => {
    const tabs = page.locator("button");
    const n = await tabs.count();
    for (let i = 0; i < Math.min(n, 6); i++) await tabs.nth(i).click().catch(() => {});
    const canvas = page.locator("canvas").first();
    if (await canvas.count()) {
      const box = await canvas.boundingBox({ timeout: 8000 }).catch(() => null);
      if (box) {
        await page.mouse.move(box.x + 10, box.y + 10);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width - 10, box.y + box.height - 10);
        await page.mouse.up();
      }
    }
  },
  "/math": async () => {
    const tabs = page.locator("button", { hasText: /adi[cç][aã]o|multiplica/i });
    const n = await tabs.count();
    for (let i = 0; i < Math.min(n, 2); i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(200);
      const toggle = page.locator("button", { hasText: /contar|counting/i }).first();
      if (await toggle.count()) await toggle.click().catch(() => {});
    }
  },
  "/financial": async () => {
    const tabs = page.locator(".phonics-tab");
    const n = await tabs.count();
    for (let i = 0; i < n; i++) {
      await tabs.nth(i).click().catch(() => {});
      await page.waitForTimeout(200);
    }
  },
  "/computing": async () => {
    const tabs = page.locator(".phonics-tab");
    const n = await tabs.count();
    for (let i = 0; i < n; i++) {
      await tabs.nth(i).click().catch(() => {});
      await page.waitForTimeout(200);
    }
  },
  "/science": async () => {
    const tabs = page.locator(".phonics-tab, button", { hasText: /gravidade|eletric|luz/i });
    const n = await tabs.count();
    for (let i = 0; i < Math.min(n, 6); i++) {
      await tabs.nth(i).click().catch(() => {});
      await page.waitForTimeout(300);
    }
  },
  "/robots": async () => {
    const tabs = page.locator("button", { hasText: /condicional|debug/i });
    const n = await tabs.count();
    if (n) {
      await tabs.first().click().catch(() => {});
      await page.waitForTimeout(300);
    }
  },
  "/detective": async () => {
    const tabs = page.locator("button", { hasText: /observa|dedu|fontes|ia/i });
    const n = await tabs.count();
    if (n) {
      await tabs.first().click().catch(() => {});
      await page.waitForTimeout(300);
    }
  },
  "/whys": async () => {
    const chip = page.locator("[class*='related'] button, [class*='chip']").first();
    if (await chip.count()) await chip.click().catch(() => {});
  },
  "/syllables": async () => {
    const tabs = page.locator("button", { hasText: /construir|falta|separar|d[ií]grafo/i });
    const n = await tabs.count();
    for (let i = 0; i < Math.min(n, 4); i++) {
      await tabs.nth(i).click().catch(() => {});
      await page.waitForTimeout(200);
    }
  },
  "/phrases": async () => {
    const toggle = page.locator("button", { hasText: /s[ií]labas/i }).first();
    if (await toggle.count()) await toggle.click().catch(() => {});
  },
  "/stories": async () => {
    const story = page.locator("[class*='story-card'],button,[class*='card']").first();
    if (await story.count()) {
      await story.click().catch(() => {});
      await page.waitForTimeout(300);
      const next = page.locator("button", { hasText: /pr[oó]xim|seguinte|>/i }).first();
      if (await next.count()) await next.click().catch(() => {});
      const deco = page.locator("[class*='decor']").first();
      if (await deco.count()) await deco.click().catch(() => {});
    }
  },
  "/achievements": async () => {
    await page.waitForTimeout(300);
    const text = await page.evaluate(() => document.body.innerText);
    if (/NaN|undefined/i.test(text)) {
      throw new Error("Passaporte de Competencias shows NaN/undefined");
    }
  },
  "/parents": async () => {
    // Lembretes: flip the enable toggle (may prompt for Notification
    // permission, which is auto-granted/denied by Chromium in headless
    // runs without blocking).
    const reminderToggle = page.locator(".reminder-toggle-row input[type='checkbox']").first();
    if (await reminderToggle.count()) {
      await reminderToggle.click().catch(() => {});
      await page.waitForTimeout(200);
    }

    // Backup & Sincronizar: exercise a real export round-trip against the
    // running preview server (which proxies /api to the backend, or the
    // backend serves the built frontend directly).
    const exportBtn = page.locator(".sync-export-btn").first();
    if (await exportBtn.count()) {
      await exportBtn.click().catch(() => {});
      await page.waitForTimeout(1500);
      const codeBox = page.locator(".sync-code-value").first();
      const errorBox = page.locator(".sync-error").first();
      if (await errorBox.count()) {
        throw new Error("Sync export failed: " + (await errorBox.textContent()));
      }
      if (await codeBox.count()) {
        const code = (await codeBox.textContent()).trim();
        const importInput = page.locator(".sync-import-input").first();
        await importInput.fill(code);
        const importBtn = page.locator(".sync-import-btn").first();
        await importBtn.click().catch(() => {});
        await page.waitForTimeout(1500);
        const importError = page.locator(".sync-import ~ * .sync-error, .sync-import .sync-error").first();
        if (await importError.count()) {
          throw new Error("Sync import failed: " + (await importError.textContent()));
        }
      }
    }
  },
  "/human-evolution": async () => {
    const compareTab = page.locator(".phonics-tab", { hasText: /compar/i }).first();
    if (await compareTab.count()) {
      await compareTab.click().catch(() => {});
      await page.waitForTimeout(300);
    }
  },
  "/tech-history": async () => {
    const topicTabs = page.locator(".phonics-tabs").first().locator(".phonics-tab");
    const n = await topicTabs.count();
    for (let i = 0; i < Math.min(n, 3); i++) {
      await topicTabs.nth(i).click().catch(() => {});
      await page.waitForTimeout(200);
    }
    const renewableFilter = page.locator(".phonics-tab", { hasText: /renov|renewable/i }).first();
    if (await renewableFilter.count()) await renewableFilter.click().catch(() => {});
  },
  "/mini-chef": async () => {
    const recipeCard = page.locator(".computing-term-btn").first();
    if (await recipeCard.count()) {
      await recipeCard.click().catch(() => {});
      await page.waitForTimeout(300);
      const ingredient = page.locator(".game-options button").first();
      if (await ingredient.count()) {
        await ingredient.click().catch(() => {});
        await page.waitForTimeout(300);
      }
    }
  },
  "/circuit-lab": async () => {
    const challengeCard = page.locator(".computing-term-btn").first();
    if (await challengeCard.count()) {
      await challengeCard.click().catch(() => {});
      await page.waitForTimeout(300);
      const part = page.locator(".game-options button").first();
      if (await part.count()) {
        await part.click().catch(() => {});
        await page.waitForTimeout(300);
      }
    }
  },
};

for (const path of ROUTES.slice(2)) {
  await checkRoute(path, interactions[path]);
}

await browser.close();

console.log("\n=== SUMMARY ===");
const fails = results.filter((r) => r.status === "FAIL");
for (const r of results) {
  console.log(`${r.status.padEnd(4)} ${r.path}${r.note ? "  -- " + r.note : ""}`);
}
console.log(`\n${results.length - fails.length}/${results.length} PASS`);
if (fails.length) {
  console.log(`${fails.length} FAILURES`);
  process.exitCode = 1;
}
