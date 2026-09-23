import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { posts } from "../shared/posts.mjs";
import { renderPage } from "../shared/render-page.mjs";

const app = express();
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";

app.disable("x-powered-by");
app.use(express.static(path.join(currentDir, "public"), {
  etag: true,
  maxAge: process.env.NODE_ENV === "production" ? "1d" : 0
}));

app.get("/health", (_request, response) => {
  response.json({ status: "ok", mode: "SSR", articles: posts.length });
});

app.get("/", (_request, response) => {
  const renderedAt = new Date().toISOString();
  const html = renderPage({
    mode: "SSR",
    modeName: "服务端渲染",
    headline: "请求抵达服务器的那一刻",
    description: "十篇短文梳理现代 Web 渲染的关键选择。本页 HTML 在每次请求到达服务器时生成，正文随首个响应一同返回。",
    timingLabel: "服务器渲染时间",
    renderedAt,
    posts
  });

  response.set({
    "Cache-Control": "no-store",
    "Content-Type": "text/html; charset=utf-8",
    "X-Render-Mode": "SSR"
  }).send(html);
});

app.listen(port, host, () => {
  console.log(`SSR 服务运行于 http://${host}:${port}`);
});
