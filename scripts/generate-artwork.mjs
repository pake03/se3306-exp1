import { mkdir, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(root, "shared", "generated");
const sourceFile = path.join(sourceDir, "rendering-workflow.webp");
const styleFile = path.join(root, "shared", "style.css");

const svg = `
<svg width="1200" height="900" viewBox="0 0 1200 900" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="900" fill="#edf2ef"/>
  <rect x="72" y="72" width="1056" height="756" rx="28" fill="#ffffff" stroke="#cad7d0" stroke-width="3"/>
  <text x="126" y="154" fill="#17201c" font-family="Arial, Microsoft YaHei, sans-serif" font-size="38" font-weight="700">Rendering pipeline</text>
  <text x="126" y="200" fill="#69766f" font-family="Arial, Microsoft YaHei, sans-serif" font-size="22">同一份内容，不同的 HTML 生成时机</text>
  <line x1="250" y1="350" x2="950" y2="350" stroke="#9bb3a8" stroke-width="6" stroke-linecap="round"/>
  <circle cx="250" cy="350" r="66" fill="#156b52"/>
  <circle cx="600" cy="350" r="66" fill="#e4a340"/>
  <circle cx="950" cy="350" r="66" fill="#315b78"/>
  <text x="250" y="362" fill="#ffffff" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700">CSR</text>
  <text x="600" y="362" fill="#18201d" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700">SSR</text>
  <text x="950" y="362" fill="#ffffff" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700">SSG</text>
  <text x="250" y="470" fill="#17201c" text-anchor="middle" font-family="Arial, Microsoft YaHei, sans-serif" font-size="25" font-weight="700">浏览器生成</text>
  <text x="600" y="470" fill="#17201c" text-anchor="middle" font-family="Arial, Microsoft YaHei, sans-serif" font-size="25" font-weight="700">请求时生成</text>
  <text x="950" y="470" fill="#17201c" text-anchor="middle" font-family="Arial, Microsoft YaHei, sans-serif" font-size="25" font-weight="700">构建时生成</text>
  <rect x="150" y="550" width="900" height="150" rx="18" fill="#f7f9f7" stroke="#d3ddd7" stroke-width="2"/>
  <text x="205" y="615" fill="#69766f" font-family="Consolas, monospace" font-size="24">DATA</text>
  <text x="410" y="615" fill="#69766f" font-family="Consolas, monospace" font-size="24">+</text>
  <text x="505" y="615" fill="#69766f" font-family="Consolas, monospace" font-size="24">TEMPLATE</text>
  <text x="765" y="615" fill="#69766f" font-family="Consolas, monospace" font-size="24">→</text>
  <text x="845" y="615" fill="#156b52" font-family="Consolas, monospace" font-size="24" font-weight="700">HTML</text>
  <text x="600" y="665" fill="#87918c" text-anchor="middle" font-family="Arial, Microsoft YaHei, sans-serif" font-size="20">变化的是生成位置与生成时间，不变的是最终交付给用户的体验目标</text>
</svg>`;

await mkdir(sourceDir, { recursive: true });
await sharp(Buffer.from(svg)).resize(1200, 900).webp({ quality: 86 }).toFile(sourceFile);

for (const app of ["lab1-csr", "lab1-ssr", "lab1-ssg"]) {
  const targetDir = path.join(root, app, "public", "images");
  await mkdir(targetDir, { recursive: true });
  await copyFile(sourceFile, path.join(targetDir, "rendering-workflow.webp"));
  await copyFile(styleFile, path.join(root, app, "public", "style.css"));
}

console.log("WebP 图解已生成并同步到三个项目。 ");
