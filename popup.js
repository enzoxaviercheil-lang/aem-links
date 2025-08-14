// Região fixa "us"
const REGION = "us";

// Helpers DOM
const $ = (sel) => document.querySelector(sel);
const setLink = (id, url) => {
  const a = $(`#${id}`);
  const meta = $(`#meta-${id}`);
  if (!a) return;

  if (url) {
    a.classList.remove("disabled");
    a.setAttribute("href", url);
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener");
    if (meta) meta.textContent = url;
  } else {
    a.classList.add("disabled");
    a.removeAttribute("href");
    if (meta) meta.textContent = "(indisponível para esta URL)";
  }
};

function showToast(msg = "Copiado!") {
  const el = $("#toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1200);
}

// Normaliza o pathname do site
function normalizePath(pathname) {
  let p = pathname || "/";
  p = p.split("#")[0].split("?")[0];
  p = p.replace(/\/index\.html$/i, "");
  p = p.replace(/\.html$/i, "");
  p = p.replace(/\/{2,}/g, "/");
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  if (!p.startsWith("/")) p = "/" + p;
  return p;
}

// Remove prefixos CMS (evita duplicar /content/samsung)
function stripCmsPrefixes(p) {
  let out = p
    .replace(/^\/content\/samsung(?=\/|$)/i, "")
    .replace(/^\/content\/dam\/samsung(?=\/|$)/i, "");
  if (!out) out = "/";
  if (!out.startsWith("/")) out = "/" + out;
  return out;
}

// Extrai sigla do país [/xx...]
function getCountryFromPath(path) {
  const m = path.match(/^\/([a-z]{2})(?:\/|$)/i);
  return m ? m[1].toLowerCase() : null;
}

// Monta e popula tudo
function populateLinksFor(urlStr) {
  $("#current-url").textContent = urlStr || "(sem URL da aba)";

  if (!urlStr || !urlStr.includes("samsung.com")) {
    // Fora do domínio
    setLink("author", null);
    setLink("preview", null);
    setLink("assets", null);
    setLink("preQa", null);
    setLink("qa", null);
    setLink("live", null);
    setLink("directory", null);
    $("#country-badge").textContent = "";
    return;
  }

  let urlObj;
  try { urlObj = new URL(urlStr); } catch {
    // URL inválida
    setLink("author", null);
    setLink("preview", null);
    setLink("assets", null);
    setLink("preQa", null);
    setLink("qa", null);
    setLink("live", null);
    setLink("directory", null);
    $("#country-badge").textContent = "";
    return;
  }

  const pathRaw = normalizePath(urlObj.pathname);      // ex.: "/br" ou "/br/smartphones/galaxy-a36/buy"
  const cleanPath = stripCmsPrefixes(pathRaw);         // garante que não tem /content/samsung no começo
  const country = getCountryFromPath(cleanPath);       // "br" | null

  // Author/Preview usam .html e o mesmo path limpo (se /br → /br.html)
  const authorPreviewPathHtml = `${cleanPath}.html`;

  // LINKS
  const author = `https://p6-${REGION}-author.samsung.com/editor.html/content/samsung${authorPreviewPathHtml}`;
  const preview = `https://p6-${REGION}-author.samsung.com/content/samsung${authorPreviewPathHtml}?wcmmode=disabled`;
  const assets = country
    ? `https://p6-${REGION}-author.samsung.com/assets.html/content/dam/samsung/${country}`
    : `https://p6-${REGION}-author.samsung.com/assets.html/content/dam/samsung`;
  const preQa = `https://p6-pre-qa.samsung.com${cleanPath}`;
  const qa = `https://p6-qa.samsung.com${cleanPath}`;
  const live = `https://www.samsung.com${cleanPath}`;
  const directory = `https://p6-${REGION}-author.samsung.com/sites.html/content/samsung${cleanPath}`;

  // Preenche
  setLink("author", author);
  setLink("preview", preview);
  setLink("assets", assets);
  setLink("preQa", preQa);
  setLink("qa", qa);
  setLink("live", live);
  setLink("directory", directory);

  // Badge do país
  $("#country-badge").textContent = country ? country.toUpperCase() : "";
}

// Copy handlers
document.addEventListener("click", (ev) => {
  const btn = ev.target.closest(".copy-btn");
  if (!btn) return;
  const key = btn.getAttribute("data-copy");
  const a = document.getElementById(key);
  const href = a?.getAttribute("href");
  if (!href) return;
  navigator.clipboard.writeText(href).then(() => showToast("Copiado!"));
});

// Carrega a aba ativa e popula
try {
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
    const urlStr = tabs?.[0]?.url || "";
    populateLinksFor(urlStr);
  });
} catch {
  // Ambiente sem chrome.* (ex: abrir popup.html direto)
  populateLinksFor(location.href);
}
