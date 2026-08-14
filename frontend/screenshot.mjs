import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: [
    "--no-sandbox",
    "--use-gl=swiftshader",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--enable-unsafe-swiftshader",
    "--proxy-server=" + (process.env.HTTPS_PROXY || ""),
    "--ignore-certificate-errors",
  ],
});
const page = await browser.newPage({ viewport: { width: 420, height: 800 } });
page.on("console", (msg) => console.log("BROWSER:", msg.type(), msg.text()));
page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));

await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });
await page.screenshot({ path: "/tmp/shot-home.png" });

// Pick an avatar + age, start
await page.locator(".avatar-btn").first().click();
await page.locator(".age-btn").nth(2).click();
await page.locator(".big-btn").click();
await page.waitForTimeout(300);
await page.screenshot({ path: "/tmp/shot-languages.png" });

// Continue with default languages
const continueBtn = page.locator(".big-btn");
if (await continueBtn.count()) await continueBtn.first().click();
await page.waitForTimeout(300);

// Go straight to the World module
await page.goto("http://localhost:4173/world", { waitUntil: "networkidle" });
await page.waitForTimeout(300);
await page.screenshot({ path: "/tmp/shot-world-explore.png" });

// Open the 3D Globe tab
await page.getByText("Globo 3D", { exact: false }).first().click();
await page.waitForTimeout(2500);
await page.screenshot({ path: "/tmp/shot-world-globe.png" });

await browser.close();
console.log("done");
