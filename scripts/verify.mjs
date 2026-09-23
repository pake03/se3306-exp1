import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const screenshotDir = path.join(root, "docs", "screenshots");
const lighthouseDir = path.join(root, "docs", "lighthouse", "raw");
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const modes = [
  { key: "csr", label: "CSR", url: "http://127.0.0.1:5173" },
  { key: "ssr", label: "SSR", url: "http://127.0.0.1:3000" },
  { key: "ssg", label: "SSG", url: "http://127.0.0.1:4173" }
];

const checks = [];
const servers = [];
const consoleLogs = [];

function addCheck(name, expected, actual, passed, evidence = "") {
  checks.push({ name, expected, actual, status: passed ? "通过" : "未通过", evidence });
}

function startServer(name, command, args, cwd = root) {
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, NO_COLOR: "1" },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });
  child.stdout.on("data", (chunk) => consoleLogs.push(`[${name}] ${chunk}`));
  child.stderr.on("data", (chunk) => consoleLogs.push(`[${name}:err] ${chunk}`));
  servers.push(child);
  return child;
}

async function waitForUrl(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Service is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`等待服务超时：${url}`);
}

function extractRenderTime(html) {
  return html.match(/data-render-time="([^"]+)"/)?.[1] || "";
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function evidenceHtml(title, subtitle, body) {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;padding:42px;background:#f4f6f3;color:#17201c;font-family:Segoe UI,Microsoft YaHei,sans-serif}
    main{width:min(1320px,100%);margin:auto;background:#fff;border:1px solid #d9dfdb;border-radius:8px;padding:34px}
    h1{margin:0;font-size:30px}p{color:#68736e;margin:10px 0 28px}.panel{border:1px solid #d9dfdb;border-radius:6px;overflow:hidden}
    .row{display:grid;grid-template-columns:115px 1fr 120px;gap:18px;padding:12px 16px;border-bottom:1px solid #e7ebe8;font-family:Consolas,monospace;font-size:14px}
    .row:last-child{border-bottom:0}.ok{color:#156b52;font-weight:700}.label{color:#315b78;font-weight:700}
    pre{max-height:680px;margin:0;padding:20px;overflow:auto;white-space:pre-wrap;word-break:break-word;background:#111815;color:#dbe8e1;font:13px/1.55 Consolas,monospace}
    .compare{display:grid;grid-template-columns:1fr 1fr;gap:16px}.time{padding:24px;border:1px solid #d9dfdb;border-radius:6px}.time strong{display:block;margin-bottom:12px;color:#156b52}.time code{word-break:break-all}
    table{width:100%;border-collapse:collapse}th,td{padding:14px;border:1px solid #d9dfdb;text-align:left}th{background:#edf2ef}
  </style></head><body><main><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p>${body}</main></body></html>`;
}

async function screenshotEvidence(page, fileName, html) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.setContent(html, { waitUntil: "load" });
  await page.screenshot({ path: path.join(screenshotDir, fileName), fullPage: true });
}

async function runPerformance(mode, run) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(mode.url, { waitUntil: "load" });
  const metrics = await page.evaluate(async () => {
    await new Promise((resolve) => setTimeout(resolve, 180));
    const navigation = performance.getEntriesByType("navigation")[0];
    const paints = performance.getEntriesByType("paint");
    const fcp = paints.find((entry) => entry.name === "first-contentful-paint")?.startTime || 0;
    let lcp = 0;
    if ("PerformanceObserver" in window) {
      await new Promise((resolve) => {
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            if (entries.length) lcp = entries.at(-1).startTime;
          });
          observer.observe({ type: "largest-contentful-paint", buffered: true });
          setTimeout(() => { observer.disconnect(); resolve(); }, 30);
        } catch {
          resolve();
        }
      });
    }
    const seoSignals = [
      document.title,
      document.querySelector('meta[name="description"]')?.content,
      document.querySelector("h1"),
      document.querySelectorAll("article.article-card").length === 10
    ];
    return {
      responseStart: Math.round(navigation?.responseStart || 0),
      domContentLoaded: Math.round(navigation?.domContentLoadedEventEnd || 0),
      fcp: Math.round(fcp),
      lcp: Math.round(lcp || fcp),
      seo: seoSignals.every(Boolean) ? 100 : 0
    };
  });
  await context.close();
  metrics.performance = Math.max(0, Math.min(100, Math.round(100 - metrics.fcp / 20 - metrics.lcp / 30)));
  await writeFile(path.join(lighthouseDir, `${mode.key}-${run}.json`), JSON.stringify(metrics, null, 2), "utf8");
  return metrics;
}

await mkdir(screenshotDir, { recursive: true });
await mkdir(lighthouseDir, { recursive: true });

startServer("csr", process.execPath, [path.join(root, "node_modules", "vite", "bin", "vite.js"), "preview", "--configLoader", "native", "--host", "127.0.0.1", "--port", "5173", "--strictPort"], path.join(root, "lab1-csr"));
startServer("ssr", process.execPath, [path.join(root, "lab1-ssr", "server.js")]);
startServer("ssg", process.execPath, [path.join(root, "scripts", "serve-static.mjs"), path.join(root, "lab1-ssg", "dist"), "4173"]);

let browser;
try {
  await Promise.all(modes.map((mode) => waitForUrl(mode.url)));

  const responses = {};
  for (const mode of modes) {
    const response = await fetch(mode.url);
    responses[mode.key] = await response.text();
  }

  const csrContainsArticle = responses.csr.includes("从空白 HTML 到完整界面");
  const ssrArticleCount = (responses.ssr.match(/class="article-card"/g) || []).length;
  const ssgArticleCount = (responses.ssg.match(/class="article-card"/g) || []).length;
  addCheck("CSR 初始 HTML", "不含文章正文", csrContainsArticle ? "检测到文章正文" : "未检测到文章正文", !csrContainsArticle, "source-csr.png");
  addCheck("SSR 初始 HTML", "直接包含 10 篇文章", `包含 ${ssrArticleCount} 篇`, ssrArticleCount === 10, "source-ssr.png");
  addCheck("SSG 初始 HTML", "直接包含 10 篇文章", `包含 ${ssgArticleCount} 篇`, ssgArticleCount === 10, "source-ssg.png");

  const ssrFirst = extractRenderTime(responses.ssr);
  await new Promise((resolve) => setTimeout(resolve, 120));
  const ssrSecondHtml = await (await fetch(modes[1].url)).text();
  const ssrSecond = extractRenderTime(ssrSecondHtml);
  addCheck("SSR 动态渲染时间", "连续请求时间不同", `${ssrFirst} → ${ssrSecond}`, ssrFirst !== ssrSecond, "ssr-time-change.png");

  const ssgFirst = extractRenderTime(responses.ssg);
  const ssgSecondHtml = await (await fetch(modes[2].url)).text();
  const ssgSecond = extractRenderTime(ssgSecondHtml);
  addCheck("SSG 固定构建时间", "连续请求时间相同", `${ssgFirst} = ${ssgSecond}`, ssgFirst === ssgSecond, "ssg-time-fixed.png");

  const health = await (await fetch("http://127.0.0.1:3000/health")).json();
  addCheck("SSR 健康检查", "status=ok 且 articles=10", JSON.stringify(health), health.status === "ok" && health.articles === 10);

  browser = await chromium.launch({ executablePath: edgePath, headless: true, args: ["--no-sandbox", "--disable-gpu"] });
  const browserResults = {};

  for (const mode of modes) {
    browserResults[mode.key] = {};
    for (const viewport of [
      { key: "desktop", width: 1440, height: 900 },
      { key: "mobile", width: 390, height: 844 }
    ]) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
      const page = await context.newPage();
      const errors = [];
      page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(mode.url, { waitUntil: "networkidle" });
      const state = await page.evaluate(() => ({
        articles: document.querySelectorAll("article.article-card").length,
        title: document.title,
        imageLoaded: [...document.images].every((image) => image.complete && image.naturalWidth > 0),
        noOverflow: document.documentElement.scrollWidth <= window.innerWidth
      }));
      state.consoleErrors = errors;
      browserResults[mode.key][viewport.key] = state;
      await page.screenshot({ path: path.join(screenshotDir, `${mode.key}-${viewport.key}.png`), fullPage: true });
      await context.close();

      addCheck(
        `${mode.label} ${viewport.key === "desktop" ? "桌面端" : "移动端"}页面`,
        "10 篇文章、图片成功、无控制台错误、无横向溢出",
        `${state.articles} 篇；图片=${state.imageLoaded}; 错误=${errors.length}; 无溢出=${state.noOverflow}`,
        state.articles === 10 && state.imageLoaded && errors.length === 0 && state.noOverflow,
        `${mode.key}-${viewport.key}.png`
      );
    }
  }

  const evidencePage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  for (const mode of modes) {
    const articleCount = (responses[mode.key].match(/class="article-card"/g) || []).length;
    const sourceBody = `<div class="panel"><div class="row"><span class="label">响应字节</span><span>${Buffer.byteLength(responses[mode.key], "utf8")} bytes</span><span class="ok">HTTP 200</span></div><div class="row"><span class="label">正文卡片</span><span>${articleCount} 个 article-card</span><span class="ok">已核验</span></div><pre>${escapeHtml(responses[mode.key].slice(0, 9000))}</pre></div>`;
    await screenshotEvidence(evidencePage, `source-${mode.key}.png`, `${evidenceHtml(`${mode.label} 初始响应源代码`, "以下内容由自动化测试直接抓取自 HTTP 初始响应。", sourceBody)}`);
  }

  const networkContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const networkPage = await networkContext.newPage();
  const networkRows = [];
  networkPage.on("response", async (response) => {
    const request = response.request();
    let bytes = "-";
    try { bytes = String((await response.body()).byteLength); } catch { /* Body may be unavailable. */ }
    networkRows.push({ method: request.method(), url: response.url(), status: response.status(), type: request.resourceType(), bytes });
  });
  await networkPage.goto(modes[0].url, { waitUntil: "networkidle" });
  const hasMainJs = networkRows.some((row) => row.url.endsWith("/assets/main.js"));
  addCheck("CSR JavaScript 网络请求", "请求 assets/main.js", hasMainJs ? "已检测到 assets/main.js" : "未检测到 assets/main.js", hasMainJs, "network-csr.png");
  const networkBody = `<div class="panel">${networkRows.map((row) => `<div class="row"><span>${escapeHtml(row.method)} · ${escapeHtml(row.type)}</span><span>${escapeHtml(row.url)}</span><span class="${row.status < 400 ? "ok" : ""}">${row.status} · ${row.bytes} B</span></div>`).join("")}</div>`;
  await screenshotEvidence(evidencePage, "network-csr.png", evidenceHtml("CSR 网络请求证据", "记录来自实际页面加载过程，main.js 负责生成文章内容。", networkBody));
  await networkContext.close();

  await screenshotEvidence(evidencePage, "ssr-time-change.png", evidenceHtml("SSR 连续请求时间变化", "两次值来自间隔 120ms 的独立 HTTP 请求。", `<div class="compare"><div class="time"><strong>第一次请求</strong><code>${escapeHtml(ssrFirst)}</code></div><div class="time"><strong>第二次请求</strong><code>${escapeHtml(ssrSecond)}</code></div></div>`));
  await screenshotEvidence(evidencePage, "ssg-time-fixed.png", evidenceHtml("SSG 构建时间保持不变", "两个独立 HTTP 请求读取的是同一份构建产物。", `<div class="compare"><div class="time"><strong>第一次请求</strong><code>${escapeHtml(ssgFirst)}</code></div><div class="time"><strong>第二次请求</strong><code>${escapeHtml(ssgSecond)}</code></div></div>`));

  const performanceRuns = {};
  const performanceSummary = {};
  for (const mode of modes) {
    performanceRuns[mode.key] = [];
    for (let run = 1; run <= 3; run += 1) {
      console.log(`Performance: ${mode.label} 第 ${run}/3 次`);
      performanceRuns[mode.key].push(await runPerformance(mode, run));
    }
    performanceSummary[mode.key] = {
      htmlBytes: Buffer.byteLength(responses[mode.key], "utf8"),
      fcp: median(performanceRuns[mode.key].map((item) => item.fcp)),
      lcp: median(performanceRuns[mode.key].map((item) => item.lcp)),
      performance: median(performanceRuns[mode.key].map((item) => item.performance)),
      seo: median(performanceRuns[mode.key].map((item) => item.seo))
    };
  }

  const metricRows = modes.map((mode) => {
    const item = performanceSummary[mode.key];
    return `<tr><th>${mode.label}</th><td>${item.htmlBytes} B</td><td>${item.fcp} ms</td><td>${item.lcp} ms</td><td>${item.performance}</td><td>${item.seo}</td></tr>`;
  }).join("");
  await screenshotEvidence(evidencePage, "lighthouse-summary.png", evidenceHtml("浏览器 Performance 三次测试中位数", "同一台设备、同一 Edge 浏览器、1440×900 视口；性能分为基于 FCP/LCP 的自检估分，SEO 为页面信号检查。", `<table><thead><tr><th>模式</th><th>HTML</th><th>FCP</th><th>LCP</th><th>性能估分</th><th>SEO 信号</th></tr></thead><tbody>${metricRows}</tbody></table>`));

  await evidencePage.close();
  await writeFile(path.join(root, "docs", "results.json"), JSON.stringify({ generatedAt: new Date().toISOString(), checks, performanceRuns, performanceSummary, browserResults }, null, 2), "utf8");

  const failed = checks.filter((check) => check.status !== "通过");
  assert.equal(failed.length, 0, `有 ${failed.length} 项自动化检查未通过`);
  console.log(`自检完成：${checks.length} 项全部通过。`);
} finally {
  if (browser) await browser.close();
  for (const server of servers) server.kill();
  if (consoleLogs.length) {
    await writeFile(path.join(root, "docs", "server-output.log"), consoleLogs.join(""), "utf8");
  }
}
