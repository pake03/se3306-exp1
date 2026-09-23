import { posts } from "../shared/posts.mjs";
import { renderPage } from "../shared/render-page.mjs";

export default function handler(_request, response) {
  const renderedAt = new Date().toISOString();
  const html = renderPage({
    mode: "SSR",
    modeName: "服务端渲染",
    headline: "请求抵达服务器的那一刻",
    description: "十篇短文梳理现代 Web 渲染的关键选择。本页 HTML 在每次请求到达服务器时生成，正文随首个响应一同返回。",
    timingLabel: "服务器渲染时间",
    renderedAt,
    posts
  })
    .replaceAll('href="/favicon.svg"', 'href="/ssr-assets/favicon.svg"')
    .replaceAll('href="/style.css"', 'href="/ssr-assets/style.css"')
    .replaceAll('src="/images/', 'src="/ssr-assets/images/');

  response.setHeader("Content-Type", "text/html; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Render-Mode", "SSR");
  response.status(200).send(html);
}
