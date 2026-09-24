import { posts } from "./content.js";

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const articleMarkup = posts.map((post) => `
  <article><h2>${escapeHtml(post.title)}</h2><p>${escapeHtml(post.body)}</p></article>
`).join("");

document.querySelector("#app").innerHTML = `<h1>文章列表</h1>${articleMarkup}`;
