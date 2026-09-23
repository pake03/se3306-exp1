(function(){const i=document.createElement("link").relList;if(i&&i.supports&&i.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))o(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const a of t.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&o(a)}).observe(document,{childList:!0,subtree:!0});function d(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?t.credentials="include":e.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function o(e){if(e.ep)return;e.ep=!0;const t=d(e);fetch(e.href,t)}})();const c=[{title:"从空白 HTML 到完整界面：理解 CSR",category:"客户端渲染",date:"2026-09-01",body:"CSR 将页面结构交给浏览器中的 JavaScript 生成。首个 HTML 很轻，但用户需要等待脚本下载、执行和数据准备。"},{title:"SSR 为什么能改善首屏与 SEO",category:"服务端渲染",date:"2026-09-03",body:"SSR 在收到请求后由服务器拼装完整 HTML。浏览器更早看到正文，搜索引擎也能直接读取主要内容。"},{title:"SSG：把渲染成本提前到构建阶段",category:"静态生成",date:"2026-09-05",body:"SSG 在发布前生成静态页面。访问时只需分发文件，特别适合更新频率较低的文档、博客和产品介绍。"},{title:"首屏性能指标 FCP 与 LCP 怎么看",category:"性能指标",date:"2026-09-07",body:"FCP 关注首次内容绘制，LCP 关注最大内容元素出现的时间。二者共同描述用户感知到的加载速度。"},{title:"查看源代码为何能辨别渲染方式",category:"调试方法",date:"2026-09-09",body:"查看源代码展示服务器最初返回的 HTML。若正文只在执行脚本后出现，页面通常采用了客户端渲染。"},{title:"Hydration 如何让 SSR 页面动起来",category:"同构应用",date:"2026-09-11",body:"服务端 HTML 负责快速展示，客户端脚本再绑定事件和状态。这个接管过程被称为 Hydration。"},{title:"静态资源缓存与 CDN 的协作",category:"网络优化",date:"2026-09-13",body:"带内容哈希的脚本和样式可以长期缓存，CDN 则把文件送到离用户更近的节点，降低传输延迟。"},{title:"实时页面该选哪一种渲染方案",category:"架构选择",date:"2026-09-15",body:"股票、聊天等实时界面通常以客户端更新为主，同时可用 SSR 提供首屏骨架，在速度与交互之间取得平衡。"},{title:"从 SPA 到混合渲染的演进",category:"技术演进",date:"2026-09-17",body:"现代框架不再要求整个站点只选一种模式，而是允许按页面甚至按组件组合 CSR、SSR、SSG 与流式渲染。"},{title:"用真实数据验证技术判断",category:"实验方法",date:"2026-09-19",body:"架构选择应建立在可复现的测量上。统一内容、设备和网络条件，才能让对比结果具有解释力。"}],s=r=>String(r).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"),n=c.map((r,i)=>`
  <article class="article-card">
    <div class="article-index">${String(i+1).padStart(2,"0")}</div>
    <div>
      <div class="article-meta">
        <span>${s(r.category)}</span>
        <time datetime="${r.date}">${r.date}</time>
      </div>
      <h3>${s(r.title)}</h3>
      <p>${s(r.body)}</p>
    </div>
  </article>
`).join("");document.querySelector("#app").innerHTML=`
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
        <p>客户端脚本生成 · 共 ${c.length} 篇</p>
      </div>
      <div class="article-grid">${n}</div>
    </section>
  </main>
  <footer class="site-footer">
    <div class="footer-inner"><p>SE3306 · Web 渲染方式对比实验</p><p>CSR / SSR / SSG</p></div>
  </footer>
`;
