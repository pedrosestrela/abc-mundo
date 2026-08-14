import { chromium } from "playwright-core";

const BASE = "http://localhost:4173";

const ROUTES = [
  "/", "/languages", "/mundos", "/phonics", "/alphabet", "/syllables",
  "/reading", "/phrases", "/songs", "/game", "/music", "/piano",
  "/stories", "/rhymes", "/math", "/financial", "/parents", "/achievements",
  "/missions", "/world", "/detective", "/whys", "/robots", "/art",
  "/science", "/history", "/lifeskills", "/computing", "/how-it-works",
  "/thinking", "/learning-strategies", "/city", "/nature-diary",
  "/writing", "/communication",
];

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
  },
  "/game": async () => {
    const tabs = page.locator("button", { hasText: /quiz|labirinto|mem[oó]ria/i });
    const n = await tabs.count();
    for (let i = 0; i < Math.min(n, 3); i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(300);
    }
    const dpad = page.locator("[class*='dpad'] button, [class*='maze'] button").first();
    if (await dpad.count()) await dpad.click().catch(() => {});
    const card = page.locator("[class*='memory-card'],[class*='card']").first();
    if (await card.count()) await card.click().catch(() => {});
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
    const tabs = page.locator("button", { hasText: /semana do dinheiro|mealheiro/i });
    const n = await tabs.count();
    for (let i = 0; i < n; i++) {
      await tabs.nth(i).click().catch(() => {});
      await page.waitForTimeout(200);
    }
  },
  "/science": async () => {
    const tabs = page.locator("button", { hasText: /gravidade|eletric|luz/i });
    const n = await tabs.count();
    if (n) {
      await tabs.first().click().catch(() => {});
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
