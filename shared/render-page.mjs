const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

export function renderPage({ mode, modeName, headline, description, timingLabel, renderedAt, posts }) {
  const articleMarkup = posts.map((post, index) => `
    <article class="article-card">
      <div class="article-index">${String(index + 1).padStart(2, "0")}</div>
      <div>
        <div class="article-meta">
          <span>${escapeHtml(post.category)}</span>
          <time datetime="${post.date}">${post.date}</time>
        </div>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.body)}</p>
      </div>
    </article>
  `).join("");

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="使用${modeName}的 Web 渲染技术文章列表" />
    <title>${mode} 文章列表 | Rendering Notes</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="/style.css" />
  </head>
  <body data-render-mode="${mode}" data-render-time="${escapeHtml(renderedAt)}">
    <header class="site-header">
      <div class="header-inner">
        <div class="brand"><span class="brand-mark">R/3</span><span>Rendering Notes</span></div>
        <span class="render-badge">${mode} · ${modeName}</span>
      </div>
    </header>
    <main>
      <section class="hero">
        <div class="hero-inner">
          <div>
            <p class="eyebrow">Web Rendering Field Guide</p>
            <h1>${escapeHtml(headline)}</h1>
            <p class="hero-copy">${escapeHtml(description)}</p>
            <div class="hero-meta">
              <span>10 篇文章</span><span>实验版本：${mode}</span><span>${escapeHtml(timingLabel)}：<time>${escapeHtml(renderedAt)}</time></span>
            </div>
          </div>
          <figure class="hero-figure">
            <img src="/images/rendering-workflow.webp" alt="CSR、SSR 与 SSG 渲染流程图" width="1200" height="900" />
            <figcaption>同一份内容，三种生成时机</figcaption>
          </figure>
        </div>
      </section>
      <section class="content-inner" aria-labelledby="article-heading">
        <div class="section-heading">
          <h2 id="article-heading">文章列表</h2>
          <p>${modeName} · 共 ${posts.length} 篇</p>
        </div>
        <div class="article-grid">${articleMarkup}</div>
      </section>
    </main>
    <footer class="site-footer">
      <div class="footer-inner"><p>SE3306 · Web 渲染方式对比实验</p><p>CSR / SSR / SSG</p></div>
    </footer>
  </body>
</html>`;
}
