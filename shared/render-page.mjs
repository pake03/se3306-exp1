const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

export function renderPage({ mode, modeName, headline, description, timingLabel, renderedAt, posts }) {
  const articleMarkup = posts.map((post) => `
    <article><h2>${escapeHtml(post.title)}</h2><p>${escapeHtml(post.body)}</p></article>
  `).join("");

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="description" content="文章列表渲染实验" />
    <title>${mode} 文章列表</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  </head>
  <body data-render-mode="${mode}" data-render-time="${escapeHtml(renderedAt)}">
    <h1>文章列表</h1>
    ${articleMarkup}
  </body>
</html>`;
}
