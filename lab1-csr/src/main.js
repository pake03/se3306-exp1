import { posts } from "./content.js";

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

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

document.querySelector("#app").innerHTML = `
  <header class="site-header">
    <div class="header-inner">
      <div class="brand"><span class="brand-mark">R/3</span><span>Rendering Notes</span></div>
      <span class="render-badge">CSR · 客户端渲染</span>
    </div>
  </header>
  <main>
    <section class="hero">
      <div class="hero-inner">
        <div>
          <p class="eyebrow">Web Rendering Field Guide</p>
          <h1>浏览器接过画笔之后</h1>
          <p class="hero-copy">十篇短文梳理现代 Web 渲染的关键选择。本页初始 HTML 不含文章正文，内容由浏览器执行 JavaScript 后生成。</p>
          <div class="hero-meta"><span>10 篇文章</span><span>实验版本：CSR</span><span>内容生成位置：Browser</span></div>
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
        <p>客户端脚本生成 · 共 ${posts.length} 篇</p>
      </div>
      <div class="article-grid">${articleMarkup}</div>
    </section>
  </main>
  <footer class="site-footer">
    <div class="footer-inner"><p>SE3306 · Web 渲染方式对比实验</p><p>CSR / SSR / SSG</p></div>
  </footer>
`;
