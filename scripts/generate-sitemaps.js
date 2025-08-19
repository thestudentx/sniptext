#!/usr/bin/env node
/**
 * SnipText sitemap generator
 * - Builds /sitemaps/sitemap-blog.xml, /sitemaps/sitemap-tools.xml, /sitemaps/sitemap-pages.xml
 * - Builds root /sitemap.xml as an index
 * - Uses Git commit time (%cI) for <lastmod>, falls back to fs mtime
 * - Node >= 16, no external deps
 */

const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const { execFile } = require("child_process");

const SITE = "https://checkai.pro";         // your domain
const OUT_DIR = path.join(process.cwd(), "sitemaps");
const BLOG_DIR = path.join(process.cwd(), "blog");
const TOOLS_DIR = path.join(process.cwd(), "tools");

// Directories never crawled into for any sitemap
const GLOBAL_EXCLUDE_DIRS = new Set([
  "admin",
  "server",
  "components",
  "css",
  "js",
  "images",
  "sitemaps",
  "node_modules",
  ".git",
]);

// HTML files at repo root to exclude (auth, dashboards, etc.)
const ROOT_EXCLUDE_FILES = new Set([
  "dashboard.html",
  "login.html",
  "register.html",
]);

// Changefreq/priority defaults per bucket
const DEFAULTS = {
  blog:   { changefreq: "monthly", priority: 0.84 },
  tools:  { changefreq: "weekly",  priority: 0.90 },
  pages:  { changefreq: "monthly", priority: 0.70 },
};

// Per-URL overrides (exact path after domain)
const OVERRIDES = new Map([
  ["/index.html",                         { changefreq: "daily",  priority: 1.00 }],
  ["/tools/free-tools.html",              { changefreq: "weekly", priority: 0.85 }],
  ["/blog/blog.html",                     { changefreq: "daily",  priority: 0.90 }],
]);

// Small helpers
const posixify = (p) => p.split(path.sep).join(path.posix.sep);
const isHtml = (p) => p.toLowerCase().endsWith(".html");
const xmlEscape = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

// Run git log for last commit ISO timestamp
function gitLastMod(absPath) {
  return new Promise((resolve) => {
    execFile(
      "git",
      ["log", "-1", "--format=%cI", "--", absPath],
      { cwd: process.cwd() },
      (err, stdout) => {
        if (err) return resolve(null);
        const ts = (stdout || "").trim();
        resolve(ts || null);
      }
    );
  });
}

// Fallback: fs mtime to ISO with timezone Z
async function fsLastMod(absPath) {
  try {
    const st = await fsp.stat(absPath);
    return new Date(st.mtimeMs).toISOString();
  } catch {
    return null;
  }
}

// Recursively walk a directory, returning absolute file paths
async function walkDir(absDir, filter = () => true) {
  const out = [];
  const items = await fsp.readdir(absDir, { withFileTypes: true });
  for (const d of items) {
    const abs = path.join(absDir, d.name);
    if (d.isDirectory()) {
      const base = path.basename(abs);
      if (GLOBAL_EXCLUDE_DIRS.has(base)) continue;
      out.push(...(await walkDir(abs, filter)));
    } else if (d.isFile()) {
      if (filter(abs)) out.push(abs);
    }
  }
  return out;
}

// Build absolute URL from absolute path
function toUrl(absPath) {
  // path relative to repo root
  const rel = posixify(path.relative(process.cwd(), absPath));
  // Always prefix with a slash
  const route = "/" + rel;
  // Encode URI for safety, but keep slashes
  const encoded = encodeURI(route);
  return SITE + encoded;
}

// Pick changefreq/priority for a URL
function tuningFor(url, bucket) {
  const u = url.replace(SITE, "");
  if (OVERRIDES.has(u)) return OVERRIDES.get(u);

  const d = DEFAULTS[bucket] || { changefreq: "monthly", priority: 0.7 };
  // Heuristics: bump priorities for specific areas
  if (bucket === "tools" && /\/tools\/.+\.html$/i.test(u)) {
    return { changefreq: d.changefreq, priority: Math.max(d.priority, 0.88) };
  }
  if (bucket === "blog" && /\/blog\/.+\.html$/i.test(u)) {
    return { changefreq: d.changefreq, priority: Math.max(d.priority, 0.84) };
  }
  return d;
}

// Build <url> node
function urlXml({ loc, lastmod, changefreq, priority }) {
  return [
    "  <url>",
    `    <loc>${xmlEscape(loc)}</loc>`,
    lastmod ? `    <lastmod>${xmlEscape(lastmod)}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority != null ? `    <priority>${priority.toFixed(2)}</priority>` : null,
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
}

// Write a urlset file
async function writeUrlset(outFile, urls) {
  urls.sort((a, b) => a.loc.localeCompare(b.loc));
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(urlXml).join("\n") +
    `\n</urlset>\n`;
  await fsp.mkdir(path.dirname(outFile), { recursive: true });
  await fsp.writeFile(outFile, xml, "utf8");
  return xml;
}

// Write the root sitemap index
async function writeIndex(children) {
  // children: [{ loc, lastmod }]
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    children
      .map(
        (c) =>
          [
            "  <sitemap>",
            `    <loc>${xmlEscape(c.loc)}</loc>`,
            c.lastmod ? `    <lastmod>${xmlEscape(c.lastmod)}</lastmod>` : null,
            "  </sitemap>",
          ]
            .filter(Boolean)
            .join("\n")
      )
      .join("\n") +
    `\n</sitemapindex>\n`;
  await fsp.writeFile(path.join(process.cwd(), "sitemap.xml"), xml, "utf8");
  return xml;
}

// Collect HTML files for each bucket
async function collectFiles() {
  // Blog: any .html under /blog
  const blogFiles = (await walkDir(BLOG_DIR, isHtml)).filter(Boolean);

  // Tools: any .html under /tools
  const toolsFiles = (await walkDir(TOOLS_DIR, isHtml)).filter(Boolean);

  // Pages: .html at repo root (and allowed subfolders) excluding blog/tools/admin/server/components/css/js/images/sitemaps
  const pages = [];
  const top = await fsp.readdir(process.cwd(), { withFileTypes: true });
  for (const d of top) {
    if (d.isDirectory()) {
      // only look at top-level dirs that are not excluded and not blog/tools
      if (
        ["blog", "tools"].includes(d.name) ||
        GLOBAL_EXCLUDE_DIRS.has(d.name)
      ) {
        continue;
      }
      // we don’t recurse into other sections for pages; root pages are typically at top level
      continue;
    }
    if (d.isFile() && isHtml(d.name) && !ROOT_EXCLUDE_FILES.has(d.name)) {
      pages.push(path.join(process.cwd(), d.name));
    }
  }

  return { blogFiles, toolsFiles, pages };
}

// Get lastmod for a file with git fallback
async function resolveLastMod(absPath) {
  const gitTs = await gitLastMod(absPath);
  if (gitTs) return gitTs;
  const fsTs = await fsLastMod(absPath);
  return fsTs || null;
}

async function buildBucket(files, bucket) {
  const out = [];
  for (const abs of files) {
    const loc = toUrl(abs);
    const lastmod = await resolveLastMod(abs);
    const { changefreq, priority } = tuningFor(loc, bucket);
    out.push({ loc, lastmod, changefreq, priority });
  }
  return out;
}

async function main() {
  const { blogFiles, toolsFiles, pages } = await collectFiles();

  const [blogUrls, toolsUrls, pagesUrls] = await Promise.all([
    buildBucket(blogFiles, "blog"),
    buildBucket(toolsFiles, "tools"),
    buildBucket(pages, "pages"),
  ]);

  // Write child sitemaps
  const blogXml = await writeUrlset(path.join(OUT_DIR, "sitemap-blog.xml"), blogUrls);
  const toolsXml = await writeUrlset(path.join(OUT_DIR, "sitemap-tools.xml"), toolsUrls);
  const pagesXml = await writeUrlset(path.join(OUT_DIR, "sitemap-pages.xml"), pagesUrls);

  // Compute lastmod for each child file as the max lastmod inside it
  function maxLastmod(urls) {
    const times = urls.map((u) => Date.parse(u.lastmod)).filter((n) => !Number.isNaN(n));
    if (!times.length) return null;
    const max = new Date(Math.max(...times));
    return max.toISOString(); // sitemap index accepts ISO; timezone is fine as Z
  }

  const indexChildren = [
    { loc: `${SITE}/sitemaps/sitemap-pages.xml`, lastmod: maxLastmod(pagesUrls) },
    { loc: `${SITE}/sitemaps/sitemap-tools.xml`, lastmod: maxLastmod(toolsUrls) },
    { loc: `${SITE}/sitemaps/sitemap-blog.xml`,  lastmod: maxLastmod(blogUrls) },
  ];
  await writeIndex(indexChildren);

  // Console summary
  const c = (x) => x.toString().padStart(4, " ");
  console.log("Sitemaps written:");
  console.log(" - /sitemaps/sitemap-pages.xml   urls:", c(pagesUrls.length));
  console.log(" - /sitemaps/sitemap-tools.xml   urls:", c(toolsUrls.length));
  console.log(" - /sitemaps/sitemap-blog.xml    urls:", c(blogUrls.length));
  console.log(" - /sitemap.xml (index)          children:   3");
}

main().catch((err) => {
  console.error("Failed to generate sitemaps:", err);
  process.exit(1);
});
