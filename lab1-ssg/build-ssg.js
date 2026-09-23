import { cp, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { posts } from "../shared/posts.mjs";
import { renderPage } from "../shared/render-page.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(currentDir, "dist");
const renderedAt = new Date().toISOString();

const html = renderPage({
  mode: "SSG",
  modeName: "静态站点生成",
  headline: "在访问发生之前完成页面",
  description: "十篇短文梳理现代 Web 渲染的关键选择。本页 HTML 在构建阶段一次性生成，访问时由静态服务器直接分发。",
  timingLabel: "静态构建时间",
  renderedAt,
  posts
});

await mkdir(outputDir, { recursive: true });
await cp(path.join(currentDir, "public"), outputDir, { recursive: true });
await writeFile(path.join(outputDir, "index.html"), html, "utf8");
await writeFile(path.join(outputDir, "build-info.json"), JSON.stringify({ mode: "SSG", renderedAt, articles: posts.length }, null, 2), "utf8");

console.log(`SSG 页面已生成：${path.join(outputDir, "index.html")}`);
console.log(`构建时间：${renderedAt}`);
