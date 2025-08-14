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

// Normaliza path removendo lixo do CMS
function normalizeAndCleanPath(pathname) {
  let p = pathname || "/";
  p = p.split("#")[0].split("?")[0];

  // remove prefixos do AEM
  p = p.replace(/^\/?(editor(?:\.html)?|assets\.html|sites\.html)\//i, "/");
  p = p.replace(/^\/?content\/samsung/i, "");
  p = p.replace(/^\/?content\/dam\/samsung/i, "");

  // remove .html e index.html
  p = p.replace(/\/index\.html$/i, "");
  p = p.replace(/\.html$/i, "");

  // limpa barras duplas
  p = p.replace(/\/{2,}/g, "/");

  // remove barra final se não for só "/"
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);

  if (!p.startsWith("/")) p = "/" + p;
  return p;
}

// Extrai país
function getCountryFromPath(path) {
  const m = path.match(/^\/([a-z]{2})(?:\/|$)/i);
  return m ? m[1].toLowerCase() : null;
}

// Monta e popula tudo
function populateLinksFor(urlStr) {
  $("#current-url").textContent = urlStr || "(sem URL da aba)";

  if (!urlStr || !urlStr.includes("samsung.com")) {
    ["author", "preview", "assets", "preQa", "qa", "live", "directory"]
      .forEach((id) => setLink(id, null));
    $("#country-badge").textContent = "";
    return;
  }

  let urlObj;
  try {
    urlObj = new URL(urlStr);
  } catch {
    return;
  }

  const cleanPath = normalizeAndCleanPath(urlObj.pathname);
  const country = getCountryFromPath(cleanPath);
  const authorPreviewPathHtml = `${cleanPath}.html`;
  const pathWithSlash = cleanPath === "/" ? "/" : `${cleanPath}/`;

  // LINKS no padrão original
  const author = `https://p6-${REGION}-author.samsung.com/editor.html/content/samsung${authorPreviewPathHtml}`;
  const preview = `https://p6-${REGION}-author.samsung.com/content/samsung${authorPreviewPathHtml}?wcmmode=disabled`;
  const assets = country
    ? `https://p6-${REGION}-author.samsung.com/assets.html/content/dam/samsung/${country}`
    : `https://p6-${REGION}-author.samsung.com/assets.html/content/dam/samsung`;
  const preQa = `https://p6-pre-qa.samsung.com${pathWithSlash}`;
  const qa = `https://p6-qa.samsung.com${pathWithSlash}`;
  const live = `https://www.samsung.com${pathWithSlash}`;
  const directory = `https://p6-${REGION}-author.samsung.com/sites.html/content/samsung${cleanPath}`;

  // Preenche
  setLink("author", author);
  setLink("preview", preview);
  setLink("assets", assets);
  setLink("preQa", preQa);
  setLink("qa", qa);
  setLink("live", live);
  setLink("directory", directory);

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
    populateLinksFor(tabs?.[0]?.url || "");
  });
} catch {
  populateLinksFor(location.href);
}
